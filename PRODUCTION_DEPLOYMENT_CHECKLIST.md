# 🚀 Production Deployment Checklist

Complete checklist for deploying your code changes to production.

---

## ✅ Pre-Deployment Verification

### 1. Code Changes Summary

**✅ Safe to Deploy (Code Changes):**
- ✅ Fixed EVI calculation (band scaling) - **Production Ready**
- ✅ Fixed database overflow (NDVI/EVI clamping) - **Production Ready**
- ✅ Updated map centers to Majmaah University - **Production Ready**
- ✅ Fixed database SSL configuration - **Production Ready**
- ✅ Fixed secrets initialization logic - **Production Ready**

**⚠️ Local Development Only (NOT in Git):**
- ✅ `.env` files - **Gitignored, won't be pushed**
- ✅ Local database credentials - **Gitignored**

---

## 🔒 Environment Variables Status

### Local Development (`.env` files - Gitignored)
- ✅ `DB_HOST=localhost` - Local only
- ✅ `DB_SSL=false` - Local only
- ✅ `NODE_ENV=development` - Local only

### Production (GitHub Actions + Docker)
- ✅ `NODE_ENV=production` - Set in workflow
- ✅ `DB_HOST=ndvi-majmaah-db.c9quck2ekoks.eu-central-1.rds.amazonaws.com` - Set in workflow
- ✅ `DB_SSL=true` - **NEEDS VERIFICATION** (should be set automatically by code)
- ✅ All secrets from AWS Secrets Manager - Set in workflow

---

## 🔍 Critical Production Settings to Verify

### 1. Database SSL Configuration

**Check:** `ndvi-calculatorr/server/src/config/database.js`

The code should automatically use SSL in production:
```javascript
ssl: process.env.DB_SSL === 'true'
  ? { rejectUnauthorized: false }
  : false,
```

**⚠️ IMPORTANT:** The GitHub Actions workflow doesn't explicitly set `DB_SSL=true`. We need to add it!

---

## 📝 Required Changes Before Deployment

### 1. Add DB_SSL=true to Production Deployment

**File:** `.github/workflows/deploy-backend.yml`

**Add this line to the `docker run` command:**
```yaml
-e DB_SSL=true \
```

**Location:** Around line 155, add it after `-e DB_PASSWORD`

---

## 🚀 Deployment Steps

### Step 1: Update GitHub Actions Workflow

1. **Open:** `.github/workflows/deploy-backend.yml`
2. **Find:** The `docker run` command (around line 139)
3. **Add:** `-e DB_SSL=true \` after `-e DB_PASSWORD`
4. **Save** the file

### Step 2: Verify Git Status

```bash
# Check what will be committed
git status

# Verify .env files are NOT tracked
git status | grep .env
# Should show nothing (or "Untracked files" which is fine)
```

### Step 3: Commit Code Changes

```bash
# Add all code changes (NOT .env files)
git add .

# Verify what's being committed
git status

# Commit
git commit -m "Fix EVI calculation, database overflow, and update map centers for production"
```

### Step 4: Push to Production

```bash
# Push to main branch (triggers automatic deployment)
git push origin main
```

---

## 🔍 Post-Deployment Verification

### 1. Check Backend Deployment

1. **Monitor GitHub Actions:**
   - Go to: `https://github.com/YOUR_REPO/actions`
   - Check `deploy-backend.yml` workflow
   - Verify it completes successfully

2. **Check Backend Health:**
   ```bash
   curl http://YOUR_EC2_IP:3000/api/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

3. **Check Backend Logs (SSH to EC2):**
   ```bash
   ssh ec2-user@YOUR_EC2_IP
   docker logs ndvi-backend --tail 50
   ```
   Look for:
   - ✅ `Environment: production`
   - ✅ `Database connection test successful`
   - ✅ No SSL errors

### 2. Check Frontend Deployments

1. **Monitor GitHub Actions:**
   - Check `deploy-ndvi-frontend.yml`
   - Check `deploy-majmaah-frontend.yml`

2. **Verify Frontends:**
   - NDVI Calculator: `https://YOUR_CLOUDFRONT_ID_NDVI.cloudfront.net`
   - Majmaah Dashboard: `https://YOUR_CLOUDFRONT_ID_MAJMAAH.cloudfront.net`

3. **Test Functionality:**
   - Maps should center on Majmaah University
   - Analysis should work correctly
   - EVI values should be in valid range (-1 to 1)

---

## ⚠️ Important Notes

### What's Safe to Push:
- ✅ All code changes (`.js`, `.ts`, `.tsx` files)
- ✅ Configuration files (`config/`, `src/`)
- ✅ GitHub Actions workflows
- ✅ Documentation files

### What's NOT Pushed (Gitignored):
- ✅ `.env` files (local development only)
- ✅ `node_modules/` (installed on deployment)
- ✅ Local database credentials

### Production Uses:
- ✅ Environment variables from GitHub Actions
- ✅ AWS Secrets Manager for sensitive data
- ✅ RDS PostgreSQL (not local Docker)
- ✅ SSL enabled for database connections

---

## 🐛 Troubleshooting

### If Backend Fails to Connect to RDS:

1. **Check DB_SSL is set:**
   ```bash
   # SSH to EC2
   docker exec ndvi-backend env | grep DB_SSL
   # Should show: DB_SSL=true
   ```

2. **If missing, update workflow and redeploy**

### If EVI Values Still Wrong:

1. **Check backend logs for warnings:**
   ```bash
   docker logs ndvi-backend | grep "Clamped"
   ```

2. **Verify the code was deployed:**
   - Check GitHub Actions build logs
   - Verify Docker image was rebuilt

---

## ✅ Final Checklist

Before pushing:
- [ ] `.env` files are NOT in git (check `git status`)
- [ ] Code changes are committed
- [ ] `DB_SSL=true` added to GitHub Actions workflow
- [ ] All tests pass locally (if you have tests)
- [ ] Ready to push to `main` branch

After deployment:
- [ ] Backend health check passes
- [ ] Frontends load correctly
- [ ] Maps center on Majmaah University
- [ ] Analysis works without errors
- [ ] No EVI clamping warnings in logs

---

**Ready to deploy? Follow the steps above!** 🚀


