# 🐳 Docker PostgreSQL Setup - Quick & Easy!

## ✅ Why Docker?

- ✅ No PostgreSQL installation needed
- ✅ One command to start database
- ✅ Automatic migration on first run
- ✅ Includes pgAdmin (web-based DB management)
- ✅ Easy to reset/clean up
- ✅ Consistent across all machines

---

## 📋 Prerequisites

### **Install Docker Desktop** (if not installed)

**Windows:**
1. Download: https://www.docker.com/products/docker-desktop/
2. Install Docker Desktop
3. Start Docker Desktop
4. Wait for Docker to fully start (whale icon in system tray)

**Check Docker is running:**
```powershell
docker --version
docker-compose --version
```

Should show versions like:
```
Docker version 24.0.x
Docker Compose version v2.x.x
```

---

## 🚀 Quick Start (3 Commands)

### **Step 1: Navigate to Server Folder**
```powershell
cd "C:\Users\Muhammad Kashif\Desktop\Fiver\Maria\Test\lun\lun2\ndvi-calculatorr\server"
```

### **Step 2: Start PostgreSQL with Docker**
```powershell
docker-compose up -d
```

**Expected output:**
```
[+] Running 3/3
 ✔ Network ndvi_network              Created
 ✔ Container ndvi_majmaah_postgres   Started
 ✔ Container ndvi_majmaah_pgadmin    Started
```

**This will:**
- ✅ Download PostgreSQL image (first time only)
- ✅ Create database container
- ✅ Create database `ndvi_majmaah_db`
- ✅ **Automatically run migration** (001-initial-schema.sql)
- ✅ Start pgAdmin (optional web UI)

### **Step 3: Wait for Database to be Ready** (30 seconds)
```powershell
# Check status
docker-compose ps

# Should show:
# ndvi_majmaah_postgres   Up (healthy)
# ndvi_majmaah_pgadmin    Up
```

---

## ✅ Verify Setup

### **Option 1: Check Logs**
```powershell
# View database logs
docker-compose logs postgres

# Should see:
# database system is ready to accept connections
# CREATE TABLE (multiple times)
# INSERT 0 1 (default project created)
```

### **Option 2: Connect with psql**
```powershell
# Connect to database
docker exec -it ndvi_majmaah_postgres psql -U postgres -d ndvi_majmaah_db

# Once connected, run:
\dt

# Should show 5 tables:
# projects
# analysis_results
# majmaah_assignments
# calculated_metrics
# species_data

# Check default project
SELECT * FROM projects;

# Exit
\q
```

### **Option 3: Use pgAdmin Web UI**
1. Open browser: `http://localhost:5050`
2. Login:
   - Email: `admin@urimpact.com`
   - Password: `admin123`
3. Add server:
   - Name: `NDVI Majmaah DB`
   - Host: `postgres` (container name)
   - Port: `5432`
   - Database: `ndvi_majmaah_db`
   - Username: `postgres`
   - Password: `ndvi_majmaah_2025`
4. Browse tables!

---

## 🎯 Now Start the Backend

### **Step 1: Install Dependencies** (if not done)
```powershell
cd "C:\Users\Muhammad Kashif\Desktop\Fiver\Maria\Test\lun\lun2\ndvi-calculatorr\server"
npm install
```

### **Step 2: Start NDVI Backend**
```powershell
npm start
```

**Should see:**
```
✅ PostgreSQL database connected
✅ Database connection test successful
✅ Database schema is complete
✅ Server running on port 3000
```

---

## 📊 Docker Commands

### **Start Database:**
```powershell
docker-compose up -d
```

### **Stop Database:**
```powershell
docker-compose down
```

### **Stop & Remove All Data (Reset):**
```powershell
docker-compose down -v
```

### **View Logs:**
```powershell
# All logs
docker-compose logs

# Just PostgreSQL
docker-compose logs postgres

# Follow logs (live)
docker-compose logs -f
```

### **Restart Database:**
```powershell
docker-compose restart postgres
```

### **Check Status:**
```powershell
docker-compose ps
```

---

## 🔧 Configuration

### **Database Credentials (in docker-compose.yml):**
```yaml
Database: ndvi_majmaah_db
User: postgres
Password: ndvi_majmaah_2025
Port: 5432 (exposed to host)
```

### **pgAdmin Credentials:**
```yaml
URL: http://localhost:5050
Email: admin@urimpact.com
Password: admin123
```

### **.env File (already created):**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ndvi_majmaah_db
DB_USER=postgres
DB_PASSWORD=ndvi_majmaah_2025
```

---

## 🎯 Complete Workflow with Docker

### **First Time Setup:**
```powershell
# 1. Start Docker Desktop (wait for it to fully start)

# 2. Navigate to server folder
cd "C:\Users\Muhammad Kashif\Desktop\Fiver\Maria\Test\lun\lun2\ndvi-calculatorr\server"

# 3. Start PostgreSQL
docker-compose up -d

# 4. Wait 30 seconds for database initialization

# 5. Verify
docker-compose logs postgres | Select-String "ready to accept connections"

# 6. Install npm dependencies
npm install

# 7. Start backend
npm start
```

### **Daily Usage:**
```powershell
# Start database (if not running)
docker-compose up -d

# Start backend
npm start

# That's it! Database persists between restarts
```

### **To Reset Everything:**
```powershell
# Stop and remove all data
docker-compose down -v

# Start fresh
docker-compose up -d
# (Migration runs automatically again)
```

---

## 🐛 Troubleshooting

### **Docker not starting:**
- Ensure Docker Desktop is running (whale icon in system tray)
- Wait for Docker to fully initialize

### **Port 5432 already in use:**
```powershell
# If you have PostgreSQL installed locally, stop it:
sc stop postgresql-x64-15  # or your version

# Or change port in docker-compose.yml:
ports:
  - "5433:5432"  # Use port 5433 on host

# Then update .env:
DB_PORT=5433
```

### **Migration didn't run:**
```powershell
# Run migration manually
docker exec -it ndvi_majmaah_postgres psql -U postgres -d ndvi_majmaah_db -f /docker-entrypoint-initdb.d/001-initial-schema.sql
```

### **Can't connect from app:**
```powershell
# Check database is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Test connection
docker exec -it ndvi_majmaah_postgres psql -U postgres -d ndvi_majmaah_db -c "SELECT 1"
```

---

## 📦 What's Included

### **PostgreSQL Container:**
- PostgreSQL 15 (Alpine - lightweight)
- Port 5432 exposed
- Data persisted in Docker volume
- Automatic migration on first start
- Health checks enabled

### **pgAdmin Container:**
- Web-based database management
- Accessible at http://localhost:5050
- Pre-configured connection available
- Optional (can be disabled if not needed)

---

## 🎨 Customization

### **Change Database Password:**

Edit `docker-compose.yml`:
```yaml
environment:
  POSTGRES_PASSWORD: your_custom_password
```

Edit `.env`:
```env
DB_PASSWORD=your_custom_password
```

### **Disable pgAdmin (if not needed):**

Comment out pgAdmin section in `docker-compose.yml`:
```yaml
# pgadmin:
#   image: dpage/pgadmin4:latest
#   ...
```

### **Use Different Port:**

Edit `docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # Host:Container
```

---

## ✅ Advantages of Docker

1. **Fast Setup** - One command starts everything
2. **Clean** - No system-wide PostgreSQL installation
3. **Portable** - Same setup on any machine
4. **Isolated** - Doesn't interfere with other databases
5. **Easy Reset** - `docker-compose down -v` removes everything
6. **Automatic Migration** - SQL runs on first start
7. **Includes pgAdmin** - Visual database management

---

## 🎉 Ready!

**Just run:**
```powershell
docker-compose up -d
npm install
npm start
```

**Database ready in 30 seconds!** 🚀

No manual PostgreSQL installation needed!

