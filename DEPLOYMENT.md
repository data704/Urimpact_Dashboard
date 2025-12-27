# 🚀 Deployment Guide

Complete guide for deploying the NDVI + Majmaah tree monitoring system to AWS.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [GitHub Secrets Setup](#github-secrets-setup)
3. [First-Time Deployment](#first-time-deployment)
4. [Automatic Deployment](#automatic-deployment)
5. [Manual Deployment](#manual-deployment)
6. [Checking Deployment Status](#checking-deployment-status)
7. [Rollback Instructions](#rollback-instructions)
8. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

Before deploying, ensure you have:

- ✅ AWS account with appropriate permissions
- ✅ GitHub repository with code
- ✅ AWS infrastructure provisioned (see [AWS_SETUP.md](./AWS_SETUP.md))
- ✅ AWS Secrets Manager configured with all secrets
- ✅ EC2 instance running with Docker installed
- ✅ RDS PostgreSQL database created
- ✅ S3 buckets created for frontends
- ✅ CloudFront distributions created

See [AWS_SETUP.md](./AWS_SETUP.md) for detailed infrastructure setup.

---

## 🔐 GitHub Secrets Setup

Configure the following secrets in your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

### Required Secrets:

#### **AWS Credentials:**
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key

#### **ECR (Elastic Container Registry):**
- `ECR_REGISTRY` - ECR registry URL (e.g., `123456789012.dkr.ecr.eu-central-1.amazonaws.com`)
- `ECR_REPOSITORY` - Repository name (default: `ndvi-backend`)

#### **EC2 Deployment:**
- `EC2_HOST` - EC2 instance public IP or hostname
- `EC2_USERNAME` - SSH username (usually `ec2-user` or `ubuntu`)
- `EC2_SSH_KEY` - Private SSH key for EC2 (full key content)

#### **RDS Database:**
- `RDS_ENDPOINT` - RDS endpoint (e.g., `ndvi-majmaah-db.c9quck2ekoks.eu-central-1.rds.amazonaws.com`)

#### **CORS Configuration:**
- `CORS_ORIGINS` - Comma-separated list of allowed origins (e.g., `https://d1234.cloudfront.net,https://d5678.cloudfront.net`)

#### **Frontend Environment Variables:**
- `VITE_API_BASE_URL` - Backend API URL (e.g., `https://api.yourdomain.com/api` or `http://EC2_IP:3000/api`)
- `VITE_MAPBOX_ACCESS_TOKEN` - Mapbox access token

#### **S3 Buckets:**
- `S3_BUCKET_NDVI` - S3 bucket name for NDVI Calculator frontend
- `S3_BUCKET_MAJMAAH` - S3 bucket name for Majmaah Dashboard frontend

#### **CloudFront Distributions:**
- `CLOUDFRONT_DISTRIBUTION_ID_NDVI` - CloudFront distribution ID for NDVI Calculator
- `CLOUDFRONT_DISTRIBUTION_ID_MAJMAAH` - CloudFront distribution ID for Majmaah Dashboard

### How to Get These Values:

See [AWS_SETUP.md](./AWS_SETUP.md) for detailed instructions on obtaining each value.

---

## 🎯 First-Time Deployment

### Step 1: Initialize Database

Run database migrations on RDS:

```bash
# Set environment variables
export RDS_ENDPOINT=ndvi-majmaah-db.c9quck2ekoks.eu-central-1.rds.amazonaws.com
export AWS_REGION=eu-central-1

# Run initialization script
./scripts/init-database.sh
```

Or manually:

```bash
# Fetch database password
DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id ndvi/rds/password --region eu-central-1 --query SecretString --output text)

# Run migrations
export PGPASSWORD=$DB_PASSWORD
psql -h $RDS_ENDPOINT -p 5432 -U postgres -d ndvi_majmaah_db -f ndvi-calculatorr/server/migrations/001-initial-schema.sql
psql -h $RDS_ENDPOINT -p 5432 -U postgres -d ndvi_majmaah_db -f ndvi-calculatorr/server/migrations/002-users-and-assignments.sql
unset PGPASSWORD
```

### Step 2: Build and Push Docker Image

**Option A: Using GitHub Actions (Recommended)**

1. Push code to `main` branch
2. GitHub Actions will automatically:
   - Build Docker image
   - Push to ECR
   - Deploy to EC2

**Option B: Manual Build**

```bash
# Login to ECR
aws ecr get-login-password --region eu-central-1 | docker login -u AWS --password-stdin YOUR_ECR_REGISTRY

# Build and push
cd ndvi-calculatorr/server
docker build -t ndvi-backend:latest .
docker tag ndvi-backend:latest YOUR_ECR_REGISTRY/ndvi-backend:latest
docker push YOUR_ECR_REGISTRY/ndvi-backend:latest
```

### Step 3: Deploy Backend to EC2

**Option A: Using GitHub Actions**

Just push to `main` branch - deployment happens automatically!

**Option B: Manual Deployment**

```bash
# Set environment variables
export ECR_REGISTRY=123456789012.dkr.ecr.eu-central-1.amazonaws.com
export EC2_HOST=your-ec2-ip
export EC2_USER=ec2-user
export RDS_ENDPOINT=ndvi-majmaah-db.c9quck2ekoks.eu-central-1.rds.amazonaws.com
export CORS_ORIGINS=https://d1234.cloudfront.net,https://d5678.cloudfront.net

# Run deployment script
./scripts/deploy-backend.sh
```

### Step 4: Deploy Frontends

**Option A: Using GitHub Actions (Recommended)**

1. Push changes to `main` branch
2. GitHub Actions automatically:
   - Builds React apps
   - Deploys to S3
   - Invalidates CloudFront

**Option B: Manual Deployment**

```bash
# NDVI Calculator Frontend
cd ndvi-calculatorr/client
npm ci
VITE_API_BASE_URL=https://api.yourdomain.com/api \
VITE_MAPBOX_ACCESS_TOKEN=your-token \
npm run build
aws s3 sync dist/ s3://ndvi-admin-prod-xxx --delete
aws cloudfront create-invalidation --distribution-id E1234567890 --paths "/*"

# Majmaah Dashboard Frontend
cd majmaah-dashboard-react
npm ci
VITE_API_BASE_URL=https://api.yourdomain.com/api \
VITE_MAPBOX_ACCESS_TOKEN=your-token \
npm run build
aws s3 sync dist/ s3://majmaah-dashboard-prod-xxx --delete
aws cloudfront create-invalidation --distribution-id E0987654321 --paths "/*"
```

---

## 🔄 Automatic Deployment

Once set up, deployment is **fully automatic**:

### How It Works:

1. **Push to `main` branch** triggers GitHub Actions
2. **Path-based triggers** ensure only relevant workflows run:
   - `ndvi-calculatorr/server/**` → Deploys backend
   - `ndvi-calculatorr/client/**` → Deploys NDVI frontend
   - `majmaah-dashboard-react/**` → Deploys Majmaah frontend

### Workflow Files:

- `.github/workflows/deploy-backend.yml` - Backend deployment
- `.github/workflows/deploy-ndvi-frontend.yml` - NDVI Calculator frontend
- `.github/workflows/deploy-majmaah-frontend.yml` - Majmaah Dashboard frontend

### Manual Trigger:

You can also trigger deployments manually:

1. Go to **Actions** tab in GitHub
2. Select the workflow (e.g., "Deploy Backend to EC2")
3. Click **Run workflow**
4. Select branch and click **Run workflow**

---

## 🛠️ Manual Deployment

### Backend Deployment:

```bash
# Using deployment script
./scripts/deploy-backend.sh

# Or manually via SSH
ssh ec2-user@your-ec2-ip
docker login -u AWS -p $(aws ecr get-login-password --region eu-central-1) YOUR_ECR_REGISTRY
docker pull YOUR_ECR_REGISTRY/ndvi-backend:latest
docker stop ndvi-backend || true
docker rm ndvi-backend || true
# ... (see deploy-backend.sh for full commands)
```

### Frontend Deployment:

See "First-Time Deployment" section above.

---

## 📊 Checking Deployment Status

### Backend Health Check:

```bash
# From your local machine
curl http://YOUR_EC2_IP:3000/api/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z","uptime":123.45,"environment":"production"}
```

### Check Docker Container:

```bash
# SSH into EC2
ssh ec2-user@YOUR_EC2_IP

# Check container status
docker ps | grep ndvi-backend

# Check logs
docker logs ndvi-backend --tail 50

# Check health
curl http://localhost:3000/api/health
```

### Check Frontend Deployment:

1. Visit CloudFront URL in browser
2. Check browser console for errors
3. Verify API calls are working

### GitHub Actions Status:

1. Go to **Actions** tab in GitHub
2. Check latest workflow run
3. View logs for any errors

---

## ⏪ Rollback Instructions

### Backend Rollback:

```bash
# SSH into EC2
ssh ec2-user@YOUR_EC2_IP

# List available images
docker images | grep ndvi-backend

# Stop current container
docker stop ndvi-backend
docker rm ndvi-backend

# Run previous version (replace TAG with previous version)
docker run -d \
  --name ndvi-backend \
  --restart always \
  -p 3000:3000 \
  # ... (same env vars as before)
  YOUR_ECR_REGISTRY/ndvi-backend:PREVIOUS_TAG
```

### Frontend Rollback:

1. Go to S3 bucket
2. Enable versioning (if not already)
3. Restore previous version
4. Invalidate CloudFront cache

Or redeploy previous commit:

```bash
git checkout PREVIOUS_COMMIT_SHA
git push origin main --force  # Triggers deployment
```

---

## 🔧 Troubleshooting

### Backend Won't Start:

1. **Check logs:**
   ```bash
   docker logs ndvi-backend --tail 100
   ```

2. **Check environment variables:**
   ```bash
   docker exec ndvi-backend env | grep -E "DB_|GEE_|JWT_"
   ```

3. **Check database connection:**
   ```bash
   docker exec ndvi-backend node -e "require('./src/config/database.js').testConnection()"
   ```

4. **Check AWS Secrets Manager access:**
   - Verify EC2 IAM role has `secretsmanager:GetSecretValue` permission
   - Or ensure AWS credentials are configured

### Frontend Build Fails:

1. **Check GitHub Actions logs**
2. **Verify environment variables are set in GitHub secrets**
3. **Check Node.js version matches (should be 18)**

### Database Connection Issues:

1. **Check RDS security group** allows connections from EC2
2. **Verify RDS endpoint** is correct
3. **Check database password** in Secrets Manager
4. **Test connection manually:**
   ```bash
   psql -h RDS_ENDPOINT -p 5432 -U postgres -d ndvi_majmaah_db
   ```

### CORS Errors:

1. **Verify CORS_ORIGINS** includes your CloudFront domains
2. **Check backend logs** for CORS rejection messages
3. **Update CORS_ORIGINS** in GitHub secrets and redeploy

### Health Check Fails:

1. **Check container is running:** `docker ps`
2. **Check port 3000 is accessible:** `curl localhost:3000/api/health`
3. **Check security group** allows traffic on port 3000
4. **Check application logs** for errors

### GitHub Actions Fails:

1. **Check secrets are configured** correctly
2. **Verify AWS credentials** have necessary permissions
3. **Check EC2 SSH key** is correct
4. **View workflow logs** for specific error messages

---

## 📞 Support

For issues or questions:

1. Check [Troubleshooting](#troubleshooting) section
2. Review GitHub Actions logs
3. Check application logs on EC2
4. Verify all secrets are configured correctly

---

**Last Updated:** 2024-01-01

