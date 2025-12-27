# 🌟 Complete System Overview - NDVI + Majmaah Integration

## 🎯 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    🐳 DOCKER CONTAINER                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL Database (localhost:5432)                     │ │
│  │  ─────────────────────────────────────────────────────── │ │
│  │  Tables:                                                  │ │
│  │  • projects                                               │ │
│  │  • analysis_results (All GEE data)                        │ │
│  │  • majmaah_assignments (Admin controls)                   │ │
│  │  • calculated_metrics (Dashboard metrics)                 │ │
│  │  • species_data                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                              │ Reads/Writes
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              ⚙️ NDVI BACKEND (localhost:3000)                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Node.js + Express + Google Earth Engine API              │ │
│  │  ─────────────────────────────────────────────────────── │ │
│  │  Endpoints:                                               │ │
│  │  • POST /api/baseline-assessment (GEE analysis)           │ │
│  │  • GET  /api/admin/* (Admin controls)                     │ │
│  │  • GET  /api/majmaah/* (Client data)                      │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
        ↑                                        ↑
        │                                        │
        │ Admin APIs                             │ Client APIs
        │                                        │
┌───────┴─────────┐                   ┌─────────┴───────────┐
│  🛰️ ADMIN TOOL  │                   │  🌳 CLIENT VIEW     │
│  NDVI Calculator│                   │  Majmaah Dashboard  │
│  localhost:5173 │                   │  localhost:3001     │
├─────────────────┤                   ├─────────────────────┤
│  Tab 1:         │                   │  Features:          │
│  GEE Analysis   │                   │  • Sidebar nav      │
│  • Draw areas   │                   │  • Dashboard        │
│  • Run analysis │                   │  • Stats cards      │
│  • View results │                   │  • Map widget       │
│                 │                   │  • Charts           │
│  Tab 2:         │                   │  • All real data!   │
│  Admin Panel    │                   │                     │
│  • Assign       │                   │  Shows:             │
│  • Manage       │                   │  "🟢 Live GEE Data" │
│  • Edit         │                   │                     │
└─────────────────┘                   └─────────────────────┘
     For Admins                            For Clients
```

---

## 👥 User Roles & Access

### **Admin Users:**
**Use**: NDVI Calculator (`localhost:5173`)

**Can Do:**
- ✅ Run GEE satellite analysis on any area
- ✅ View detailed analysis results
- ✅ Assign analyses to Majmaah dashboard
- ✅ Edit assignment names and notes
- ✅ Remove assignments
- ✅ Manage which data clients see

**Tabs:**
- **GEE Analysis**: Run satellite analysis
- **Admin Assignments**: Control what clients see

---

### **Client Users (Majmaah University):**
**Use**: Majmaah Dashboard (`localhost:3001`)

**Can See:**
- ✅ Trees planted (from satellite detection)
- ✅ Carbon sequestration (real calculations)
- ✅ Survival rates (historical trends)
- ✅ Vegetation health (NDVI-based)
- ✅ Professional charts and stats
- ✅ **Only data that admin assigned to them**

**Navigation:**
- Dashboard
- Departments
- Employees
- Certificates
- All with Filament styling

---

## 🔄 Data Flow Example

### **Scenario: Admin Analyzes Majmaah Campus**

```
Step 1: Admin opens NDVI Calculator
        http://localhost:5173

Step 2: Draws polygon around campus
        Clicks "Run Baseline Assessment"
        
Step 3: Backend calls Google Earth Engine
        Calculates: NDVI, carbon, tree count, etc.
        
Step 4: Backend saves results to PostgreSQL
        ✅ analysis_results table
        ✅ calculated_metrics table
        Status: assigned_to_majmaah = FALSE (not visible yet)

Step 5: Admin switches to "Admin Assignments" tab
        Sees new analysis in "Unassigned" section
        
Step 6: Admin clicks "Assign to Majmaah"
        Enters name: "Majmaah Campus Q1 2025"
        
Step 7: Backend updates database
        ✅ assigned_to_majmaah = TRUE
        ✅ visible_to_client = TRUE
        ✅ Creates majmaah_assignments record

Step 8: Client opens Majmaah Dashboard
        http://localhost:3001
        
Step 9: Dashboard fetches data
        GET /api/majmaah/dashboard-stats
        
Step 10: Backend queries PostgreSQL
         Returns real GEE data
         
Step 11: Dashboard displays
         ✅ Trees: 1,247 (real count from satellite!)
         ✅ Carbon: 156.8 tons (real AGC + SOC!)
         ✅ All charts with real data!
         ✅ Shows "🟢 Live GEE Data" indicator
```

---

## 📊 Port Reference

| Application | Port | URL | Purpose |
|------------|------|-----|---------|
| PostgreSQL | 5432 | - | Database |
| pgAdmin | 5050 | http://localhost:5050 | DB Management (optional) |
| **NDVI Backend** | **3000** | http://localhost:3000 | API Server |
| **NDVI Calculator** | **5173** | http://localhost:5173 | Admin Tool |
| **Majmaah Dashboard** | **3001** | http://localhost:3001 | Client View |

---

## 🚀 Quick Commands Reference

### **Start Everything:**
```powershell
# Terminal 1
cd ndvi-calculatorr\server
docker-compose up -d && npm start

# Terminal 2
cd ndvi-calculatorr\client
npm run dev

# Terminal 3
cd majmaah-dashboard-react
npm run dev
```

### **Stop Everything:**
```powershell
# Ctrl + C in each terminal
# Then:
cd ndvi-calculatorr\server
docker-compose down
```

### **Check Status:**
```powershell
# Database
docker-compose ps

# Backend
# Check terminal for "Server running on port 3000"

# Frontends
# Check terminals for "Local: http://localhost:..."
```

---

## 🎨 User Interface Access

### **For Development/Admin:**
```
NDVI Calculator: http://localhost:5173
├── Tab 1: GEE Analysis (run analysis)
└── Tab 2: Admin Assignments (assign to Majmaah)

pgAdmin: http://localhost:5050 (database management)
├── Email: admin@urimpact.com
└── Password: admin123
```

### **For Clients/Presentation:**
```
Majmaah Dashboard: http://localhost:3001
├── Login: any email/password (mock auth)
└── View: real GEE satellite data
```

---

## 💾 Data Persistence

### **Database Data:**
- ✅ Stored in Docker volume
- ✅ Persists across restarts
- ✅ Survives system reboot
- ❌ Only deleted with `docker-compose down -v`

### **When Docker Restarts:**
```
docker-compose down     → Data preserved ✅
docker-compose up -d    → Data still there ✅
docker-compose down -v  → Data deleted ❌
```

---

## 🔧 Configuration Files

### **NDVI Backend:**
- `.env` - Database credentials
- `docker-compose.yml` - PostgreSQL setup
- `migrations/001-initial-schema.sql` - Database schema

### **Majmaah Dashboard:**
- `.env` - API base URL (points to NDVI backend)

**Both dashboards connect to same backend at `localhost:3000`**

---

## 📈 What Clients See vs What Admins Control

### **Admin Controls (NDVI Calculator):**
```
Admin decides:
├── Which analyses to show
├── Display names
├── Notes and details
└── Visibility on/off
```

### **Client Views (Majmaah Dashboard):**
```
Client sees:
├── Only assigned analyses
├── Real satellite data
├── Professional interface
└── Cannot edit or run new analyses
```

**Perfect separation of concerns!**

---

## ✅ Complete Setup Checklist

- [ ] Docker Desktop installed and running
- [ ] `docker-compose up -d` started PostgreSQL
- [ ] Database initialized (5 tables created)
- [ ] Backend running on port 3000
- [ ] NDVI Calculator running on port 5173
- [ ] Majmaah Dashboard running on port 3001
- [ ] Can run analysis in NDVI Calculator
- [ ] Can assign in Admin tab
- [ ] Majmaah shows "Live GEE Data" indicator

**When all checked, integration is complete!** ✅

---

## 🎉 You're Ready!

**2 Dashboards:**
- 🛰️ NDVI Calculator (Admin tool)
- 🌳 Majmaah Dashboard (Client view)

**1 Backend:**
- ⚙️ Serves both dashboards

**1 Database:**
- 🐳 PostgreSQL in Docker

**Complete integration working!** 🚀

Just follow the startup commands above!

