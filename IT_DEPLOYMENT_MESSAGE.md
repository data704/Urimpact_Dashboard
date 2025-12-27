# Message for IT Team - AWS Infrastructure Provisioning Request

---

**Subject: AWS Infrastructure Provisioning Request - NDVI Calculator + Majmaah Dashboard**

Hi [IT Team Name],

I need AWS infrastructure provisioned for our NDVI Calculator and Majmaah Dashboard application. I'll handle all application deployment and configuration once the infrastructure is ready.

## What I Need You to Provision

### 1. EC2 Instance (Backend API Server)
**Instance Type:** `t4g.medium` (2 vCPU, 4 GB RAM)
**Cost:** ~$30-40/month

**Specifications:**
- **AMI:** Amazon Linux 2023 (ARM64)
- **Storage:**
  - Root Volume: 30 GB gp3 SSD
  - Data Volume: 100 GB gp3 SSD (for satellite imagery cache and future GeoServer)
- **Networking:**
  - Subnet: Public subnet (to avoid NAT Gateway cost)
  - Security Group: Allow inbound from ALB only (port 3000)
  - Elastic IP: Recommended (for static IP)
- **IAM Role:** Needs access to:
  - Secrets Manager (read secrets)
  - CloudWatch Logs (write logs)
  - S3 (read/write for satellite imagery)
  - ECR (pull Docker images)

**Why t4g.medium:** More RAM (4 GB) for future image processing, GeoServer, and high-resolution satellite imagery workloads.

---

### 2. RDS PostgreSQL Database
**Instance Type:** `db.t4g.small` (2 vCPU, 2 GB RAM)
**Cost:** ~$30-40/month

**Specifications:**
- **Engine:** PostgreSQL 15.x or latest stable
- **Storage:** 100 GB gp3 SSD (with auto-scaling enabled up to 1 TB)
- **Subnet:** Private subnet only
- **Security Group:** Allow inbound from EC2 security group only (port 5432)
- **Backups:** 7-day retention, automated backups enabled
- **Encryption:** At rest encryption enabled
- **Database Name:** `ndvi_majmaah_db`

**Future Scaling:** Can easily upgrade to db.t4g.medium or db.m6g.large when needed.

---

### 3. Application Load Balancer (ALB)
**Cost:** ~$20/month

**Specifications:**
- Type: Application Load Balancer
- Scheme: Internet-facing
- Listeners: HTTP (80) → HTTPS (443) redirect
- SSL Certificate: AWS Certificate Manager (ACM) certificate required
- Target Group: Points to EC2 instance (port 3000)
- Health Check: `/api/health` endpoint (I'll add this)

---

### 4. S3 Buckets (3 buckets needed)
**Cost:** ~$5-15/month (depends on storage)

**Bucket 1:** `majmaah-dashboard-prod` (or your naming convention)
- Purpose: Frontend hosting (Majmaah Dashboard)
- Configuration: Static website hosting enabled
- Public access: Blocked (CloudFront only)

**Bucket 2:** `ndvi-admin-prod` (or your naming convention)
- Purpose: Frontend hosting (NDVI Admin Dashboard)
- Configuration: Static website hosting enabled
- Public access: Blocked (CloudFront only)

**Bucket 3:** `satellite-imagery-prod` (or your naming convention)
- Purpose: High-resolution satellite imagery storage
- Configuration:
  - Versioning: Enabled
  - Encryption: Enabled
  - Lifecycle policies: Optional (move to Glacier after 90 days)
- Public access: Blocked

---

### 5. CloudFront Distributions (2 distributions)
**Cost:** ~$5-10/month (depends on traffic)

**Distribution 1:** For Majmaah Dashboard
- Origin: `majmaah-dashboard-prod` S3 bucket
- Default root object: `index.html`
- SSL Certificate: ACM certificate
- Custom domain: `dashboard.yourdomain.com` (if using custom domains)
- Error pages: 404 → `/index.html` (for React Router)

**Distribution 2:** For NDVI Admin Dashboard
- Origin: `ndvi-admin-prod` S3 bucket
- Same configuration as above
- Custom domain: `ndvi-admin.yourdomain.com` (if using custom domains)

---

### 6. AWS Secrets Manager
**Cost:** ~$0.40/secret/month

**Secrets to create** (I'll provide values):
1. `ndvi/rds/password` - RDS master password
2. `ndvi/jwt/secret` - JWT secret key
3. `ndvi/gee/credentials` - Google Earth Engine service account JSON
4. `ndvi/mapbox/token` - Mapbox API token

---

### 7. VPC & Networking
**Cost:** ~$0 (no NAT Gateway needed - saves $35/month!)

**Requirements:**
- VPC with 2 public subnets and 2 private subnets
- Internet Gateway
- Route tables configured
- Security Groups:
  - ALB Security Group: Allow HTTPS (443) from internet
  - EC2 Security Group: Allow inbound from ALB only (port 3000)
  - RDS Security Group: Allow inbound from EC2 Security Group only (port 5432)

**Note:** EC2 will be in public subnet (no NAT Gateway needed), RDS in private subnet.

---

### 8. ECR Repository
**Cost:** ~$0.10/GB/month (for Docker images)

**Repository:** `ndvi-backend`
- Purpose: Store Docker image for backend API
- I'll push the image after you create the repository

---

## Estimated Monthly Costs

| Service | Monthly Cost |
|---------|-------------|
| EC2 t4g.medium | $30-40 |
| EBS Storage (130 GB) | $10-12 |
| RDS db.t4g.small | $30-40 |
| ALB | $20 |
| S3 Storage | $5-15 |
| CloudFront | $5-10 |
| Secrets Manager | $1-2 |
| **Total** | **~$60-80/month** |

**Note:** This is a scalable configuration that can handle future features like GeoServer and high-resolution satellite imagery processing without major infrastructure changes.

---

## What I Need From You (After Provisioning)

Please provide the following information securely:

1. **EC2 Details:**
   - Instance ID: `i-xxxxx`
   - Public IP: `x.x.x.x`
   - Private IP: `x.x.x.x`
   - SSH key pair name (or provide .pem file)
   - Security Group ID: `sg-xxxxx`
   - IAM Role ARN: `arn:aws:iam::[account]:role/[role-name]`

2. **RDS Details:**
   - Endpoint: `[rds-endpoint].rds.amazonaws.com`
   - Port: `5432`
   - Database name: `ndvi_majmaah_db`
   - Master username: `postgres`
   - Master password: `[shared securely via Secrets Manager]`
   - Security Group ID: `sg-xxxxx`

3. **ALB Details:**
   - DNS name: `[alb-name].[region].elb.amazonaws.com`
   - Or custom domain: `api.yourdomain.com`
   - Target Group ARN: `arn:aws:elasticloadbalancing:...`

4. **S3 Buckets:**
   - Majmaah dashboard bucket: `[bucket-name]`
   - NDVI admin bucket: `[bucket-name]`
   - Satellite imagery bucket: `[bucket-name]`

5. **CloudFront:**
   - Majmaah distribution URL: `[cloudfront-url].cloudfront.net`
   - NDVI admin distribution URL: `[cloudfront-url].cloudfront.net`
   - Distribution IDs: `[distribution-id]`

6. **ECR Repository:**
   - Repository URI: `[account-id].dkr.ecr.[region].amazonaws.com/ndvi-backend`
   - Push commands: `aws ecr get-login-password...`

7. **Secrets Manager:**
   - Secret ARNs for each secret created

8. **VPC/Network:**
   - VPC ID: `vpc-xxxxx`
   - Public subnet IDs: `subnet-xxxxx, subnet-yyyyy`
   - Private subnet IDs: `subnet-xxxxx, subnet-yyyyy`

9. **IAM User Credentials:**
   - IAM user with permissions for:
     - ECR: Push/pull images
     - ECS: Not needed (using EC2)
     - S3: Upload/delete objects
     - CloudFront: Create invalidations
     - Secrets Manager: Read secrets
     - CloudWatch: Write logs
     - EC2: Describe instances (for monitoring)

---

## What I'll Handle (Developer Responsibilities)

After infrastructure is provisioned, I will:

1. ✅ Connect to RDS and run database migrations
2. ✅ Build Docker image and push to ECR
3. ✅ SSH into EC2 and install Docker
4. ✅ Deploy application containers
5. ✅ Configure environment variables and secrets
6. ✅ Build React apps and upload to S3
7. ✅ Configure CloudFront distributions
8. ✅ Test all endpoints and functionality
9. ✅ Set up monitoring and logging
10. ✅ Handle all future code deployments and updates

---

## Future Scalability

This configuration is designed to scale easily:

**Phase 1 (Current):** Single EC2, basic setup - ~$60-80/month
**Phase 2 (Add GeoServer):** Can run on same EC2 or add separate instance - ~$100-120/month
**Phase 3 (High-res Processing):** Upgrade EC2 to t4g.large or add processing instance - ~$150-200/month
**Phase 4 (Production):** Multiple instances, read replicas - ~$250-350/month

All upgrades can be done without major infrastructure changes.

---

## Questions or Clarifications Needed

Please confirm:
- ✅ Preferred AWS region:
  - **Recommended:** `me-south-1` (Bahrain) - Closest to Saudi Arabia, lowest latency ⭐
  - **Alternatives:** `eu-central-1` (Frankfurt) or `eu-west-1` (Ireland)
- ✅ Domain name preferences (if using custom domains)
- ✅ Any security/compliance requirements (especially data residency for Saudi Arabia)
- ✅ Timeline for infrastructure provisioning
- ✅ Preferred method for sharing credentials (Secrets Manager, secure email, etc.)

---

## Optional: Infrastructure as Code

If you prefer, I can provide:
- **Terraform templates** - Complete infrastructure definition
- **CloudFormation templates** - AWS native IaC
- **AWS CDK scripts** - TypeScript/Python infrastructure code

This would make provisioning faster and more repeatable. Let me know if you'd like these templates.

---

## Detailed Documentation

I've attached a detailed deployment document (`AWS_DEPLOYMENT_REQUEST.md`) with:
- Complete infrastructure specifications
- Security group configurations
- Step-by-step provisioning checklist
- Network architecture diagrams
- Future scaling considerations

---

**Thank you for your help!** Once infrastructure is provisioned, I'll handle all application deployment and can have everything running within a day.

Please let me know if you have any questions or need clarification on any requirements.

Best regards,  
[Your Name]  
[Your Email]  
[Your Phone - Optional]

---

**P.S.** The configuration is optimized for cost (~$60-80/month) while being future-ready for features like GeoServer and high-resolution satellite imagery processing. We can scale up easily when those features are added.

