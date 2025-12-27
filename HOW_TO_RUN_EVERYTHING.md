# 🚀 How to Run Both Dashboards - Complete Guide

## 📊 What You Have (3 Applications)

### **1. NDVI Calculator (Admin Tool)** 🛰️
- **Purpose**: For admins to run GEE satellite analysis
- **Location**: `ndvi-calculatorr/`
- **Port**: 5173
- **Features**: 
  - Run baseline assessments
  - View GEE analysis results
  - **Admin panel to assign analyses to Majmaah**

### **2. Majmaah Dashboard (Client View)** 🌳
- **Purpose**: For clients (Majmaah University) to view their data
- **Location**: `majmaah-dashboard-react/`
- **Port**: 3001
- **Features**:
  - View assigned analysis results
  - Stats and charts
  - Professional Filament-styled interface

### **3. NDVI Backend (Shared)** ⚙️
- **Purpose**: Serves both frontends
- **Location**: `ndvi-calculatorr/server/`
- **Port**: 3000
- **Features**:
  - Google Earth Engine API integration
  - PostgreSQL database
  - Admin APIs
  - Majmaah APIs

---

## 🎯 Architecture Diagram

```
┌─────────────────────────────┐
│  NDVI Calculator Frontend   │  🛰️ ADMIN TOOL
│  localhost:5173             │  - Run GEE analysis
│  (Admin Interface)          │  - Assign to Majmaah
│                             │  - Manage assignments
└────────────┬────────────────┘
             │
             ↓
┌─────────────────────────────┐
│  NDVI Backend               │  ⚙️ SHARED BACKEND
│  localhost:3000             │  - GEE API calls
│  (Node.js + PostgreSQL)     │  - Database operations
│                             │  - Serves both frontends
└────────────┬────────────────┘
             ↑
             │
┌────────────┴────────────────┐
│  Majmaah Dashboard          │  🌳 CLIENT VIEW
│  localhost:3001             │  - View assigned data
│  (Client Interface)         │  - Stats & charts
│                             │  - Professional UI
└─────────────────────────────┘

     Both connected to same backend!
```

---

## 🚀 Step-by-Step Startup

### **Terminal 1: Start PostgreSQL (Docker)**
```powershell
cd "C:\Users\Muhammad Kashif\Desktop\Fiver\Maria\Test\lun\lun2\ndvi-calculatorr\server"

docker-compose up -d
```

**Wait 30 seconds**, then verify:
```powershell
docker-compose ps
# Should show: ndvi_majmaah_postgres (healthy)
```

---

### **Terminal 2: Start NDVI Backend**
```powershell
cd "C:\Users\Muhammad Kashif\Desktop\Fiver\Maria\Test\lun\lun2\ndvi-calculatorr\server"

npm install  # First time only
npm start
```

**Should see:**
```
✅ PostgreSQL database connected
✅ Database schema is complete
✅ Server running on port 3000
📊 NDVI Calculator API: http://localhost:3000/api
🌳 Majmaah Dashboard API: http://localhost:3000/api/majmaah
👤 Admin Controls API: http://localhost:3000/api/admin
```

**Keep this terminal running!**

---

### **Terminal 3: Start NDVI Calculator (Admin Tool)**
```powershell
cd "C:\Users\Muhammad Kashif\Desktop\Fiver\Maria\Test\lun\lun2\ndvi-calculatorr\client"

npm install  # First time only
npm run dev
```

**Open**: `http://localhost:5173`

**You'll see 2 tabs:**
- 🛰️ **GEE Analysis** - Run satellite analysis
- 👤 **Admin Assignments** - Assign to Majmaah

**Keep this terminal running!**

---

### **Terminal 4: Start Majmaah Dashboard (Client View)**
```powershell
cd "C:\Users\Muhammad Kashif\Desktop\Fiver\Maria\Test\lun\lun2\majmaah-dashboard-react"

npm install  # First time only
npm run dev
```

**Open**: `http://localhost:3001`

**Login with any credentials** (mock auth)

**Keep this terminal running!**

---

## 🔄 Complete Workflow

### **As Admin:**

#### **Step 1: Run Analysis (NDVI Calculator)**
```
1. Open: http://localhost:5173
2. Click: "🛰️ GEE Analysis" tab
3. Draw polygon on map
4. Click: "Run Baseline Assessment"
5. Wait for results
6. ✅ Results saved to database automatically
```

#### **Step 2: Assign to Majmaah (Admin Panel)**
```
1. Click: "👤 Admin Assignments" tab
2. See analysis in "Unassigned Analyses" section
3. Click: "Assign to Majmaah" button
4. Enter display name: "Majmaah Campus Q1 2025"
5. ✅ Analysis now visible to clients
```

### **As Client:**

#### **Step 3: View Data (Majmaah Dashboard)**
```
1. Open: http://localhost:3001
2. Login with any credentials
3. See indicator: "🟢 Live GEE Data"
4. View real satellite analysis data:
   - Trees: 1,247 (from GEE detection)
   - Carbon: 156.8 tons (from AGC + SOC)
   - Charts with real data
```

---

## 📱 What Each Dashboard Does

### **NDVI Calculator** (`localhost:5173`)
**Purpose**: Admin tool for GEE analysis

**Tab 1: GEE Analysis**
```
┌────────────────────────────────────┐
│  Map with draw tools              │
│  [Draw Area] [Run Assessment]     │
│                                    │
│  Results Panel:                    │
│  - Site definition                 │
│  - Vegetation analysis             │
│  - Carbon metrics                  │
│  - Charts and visualizations       │
└────────────────────────────────────┘
```

**Tab 2: Admin Assignments**
```
┌────────────────────────────────────┐
│  Unassigned Analyses:              │
│  ┌──────────────────────────────┐  │
│  │ Analysis #1 - 2025-01-15     │  │
│  │ Trees: 1,247 | Carbon: 156t  │  │
│  │ [Assign to Majmaah] ←────────┼──┐
│  └──────────────────────────────┘  │ │
│                                    │ │
│  Assigned to Majmaah:              │ │
│  ┌──────────────────────────────┐  │ │
│  │ ✅ "Majmaah Campus Q1 2025"  │  │ │
│  │ [Edit] [Remove]              │  │ │
│  └──────────────────────────────┘  │ │
└────────────────────────────────────┘ │
                                       │
         Makes visible to clients ─────┘
```

---

### **Majmaah Dashboard** (`localhost:3001`)
**Purpose**: Client view (Majmaah University sees this)

```
┌────────────────────────────────────────┐
│  Sidebar         │  Dashboard           │
│  ────────────    │  ─────────────────   │
│  🏠 Dashboard    │  Dashboard    [🟢 Live GEE Data]
│                  │                       │
│  Content Mgmt    │  [Stats from GEE]    │
│  Departments     │  Trees: 1,247        │
│  Employees       │  Carbon: 156.8 tons  │
│  Certificates    │                       │
│                  │  [Map with trees]    │
│  Company Cert    │  [Charts with data]  │
│  Trees Cert      │                       │
│  Basic Cert      │                       │
└────────────────────────────────────────┘
      Client sees real satellite data!
```

---

## 🎯 Summary Table

| Application | Purpose | Port | For | Connects To |
|------------|---------|------|-----|-------------|
| **PostgreSQL** | Database | 5432 | Backend | - |
| **NDVI Backend** | API Server | 3000 | Both | PostgreSQL |
| **NDVI Calculator** | Admin Tool | 5173 | Admins | NDVI Backend |
| **Majmaah Dashboard** | Client View | 3001 | Clients | NDVI Backend |

---

## 📝 Startup Checklist

```powershell
# ✅ 1. Start Docker Desktop (one time)

# ✅ 2. Start PostgreSQL
cd ndvi-calculatorr\server
docker-compose up -d

# ✅ 3. Start NDVI Backend
npm start  # Keep running

# ✅ 4. Start NDVI Calculator (Admin)
cd ..\client
npm run dev  # Keep running
# Open: http://localhost:5173

# ✅ 5. Start Majmaah Dashboard (Client)
cd ..\..\majmaah-dashboard-react
npm run dev  # Keep running
# Open: http://localhost:3001
```

**Result:**
- 4 terminals running
- 2 dashboards accessible
- 1 shared backend
- 1 PostgreSQL database

---

## 🔄 Daily Workflow

### **Morning Startup:**
```powershell
# 1. Ensure Docker Desktop is running

# 2. Start database (if not running)
cd server
docker-compose up -d

# 3. Start all 3 apps (3 separate terminals)
npm start          # Backend (server/)
npm run dev        # NDVI Calculator (client/)
npm run dev        # Majmaah Dashboard (majmaah-dashboard-react/)
```

### **Evening Shutdown:**
```powershell
# Ctrl + C in each terminal to stop apps

# Optionally stop database (keeps data)
docker-compose down

# Or leave it running (uses minimal resources)
```

---

## 💡 Important Notes

### **Both Dashboards Share Same Backend:**
- NDVI Calculator → `http://localhost:3000/api` (GEE + Admin APIs)
- Majmaah Dashboard → `http://localhost:3000/api/majmaah` (Client APIs)
- **Same backend serves both!**

### **Admin vs Client:**
- **Admin uses**: NDVI Calculator (port 5173)
  - Run analyses
  - Manage assignments
  - Full control

- **Client uses**: Majmaah Dashboard (port 3001)
  - View assigned data
  - See stats and charts
  - Professional interface

### **Data Flow:**
```
Admin (NDVI Calculator) → Backend → Database → Backend → Client (Majmaah Dashboard)
        Analyzes                Saves          Queries         Displays
```

---

## 🎯 Quick Access URLs

**For Admins:**
- NDVI Calculator: `http://localhost:5173`
- pgAdmin: `http://localhost:5050` (optional)

**For Clients:**
- Majmaah Dashboard: `http://localhost:3001`

**Backend API:**
- Admin API: `http://localhost:3000/api/admin`
- Majmaah API: `http://localhost:3000/api/majmaah`

---

## 🔧 When to Use Each Dashboard

### **NDVI Calculator (Admin)** - Use when:
- Running new satellite analysis
- Need to analyze specific areas
- Want to assign results to clients
- Managing which data clients see
- Downloading raw GEE data

### **Majmaah Dashboard (Client)** - Use when:
- Client wants to view their data
- Presenting to Majmaah University
- Showing professional reports
- Displaying historical trends
- Exact Filament-styled interface

---

## ✅ Verification

### **All Running Successfully:**
```powershell
# Check all services
docker-compose ps  # PostgreSQL: healthy
# Backend terminal: "Server running on port 3000"
# NDVI Calculator: "Local: http://localhost:5173"
# Majmaah Dashboard: "Local: http://localhost:3001"
```

### **Test the Connection:**
1. Open Majmaah Dashboard: `http://localhost:3001`
2. Look for indicator at top
3. Should show: **"🟢 Live GEE Data"** (if backend is running)
4. Or: **"🟡 Demo Data"** (if backend not connected)

---

## 🎉 Summary

**You need to run:**
1. ✅ Docker PostgreSQL (1 container)
2. ✅ NDVI Backend (1 server)
3. ✅ NDVI Calculator Frontend (1 frontend - for admins)
4. ✅ Majmaah Dashboard Frontend (1 frontend - for clients)

**Total: 4 processes running**

**Commands:**
```powershell
# Terminal 1: Database
cd ndvi-calculatorr\server
docker-compose up -d

# Terminal 2: Backend
cd ndvi-calculatorr\server
npm start

# Terminal 3: Admin Dashboard
cd ndvi-calculatorr\client
npm run dev

# Terminal 4: Client Dashboard
cd majmaah-dashboard-react
npm run dev
```

**Both dashboards connect to the same backend!** 🔗

Ready to start? Just follow these commands! 🚀

