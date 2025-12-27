# AWS Infrastructure Provisioning Request - NDVI Calculator + Majmaah Dashboard

**Date:** [Current Date]  
**Project:** NDVI Calculator with Majmaah Dashboard Integration  
**Priority:** High

---

## Overview

**IT Team Responsibility:** Provision AWS infrastructure/services  
**Developer Responsibility:** Deploy application code and configure services

We need AWS infrastructure provisioned for a full-stack application:
- **Backend API** (Node.js/Express) - NDVI analysis + Majmaah dashboard API + User management
- **Frontend 1** - Majmaah University Dashboard (React/TypeScript)
- **Frontend 2** - NDVI Admin Dashboard (React/TypeScript)
- **Database** - PostgreSQL (currently running in Docker locally)

**Note:** Once infrastructure is provisioned, I will handle all application deployment, configuration, and code updates.

---

## Architecture Requirements

### 1. Database Layer
**Service:** Amazon RDS for PostgreSQL

**Specifications:**
- **Instance Class:** `db.t4g.small` (2 vCPU, 2 GB RAM) - ARM-based Graviton for cost efficiency
- **Engine Version:** PostgreSQL 15.x or latest stable
- **Storage:** 
  - Type: General Purpose SSD (gp3)
  - Size: 100 GB (with auto-scaling enabled)
  - IOPS: 3000 (baseline)
- **Multi-AZ:** No (for initial deployment, can enable later for HA)
- **Backup:** 
  - Retention: 7 days
  - Automated backups: Enabled
- **Security:** 
  - VPC: Private subnet only
  - Security Group: Allow inbound from EC2 security group only (port 5432)
  - Encryption at rest: Enabled

**Database Name:** `ndvi_majmaah_db`  
**Initial Setup:** We'll provide SQL migration files to run

**Future Scaling:**
- Can upgrade to db.t4g.medium (4 GB RAM) or db.m6g.large (8 GB RAM)
- Can add read replicas for heavy read workloads
- Storage can auto-scale up to 1 TB

---

### 2. Backend API
**Service Options:** Choose ONE of the following

#### Option A: EC2 Instance (Recommended - Scalable) ⭐
**Cost: ~$30-40/month (EC2) + $10-12/month (Storage)**

**Specifications:**
- **Instance Type:** `t4g.medium` (2 vCPU, **4 GB RAM**) - ARM-based Graviton
  - **Why medium instead of small:** More RAM for future image processing, GeoServer, and high-resolution satellite imagery
- **AMI:** Amazon Linux 2023 (ARM64)
- **Storage:**
  - **Root Volume:** 30 GB gp3 (OS, Docker, applications)
  - **Data Volume:** 100 GB gp3 (for satellite imagery cache, GeoServer data, future features)
- **Networking:**
  - Subnet: **Public subnet** (to avoid NAT Gateway cost)
  - Security Group: Allow inbound from ALB only (port 3000)
  - Elastic IP: Recommended (for static IP)
- **IAM Role:** 
  - Access to Secrets Manager
  - Access to CloudWatch Logs
  - Access to S3 (for satellite imagery storage)
  - Access to ECR (for Docker images)
- **Load Balancer:**
  - Type: Application Load Balancer (ALB)
  - Scheme: Internet-facing
  - Listeners: HTTP (80) → HTTPS (443) redirect
  - HTTPS: AWS Certificate Manager (ACM) certificate required
  - Target Group: Points to EC2 instance
  - Health Check: `/api/health` endpoint (we'll add this)

**Deployment:** We'll SSH into EC2 and deploy Docker containers

**Future-Ready Features:**
- ✅ 4 GB RAM for image processing workloads
- ✅ 100 GB data volume for satellite imagery cache
- ✅ Can easily upgrade to t4g.large (8 GB RAM) or t4g.xlarge (16 GB RAM)
- ✅ Can add separate EC2 instances for GeoServer or processing workers
- ✅ S3 integration ready for large imagery storage

**Pros:** 
- ✅ Scalable for future features (GeoServer, high-res imagery)
- ✅ No NAT Gateway needed (saves $35/month)
- ✅ Full control over server
- ✅ Room to grow without immediate upgrade

**Cons:**
- ⚠️ Need to manage EC2 (but minimal - just Docker)
- ⚠️ Manual deployment (can automate later)

---

#### Option B: ECS Fargate (Alternative)
**Cost: ~$50-60/month**

**Specifications:**
- **Task Definition:**
  - CPU: 1 vCPU
  - Memory: 2 GB RAM
  - Platform: Linux/ARM64 (Graviton) for cost savings
- **Service Configuration:**
  - Desired Count: 1 task (can add second later)
  - Launch Type: Fargate
  - Auto Scaling: Enabled (optional)
- **Networking:**
  - VPC: Private subnets (requires NAT Gateway - adds $35/month)
  - Security Group: Allow inbound from ALB on port 3000
- **Load Balancer:** Same as Option A
- **Container Image:**
  - Registry: Amazon ECR
  - We'll provide Dockerfile and push image to ECR

**Pros:**
- ✅ No server management
- ✅ Automatic scaling
- ✅ Easy deployments

**Cons:**
- ⚠️ More expensive (~$150-180/month total with NAT Gateway)
- ⚠️ Less control

---

**Recommendation:** Use **Option A (EC2)** for significant cost savings (~$100-130/month)

---

### 3. Frontend Applications

#### 3a. Majmaah Dashboard
**Services:** S3 + CloudFront

**Specifications:**
- **S3 Bucket:** `majmaah-dashboard-prod` (or similar naming)
  - Static website hosting: Enabled
  - Public access: Blocked (CloudFront only)
  - Versioning: Enabled
- **CloudFront Distribution:**
  - Origin: S3 bucket
  - Default root object: `index.html`
  - SSL Certificate: ACM certificate
  - Custom domain: `dashboard.yourdomain.com` (or subdomain of choice)
  - Caching: Default caching behavior
  - Error pages: 404 → `/index.html` (for React Router)

#### 3b. NDVI Admin Dashboard
**Services:** S3 + CloudFront

**Specifications:**
- **S3 Bucket:** `ndvi-admin-prod` (or similar naming)
  - Same configuration as Majmaah dashboard
- **CloudFront Distribution:**
  - Custom domain: `ndvi-admin.yourdomain.com` (or subdomain of choice)
  - Same SSL and caching settings

**Note:** Both frontends need environment variables pointing to backend API URL:
- `VITE_API_BASE_URL=https://api.yourdomain.com/api`

---

### 4. Supporting Services

**AWS Secrets Manager:**
- Store the following secrets:
  - RDS master password
  - JWT secret key
  - Google Earth Engine service account JSON
  - Mapbox access token
  - Any other API keys

**CloudWatch:**
- Log Groups for ECS tasks
- Alarms for:
  - RDS CPU utilization > 80%
  - ECS task CPU > 80%
  - ECS task memory > 85%
  - ALB 5xx errors

**Route 53 (if using custom domains):**
- DNS records for:
  - `api.yourdomain.com` → ALB
  - `dashboard.yourdomain.com` → CloudFront
  - `ndvi-admin.yourdomain.com` → CloudFront

---

## Network Architecture

**VPC Setup:**
- **Public Subnets:** 2 (for ALB, NAT Gateway)
- **Private Subnets:** 2 (for ECS tasks, RDS)
- **NAT Gateway:** 1 (for ECS tasks to access internet for GEE API)
- **Internet Gateway:** 1 (for public resources)

**Security Groups:**
- **ALB SG:** Allow HTTPS (443) from 0.0.0.0/0
- **ECS SG:** Allow inbound from ALB SG on port 3000
- **RDS SG:** Allow inbound from ECS SG on port 5432

---

## Responsibilities Breakdown

### IT Team - Infrastructure Provisioning (What You Need to Do)

**Phase 1: Core Infrastructure**
1. ✅ Create VPC with subnets (2 public, 2 private)
2. ✅ Create Internet Gateway
3. ✅ Set up route tables
4. ✅ Create security groups (ALB, EC2/ECS, RDS)
5. ⚠️ **NAT Gateway:** Only needed if using ECS Fargate in private subnet (not needed for EC2 in public subnet - saves $35/month!)

**Phase 2: Database**
1. ✅ Create RDS PostgreSQL instance (specs below)
2. ✅ Configure security group to allow ECS access
3. ✅ **Share RDS endpoint, port, database name, and master credentials** (securely)

**Phase 3: Container Registry**
1. ✅ Create ECR repositories:
   - `ndvi-backend` (for backend Docker image)
2. ✅ **Share ECR repository URLs and push commands**

**Phase 4: Secrets Management**
1. ✅ Create Secrets Manager secrets (I'll provide values):
   - `ndvi/rds/password` (RDS master password)
   - `ndvi/jwt/secret` (I'll provide value)
   - `ndvi/gee/credentials` (I'll provide JSON)
   - `ndvi/mapbox/token` (I'll provide token)
2. ✅ **Share secret ARNs**

**Phase 5: Storage & CDN**
1. ✅ Create S3 buckets:
   - `majmaah-dashboard-prod` (or your naming convention) - Frontend hosting
   - `ndvi-admin-prod` (or your naming convention) - Frontend hosting
   - **`satellite-imagery-prod`** (or your naming convention) - **For high-resolution satellite imagery storage**
2. ✅ Configure frontend buckets for static website hosting
3. ✅ Block public access on all buckets (CloudFront only for frontends)
4. ✅ Configure satellite imagery bucket:
   - Versioning: Enabled
   - Lifecycle policies: Move to Glacier after 90 days (optional)
   - Encryption: Enabled
5. ✅ Create CloudFront distributions (2 total for frontends)
6. ✅ Request ACM certificates for domains (if using custom domains)
7. ✅ **Share S3 bucket names and CloudFront distribution URLs**

**Phase 6: Compute & Load Balancing**

**If using EC2 (Recommended):**
1. ✅ Create EC2 instance:
   - Type: **t4g.medium** (2 vCPU, 4 GB RAM)
   - AMI: Amazon Linux 2023 (ARM64)
   - Root Volume: 30 GB gp3
   - **Data Volume: 100 GB gp3** (for satellite imagery, GeoServer data)
2. ✅ Place in public subnet
3. ✅ Create security group (allow inbound from ALB only on port 3000)
4. ✅ Create Application Load Balancer
5. ✅ Create target group pointing to EC2 instance
6. ✅ Configure ALB listeners (HTTP → HTTPS redirect)
7. ✅ Attach ACM certificate to ALB
8. ✅ Create IAM role for EC2:
   - Secrets Manager read access
   - CloudWatch Logs write access
   - S3 read/write access (for satellite imagery)
   - ECR pull access (for Docker images)
9. ✅ Attach Elastic IP (optional but recommended)
10. ✅ **Share EC2 instance details and ALB endpoint URL**

**If using ECS Fargate:**
1. ✅ Create ECS cluster (Fargate)
2. ✅ Create Application Load Balancer
3. ✅ Create target group for backend API
4. ✅ Configure ALB listeners (HTTP → HTTPS redirect)
5. ✅ Attach ACM certificate to ALB
6. ✅ **Share ALB endpoint URL**

**Phase 7: IAM Roles**
1. ✅ Create ECS task execution role (with Secrets Manager access)
2. ✅ Create ECS task role (for application permissions)
3. ✅ **Share IAM role ARNs**

---

### Developer - Application Deployment (What I Will Do)

**After infrastructure is provisioned, I will:**

1. ✅ Connect to RDS and run database migrations
2. ✅ Build Docker image and push to ECR
3. ✅ Create ECS task definition and service
4. ✅ Configure environment variables and secrets
5. ✅ Build React apps and upload to S3
6. ✅ Configure CloudFront distributions
7. ✅ Test all endpoints and functionality
8. ✅ Set up monitoring and logging
9. ✅ Handle all future code deployments and updates

---

## What I Need From You (After Provisioning)

Please provide the following information securely:

1. **RDS Details:**
   - Endpoint: `[rds-endpoint].rds.amazonaws.com`
   - Port: `5432`
   - Database name: `ndvi_majmaah_db`
   - Master username: `postgres`
   - Master password: `[shared securely]`

2. **ECR Details:**
   - Repository URI: `[account-id].dkr.ecr.[region].amazonaws.com/ndvi-backend`
   - Push commands: `aws ecr get-login-password...`

3. **S3 Buckets:**
   - Majmaah dashboard bucket: `[bucket-name]`
   - NDVI admin bucket: `[bucket-name]`

4. **CloudFront:**
   - Majmaah distribution URL: `[cloudfront-url].cloudfront.net`
   - NDVI admin distribution URL: `[cloudfront-url].cloudfront.net`

5. **ALB:**
   - Endpoint URL: `[alb-name].[region].elb.amazonaws.com`
   - Or custom domain: `api.yourdomain.com`

6. **IAM Roles:**
   - ECS task execution role ARN: `arn:aws:iam::[account]:role/[role-name]`
   - ECS task role ARN: `arn:aws:iam::[account]:role/[role-name]`

7. **VPC/Network:**
   - VPC ID: `vpc-xxxxx`
   - Private subnet IDs: `subnet-xxxxx, subnet-yyyyy`
   - Security group IDs: `sg-xxxxx`

8. **Secrets Manager:**
   - Secret ARNs (for each secret created)

9. **AWS Credentials:**
   - IAM user credentials with permissions for:
     - ECR push/pull
     - ECS update service
     - S3 upload
     - CloudFront invalidation
     - Secrets Manager read
     - CloudWatch logs write

---

## Estimated Monthly Costs (US East Region)

### Option 1: EC2 (Recommended - Scalable) ⭐
**Total: ~$60-80/month**

- EC2 t4g.medium (4 GB RAM): ~$30-40/month
- EBS Storage (130 GB total): ~$10-12/month
- RDS db.t4g.small (2 GB RAM): ~$30-40/month
- ALB: ~$20/month
- **No NAT Gateway needed** (EC2 in public subnet)
- S3 Storage: ~$1-2/month (frontend) + ~$5-10/month (satellite imagery bucket)
- CloudFront: ~$5-10/month
- **Total: ~$60-80/month**

**Why this configuration:**
- ✅ More RAM (4 GB) for future image processing and GeoServer
- ✅ Larger storage (100 GB data volume) for satellite imagery cache
- ✅ Better database (db.t4g.small) for future data growth
- ✅ Can easily scale up when adding high-res imagery and GeoServer
- ✅ Cost-effective starting point with room to grow

### Option 2: ECS Fargate
**Total: ~$150-180/month**

- ECS Fargate (2 tasks × 1 vCPU, 2 GB): ~$50-60/month
- RDS db.t4g.small: ~$30-40/month
- ALB: ~$20/month
- NAT Gateway: ~$35/month (required for private subnet)
- S3 Storage: ~$1-2/month
- CloudFront: ~$5-10/month
- **Total: ~$150-180/month**

**Recommendation:** Use **EC2 option** to save ~$100-130/month (~$1,200-1,560/year)

---

## Security Considerations

1. **RDS:** 
   - No public access
   - Encrypted at rest
   - Regular automated backups

2. **ECS:**
   - Tasks run in private subnets
   - IAM roles with least privilege
   - Secrets from Secrets Manager (not environment variables)

3. **Frontend:**
   - S3 buckets not publicly accessible
   - CloudFront with HTTPS only
   - CORS configured on backend

4. **API:**
   - HTTPS only (HTTP redirects to HTTPS)
   - JWT authentication
   - Rate limiting (can be added)

---

## Access Requirements

**What I Need:**
- IAM user credentials with permissions for:
  - ECR: Push/pull images
  - ECS: Create/update services, task definitions
  - S3: Upload/delete objects
  - CloudFront: Create invalidations
  - Secrets Manager: Read secrets
  - CloudWatch: Write logs
  - RDS: Connect (via security group, not direct IAM)
- All infrastructure details listed above

**What I'll Provide:**
- SQL migration files (for database setup)
- Docker image (I'll build and push to ECR)
- Frontend build files (I'll upload to S3)
- Environment variable values (for Secrets Manager)
- Application configuration

---

## Next Steps

**For IT Team:**
1. ✅ Review infrastructure requirements above
2. ✅ Confirm AWS account and region (recommend: us-east-1 or eu-west-1)
3. ✅ Confirm domain name preferences (if using custom domains)
4. ✅ Provision all infrastructure listed in "IT Team - Infrastructure Provisioning" section
5. ✅ Share all details listed in "What I Need From You" section (securely)
6. ✅ Provide IAM user credentials with required permissions

**For Developer (Me):**
1. ✅ Wait for infrastructure provisioning
2. ✅ Receive all required details from IT team
3. ✅ Deploy application code and configure services
4. ✅ Test and verify deployment
5. ✅ Handle ongoing deployments and updates

---

## Optional: Infrastructure as Code

If you prefer, I can provide:
- **Terraform templates** - Complete infrastructure definition
- **CloudFormation templates** - AWS native IaC
- **AWS CDK scripts** - TypeScript/Python infrastructure code

This would make provisioning faster and more repeatable. Let me know if you'd like these templates.

---

## Questions or Concerns?

**Please confirm:**
- ✅ Preferred AWS region
- ✅ Preferred AWS region:
  - **Recommended:** `me-south-1` (Bahrain) - Closest to Saudi Arabia, lowest latency ⭐
  - **Alternatives:** `eu-central-1` (Frankfurt) or `eu-west-1` (Ireland)
- ✅ Domain name preferences (if using custom domains)
- ✅ Any security/compliance requirements (especially data residency for Saudi Arabia)
- ✅ Budget approval for estimated costs (~$60-80/month)
- ✅ Timeline for infrastructure provisioning

**I can provide:**
- Terraform/CloudFormation templates (if you want IaC)
- Detailed step-by-step provisioning guides
- SQL migration scripts (for after RDS is ready)
- Environment variable templates (for Secrets Manager)

---

**Contact:** [Your Name/Email]  
**Role:** Developer - Will handle application deployment after infrastructure is ready

