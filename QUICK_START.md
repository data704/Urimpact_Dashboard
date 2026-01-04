# ⚡ Quick Start - Run Both Apps Locally

Follow these steps in order to run all applications locally.

---

## 🚨 Step 0: Prerequisites Check

### 1. Start Docker Desktop
- **Windows:** Open Docker Desktop application
- Wait until Docker Desktop shows "Docker Desktop is running"
- Verify: Run `docker ps` in terminal (should not show error)

### 2. Verify Node.js
```bash
node -v
```
Should show `v18.x.x` or higher.

---

## 🗄️ Step 1: Start Database

### Open Terminal 1 (PowerShell or Command Prompt)

```bash
# Navigate to server directory
cd ndvi-calculatorr\server

# Start PostgreSQL database
docker-compose up -d

# Verify it's running
docker ps
```

You should see `ndvi_majmaah_postgres` container running.

**Database Info:**
- Host: `localhost`
- Port: `5432`
- Database: `ndvi_majmaah_db`
- User: `postgres`
- Password: `ndvi_majmaah_2025`

---

## 🔧 Step 2: Start Backend

### Keep Terminal 1 open, or open a NEW Terminal

```bash
# Navigate to server directory
cd ndvi-calculatorr\server

# Check if .env file exists (it should)
dir .env

# Install dependencies (if not already done)
npm install

# Start backend server
npm run dev
```

**✅ Backend should start on:** http://localhost:3000

**✅ Health check:** http://localhost:3000/api/health

**Keep this terminal running!**

---

## 🎨 Step 3: Start NDVI Calculator Frontend

### Open a NEW Terminal (Terminal 2)

```bash
# Navigate to NDVI Calculator
cd ndvi-calculatorr\client

# Create .env file if it doesn't exist
# Copy this content into .env file:
# VITE_API_BASE_URL=http://localhost:3000/api
# VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
# VITE_APP_TITLE=NDVI Calculator Admin
# VITE_APP_ENV=development

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

**✅ NDVI Calculator will open on:** http://localhost:5173

**Keep this terminal running!**

---

## 🌳 Step 4: Start Majmaah Dashboard Frontend

### Open a NEW Terminal (Terminal 3)

```bash
# Navigate to Majmaah Dashboard
cd majmaah-dashboard-react

# Create .env file if it doesn't exist
# Copy this content into .env file:
# VITE_API_BASE_URL=http://localhost:3000/api
# VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
# VITE_APP_TITLE=Majmaah University - Tree Planting Dashboard
# VITE_APP_ENV=development

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

**✅ Majmaah Dashboard will open on:** http://localhost:3001

**Keep this terminal running!**

---

## ✅ Verification

### All services should be accessible:

1. **Backend Health Check:**
   - Open: http://localhost:3000/api/health
   - Should show: `{"status":"ok","timestamp":"..."}`

2. **NDVI Calculator:**
   - Open: http://localhost:5173
   - Should show login page

3. **Majmaah Dashboard:**
   - Open: http://localhost:3001
   - Should show login page

---

## 🔐 Login Credentials

### NDVI Calculator (Admin):
- **Email:** `admin@urimpact.com`
- **Password:** `admin123`

### Majmaah Dashboard:
- **Email:** `client@majmaah.edu.sa`
- **Password:** `majmaah123`

---

## 🛑 To Stop Everything

1. **Stop Frontends:** Press `Ctrl + C` in Terminal 2 and Terminal 3
2. **Stop Backend:** Press `Ctrl + C` in Terminal 1 (or the terminal running backend)
3. **Stop Database:**
   ```bash
   cd ndvi-calculatorr\server
   docker-compose down
   ```

---

## ⚠️ Important Notes

### .env Files
- `.env` files are gitignored (not committed to git)
- You need to create them manually in each directory
- **Backend:** `ndvi-calculatorr\server\.env` (already exists)
- **NDVI Calculator:** `ndvi-calculatorr\client\.env` (create if missing)
- **Majmaah Dashboard:** `majmaah-dashboard-react\.env` (create if missing)

### Mapbox Token
- You need a Mapbox access token for the maps to work
- Get one from: https://account.mapbox.com/access-tokens/
- Add it to both frontend `.env` files as `VITE_MAPBOX_ACCESS_TOKEN`

### Google Earth Engine (GEE)
- Backend needs GEE credentials for satellite analysis
- Add them to `ndvi-calculatorr\server\.env`
- If you don't have them yet, some features won't work, but the apps will still run

---

## 🐛 Troubleshooting

### Docker not running:
- Start Docker Desktop application
- Wait for it to fully start
- Try `docker ps` again

### Port already in use:
- **Port 3000:** Backend is already running, or another app is using it
- **Port 5173:** NDVI Calculator is already running
- **Port 3001:** Majmaah Dashboard is already running
- **Port 5432:** Database is already running

### Database connection error:
- Make sure Docker Desktop is running
- Make sure database container is running: `docker ps`
- Check `.env` file has correct database credentials

### Frontend can't connect to backend:
- Make sure backend is running on port 3000
- Check `VITE_API_BASE_URL` in frontend `.env` files
- Should be: `http://localhost:3000/api`

---

## 📝 Quick Reference

| Service | Port | URL |
|---------|------|-----|
| Backend API | 3000 | http://localhost:3000/api |
| NDVI Calculator | 5173 | http://localhost:5173 |
| Majmaah Dashboard | 3001 | http://localhost:3001 |
| PostgreSQL | 5432 | localhost:5432 |
| pgAdmin | 5050 | http://localhost:5050 |

---

**Ready to start? Begin with Step 0!** 🚀

