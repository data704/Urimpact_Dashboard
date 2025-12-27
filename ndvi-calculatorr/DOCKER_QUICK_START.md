# 🐳 Docker Quick Start - 3 Commands!

## ⚡ Super Fast Setup (5 Minutes)

### **Prerequisites:**
- ✅ Docker Desktop installed and running
- ✅ That's it! No PostgreSQL installation needed!

**Install Docker Desktop:** https://www.docker.com/products/docker-desktop/

---

## 🚀 3 Commands to Start Everything:

### **1. Start PostgreSQL Database**
```powershell
cd "C:\Users\Muhammad Kashif\Desktop\Fiver\Maria\Test\lun\lun2\ndvi-calculatorr\server"
docker-compose up -d
```

**Wait 30 seconds** for database initialization.

### **2. Install Dependencies**
```powershell
npm install
```

### **3. Start Backend Server**
```powershell
npm start
```

**Done!** ✅

You should see:
```
✅ PostgreSQL database connected
✅ Database connection test successful
✅ Database schema is complete
✅ Server running on port 3000
```

---

## 🎯 What Just Happened?

1. ✅ **PostgreSQL** started in Docker container
2. ✅ **Database** `ndvi_majmaah_db` created automatically
3. ✅ **Migration** ran automatically (all tables created)
4. ✅ **Default project** inserted (Majmaah University)
5. ✅ **pgAdmin** started (optional web UI at http://localhost:5050)
6. ✅ **Backend connected** to database

---

## 🔍 Verify Everything Works

### **Check Docker Containers:**
```powershell
docker-compose ps
```

Should show:
```
NAME                    STATUS
ndvi_majmaah_postgres   Up (healthy)
ndvi_majmaah_pgadmin    Up
```

### **Check Database Tables:**
```powershell
docker exec -it ndvi_majmaah_postgres psql -U postgres -d ndvi_majmaah_db -c "\dt"
```

Should show 5 tables:
```
 projects
 analysis_results
 majmaah_assignments
 calculated_metrics
 species_data
```

### **Check Default Project:**
```powershell
docker exec -it ndvi_majmaah_postgres psql -U postgres -d ndvi_majmaah_db -c "SELECT * FROM projects;"
```

Should show:
```
 id |              name                |    client_name     | ...
----+----------------------------------+-------------------+----
  1 | Majmaah University Tree Planting | Majmaah University | ...
```

---

## 🎨 Optional: Use pgAdmin Web UI

### **Access pgAdmin:**
1. Open browser: `http://localhost:5050`
2. Login:
   - Email: `admin@urimpact.com`
   - Password: `admin123`

### **Add Server Connection:**
1. Right-click "Servers" → "Register" → "Server"
2. **General tab:**
   - Name: `NDVI Majmaah DB`
3. **Connection tab:**
   - Host: `postgres` (container name)
   - Port: `5432`
   - Database: `ndvi_majmaah_db`
   - Username: `postgres`
   - Password: `ndvi_majmaah_2025`
4. Click "Save"

**Now you can browse tables, run queries, view data visually!**

---

## 📊 Database Info

**Connection Details:**
```
Host: localhost (from your machine)
Port: 5432
Database: ndvi_majmaah_db
Username: postgres
Password: ndvi_majmaah_2025
```

**From .env file:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ndvi_majmaah_db
DB_USER=postgres
DB_PASSWORD=ndvi_majmaah_2025
```

---

## 🛠️ Useful Docker Commands

### **Start Database:**
```powershell
docker-compose up -d
```

### **Stop Database (Keep Data):**
```powershell
docker-compose down
```

### **Stop & Delete All Data (Reset):**
```powershell
docker-compose down -v
```

### **Restart Database:**
```powershell
docker-compose restart
```

### **View Logs (Live):**
```powershell
docker-compose logs -f postgres
```

### **Run SQL Commands:**
```powershell
# Interactive psql
docker exec -it ndvi_majmaah_postgres psql -U postgres -d ndvi_majmaah_db

# Single command
docker exec -it ndvi_majmaah_postgres psql -U postgres -d ndvi_majmaah_db -c "SELECT COUNT(*) FROM analysis_results;"
```

### **Backup Database:**
```powershell
docker exec -it ndvi_majmaah_postgres pg_dump -U postgres ndvi_majmaah_db > backup.sql
```

### **Restore Database:**
```powershell
docker exec -i ndvi_majmaah_postgres psql -U postgres -d ndvi_majmaah_db < backup.sql
```

---

## 🧪 Test the Complete Integration

### **1. Start Everything:**

**Terminal 1 - Database:**
```powershell
cd server
docker-compose up -d
```

**Terminal 2 - NDVI Backend:**
```powershell
cd server
npm start
```

**Terminal 3 - NDVI Frontend:**
```powershell
cd ..\client
npm run dev
```

**Terminal 4 - Majmaah Dashboard:**
```powershell
cd "C:\Users\Muhammad Kashif\Desktop\Fiver\Maria\Test\lun\lun2\majmaah-dashboard-react"
npm run dev
```

### **2. Run Analysis:**
1. Open `http://localhost:5173`
2. Draw polygon on map
3. Click "Run Baseline Assessment"
4. Wait for results
5. Check backend logs - should see:
   ```
   ✅ Baseline assessment saved to database (ID: 1)
   ```

### **3. Assign to Majmaah:**
1. Click "👤 Admin Assignments" tab
2. See analysis in "Unassigned" section
3. Click "Assign to Majmaah"
4. Enter name: "Majmaah Campus"
5. Analysis moves to "Assigned" section

### **4. View in Majmaah Dashboard:**
1. Open `http://localhost:3001`
2. Login (any credentials)
3. Dashboard loads
4. Look for: "Live GEE Data" 🟢 indicator
5. Stat cards show **real numbers from satellite!**

---

## 🎉 Success Checklist

- [ ] Docker Desktop installed and running
- [ ] `docker-compose up -d` successful
- [ ] Database container healthy
- [ ] Migration ran (5 tables created)
- [ ] Default project exists
- [ ] `.env` file configured
- [ ] Backend connects to database
- [ ] NDVI Calculator can run analyses
- [ ] Analyses saved to database
- [ ] Admin can assign to Majmaah
- [ ] Majmaah shows "Live GEE Data"
- [ ] Real numbers in stat cards

---

## 💡 Pro Tips

### **Persistent Data:**
Docker volumes preserve data even after:
- Container restart
- Docker Desktop restart
- System reboot

Data only deleted with: `docker-compose down -v`

### **Performance:**
PostgreSQL in Docker performs exactly the same as native installation!

### **Easy Cleanup:**
When done with project:
```powershell
docker-compose down -v  # Removes everything
```

---

## 🎯 Next Steps After Setup

1. ✅ Database running in Docker
2. ✅ Backend connected and saving data
3. ✅ Run some baseline assessments
4. ✅ Assign them to Majmaah
5. ✅ View real GEE data in Majmaah dashboard

---

## 🚀 You're Ready!

**Just 3 commands:**
```powershell
docker-compose up -d
npm install
npm start
```

**Complete integration with Docker PostgreSQL!** 🎉

No manual PostgreSQL installation needed!

