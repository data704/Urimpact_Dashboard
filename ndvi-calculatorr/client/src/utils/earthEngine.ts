import ee from '@google/earthengine';

interface GEECredentials {
  project_id: string;
  private_key: string;
  client_email: string;
}

export interface MapId {
  mapid: string;
  token: string;
}

export const initEarthEngine = async (): Promise<void> => {
  console.log('Starting Earth Engine initialization...');
  
  try {
    const credentials: GEECredentials = {
      project_id: import.meta.env.VITE_GEE_PROJECT_ID,
      private_key: import.meta.env.VITE_GEE_PRIVATE_KEY,
      client_email: import.meta.env.VITE_GEE_CLIENT_EMAIL,
    };

    console.log('Credentials loaded:', {
      project_id: credentials.project_id,
      client_email: credentials.client_email,
      private_key_present: !!credentials.private_key
    });

    return new Promise((resolve, reject) => {
      ee.data.authenticateViaPrivateKey(
        credentials,
        () => {
          console.log('Authentication successful, initializing Earth Engine...');
          ee.initialize(
            null,
            null,
            () => {
              console.log('Earth Engine initialized successfully');
              resolve();
            },
            (error: Error) => {
              console.error('Earth Engine initialization failed:', error);
              reject(new Error(`Earth Engine initialization failed: ${error.message}`));
            }
          );
        },
        (error: Error) => {
          console.error('Authentication failed:', error);
          reject(new Error(`Authentication failed: ${error.message}`));
        }
      );
    });
  } catch (error) {
    console.error('Error in initEarthEngine:', error);
    throw new Error(`Earth Engine initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const calculateNDVI = async (geometry: number[][]): Promise<MapId> => {
  console.log('Starting NDVI calculation with geometry:', geometry);
  
  try {
    console.log('Creating Earth Engine polygon...');
    const region = ee.Geometry.Polygon([geometry]);
    
    console.log('Fetching Sentinel-2 imagery...');
    const startDate = ee.Date(Date.now()).advance(-3, 'month');
    const endDate = ee.Date(Date.now());
    
    console.log('Date range:', {
      start: new Date(Date.now() - (3 * 30 * 24 * 60 * 60 * 1000)).toISOString(),
      end: new Date().toISOString()
    });

    const image = ee.ImageCollection('COPERNICUS/S2_SR')
      .filterBounds(region)
      .filterDate(startDate, endDate)
      .sort('system:time_start', false)
      .first();

    console.log('Calculating NDVI...');
    const ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');

    return new Promise((resolve, reject) => {
      console.log('Getting map visualization...');
      ndvi.getMapId({
        min: -1,
        max: 1,
        palette: ['FF0000', 'FFFF00', '00FF00']
      }, (mapId: MapId, error: Error | null) => {
        if (error) {
          console.error('Error getting map ID:', error);
          reject(error);
        } else {
          console.log('NDVI calculation successful, map ID:', mapId);
          resolve(mapId);
        }
      });
    });
  } catch (error) {
    console.error('Error in calculateNDVI:', error);
    throw new Error(`NDVI calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};