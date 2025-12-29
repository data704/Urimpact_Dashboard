# ✅ Frontend Deployment Checklist

Complete checklist for deploying both frontends to AWS after backend deployment.

---

## 🎯 Current Status

✅ **Backend Deployed:** Your backend is running on EC2  
✅ **Code Updated:** All hardcoded API URLs fixed  
⏳ **Next:** Deploy frontends to S3 + CloudFront

---

## 📋 Step-by-Step Checklist

### Step 1: Get Your Backend API URL

**Option A: Direct EC2 IP (Current Setup)**

1. Go to **AWS Console → EC2 → Instances**
2. Find your instance
3. Copy **Public IPv4 address** (e.g., `3.123.45.67`)
4. Your API URL: `http://3.123.45.67:3000/api`

**Option B: Application Load Balancer (If you have one)**

1. Go to **AWS Console → EC2 → Load Balancers**
2. Copy **DNS name** (e.g., `ndvi-alb-123456789.eu-central-1.elb.amazonaws.com`)
3. Your API URL: `http://ndvi-alb-123456789.eu-central-1.elb.amazonaws.com/api`

**Option C: Custom Domain (If configured)**

- Your API URL: `https://api.yourdomain.com/api`

---

### Step 2: Get Your CloudFront Distribution IDs

1. Go to **AWS Console → CloudFront → Distributions**
2. Find your distributions (one for NDVI Calculator, one for Majmaah Dashboard)
3. Copy **Distribution ID** (e.g., `E1234567890ABC`)
4. Copy **Domain name** (e.g., `d1234567890abc.cloudfront.net`)

---

### Step 3: Configure GitHub Secrets

Go to **GitHub → Settings → Secrets and variables → Actions → New repository secret**

Add these secrets:

#### ✅ Required Secrets:

1. **`VITE_API_BASE_URL`**
   - Value: Your backend API URL from Step 1
   - Example: `http://3.123.45.67:3000/api`
   - ⚠️ **Important:** Include `/api` at the end!

2. **`VITE_MAPBOX_ACCESS_TOKEN`**
   - Value: Your Mapbox access token
   - Get from: https://account.mapbox.com/access-tokens/

3. **`S3_BUCKET_NDVI`**
   - Value: Your S3 bucket name for NDVI Calculator
   - Example: `ndvi-admin-prod-xxx`

4. **`S3_BUCKET_MAJMAAH`**
   - Value: Your S3 bucket name for Majmaah Dashboard
   - Example: `majmaah-dashboard-prod-xxx`

5. **`CLOUDFRONT_DISTRIBUTION_ID_NDVI`**
   - Value: CloudFront distribution ID for NDVI Calculator
   - Example: `E1234567890ABC`

6. **`CLOUDFRONT_DISTRIBUTION_ID_MAJMAAH`**
   - Value: CloudFront distribution ID for Majmaah Dashboard
   - Example: `E0987654321XYZ`

7. **`CORS_ORIGINS`** ⚠️ **CRITICAL**
   - Value: CloudFront domain names (comma-separated, no spaces)
   - Format: `https://d1234567890abc.cloudfront.net,https://d0987654321xyz.cloudfront.net`
   - Get from Step 2 (CloudFront Domain names)

---

### Step 4: Update Backend CORS (If Not Done)

The backend deployment workflow now includes CORS_ORIGINS. If you haven't added it to GitHub secrets yet:

1. Add `CORS_ORIGINS` secret (see Step 3)
2. The next backend deployment will automatically use it
3. Or manually redeploy backend to apply CORS changes

---

### Step 5: Deploy Frontends

**Automatic Deployment (Recommended):**

1. **Commit the code changes:**
   ```bash
   git add .
   git commit -m "Update API URLs for production deployment"
   git push origin main
   ```

2. **GitHub Actions will automatically:**
   - Build both frontends with production API URL
   - Deploy to S3
   - Invalidate CloudFront cache

3. **Monitor deployment:**
   - Go to **GitHub → Actions** tab
   - Watch the workflows run
   - Check for any errors

**Manual Deployment (If needed):**

See the GitHub Actions workflow files for manual steps.

---

### Step 6: Verify Deployment

#### ✅ Check Backend Health:

```bash
# Replace with your EC2 IP
curl http://YOUR_EC2_IP:3000/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"...","uptime":123.45,"environment":"production"}
```

#### ✅ Check Frontend Deployment:

1. **Visit CloudFront URLs:**
   - NDVI Calculator: `https://YOUR_CLOUDFRONT_ID_NDVI.cloudfront.net`
   - Majmaah Dashboard: `https://YOUR_CLOUDFRONT_ID_MAJMAAH.cloudfront.net`

2. **Open Browser Console (F12):**
   - Check **Network** tab
   - Verify API calls go to your AWS backend
   - Look for any CORS errors

3. **Test Functionality:**
   - Try logging in
   - Make API calls
   - Verify data loads correctly

---

## 🐛 Troubleshooting

### CORS Errors:

**Symptoms:** Browser console shows CORS errors

**Fix:**
1. Verify `CORS_ORIGINS` GitHub secret includes your CloudFront domains
2. Check backend logs: `docker logs ndvi-backend` (on EC2)
3. Verify backend is running: `curl http://YOUR_EC2_IP:3000/api/health`
4. Redeploy backend if CORS_ORIGINS was just added

### API Connection Errors:

**Symptoms:** Frontend can't connect to backend

**Fix:**
1. Verify `VITE_API_BASE_URL` is correct in GitHub secrets
2. Check EC2 security group allows traffic on port 3000
3. Verify backend container is running: `docker ps | grep ndvi-backend` (on EC2)
4. Test API directly: `curl http://YOUR_EC2_IP:3000/api/health`

### Frontend Not Loading:

**Symptoms:** CloudFront shows error or blank page

**Fix:**
1. Check CloudFront distribution status (should be "Deployed")
2. Verify S3 bucket has files: `aws s3 ls s3://YOUR_BUCKET_NAME`
3. Check CloudFront invalidation completed
4. Clear browser cache and try again

---

## 📝 Quick Reference

### Your Backend:
- **URL:** `http://YOUR_EC2_IP:3000/api`
- **Health Check:** `http://YOUR_EC2_IP:3000/api/health`

### Your Frontends:
- **NDVI Calculator:** `https://YOUR_CLOUDFRONT_ID_NDVI.cloudfront.net`
- **Majmaah Dashboard:** `https://YOUR_CLOUDFRONT_ID_MAJMAAH.cloudfront.net`

### GitHub Secrets Needed:
- `VITE_API_BASE_URL` = `http://YOUR_EC2_IP:3000/api`
- `VITE_MAPBOX_ACCESS_TOKEN` = Your Mapbox token
- `S3_BUCKET_NDVI` = Your S3 bucket name
- `S3_BUCKET_MAJMAAH` = Your S3 bucket name
- `CLOUDFRONT_DISTRIBUTION_ID_NDVI` = Your CloudFront ID
- `CLOUDFRONT_DISTRIBUTION_ID_MAJMAAH` = Your CloudFront ID
- `CORS_ORIGINS` = `https://d1234567890abc.cloudfront.net,https://d0987654321xyz.cloudfront.net`

---

## ✅ Summary

1. ✅ Get backend API URL (EC2 IP or ALB)
2. ✅ Get CloudFront distribution IDs and domains
3. ✅ Add all GitHub secrets
4. ✅ Push code to trigger deployment
5. ✅ Verify deployment works

**Once all secrets are configured, just push to main and deployment happens automatically!** 🚀

---

**Need Help?** Check [FRONTEND_DEPLOYMENT_GUIDE.md](./FRONTEND_DEPLOYMENT_GUIDE.md) for detailed instructions.

