// src/services/earthEngineService.js
import ee from '@google/earthengine';

export const initEarthEngine = async () => {
  const privateKey = process.env.GEE_PRIVATE_KEY.replace(/\\n/g, '\n');
  
  return new Promise((resolve, reject) => {
    ee.data.authenticateViaPrivateKey(
      {
        private_key: privateKey,
        client_email: process.env.GEE_CLIENT_EMAIL,
        project_id: process.env.GEE_PROJECT_ID
      },
      () => ee.initialize(null, null, resolve, reject),
      reject
    );
  });
};

export const calculateNDVI = async (coordinates) => {
  try {
    const region = ee.Geometry.Polygon([coordinates]);
    
    const image = ee.ImageCollection('COPERNICUS/S2_SR')
      .filterBounds(region)
      .filterDate('2024-01-01', '2024-02-07')
      .sort('system:time_start', false)
      .first()
      .clip(region);
 
    const ndvi = image.normalizedDifference(['B8', 'B4'])
      .rename('NDVI')
      .clip(region);
 
    return new Promise((resolve, reject) => {
      try {
        ndvi.getMapId({
          min: -1,
          max: 1,
          palette: ['FF0000', 'FFFF00', '00FF00']
        }, (mapId, error) => {
          if (error) {
            console.error('GEE getMapId error:', error);
            reject(error);
          } else {
            resolve({
              mapid: mapId.mapid,
              urlFormat: mapId.urlFormat
            });
          }
        });
      } catch (err) {
        console.error('getMapId execution error:', err);
        reject(err);
      }
    });
  } catch (error) {
    console.error('NDVI calculation error:', error);
    throw error;
  }
};
const withTimeout = (promise, timeoutMs = 30000) => {
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

export const calculateMHI = async (coordinates) => {
  try {
    console.log('Starting MHI calculation...');
    
    const region = ee.Geometry.Polygon([coordinates]);
    
    // Load and clip the biomass data
    const AGBiomass = ee.Image('projects/sat-io/open-datasets/global_mangrove_distribution/agb/Mangrove_agb_Indonesia')
      .clip(region)
      .select('b1');  // Explicitly select the first band

    console.log('Calculating min/max values...');
    const minMax = await withTimeout(
      new Promise((resolve, reject) => {
        AGBiomass.reduceRegion({
          reducer: ee.Reducer.minMax(),
          geometry: region,
          scale: 10,
          maxPixels: 1e13
        }).evaluate((result, error) => {
          if (error) reject(error);
          else {
            console.log('Min/max results:', result);
            resolve(result);
          }
        });
      })
    );

    console.log('Calculating AGB mean...');
    const AGBMean = await withTimeout(
      new Promise((resolve, reject) => {
        AGBiomass.reduceRegion({
          reducer: ee.Reducer.mean(),
          geometry: region,
          scale: 100,
          maxPixels: 1e9
        }).evaluate((result, error) => {
          if (error) reject(error);
          else {
            console.log('AGB mean results:', result);
            resolve(result);
          }
        });
      })
    );

    // Calculate carbon
    const AGCarbon = AGBiomass.multiply(0.47);

    console.log('Calculating carbon values...');
    const carbonMean = await withTimeout(
      new Promise((resolve, reject) => {
        AGCarbon.reduceRegion({
          reducer: ee.Reducer.mean(),
          geometry: region,
          scale: 100,
          maxPixels: 1e9
        }).evaluate((result, error) => {
          if (error) reject(error);
          else {
            console.log('Carbon mean results:', result);
            resolve(result);
          }
        });
      })
    );

    // Prepare visualization with single band
    console.log('Getting map visualization...');
    const visParams = {
      bands: ['b1'],
      min: 30.00,
      max: 200.00,
      palette: ['d9f0a3', 'addd8e', '78c679', '41ab5d', '238443', '005a32']
    };

    const mapId = await withTimeout(
      new Promise((resolve, reject) => {
        AGBiomass.getMapId(visParams, (map, error) => {
          if (error) {
            console.error('Map visualization error:', error);
            reject(error);
          } else {
            console.log('Map visualization successful');
            resolve({
              mapid: map.mapid,
              urlFormat: map.urlFormat || `https://earthengine.googleapis.com/map/${map.mapid}/{z}/{x}/{y}?token=${map.token}`
            });
          }
        });
      }),
      60000  // Longer timeout for visualization
    );

    // Return all results
    return {
      mapid: mapId.mapid,
      urlFormat: mapId.urlFormat,
      minAGB: minMax.b1_min || 30.00,
      maxAGB: minMax.b1_max || 200.00,
      averageAGB: AGBMean.b1 || 0,
      averageAGC: carbonMean.b1 || 0
    };

  } catch (error) {
    console.error('MHI calculation error:', error);
    if (error.message) {
      throw new Error(`MHI calculation failed: ${error.message}`);
    } else {
      throw new Error('MHI calculation failed: Unknown error');
    }
  }
};

// Add this to your existing earthEngineService.js

export const calculateAGC = async (coordinates) => {
  try {
    console.log('Starting AGC calculation...');
    const region = ee.Geometry.Polygon([coordinates]);

    // Load Sentinel-2 imagery
    const sentinel2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
      .filterDate('2023-01-01', '2024-01-01')
      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
      .map(sentinel2_mask)
      .median()
      .clip(region)
      .multiply(0.0001);

    // Calculate vegetation indices
    const Red = sentinel2.select('B4');
    const RedEdge1 = sentinel2.select('B5');
    const RedEdge2 = sentinel2.select('B6');
    const NIR = sentinel2.select('B8');

    // Calculate IRECI
    const IRECI = NIR.subtract(Red).divide(RedEdge1.divide(RedEdge2));

    // Calculate TRVI
    const TRVI = NIR.divide(Red).sqrt();

    // Calculate Above-ground Carbon
    const AGC = IRECI.multiply(104.741).add(TRVI.multiply(3.025)).add(13.99)
      .clip(region);

    // Load and clip Soil Organic Carbon data
    const SOCarbon = ee.Image('projects/generated-motif-436602-f7/assets/1_jawabali_soilorganiccarbon')
      .clip(region);

    // Calculate total carbon stock
    const totalCarbon = AGC.add(SOCarbon);

    // Get statistics
    const agcStats = await new Promise((resolve, reject) => {
      AGC.reduceRegion({
        reducer: ee.Reducer.mean().combine(ee.Reducer.minMax(), null, true),
        geometry: region,
        scale: 100,
        maxPixels: 1e9
      }).evaluate((result, error) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    const socStats = await new Promise((resolve, reject) => {
      SOCarbon.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: region,
        scale: 100,
        maxPixels: 1e9
      }).evaluate((result, error) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    // Get visualization
    const visParams = {
      min: 100.00,
      max: 700.00,
      palette: [
        '000000','a50026','d73027','f46d43','fdae61','fee08b',
        'ffffbf','d9ef8b','a6d96a','66bd63','1a9850','006837'
      ]
    };

    const mapId = await new Promise((resolve, reject) => {
      totalCarbon
        .visualize(visParams)
        .getMap({}, (map, error) => {
          if (error) reject(error);
          else resolve({
            mapid: map.mapid,
            urlFormat: map.urlFormat
          });
        });
    });

    return {
      mapid: mapId.mapid,
      urlFormat: mapId.urlFormat,
      minAGC: agcStats.min || 0,
      maxAGC: agcStats.max || 0,
      averageAGC: agcStats.mean || 0,
      averageSOC: socStats.b1 || 0,
      totalCarbon: (agcStats.mean || 0) + (socStats.b1 || 0)
    };

  } catch (error) {
    console.error('AGC calculation error:', error);
    throw error;
  }
};

// Helper function for cloud masking
function sentinel2_mask(image) {
  const qa = image.select('QA60');
  const cloudBitMask = (1 << 10);
  const cirrusBitMask = (1 << 11);
  const mask = qa.bitwiseAnd(cloudBitMask).eq(0)
    .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask);
}
// Add this to your earthEngineService.js

// Update the calculateSOC function in earthEngineService.js

export const calculateSOC = async (coordinates) => {
  try {
    console.log('Starting SOC calculation...');
    const region = ee.Geometry.Polygon([coordinates]);

    // Load Soil Organic Carbon data and select single band
    const SOCarbon = ee.Image('projects/generated-motif-436602-f7/assets/1_jawabali_soilorganiccarbon')
      .select('b1')  // Explicitly select the band
      .clip(region);

    // Get min/max values
    const minMax = await new Promise((resolve, reject) => {
      SOCarbon.reduceRegion({
        reducer: ee.Reducer.minMax(),
        geometry: region,
        scale: 100,
        maxPixels: 1e13
      }).evaluate((result, error) => {
        if (error) reject(error);
        else {
          console.log('Min/max results:', result);
          resolve(result);
        }
      });
    });

    // Calculate mean values
    const meanValues = await new Promise((resolve, reject) => {
      SOCarbon.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: region,
        scale: 100,
        maxPixels: 1e9
      }).evaluate((result, error) => {
        if (error) reject(error);
        else {
          console.log('Mean results:', result);
          resolve(result);
        }
      });
    });

    // Calculate area in hectares
    const area = await new Promise((resolve, reject) => {
      region.area().divide(10000) // Convert to hectares
        .evaluate((result, error) => {
          if (error) reject(error);
          else resolve(result);
        });
    });

    // Calculate total carbon stock
    const totalCarbon = meanValues.b1 * area;

    // Get map visualization
    console.log('Getting map visualization...');
    const mapId = await new Promise((resolve, reject) => {
      SOCarbon
        .visualize({
          min: 300.00,
          max: 600.00,
          palette: ['d9f0a3', 'addd8e', '78c679', '41ab5d', '238443', '005a32']
        })
        .getMap({}, (map, error) => {
          if (error) {
            console.error('Visualization error:', error);
            reject(error);
          } else {
            console.log('Visualization successful');
            resolve({
              mapid: map.mapid,
              urlFormat: map.urlFormat
            });
          }
        });
    });

    const result = {
      mapid: mapId.mapid,
      urlFormat: mapId.urlFormat,
      minSOC: minMax.b1_min || 300.00,
      maxSOC: minMax.b1_max || 600.00,
      averageSOC: meanValues.b1 || 0,
      area: area,
      totalCarbon: totalCarbon
    };

    console.log('Returning results:', result);
    return result;

  } catch (error) {
    console.error('SOC calculation error:', error);
    throw error;
  }
};