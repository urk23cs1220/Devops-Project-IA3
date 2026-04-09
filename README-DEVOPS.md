# AgroLink DevOps Pipeline Guide

This document outlines the DevOps setup for your project: "DevOps-Based Automation of AgroLink Web Application on Kubernetes Platform."

## Updated Architecture (Supabase & Docker Hub)

The project has been migrated from MongoDB to **Supabase**. The CI/CD pipeline now uses **Docker Hub** as the image registry and deploys to a local Kubernetes (Minikube) cluster using GitHub Actions.

## Folder Structure

```
agrolink/
├── client/
│   ├── Dockerfile             (Frontend container spec)
│   └── nginx.conf             (React-router configuration)
├── server/
│   ├── Dockerfile             (Backend container spec)
├── k8s/
│   ├── backend.yaml           (Node.js deployment + service)
│   ├── frontend.yaml          (React/Nginx deployment + service)
│   └── secrets-template.yaml  (Reference for K8s secrets)
├── .github/
│   └── workflows/
│       └── deploy.yml         (CI/CD Pipeline with Docker Hub push)
├── ansible/
│   └── deploy-k8s.yml         (Automated K8s deployment playbook)
├── terraform/
│   └── main.tf                (Infra-as-Code for Namespace)
└── docker-compose.yml         (Local development environment)
```

## Setup Requirements

### 1. GitHub Secrets
To make the CI/CD pipeline work, you **MUST** add the following secrets to your GitHub Repository (`Settings > Secrets and variables > Actions`):

| Secret Name | Description |
| ----------- | ----------- |
| `DOCKER_HUB_USERNAME` | Your Docker Hub ID |
| `DOCKER_HUB_TOKEN` | Your Docker Hub Access Token or Password |
| `SUPABASE_URL` | Your Supabase Project URL |
| `SUPABASE_KEY` | Your Supabase Service Role Key (or Anon Key) |
| `JWT_SECRET` | Secret key for JWT authentication |

---

## Step-by-Step Execution

### 1. Local Development (Docker Compose)
Verify everything works locally before pushing to GitHub.
```bash
# Build and start services
docker-compose up --build -d

# Access app at http://localhost:3000
```

### 2. Infrastructure as Code (Terraform)
Provision the `agrolink-prod` namespace in Minikube.
```bash
cd terraform
terraform init
terraform apply -auto-approve
```

### 3. Automated Kubernetes Deployment (Ansible)
If you want to deploy manually using Ansible:
```bash
# Ensure your manifests have your Docker Hub username substituted or use a local one
cd ansible
ansible-playbook deploy-k8s.yml
```

### 4. CI/CD Pipeline (GitHub Actions)
Every `push` to the `main` branch will:
1.  Log in to **Docker Hub**.
2.  Build and push `agrolink-backend` and `agrolink-frontend` images.
3.  Start **Minikube** in the GitHub runner.
4.  Inject secrets and deploy to the cluster in the `agrolink-prod` namespace.

---

## Verification Commands

Check your cluster status:
```bash
# Check pods (Namespace: agrolink-prod)
kubectl get pods -n agrolink-prod

# Check services
kubectl get svc -n agrolink-prod

# Access the app via Minikube
minikube service frontend -n agrolink-prod
```
