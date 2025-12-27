# 🗄️ PostgreSQL Database Setup Guide

## 📋 Prerequisites

1. **PostgreSQL** installed (version 12 or higher)
   - Download: https://www.postgresql.org/download/windows/
   - Or use existing installation

## 🚀 Step-by-Step Setup

### **Step 1: Create Database**

Open **pgAdmin** or **psql** command line:

```sql
-- Create the database
CREATE DATABASE ndvi_majmaah_db;

-- Connect to it
\c ndvi_majmaah_db
```

Or using **psql** command:
```powershell
psql -U postgres
CREATE DATABASE ndvi_majmaah_db;
\q
```

---

### **Step 2: Run Migration**

```powershell
cd "C:\Users\Muhammad Kashif\Desktop\Fiver\Maria\Test\lun\lun2\ndvi-calculatorr\server"

# Run the migration SQL file
psql -U postgres -d ndvi_majmaah_db -f migrations\001-initial-schema.sql
```

This will create:
- ✅ 5 tables (projects, analysis_results, majmaah_assignments, calculated_metrics, species_data)
- ✅ Indexes for performance
- ✅ Triggers for auto-calculations
- ✅ Default Majmaah project

---

### **Step 3: Configure Environment**

Create `.env` file in `server/` folder:

```env
# Google Earth Engine (existing)
GEE_PRIVATE_KEY=your_existing_key
GEE_CLIENT_EMAIL=your_existing_email
GEE_PROJECT_ID=your_existing_project_id

# Server
PORT=3000

# PostgreSQL (NEW - Add these)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ndvi_majmaah_db
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
```

**⚠️ Important**: Replace `YOUR_POSTGRES_PASSWORD_HERE` with your actual PostgreSQL password!

---

### **Step 4: Install New Dependencies**

```powershell
cd server
npm install
```

This will install the new `pg` (PostgreSQL client) package.

---

### **Step 5: Test Database Connection**

```powershell
cd server
npm start
```

You should see:
```
✅ PostgreSQL database connected
✅ Database connection test successful
✅ Database schema is complete
✅ Server running on port 3000
```

---

## 🔍 Verify Setup

### **Check Tables Were Created:**

```sql
-- Connect to database
psql -U postgres -d ndvi_majmaah_db

-- List all tables
\dt

-- Should show:
-- projects
-- analysis_results
-- majmaah_assignments
-- calculated_metrics
-- species_data

-- Check default project
SELECT * FROM projects;

-- Should show: Majmaah University Tree Planting project
```

---

## 🎯 What's Next

After database setup:
1. ✅ Run NDVI backend server
2. ✅ Perform a baseline assessment
3. ✅ Check data is saved to database
4. ✅ Use admin controls to assign to Majmaah
5. ✅ View in Majmaah dashboard

---

## 🐛 Troubleshooting

### **PostgreSQL not running:**
```powershell
# Start PostgreSQL service
sc start postgresql-x64-14  # or your version
```

### **Connection refused:**
- Check PostgreSQL is running
- Check credentials in .env
- Check firewall settings

### **Migration fails:**
- Check PostgreSQL user has permissions
- Try running as superuser
- Check SQL syntax errors in migration file

---

## 📊 Database Structure

```
ndvi_majmaah_db
├── projects (Majmaah projects)
├── analysis_results (All GEE analyses)
├── majmaah_assignments (Admin assignments)
├── calculated_metrics (Dashboard metrics)
└── species_data (Tree species)
```

---

## ✅ Verification Checklist

- [ ] PostgreSQL installed and running
- [ ] Database `ndvi_majmaah_db` created
- [ ] Migration SQL file executed successfully
- [ ] 5 tables created
- [ ] Default project exists
- [ ] `.env` file configured with DB credentials
- [ ] `npm install` completed (pg package installed)
- [ ] Server starts without errors
- [ ] Database connection test passes

**When all checked, you're ready to go!** 🚀

