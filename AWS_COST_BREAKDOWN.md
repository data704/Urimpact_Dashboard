# AWS Cost Breakdown & Optimization Options

## Current Cost Estimate: ~$150-180/month

### Cost Breakdown (US East Region)

| Service | Monthly Cost | Why This Cost? | Can We Reduce? |
|---------|-------------|----------------|----------------|
| **NAT Gateway** | **$35** | Fixed cost for ECS tasks to access internet (GEE API) | ⚠️ Hard to avoid |
| **ECS Fargate** (2 tasks × 1 vCPU, 2 GB) | **$50-60** | Compute for backend API | ✅ Yes - can reduce |
| **RDS PostgreSQL** (db.t4g.small) | **$30-40** | Database server | ✅ Yes - can start smaller |
| **Application Load Balancer** | **$20** | Fixed cost for load balancing | ⚠️ Needed for HTTPS/SSL |
| **CloudFront** | **$5-10** | CDN for frontends (depends on traffic) | ✅ Minimal |
| **S3 Storage** | **$1-2** | Storage for frontend files | ✅ Very cheap |
| **Data Transfer** | **$5-10** | Outbound data | ✅ Depends on usage |
| **Total** | **~$150-180** | | |

---

## Why Costs Are High

### 1. NAT Gateway ($35/month) - **BIGGEST COST DRIVER**
**Why:** ECS tasks need internet access to call Google Earth Engine API. NAT Gateway is required for private subnet resources to access internet.

**Options to reduce:**
- ❌ Can't eliminate (needed for GEE API calls)
- ✅ **Use NAT Instance instead** (~$5-10/month) - Less reliable but much cheaper
- ✅ **Use VPC endpoints** - Only if GEE API supports it (unlikely)

### 2. ECS Fargate ($50-60/month)
**Why:** Running 2 tasks for redundancy, each with 1 vCPU and 2 GB RAM.

**Options to reduce:**
- ✅ **Start with 1 task** instead of 2: Save ~$25-30/month
- ✅ **Reduce to 0.5 vCPU, 1 GB RAM**: Save ~$15-20/month
- ✅ **Use EC2 instead of Fargate**: Can be cheaper but requires server management

### 3. RDS PostgreSQL ($30-40/month)
**Why:** db.t4g.small is the smallest production-ready instance.

**Options to reduce:**
- ✅ **Start with db.t4g.micro** (1 vCPU, 1 GB): ~$15-20/month
- ⚠️ May need to upgrade later as data grows

### 4. Application Load Balancer ($20/month)
**Why:** Fixed cost for load balancing and SSL termination.

**Options to reduce:**
- ❌ Can't eliminate (needed for HTTPS)
- ✅ **Use single ALB for multiple services** (already doing this)

---

## Optimized Cost Estimate

### Option 1: Cost-Optimized (Starting Point)
**Total: ~$75-90/month**

| Service | Optimized Cost |
|---------|---------------|
| NAT Gateway | $35 (or NAT Instance: $5-10) |
| ECS Fargate (1 task × 0.5 vCPU, 1 GB) | $15-20 |
| RDS PostgreSQL (db.t4g.micro) | $15-20 |
| ALB | $20 |
| CloudFront | $5-10 |
| S3 | $1-2 |
| **Total** | **~$75-90/month** |

**Trade-offs:**
- ⚠️ Single ECS task (no redundancy) - can add second task later
- ⚠️ Smaller database (may need upgrade)
- ⚠️ Less compute power (may need to scale up)

### Option 2: Balanced (Recommended)
**Total: ~$100-120/month**

| Service | Balanced Cost |
|---------|--------------|
| NAT Gateway | $35 |
| ECS Fargate (1 task × 1 vCPU, 2 GB) | $25-30 |
| RDS PostgreSQL (db.t4g.small) | $30-40 |
| ALB | $20 |
| CloudFront | $5-10 |
| S3 | $1-2 |
| **Total** | **~$100-120/month** |

**Trade-offs:**
- ✅ Single task but more resources
- ✅ Better database performance
- ⚠️ Can add second task when traffic increases

### Option 3: Production (Current Estimate)
**Total: ~$150-180/month**

- 2 ECS tasks for redundancy
- Larger database
- More compute resources

---

## Cost Optimization Strategies

### Immediate Savings

1. **Start with 1 ECS task** → Save $25-30/month
   - Add second task when you have real users
   - Can scale up in minutes

2. **Use db.t4g.micro initially** → Save $15-20/month
   - Upgrade to db.t4g.small when needed
   - RDS allows easy scaling

3. **Reduce ECS task size** → Save $15-20/month
   - Start with 0.5 vCPU, 1 GB RAM
   - Monitor and scale up if needed

4. **Use NAT Instance instead of NAT Gateway** → Save $25-30/month
   - Less reliable but much cheaper
   - Can upgrade to NAT Gateway later

**Total potential savings: ~$75-100/month**

### Long-term Savings

1. **Reserved Instances** (1-year commitment)
   - RDS: Save ~30-40%
   - ECS: Not applicable (Fargate doesn't support RIs)

2. **Spot Instances** (for non-critical workloads)
   - Not recommended for production API

3. **Right-sizing**
   - Monitor CloudWatch metrics
   - Scale down if resources are underutilized

---

## Recommended Approach

### Phase 1: Start Small (~$75-90/month)
- 1 ECS task (0.5 vCPU, 1 GB RAM)
- db.t4g.micro database
- NAT Gateway (or NAT Instance if budget is tight)
- Single ALB
- S3 + CloudFront

**Why:** Validate the application works, test performance, monitor usage.

### Phase 2: Scale Up (~$100-120/month)
- Upgrade to 1 vCPU, 2 GB RAM ECS task
- Upgrade to db.t4g.small database
- Keep single task (add second when traffic increases)

**When:** After testing, when you have real users.

### Phase 3: Production (~$150-180/month)
- 2 ECS tasks for redundancy
- db.t4g.small or larger
- Full monitoring and alerts

**When:** When you have significant traffic/users.

---

## Alternative: Use Elastic Beanstalk Instead

**Cost: ~$50-70/month** (much cheaper!)

**Why cheaper:**
- No NAT Gateway needed (can use public subnets)
- Simpler architecture
- Built-in load balancer (included)

**Trade-offs:**
- Less flexible than ECS
- Still need RDS (~$30-40/month)
- Still need S3 + CloudFront (~$5-10/month)

**Total: ~$85-120/month**

---

## Summary

**Current estimate is high because:**
1. NAT Gateway ($35) - Required for private subnet internet access
2. 2 ECS tasks ($50-60) - Redundancy costs
3. Production-grade database ($30-40) - Better performance

**You can reduce to ~$75-90/month by:**
- Starting with 1 ECS task
- Using smaller database instance
- Using NAT Instance instead of NAT Gateway

**Recommendation:** Start with Option 1 (~$75-90/month), then scale up as needed. AWS makes it easy to upgrade without downtime.



