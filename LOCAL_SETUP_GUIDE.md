# 🚀 Local Development Setup Guide

Complete guide to run all three applications locally on your machine.

---

## 📋 Prerequisites

- **Node.js 18+** installed
- **Docker Desktop** installed and running
- **Git** installed

---

## 🗄️ Step 1: Start PostgreSQL Database

The database runs in Docker using `docker-compose.yml`.

### Navigate to server directory:
```bash
cd ndvi-calculatorr/server
```

### Start database:
```bash
docker-compose up -d
```

### Verify database is running:
```bash
docker ps
```

You should see:
- `ndvi_majmaah_postgres` (PostgreSQL on port 5432)
- `ndvi_majmaah_pgadmin` (pgAdmin on port 5050) - Optional

### Database credentials:
- **Host:** `localhost`
- **Port:** `5432`
- **Database:** `ndvi_majmaah_db`
- **User:** `postgres`
- **Password:** `ndvi_majmaah_2025`

### Access pgAdmin (optional):
- URL: http://localhost:5050
- Email: `admin@urimpact.com`
- Password: `admin123`

---

## 🔧 Step 2: Setup Backend Environment

### Navigate to backend:
```bash
cd ndvi-calculatorr/server
```

### Create `.env` file:
Create a file named `.env` in `ndvi-calculatorr/server/` with:

```env
# Application Port
PORT=3000

# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ndvi_majmaah_db
DB_USER=postgres
DB_PASSWORD=ndvi_majmaah_2025
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=5000
DB_SSL=false

# Google Earth Engine (GEE) Credentials
# Replace with your actual GEE service account credentials
GEE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GEE_CLIENT_EMAIL=your-service-account-email@developer.gserviceaccount.com
GEE_PROJECT_ID=your-gee-project-id

# JSON Web Token (JWT) Secret
# Use a strong random string for local development
JWT_SECRET=your_local_jwt_secret_key_here_change_this

# Cross-Origin Resource Sharing (CORS)
# Allow both frontends to access the backend
CORS_ORIGINS=http://localhost:5173,http://localhost:3001

# Mapbox Access Token (for NDVI Calculator frontend map)
# Get from: https://account.mapbox.com/access-tokens/
MAPBOX_ACCESS_TOKEN=pk.eyJ...

# Node Environment
NODE_ENV=development
```

**⚠️ Important:** Replace the GEE credentials and Mapbox token with your actual values!

### Install dependencies:
```bash
npm install
```

### Start backend:
```bash
npm run dev
```

Or for production mode:
```bash
npm start
```

### Verify backend is running:
- Open: http://localhost:3000/api/health
- Should return: `{"status":"ok","timestamp":"..."}`

---

## 🎨 Step 3: Setup NDVI Calculator Frontend

### Open a NEW terminal window/tab

### Navigate to NDVI Calculator:
```bash
cd ndvi-calculatorr/client
```

### Create `.env` file:
Create a file named `.env` in `ndvi-calculatorr/client/` with:

```env
# API Base URL for the backend
VITE_API_BASE_URL=http://localhost:3000/api

# Mapbox Access Token
# Get from: https://account.mapbox.com/access-tokens/
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ...

# Application Title (optional)
VITE_APP_TITLE=NDVI Calculator Admin

# Application Environment
VITE_APP_ENV=development
```

### Install dependencies:
```bash
npm install
```

### Start development server:
```bash
npm run dev
```

### Access NDVI Calculator:
- URL: http://localhost:5173
- The app will automatically open in your browser

---

## 🌳 Step 4: Setup Majmaah Dashboard Frontend

### Open a NEW terminal window/tab

### Navigate to Majmaah Dashboard:
```bash
cd majmaah-dashboard-react
```

### Create `.env` file:
Create a file named `.env` in `majmaah-dashboard-react/` with:

```env
# API Base URL for the backend
VITE_API_BASE_URL=http://localhost:3000/api

# Mapbox Access Token
# Get from: https://account.mapbox.com/access-tokens/
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ...

# Application Title (optional)
VITE_APP_TITLE=Majmaah University - Tree Planting Dashboard

# Application Environment
VITE_APP_ENV=development
```

### Install dependencies:
```bash
npm install
```

### Start development server:
```bash
npm run dev
```

### Access Majmaah Dashboard:
- URL: http://localhost:3001
- The app will automatically open in your browser

---

## ✅ Verification Checklist

### All services should be running:

1. **Database (Docker):**
   ```bash
   docker ps
   ```
   - Should show `ndvi_majmaah_postgres` running

2. **Backend:**
   - Visit: http://localhost:3000/api/health
   - Should return JSON with `status: "ok"`

3. **NDVI Calculator:**
   - Visit: http://localhost:5173
   - Should show the login page

4. **Majmaah Dashboard:**
   - Visit: http://localhost:3001
   - Should show the login page

---

## 🔐 Default Login Credentials

### NDVI Calculator (Admin):
- **Email:** `admin@urimpact.com`
- **Password:** `admin123`

### Majmaah Dashboard:
- **Email:** `client@majmaah.edu.sa`
- **Password:** `majmaah123`

---

## 🛑 Stopping Services

### Stop frontends:
- Press `Ctrl + C` in each terminal running the frontends

### Stop backend:
- Press `Ctrl + C` in the terminal running the backend

### Stop database:
```bash
cd ndvi-calculatorr/server
docker-compose down
```

To stop and remove all data:
```bash
docker-compose down -v
```

---

## 🐛 Troubleshooting

### Database connection errors:
- **Check Docker is running:** `docker ps`
- **Check database is up:** `docker-compose ps` (in server directory)
- **Verify credentials:** Check `.env` file matches docker-compose.yml

### Backend won't start:
- **Check port 3000 is free:** `netstat -ano | findstr :3000` (Windows) or `lsof -i :3000` (Mac/Linux)
- **Check database is running:** `docker ps`
- **Check .env file exists:** Verify `ndvi-calculatorr/server/.env` exists

### Frontend won't start:
- **Check Node.js version:** `node -v` (should be 18+)
- **Clear node_modules and reinstall:**
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```
- **Check .env file exists:** Verify `.env` file in frontend directory

### CORS errors in browser:
- **Check backend CORS_ORIGINS:** Should include `http://localhost:5173` and `http://localhost:3001`
- **Restart backend** after changing `.env` file

### API connection errors:
- **Verify backend is running:** http://localhost:3000/api/health
- **Check VITE_API_BASE_URL:** Should be `http://localhost:3000/api`
- **Check browser console:** Look for specific error messages

---

## 📝 Quick Reference

### Ports:
- **Backend API:** `3000`
- **NDVI Calculator:** `5173`
- **Majmaah Dashboard:** `3001`
- **PostgreSQL:** `5432`
- **pgAdmin:** `5050`

### URLs:
- **Backend Health:** http://localhost:3000/api/health
- **NDVI Calculator:** http://localhost:5173
- **Majmaah Dashboard:** http://localhost:3001
- **pgAdmin:** http://localhost:5050

### Commands:
```bash
# Start database
cd ndvi-calculatorr/server && docker-compose up -d

# Start backend
cd ndvi-calculatorr/server && npm run dev

# Start NDVI Calculator
cd ndvi-calculatorr/client && npm run dev

# Start Majmaah Dashboard
cd majmaah-dashboard-react && npm run dev
```

---

## 🎉 You're All Set!

All three applications should now be running locally. Happy coding! 🚀

