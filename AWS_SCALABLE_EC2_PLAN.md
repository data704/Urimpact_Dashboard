# Scalable EC2 Deployment Plan - Future-Ready Architecture

## Overview

This plan is designed to start cost-effectively but scale easily for:
- High-resolution satellite imagery processing
- GeoServer integration
- Advanced analytics
- Multiple concurrent users
- Large dataset storage

---

## Phase 1: Initial Deployment (~$60-80/month)

### Current Requirements
- Backend API (Node.js)
- PostgreSQL database
- 2 React frontends
- Basic NDVI analysis

### Infrastructure

#### EC2 Instance
**Instance:** `t4g.medium` (2 vCPU, 4 GB RAM)
**Cost:** ~$30-40/month

**Why t4g.medium instead of t4g.small:**
- ✅ More RAM (4 GB) for future image processing
- ✅ Better performance for concurrent requests
- ✅ Room to grow without immediate upgrade
- ✅ Only ~$15-20 more than t4g.small

**Storage:**
- **Root Volume:** 30 GB gp3 (for OS, Docker, applications)
- **Data Volume:** 100 GB gp3 (for satellite imagery cache, GeoServer data)
- **Total Storage Cost:** ~$10-12/month

**Networking:**
- Public subnet (no NAT Gateway needed)
- Elastic IP (for static IP)
- Security Group: Allow inbound from ALB only

#### RDS PostgreSQL
**Instance:** `db.t4g.small` (2 vCPU, 2 GB RAM)
**Cost:** ~$30-40/month

**Storage:** 100 GB gp3 (with auto-scaling)
**Why:** More headroom for future data growth

#### Other Services
- ALB: $20/month
- S3 + CloudFront: $5-10/month
- **Total Phase 1: ~$60-80/month**

---

## Phase 2: Add GeoServer (~$100-120/month)

### Additional Infrastructure

#### Separate EC2 for GeoServer (Recommended)
**Instance:** `t4g.medium` (2 vCPU, 4 GB RAM)
**Cost:** ~$30-40/month

**Why separate instance:**
- ✅ Isolates GeoServer workload
- ✅ Can scale independently
- ✅ Better performance
- ✅ Easier to manage

**Storage:**
- **GeoServer Data:** 200 GB gp3 (for raster/vector data)
- **Cost:** ~$20/month

**Alternative:** Run GeoServer on same EC2 (saves $30-40/month but less scalable)

#### S3 for Satellite Imagery Storage
**Bucket:** `satellite-imagery-prod`
**Storage Class:** 
- Standard for frequently accessed
- Glacier for archival (cheaper)
**Estimated:** 500 GB - 1 TB initially
**Cost:** ~$10-20/month (depends on access patterns)

#### Updated Total: ~$100-120/month

---

## Phase 3: High-Resolution Processing (~$150-200/month)

### Enhanced Infrastructure

#### EC2 for Image Processing
**Option A: Upgrade existing EC2**
- Upgrade to `t4g.large` (2 vCPU, 8 GB RAM)
- Cost: ~$60-80/month
- **OR**

**Option B: Separate processing instance**
- New `t4g.large` instance for heavy processing
- Keep API on `t4g.medium`
- Cost: ~$60-80/month additional

**Storage:**
- Increase EBS volumes to 500 GB
- Add S3 for processed imagery storage
- Cost: ~$30-40/month additional

#### RDS Upgrade
**Upgrade to:** `db.t4g.medium` (2 vCPU, 4 GB RAM)
**Cost:** ~$60-80/month

**Storage:** Increase to 200 GB
**Cost:** ~$5-10/month additional

#### Updated Total: ~$150-200/month

---

## Phase 4: Production Scale (~$250-350/month)

### Full Production Setup

#### Multiple EC2 Instances
- **API Server:** `t4g.large` (2 vCPU, 8 GB RAM) - $60-80/month
- **GeoServer:** `t4g.large` (2 vCPU, 8 GB RAM) - $60-80/month
- **Image Processing Worker:** `t4g.xlarge` (4 vCPU, 16 GB RAM) - $120-160/month
- **Total EC2:** ~$240-320/month

#### RDS
- **Instance:** `db.m6g.large` (2 vCPU, 8 GB RAM) - $120-150/month
- **Storage:** 500 GB - $50/month
- **Read Replica:** Optional for heavy read workloads

#### Storage
- **S3:** 2-5 TB satellite imagery - $40-100/month
- **EBS:** 1 TB total across instances - $100/month

#### Load Balancing
- **ALB:** $20/month
- **Multiple target groups** for different services

#### Updated Total: ~$250-350/month

---

## Recommended Starting Configuration

### EC2 Instance Specifications

**Instance Type:** `t4g.medium`
- **vCPU:** 2
- **RAM:** 4 GB
- **Network:** Up to 5 Gbps
- **Cost:** ~$30-40/month

**Storage Configuration:**
```
/dev/xvda (Root): 30 GB gp3
  - OS, Docker, applications
  - Cost: ~$3/month

/dev/xvdf (Data): 100 GB gp3
  - Satellite imagery cache
  - GeoServer data directory
  - Temporary processing files
  - Cost: ~$10/month
```

**Why this configuration:**
- ✅ Enough RAM for image processing
- ✅ Sufficient storage for initial imagery
- ✅ Can handle GeoServer
- ✅ Room to grow
- ✅ Cost-effective (~$40-50/month for EC2)

---

## Storage Strategy for Satellite Imagery

### Tiered Storage Approach

#### Tier 1: EBS (Fast Access)
**Purpose:** Active processing, frequently accessed imagery
**Size:** 100-500 GB
**Cost:** ~$10-50/month
**Use Case:** Current analysis, GeoServer layers

#### Tier 2: S3 Standard (Active Archive)
**Purpose:** Recent imagery, moderate access
**Size:** 500 GB - 2 TB
**Cost:** ~$10-40/month
**Use Case:** Last 6-12 months of imagery

#### Tier 3: S3 Glacier (Long-term Archive)
**Purpose:** Historical imagery, rare access
**Size:** Unlimited
**Cost:** ~$1-5/month per TB
**Use Case:** Older than 12 months

**Total Storage Cost:** ~$20-100/month (depends on data volume)

---

## GeoServer Deployment Options

### Option 1: Separate EC2 Instance (Recommended)
**Instance:** `t4g.medium` (2 vCPU, 4 GB RAM)
**Cost:** ~$30-40/month

**Pros:**
- ✅ Isolated workload
- ✅ Independent scaling
- ✅ Better performance
- ✅ Easier troubleshooting

**Cons:**
- ⚠️ Additional cost

### Option 2: Same EC2 Instance
**Cost:** $0 additional

**Pros:**
- ✅ No extra cost
- ✅ Simpler setup

**Cons:**
- ⚠️ Shared resources
- ⚠️ May need upgrade sooner
- ⚠️ Less scalable

**Recommendation:** Start with Option 2, move to Option 1 when needed

---

## Network Architecture

```
Internet
   ↓
ALB (Public Subnet)
   ↓
EC2 API Server (Public Subnet) ← Backend API
   ├──→ RDS (Private Subnet) ← Database
   ├──→ S3 ← Satellite Imagery Storage
   └──→ GeoServer (Same or Separate EC2)
```

**Security Groups:**
- **ALB SG:** Allow HTTPS (443) from internet
- **EC2 SG:** Allow inbound from ALB only (port 3000)
- **RDS SG:** Allow inbound from EC2 SG only (port 5432)
- **GeoServer SG:** Allow inbound from EC2 SG only (port 8080)

---

## Auto-Scaling Strategy

### EC2 Auto Scaling Group (Future)

**When to implement:**
- When traffic is unpredictable
- When processing workloads spike
- When you have multiple instances

**Configuration:**
- **Min:** 1 instance
- **Desired:** 1-2 instances
- **Max:** 4 instances
- **Scale on:** CPU > 70%, Memory > 80%

**Cost:** Pay only for instances running

---

## Cost Breakdown by Phase

| Phase | EC2 | RDS | Storage | ALB | S3/CF | Total |
|-------|-----|-----|---------|-----|-------|-------|
| **Phase 1** (Current) | $30-40 | $30-40 | $10-12 | $20 | $5-10 | **~$60-80** |
| **Phase 2** (+GeoServer) | $60-80 | $30-40 | $30-40 | $20 | $15-30 | **~$100-120** |
| **Phase 3** (+High-Res) | $90-120 | $60-80 | $50-70 | $20 | $30-50 | **~$150-200** |
| **Phase 4** (Production) | $240-320 | $120-150 | $150-200 | $20 | $50-100 | **~$250-350** |

---

## Recommended Starting Plan

### Infrastructure to Provision

#### EC2 Instance
- **Type:** `t4g.medium` (2 vCPU, 4 GB RAM)
- **AMI:** Amazon Linux 2023 (ARM64)
- **Storage:**
  - Root: 30 GB gp3
  - Data: 100 GB gp3 (for imagery/GeoServer)
- **Subnet:** Public subnet
- **Security Group:** Allow inbound from ALB only
- **IAM Role:** Secrets Manager, S3, CloudWatch access

#### RDS PostgreSQL
- **Instance:** `db.t4g.small` (2 vCPU, 2 GB RAM)
- **Storage:** 100 GB gp3 (auto-scaling enabled)
- **Subnet:** Private subnet
- **Multi-AZ:** No (can enable later)

#### S3 Buckets
- **satellite-imagery-prod** - For high-res imagery storage
- **majmaah-dashboard-prod** - Frontend hosting
- **ndvi-admin-prod** - Frontend hosting

#### Application Load Balancer
- Internet-facing
- HTTPS with ACM certificate
- Target group for EC2

#### CloudFront Distributions
- 2 distributions for frontends

**Total Initial Cost: ~$60-80/month**

---

## Future Scaling Path

### Easy Upgrades (No Downtime)

1. **EC2 Instance Upgrade:**
   - t4g.medium → t4g.large → t4g.xlarge
   - Can be done with instance replacement (minimal downtime)
   - Or add second instance behind ALB

2. **RDS Upgrade:**
   - db.t4g.small → db.t4g.medium → db.m6g.large
   - Can be done with zero-downtime modification

3. **Storage Expansion:**
   - EBS volumes can be expanded online
   - S3 scales automatically

4. **Add More Instances:**
   - Add GeoServer instance when needed
   - Add processing workers for heavy workloads
   - Use Auto Scaling Groups

---

## GeoServer Specific Considerations

### Storage Requirements
- **Raster Data:** 10-100 GB per project area
- **Vector Data:** 1-10 GB per project area
- **Style Files:** Minimal (< 1 GB)
- **Cache:** 50-200 GB (for tile cache)

### Performance Requirements
- **CPU:** 2+ vCPU recommended
- **RAM:** 4+ GB recommended
- **Storage:** Fast SSD (gp3) for cache

### Deployment Options
1. **Docker Container** on same EC2 (start here)
2. **Separate EC2** (when traffic increases)
3. **ECS Fargate** (if you want managed service)

---

## Monitoring & Optimization

### CloudWatch Metrics to Monitor
- EC2 CPU utilization
- EC2 Memory utilization
- EC2 Network I/O
- RDS CPU/Memory/Connections
- EBS IOPS and throughput
- ALB request count and latency

### Cost Optimization Tips
1. **Use S3 lifecycle policies** - Move old imagery to Glacier
2. **Right-size instances** - Monitor and adjust
3. **Use Spot Instances** - For non-critical processing (optional)
4. **Reserved Instances** - If committing to 1-year (save 30-40%)

---

## Summary

**Recommended Starting Configuration:**
- **EC2:** t4g.medium (4 GB RAM) - $30-40/month
- **RDS:** db.t4g.small (2 GB RAM) - $30-40/month
- **Storage:** 130 GB total (30 + 100) - $10-12/month
- **ALB:** $20/month
- **S3/CloudFront:** $5-10/month
- **Total: ~$60-80/month**

**Why this works for future:**
- ✅ Enough RAM for image processing
- ✅ Sufficient storage for initial imagery
- ✅ Can handle GeoServer
- ✅ Easy to scale up (upgrade instance types)
- ✅ Can add more instances when needed
- ✅ Cost-effective starting point

**Scaling Path:**
- Phase 1: Single EC2 (current needs)
- Phase 2: Add GeoServer (same or separate EC2)
- Phase 3: Upgrade instances for high-res processing
- Phase 4: Multiple instances, read replicas, auto-scaling



