# 🚀 Frontend Deployment Guide

Complete guide for deploying both frontends to AWS S3 + CloudFront after backend deployment.

---

## ✅ Backend Deployment Status

Your backend is successfully deployed! 🎉

- **Backend URL:** `http://YOUR_EC2_IP:3000/api` or `http://YOUR_ALB_URL/api`
- **Health Check:** Working ✅

---

## 📋 Step 1: Get Your Backend API URL

You need to determine your backend API URL. You have two options:

### Option A: Direct EC2 Access (Current Setup)

1. **Get EC2 Public IP:**
   ```bash
   # From AWS Console: EC2 → Instances → Select your instance → Public IPv4 address
   # Or from CLI:
   aws ec2 describe-instances --instance-ids YOUR_INSTANCE_ID --query 'Reservations[0].Instances[0].PublicIpAddress' --output text
   ```

2. **Your API URL will be:**
   ```
   http://YOUR_EC2_IP:3000/api
   ```
   Example: `http://3.123.45.67:3000/api`

### Option B: Application Load Balancer (Recommended for Production)

If you have an ALB set up:

1. **Get ALB DNS name:**
   - AWS Console → EC2 → Load Balancers
   - Copy the DNS name (e.g., `ndvi-alb-123456789.eu-central-1.elb.amazonaws.com`)

2. **Your API URL will be:**
   ```
   http://YOUR_ALB_DNS/api
   ```
   Or with HTTPS (if SSL configured):
   ```
   https://YOUR_ALB_DNS/api
   ```

### Option C: Custom Domain (Best for Production)

If you have a custom domain:

```
https://api.yourdomain.com/api
```

---

## 🔧 Step 2: Update NDVI Calculator to Use Environment Variables

The NDVI Calculator has some hardcoded API URLs. We need to fix them:

### Files to Update:

1. **`ndvi-calculatorr/client/src/context/AuthContext.tsx`**
2. **`ndvi-calculatorr/client/src/components/NDVIViewer/index.tsx`**
3. **`ndvi-calculatorr/client/src/components/BaselineAssessment/index.tsx`**

Let me create the fixes for you.

---

## 🔐 Step 3: Configure GitHub Secrets

Add these secrets to GitHub (Settings → Secrets and variables → Actions):

### Required Secrets:

1. **`VITE_API_BASE_URL`** - Your backend API URL
   - Example: `http://3.123.45.67:3000/api` (EC2 IP)
   - Or: `https://api.yourdomain.com/api` (Custom domain)
   - Or: `http://ndvi-alb-123456789.eu-central-1.elb.amazonaws.com/api` (ALB)

2. **`VITE_MAPBOX_ACCESS_TOKEN`** - Your Mapbox token
   - Get from: https://account.mapbox.com/access-tokens/

3. **`S3_BUCKET_NDVI`** - S3 bucket name for NDVI Calculator
   - Example: `ndvi-admin-prod-xxx`

4. **`S3_BUCKET_MAJMAAH`** - S3 bucket name for Majmaah Dashboard
   - Example: `majmaah-dashboard-prod-xxx`

5. **`CLOUDFRONT_DISTRIBUTION_ID_NDVI`** - CloudFront distribution ID
   - Example: `E1234567890ABC`

6. **`CLOUDFRONT_DISTRIBUTION_ID_MAJMAAH`** - CloudFront distribution ID
   - Example: `E0987654321XYZ`

7. **`CORS_ORIGINS`** - CloudFront domains (comma-separated)
   - Example: `https://d1234567890abc.cloudfront.net,https://d0987654321xyz.cloudfront.net`

---

## 🌐 Step 4: Update Backend CORS Configuration

Your backend needs to allow requests from CloudFront domains.

### Update GitHub Secret:

Add `CORS_ORIGINS` secret with your CloudFront domains:

```
https://d1234567890abc.cloudfront.net,https://d0987654321xyz.cloudfront.net
```

Then update the backend deployment to use this:

1. Go to `.github/workflows/deploy-backend.yml`
2. Find the `docker run` command
3. Make sure `-e CORS_ORIGINS="${{ secrets.CORS_ORIGINS }}"` is included
4. Redeploy backend (or it will auto-update on next push)

---

## 🚀 Step 5: Deploy Frontends

### Automatic Deployment (Recommended):

1. **Fix hardcoded API URLs** (see fixes below)
2. **Commit and push:**
   ```bash
   git add .
   git commit -m "Update API URLs for production deployment"
   git push origin main
   ```
3. **GitHub Actions will automatically:**
   - Build both frontends with production API URL
   - Deploy to S3
   - Invalidate CloudFront cache

### Manual Deployment:

See the GitHub Actions workflows for manual deployment steps.

---

## 🔧 Required Code Fixes

I'll create the fixes for hardcoded API URLs in the next step.

---

## ✅ Verification

After deployment:

1. **Visit CloudFront URLs** in browser
2. **Open browser console** (F12)
3. **Check Network tab** - API calls should go to your AWS backend
4. **Verify no CORS errors**

---

## 🐛 Troubleshooting

### CORS Errors:

- Verify `CORS_ORIGINS` includes your CloudFront domains
- Check backend logs: `docker logs ndvi-backend`
- Verify backend is running: `curl http://YOUR_EC2_IP:3000/api/health`

### API Connection Errors:

- Verify `VITE_API_BASE_URL` is correct in GitHub secrets
- Check EC2 security group allows traffic on port 3000
- Verify backend container is running: `docker ps | grep ndvi-backend`

### Frontend Not Loading:

- Check CloudFront distribution status
- Verify S3 bucket has files
- Check CloudFront invalidation completed

---

**Next:** I'll create the code fixes for hardcoded API URLs.

