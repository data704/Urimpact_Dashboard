# Step-by-Step Guide: Provisioning AWS Services for NDVI Calculator + Majmaah Dashboard

## Prerequisites

- AWS Account (if you don't have one, sign up at https://aws.amazon.com)
- AWS Console access
- Basic understanding of AWS services

**Estimated Time:** 2-3 hours for first-time setup

---

## Step 1: Choose AWS Region

1. Log into AWS Console: https://console.aws.amazon.com
2. **Select Region** (top right corner)
   - **Recommended for Saudi Arabia:** 
     - **`me-south-1` (Bahrain)** ⭐ **BEST CHOICE** - Closest region, lowest latency
     - **`eu-central-1` (Frankfurt)** - Good alternative, well-established
     - **`eu-west-1` (Ireland)** - Alternative option
   - **Why Bahrain (me-south-1):**
     - ✅ Lowest latency for Saudi Arabia users
     - ✅ Data residency in Middle East
     - ✅ Better performance for satellite imagery processing
   - **Important:** Use the same region for all services!

---

## Step 2: Create VPC and Networking

### 2.1 Create VPC

1. Go to **VPC Dashboard** → Click **"Create VPC"**
2. Select **"VPC and more"** (recommended)
3. Configure:
   - **Name tag:** `ndvi-majmaah-vpc`
   - **IPv4 CIDR:** `10.0.0.0/16`
   - **IPv6 CIDR:** No IPv6 CIDR block
   - **Tenancy:** Default
   - **Number of Availability Zones:** 2
   - **Number of public subnets:** 2
   - **Number of private subnets:** 2
   - **NAT gateways:** 0 (we're using public subnet for EC2 - saves $35/month!)
   - **VPC endpoints:** None
   - **Enable DNS hostnames:** Yes
   - **Enable DNS resolution:** Yes
4. Click **"Create VPC"**
5. **Note down:** VPC ID (e.g., `vpc-0123456789abcdef0`)

### 2.2 Note Subnet IDs

1. Go to **VPC Dashboard** → **Subnets**
2. **Note down:**
   - **Public Subnet 1:** `subnet-xxxxx` (e.g., `subnet-0123456789abcdef0`)
   - **Public Subnet 2:** `subnet-yyyyy`
   - **Private Subnet 1:** `subnet-zzzzz` (for RDS)
   - **Private Subnet 2:** `subnet-wwwww`

---

## Step 3: Create Security Groups

### 3.1 ALB Security Group

1. Go to **VPC Dashboard** → **Security Groups** → **Create security group**
2. Configure:
   - **Name:** `ndvi-alb-sg`
   - **Description:** Security group for Application Load Balancer
   - **VPC:** Select your VPC (`ndvi-majmaah-vpc`)
3. **Inbound Rules:**
   - Type: HTTPS, Port: 443, Source: 0.0.0.0/0
   - Type: HTTP, Port: 80, Source: 0.0.0.0/0 (for redirect)
4. **Outbound Rules:** Default (allow all)
5. Click **"Create security group"**
6. **Note down:** Security Group ID (e.g., `sg-0123456789abcdef0`)

### 3.2 EC2 Security Group

1. **Create security group**
2. Configure:
   - **Name:** `ndvi-ec2-sg`
   - **Description:** Security group for EC2 backend API
   - **VPC:** Select your VPC
3. **Inbound Rules:**
   - Type: Custom TCP, Port: 3000, Source: Select ALB security group (`ndvi-alb-sg`)
   - Type: SSH, Port: 22, Source: Your IP (for initial setup)
4. **Outbound Rules:** Default (allow all)
5. Click **"Create security group"**
6. **Note down:** Security Group ID

### 3.3 RDS Security Group

1. **Create security group**
2. Configure:
   - **Name:** `ndvi-rds-sg`
   - **Description:** Security group for RDS database
   - **VPC:** Select your VPC
3. **Inbound Rules:**
   - Type: PostgreSQL, Port: 5432, Source: Select EC2 security group (`ndvi-ec2-sg`)
4. **Outbound Rules:** Default (allow all)
5. Click **"Create security group"**
6. **Note down:** Security Group ID

---

## Step 4: Create IAM Roles

### 4.1 EC2 Instance Role

1. Go to **IAM Dashboard** → **Roles** → **Create role**
2. **Trusted entity type:** AWS service
3. **Use case:** EC2 → Click **Next**
4. **Permissions:** Add these policies:
   - `AmazonEC2ContainerRegistryReadOnly` (for ECR)
   - `SecretsManagerReadWrite` (for secrets)
   - `AmazonS3FullAccess` (for satellite imagery)
   - `CloudWatchLogsFullAccess` (for logging)
5. **Role name:** `ndvi-ec2-role`
6. Click **"Create role"**
7. **Note down:** Role ARN (e.g., `arn:aws:iam::123456789012:role/ndvi-ec2-role`)

### 4.2 IAM User for Deployment (Optional but Recommended)

1. Go to **IAM Dashboard** → **Users** → **Create user**
2. **User name:** `ndvi-deployment-user`
3. **Set permissions:** Attach policies directly
4. **Policies to attach:**
   - `AmazonEC2FullAccess` (or more restrictive: EC2 describe, start, stop)
   - `AmazonS3FullAccess` (or restrict to specific buckets)
   - `CloudFrontFullAccess`
   - `AmazonECRPublicFullAccess` (or `AmazonEC2ContainerRegistryFullAccess`)
   - `SecretsManagerReadWrite`
   - `CloudWatchLogsFullAccess`
5. Click **"Create user"**
6. **Create Access Key:**
   - Go to user → **Security credentials** tab
   - Click **"Create access key"**
   - Choose **"Command Line Interface (CLI)"**
   - Download CSV file with Access Key ID and Secret Access Key
   - **⚠️ Keep this secure!**

---

## Step 5: Create S3 Buckets

### 5.1 Majmaah Dashboard Bucket

1. Go to **S3 Dashboard** → **Create bucket**
2. Configure:
   - **Bucket name:** `majmaah-dashboard-prod-[your-unique-id]` (must be globally unique)
   - **AWS Region:** Same as your other services
   - **Object Ownership:** ACLs disabled (recommended)
   - **Block Public Access:** ✅ **Enable all** (we'll use CloudFront)
   - **Bucket Versioning:** Enable
   - **Default encryption:** Enable (SSE-S3)
   - **Object Lock:** Disable
3. Click **"Create bucket"**
4. **Configure Static Website Hosting:**
   - Go to bucket → **Properties** tab
   - Scroll to **"Static website hosting"**
   - Click **"Edit"**
   - Enable static website hosting
   - Index document: `index.html`
   - Error document: `index.html` (for React Router)
   - Click **"Save changes"**

### 5.2 NDVI Admin Bucket

1. Repeat Step 5.1 with:
   - **Bucket name:** `ndvi-admin-prod-[your-unique-id]`
   - Same configuration

### 5.3 Satellite Imagery Bucket

1. Repeat Step 5.1 with:
   - **Bucket name:** `satellite-imagery-prod-[your-unique-id]`
   - **Versioning:** Enable
   - **Lifecycle rules (optional):**
     - Go to **Management** tab → **Lifecycle rules** → **Create lifecycle rule**
     - Name: `move-to-glacier`
     - Move objects to Glacier after 90 days
     - Click **"Create rule"**

**Note down all 3 bucket names!**

---

## Step 6: Create ECR Repository

1. Go to **ECR Dashboard** → **Repositories** → **Create repository**
2. Configure:
   - **Visibility:** Private
   - **Repository name:** `ndvi-backend`
   - **Tag immutability:** Enable (recommended)
   - **Scan on push:** Enable (for security)
3. Click **"Create repository"**
4. **Get push commands:**
   - Click on repository name
   - Click **"View push commands"**
   - **Note down:** Repository URI (e.g., `123456789012.dkr.ecr.us-east-1.amazonaws.com/ndvi-backend`)
   - **Save push commands** for later use

---

## Step 7: Create Secrets in Secrets Manager

### 7.1 RDS Password Secret

1. Go to **Secrets Manager** → **Store a new secret**
2. Configure:
   - **Secret type:** Credentials for Amazon RDS database
   - **Username:** `postgres`
   - **Password:** Generate or enter secure password
   - **Database:** Leave blank (we'll create DB separately)
   - **Encryption key:** Default (AWS managed)
3. Click **"Next"**
4. **Secret name:** `ndvi/rds/password`
5. Click **"Next"** → **"Next"** → **"Store"**
6. **⚠️ Note down the password!** (You'll need it for RDS setup)

### 7.2 JWT Secret

1. **Store a new secret**
2. **Secret type:** Other type of secret
3. **Plaintext:** Enter a long random string (e.g., generate with: `openssl rand -base64 32`)
4. **Secret name:** `ndvi/jwt/secret`
5. Click **"Store"**

### 7.3 GEE Credentials Secret

1. **Store a new secret**
2. **Secret type:** Other type of secret
3. **Plaintext:** Paste your Google Earth Engine service account JSON
4. **Secret name:** `ndvi/gee/credentials`
5. Click **"Store"**

### 7.4 Mapbox Token Secret

1. **Store a new secret**
2. **Secret type:** Other type of secret
3. **Plaintext:** Your Mapbox access token
4. **Secret name:** `ndvi/mapbox/token`
5. Click **"Store"**

**Note down all secret ARNs!**

---

## Step 8: Create RDS PostgreSQL Database

1. Go to **RDS Dashboard** → **Create database**
2. **Database creation method:** Standard create
3. **Engine options:**
   - **Engine type:** PostgreSQL
   - **Version:** PostgreSQL 15.x (or latest stable)
   - **Templates:** Production (or Free tier if eligible)
4. **Settings:**
   - **DB instance identifier:** `ndvi-majmaah-db`
   - **Master username:** `postgres`
   - **Master password:** Use password from Secrets Manager (`ndvi/rds/password`)
   - **Confirm password:** Same password
5. **Instance configuration:**
   - **DB instance class:** `db.t4g.small` (2 vCPU, 2 GB RAM)
   - **Storage:** 
     - **Storage type:** General Purpose SSD (gp3)
     - **Allocated storage:** 100 GB
     - **Storage autoscaling:** Enable (max 1 TB)
6. **Connectivity:**
   - **VPC:** Select your VPC (`ndvi-majmaah-vpc`)
   - **Subnet group:** Create new DB subnet group
     - Name: `ndvi-db-subnet-group`
     - VPC: Your VPC
     - Availability Zones: Select 2
     - Subnets: Select both **private subnets**
   - **Public access:** No
   - **VPC security group:** Choose existing → Select `ndvi-rds-sg`
   - **Availability Zone:** No preference
7. **Database authentication:** Password authentication
8. **Additional configuration:**
   - **Initial database name:** `ndvi_majmaah_db`
   - **DB parameter group:** Default
   - **Backup:** 
     - **Backup retention period:** 7 days
     - **Backup window:** No preference
   - **Encryption:** Enable encryption
   - **Performance Insights:** Enable (optional, costs extra)
   - **Enhanced monitoring:** Disable (optional)
9. **Maintenance:**
   - **Auto minor version upgrade:** Enable
   - **Maintenance window:** No preference
10. Click **"Create database"**
11. **Wait 5-10 minutes** for database to be available
12. **Note down:**
    - **Endpoint:** `ndvi-majmaah-db.xxxxx.us-east-1.rds.amazonaws.com`
    - **Port:** `5432`
    - **Database name:** `ndvi_majmaah_db`

---

## Step 9: Request ACM Certificate (for HTTPS)

1. Go to **Certificate Manager** → **Request a certificate**
2. **Certificate type:** Request a public certificate
3. **Domain names:**
   - **Fully qualified domain name:** `api.yourdomain.com` (or use ALB DNS name)
   - **Add another domain:** `dashboard.yourdomain.com`
   - **Add another domain:** `ndvi-admin.yourdomain.com`
   - **Validation method:** DNS validation (recommended)
4. Click **"Request"**
5. **Validate domains:**
   - Click on certificate → **Create record in Route 53** (if using Route 53)
   - Or manually add CNAME records to your DNS provider
   - Wait for validation (can take 5-30 minutes)
6. **Note down:** Certificate ARN

**Note:** If you don't have a domain, you can skip this and use ALB DNS name with self-signed cert, or use AWS Certificate Manager with ALB DNS name.

---

## Step 10: Create Application Load Balancer

1. Go to **EC2 Dashboard** → **Load Balancers** → **Create Load Balancer**
2. Select **Application Load Balancer**
3. Configure:
   - **Name:** `ndvi-alb`
   - **Scheme:** Internet-facing
   - **IP address type:** IPv4
   - **VPC:** Select your VPC
   - **Mappings:** Select both availability zones
   - **Subnets:** Select both **public subnets**
   - **Security groups:** Select `ndvi-alb-sg`
4. **Listeners and routing:**
   - **Listener 1:** HTTPS, Port 443
     - **Default action:** Forward to target group
     - **Target group:** Create new target group
       - **Name:** `ndvi-backend-tg`
       - **Target type:** Instances
       - **Protocol:** HTTP
       - **Port:** 3000
       - **VPC:** Your VPC
       - **Health check:**
         - Protocol: HTTP
         - Path: `/api/health` (we'll add this endpoint)
         - Healthy threshold: 2
         - Unhealthy threshold: 2
         - Timeout: 5 seconds
         - Interval: 30 seconds
       - Click **"Next"** → **"Create target group"**
     - **Default SSL certificate:** From ACM → Select your certificate
   - **Listener 2:** HTTP, Port 80
     - **Default action:** Redirect to HTTPS (443)
5. Click **"Create load balancer"**
6. **Wait 2-3 minutes** for ALB to be active
7. **Note down:**
   - **DNS name:** `ndvi-alb-xxxxx.us-east-1.elb.amazonaws.com`
   - **Target Group ARN:** `arn:aws:elasticloadbalancing:...`

---

## Step 11: Create EC2 Instance

1. Go to **EC2 Dashboard** → **Instances** → **Launch instance**
2. **Name:** `ndvi-backend-server`
3. **Application and OS Images:**
   - **AMI:** Amazon Linux 2023 (ARM64) - Free tier eligible
   - **Architecture:** 64-bit (Arm)
4. **Instance type:**
   - **Instance family:** General purpose
   - **Instance type:** `t4g.medium` (2 vCPU, 4 GB RAM)
5. **Key pair:**
   - **Key pair name:** Create new key pair or select existing
   - **Key pair type:** RSA
   - **Private key file format:** `.pem` (for Linux/Mac) or `.ppk` (for PuTTY)
   - **⚠️ Download and save key file securely!**
6. **Network settings:**
   - **VPC:** Select your VPC
   - **Subnet:** Select **public subnet 1**
   - **Auto-assign Public IP:** Enable
   - **Security group:** Select existing → `ndvi-ec2-sg`
   - **Firewall (security groups):** Select `ndvi-ec2-sg`
7. **Configure storage:**
   - **Volume 1 (Root):** 30 GB, gp3, Delete on termination: No
   - **Add new volume:**
     - **Size:** 100 GB
     - **Volume type:** gp3
     - **Device:** `/dev/xvdf`
     - **Delete on termination:** No
     - **Encryption:** Enable
8. **Advanced details:**
   - **IAM instance profile:** Select `ndvi-ec2-role`
   - **User data (optional):** Leave blank (we'll install Docker manually)
9. Click **"Launch instance"**
10. **Wait 2-3 minutes** for instance to be running
11. **Allocate Elastic IP (optional but recommended):**
    - Go to **Elastic IPs** → **Allocate Elastic IP address**
    - **Network border group:** Same as your region
    - Click **"Allocate"**
    - Select Elastic IP → **Actions** → **Associate Elastic IP address**
    - Select your EC2 instance
    - Click **"Associate"**
12. **Note down:**
    - **Instance ID:** `i-xxxxx`
    - **Public IP:** `x.x.x.x`
    - **Private IP:** `x.x.x.x`
    - **Instance State:** Running

---

## Step 12: Attach EC2 to ALB Target Group

1. Go to **EC2 Dashboard** → **Target Groups** → Select `ndvi-backend-tg`
2. Click **"Register targets"**
3. **Instances:**
   - Select your EC2 instance (`ndvi-backend-server`)
   - Port: 3000
4. Click **"Register targets"**
5. **Wait for health check:**
   - Status should change to "healthy" (may take 1-2 minutes)
   - If unhealthy, check security groups and that app is running on port 3000

---

## Step 13: Create CloudFront Distributions

### 13.1 Majmaah Dashboard Distribution

1. Go to **CloudFront** → **Create distribution**
2. **Origin:**
   - **Origin domain:** Select your S3 bucket (`majmaah-dashboard-prod-xxx`)
   - **Origin access:** Use website endpoint (if static hosting enabled)
   - **Origin path:** Leave blank
   - **Name:** Auto-generated
3. **Default cache behavior:**
   - **Viewer protocol policy:** Redirect HTTP to HTTPS
   - **Allowed HTTP methods:** GET, HEAD, OPTIONS
   - **Cache policy:** CachingOptimized
   - **Origin request policy:** None
4. **Settings:**
   - **Price class:** Use all edge locations (or select cheaper option)
   - **Alternate domain names (CNAMEs):** `dashboard.yourdomain.com` (if using custom domain)
   - **SSL certificate:** Select ACM certificate
   - **Default root object:** `index.html`
   - **Custom error responses:**
     - HTTP error code: 403
     - Response page path: `/index.html`
     - HTTP response code: 200
     - Same for 404
5. Click **"Create distribution"**
6. **Wait 10-15 minutes** for distribution to deploy
7. **Note down:** Distribution domain name (e.g., `d1234567890.cloudfront.net`)

### 13.2 NDVI Admin Distribution

1. Repeat Step 13.1 with:
   - **Origin:** `ndvi-admin-prod-xxx` bucket
   - **CNAME:** `ndvi-admin.yourdomain.com`

---

## Step 14: Configure Route 53 (If Using Custom Domains)

1. Go to **Route 53** → **Hosted zones**
2. **Create hosted zone** (if you don't have one)
3. **Create records:**
   - **Type:** A (Alias)
   - **Name:** `api`
   - **Alias:** Yes
   - **Route traffic to:** Alias to Application Load Balancer
   - **Region:** Your region
   - **Load balancer:** Select your ALB
   - Click **"Create records"**
4. Repeat for:
   - `dashboard` → CloudFront distribution (Majmaah)
   - `ndvi-admin` → CloudFront distribution (NDVI Admin)

---

## Step 15: Summary Checklist

After completing all steps, you should have:

- ✅ **VPC:** `vpc-xxxxx` with public and private subnets
- ✅ **Security Groups:** ALB, EC2, RDS
- ✅ **IAM Roles:** EC2 role with permissions
- ✅ **IAM User:** Deployment user with access keys
- ✅ **S3 Buckets:** 3 buckets (2 frontends + 1 imagery)
- ✅ **ECR Repository:** `ndvi-backend`
- ✅ **Secrets Manager:** 4 secrets (RDS password, JWT, GEE, Mapbox)
- ✅ **RDS:** PostgreSQL database running
- ✅ **ACM Certificate:** SSL certificate (if using custom domain)
- ✅ **ALB:** Application Load Balancer with target group
- ✅ **EC2:** Instance running with 2 volumes
- ✅ **CloudFront:** 2 distributions for frontends
- ✅ **Route 53:** DNS records (if using custom domains)

---

## Step 16: Document All Details

Create a document with all the information you'll need:

```markdown
# AWS Infrastructure Details

## VPC
- VPC ID: vpc-xxxxx
- Public Subnets: subnet-xxxxx, subnet-yyyyy
- Private Subnets: subnet-zzzzz, subnet-wwwww

## EC2
- Instance ID: i-xxxxx
- Public IP: x.x.x.x
- Private IP: x.x.x.x
- Security Group: sg-xxxxx
- IAM Role: arn:aws:iam::123456789012:role/ndvi-ec2-role
- SSH Key: [key-name].pem

## RDS
- Endpoint: ndvi-majmaah-db.xxxxx.us-east-1.rds.amazonaws.com
- Port: 5432
- Database: ndvi_majmaah_db
- Username: postgres
- Password: [from Secrets Manager]
- Security Group: sg-xxxxx

## ALB
- DNS: ndvi-alb-xxxxx.us-east-1.elb.amazonaws.com
- Target Group: ndvi-backend-tg
- Security Group: sg-xxxxx

## S3
- Majmaah Dashboard: majmaah-dashboard-prod-xxx
- NDVI Admin: ndvi-admin-prod-xxx
- Satellite Imagery: satellite-imagery-prod-xxx

## CloudFront
- Majmaah: d1234567890.cloudfront.net
- NDVI Admin: d0987654321.cloudfront.net

## ECR
- Repository: 123456789012.dkr.ecr.us-east-1.amazonaws.com/ndvi-backend

## Secrets Manager
- RDS Password: arn:aws:secretsmanager:...:secret:ndvi/rds/password
- JWT Secret: arn:aws:secretsmanager:...:secret:ndvi/jwt/secret
- GEE Credentials: arn:aws:secretsmanager:...:secret:ndvi/gee/credentials
- Mapbox Token: arn:aws:secretsmanager:...:secret:ndvi/mapbox/token

## IAM
- EC2 Role: arn:aws:iam::123456789012:role/ndvi-ec2-role
- Deployment User: ndvi-deployment-user
- Access Key ID: [from CSV file]
- Secret Access Key: [from CSV file]
```

---

## Next Steps (After Provisioning)

Once all infrastructure is provisioned:

1. **Test EC2 SSH access**
2. **Install Docker on EC2**
3. **Connect to RDS** and run migrations
4. **Build and push Docker image** to ECR
5. **Deploy application** on EC2
6. **Upload frontend builds** to S3
7. **Test all endpoints**

---

## Cost Monitoring

1. Go to **AWS Cost Management** → **Cost Explorer**
2. Set up **budget alerts:**
   - Budget: $100/month
   - Alert at: 80% ($80)
   - Alert at: 100% ($100)

---

## Troubleshooting Tips

**EC2 can't connect to RDS:**
- Check RDS security group allows EC2 security group
- Check RDS is in private subnet
- Verify security group IDs are correct

**ALB health checks failing:**
- Check EC2 security group allows ALB security group
- Verify application is running on port 3000
- Check `/api/health` endpoint exists

**CloudFront not loading:**
- Check S3 bucket static website hosting is enabled
- Verify bucket policy allows CloudFront access
- Check error pages are configured (404 → index.html)

**Can't SSH into EC2:**
- Check security group allows SSH from your IP
- Verify key pair is correct
- Check instance is in public subnet with public IP

---

## Estimated Total Cost

- EC2 t4g.medium: ~$30-40/month
- EBS Storage (130 GB): ~$10-12/month
- RDS db.t4g.small: ~$30-40/month
- ALB: ~$20/month
- S3: ~$5-15/month
- CloudFront: ~$5-10/month
- Secrets Manager: ~$1-2/month
- **Total: ~$60-80/month**

---

**Good luck with your deployment!** 🚀

