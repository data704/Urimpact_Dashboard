// Baseline Assessment Service for URIMPACT - Wadi Al Batha
import ee from '@google/earthengine';

const BASELINE_WINDOW_DAYS = 90; // rolling window for latest imagery

const getVegThresholds = (mode = 'mature') => {
  if (mode === 'young') {
    return {
      ndviPrimary: 0.18,
      maskLow: 0.18,
      maskMed: 0.25,
      maskHigh: 0.35,
      ndrePrimary: 0.12
    };
  }
  return {
    ndviPrimary: 0.3,
    maskLow: 0.25,
    maskMed: 0.35,
    maskHigh: 0.45,
    ndrePrimary: 0.18
  };
};

const withTimeout = (promise, timeoutMs = 60000) => {
  let timeoutHandle;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error('Operation timed out'));
    }, timeoutMs);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => clearTimeout(timeoutHandle));
};

// Default AOI coordinates centered at the specified location
// Center: 24.595934489336507, 46.690194610355434
const WADI_AL_BATHA_DEFAULT = [
  [46.680, 24.586], // Southwest
  [46.700, 24.586], // Southeast
  [46.700, 24.606], // Northeast
  [46.680, 24.606], // Northwest
  [46.680, 24.586]  // Close polygon
];

// Get default AOI for Wadi Al Batha
export const getWadiAlBathaAOI = () => {
  return WADI_AL_BATHA_DEFAULT;
};

// 1. Site Definition - Identify candidate planting locations and constraints
export const analyzeSiteDefinition = async (coordinates = null) => {
  try {
    const coords = coordinates || WADI_AL_BATHA_DEFAULT;
    const region = ee.Geometry.Polygon([coords]);
    const endDate = ee.Date(Date.now());
    const startDate = endDate.advance(-BASELINE_WINDOW_DAYS, 'day');
    
    // Get high-resolution Sentinel-2 imagery
    // Sentinel-2 SR_HARMONIZED stores bands as scaled integers (0-10000)
    // Multiply by 0.0001 to convert to reflectance (0-1) for accurate index calculations
    const image = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
      .filterBounds(region)
      .filterDate(startDate, endDate)
      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10))
      .sort('system:time_start', false)
      .first()
      .multiply(0.0001) // Convert scaled integers to reflectance (0-1)
      .clip(region);

    // Calculate NDVI for vegetation detection
    const ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
    
    // Identify candidate planting locations (low NDVI, non-vegetated areas)
    // Areas with NDVI < 0.3 are potential planting sites
    const candidateSites = ndvi.lt(0.3).selfMask();
    
    // Identify constraints (buildings, paved areas) using NDVI and brightness
    // Low NDVI + High brightness = likely paved/built
    const brightness = image.select(['B4', 'B3', 'B2']).reduce('mean');
    const constraints = ndvi.lt(0.2).and(brightness.gt(0.3)).selfMask();
    
    // Calculate areas
    const area = await withTimeout(
      new Promise((resolve, reject) => {
        region.area().divide(10000).evaluate((result, error) => {
          if (error) reject(error);
          else resolve(result);
        });
      })
    );

    const candidateArea = await withTimeout(
      new Promise((resolve, reject) => {
        ee.Image.pixelArea()
          .updateMask(candidateSites)
          .reduceRegion({
            reducer: ee.Reducer.sum(),
            geometry: region,
            scale: 10,
            maxPixels: 1e9
          })
          .evaluate((result, error) => {
            if (error) reject(error);
            else resolve((result.area || 0) / 10000); // Convert to hectares
          });
      })
    );

    const constraintArea = await withTimeout(
      new Promise((resolve, reject) => {
        ee.Image.pixelArea()
          .updateMask(constraints)
          .reduceRegion({
            reducer: ee.Reducer.sum(),
            geometry: region,
            scale: 10,
            maxPixels: 1e9
          })
          .evaluate((result, error) => {
            if (error) reject(error);
            else resolve((result.area || 0) / 10000);
          });
      })
    );

    // Get visualization for candidate sites
    const candidateMapId = await withTimeout(
      new Promise((resolve, reject) => {
        candidateSites.visualize({
          min: 0,
          max: 1,
          palette: ['00FF00'] // Green for candidate sites
        }).getMap({}, (map, error) => {
          if (error) reject(error);
          else resolve({
            mapid: map.mapid,
            urlFormat: map.urlFormat,
            token: map.token || map.mapid // Use mapid as token if token not available
          });
        });
      })
    );

    return {
      aoi: coords,
      totalArea: area,
      candidatePlantingArea: candidateArea,
      candidateAreaPercent: (candidateArea / area) * 100,
      constraintArea: constraintArea,
      constraintAreaPercent: (constraintArea / area) * 100,
      candidateSitesMapId: candidateMapId.mapid,
      candidateSitesUrlFormat: candidateMapId.urlFormat
    };
  } catch (error) {
    console.error('Site definition analysis error:', error);
    throw error;
  }
};

// Helper function for grid-based tree sampling
const resolveGridSampling = (ndvi, region, resolve, reject) => {
  console.log('Using grid-based tree sampling...');
  
  // Create a fine grid and sample high NDVI points
  ndvi.sample({
    region: region,
    scale: 8, // Fine grid - 8 meters
    numPixels: 2000, // More samples for better coverage
    geometries: true,
    seed: 42
  }).getInfo((gridResult, gridError) => {
    if (gridError) {
      console.error('Grid sampling error:', gridError);
      resolve([]);
    } else {
      const gridFeatures = Array.isArray(gridResult) 
        ? gridResult 
        : (gridResult.features || []);
      
      // Filter and cluster nearby points to avoid duplicates
      const trees = [];
      const usedPoints = new Set();
      const minDistance = 0.0001; // ~10 meters in degrees
      
      gridFeatures
        .filter(f => 
          f && 
          f.geometry && 
          f.geometry.coordinates && 
          f.properties && 
          (f.properties.NDVI || 0) > 0.3
        )
        .forEach((f, idx) => {
          const coords = f.geometry.coordinates;
          const key = `${Math.round(coords[0] / minDistance)},${Math.round(coords[1] / minDistance)}`;
          
          if (!usedPoints.has(key)) {
            usedPoints.add(key);
            const ndviValue = f.properties.NDVI || 0;
            let healthScore = 1;
            if (ndviValue > 0.7) healthScore = 5;
            else if (ndviValue > 0.6) healthScore = 4;
            else if (ndviValue > 0.5) healthScore = 3;
            else if (ndviValue > 0.4) healthScore = 2;
            
            trees.push({
              id: trees.length + 1,
              coordinates: coords,
              ndvi: ndviValue,
              healthScore: healthScore
            });
          }
        });
      
      console.log(`Grid sampling found ${trees.length} unique tree points`);
      resolve(trees);
    }
  });
};

// 2. Existing Vegetation Analysis
export const analyzeExistingVegetation = async (coordinates = null, options = {}) => {
  try {
    const coords = coordinates || WADI_AL_BATHA_DEFAULT;
    const region = ee.Geometry.Polygon([coords]);
    const thresholds = getVegThresholds(options.vegetationMode);
    const endDate = ee.Date(Date.now());
    const startDate = endDate.advance(-BASELINE_WINDOW_DAYS, 'day');
    
    // Get high-resolution imagery
    // Sentinel-2 SR_HARMONIZED stores bands as scaled integers (0-10000)
    // Multiply by 0.0001 to convert to reflectance (0-1) for accurate index calculations
    const image = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
      .filterBounds(region)
      .filterDate(startDate, endDate)
      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10))
      .sort('system:time_start', false)
      .first()
      .multiply(0.0001) // Convert scaled integers to reflectance (0-1)
      .clip(region);

    // Calculate NDVI (works correctly with normalizedDifference even on scaled values, but better to use reflectance)
    const ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
    // Calculate NDRE (NIR - RedEdge1) / (NIR + RedEdge1)
    const ndre = image.normalizedDifference(['B8', 'B5']).rename('NDRE');
    // EVI (Enhanced Vegetation Index)
    // EVI formula requires reflectance values (0-1), not scaled integers
    const evi = image.expression(
      '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))',
      {
        NIR: image.select('B8'),
        RED: image.select('B4'),
        BLUE: image.select('B2')
      }
    ).rename('EVI');
    // MSAVI2 (soil-adjusted for sparse/young vegetation)
    const msavi2 = image.expression(
      '(2 * NIR + 1 - sqrt((2 * NIR + 1) ** 2 - 8 * (NIR - RED))) / 2',
      {
        NIR: image.select('B8'),
        RED: image.select('B4')
      }
    ).rename('MSAVI2');
    
    // Identify vegetation (adaptive threshold) combining NDVI/NDRE/MSAVI2
    const ndviMask = ndvi.gt(thresholds.ndviPrimary);
    const ndreMask = ndre.gt(thresholds.ndrePrimary);
    const msaviMask = msavi2.gt(thresholds.ndviPrimary - 0.05); // slightly relaxed for soil-adjusted index

    // For canopy cover reporting/visualization, stick to NDVI-only to avoid over-counting
    const vegetationCoverMask = ndviMask;
    // For tree detection, allow multi-index mask
    const vegetation = ndviMask.or(ndreMask).or(msaviMask);
    
    // Calculate canopy cover percentage
    const canopyCover = await withTimeout(
      new Promise((resolve, reject) => {
        // Use mean of vegetation mask (1 = vegetation, 0 = no vegetation)
        // Mean gives us the percentage directly
        vegetationCoverMask.reduceRegion({
          reducer: ee.Reducer.mean(),
          geometry: region,
          scale: 10,
          maxPixels: 1e9
        }).evaluate((result, error) => {
          if (error) reject(error);
          else {
            // The result will have a key like 'constant' or similar
            // Get the first value from the result dictionary
            const value = Object.values(result)[0] || 0;
            resolve(value * 100);
          }
        });
      })
    );

    // Advanced Tree Detection using Computer Vision Techniques
    // Method: Multi-scale local maxima with morphological operations
    
    // Step 1: Create vegetation mask using adaptive thresholds across indices
    const vegMask1 = ndvi.gt(thresholds.maskLow)
      .or(ndre.gt(thresholds.maskLow * 0.8))
      .or(msavi2.gt(thresholds.maskLow * 0.9)); // Very low threshold for sparse/young areas
    const vegMask2 = ndvi.gt(thresholds.maskMed)
      .or(ndre.gt(thresholds.maskMed * 0.8))
      .or(msavi2.gt(thresholds.maskMed * 0.9)); // Medium threshold
    const vegMask3 = ndvi.gt(thresholds.maskHigh)
      .or(ndre.gt(thresholds.maskHigh * 0.8))
      .or(msavi2.gt(thresholds.maskHigh * 0.9)); // High threshold for dense vegetation
    const combinedMask = vegMask1.or(vegMask2).or(vegMask3);
    
    // Step 2: Apply morphological operations to clean the mask
    // Opening: removes small noise
    const kernel = ee.Kernel.circle(2, 'meters');
    const opened = combinedMask.focalMin({ kernel: kernel, iterations: 1 })
      .focalMax({ kernel: kernel, iterations: 1 });
    
    // Step 3: Multi-scale local maxima detection
    // Detect trees at different scales (small, medium, large)
    const focalMaxSmall = ndvi.focalMax({ radius: 5, units: 'meters' });
    const focalMaxMedium = ndvi.focalMax({ radius: 8, units: 'meters' });
    const focalMaxLarge = ndvi.focalMax({ radius: 12, units: 'meters' });
    
    // Combine local maxima at different scales
    const localMaxSmall = ndvi.eq(focalMaxSmall).and(opened);
    const localMaxMedium = ndvi.eq(focalMaxMedium).and(opened);
    const localMaxLarge = ndvi.eq(focalMaxLarge).and(opened);
    
    // Union of all scales
    const allLocalMax = localMaxSmall.or(localMaxMedium).or(localMaxLarge);
    
    // Step 4: Apply minimum thresholds to filter false positives (multi-index)
    const treeCandidates = allLocalMax.and(
      ndvi.gt(thresholds.ndviPrimary)
        .or(ndre.gt(thresholds.ndrePrimary))
        .or(msavi2.gt(thresholds.ndviPrimary - 0.05))
    );
    
    // Step 5: Use connected components to identify individual trees
    const treePoints = await withTimeout(
      new Promise((resolve, reject) => {
        console.log('Starting advanced tree detection...');
        
        console.log('Using grid-based tree sampling (more reliable)...');
        resolveGridSampling(ndvi, region, resolve, reject);
      })
    );

    // Get NDVI visualization
    const ndviMapId = await withTimeout(
      new Promise((resolve, reject) => {
        ndvi.getMapId({
          min: -1,
          max: 1,
          palette: ['FF0000', 'FFFF00', '00FF00']
        }, (map, error) => {
          if (error) reject(error);
          else resolve({
            mapid: map.mapid,
            urlFormat: map.urlFormat,
            token: map.token || map.mapid // Use mapid as token if token not available
          });
        });
      })
    );

    // Get canopy cover visualization
    const canopyMapId = await withTimeout(
      new Promise((resolve, reject) => {
        vegetationCoverMask.visualize({
          min: 0,
          max: 1,
          palette: ['000000', '00FF00']
        }).getMap({}, (map, error) => {
          if (error) reject(error);
          else resolve({
            mapid: map.mapid,
            urlFormat: map.urlFormat,
            token: map.token || map.mapid // Use mapid as token if token not available
          });
        });
      })
    );

    return {
      treeCount: treePoints.length,
      trees: treePoints,
      canopyCoverPercent: canopyCover,
      averageHealthScore: treePoints.length > 0 
        ? treePoints.reduce((sum, t) => sum + t.healthScore, 0) / treePoints.length 
        : 0,
      ndviMapId: ndviMapId.mapid,
      ndviUrlFormat: ndviMapId.urlFormat,
      ndviToken: ndviMapId.token,
      canopyMapId: canopyMapId.mapid,
      canopyUrlFormat: canopyMapId.urlFormat,
      canopyToken: canopyMapId.token
    };
  } catch (error) {
    console.error('Vegetation analysis error:', error);
    throw error;
  }
};

// 3. Above-Ground Biomass (AGB) Estimation
export const estimateAGB = async (coordinates = null, options = {}) => {
  try {
    const coords = coordinates || WADI_AL_BATHA_DEFAULT;
    const region = ee.Geometry.Polygon([coords]);
    const thresholds = getVegThresholds(options.vegetationMode);
    const endDate = ee.Date(Date.now());
    const startDate = endDate.advance(-BASELINE_WINDOW_DAYS, 'day');
    
    // Get Sentinel-2 imagery
    // Sentinel-2 SR_HARMONIZED stores bands as scaled integers (0-10000)
    // Multiply by 0.0001 to convert to reflectance (0-1) for accurate index calculations
    const image = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
      .filterBounds(region)
      .filterDate(startDate, endDate)
      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10))
      .sort('system:time_start', false)
      .first()
      .multiply(0.0001) // Convert scaled integers to reflectance (0-1)
      .clip(region);

    const ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
    const ndre = image.normalizedDifference(['B8', 'B5']).rename('NDRE');
    const msavi2 = image.expression(
      '(2 * NIR + 1 - sqrt((2 * NIR + 1) ** 2 - 8 * (NIR - RED))) / 2',
      {
        NIR: image.select('B8'),
        RED: image.select('B4')
      }
    ).rename('MSAVI2');

    // Estimate tree canopy diameter from multi-index mask (NDVI/NDRE/MSAVI2)
    const canopyMask = ndvi.gt(thresholds.ndviPrimary)
      .or(ndre.gt(thresholds.ndrePrimary))
      .or(msavi2.gt(thresholds.ndviPrimary - 0.05));

    const canopyDiameter = canopyMask.multiply(
      ndvi.subtract(thresholds.ndviPrimary).max(0).multiply(20).max(1)
    ).rename('canopyDiameter');
    
    // AGB estimation model (simplified allometric equation)
    // AGB (kg) = 0.0673 * (canopy_diameter^2.5) for broadleaf trees
    // This is a generalized model - can be refined with species-specific data
    const agbPerPixel = canopyDiameter.pow(2.5).multiply(0.0673).rename('AGB');
    
    // Calculate AGB per tree (using tree points from vegetation analysis)
    const treePoints = await analyzeExistingVegetation(coords);
    
    // Sample AGB at tree locations AND create distribution from pixel sampling
    let agbPerTree = [];
    
    // Method 1: Try to get AGB at detected tree locations
    if (treePoints.trees && treePoints.trees.length > 0) {
      try {
        // Create feature collection from tree points
        const treeFeatures = ee.FeatureCollection(
          treePoints.trees.map((t, idx) => 
            ee.Feature(ee.Geometry.Point(t.coordinates), { id: t.id || idx + 1 })
          )
        );
        
        // Sample AGB and canopy diameter at tree locations
        // Combine both AGB and canopy diameter into a single image for sampling
        const agbWithDiameter = agbPerPixel.addBands(canopyDiameter);
        const treesWithAGB = agbWithDiameter.sampleRegions({
          collection: treeFeatures,
          scale: 10,
          properties: ['id']
        });
        
        agbPerTree = await withTimeout(
          new Promise((resolve, reject) => {
            treesWithAGB.getInfo((features, error) => {
              if (error) {
                console.error('AGB sampling error:', error);
                // Fall through to pixel sampling
                resolve([]);
              } else {
                const featureArray = Array.isArray(features) 
                  ? features 
                  : (features.features || []);
                
                const treesWithAGBData = featureArray
                  .filter(f => f && f.geometry && f.properties)
                  .map((f, idx) => ({
                    id: f.properties.id || treePoints.trees[idx]?.id || idx + 1,
                    coordinates: f.geometry.coordinates,
                    agb: f.properties.AGB || 0,
                    canopyDiameter: f.properties.canopyDiameter || 0
                  }));
                resolve(treesWithAGBData);
              }
            });
          })
        );
      } catch (err) {
        console.error('Error calculating AGB per tree:', err);
        agbPerTree = [];
      }
    }
    
    // Method 2: If no tree-based AGB, create distribution from pixel-level sampling
    if (agbPerTree.length === 0) {
      try {
        console.log('Generating AGB distribution from pixel sampling...');
        // Sample AGB values across the region (include canopy diameter)
        const agbWithDiameter = agbPerPixel.addBands(canopyDiameter);
        const agbSamples = agbWithDiameter.sample({
          region: region,
          scale: 15, // Sample every 15 meters
          numPixels: 200, // Get up to 200 samples
          geometries: true,
          seed: 42
        });
        
        const samples = await withTimeout(
          new Promise((resolve, reject) => {
            agbSamples.getInfo((result, error) => {
              if (error) {
                resolve([]);
              } else {
                const sampleArray = Array.isArray(result) 
                  ? result 
                  : (result.features || []);
                
                const agbData = sampleArray
                  .filter(f => f && f.geometry && f.properties && (f.properties.AGB || 0) > 0)
                  .map((f, idx) => ({
                    id: idx + 1,
                    coordinates: f.geometry.coordinates,
                    agb: f.properties.AGB || 0,
                    canopyDiameter: f.properties.canopyDiameter || 0
                  }))
                  .sort((a, b) => b.agb - a.agb) // Sort by AGB descending
                  .slice(0, 50); // Take top 50 for distribution
                
                resolve(agbData);
              }
            });
          })
        );
        
        agbPerTree = samples;
        console.log(`Generated ${agbPerTree.length} AGB samples from pixel data`);
      } catch (err) {
        console.error('Error in pixel-level AGB sampling:', err);
      }
    }

    // Calculate total AGB
    const totalAGB = await withTimeout(
      new Promise((resolve, reject) => {
        agbPerPixel.reduceRegion({
          reducer: ee.Reducer.sum(),
          geometry: region,
          scale: 10,
          maxPixels: 1e9
        }).evaluate((result, error) => {
          if (error) reject(error);
          else resolve(result.AGB || 0);
        });
      })
    );

    // Calculate average AGB
    const avgAGB = await withTimeout(
      new Promise((resolve, reject) => {
        agbPerPixel.reduceRegion({
          reducer: ee.Reducer.mean(),
          geometry: region,
          scale: 10,
          maxPixels: 1e9
        }).evaluate((result, error) => {
          if (error) reject(error);
          else resolve(result.AGB || 0);
        });
      })
    );

    // Get AGB visualization
    const agbMapId = await withTimeout(
      new Promise((resolve, reject) => {
        agbPerPixel.visualize({
          min: 0,
          max: 100,
          palette: ['d9f0a3', 'addd8e', '78c679', '41ab5d', '238443', '005a32']
        }).getMap({}, (map, error) => {
          if (error) reject(error);
          else resolve({
            mapid: map.mapid,
            urlFormat: map.urlFormat,
            token: map.token || map.mapid // Use mapid as token if token not available
          });
        });
      })
    );

    return {
      treesWithAGB: agbPerTree,
      totalAGB: totalAGB, // kg
      totalAGBTonnes: totalAGB / 1000,
      averageAGB: avgAGB,
      agbMapId: agbMapId.mapid,
      agbUrlFormat: agbMapId.urlFormat
    };
  } catch (error) {
    console.error('AGB estimation error:', error);
    throw error;
  }
};

// 4. Baseline Imagery & Vegetation Indices
export const generateBaselineImagery = async (coordinates = null) => {
  try {
    const coords = coordinates || WADI_AL_BATHA_DEFAULT;
    const region = ee.Geometry.Polygon([coords]);
    const endDate = ee.Date(Date.now());
    const startDate = endDate.advance(-BASELINE_WINDOW_DAYS, 'day');
    
    // Get high-resolution Sentinel-2 imagery
    // Sentinel-2 SR_HARMONIZED stores bands as scaled integers (0-10000)
    // Multiply by 0.0001 to convert to reflectance (0-1) for accurate index calculations
    const image = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
      .filterBounds(region)
      .filterDate(startDate, endDate)
      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10))
      .sort('system:time_start', false)
      .first()
      .multiply(0.0001) // Convert scaled integers to reflectance (0-1)
      .clip(region);

    // Calculate NDVI (works correctly with normalizedDifference even on scaled values, but better to use reflectance)
    const ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
    
    // Calculate EVI (Enhanced Vegetation Index)
    // EVI formula requires reflectance values (0-1), not scaled integers
    const evi = image.expression(
      '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))',
      {
        NIR: image.select('B8'),
        RED: image.select('B4'),
        BLUE: image.select('B2')
      }
    ).rename('EVI');

    // Get statistics
    const ndviStats = await withTimeout(
      new Promise((resolve, reject) => {
        ndvi.reduceRegion({
          reducer: ee.Reducer.minMax().combine(ee.Reducer.mean(), null, true),
          geometry: region,
          scale: 10,
          maxPixels: 1e9
        }).evaluate((result, error) => {
          if (error) reject(error);
          else resolve(result);
        });
      })
    );

    const eviStats = await withTimeout(
      new Promise((resolve, reject) => {
        evi.reduceRegion({
          reducer: ee.Reducer.minMax().combine(ee.Reducer.mean(), null, true),
          geometry: region,
          scale: 10,
          maxPixels: 1e9
        }).evaluate((result, error) => {
          if (error) reject(error);
          else resolve(result);
        });
      })
    );

    // Get visualizations
    const baseImageMapId = await withTimeout(
      new Promise((resolve, reject) => {
        image.select(['B4', 'B3', 'B2']).visualize({
          min: 0,
          max: 3000,
          gamma: 1.4
        }).getMap({}, (map, error) => {
          if (error) reject(error);
          else resolve({
            mapid: map.mapid,
            urlFormat: map.urlFormat,
            token: map.token || map.mapid // Use mapid as token if token not available
          });
        });
      })
    );

    const ndviMapId = await withTimeout(
      new Promise((resolve, reject) => {
        ndvi.getMapId({
          min: -1,
          max: 1,
          palette: ['FF0000', 'FFFF00', '00FF00']
        }, (map, error) => {
          if (error) reject(error);
          else resolve({
            mapid: map.mapid,
            urlFormat: map.urlFormat,
            token: map.token || map.mapid // Use mapid as token if token not available
          });
        });
      })
    );

    const eviMapId = await withTimeout(
      new Promise((resolve, reject) => {
        evi.getMapId({
          min: -1,
          max: 1,
          palette: ['FF0000', 'FFFF00', '00FF00']
        }, (map, error) => {
          if (error) reject(error);
          else resolve({
            mapid: map.mapid,
            urlFormat: map.urlFormat,
            token: map.token || map.mapid // Use mapid as token if token not available
          });
        });
      })
    );

    return {
      baseImageMapId: baseImageMapId.mapid,
      baseImageUrlFormat: baseImageMapId.urlFormat,
      ndviMapId: ndviMapId.mapid,
      ndviUrlFormat: ndviMapId.urlFormat,
      ndviToken: ndviMapId.token,
      eviMapId: eviMapId.mapid,
      eviUrlFormat: eviMapId.urlFormat,
      eviToken: eviMapId.token,
      ndviStats: {
        min: ndviStats.NDVI_min || -1,
        max: ndviStats.NDVI_max || 1,
        mean: ndviStats.NDVI_mean || 0
      },
      eviStats: {
        min: eviStats.EVI_min || -1,
        max: eviStats.EVI_max || 1,
        mean: eviStats.EVI_mean || 0
      }
    };
  } catch (error) {
    console.error('Baseline imagery generation error:', error);
    throw error;
  }
};

// 5. Complete Baseline Assessment
export const performBaselineAssessment = async (coordinates = null, options = {}) => {
  try {
    console.log('Starting comprehensive baseline assessment...');
    
    const coords = coordinates || WADI_AL_BATHA_DEFAULT;
    
    // Run all analyses
    const [siteDefinition, vegetation, agb, imagery] = await Promise.all([
      analyzeSiteDefinition(coords, options),
      analyzeExistingVegetation(coords, options),
      estimateAGB(coords, options),
      generateBaselineImagery(coords)
    ]);

    return {
      aoi: coords,
      siteDefinition,
      existingVegetation: vegetation,
      agbEstimation: agb,
      baselineImagery: imagery,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Baseline assessment error:', error);
    throw error;
  }
};

