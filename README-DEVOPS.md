# AgroLink DevOps Pipeline Guide

This document outlines the DevOps setup for your academic assignment: "DevOps-Based Automation of AgroLink Web Application on Kubernetes Platform."

## Folder Structure

Based on your actual code repository (`client` and `server`), the new DevOps folder structure integrated into your project looks like this:

```
agrolink/
├── client/
│   ├── src/, public/, package.json, vite.config.js
│   ├── Dockerfile             (Frontend container spec)
│   ├── .dockerignore          (Ignore node_modules)
│   └── nginx.conf             (React-router configuration)
├── server/
│   ├── models/, routes/, server.js, package.json
│   ├── Dockerfile             (Backend container spec)
│   └── .dockerignore          (Ignore node_modules)
├── k8s/
│   ├── mongo.yaml             (MongoDB deployment + service)
│   ├── backend.yaml           (Node.js deployment + service)
│   └── frontend.yaml          (React/Nginx deployment + service)
├── .github/
│   └── workflows/
│       └── deploy.yml         (CI/CD Pipeline with GitHub Actions)
├── ansible/
│   └── deploy-k8s.yml         (Automated K8s deployment playbook)
├── terraform/
│   └── main.tf                (Basic dummy K8s infrastructure setup)
└── docker-compose.yml         (Run entirely locally via Docker Compose)
```

## How Services Communicate

1. **Frontend to Backend**: The Vite React app (`frontend`) communicates with the backend via the `VITE_API_URL` environment variable. When deployed to Kubernetes, it connects using the Minikube IP and backend NodePort, or via a Reverse Proxy if configured. Locally with `docker-compose`, it connects port `3000 -> 7000`.
2. **Backend to MongoDB**: The `backend` uses Mongoose to connect to MongoDB using the `MONGODB_URI` environment variable. In Kubernetes (and Docker Compose), it connects using the Service DNS name (`mongodb://mongodb:27017/agrolink`).
3. **MongoDB**: The official `mongo:latest` image runs on port 27017 and is only exposed internally to the cluster so the backend can securely talk to it.

---

## Step-by-Step Execution Commands

### Prerequisites
Make sure you have installed on your laptop:
- Docker Desktop
- Minikube
- kubectl

### 1. Running with Docker Compose (Local Testing)
This step is useful to verify that the containerized applications work before throwing Kubernetes into the mix.

```bash
# Navigate to the project root
cd "d:\devops agrolink\agrolink"

# Build and start all services
docker-compose up --build -d

# Verify containers are running
docker ps

# You can access the app at http://localhost:3000
```
To stop the services:
```bash
docker-compose down
```

---

### 2. Running the Kubernetes Pipeline (Minikube)

#### Step 2.1: Start Minikube
```bash
minikube start
```

#### Step 2.2: Build Docker Images inside Minikube
Since we are using local Kubernetes without DockerHub for this assignment, we must build the images directly inside Minikube's Docker environment.

```bash
# Point your shell to use Minikube's Docker daemon
# On Windows PowerShell:
minikube docker-env | Invoke-Expression

# Build Backend Image
docker build -t agrolink-backend:latest ./server

# Build Frontend Image
docker build -t agrolink-frontend:latest ./client
```

#### Step 2.3: Deploy using `kubectl` manually (Alternative 1)
```bash
kubectl apply -f k8s/mongo.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
```

#### Step 2.4: Deploy using Ansible (Alternative 2 - Required for marks)
If you have Ansible installed (typically through WSL on Windows):
```bash
cd ansible
ansible-playbook deploy-k8s.yml
```

---

### 3. Verification Commands

Run these to verify that your cluster is healthy:

```bash
# Check if pods are running (You should see 1 mongo, 2 backend, 2 frontend)
kubectl get pods

# Check if services are correctly hooked up
kubectl get services
```

> [!TIP]
> **To access the Frontend on Minikube:**
> Since the frontend is a `NodePort` service (port 30000), you can request Minikube to open it automatically in your browser:
> ```bash
> minikube service frontend
> ```

---

### 4. Terraform Setup (Optional Basic Infra)
To demonstrate basic Infrastructure-as-Code for an assignment, you can provision a Kubernetes Namespace using Terraform.

```bash
cd terraform
# Initialize Terraform provider
terraform init

# Plan and view changes
terraform plan

# Apply changes (creates 'agrolink-prod' namespace)
terraform apply -auto-approve

# Verify it was created
kubectl get namespaces
```
