# 🚀 Deploy to Production - Step by Step Guide

Complete guide to safely deploy your local development changes to production.

---

## ✅ What We Changed (Summary)

### Code Changes (✅ Safe to Deploy):
1. **Fixed EVI Calculation** - Added band scaling (`.multiply(0.0001)`) for accurate EVI values
2. **Fixed Database Overflow** - Added NDVI/EVI value clamping to prevent errors
3. **Updated Map Centers** - Changed default map location to Majmaah University
4. **Fixed Database SSL** - Updated to use `DB_SSL` environment variable
5. **Fixed Secrets Logic** - Improved AWS Secrets Manager integration

### Local Development Only (⚠️ NOT in Git):
- `.env` files with local database credentials
- Local development settings

---

## 🔒 Step 1: Verify .env Files Are NOT Tracked

**IMPORTANT:** `.env` files should NOT be committed to git!

```powershell
# Check if .env is tracked
git status --short | Select-String "\.env"

# If you see .env files, remove them from git tracking:
git rm --cached ndvi-calculatorr\server\.env
git rm --cached ndvi-calculatorr\client\.env
git rm --cached majmaah-dashboard-react\.env
```

**✅ I've already created a root `.gitignore` file to ensure `.env` files are ignored.**

---

## 📝 Step 2: Review What Will Be Committed

```powershell
# See all changes
git status

# You should see:
# ✅ Code files (.js, .ts, .tsx)
# ✅ Configuration files
# ✅ GitHub Actions workflows
# ❌ NO .env files (they should be untracked)
```

---

## 🚀 Step 3: Commit and Push

### Option A: Commit All Changes at Once

```powershell
# Add all changes (except .env files which are gitignored)
git add .

# Verify what's being committed
git status

# Commit with descriptive message
git commit -m "Production fixes: EVI calculation, database overflow, map centers, and SSL configuration"

# Push to main branch (triggers automatic deployment)
git push origin main
```

### Option B: Commit in Logical Groups

```powershell
# 1. Backend fixes
git add ndvi-calculatorr/server/src/
git add .github/workflows/deploy-backend.yml
git commit -m "Fix backend: EVI calculation, database overflow, SSL config"

# 2. Frontend map centers
git add ndvi-calculatorr/client/src/components/
git add majmaah-dashboard-react/src/config/
git commit -m "Update map centers to Majmaah University"

# 3. Documentation
git add *.md
git commit -m "Add deployment documentation"

# Push all commits
git push origin main
```

---

## ⏳ Step 4: Monitor Deployment

### Backend Deployment

1. **Go to GitHub Actions:**
   - URL: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`
   - Click on the latest `Deploy Backend to EC2` workflow run

2. **Watch for:**
   - ✅ Build completes successfully
   - ✅ Docker image pushed to ECR
   - ✅ Deployment to EC2 succeeds
   - ✅ Health check passes

3. **Expected Time:** 5-10 minutes

### Frontend Deployments

1. **NDVI Calculator Frontend:**
   - Workflow: `Deploy NDVI Calculator Frontend`
   - Expected Time: 3-5 minutes

2. **Majmaah Dashboard Frontend:**
   - Workflow: `Deploy Majmaah Dashboard Frontend`
   - Expected Time: 3-5 minutes

---

## ✅ Step 5: Verify Production Deployment

### Backend Verification

```bash
# Test health endpoint
curl http://YOUR_EC2_IP:3000/api/health

# Should return:
# {"status":"ok","timestamp":"2025-12-31T..."}
```

### Frontend Verification

1. **NDVI Calculator:**
   - Visit: `https://YOUR_CLOUDFRONT_ID_NDVI.cloudfront.net`
   - ✅ Map should center on Majmaah University
   - ✅ Analysis should work

2. **Majmaah Dashboard:**
   - Visit: `https://YOUR_CLOUDFRONT_ID_MAJMAAH.cloudfront.net`
   - ✅ Map should center on Majmaah University
   - ✅ Dashboard should load correctly

---

## 🔍 What Production Uses (vs Local)

| Setting | Local Development | Production |
|---------|------------------|------------|
| **Database** | `localhost:5432` (Docker) | AWS RDS (from workflow) |
| **DB_SSL** | `false` | `true` (set in workflow) |
| **NODE_ENV** | `development` | `production` (set in workflow) |
| **Secrets** | `.env` file | AWS Secrets Manager |
| **CORS** | `localhost:5173,localhost:3001` | CloudFront domains (from secrets) |

---

## ⚠️ Important Notes

### ✅ Safe to Push:
- All code files (`.js`, `.ts`, `.tsx`)
- Configuration files
- GitHub Actions workflows
- Documentation

### ❌ NOT Pushed (Gitignored):
- `.env` files (local development only)
- `node_modules/` (installed during build)
- Local database credentials

### 🔐 Production Configuration:
- Uses environment variables from GitHub Actions
- Fetches secrets from AWS Secrets Manager
- Connects to AWS RDS with SSL enabled
- Uses production CORS origins

---

## 🐛 Troubleshooting

### If .env File Shows in Git:

```powershell
# Remove from git tracking (keeps local file)
git rm --cached ndvi-calculatorr\server\.env

# Verify it's now ignored
git status
```

### If Backend Fails to Connect:

1. **Check DB_SSL is set:**
   - SSH to EC2: `ssh ec2-user@YOUR_EC2_IP`
   - Run: `docker exec ndvi-backend env | grep DB_SSL`
   - Should show: `DB_SSL=true`

2. **If missing, the workflow was updated to include it**

### If Frontend Shows Wrong API URL:

1. **Check GitHub Secrets:**
   - Go to: `Settings → Secrets and variables → Actions`
   - Verify `VITE_API_BASE_URL` is set correctly

2. **Redeploy frontend:**
   - Push a small change to trigger deployment
   - Or manually trigger workflow

---

## 📋 Quick Reference

### Files Changed:
- ✅ `ndvi-calculatorr/server/src/services/baselineAssessmentService.js` - EVI fix
- ✅ `ndvi-calculatorr/server/src/services/databaseService.js` - Overflow fix
- ✅ `ndvi-calculatorr/server/src/config/database.js` - SSL fix
- ✅ `ndvi-calculatorr/server/src/config/secrets.js` - Secrets logic
- ✅ `ndvi-calculatorr/client/src/components/*` - Map centers
- ✅ `majmaah-dashboard-react/src/config/index.ts` - Map center
- ✅ `.github/workflows/deploy-backend.yml` - Added DB_SSL=true

### Files NOT Changed (Local Only):
- ❌ `.env` files (gitignored)

---

## ✅ Final Checklist

Before pushing:
- [ ] `.env` files are NOT in git (`git status` shows no .env)
- [ ] All code changes are ready
- [ ] `DB_SSL=true` added to workflow (✅ Done)
- [ ] Ready to push to `main`

After pushing:
- [ ] Monitor GitHub Actions workflows
- [ ] Verify backend health check
- [ ] Test frontends
- [ ] Confirm maps center correctly
- [ ] Test analysis functionality

---

**Ready? Run these commands:**

```powershell
# 1. Verify .env is not tracked
git status | Select-String "\.env"

# 2. Add all changes
git add .

# 3. Commit
git commit -m "Production fixes: EVI calculation, database overflow, map centers, SSL config"

# 4. Push to production
git push origin main
```

**Then monitor the GitHub Actions workflows!** 🚀


