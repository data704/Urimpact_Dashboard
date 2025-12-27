// google-earth-engine.d.ts
declare module '@google/earthengine' {
    interface EEDate {
      advance(offset: number, unit: string): EEDate;
    }
  
    interface EEGeometry {
      Polygon(coords: number[][][]): EEGeometry;
    }
  
    interface EEImage {
      normalizedDifference(bands: string[]): EEImage;
      rename(name: string): EEImage;
      getMapId(params: VisualizationParams, callback: MapIdCallback): void;
    }
  
    interface EEImageCollection {
      filterBounds(geometry: EEGeometry): EEImageCollection;
      filterDate(start: EEDate, end: EEDate): EEImageCollection;
      sort(property: string, ascending?: boolean): EEImageCollection;
      first(): EEImage;
    }
  
    interface VisualizationParams {
      min: number;
      max: number;
      palette: string[];
    }
  
    interface MapIdResponse {
      mapid: string;
      token: string;
    }
  
    type MapIdCallback = (mapid: MapIdResponse, error: Error | null) => void;
  
    interface EarthEngineAPI {
      Image: {
        prototype: EEImage;
      };
      ImageCollection(name: string): EEImageCollection;
      Geometry: EEGeometry;
      Date(milliseconds: number): EEDate;
      initialize(opt_baseurl?: string | null, opt_tileurl?: string | null, success?: () => void, error?: (e: Error) => void): void;
      reset(): void;
      data: {
        authenticateViaPrivateKey(
          credentials: {
            client_email: string;
            private_key: string;
            project_id: string;
          },
          success?: () => void,
          error?: (e: Error) => void
        ): void;
      };
    }
  
    const ee: EarthEngineAPI;
    export default ee;
  }
  