# 🚀 Detailed Implementation Plan - NDVI + Majmaah Integration

## 🎯 Enhanced Requirements

### **1. Admin Control System**
✅ Admin can **assign specific analyses** to Majmaah dashboard
✅ Admin can **select which client** sees which analysis
✅ Admin can **toggle visibility** of specific analyses
✅ Only **assigned analyses** appear in Majmaah dashboard

### **2. Complete Data Mapping**
✅ Baseline assessment provides **ALL data** needed for Majmaah widgets
✅ GEE analysis maps to **all dashboard metrics**
✅ Historical tracking for **trend charts**

---

## 📊 Majmaah Dashboard Data Requirements

### **Required for ALL Widgets:**

#### **Stats Overview (4 Cards):**
1. **Trees Planted** → From GEE tree detection
2. **Carbon Sequestration** → From GEE AGC + SOC
3. **Survival Rate** → From historical NDVI comparisons
4. **Communities Supported** → Configured per project

#### **Growth & Carbon Impact Chart:**
- Monthly tree growth data
- Monthly carbon accumulation
- Source: Historical baseline assessments

#### **Carbon Sequestration Chart:**
- Monthly CO₂ sequestration values
- Source: AGC + SOC calculations over time

#### **Canopy Coverage Chart:**
- Canopy coverage percentage distribution
- Source: GEE canopy detection

#### **Species Richness Chart:**
- Tree species counts and distribution
- Source: Combined with field data

#### **Ecosystem Services Chart:**
- Air quality, Water retention, Biodiversity, Soil health, Carbon storage
- Source: Calculated from NDVI, EVI, carbon, canopy metrics

#### **Vegetation Health Chart:**
- Health condition distribution (Excellent, Good, Fair)
- Source: NDVI health scores

#### **Survival Rate Chart:**
- Yearly survival rate trends
- Source: Comparing tree counts over time

---

## 🏗️ Enhanced Database Schema

### **Table 1: projects**
```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  client_id INTEGER,
  location_name VARCHAR(255),
  coordinates JSONB,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Table 2: analysis_results**
```sql
CREATE TABLE analysis_results (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  analysis_type VARCHAR(50) NOT NULL, -- 'baseline', 'ndvi', 'agc', 'soc'
  analysis_date DATE NOT NULL,
  coordinates JSONB NOT NULL,
  
  -- Baseline Assessment Metrics
  total_area_ha NUMERIC(10, 2),
  candidate_area_ha NUMERIC(10, 2),
  constraint_area_ha NUMERIC(10, 2),
  
  -- Vegetation Metrics
  tree_count INTEGER,
  canopy_cover_percent NUMERIC(5, 2),
  average_health_score NUMERIC(3, 2),
  ndvi_mean NUMERIC(5, 3),
  ndvi_min NUMERIC(5, 3),
  ndvi_max NUMERIC(5, 3),
  evi_mean NUMERIC(5, 3),
  evi_min NUMERIC(5, 3),
  evi_max NUMERIC(5, 3),
  
  -- Carbon Metrics
  total_agb_kg NUMERIC(12, 2),
  total_agb_tonnes NUMERIC(10, 2),
  average_agb_kg NUMERIC(10, 2),
  total_agc_tonnes NUMERIC(10, 2),
  total_soc_tonnes NUMERIC(10, 2),
  total_carbon_tonnes NUMERIC(10, 2),
  co2_equivalent_tonnes NUMERIC(10, 2), -- AGC * 3.67
  
  -- Tree Data
  trees_geojson JSONB, -- All individual trees with coordinates
  
  -- Visualization Data
  ndvi_map_id VARCHAR(255),
  ndvi_url_format TEXT,
  evi_map_id VARCHAR(255),
  evi_url_format TEXT,
  canopy_map_id VARCHAR(255),
  canopy_url_format TEXT,
  
  -- Full results for reference
  full_results JSONB,
  
  -- Assignment
  assigned_to_majmaah BOOLEAN DEFAULT false,
  visible_to_client BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_project_date ON analysis_results(project_id, analysis_date);
CREATE INDEX idx_assigned ON analysis_results(assigned_to_majmaah, visible_to_client);
```

### **Table 3: majmaah_assignments**
```sql
CREATE TABLE majmaah_assignments (
  id SERIAL PRIMARY KEY,
  analysis_id INTEGER REFERENCES analysis_results(id),
  assigned_by INTEGER, -- admin user id
  assigned_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  display_name VARCHAR(255), -- Custom name for dashboard
  display_order INTEGER DEFAULT 0
);
```

### **Table 4: calculated_metrics** (Pre-calculated for performance)
```sql
CREATE TABLE calculated_metrics (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  metric_date DATE NOT NULL,
  
  -- Dashboard Stats
  total_trees INTEGER,
  carbon_sequestered_tonnes NUMERIC(10, 2),
  survival_rate_percent NUMERIC(5, 2),
  canopy_coverage_percent NUMERIC(5, 2),
  
  -- Growth Metrics
  tree_growth_cm NUMERIC(6, 2),
  carbon_growth_kg NUMERIC(10, 2),
  
  -- Ecosystem Services (0-100 scores)
  air_quality_score NUMERIC(5, 2),
  water_retention_score NUMERIC(5, 2),
  biodiversity_score NUMERIC(5, 2),
  soil_health_score NUMERIC(5, 2),
  carbon_storage_score NUMERIC(5, 2),
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_project_metric_date ON calculated_metrics(project_id, metric_date);
```

---

## 🔧 Enhanced NDVI Backend Implementation

### **File 1: Database Configuration**
📁 `server/src/config/database.js`
```javascript
import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ndvi_majmaah_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL error:', err);
});

export default pool;
```

---

### **File 2: Database Service**
📁 `server/src/services/databaseService.js`
```javascript
import pool from '../config/database.js';

// Save baseline assessment with ALL Majmaah metrics
export const saveBaselineAssessment = async (data) => {
  const {
    projectId,
    coordinates,
    siteDefinition,
    existingVegetation,
    agbEstimation,
    baselineImagery,
    fullResults
  } = data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Calculate additional metrics for Majmaah dashboard
    const totalCarbonTonnes = (agbEstimation.totalAGBTonnes * 0.47 * 3.67) || 0; // CO2 equivalent
    
    // Ecosystem service scores (calculated from GEE data)
    const airQualityScore = calculateAirQualityScore(baselineImagery.ndviStats.mean);
    const waterRetentionScore = calculateWaterRetentionScore(siteDefinition.candidateAreaPercent);
    const biodiversityScore = calculateBiodiversityScore(existingVegetation.treeCount);
    const soilHealthScore = calculateSoilHealthScore(baselineImagery.eviStats.mean);
    const carbonStorageScore = calculateCarbonStorageScore(totalCarbonTonnes);

    // Insert analysis result
    const result = await client.query(`
      INSERT INTO analysis_results (
        project_id, analysis_type, analysis_date, coordinates,
        total_area_ha, candidate_area_ha, constraint_area_ha,
        tree_count, canopy_cover_percent, average_health_score,
        ndvi_mean, ndvi_min, ndvi_max,
        evi_mean, evi_min, evi_max,
        total_agb_kg, total_agb_tonnes, average_agb_kg,
        total_carbon_tonnes, co2_equivalent_tonnes,
        trees_geojson,
        ndvi_map_id, ndvi_url_format,
        evi_map_id, evi_url_format,
        canopy_map_id, canopy_url_format,
        full_results,
        assigned_to_majmaah, visible_to_client
      ) VALUES (
        $1, 'baseline', CURRENT_DATE, $2,
        $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11,
        $12, $13, $14,
        $15, $16, $17,
        $18, $19,
        $20,
        $21, $22,
        $23, $24,
        $25, $26,
        $27,
        false, false
      ) RETURNING id
    `, [
      projectId,
      JSON.stringify(coordinates),
      siteDefinition.totalArea,
      siteDefinition.candidatePlantingArea,
      siteDefinition.constraintArea,
      existingVegetation.treeCount,
      existingVegetation.canopyCoverPercent,
      existingVegetation.averageHealthScore,
      baselineImagery.ndviStats.mean,
      baselineImagery.ndviStats.min,
      baselineImagery.ndviStats.max,
      baselineImagery.eviStats.mean,
      baselineImagery.eviStats.min,
      baselineImagery.eviStats.max,
      agbEstimation.totalAGB,
      agbEstimation.totalAGBTonnes,
      agbEstimation.averageAGB,
      totalCarbonTonnes,
      totalCarbonTonnes * 3.67,
      JSON.stringify(existingVegetation.trees),
      baselineImagery.ndviMapId,
      baselineImagery.ndviUrlFormat,
      baselineImagery.eviMapId,
      baselineImagery.eviUrlFormat,
      existingVegetation.canopyMapId,
      existingVegetation.canopyUrlFormat,
      JSON.stringify(fullResults)
    ]);

    const analysisId = result.rows[0].id;

    // Insert calculated metrics for dashboard
    await client.query(`
      INSERT INTO calculated_metrics (
        project_id, metric_date,
        total_trees, carbon_sequestered_tonnes,
        survival_rate_percent, canopy_coverage_percent,
        tree_growth_cm, carbon_growth_kg,
        air_quality_score, water_retention_score,
        biodiversity_score, soil_health_score, carbon_storage_score
      ) VALUES (
        $1, CURRENT_DATE,
        $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12
      )
    `, [
      projectId,
      existingVegetation.treeCount,
      totalCarbonTonnes,
      100, // Initial survival rate (will be calculated from historical data later)
      existingVegetation.canopyCoverPercent,
      0, // Initial growth (will be calculated from time-series)
      0, // Initial carbon growth
      airQualityScore,
      waterRetentionScore,
      biodiversityScore,
      soilHealthScore,
      carbonStorageScore
    ]);

    await client.query('COMMIT');
    return analysisId;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Calculate ecosystem service scores (0-100)
const calculateAirQualityScore = (ndviMean) => {
  // NDVI closer to 1 means better air quality
  return Math.min(100, Math.max(0, ((ndviMean + 1) / 2) * 100));
};

const calculateWaterRetentionScore = (candidatePercent) => {
  // Higher vegetation area means better water retention
  return Math.min(100, candidatePercent);
};

const calculateBiodiversityScore = (treeCount) => {
  // More trees = higher biodiversity (logarithmic scale)
  return Math.min(100, Math.log10(treeCount + 1) * 25);
};

const calculateSoilHealthScore = (eviMean) => {
  // EVI indicates soil and vegetation health
  return Math.min(100, Math.max(0, ((eviMean + 1) / 2) * 100));
};

const calculateCarbonStorageScore = (carbonTonnes) => {
  // Scale to 0-100 (assuming 500 tonnes is excellent)
  return Math.min(100, (carbonTonnes / 500) * 100);
};

// Assign analysis to Majmaah dashboard
export const assignToMajmaah = async (analysisId, clientId, displayName, notes) => {
  const client = await pool.connect();
  try {
    // Update analysis as assigned
    await client.query(`
      UPDATE analysis_results 
      SET assigned_to_majmaah = true, 
          visible_to_client = true,
          updated_at = NOW()
      WHERE id = $1
    `, [analysisId]);

    // Create assignment record
    await client.query(`
      INSERT INTO majmaah_assignments (
        analysis_id, assigned_by, notes, display_name
      ) VALUES ($1, $2, $3, $4)
    `, [analysisId, clientId, notes, displayName]);

    return { success: true };
  } finally {
    client.release();
  }
};

// Get analyses assigned to Majmaah
export const getMajmaahAnalyses = async (projectId = null) => {
  const query = projectId
    ? `SELECT ar.*, ma.display_name, ma.assigned_at 
       FROM analysis_results ar
       LEFT JOIN majmaah_assignments ma ON ar.id = ma.analysis_id
       WHERE ar.assigned_to_majmaah = true 
       AND ar.visible_to_client = true
       AND ar.project_id = $1
       ORDER BY ar.analysis_date DESC`
    : `SELECT ar.*, ma.display_name, ma.assigned_at 
       FROM analysis_results ar
       LEFT JOIN majmaah_assignments ma ON ar.id = ma.analysis_id
       WHERE ar.assigned_to_majmaah = true 
       AND ar.visible_to_client = true
       ORDER BY ar.analysis_date DESC`;

  const result = projectId
    ? await pool.query(query, [projectId])
    : await pool.query(query);

  return result.rows;
};

// Get aggregated stats for Majmaah dashboard
export const getMajmaahDashboardStats = async (projectId) => {
  const result = await pool.query(`
    SELECT 
      SUM(tree_count) as total_trees,
      SUM(co2_equivalent_tonnes) as total_carbon_co2,
      AVG(canopy_cover_percent) as avg_canopy_coverage,
      COUNT(DISTINCT analysis_date) as total_analyses,
      MAX(analysis_date) as latest_analysis_date
    FROM analysis_results
    WHERE assigned_to_majmaah = true 
    AND visible_to_client = true
    ${projectId ? 'AND project_id = $1' : ''}
  `, projectId ? [projectId] : []);

  const stats = result.rows[0];

  // Calculate survival rate from historical data
  const survivalRate = await calculateSurvivalRate(projectId);

  return {
    totalTrees: parseInt(stats.total_trees) || 0,
    carbonSequestered: parseFloat(stats.total_carbon_co2) || 0,
    survivalRate: survivalRate,
    canopyCoverage: parseFloat(stats.avg_canopy_coverage) || 0,
    totalAnalyses: parseInt(stats.total_analyses) || 0,
    latestAnalysisDate: stats.latest_analysis_date
  };
};

// Calculate survival rate from historical NDVI data
const calculateSurvivalRate = async (projectId) => {
  const result = await pool.query(`
    SELECT 
      tree_count,
      analysis_date,
      ndvi_mean
    FROM analysis_results
    WHERE project_id = $1
    AND assigned_to_majmaah = true
    ORDER BY analysis_date ASC
    LIMIT 2
  `, [projectId]);

  if (result.rows.length < 2) return 95.0; // Default

  const oldest = result.rows[0];
  const newest = result.rows[result.rows.length - 1];

  // Calculate survival based on tree count and NDVI health
  const treeRetention = (newest.tree_count / oldest.tree_count) * 100;
  const healthRetention = (newest.ndvi_mean / oldest.ndvi_mean) * 100;

  // Weighted average (60% trees, 40% health)
  const survivalRate = (treeRetention * 0.6) + (healthRetention * 0.4);

  return Math.min(100, Math.max(0, survivalRate));
};

// Get time-series data for charts
export const getCarbonTrends = async (projectId, months = 12) => {
  const result = await pool.query(`
    SELECT 
      analysis_date,
      co2_equivalent_tonnes as carbon,
      tree_count
    FROM analysis_results
    WHERE project_id = $1
    AND assigned_to_majmaah = true
    AND analysis_date >= CURRENT_DATE - INTERVAL '${months} months'
    ORDER BY analysis_date ASC
  `, [projectId]);

  return result.rows.map(row => ({
    month: row.analysis_date.toLocaleDateString('en-US', { month: 'short' }),
    value: parseFloat(row.carbon) || 0
  }));
};

export const getVegetationTrends = async (projectId, months = 12) => {
  const result = await pool.query(`
    SELECT 
      analysis_date,
      ndvi_mean,
      evi_mean,
      canopy_cover_percent,
      tree_count
    FROM analysis_results
    WHERE project_id = $1
    AND assigned_to_majmaah = true
    AND analysis_date >= CURRENT_DATE - INTERVAL '${months} months'
    ORDER BY analysis_date ASC
  `, [projectId]);

  return result.rows;
};

export const getCanopyCoverageDistribution = async (projectId) => {
  const result = await pool.query(`
    SELECT canopy_cover_percent
    FROM analysis_results
    WHERE project_id = $1
    AND assigned_to_majmaah = true
    ORDER BY analysis_date DESC
    LIMIT 1
  `, [projectId]);

  if (result.rows.length === 0) return [];

  const canopy = result.rows[0].canopy_cover_percent;

  // Return distribution based on latest analysis
  return [
    { name: '0-25%', value: canopy <= 25 ? canopy : 0 },
    { name: '25-50%', value: canopy > 25 && canopy <= 50 ? canopy - 25 : 0 },
    { name: '50-75%', value: canopy > 50 && canopy <= 75 ? canopy - 50 : 0 },
    { name: '75-100%', value: canopy > 75 ? canopy - 75 : 0 },
  ];
};

export const getEcosystemServices = async (projectId) => {
  const result = await pool.query(`
    SELECT 
      air_quality_score,
      water_retention_score,
      biodiversity_score,
      soil_health_score,
      carbon_storage_score
    FROM calculated_metrics
    WHERE project_id = $1
    ORDER BY metric_date DESC
    LIMIT 1
  `, [projectId]);

  if (result.rows.length === 0) return [];

  const scores = result.rows[0];
  return [
    { service: 'Air Quality', value: scores.air_quality_score },
    { service: 'Water Retention', value: scores.water_retention_score },
    { service: 'Biodiversity', value: scores.biodiversity_score },
    { service: 'Soil Health', value: scores.soil_health_score },
    { service: 'Carbon Storage', value: scores.carbon_storage_score },
  ];
};

export const getVegetationHealthDistribution = async (projectId) => {
  const result = await pool.query(`
    SELECT trees_geojson
    FROM analysis_results
    WHERE project_id = $1
    AND assigned_to_majmaah = true
    ORDER BY analysis_date DESC
    LIMIT 1
  `, [projectId]);

  if (result.rows.length === 0) return [];

  const trees = JSON.parse(result.rows[0].trees_geojson);

  // Calculate health distribution
  const excellent = trees.filter(t => t.healthScore >= 4.5).length;
  const good = trees.filter(t => t.healthScore >= 3.5 && t.healthScore < 4.5).length;
  const fair = trees.filter(t => t.healthScore < 3.5).length;

  const total = trees.length || 1;

  return [
    { condition: 'Excellent', percentage: (excellent / total) * 100 },
    { condition: 'Good', percentage: (good / total) * 100 },
    { condition: 'Fair', percentage: (fair / total) * 100 },
  ];
};

// Get growth and carbon impact data
export const getGrowthCarbonImpact = async (projectId, months = 12) => {
  const result = await pool.query(`
    SELECT 
      metric_date,
      tree_growth_cm as growth,
      carbon_growth_kg as carbon
    FROM calculated_metrics
    WHERE project_id = $1
    AND metric_date >= CURRENT_DATE - INTERVAL '${months} months'
    ORDER BY metric_date ASC
  `, [projectId]);

  return result.rows.map(row => ({
    month: row.metric_date.toLocaleDateString('en-US', { month: 'short' }),
    growth: parseFloat(row.growth) || 0,
    carbon: parseFloat(row.carbon) || 0
  }));
};
```

---

### **File 3: Admin Assignment Controller**
📁 `server/src/controllers/adminController.js`
```javascript
import * as db from '../services/databaseService.js';

// Get all unassigned analyses
export const getUnassignedAnalyses = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        project_id,
        analysis_type,
        analysis_date,
        tree_count,
        total_carbon_tonnes,
        ndvi_mean,
        created_at
      FROM analysis_results
      WHERE assigned_to_majmaah = false
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Assign analysis to Majmaah dashboard
export const assignAnalysisToMajmaah = async (req, res) => {
  try {
    const { analysisId, displayName, notes } = req.body;
    const adminId = req.user?.id || 1; // From auth middleware

    await db.assignToMajmaah(analysisId, adminId, displayName, notes);

    res.json({ 
      success: true, 
      message: 'Analysis assigned to Majmaah dashboard' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Unassign analysis from Majmaah
export const unassignAnalysisFromMajmaah = async (req, res) => {
  try {
    const { analysisId } = req.params;

    await pool.query(`
      UPDATE analysis_results 
      SET assigned_to_majmaah = false, 
          visible_to_client = false 
      WHERE id = $1
    `, [analysisId]);

    await pool.query(`
      DELETE FROM majmaah_assignments 
      WHERE analysis_id = $1
    `, [analysisId]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all assigned analyses
export const getAssignedAnalyses = async (req, res) => {
  try {
    const analyses = await db.getMajmaahAnalyses();
    res.json(analyses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

### **File 4: Majmaah API Routes**
📁 `server/src/routes/majmaahRoutes.js`
```javascript
import express from 'express';
import * as db from '../services/databaseService.js';
import {
  getUnassignedAnalyses,
  assignAnalysisToMajmaah,
  unassignAnalysisFromMajmaah,
  getAssignedAnalyses
} from '../controllers/adminController.js';

const router = express.Router();

// Admin routes (for managing assignments)
router.get('/admin/unassigned-analyses', getUnassignedAnalyses);
router.post('/admin/assign-to-majmaah', assignAnalysisToMajmaah);
router.delete('/admin/unassign/:analysisId', unassignAnalysisFromMajmaah);
router.get('/admin/assigned-analyses', getAssignedAnalyses);

// Majmaah dashboard routes (for displaying data)
router.get('/majmaah/dashboard-stats', async (req, res) => {
  try {
    const { projectId } = req.query;
    const stats = await db.getMajmaahDashboardStats(projectId);
    res.json({ data: stats, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/majmaah/latest-analysis', async (req, res) => {
  try {
    const { projectId } = req.query;
    const analyses = await db.getMajmaahAnalyses(projectId);
    res.json({ data: analyses[0] || null, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/majmaah/analysis-history', async (req, res) => {
  try {
    const { projectId, limit = 10 } = req.query;
    const analyses = await db.getMajmaahAnalyses(projectId);
    res.json({ data: analyses.slice(0, limit), success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/majmaah/carbon-trends', async (req, res) => {
  try {
    const { projectId, months = 12 } = req.query;
    const trends = await db.getCarbonTrends(projectId, months);
    res.json({ data: trends, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/majmaah/vegetation-trends', async (req, res) => {
  try {
    const { projectId, months = 12 } = req.query;
    const trends = await db.getVegetationTrends(projectId, months);
    res.json({ data: trends, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/majmaah/canopy-coverage', async (req, res) => {
  try {
    const { projectId } = req.query;
    const data = await db.getCanopyCoverageDistribution(projectId);
    res.json({ data, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/majmaah/ecosystem-services', async (req, res) => {
  try {
    const { projectId } = req.query;
    const data = await db.getEcosystemServices(projectId);
    res.json({ data, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/majmaah/vegetation-health', async (req, res) => {
  try {
    const { projectId } = req.query;
    const data = await db.getVegetationHealthDistribution(projectId);
    res.json({ data, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/majmaah/growth-carbon-impact', async (req, res) => {
  try {
    const { projectId, months = 12 } = req.query;
    const data = await db.getGrowthCarbonImpact(projectId, months);
    res.json({ data, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

## 🎨 Admin Interface in NDVI Calculator

### **New Component: Analysis Manager**
📁 `client/src/components/AnalysisManager/index.tsx`

```typescript
// Interface for admin to:
// 1. View all completed analyses
// 2. Select analyses to assign to Majmaah
// 3. Set display names and notes
// 4. Toggle visibility
// 5. See which analyses are currently assigned
```

**UI Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Analysis Manager - Assign to Majmaah Dashboard         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Unassigned Analyses:                                    │
│ ┌─────────────────────────────────────────────────┐   │
│ │ [✓] Analysis #1 - 2025-01-15                    │   │
│ │     Trees: 1,247 | Carbon: 156.8t | NDVI: 0.64  │   │
│ │     [Assign to Majmaah]                         │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Assigned to Majmaah:                                    │
│ ┌─────────────────────────────────────────────────┐   │
│ │ [👁️] Analysis #5 - 2025-01-10                   │   │
│ │     "Main Campus Assessment"                    │   │
│ │     [Hide] [Edit] [Remove]                      │   │
│ └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 📈 Data Mapping: GEE Analysis → Majmaah Widgets

### **Widget 1: Trees Planted**
- **Source**: `analysis_results.tree_count`
- **Calculation**: SUM of all assigned analyses

### **Widget 2: Carbon Sequestration**
- **Source**: `analysis_results.co2_equivalent_tonnes`
- **Calculation**: SUM of AGC + SOC * 3.67

### **Widget 3: Survival Rate**
- **Source**: Compare first and latest `tree_count` + `ndvi_mean`
- **Calculation**: (latest_trees / initial_trees) * 100

### **Widget 4: Communities Supported**
- **Source**: Manual configuration per project
- **Calculation**: Static value + tree_count factor

### **Widget 5: Carbon Sequestration Chart**
- **Source**: `getCarbonTrends()` - monthly carbon data
- **Chart**: Line chart of CO₂ over time

### **Widget 6: Canopy Coverage Chart**
- **Source**: `getCanopyCoverageDistribution()` - latest canopy %
- **Chart**: Pie chart of coverage ranges

### **Widget 7: Species Richness** (Future)
- **Source**: Combined GEE tree detection + field species data
- **Chart**: Bar chart of species counts

### **Widget 8: Ecosystem Services**
- **Source**: `calculated_metrics` table - 5 service scores
- **Chart**: Radar chart of impact scores

### **Widget 9: Vegetation Health**
- **Source**: `trees_geojson` health scores
- **Chart**: Pie chart of Excellent/Good/Fair

### **Widget 10: Survival Rate Chart**
- **Source**: Historical `tree_count` and `ndvi_mean`
- **Chart**: Line chart over years

### **Widget 11: Growth & Carbon Impact**
- **Source**: `calculated_metrics` - growth and carbon per month
- **Chart**: Dual-axis composed chart

---

## 🔄 Complete Workflow

### **Step 1: Admin performs GEE analysis**
1. Admin opens NDVI Calculator
2. Draws area for Majmaah project
3. Runs baseline assessment
4. Backend:
   - Calculates using GEE API
   - **Saves to PostgreSQL**
   - Returns results
5. Results displayed in NDVI Calculator

### **Step 2: Admin assigns to Majmaah**
1. Admin opens "Analysis Manager" tab
2. Sees list of completed analyses
3. Selects analysis for Majmaah project
4. Clicks "Assign to Majmaah Dashboard"
5. Adds display name: "Majmaah Campus Q1 2025"
6. Analysis marked as `assigned_to_majmaah = true`

### **Step 3: Client views Majmaah Dashboard**
1. Client logs into Majmaah Dashboard
2. Dashboard fetches data from `/api/majmaah/*` endpoints
3. NDVI backend queries PostgreSQL
4. Returns **real GEE analysis data**
5. Dashboard displays:
   - Actual tree count from satellite detection
   - Real carbon sequestration from AGC/SOC
   - Real vegetation health from NDVI
   - Historical trends from multiple analyses

---

## 📦 Package Installation Commands

### **NDVI Backend:**
```bash
cd server
npm install pg sequelize
npm install --save-dev sequelize-cli
```

### **Majmaah Dashboard:**
```bash
cd majmaah-dashboard-react
npm install axios  # Already installed
# No new packages needed!
```

---

## 🎯 Implementation Priority

### **Phase 1: Core Integration** (Must Have)
1. ✅ PostgreSQL setup
2. ✅ Save baseline assessment results
3. ✅ Create `/api/majmaah/dashboard-stats` endpoint
4. ✅ Update Majmaah to fetch real data
5. ✅ Display in Stats Overview widget

### **Phase 2: Admin Controls** (Important)
6. ✅ Create Analysis Manager UI
7. ✅ Admin can assign/unassign analyses
8. ✅ Set display names and notes

### **Phase 3: All Charts** (Nice to Have)
9. ✅ All chart endpoints
10. ✅ Historical data tracking
11. ✅ Trend analysis

---

## 🚀 Ready to Start?

**I can start implementing right now!**

**Shall I:**
1. ✅ Create all database files (schema, config, service)?
2. ✅ Modify NDVI controllers to save data?
3. ✅ Create Majmaah API endpoints?
4. ✅ Add admin assignment interface?
5. ✅ Update Majmaah dashboard to use real data?

**Just say "Start implementing" and I'll create all the files!** 🚀

Or tell me which specific part you want me to start with first!

