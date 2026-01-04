# 🔧 CORS Error Fix Guide

## Problem

You're getting this error:
```
Access to fetch at 'http://localhost:3000/api/auth/login' from origin 'http://localhost:5173' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
The 'Access-Control-Allow-Origin' header has a value 'http://localhost:3001' that is not equal 
to the supplied origin.
```

## Root Cause

The backend server is still running with **old CORS settings** that only allow `http://localhost:3001`. Even though your `.env` file has been updated to include both origins, the server needs to be **restarted** to pick up the new environment variables.

## ✅ Solution: Restart Backend Server

### Step 1: Stop the Backend Server

In the terminal where your backend is running:
- Press `Ctrl + C` to stop the server

### Step 2: Verify .env File

Your `.env` file should have:
```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3001
```

✅ **I've verified this is already correct in your `.env` file!**

### Step 3: Restart Backend Server

```powershell
cd ndvi-calculatorr\server
npm run dev
```

### Step 4: Verify CORS Configuration

When the server starts, you should now see:
```
🌐 CORS Origins: [ 'http://localhost:5173', 'http://localhost:3001' ]
```

This confirms both origins are loaded correctly.

### Step 5: Test Frontend

1. **NDVI Calculator** (http://localhost:5173) should now work ✅
2. **Majmaah Dashboard** (http://localhost:3001) should still work ✅

---

## 🔍 How to Verify It's Working

### Check Backend Logs

When you make a request from the frontend, you should **NOT** see:
```
⚠️  CORS blocked request from origin: http://localhost:5173
```

If you see this, the server hasn't picked up the new CORS settings yet.

### Test with curl

```powershell
# Test from NDVI Calculator origin
curl -H "Origin: http://localhost:5173" http://localhost:3000/api/health

# Test from Majmaah Dashboard origin  
curl -H "Origin: http://localhost:3001" http://localhost:3000/api/health
```

Both should return `{"status":"ok",...}` without CORS errors.

---

## 📝 What I Fixed

1. ✅ **Added CORS logging** - Backend now logs which origins are allowed on startup
2. ✅ **Improved error messages** - Better CORS error messages in console
3. ✅ **Verified .env file** - Your `.env` already has both origins configured

---

## ⚠️ Common Issues

### Issue 1: Server Still Shows Old Origins

**Solution:** Make sure you completely stopped the server (Ctrl+C) and restarted it.

### Issue 2: Multiple Backend Processes Running

**Solution:** Check for multiple Node processes:
```powershell
Get-Process node | Where-Object {$_.Path -like "*ndvi*"}
# Kill any old processes if needed
```

### Issue 3: Environment Variables Not Loading

**Solution:** Make sure you're in the correct directory:
```powershell
cd ndvi-calculatorr\server
# Verify .env exists
Test-Path .env  # Should return True
```

---

## ✅ Quick Fix Checklist

- [ ] Stop backend server (Ctrl+C)
- [ ] Verify `.env` has `CORS_ORIGINS=http://localhost:5173,http://localhost:3001`
- [ ] Restart backend: `npm run dev`
- [ ] Check startup logs for: `🌐 CORS Origins: [...]`
- [ ] Test frontend - CORS error should be gone!

---

**After restarting, the CORS error should be resolved!** 🚀

