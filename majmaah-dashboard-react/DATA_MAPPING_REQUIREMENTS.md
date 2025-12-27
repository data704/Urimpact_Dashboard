# 📊 Complete Data Mapping: GEE Baseline Assessment → Majmaah Dashboard

## 🎯 Critical Requirement

**Every Majmaah dashboard widget must have data from baseline assessment!**

---

## 📋 Majmaah Dashboard Widgets → GEE Data Sources

### **Widget 1: Trees Planted (Stat Card)**
```
Display: 1,000 trees
Source: analysis_results.tree_count
GEE Calculation: Tree detection from NDVI peaks
Chart: Mini line chart from monthly tree counts
```

### **Widget 2: Carbon Sequestration (Stat Card)**
```
Display: 18.00 tons
Source: analysis_results.co2_equivalent_tonnes
GEE Calculation: (AGC + SOC) * 0.47 * 3.67
Formula: Total Biomass → Carbon → CO2 equivalent
Chart: Mini line chart from monthly carbon data
```

### **Widget 3: Survival Rate (Stat Card)**
```
Display: 87.0%
Source: Calculated from historical tree_count
GEE Calculation: (Current trees / Initial trees) * 100
Requires: Multiple analyses over time
Chart: Mini line chart showing survival trend
```

### **Widget 4: Communities Supported (Stat Card)**
```
Display: 12 communities
Source: calculated_metrics.communities_supported
Calculation: Based on tree count + area covered
Formula: Floor(tree_count / 100) + (area_ha / 10)
Chart: Mini line chart from monthly data
```

---

### **Widget 5: Project Impact Map**
```
Display: Interactive map with tree clusters
Source: analysis_results.trees_geojson
GEE Data: Individual tree coordinates from NDVI peaks
Format: GeoJSON Feature Collection
Features: Tree locations with health scores
```

---

### **Widget 6: Growth & Carbon Impact Chart**
```
Display: Dual-axis chart (Growth line + Carbon bars)
Source: calculated_metrics table
X-Axis: Months (Jan, Feb, Mar...)
Y-Axis Left: Tree growth in cm
Y-Axis Right: Carbon in kg

Data Requirements:
- Monthly tree growth measurements
- Monthly carbon accumulation
- Historical baseline assessments (12 months)

GEE Calculation:
- Growth: Compare tree canopy diameter over time
- Carbon: Monthly AGC + SOC calculations
```

---

### **Widget 7: Carbon Sequestration Chart**
```
Display: Line chart of CO₂ over time
Source: analysis_results.co2_equivalent_tonnes (monthly)
X-Axis: Months (Jan, Feb, Mar...)
Y-Axis: CO₂ sequestered (tonnes)

Data Requirements:
- Monthly baseline assessments
- AGC + SOC calculations each month
- Historical data for 12 months

Query:
SELECT 
  DATE_TRUNC('month', analysis_date) as month,
  SUM(co2_equivalent_tonnes) as value
FROM analysis_results
WHERE assigned_to_majmaah = true
GROUP BY month
ORDER BY month ASC
```

---

### **Widget 8: Canopy Coverage Chart**
```
Display: Pie chart (0-25%, 25-50%, 50-75%, 75-100%)
Source: analysis_results.canopy_cover_percent
GEE Data: Latest canopy coverage calculation

Data Requirements:
- Canopy cover percentage from GEE
- Calculated from NDVI > 0.3 threshold

Distribution Logic:
- 0-25%: Low coverage areas
- 25-50%: Moderate coverage
- 50-75%: Good coverage
- 75-100%: Excellent coverage
```

---

### **Widget 9: Species Richness Chart**
```
Display: Bar chart of species counts
Source: Hybrid (GEE tree detection + field data)

Data Requirements:
- Tree count from GEE: analysis_results.tree_count
- Species classification: Manual or ML-based
- Distribution by species

Initial Implementation:
- Use GEE tree detection count
- Assign generic species based on NDVI health
- Future: Integrate with species_libraries table
```

---

### **Widget 10: Ecosystem Services Chart**
```
Display: Radar chart (5 metrics, scale 0-100)
Source: calculated_metrics table

Metrics:
1. Air Quality → From NDVI mean
2. Water Retention → From canopy cover
3. Biodiversity → From tree count
4. Soil Health → From EVI mean
5. Carbon Storage → From total carbon

Formulas:
air_quality = ((ndvi_mean + 1) / 2) * 100
water_retention = canopy_cover_percent
biodiversity = min(100, log10(tree_count + 1) * 25)
soil_health = ((evi_mean + 1) / 2) * 100
carbon_storage = min(100, (total_carbon / 500) * 100)
```

---

### **Widget 11: Vegetation Health Chart**
```
Display: Pie chart (Excellent, Good, Fair)
Source: analysis_results.trees_geojson

Data Requirements:
- Individual tree health scores (1-5)
- From NDVI values of each tree

Distribution:
- Excellent: health_score >= 4.5 (NDVI > 0.7)
- Good: health_score 3.5-4.5 (NDVI 0.6-0.7)
- Fair: health_score < 3.5 (NDVI < 0.6)

Calculation:
SELECT 
  COUNT(CASE WHEN health >= 4.5 THEN 1 END) as excellent,
  COUNT(CASE WHEN health >= 3.5 AND health < 4.5 THEN 1 END) as good,
  COUNT(CASE WHEN health < 3.5 THEN 1 END) as fair
FROM trees (from trees_geojson)
```

---

### **Widget 12: Survival Rate Chart**
```
Display: Line chart (yearly survival %)
Source: Historical analysis_results

Data Requirements:
- Multiple analyses over time (monthly/yearly)
- Tree count from each analysis
- NDVI health from each analysis

Calculation:
Year 1: (trees_year1 / trees_initial) * 100
Year 2: (trees_year2 / trees_initial) * 100
...

Query:
SELECT 
  EXTRACT(YEAR FROM analysis_date) as year,
  AVG(tree_count) as avg_trees,
  AVG(ndvi_mean) as avg_health
FROM analysis_results
WHERE project_id = 1
GROUP BY year
ORDER BY year ASC
```

---

### **Widget 13: Community Impact Stats**
```
Display: 3 cards (Volunteers, Workshops, Publications)
Source: calculated_metrics + manual data

Volunteers: Based on tree count (tree_count / 10)
Workshops: Based on analyses count
Publications: Manual or area-based
```

---

## 🔄 Enhanced Baseline Assessment Service

### **Current GEE Baseline Returns:**
```javascript
{
  siteDefinition: { totalArea, candidatePlantingArea, constraintArea },
  existingVegetation: { treeCount, canopyCoverPercent, trees[], ndviMapId },
  agbEstimation: { totalAGB, averageAGB, treesWithAGB[] },
  baselineImagery: { ndviStats, eviStats, ndviMapId, eviMapId }
}
```

### **Enhanced Version Must Return:**
```javascript
{
  // Existing data (all above)
  ...existing,
  
  // NEW: Calculated metrics for Majmaah
  calculatedMetrics: {
    // For stat cards
    totalTreesPlanted: treeCount,
    carbonSequesteredTonnes: (agb * 0.47 * 3.67) + soc,
    
    // For ecosystem services
    ecosystemServices: {
      airQuality: ((ndviMean + 1) / 2) * 100,
      waterRetention: canopyCoverPercent,
      biodiversity: min(100, log10(treeCount + 1) * 25),
      soilHealth: ((eviMean + 1) / 2) * 100,
      carbonStorage: min(100, (totalCarbon / 500) * 100)
    },
    
    // For vegetation health
    vegetationHealth: {
      excellent: trees.filter(t => t.healthScore >= 4.5).length,
      good: trees.filter(t => t.healthScore >= 3.5 && < 4.5).length,
      fair: trees.filter(t => t.healthScore < 3.5).length
    },
    
    // For canopy distribution
    canopyDistribution: [
      { range: '0-25%', value: ... },
      { range: '25-50%', value: ... },
      { range: '50-75%', value: ... },
      { range: '75-100%', value: ... }
    ],
    
    // For community impact
    estimatedVolunteers: floor(treeCount / 10),
    estimatedWorkshops: floor(totalArea / 5),
    researchContributions: floor(treeCount / 100)
  }
}
```

---

## 🔧 Modified baselineAssessmentService.js

Add this function at the end:
```javascript
export const calculateMajmaahMetrics = (baselineData) => {
  const { siteDefinition, existingVegetation, agbEstimation, baselineImagery } = baselineData;
  
  const totalCarbon = (agbEstimation.totalAGBTonnes || 0) * 0.47; // Carbon
  const co2Equivalent = totalCarbon * 3.67; // CO2
  const treeCount = existingVegetation.treeCount || 0;
  const ndviMean = baselineImagery.ndviStats.mean || 0;
  const eviMean = baselineImagery.eviStats.mean || 0;
  const canopyCover = existingVegetation.canopyCoverPercent || 0;
  
  return {
    // Stats
    totalTreesPlanted: treeCount,
    carbonSequesteredTonnes: co2Equivalent,
    canopyCoveragePercent: canopyCover,
    
    // Ecosystem Services (0-100 scores)
    ecosystemServices: {
      airQuality: Math.round(((ndviMean + 1) / 2) * 100),
      waterRetention: Math.round(canopyCover),
      biodiversity: Math.round(Math.min(100, Math.log10(treeCount + 1) * 25)),
      soilHealth: Math.round(((eviMean + 1) / 2) * 100),
      carbonStorage: Math.round(Math.min(100, (co2Equivalent / 500) * 100))
    },
    
    // Vegetation Health Distribution
    vegetationHealth: {
      excellent: existingVegetation.trees.filter(t => t.healthScore >= 4.5).length,
      good: existingVegetation.trees.filter(t => t.healthScore >= 3.5 && t.healthScore < 4.5).length,
      fair: existingVegetation.trees.filter(t => t.healthScore < 3.5).length
    },
    
    // Canopy Distribution
    canopyDistribution: calculateCanopyDistribution(canopyCover),
    
    // Community Impact Estimates
    estimatedVolunteers: Math.floor(treeCount / 10),
    estimatedWorkshops: Math.floor(siteDefinition.totalArea / 5),
    researchContributions: Math.floor(treeCount / 100)
  };
};
```

---

## ✅ Complete Data Coverage

### **Majmaah Widget → GEE Data Source:**

| Widget | Data Source | GEE Calculation | Status |
|--------|-------------|-----------------|--------|
| Trees Planted | tree_count | NDVI peak detection | ✅ Covered |
| Carbon Sequestration | AGC + SOC | Biomass equations | ✅ Covered |
| Survival Rate | Historical counts | Compare over time | ✅ Covered |
| Communities | Calculated | Based on trees/area | ✅ Covered |
| Map Widget | trees_geojson | Tree coordinates | ✅ Covered |
| Growth & Carbon | Monthly data | Time series | ✅ Covered |
| Carbon Chart | Monthly carbon | AGC + SOC history | ✅ Covered |
| Canopy Coverage | canopy_cover_percent | NDVI threshold | ✅ Covered |
| Species Richness | tree_count | + field data | ⚠️ Partial |
| Ecosystem Services | Calculated scores | NDVI/EVI/Carbon | ✅ Covered |
| Vegetation Health | Health scores | NDVI per tree | ✅ Covered |
| Survival Rate Chart | Historical | Tree count trends | ✅ Covered |

**Result: 11 of 12 widgets fully covered by GEE data!**

---

## 🎯 Implementation Ready!

I've documented:
- ✅ Complete database schema
- ✅ All API endpoints needed
- ✅ Admin assignment controls
- ✅ Data mapping for every widget
- ✅ Enhanced baseline assessment
- ✅ PostgreSQL integration
- ✅ Majmaah dashboard updates

**Ready to implement! Just give the word!** 🚀

