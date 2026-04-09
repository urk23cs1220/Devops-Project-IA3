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

# Example: Automating the creation of a namespace for AgroLink
resource "kubernetes_namespace" "agrolink_namespace" {
  metadata {
    name = "agrolink-prod"
    labels = {
      environment = "production"
      app         = "agrolink"
    }
  }
}

# You could also automate the deployment of the pods via Terraform,
# but using `kubectl apply` via Ansible/CI is standard for application code.
# This Terraform file sets up the foundational infrastructure.
