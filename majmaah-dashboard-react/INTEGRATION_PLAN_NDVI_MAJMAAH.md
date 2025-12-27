# 🔗 Integration Plan: NDVI Calculator ↔ Majmaah Dashboard

## 📋 Current State Analysis

### **NDVI Calculator Application**
**Location**: `C:\Users\Muhammad Kashif\Desktop\Fiver\Maria\Test\lun\lun2\ndvi-calculatorr`

**Architecture**:
- **Frontend**: React + TypeScript + Mapbox + Vite (Port 5173)
- **Backend**: Node.js + Express + Google Earth Engine API (Port 3000)
- **Database**: ❌ None (currently stores nothing)

**Features**:
1. **Baseline Assessment** - Complete vegetation analysis
2. **NDVI Calculation** - Vegetation health index
3. **AGC** - Above Ground Carbon estimation
4. **SOC** - Soil Organic Carbon analysis
5. **MHI** - Mangrove Health Index

**Backend Endpoints**:
```
POST /api/baseline-assessment
POST /api/ndvi
POST /api/agc
POST /api/soc
POST /api/mhi
GET  /api/default-aoi
```

**Data Flow**:
```
User draws polygon → Backend calls GEE API → Results returned → Displayed in charts
❌ Results are NOT saved to database
```

---

### **Majmaah Dashboard** (React)
**Location**: `C:\Users\Muhammad Kashif\Desktop\Fiver\Maria\Test\lun\lun2\majmaah-dashboard-react`

**Architecture**:
- **Frontend**: React + TypeScript + Mapbox + Recharts (Port 3001)
- **Backend**: ❌ None (ready for Node.js)
- **Database**: ❌ None (ready for PostgreSQL)

**Current State**:
- Uses mock data
- Has API service layer ready
- All widgets and charts prepared
- Exact Filament styling

---

## 🎯 Integration Goal

**Connect both applications** so that:
1. NDVI analysis results are **saved to PostgreSQL**
2. Majmaah dashboard can **fetch and display** these analysis results
3. Users can see GEE analysis data in the Majmaah dashboard
4. Historical analysis results are stored and retrievable

---

## 🏗️ Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NDVI Calculator Frontend                 │
│              (React + Mapbox + GEE Visualizations)          │
│                    localhost:5173                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    HTTP POST requests
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              NDVI Calculator Backend (Enhanced)             │
│        Node.js + Express + GEE API + PostgreSQL             │
│                    localhost:3000                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   Controllers:                                      │   │
│  │   - Baseline, NDVI, AGC, SOC, MHI                  │   │
│  │   - NEW: Save results to database after calculation│   │
│  └─────────────────────────────────────────────────────┘   │
│                            ↓                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   PostgreSQL Database                               │   │
│  │   Tables:                                           │   │
│  │   - analysis_results                                │   │
│  │   - baseline_assessments                            │   │
│  │   - ndvi_calculations                               │   │
│  │   - carbon_metrics                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                            ↑                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   NEW API Endpoints for Majmaah:                    │   │
│  │   GET /api/majmaah/latest-analysis                  │   │
│  │   GET /api/majmaah/analysis-history                 │   │
│  │   GET /api/majmaah/carbon-trends                    │   │
│  │   GET /api/majmaah/vegetation-metrics               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↑
                    HTTP GET requests
                            ↑
┌─────────────────────────────────────────────────────────────┐
│              Majmaah Dashboard Frontend                     │
│       React + TypeScript + Mapbox + Recharts               │
│                    localhost:3001                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   Dashboard Widgets:                                │   │
│  │   - Displays GEE analysis results from database     │   │
│  │   - Shows carbon metrics                            │   │
│  │   - Vegetation health charts                        │   │
│  │   - Historical trends                               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Implementation Steps

### **Phase 1: Add PostgreSQL to NDVI Backend** ⏱️ 2 hours

#### Step 1.1: Install PostgreSQL Dependencies
```bash
cd C:\Users\Muhammad Kashif\Desktop\Fiver\Maria\Test\lun\lun2\ndvi-calculatorr\server
npm install pg sequelize
```

#### Step 1.2: Create Database Schema
File: `server/src/models/database.js`
```javascript
// Tables needed:
- analysis_results (id, type, coordinates, results, created_at, user_id)
- baseline_assessments (all baseline metrics)
- carbon_metrics (AGC, SOC, total carbon)
- vegetation_metrics (NDVI, EVI, canopy cover)
```

#### Step 1.3: Create Database Connection
File: `server/src/config/database.js`
```javascript
// PostgreSQL connection configuration
```

---

### **Phase 2: Modify NDVI Backend to Save Results** ⏱️ 3 hours

#### Step 2.1: Update Controllers
Modify all controllers to:
1. Calculate results (existing functionality)
2. **NEW**: Save results to PostgreSQL
3. Return results to frontend

Example for `baselineController.js`:
```javascript
export const getBaselineAssessment = async (req, res) => {
  // 1. Calculate (existing)
  const results = await performBaselineAssessment(coordinates);
  
  // 2. Save to database (NEW)
  await saveBaselineAssessment({
    coordinates,
    totalArea: results.siteDefinition.totalArea,
    canopyCover: results.existingVegetation.canopyCoverPercent,
    totalAGB: results.agbEstimation.totalAGBTonnes,
    ndviMean: results.baselineImagery.ndviStats.mean,
    // ... more metrics
  });
  
  // 3. Return results
  res.json(results);
};
```

#### Step 2.2: Create Database Service
File: `server/src/services/databaseService.js`
```javascript
- saveBaselineAssessment()
- saveNDVICalculation()
- saveAGCCalculation()
- saveSOCCalculation()
- getLatestAnalysis()
- getAnalysisHistory()
```

---

### **Phase 3: Create API Endpoints for Majmaah Dashboard** ⏱️ 2 hours

#### Step 3.1: New Routes
File: `server/src/routes/majmaahRoutes.js`

```javascript
GET  /api/majmaah/latest-analysis        // Latest baseline assessment
GET  /api/majmaah/analysis-history       // All past analyses
GET  /api/majmaah/carbon-trends          // Carbon data over time
GET  /api/majmaah/vegetation-metrics     // Vegetation health trends
GET  /api/majmaah/dashboard-stats        // Summary stats for dashboard
```

#### Step 3.2: New Controller
File: `server/src/controllers/majmaahController.js`

```javascript
export const getLatestAnalysis = async (req, res) => {
  const analysis = await db.getLatestBaselineAssessment();
  res.json(analysis);
};

export const getDashboardStats = async (req, res) => {
  const stats = await db.getMajmaahDashboardStats();
  // Returns: totalTrees, carbonSequestered, survivalRate, etc.
  res.json(stats);
};
```

---

### **Phase 4: Connect Majmaah Dashboard to NDVI Backend** ⏱️ 2 hours

#### Step 4.1: Update API Configuration
File: `majmaah-dashboard-react/src/config/index.ts`
```typescript
api: {
  baseUrl: 'http://localhost:3000/api',  // Point to NDVI backend
}
```

#### Step 4.2: Create API Service Methods
File: `majmaah-dashboard-react/src/services/api.ts`
```typescript
// Add new methods:
async getLatestGEEAnalysis() {
  return this.get('/majmaah/latest-analysis');
}

async getVegetationMetrics() {
  return this.get('/majmaah/vegetation-metrics');
}

async getCarbonTrends() {
  return this.get('/majmaah/carbon-trends');
}
```

#### Step 4.3: Update Dashboard Widgets
File: `majmaah-dashboard-react/src/pages/Dashboard.tsx`
```typescript
useEffect(() => {
  // Fetch real data from NDVI backend
  const fetchData = async () => {
    const stats = await apiService.getDashboardStats();
    const analysis = await apiService.getLatestGEEAnalysis();
    // Update state with real data
  };
  fetchData();
}, []);
```

---

### **Phase 5: Create New Widgets in Majmaah Dashboard** ⏱️ 3 hours

#### New Widgets to Add:
1. **GEE Analysis Overview Widget**
   - Latest baseline assessment results
   - NDVI, EVI, AGC, SOC metrics
   
2. **Carbon Sequestration Widget** (Real data)
   - From GEE AGC/SOC calculations
   - Historical trends chart
   
3. **Vegetation Health Widget** (Real data)
   - NDVI trends over time
   - Canopy cover evolution
   
4. **Analysis History Widget**
   - List of all past analyses
   - Clickable to view details

---

## 📊 Database Schema

### **Table: analysis_results**
```sql
CREATE TABLE analysis_results (
  id SERIAL PRIMARY KEY,
  analysis_type VARCHAR(50) NOT NULL, -- 'baseline', 'ndvi', 'agc', 'soc', 'mhi'
  coordinates JSONB NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  user_id INTEGER,
  project_name VARCHAR(255),
  location_name VARCHAR(255)
);
```

### **Table: baseline_assessments**
```sql
CREATE TABLE baseline_assessments (
  id SERIAL PRIMARY KEY,
  analysis_id INTEGER REFERENCES analysis_results(id),
  total_area NUMERIC(10, 2),
  candidate_area NUMERIC(10, 2),
  candidate_area_percent NUMERIC(5, 2),
  canopy_cover_percent NUMERIC(5, 2),
  tree_count INTEGER,
  total_agb_tonnes NUMERIC(10, 2),
  average_agb NUMERIC(10, 2),
  ndvi_mean NUMERIC(5, 3),
  ndvi_min NUMERIC(5, 3),
  ndvi_max NUMERIC(5, 3),
  evi_mean NUMERIC(5, 3),
  evi_min NUMERIC(5, 3),
  evi_max NUMERIC(5, 3),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Table: carbon_metrics**
```sql
CREATE TABLE carbon_metrics (
  id SERIAL PRIMARY KEY,
  analysis_id INTEGER REFERENCES analysis_results(id),
  agc_mean NUMERIC(10, 2),
  soc_mean NUMERIC(10, 2),
  total_carbon NUMERIC(10, 2),
  area_hectares NUMERIC(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Table: vegetation_metrics**
```sql
CREATE TABLE vegetation_metrics (
  id SERIAL PRIMARY KEY,
  analysis_id INTEGER REFERENCES analysis_results(id),
  ndvi_mean NUMERIC(5, 3),
  evi_mean NUMERIC(5, 3),
  canopy_cover NUMERIC(5, 2),
  tree_count INTEGER,
  average_health_score NUMERIC(3, 2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔌 API Integration Points

### **NDVI Backend** (Port 3000)
**New Endpoints to Create**:
```
GET  /api/majmaah/dashboard-stats
     Returns: { totalAnalyses, totalTrees, totalCarbon, avgNDVI }

GET  /api/majmaah/latest-analysis
     Returns: Latest baseline assessment from database

GET  /api/majmaah/analysis-history?limit=10
     Returns: Array of past analyses

GET  /api/majmaah/carbon-trends?days=30
     Returns: Carbon metrics over last N days

GET  /api/majmaah/vegetation-trends?days=30
     Returns: Vegetation metrics over time

GET  /api/majmaah/analysis/:id
     Returns: Specific analysis by ID
```

### **Majmaah Dashboard** (Port 3001)
**New API Calls to Add**:
```typescript
// In src/services/api.ts

async getDashboardStats() {
  return this.get('/majmaah/dashboard-stats');
}

async getLatestAnalysis() {
  return this.get('/majmaah/latest-analysis');
}

async getAnalysisHistory(limit = 10) {
  return this.get(`/majmaah/analysis-history?limit=${limit}`);
}

async getCarbonTrends(days = 30) {
  return this.get(`/majmaah/carbon-trends?days=${days}`);
}
```

---

## 📊 New Widgets for Majmaah Dashboard

### **1. GEE Analysis Overview Card**
Shows latest baseline assessment:
- Total area analyzed
- Canopy cover %
- Total AGB (tonnes)
- NDVI mean
- EVI mean
- Tree count detected

### **2. Real-time Carbon Metrics**
Replace mock carbon data with real GEE calculations:
- AGC (Above Ground Carbon)
- SOC (Soil Organic Carbon)
- Total Carbon Stock
- Historical trends chart

### **3. Vegetation Health Dashboard**
Show real NDVI/EVI data:
- Current NDVI mean
- NDVI trends over time
- Canopy cover evolution
- Tree health distribution

### **4. Analysis History Table**
List all past analyses:
- Date/time
- Location analyzed
- Key metrics (NDVI, Carbon, Trees)
- Action button to view details

---

## 🚀 Implementation Roadmap

### **Week 1: Database Setup**
- [ ] Install PostgreSQL
- [ ] Create database and tables
- [ ] Set up database connection in NDVI backend
- [ ] Test connection

### **Week 2: Backend Integration**
- [ ] Update all controllers to save results
- [ ] Create database service layer
- [ ] Add Majmaah-specific endpoints
- [ ] Test data saving and retrieval

### **Week 3: Frontend Integration**
- [ ] Update Majmaah dashboard API service
- [ ] Create new GEE-based widgets
- [ ] Replace mock data with real API calls
- [ ] Test end-to-end flow

### **Week 4: Testing & Polish**
- [ ] Test complete flow
- [ ] Add error handling
- [ ] Optimize performance
- [ ] Add loading states
- [ ] Documentation

---

## 📝 Files to Create/Modify

### **NDVI Backend** (New Files)
```
server/
├── src/
│   ├── config/
│   │   └── database.js          # PostgreSQL config
│   ├── models/
│   │   ├── AnalysisResult.js    # Analysis model
│   │   ├── BaselineAssessment.js
│   │   ├── CarbonMetric.js
│   │   └── VegetationMetric.js
│   ├── services/
│   │   └── databaseService.js   # DB operations
│   ├── routes/
│   │   └── majmaahRoutes.js     # Majmaah endpoints
│   └── controllers/
│       └── majmaahController.js # Majmaah controller
└── migrations/
    └── 001-initial-schema.sql   # Database schema
```

### **NDVI Backend** (Modified Files)
```
server/src/controllers/
├── baselineController.js  # Add save to DB
├── ndviController.js      # Add save to DB
├── agcController.js       # Add save to DB
└── socController.js       # Add save to DB
```

### **Majmaah Dashboard** (Modified Files)
```
src/
├── services/
│   └── api.ts             # Add GEE endpoints
├── pages/
│   └── Dashboard.tsx      # Add GEE widgets
└── components/widgets/
    ├── GEEAnalysisWidget.tsx      # NEW
    ├── RealCarbonWidget.tsx       # NEW
    ├── VegetationHealthWidget.tsx # NEW
    └── AnalysisHistoryWidget.tsx  # NEW
```

---

## 🔐 Environment Variables

### **NDVI Backend** (.env)
```env
# Existing
GEE_PRIVATE_KEY=...
GEE_CLIENT_EMAIL=...
GEE_PROJECT_ID=...

# NEW - PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/ndvi_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ndvi_db
DB_USER=postgres
DB_PASSWORD=your_password

# NEW - CORS for Majmaah
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001
```

### **Majmaah Dashboard** (.env)
```env
# Existing
VITE_MAPBOX_ACCESS_TOKEN=...

# UPDATE
VITE_API_BASE_URL=http://localhost:3000/api  # Point to NDVI backend
```

---

## 📈 Data Flow Example

### **User performs analysis in NDVI Calculator:**

1. User draws polygon on NDVI map
2. Clicks "Run Baseline Assessment"
3. Frontend sends POST to `/api/baseline-assessment`
4. Backend:
   - Calls GEE API (existing)
   - Calculates metrics (existing)
   - **NEW**: Saves to PostgreSQL
   - Returns results
5. Frontend displays results

### **User views Majmaah Dashboard:**

1. Dashboard loads
2. Makes GET request to `/api/majmaah/dashboard-stats`
3. NDVI backend queries PostgreSQL
4. Returns aggregated stats
5. Majmaah dashboard displays real GEE data

---

## ✅ Benefits

1. **Persistent Data**: All analyses saved permanently
2. **Historical Tracking**: View trends over time
3. **Real GEE Data**: Majmaah shows actual satellite analysis
4. **Unified Platform**: Both dashboards connected
5. **Scalable**: Can add more analysis types

---

## 🎯 Expected Result

### **Before Integration:**
- NDVI Calculator: Works but doesn't save data
- Majmaah Dashboard: Shows mock data only

### **After Integration:**
- NDVI Calculator: Saves all results to PostgreSQL
- Majmaah Dashboard: Shows **real GEE analysis data**
- Both applications connected through shared database
- Historical data available for trends

---

## 🚀 Next Steps

**Choose your starting point:**

**Option A: Start with Database Setup**
- I'll create the PostgreSQL schema
- Set up database connection
- Create models and migrations

**Option B: Start with API Integration**
- Add Majmaah endpoints first
- Use in-memory storage temporarily
- Add database later

**Option C: Do Everything Step-by-Step**
- I'll implement all phases systematically
- Test each phase before moving to next

---

**Which approach would you like to start with?** 🚀

