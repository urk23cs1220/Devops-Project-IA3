# AgroLink: DevOps-Automated Farm-to-Table Platform
## Comprehensive Project Report (DevOps Edition)

### 1. Project Overview
Agro-Link is a modern e-commerce platform designed to connect local farmers directly with consumers. This version of the project focuses on **DevOps-based automation** and **AI-enhanced insights**, ensuring the platform is not only automated but also smart enough to help farmers make data-driven decisions.

### 2. Technical Architecture (Cloud-Native)

#### 2.1 Technology Stack
- **Frontend**: React.js (Vite) + Nginx (Reverse Proxy)
- **Backend**: Node.js (Express)
- **AI Feature**: Heuristic Crop Price Predictor (Integrated with Farmer Dashboard)
- **Database**: **Supabase (PostgreSQL)** - Migrated from MongoDB.
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Kubernetes (Minikube)
- **CI/CD**: GitHub Actions
- **Infrastructure as Code (IaC)**: Terraform & Ansible

#### 2.2 DevOps Integration
- **Docker**: Multi-stage Dockerfiles for optimized production images.
- **Kubernetes**: Managed deployments with `Namespace` isolation and `NodePort` services.
- **Reverse Proxy**: Nginx configured as an API gateway within the frontend container.
- **Registry**: Docker Hub integration for automated versioning.

### 3. Key DevOps & AI Features

#### 3.1 AI Crop Price Predictor (NEW)
- **Smart Insights**: Farmers can enter a crop type to receive a predicted market price range.
- **Data-Driven**: Uses seasonality factors, base prices, and market volatility scores to simulate AI predictions.
- **Visual Analytics**: Provides a 3-month forecast and "Pro Tips" for maximizing profit.

#### 3.2 GitHub Actions CI/CD Pipeline
- **Auto-Build**: Triggers on every push to the `main` branch.
- **Registry Push**: Automatically builds and pushes production-ready images to Docker Hub.
- **Automated Deploy**: Dynamically injects secrets and deploys the latest images to the Kubernetes cluster.

#### 3.3 Infrastructure as Code (IaC)
- **Terraform**: Automates the creation of the `agrolink-prod` Kubernetes namespace.
- **Ansible**: Provides a playbook for rapid local verification and configuration.

#### 3.4 Security & Secret Management
- **Kubernetes Secrets**: Manages Supabase Keys and JWT Secrets securely within the cluster.

### 4. Database Schema (Supabase/PostgreSQL)
The application has been refactored to use a relational schema in Supabase:
- **Users**: UUID-based authentication with role-based access.
- **Products**: Detailed agricultural product tracking with JSONB support for images and locations.
- **Orders**: Relational linking between consumers and farmers with status tracking.

### 5. API Endpoints (Restructured)
The backend routes remain RESTful but are now optimized for a containerized environment, using environment variables for all cross-service communication.

### 6. Project Structure (DevOps Organized)
```
agrolink/
├── client/                 # Frontend (Dockerfile included)
├── server/                 # Backend (Dockerfile included)
├── k8s/                    # Kubernetes Deployment Manifests
├── terraform/              # Infrastructure-as-Code (Namespace automation)
├── ansible/                # Automated Playbooks
└── .github/workflows/      # CI/CD Pipeline Configuration
```

### 7. Performance & Scalability
- **Elastic Scaling**: Managed by Kubernetes replicas.
- **Static Content**: Served via Nginx in the frontend container.
- **Global Availability**: Provided by the Supabase cloud backend.

### 8. Conclusion
The AgroLink project successfully demonstrates a complete transition from a local MERN stack to a sophisticated, **DevOps-automated** cloud-native application. By utilizing Docker, Kubernetes, and GitHub Actions, the platform is now ready for high-scale, reliable deployment.
