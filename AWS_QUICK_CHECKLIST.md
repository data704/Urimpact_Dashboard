# AWS Provisioning Quick Checklist

## Pre-Setup
- [ ] Log into AWS Console
- [ ] Select region: **`me-south-1` (Bahrain)** ⭐ Recommended for Saudi Arabia
  - Alternative: `eu-central-1` (Frankfurt) or `eu-west-1` (Ireland)
- [ ] Have domain name ready (optional)

---

## Step-by-Step Order

### 1. Networking (15 minutes)
- [ ] Create VPC with 2 public + 2 private subnets
- [ ] Create 3 security groups (ALB, EC2, RDS)
- [ ] Note down: VPC ID, Subnet IDs, Security Group IDs

### 2. IAM (10 minutes)
- [ ] Create EC2 instance role with permissions
- [ ] Create IAM user for deployment
- [ ] Download access keys (save securely!)
- [ ] Note down: Role ARN, User credentials

### 3. Storage (10 minutes)
- [ ] Create 3 S3 buckets (majmaah, ndvi-admin, satellite-imagery)
- [ ] Enable static website hosting on frontend buckets
- [ ] Note down: Bucket names

### 4. Container Registry (5 minutes)
- [ ] Create ECR repository: `ndvi-backend`
- [ ] Note down: Repository URI, Push commands

### 5. Secrets (10 minutes)
- [ ] Create 4 secrets in Secrets Manager:
  - [ ] RDS password
  - [ ] JWT secret
  - [ ] GEE credentials
  - [ ] Mapbox token
- [ ] Note down: Secret ARNs, RDS password

### 6. Database (20 minutes)
- [ ] Create RDS PostgreSQL (db.t4g.small)
- [ ] Wait for database to be available
- [ ] Note down: Endpoint, Port, Database name

### 7. SSL Certificate (15 minutes)
- [ ] Request ACM certificate
- [ ] Validate domains (DNS or email)
- [ ] Wait for validation
- [ ] Note down: Certificate ARN

### 8. Load Balancer (10 minutes)
- [ ] Create Application Load Balancer
- [ ] Create target group
- [ ] Configure HTTPS listener
- [ ] Note down: ALB DNS name, Target Group ARN

### 9. EC2 Instance (15 minutes)
- [ ] Launch EC2 (t4g.medium)
- [ ] Configure 2 volumes (30 GB + 100 GB)
- [ ] Attach IAM role
- [ ] Allocate Elastic IP (optional)
- [ ] Note down: Instance ID, Public IP, Private IP

### 10. Attach EC2 to ALB (5 minutes)
- [ ] Register EC2 instance to target group
- [ ] Wait for health check to pass

### 11. CloudFront (20 minutes)
- [ ] Create distribution for Majmaah dashboard
- [ ] Create distribution for NDVI admin
- [ ] Configure error pages (404 → index.html)
- [ ] Wait for deployment (10-15 minutes)
- [ ] Note down: Distribution URLs

### 12. DNS (Optional - 10 minutes)
- [ ] Create Route 53 records (if using custom domain)
- [ ] Point api.yourdomain.com → ALB
- [ ] Point dashboard.yourdomain.com → CloudFront
- [ ] Point ndvi-admin.yourdomain.com → CloudFront

---

## Total Time: ~2-3 hours

## Total Cost: ~$60-80/month

---

## Critical Information to Save

Save all these details in a secure document:

- VPC ID and Subnet IDs
- Security Group IDs (ALB, EC2, RDS)
- EC2 Instance ID, Public IP, Private IP
- RDS Endpoint, Port, Database name, Password
- ALB DNS name
- S3 Bucket names
- CloudFront Distribution URLs
- ECR Repository URI
- Secret ARNs
- IAM Role ARN
- IAM User Access Keys
- SSH Key file (.pem)

---

## After Provisioning

1. Test SSH access to EC2
2. Install Docker on EC2
3. Connect to RDS and run migrations
4. Build and push Docker image
5. Deploy application
6. Upload frontends to S3
7. Test everything!

---

**See `AWS_STEP_BY_STEP_GUIDE.md` for detailed instructions!**

