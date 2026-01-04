# 🔄 How to Restart Backend Server (Fix CORS)

## ⚠️ Current Issue

Your backend server is still running with **old CORS settings** that only allow `http://localhost:3001`. Even though your `.env` file is correct, the server needs to be **completely restarted** to load the new settings.

## ✅ Step-by-Step Fix

### Step 1: Find and Stop the Backend Server

**Option A: If you see the server running in a terminal:**
- Look for the terminal window showing backend logs
- Press `Ctrl + C` to stop it
- Wait for it to fully stop

**Option B: If you can't find the terminal:**
```powershell
# Find Node processes running the backend
Get-Process node | Where-Object {$_.Path -like "*nodejs*"}

# Kill all Node processes (WARNING: This will stop ALL Node apps)
# Only do this if you're sure!
Stop-Process -Name node -Force
```

### Step 2: Navigate to Backend Directory

```powershell
cd C:\Users\Muhammad Kashif\Desktop\Fiver\Maria\Test\lun\lun2\ndvi-calculatorr\server
```

### Step 3: Verify .env File

```powershell
# Check CORS_ORIGINS is correct
Get-Content .env | Select-String "CORS"
```

Should show:
```
CORS_ORIGINS=http://localhost:5173,http://localhost:3001
```

### Step 4: Start Backend Server

```powershell
npm run dev
```

### Step 5: Verify CORS is Loaded

When the server starts, you should see in the console:
```
🌐 CORS Origins: [ 'http://localhost:5173', 'http://localhost:3001' ]
```

**If you DON'T see this line, the server didn't load the new code!**

### Step 6: Test CORS Configuration

Open a new terminal and test:

```powershell
# Test CORS debug endpoint
curl http://localhost:3000/api/debug/cors
```

Or visit in browser: `http://localhost:3000/api/debug/cors`

You should see:
```json
{
  "corsOrigins": ["http://localhost:5173", "http://localhost:3001"],
  "corsOriginsEnv": "http://localhost:5173,http://localhost:3001",
  "requestOrigin": null,
  "allowed": true
}
```

### Step 7: Test Frontend

1. **Refresh your NDVI Calculator** (http://localhost:5173)
2. **Try to login** - CORS error should be gone! ✅

---

## 🔍 Troubleshooting

### Problem: Still seeing CORS error after restart

**Check 1: Is the server actually restarted?**
- Look at the terminal where `npm run dev` is running
- Check the startup logs - do you see `🌐 CORS Origins: [...]`?
- If not, the server didn't restart properly

**Check 2: Are there multiple Node processes?**
```powershell
Get-Process node
```
- Kill all Node processes and restart

**Check 3: Is .env file being read?**
```powershell
cd ndvi-calculatorr\server
Get-Content .env | Select-String "CORS"
```
- Should show both origins

**Check 4: Test the debug endpoint**
```powershell
curl http://localhost:3000/api/debug/cors
```
- This will show what CORS origins the server thinks it has

### Problem: Server won't start

**Check database is running:**
```powershell
docker ps
```
- Should show `ndvi_majmaah_postgres` running

**Check .env file exists:**
```powershell
Test-Path .env
```
- Should return `True`

---

## 📝 Quick Reference

```powershell
# 1. Stop server (Ctrl+C in terminal)

# 2. Navigate to backend
cd ndvi-calculatorr\server

# 3. Verify .env
Get-Content .env | Select-String "CORS"

# 4. Start server
npm run dev

# 5. Look for this in console:
# 🌐 CORS Origins: [ 'http://localhost:5173', 'http://localhost:3001' ]

# 6. Test in browser
# http://localhost:3000/api/debug/cors
```

---

## ✅ Success Indicators

After restarting, you should see:

1. ✅ Console shows: `🌐 CORS Origins: [ 'http://localhost:5173', 'http://localhost:3001' ]`
2. ✅ `/api/debug/cors` endpoint shows both origins
3. ✅ Frontend can make requests without CORS errors
4. ✅ No more "Access-Control-Allow-Origin" errors in browser console

---

**After restarting, the CORS error should be completely resolved!** 🚀

