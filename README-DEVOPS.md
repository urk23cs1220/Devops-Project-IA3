# AgroLink DevOps Pipeline Guide

This document outlines the DevOps setup for your project: "DevOps-Based Automation of AgroLink Web Application on Kubernetes Platform."

## 🚀 Latest Updates (AI & Cloud-Native)

The project now features an **AI Crop Price Predictor** for farmers. The architecture has been enhanced with an **Nginx Reverse Proxy** in the frontend container to securely route API calls to the backend within the Kubernetes cluster.

## Folder Structure (Updated)

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

## Verification & AI Feature Test

### 🌐 Accessing the App
```bash
# Get the access URL
minikube service frontend -n agrolink-prod
```

### 🤖 Testing the AI Predictor
1.  Log in as a **Farmer**.
2.  Go to the **Dashboard** and select the **✨ AI Insights** tab.
3.  Enter a crop (e.g., "Tomato" or "Mango").
4.  The system will analyze current market data (seasonality, trends) and display a predicted price range.

### 🛠️ Troubleshooting Networking
If API calls fail, ensure the **Nginx Proxy** is active:
- Check frontend logs: `kubectl logs -l app=frontend -n agrolink-prod`
- Verify the `API_URL` is set to relative paths in the code (`''`).

---
*Last Updated: April 2026*
