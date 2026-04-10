terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.0.0"
    }
  }
}

provider "kubernetes" {
  config_path    = "~/.kube/config"
  config_context = "minikube"
}

# --- Variables ---
variable "supabase_url" {
  description = "Supabase API URL"
  type        = string
  sensitive   = true
}

variable "supabase_key" {
  description = "Supabase Anon/Service Key"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT Secret for Authentication"
  type        = string
  sensitive   = true
}

variable "docker_username" {
  description = "Docker Hub Username"
  type        = string
  default     = "deepak56006"
}

# --- Namespace ---
resource "kubernetes_namespace" "agrolink_prod" {
  metadata {
    name = "agrolink-prod"
    labels = {
      environment = "production"
      app         = "agrolink"
      managed-by  = "terraform"
    }
  }
}

# --- ConfigMap ---
resource "kubernetes_config_map" "agrolink_config" {
  metadata {
    name      = "agrolink-config"
    namespace = kubernetes_namespace.agrolink_prod.metadata[0].name
  }

  data = {
    NODE_ENV  = "production"
    PORT      = "7000"
    LOG_LEVEL = "info"
  }
}

# --- Secrets ---
resource "kubernetes_secret" "agrolink_secrets" {
  metadata {
    name      = "agrolink-secrets"
    namespace = kubernetes_namespace.agrolink_prod.metadata[0].name
  }

  type = "Opaque"

  data = {
    SUPABASE_URL = var.supabase_url
    SUPABASE_KEY = var.supabase_key
    JWT_SECRET   = var.jwt_secret
  }
}

# --- Backend Deployment ---
resource "kubernetes_deployment" "backend" {
  metadata {
    name      = "backend"
    namespace = kubernetes_namespace.agrolink_prod.metadata[0].name
  }

  spec {
    replicas = 2

    selector {
      match_labels = {
        app = "backend"
      }
    }

    template {
      metadata {
        labels = {
          app = "backend"
        }
      }

      spec {
        container {
          name  = "backend"
          image = "${var.docker_username}/agrolink-backend:latest"
          
          port {
            container_port = 7000
          }

          env_from {
            config_map_ref {
              name = kubernetes_config_map.agrolink_config.metadata[0].name
            }
          }

          env {
            name = "SUPABASE_URL"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.agrolink_secrets.metadata[0].name
                key  = "SUPABASE_URL"
              }
            }
          }

          env {
            name = "SUPABASE_KEY"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.agrolink_secrets.metadata[0].name
                key  = "SUPABASE_KEY"
              }
            }
          }

          env {
            name = "JWT_SECRET"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.agrolink_secrets.metadata[0].name
                key  = "JWT_SECRET"
              }
            }
          }

          resources {
            requests = {
              cpu    = "100m"
              memory = "128Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "512Mi"
            }
          }

          liveness_probe {
            http_get {
              path = "/api/test"
              port = 7000
            }
            initial_delay_seconds = 15
            period_seconds        = 20
          }

          readiness_probe {
            http_get {
              path = "/api/test"
              port = 7000
            }
            initial_delay_seconds = 5
            period_seconds        = 10
          }
        }
      }
    }
  }
}

# --- Backend Service ---
resource "kubernetes_service" "backend" {
  metadata {
    name      = "backend"
    namespace = kubernetes_namespace.agrolink_prod.metadata[0].name
  }

  spec {
    selector = {
      app = "backend"
    }

    port {
      port        = 7000
      target_port = 7000
    }

    type = "ClusterIP"
  }
}

# --- Frontend Deployment ---
resource "kubernetes_deployment" "frontend" {
  metadata {
    name      = "frontend"
    namespace = kubernetes_namespace.agrolink_prod.metadata[0].name
  }

  spec {
    replicas = 2

    selector {
      match_labels = {
        app = "frontend"
      }
    }

    template {
      metadata {
        labels = {
          app = "frontend"
        }
      }

      spec {
        container {
          name  = "frontend"
          image = "${var.docker_username}/agrolink-frontend:latest"

          port {
            container_port = 80
          }

          resources {
            requests = {
              cpu    = "50m"
              memory = "64Mi"
            }
            limits = {
              cpu    = "200m"
              memory = "256Mi"
            }
          }

          liveness_probe {
            http_get {
              path = "/"
              port = 80
            }
            initial_delay_seconds = 10
            period_seconds        = 20
          }
        }
      }
    }
  }
}

# --- Frontend Service ---
resource "kubernetes_service" "frontend" {
  metadata {
    name      = "frontend"
    namespace = kubernetes_namespace.agrolink_prod.metadata[0].name
  }

  spec {
    selector = {
      app = "frontend"
    }

    port {
      port        = 80
      target_port = 80
      node_port   = 30007
    }

    type = "NodePort"
  }
}

# --- Autoscaling ---
resource "kubernetes_horizontal_pod_autoscaler_v2" "backend_hpa" {
  metadata {
    name      = "backend-hpa"
    namespace = kubernetes_namespace.agrolink_prod.metadata[0].name
  }

  spec {
    max_replicas = 10
    min_replicas = 2

    scale_target_ref {
      api_version = "apps/v1"
      kind        = "Deployment"
      name        = kubernetes_deployment.backend.metadata[0].name
    }

    metric {
      type = "Resource"
      resource {
        name = "cpu"
        target {
          type               = "Utilization"
          average_utilization = 70
        }
      }
    }
  }
}
