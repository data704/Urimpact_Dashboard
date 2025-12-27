# URIMPACT Baseline Assessment - Wadi Al Batha

## Overview
This application has been modified to perform a comprehensive baseline assessment for the Wadi Al Batha area in Oman, following the URIMPACT Baseline Assessment (GIS Checklist) requirements.

## Key Changes

### 1. Area of Interest (AOI)
- **Location**: Wadi Al Batha, Oman
- **Default Coordinates**: Approximately 23.5°N, 57.5°E
- The map now centers on Wadi Al Batha by default
- Users can draw custom AOI polygons or use the default area

### 2. Implemented Metrics

#### Site Definition
- **AOI Polygon**: Automatically created for Wadi Al Batha
- **Candidate Planting Locations**: Identified using NDVI analysis (areas with NDVI < 0.3)
- **Constraints**: Detected built/paved areas (low NDVI + high brightness)
- **Metrics Calculated**:
  - Total area (hectares)
  - Candidate planting area (hectares and percentage)
  - Constraint area (hectares and percentage)

#### Existing Vegetation Analysis
- **Tree Detection**: Uses connected components and local maxima on NDVI to identify individual trees
- **Tree Mapping**: Tree locations displayed as points on the map with color-coded health scores
- **Health Scoring**: Visual health scores (1-5) based on NDVI values:
  - Score 5: NDVI > 0.7 (Excellent)
  - Score 4: NDVI 0.6-0.7 (Good)
  - Score 3: NDVI 0.5-0.6 (Moderate)
  - Score 2: NDVI 0.4-0.5 (Fair)
  - Score 1: NDVI < 0.4 (Poor)
- **Canopy Cover**: Percentage of area covered by vegetation (NDVI > 0.3)
- **Metrics Calculated**:
  - Tree count
  - Canopy cover percentage
  - Average health score
  - Individual tree locations with health scores

#### Above-Ground Biomass (AGB) Estimation
- **Canopy Diameter Estimation**: Derived from NDVI values using simplified model
- **AGB Model**: Uses allometric equation: AGB (kg) = 0.0673 × (canopy_diameter^2.5)
- **Per-Tree AGB**: Calculated for each detected tree
- **Total AGB**: Sum of all tree biomass in the AOI
- **Metrics Calculated**:
  - AGB per tree (kg)
  - Total AGB (kg and tonnes)
  - Average AGB (kg)
  - AGB distribution visualization

#### Baseline Imagery & Vegetation Indices
- **High-Resolution Imagery**: Sentinel-2 SR Harmonized (cloud cover < 10%)
- **NDVI Maps**: Normalized Difference Vegetation Index visualization
- **EVI Maps**: Enhanced Vegetation Index calculation and visualization
- **Statistics**: Min, max, and mean values for both indices
- **Layers Generated**:
  - Base satellite imagery
  - NDVI layer
  - EVI layer
  - Canopy cover layer
  - Tree point layer

## Technical Implementation

### Backend Services
- **File**: `server/src/services/baselineAssessmentService.js`
- **Main Functions**:
  - `performBaselineAssessment()`: Complete assessment
  - `analyzeSiteDefinition()`: Site analysis
  - `analyzeExistingVegetation()`: Vegetation analysis
  - `estimateAGB()`: Biomass estimation
  - `generateBaselineImagery()`: Imagery and indices

### Backend Routes
- **File**: `server/src/routes/baselineRoutes.js`
- **Endpoints**:
  - `POST /api/baseline-assessment`: Complete assessment
  - `POST /api/site-definition`: Site definition only
  - `POST /api/existing-vegetation`: Vegetation analysis only
  - `POST /api/agb-estimation`: AGB estimation only
  - `POST /api/baseline-imagery`: Imagery generation only
  - `GET /api/default-aoi`: Get Wadi Al Batha default AOI

### Frontend Components
- **Main Component**: `client/src/components/BaselineAssessment/index.tsx`
- **Features**:
  - Interactive map with Mapbox GL
  - Polygon drawing for custom AOI
  - Multiple visualization tabs (Overview, Site, Vegetation, AGB, Imagery)
  - Real-time charts using Recharts library
  - Tree point visualization with health score colors
  - NDVI/EVI layer overlays

### Charts and Visualizations
- **Pie Chart**: Site definition breakdown (candidate sites, constraints, other)
- **Bar Charts**: 
  - Tree health score distribution
  - AGB distribution (top 20 trees)
- **Map Layers**:
  - NDVI overlay (semi-transparent)
  - Tree points (color-coded by health)
  - AOI polygon

## Usage

1. **Start the Backend Server**:
   ```bash
   cd server
   npm start
   ```

2. **Start the Frontend**:
   ```bash
   cd client
   npm run dev
   ```

3. **Run Baseline Assessment**:
   - Open the application in your browser
   - The map will load centered on Wadi Al Batha
   - Optionally draw a custom AOI polygon
   - Click "Run Baseline Assessment"
   - View results in the tabs below the map

## Deliverables Summary

All required deliverables are generated and displayed:

✅ **AOI Polygon**: Displayed on map, can be customized  
✅ **Candidate Planting Areas**: Identified and visualized  
✅ **Existing Tree Layer**: Points with health scores on map  
✅ **Health Scores**: 1-5 scale, color-coded visualization  
✅ **Canopy Cover Map**: Percentage calculated and displayed  
✅ **AGB Estimates**: Per-tree and total AGB with visualizations  
✅ **Baseline Imagery**: High-resolution Sentinel-2 imagery  
✅ **NDVI/EVI Layers**: Calculated and overlaid on map  

## Data Sources

- **Satellite Imagery**: Sentinel-2 SR Harmonized (COPERNICUS/S2_SR_HARMONIZED)
- **Date Range**: 2024-01-01 to 2024-12-31
- **Cloud Filter**: < 10% cloud cover
- **Spatial Resolution**: 10m (Sentinel-2)

## Notes

- The default AOI coordinates for Wadi Al Batha are approximate and can be adjusted
- Tree detection uses NDVI-based algorithms - actual tree counts may vary
- AGB estimation uses generalized allometric equations - species-specific models can be added
- All calculations are performed using Google Earth Engine
- Results are displayed in real-time with interactive visualizations

## Future Enhancements

- Species-specific AGB models
- Historical time-series analysis
- Export functionality for reports
- Integration with field survey data
- Machine learning-based tree detection improvements

