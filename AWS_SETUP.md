# ☁️ AWS Infrastructure Setup Guide

Complete guide for setting up AWS infrastructure for the NDVI + Majmaah tree monitoring system.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting AWS Credentials](#getting-aws-credentials)
3. [RDS PostgreSQL Setup](#rds-postgresql-setup)
4. [EC2 Instance Setup](#ec2-instance-setup)
5. [ECR Repository Setup](#ecr-repository-setup)
6. [S3 Buckets Setup](#s3-buckets-setup)
7. [CloudFront Distributions Setup](#cloudfront-distributions-setup)
8. [Secrets Manager Setup](#secrets-manager-setup)
9. [Getting Required Values](#getting-required-values)

---

## ✅ Prerequisites

- AWS account with admin access
- AWS CLI installed and configured
- Basic knowledge of AWS services

---

## 🔑 Getting AWS Credentials

### Option 1: IAM User (Recommended for CI/CD)

1. Go to **IAM Console** → **Users** → **Create user**
2. Name: `github-actions-deploy`
3. Select **Programmatic access**
4. Attach policy: `AdministratorAccess` (or create custom policy with required permissions)
5. **Save credentials:**
   - Access Key ID
   - Secret Access Key
6. Add these to GitHub Secrets as:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

### Option 2: IAM Role (Recommended for EC2)

1. Go to **IAM Console** → **Roles** → **Create role**
2. Select **EC2** as trusted entity
3. Attach policies:
   - `AmazonEC2ContainerRegistryReadOnly`
   - `SecretsManagerReadWrite`
   - Custom policy for RDS access
4. Attach role to EC2 instance

### Required Permissions:

- `ecr:*` (ECR access)
- `secretsmanager:GetSecretValue` (Secrets Manager)
- `s3:*` (S3 access)
- `cloudfront:CreateInvalidation` (CloudFront)
- `rds:DescribeDBInstances` (RDS - optional)

---

## 🗄️ RDS PostgreSQL Setup

### Create RDS Instance:

1. Go to **RDS Console** → **Create database**
2. **Engine:** PostgreSQL 15.x
3. **Template:** Production or Dev/Test
4. **Settings:**
   - DB instance identifier: `ndvi-majmaah-db`
   - Master username: `postgres`
   - Master password: **Generate strong password** (save it!)
5. **Instance configuration:** Choose based on needs (db.t3.micro for dev)
6. **Storage:** 20 GB (adjust as needed)
7. **Connectivity:**
   - VPC: Your VPC
   - Public access: **No** (for security)
   - VPC security group: Create new or use existing
8. **Database authentication:** Password authentication
9. Click **Create database**

### Get RDS Endpoint:

1. Go to **RDS Console** → **Databases**
2. Click on your database instance
3. Copy **Endpoint** (e.g., `ndvi-majmaah-db.c9quck2ekoks.eu-central-1.rds.amazonaws.com`)
4. Add to GitHub Secrets as `RDS_ENDPOINT`

### Configure Security Group:

1. Go to **EC2 Console** → **Security Groups**
2. Find RDS security group
3. **Inbound rules** → **Add rule:**
   - Type: PostgreSQL
   - Port: 5432
   - Source: EC2 security group (or specific IP)

---

## 💻 EC2 Instance Setup

### Launch EC2 Instance:

1. Go to **EC2 Console** → **Launch instance**
2. **Name:** `ndvi-backend-server`
3. **AMI:** Amazon Linux 2023 or Ubuntu 22.04
4. **Instance type:** t4g.medium (ARM64) or t3.medium
5. **Key pair:** Create new or select existing
6. **Network settings:**
   - VPC: Same as RDS
   - Subnet: Public subnet (for internet access)
   - Auto-assign public IP: **Enable**
   - Security group: Create new
     - SSH (22) from your IP
     - Custom TCP (3000) from ALB security group
7. **Storage:** 20 GB gp3
8. Click **Launch instance**

### Install Docker on EC2:

**For Amazon Linux 2023:**
```bash
sudo yum update -y
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user
```

**For Ubuntu:**
```bash
sudo apt-get update
sudo apt-get install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu
```

### Install AWS CLI (if not pre-installed):

```bash
# Amazon Linux
sudo yum install aws-cli -y

# Ubuntu
sudo apt-get install awscli -y
```

### Configure AWS CLI:

```bash
aws configure
# Enter your AWS credentials
# Region: eu-central-1 (or your region)
```

### Get EC2 Details:

1. **Public IP:** EC2 Console → Instance → Public IPv4 address
2. **Hostname:** Same as IP or use Elastic IP
3. **SSH Key:** The `.pem` file you downloaded
4. Add to GitHub Secrets:
   - `EC2_HOST` = Public IP
   - `EC2_USERNAME` = `ec2-user` (Amazon Linux) or `ubuntu` (Ubuntu)
   - `EC2_SSH_KEY` = Contents of `.pem` file

---

## 📦 ECR Repository Setup

### Create ECR Repository:

1. Go to **ECR Console** → **Create repository**
2. **Visibility:** Private
3. **Repository name:** `ndvi-backend`
4. **Tag immutability:** Enable (recommended)
5. **Scan on push:** Enable (recommended)
6. Click **Create repository**

### Get ECR Registry URL:

1. Go to **ECR Console** → Select repository
2. Click **View push commands**
3. Copy **Registry URI** (e.g., `123456789012.dkr.ecr.eu-central-1.amazonaws.com`)
4. Add to GitHub Secrets as `ECR_REGISTRY`

### Login to ECR (for manual pushes):

```bash
aws ecr get-login-password --region eu-central-1 | docker login -u AWS --password-stdin YOUR_ECR_REGISTRY
```

---

## 🪣 S3 Buckets Setup

### Create S3 Buckets:

1. Go to **S3 Console** → **Create bucket**

#### Bucket 1: NDVI Calculator Frontend
- **Bucket name:** `ndvi-admin-prod-xxx` (must be globally unique)
- **Region:** eu-central-1
- **Block Public Access:** Uncheck (needed for CloudFront)
- **Bucket Versioning:** Enable (for rollback)
- Click **Create bucket**

#### Bucket 2: Majmaah Dashboard Frontend
- **Bucket name:** `majmaah-dashboard-prod-xxx` (must be globally unique)
- Same settings as above

### Configure Bucket Policy:

For each bucket, add this policy (replace `BUCKET_NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::BUCKET_NAME/*"
    }
  ]
}
```

### Enable Static Website Hosting (Optional):

1. Go to bucket → **Properties** → **Static website hosting**
2. **Enable**
3. **Index document:** `index.html`
4. **Error document:** `index.html` (for SPA routing)

### Get Bucket Names:

Add to GitHub Secrets:
- `S3_BUCKET_NDVI` = `ndvi-admin-prod-xxx`
- `S3_BUCKET_MAJMAAH` = `majmaah-dashboard-prod-xxx`

---

## 🌐 CloudFront Distributions Setup

### Create CloudFront Distribution:

1. Go to **CloudFront Console** → **Create distribution**

#### Distribution 1: NDVI Calculator
- **Origin domain:** Select S3 bucket (`ndvi-admin-prod-xxx.s3.eu-central-1.amazonaws.com`)
- **Origin access:** Public (or OAC if using)
- **Viewer protocol policy:** Redirect HTTP to HTTPS
- **Allowed HTTP methods:** GET, HEAD, OPTIONS
- **Cache policy:** CachingOptimized
- **Default root object:** `index.html`
- **Custom error responses:**
  - 403 → 200 → `/index.html`
  - 404 → 200 → `/index.html`
- Click **Create distribution**

#### Distribution 2: Majmaah Dashboard
- Same settings, different origin bucket

### Get Distribution IDs:

1. Go to **CloudFront Console**
2. Copy **Distribution ID** (e.g., `E1234567890ABC`)
3. Add to GitHub Secrets:
   - `CLOUDFRONT_DISTRIBUTION_ID_NDVI`
   - `CLOUDFRONT_DISTRIBUTION_ID_MAJMAAH`

### Get CloudFront URLs:

1. Distribution → **Domain name** (e.g., `d1234567890abc.cloudfront.net`)
2. Use these in `CORS_ORIGINS` GitHub secret

---

## 🔐 Secrets Manager Setup

### Create Secrets:

Go to **Secrets Manager Console** → **Store a new secret**

#### 1. RDS Password
- **Secret type:** Other type of secret
- **Secret value:** Your RDS master password (plaintext)
- **Secret name:** `ndvi/rds/password`
- Click **Store**

#### 2. JWT Secret
- **Secret type:** Other type of secret
- **Secret value:** Strong random string (min 32 chars)
- **Secret name:** `ndvi/jwt/secret`
- Click **Store**

#### 3. GEE Credentials
- **Secret type:** Other type of secret
- **Secret value:** JSON format:
  ```json
  {
    "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
    "client_email": "your-service-account@project.iam.gserviceaccount.com",
    "project_id": "your-project-id"
  }
  ```
- **Secret name:** `ndvi/gee/credentials`
- Click **Store**

#### 4. Mapbox Token
- **Secret type:** Other type of secret
- **Secret value:** Your Mapbox access token
- **Secret name:** `ndvi/mapbox/token`
- Click **Store**

### Verify Secrets:

```bash
aws secretsmanager get-secret-value --secret-id ndvi/rds/password --region eu-central-1
```

---

## 📝 Getting Required Values

### Summary Checklist:

Use this checklist to collect all values needed for GitHub Secrets:

- [ ] **AWS_ACCESS_KEY_ID** - From IAM user
- [ ] **AWS_SECRET_ACCESS_KEY** - From IAM user
- [ ] **ECR_REGISTRY** - From ECR Console (e.g., `123456789012.dkr.ecr.eu-central-1.amazonaws.com`)
- [ ] **EC2_HOST** - EC2 public IP
- [ ] **EC2_USERNAME** - `ec2-user` or `ubuntu`
- [ ] **EC2_SSH_KEY** - Contents of `.pem` file
- [ ] **RDS_ENDPOINT** - From RDS Console
- [ ] **CORS_ORIGINS** - CloudFront domain names (comma-separated)
- [ ] **VITE_API_BASE_URL** - Backend API URL
- [ ] **VITE_MAPBOX_ACCESS_TOKEN** - From Mapbox account
- [ ] **S3_BUCKET_NDVI** - S3 bucket name
- [ ] **S3_BUCKET_MAJMAAH** - S3 bucket name
- [ ] **CLOUDFRONT_DISTRIBUTION_ID_NDVI** - From CloudFront Console
- [ ] **CLOUDFRONT_DISTRIBUTION_ID_MAJMAAH** - From CloudFront Console

### Quick Reference:

| Service | Where to Find | Example Value |
|---------|--------------|---------------|
| RDS Endpoint | RDS Console → Databases → Endpoint | `ndvi-majmaah-db.c9quck2ekoks.eu-central-1.rds.amazonaws.com` |
| EC2 IP | EC2 Console → Instances → Public IPv4 | `1.2.3.4` |
| ECR Registry | ECR Console → Repository → URI | `123456789012.dkr.ecr.eu-central-1.amazonaws.com` |
| S3 Bucket | S3 Console → Bucket name | `ndvi-admin-prod-xxx` |
| CloudFront ID | CloudFront Console → Distribution ID | `E1234567890ABC` |
| CloudFront URL | CloudFront Console → Domain name | `d1234567890abc.cloudfront.net` |

---

## ✅ Next Steps

Once all infrastructure is set up:

1. ✅ Add all values to GitHub Secrets (see [DEPLOYMENT.md](./DEPLOYMENT.md))
2. ✅ Run database migrations (see [DEPLOYMENT.md](./DEPLOYMENT.md#first-time-deployment))
3. ✅ Deploy backend (see [DEPLOYMENT.md](./DEPLOYMENT.md#first-time-deployment))
4. ✅ Deploy frontends (see [DEPLOYMENT.md](./DEPLOYMENT.md#first-time-deployment))

---

**Last Updated:** 2024-01-01

