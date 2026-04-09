# AgroLink: DevOps-Automated Farm-to-Table Platform
## Comprehensive Project Report (DevOps Edition)

### 1. Project Overview
Agro-Link is a modern e-commerce platform designed to connect local farmers directly with consumers. This version of the project focuses on **DevOps-based automation**, ensuring the application is containerized, orchestrated, and deployed via a fully automated CI/CD pipeline.

### 2. Technical Architecture (Cloud-Native)

#### 2.1 Technology Stack
- **Frontend**: React.js (Vite) + Nginx (Containerized)
- **Backend**: Node.js (Express) (Containerized)
- **Database**: **Supabase (PostgreSQL)** - Migrated from MongoDB for better relational data handling and cloud scalability.
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Kubernetes (Minikube)
- **CI/CD**: GitHub Actions
- **Infrastructure as Code (IaC)**: Terraform & Ansible

#### 2.2 DevOps Integration
- **Docker**: Customized Dockerfiles for both frontend and backend to minimize image size and maximize security.
- **Kubernetes**: Defined Deployment and Service manifests (NodePort) to manage scaling and high availability.
- **Registry**: Integrated with **Docker Hub** for automated image storage and versioning.

### 3. Key DevOps Features

#### 3.1 GitHub Actions CI/CD Pipeline
- **Auto-Build**: Triggers on every push to the `main` branch.
- **registry Push**: Automatically builds and pushes production-ready images to Docker Hub.
- **Automated Deploy**: Dynamically injects secrets and deploys the latest images to the Kubernetes cluster.

#### 3.2 Infrastructure as Code (IaC)
- **Terraform**: Automates the creation of the `agrolink-prod` Kubernetes namespace for environment isolation.
- **Ansible**: Provides a playbook for rapid local verification and multinode deployment configuration.

#### 3.3 Security & Secret Management
- **Kubernetes Secrets**: All sensitive credentials (Supabase Keys, JWT Secrets) are managed via encrypted Kubernetes Secrets, never hardcoded in the source code.

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
