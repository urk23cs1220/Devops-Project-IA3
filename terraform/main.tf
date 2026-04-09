terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.0.0"
    }
  }
}

# Provider configuration for local Minikube
provider "kubernetes" {
  config_path    = "~/.kube/config"
  config_context = "minikube"
}

# Automating the creation of a dedicated production namespace
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

# Output the namespace name for information
output "namespace_name" {
  value = kubernetes_namespace.agrolink_prod.metadata[0].name
}
