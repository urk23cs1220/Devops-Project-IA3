# DevOps-Driven Automation and Kubernetes Orchestration of the AgroLink Platform

## 1. Project Abstract
The objective of this project was to modernize a monolithic MERN-stack application ("AgroLink") by migrating its architecture to a cloud-native, microservices-oriented environment. We implemented a complete End-to-End DevOps lifecycle, transitioning the database to Supabase (PostgreSQL), containerizing the application with Docker, orchestrating the deployment on Kubernetes, and fully automating the delivery process using a robust GitHub Actions CI/CD pipeline.

---

## 2. Live Demo Guide: How to Show All Outputs

Follow these exact steps during your evaluation to demonstrate your project outputs:

### Step 1: Prove the Application is Running Live
**Terminal Command:**
```powershell
minikube service frontend -n agrolink-prod
```
**What to say:** *"Our application is currently deployed and running inside the `agrolink-prod` namespace on our Kubernetes cluster. This command exposes our frontend service so users can interact with the live platform."*

### Step 2: Show the Kubernetes Dashboard (UI)
**Terminal Command:**
```powershell
minikube dashboard
```
**What to say:** *"Instead of managing pods purely via the CLI, we can use the Kubernetes dashboard. Selecting our `agrolink-prod` namespace here proves that our isolated backend and frontend deployments are running successfully and are highly available."*

### Step 3: Show the Automated CI/CD Pipeline
**Action:** Open your repository on GitHub -> Click the **Actions** tab -> Click on your latest successful run.
**What to say:** *"We are using GitHub Actions for Continuous Integration and Continuous Deployment. On every code push, our pipeline automatically runs 6 stages: Linting, Automated Testing (Jest), Docker Image Building, Security Scanning (Trivy), and finally deploying the new manifests to our cluster. This represents true DevOps automation."*

### Step 4: Show the Infrastructure as Code (Terraform & Ansible)
**Action:** Open VS Code and show the `terraform/main.tf` and `ansible/deploy-k8s.yml` files.
**What to say:** *"To eliminate manual configuration drift, we utilized Terraform to declare our infrastructure state (like ConfigMaps) as code. Meanwhile, our Ansible playbook acts as our configuration management tool, designed to deploy our Kubernetes manifests automatically."*

### Step 5: Show the Live Monitoring (Prometheus & Grafana)
**Terminal Command:**
```powershell
kubectl port-forward -n agrolink-monitoring svc/grafana 3001:3000
```
**Action:** Go to `http://localhost:3001` in your browser.
**What to say:** *"An essential part of DevOps is Observability. We deployed Prometheus to scrape system metrics and Grafana to visualize them. This dashboard allows us to monitor our cluster's health, CPU utilization, and system uptime in real time."*

---

## 3. Project Architecture & Technological Stack

### Core Technologies
* **Frontend:** React, Vite, TailwindCSS
* **Backend:** Node.js, Express.js
* **Database:** Supabase (PostgreSQL) - Migrated from MongoDB
* **Testing:** Jest, Supertest

### DevOps & Cloud Technologies
* **Containerization:** Docker (Multi-stage builds for optimized image sizes)
* **Container Registry:** Docker Hub
* **Orchestration:** Kubernetes (Minikube)
* **CI/CD Pipeline:** GitHub Actions
* **Security Scanning:** Trivy (CVE Vulnerability scanning)
* **Infrastructure as Code (IaC):** Terraform
* **Configuration Management:** Ansible
* **Monitoring & Observability:** Prometheus, Grafana

---

## 4. The CI/CD Pipeline Details
We built a professional 6-stage automated pipeline that triggers on every code push to the `main` branch:
1. **Lint Phase:** Automates syntax and code-styling checks using ESLint.
2. **Test Phase:** Acts as a quality gate by running automated API test suites using Jest to ensure no broken code is deployed.
3. **Build & Push Phase:** Compiles source code into lightweight Docker images and securely pushes them to Docker Hub using encrypted secrets.
4. **Security Scan (DevSecOps):** Automatically scans the generated Docker images using Trivy to detect and block high-level security vulnerabilities (CVEs).
5. **Continuous Deployment (Staging/Prod):** Connects securely to the Kubernetes cluster and automatically applies new deployment manifests, rolling out the updated software with zero downtime.

---

## 5. Kubernetes Orchestration Details
The application is resilient and highly available, running inside a local Kubernetes cluster utilizing the following configurations:
* **Deployments:** Decoupled `frontend` and `backend` component microservices.
* **Services:** Both exposed internally and externally using `NodePort` mapping.
* **ConfigMaps & Secrets:** Environment variables are securely separated from the source code.
* **Horizontal Pod Autoscaling (HPA):** The backend is configured to automatically scale up replica pods if CPU usage exceeds 50%.
* **Self-Healing:** Kubernetes continuously monitors backend `/api/test` health checks and automatically restarts failed containers.
