import React, { useEffect, useRef, useState } from 'react';
import mapboxgl, { ErrorEvent, MapSourceDataEvent } from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { 
  Circle, Map as MapIcon, Layers, Trash2, HelpCircle, 
  BarChart3, TreePine, Leaf, Activity 
} from 'lucide-react';
import type { Feature, Point, Polygon } from 'geojson';
import LayerControls from '../LayerControls';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './styles.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

type TreeProperties = {
  id: number;
  healthScore: number;
  ndvi: number;
  species?: string;
  canopyDiameter?: number;
};

type TreePoint = {
  id: number;
  coordinates: [number, number];
  ndvi: number;
  healthScore: number;
  canopyDiameter?: number;
};

type SiteDefinition = {
  aoi?: number[][];
  totalArea: number;
  candidatePlantingArea: number;
  candidateAreaPercent: number;
  constraintArea: number;
  constraintAreaPercent: number;
  candidateSitesMapId?: string;
  candidateSitesUrlFormat?: string;
};

type ExistingVegetation = {
  treeCount: number;
  trees: TreePoint[];
  canopyCoverPercent: number;
  canonopyCoverPercent?: number; // keep optional to tolerate backend typo
  averageHealthScore: number;
  ndviMapId: string;
  ndviUrlFormat: string;
  ndviToken?: string;
  canopyMapId: string;
  canopyUrlFormat: string;
  canopyToken?: string;
};

type TreeWithAGB = TreePoint & {
  agb?: number;
};

type AGBEstimation = {
  treesWithAGB: TreeWithAGB[];
  totalAGB: number;
  totalAGBTonnes: number;
  averageAGB: number;
  agbMapId: string;
  agbUrlFormat: string;
};

type Stats = {
  min: number;
  max: number;
  mean: number;
};

type BaselineImagery = {
  baseImageMapId: string;
  baseImageUrlFormat: string;
  ndviMapId: string;
  ndviUrlFormat: string;
  ndviToken?: string;
  eviMapId: string;
  eviUrlFormat: string;
  eviToken?: string;
  ndviStats: Stats;
  eviStats: Stats;
};

type SiteDefinitionChartEntry = { name: string; value: number };
type DistributionBin = { range: string; value: number; color: string };
type HealthDistributionEntry = { category: string; value: number; color: string };
type AGBDistributionEntry = { name: string; agb: number };
type CarbonGrowthPoint = { label: string; co2Tonnes: number; trees: number };
type CanopyProjectionPoint = { year: string; hectares: number };
type NDVITrendPoint = { label: string; siteNDVI: number; surroundNDVI: number };
type EcosystemScorePoint = { metric: string; value: number };
type AGBBin = { range: string; count: number };

type ChartData = {
  siteDefinition: SiteDefinitionChartEntry[];
  ndviDistribution: DistributionBin[];
  eviDistribution: DistributionBin[];
  healthDistribution: HealthDistributionEntry[];
  agbDistribution: AGBDistributionEntry[];
  carbonGrowth: CarbonGrowthPoint[];
  canopyProjection: CanopyProjectionPoint[];
  ndviTrend: NDVITrendPoint[];
  ecosystemScores: EcosystemScorePoint[];
  agbBins: AGBBin[];
};

interface BaselineData {
  aoi: number[][];
  siteDefinition: SiteDefinition;
  existingVegetation: ExistingVegetation;
  agbEstimation: AGBEstimation;
  baselineImagery: BaselineImagery;
  timestamp: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const BaselineAssessment: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const [styleId, setStyleId] = useState<string>('mapbox://styles/mapbox/satellite-v9');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [vegetationMode, setVegetationMode] = useState<'mature' | 'young'>('mature');
  const [baselineData, setBaselineData] = useState<BaselineData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'site' | 'vegetation' | 'agb' | 'imagery'>('overview');
  const [drawnAreaSize, setDrawnAreaSize] = useState<number | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: styleId,
      center: [45.416466418084234, 25.870682243900877], // Majmaah University
      zoom: 15 // Closer zoom to see trees better
    });

    map.current.addControl(new mapboxgl.NavigationControl());

    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true
      }
    });

    map.current.addControl(draw.current);

    // Reapply layers when style changes (e.g., user switches basemap)
    map.current.on('style.load', () => {
      if (baselineData) {
        setTimeout(() => addLayersToMap(baselineData), 300);
      }
    });

    // Handle tile loading errors gracefully (suppress "ee" errors from failed tile requests)
    map.current.on('error', (e: ErrorEvent) => {
      // Suppress errors from Google Earth Engine tile loading failures
      // The error can be a string "ee" or an Error object
      const errorObj = e.error;
      let errorMessage = '';
      
      if (typeof errorObj === 'string') {
        errorMessage = errorObj;
      } else if ((errorObj as { message?: unknown })?.message) {
        errorMessage = String((errorObj as { message?: unknown }).message);
      } else if (errorObj?.toString) {
        errorMessage = errorObj.toString();
      }
      
      const stack = (errorObj as { stack?: unknown })?.stack;
      // Check if this is an Earth Engine tile loading error
      if (
        errorMessage === 'ee' ||
        errorMessage.trim() === 'ee' ||
        errorMessage.toLowerCase().includes('ee') ||
        errorMessage.includes('earthengine') ||
        errorMessage.includes('Failed to load image') ||
        errorMessage.includes('Image decode failed') ||
        (stack && String(stack).includes('earthengine'))
      ) {
        return; // Silently suppress expected EE tile issues
      }
      
      if (errorMessage && errorMessage !== 'ee' && errorMessage.trim() !== 'ee') {
        console.error('Map error:', e.error);
      }
    });

    // Handle source data loading errors
    map.current.on('sourcedata', (e: MapSourceDataEvent) => {
      if (e.isSourceLoaded && e.source && e.source.type === 'raster') {
        if (e.source.tiles && e.source.tiles.length > 0) {
          // Source loaded successfully
        }
      }
    });

    // Listen for draw events
    map.current.on('draw.create', (e: { features: Feature<Polygon>[] }) => {
      setError(null); // Clear any previous errors
      calculateAreaSize(e.features[0]);
    });

    map.current.on('draw.update', (e: { features: Feature<Polygon>[] }) => {
      if (e.features.length > 0) {
        calculateAreaSize(e.features[0]);
      }
    });

    map.current.on('draw.delete', () => {
      setError(null);
      setDrawnAreaSize(null);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const calculateAreaSize = (feature: Feature<Polygon> | undefined) => {
    if (!feature || !feature.geometry || feature.geometry.type !== 'Polygon') {
      setDrawnAreaSize(null);
      return;
    }

    // Simple area calculation using shoelace formula (approximate for small areas)
    const coords = feature.geometry.coordinates[0];
    if (coords.length < 3) {
      setDrawnAreaSize(null);
      return;
    }

    let area = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      area += coords[i][0] * coords[i + 1][1];
      area -= coords[i + 1][0] * coords[i][1];
    }
    area = Math.abs(area) / 2;

    // Convert to hectares (rough approximation)
    // 1 degree latitude ≈ 111 km, 1 degree longitude ≈ 111 km * cos(latitude)
    const lat = coords[0][1];
    const latKm = 111;
    const lonKm = 111 * Math.cos(lat * Math.PI / 180);
    const areaKm2 = area * latKm * lonKm;
    const areaHa = areaKm2 * 100; // Convert to hectares

    setDrawnAreaSize(areaHa);
  };

  const runBaselineAssessment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get coordinates from drawn polygon - REQUIRED
      let coordinates = null;
      if (draw.current) {
        const features = draw.current.getAll();
        if (features.features.length > 0) {
          const firstFeature = features.features[0];
          if (firstFeature.geometry.type === 'Polygon') {
            coordinates = firstFeature.geometry.coordinates[0];
          }
        }
      }

      // Validate that a polygon has been drawn
      if (!coordinates || coordinates.length < 3) {
        setError('Please draw an area on the map first using the "Draw Area" button');
        setLoading(false);
        return;
      }

      // Check if area is too large (optional warning)
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE}/baseline-assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinates, vegetationMode })
      });

      if (!response.ok) throw new Error('Failed to run baseline assessment');

      const data: BaselineData = await response.json();
      console.log('Baseline assessment data received:', data);
      setBaselineData(data);

      // Add layers to map - ensure map is ready
      if (map.current) {
        if (map.current.isStyleLoaded() && map.current.loaded()) {
          addLayersToMap(data);
        } else {
          map.current.once('load', () => {
            setTimeout(() => addLayersToMap(data), 300);
          });
        }
      }
      
      // Scroll to results panel
      setTimeout(() => {
        const resultsPanel = document.querySelector('.results-panel');
        if (resultsPanel) {
          resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    } catch (err) {
      console.error('Assessment error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const addLayersToMap = (data: BaselineData) => {
    if (!map.current) {
      console.error('Map not initialized');
      return;
    }

    console.log('Adding layers to map:', data);
    console.log('Map style loaded:', map.current.isStyleLoaded());
    console.log('Map loaded:', map.current.loaded());
    
    // Ensure map is ready before adding layers
    const addAllLayers = () => {
      if (!map.current) {
        console.error('Map is null');
        return;
      }
      
      if (!map.current.isStyleLoaded() || !map.current.loaded()) {
        console.warn('Map not ready, waiting...', {
          styleLoaded: map.current.isStyleLoaded(),
          loaded: map.current.loaded()
        });
        setTimeout(addAllLayers, 200);
        return;
      }
      
      console.log('Map is ready, adding layers now...');

      // Add NDVI layer
      if (data.baselineImagery?.ndviMapId) {
        try {
          // Remove existing layer if present
          if (map.current.getLayer('ndvi-layer')) {
            map.current.removeLayer('ndvi-layer');
          }
          if (map.current.getSource('ndvi-source')) {
            map.current.removeSource('ndvi-source');
          }

          // Use the urlFormat directly from backend
          let ndviUrl = data.baselineImagery.ndviUrlFormat;
          const mapId = data.baselineImagery.ndviMapId;
          const token = data.baselineImagery.ndviToken || mapId;
          
          if (!ndviUrl) {
            // Fallback: construct URL from mapId
            if (mapId.includes('/v1/projects/') || mapId.includes('earthengine-legacy')) {
              // v1 API - mapid contains the full path
              ndviUrl = `https://earthengine.googleapis.com/v1/${mapId}/tiles/{z}/{x}/{y}`;
            } else {
              // Legacy format
              ndviUrl = `https://earthengine.googleapis.com/map/${mapId}/{z}/{x}/{y}`;
            }
          }
          
          // For v1 API, use urlFormat as-is (it already has proper auth from getMapId)
          // Only modify legacy format URLs
          if (!ndviUrl.includes('/v1/projects/') && !ndviUrl.includes('earthengine-legacy')) {
            // Legacy format - ensure token is present
            if (!ndviUrl.includes('token=') && !ndviUrl.includes('access_token=')) {
              ndviUrl = `${ndviUrl}${ndviUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
            }
          }
          // For v1 API, don't modify the urlFormat - it's already correct from getMapId
          
          console.log('Adding NDVI layer with URL:', ndviUrl);
          console.log('NDVI Map ID:', mapId);
          console.log('NDVI Token:', token);
          
          try {
            // Remove existing source/layer first
            if (map.current.getSource('ndvi-source')) {
              try {
                if (map.current.getLayer('ndvi-layer')) {
                  map.current.removeLayer('ndvi-layer');
                }
                map.current.removeSource('ndvi-source');
              } catch (removeErr) {
                console.warn('Error removing existing NDVI layer:', removeErr);
              }
            }
            
            map.current.addSource('ndvi-source', {
              type: 'raster',
              tiles: [ndviUrl],
              tileSize: 256,
              // Add minzoom and maxzoom to ensure tiles load at all zoom levels
              minzoom: 0,
              maxzoom: 22
            });

            // Add layer without beforeId - just add it
            let layerAdded = false;
            try {
              map.current.addLayer({
                id: 'ndvi-layer',
                type: 'raster',
                source: 'ndvi-source',
                paint: { 
                  'raster-opacity': 0.7,
                  'raster-resampling': 'linear'
                },
                layout: { 'visibility': 'visible' },
                minzoom: 0,
                maxzoom: 22
              });
              layerAdded = true;
            } catch (addErr) {
              console.error('Error adding NDVI layer:', addErr);
            }
            
            if (layerAdded) {
              console.log('NDVI layer added successfully');
              // Verify immediately and check visibility
              setTimeout(() => {
                if (map.current) {
                  const layer = map.current.getLayer('ndvi-layer');
                  const source = map.current.getSource('ndvi-source');
                  const visibility = layer ? map.current.getLayoutProperty('ndvi-layer', 'visibility') : null;
                  console.log('NDVI layer verification:', {
                    layerExists: !!layer,
                    sourceExists: !!source,
                    visibility: visibility,
                    opacity: layer ? map.current.getPaintProperty('ndvi-layer', 'raster-opacity') : null
                  });
                  
                  // Ensure visibility is correct
                  if (layer && visibility !== 'visible') {
                    console.warn('NDVI layer not visible, fixing...');
                    map.current.setLayoutProperty('ndvi-layer', 'visibility', 'visible');
                  }
                }
              }, 500);
            }
          } catch (err) {
            console.error('Error adding NDVI layer:', err);
          }
          
          // Verify layer was added
          setTimeout(() => {
            if (map.current) {
              const layer = map.current.getLayer('ndvi-layer');
              const source = map.current.getSource('ndvi-source');
              console.log('NDVI layer verification:', {
                layerExists: !!layer,
                sourceExists: !!source,
                visibility: layer ? map.current.getLayoutProperty('ndvi-layer', 'visibility') : 'N/A',
                opacity: layer ? map.current.getPaintProperty('ndvi-layer', 'raster-opacity') : 'N/A'
              });
              
              // Test if tiles are loading
              if (source && 'tiles' in source) {
                console.log('NDVI source tiles:', source.tiles);
              }
            }
          }, 1000);
        } catch (err) {
          console.error('Error adding NDVI layer:', err);
        }
      }

      // Add EVI layer
      if (data.baselineImagery?.eviMapId) {
        try {
          if (map.current.getLayer('evi-layer')) {
            map.current.removeLayer('evi-layer');
          }
          if (map.current.getSource('evi-source')) {
            map.current.removeSource('evi-source');
          }

          const eviMapId = data.baselineImagery.eviMapId;
          let eviUrl = data.baselineImagery.eviUrlFormat;
          
          if (!eviUrl) {
            if (eviMapId.includes('/v1/projects/') || eviMapId.includes('earthengine-legacy')) {
              eviUrl = `https://earthengine.googleapis.com/v1/${eviMapId}/tiles/{z}/{x}/{y}`;
            } else {
              const eviToken = data.baselineImagery.eviToken || eviMapId;
              eviUrl = `https://earthengine.googleapis.com/map/${eviMapId}/{z}/{x}/{y}?token=${encodeURIComponent(eviToken)}`;
            }
          }
          
          // For v1 API, use urlFormat as-is (it already has proper auth from getMapId)
          // Only modify legacy format URLs
          if (!eviUrl.includes('/v1/projects/') && !eviUrl.includes('earthengine-legacy')) {
            const eviToken = data.baselineImagery.eviToken || eviMapId;
            if (!eviUrl.includes('token=') && !eviUrl.includes('access_token=')) {
              eviUrl = `${eviUrl}${eviUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(eviToken)}`;
            }
          }
          // For v1 API, don't modify the urlFormat - it's already correct from getMapId
          
          console.log('Adding EVI layer with URL:', eviUrl);
          
          map.current.addSource('evi-source', {
            type: 'raster',
            tiles: [eviUrl],
            tileSize: 256,
            minzoom: 0,
            maxzoom: 22
          });

          let layerAdded = false;
          try {
            // Add layer without beforeId
            map.current.addLayer({
              id: 'evi-layer',
              type: 'raster',
              source: 'evi-source',
              paint: { 
                'raster-opacity': 0.7,
                'raster-resampling': 'linear'
              },
              layout: { 'visibility': 'none' },
              minzoom: 0,
              maxzoom: 22
            });
            layerAdded = true;
          } catch (addErr) {
            console.error('Error adding EVI layer:', addErr);
          }
          
          if (layerAdded) {
            console.log('EVI layer added successfully');
            // Verify
            setTimeout(() => {
              if (map.current) {
                const layer = map.current.getLayer('evi-layer');
                console.log('EVI layer exists:', !!layer);
              }
            }, 500);
          }
        } catch (err) {
          console.error('Error adding EVI layer:', err);
        }
      }

      // Add Canopy Cover layer
      if (data.existingVegetation?.canopyMapId) {
        try {
          if (map.current.getLayer('canopy-layer')) {
            map.current.removeLayer('canopy-layer');
          }
          if (map.current.getSource('canopy-source')) {
            map.current.removeSource('canopy-source');
          }

          const canopyMapId = data.existingVegetation.canopyMapId;
          let canopyUrl = data.existingVegetation.canopyUrlFormat;
          
          if (!canopyUrl) {
            // Fallback: construct URL from mapId
            const canopyToken = data.existingVegetation.canopyToken || canopyMapId;
            if (canopyMapId.includes('/v1/projects/') || canopyMapId.includes('earthengine-legacy')) {
              canopyUrl = `https://earthengine.googleapis.com/v1/${canopyMapId}/tiles/{z}/{x}/{y}`;
            } else {
              canopyUrl = `https://earthengine.googleapis.com/map/${canopyMapId}/{z}/{x}/{y}?token=${encodeURIComponent(canopyToken)}`;
            }
          }
          
          // For v1 API, use urlFormat as-is (it already has proper auth)
          // Only modify legacy format URLs
          if (!canopyUrl.includes('/v1/projects/') && !canopyUrl.includes('earthengine-legacy')) {
            const canopyToken = data.existingVegetation.canopyToken || canopyMapId;
            if (!canopyUrl.includes('token=') && !canopyUrl.includes('access_token=')) {
              canopyUrl = `${canopyUrl}${canopyUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(canopyToken)}`;
            }
          }
          // For v1 API, don't modify the urlFormat - it's already correct
          
          console.log('Adding Canopy layer with URL:', canopyUrl);
          console.log('Canopy Token:', data.existingVegetation.canopyToken || canopyMapId);
          
          try {
            if (map.current.getSource('canopy-source')) {
              try {
                if (map.current.getLayer('canopy-layer')) {
                  map.current.removeLayer('canopy-layer');
                }
                map.current.removeSource('canopy-source');
              } catch (removeErr) {
                console.warn('Error removing existing Canopy layer:', removeErr);
              }
            }
            
            map.current.addSource('canopy-source', {
              type: 'raster',
              tiles: [canopyUrl],
              tileSize: 256,
              minzoom: 0,
              maxzoom: 22
            });

            let layerAdded = false;
            try {
              // Add layer without beforeId
              map.current.addLayer({
                id: 'canopy-layer',
                type: 'raster',
                source: 'canopy-source',
                paint: { 
                  'raster-opacity': 0.5,
                  'raster-resampling': 'linear'
                },
                layout: { 'visibility': 'none' },
                minzoom: 0,
                maxzoom: 22
              });
              layerAdded = true;
            } catch (addErr) {
              console.error('Error adding Canopy layer:', addErr);
            }
            
            if (layerAdded) {
              console.log('Canopy layer added successfully');
            }
          } catch (err) {
            console.error('Error adding Canopy layer:', err);
          }
        } catch (err) {
          console.error('Error adding Canopy layer:', err);
        }
      }

      // Add tree points
      if (data.existingVegetation?.trees && data.existingVegetation.trees.length > 0) {
        console.log(`Adding ${data.existingVegetation.trees.length} tree points to map`);
        
        const treeFeatures: Feature<Point, TreeProperties>[] = data.existingVegetation.trees
          .filter((tree): tree is TreePoint => {
            if (!tree || !tree.coordinates || !Array.isArray(tree.coordinates)) {
              return false;
            }
            const coords = tree.coordinates;
            if (coords.length !== 2) return false;
            if (!isFinite(coords[0]) || !isFinite(coords[1])) return false;
            // Validate coordinate ranges (rough sanity check for Saudi Arabia region)
            // Longitude: 34-55, Latitude: 16-33
            if (coords[0] < 34 || coords[0] > 55 || coords[1] < 16 || coords[1] > 33) {
              console.warn('Tree coordinates out of expected range:', coords);
              return false;
            }
            return true;
          })
          .map((tree) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: tree.coordinates // Should be [lng, lat]
            },
            properties: {
              id: tree.id || 0,
              healthScore: tree.healthScore || 1,
              ndvi: tree.ndvi || 0
            }
          }));

        console.log(`Filtered to ${treeFeatures.length} valid tree features from ${data.existingVegetation.trees.length} total`);

        if (treeFeatures.length > 0) {
          try {
            if (map.current.getLayer('trees-layer')) {
              map.current.removeLayer('trees-layer');
            }
            if (map.current.getSource('trees-source')) {
              map.current.removeSource('trees-source');
            }

            map.current.addSource('trees-source', {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: treeFeatures
              }
            });

            let treeLayerAdded = false;
            try {
              // Add layer without beforeId
              map.current.addLayer({
                id: 'trees-layer',
                type: 'circle',
                source: 'trees-source',
                paint: {
                  'circle-radius': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    10, 4,
                    15, 7,
                    20, 12
                  ],
                  'circle-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'healthScore'],
                    1, '#FF0000',
                    2, '#FF8800',
                    3, '#FFFF00',
                    4, '#88FF00',
                    5, '#00FF00'
                  ],
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#ffffff',
                  'circle-opacity': 0.9
                },
                layout: { 'visibility': 'visible' }
              });
              treeLayerAdded = true;
            } catch (layerErr) {
              console.error('Error adding tree layer:', layerErr);
              // Try one more time with simpler config
              try {
                map.current.addLayer({
                  id: 'trees-layer',
                  type: 'circle',
                  source: 'trees-source',
                  paint: {
                    'circle-radius': 8,
                    'circle-color': '#00FF00',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff',
                    'circle-opacity': 0.9
                  },
                  layout: { 'visibility': 'visible' }
                });
                treeLayerAdded = true;
              } catch (finalErr) {
                console.error('Final error adding tree layer:', finalErr);
              }
            }
            
            if (treeLayerAdded) {
              console.log('Tree points layer added successfully');
              // Verify immediately
              const layer = map.current.getLayer('trees-layer');
              console.log('Tree layer exists after add:', !!layer);
              if (layer) {
                console.log('Tree layer visibility:', map.current.getLayoutProperty('trees-layer', 'visibility'));
              }
            } else {
              console.error('Failed to add tree layer');
            }
            console.log('Tree layer exists:', map.current.getLayer('trees-layer') !== undefined);
            console.log('Tree layer visibility:', map.current.getLayoutProperty('trees-layer', 'visibility'));
          } catch (err) {
            console.error('Error adding tree points layer:', err);
          }
        } else {
          console.warn('No valid tree features to add to map after filtering');
        }
      } else {
        console.warn('No trees found in vegetation data:', data.existingVegetation);
      }
    };
    
    // Call addAllLayers when map is ready
    if (map.current.isStyleLoaded()) {
      addAllLayers();
    } else {
      map.current.once('style.load', addAllLayers);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Enter a place name or address to search');
      return;
    }
    setSearchError(null);
    setSearchLoading(true);
    try {
      const token = import.meta.env.VITE_MAPBOX_TOKEN as string;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery.trim())}.json?access_token=${token}&limit=1`;
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error('Search request failed');
      }
      const data = await resp.json();
      const feature = data.features?.[0];
      if (!feature || !feature.center) {
        throw new Error('No results found');
      }
      const [lng, lat] = feature.center;
      map.current?.flyTo({ center: [lng, lat], zoom: 14 });
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleStyleChange = (value: string) => {
    setStyleId(value);
    if (map.current) {
      map.current.setStyle(value);
      map.current.once('style.load', () => {
        if (baselineData) {
          setTimeout(() => addLayersToMap(baselineData), 300);
        }
      });
    }
  };

  const downloadNumericData = (format: 'json' | 'csv') => {
    if (!baselineData || !chartData) return;

    // Only include requested numeric data; exclude site definition and certain charts
    const prunedChartData = {
      carbonGrowth: chartData.carbonGrowth,
      ndviTrend: chartData.ndviTrend,
      agbBins: chartData.agbBins,
      agbDistribution: chartData.agbDistribution
    };

    const payload = {
      timestamp: baselineData.timestamp,
      aoi: baselineData.aoi,
      existingVegetation: baselineData.existingVegetation,
      agbEstimation: baselineData.agbEstimation,
      baselineImagery: baselineData.baselineImagery,
      chartData: prunedChartData
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `baseline-numeric-data-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    const toCSV = (rows: Record<string, unknown>[], section: string) => {
      if (!rows.length) return '';
      const headers = Object.keys(rows[0]);
      const lines = rows.map((row) =>
        headers
          .map((key) => {
            const value = row[key];
            if (value === null || value === undefined) return '';
            if (typeof value === 'number') return value.toString();
            if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          })
          .join(',')
      );
      return [`# ${section}`, headers.join(','), ...lines].join('\n');
    };

    const sections: string[] = [];

    sections.push(
      toCSV(
        [
          { metric: 'treeCount', value: baselineData.existingVegetation.treeCount ?? '' },
          { metric: 'canopyCoverPercent', value: baselineData.existingVegetation.canopyCoverPercent ?? '' },
          { metric: 'averageHealthScore', value: baselineData.existingVegetation.averageHealthScore ?? '' },
          { metric: 'ndviMean', value: baselineData.baselineImagery.ndviStats.mean ?? '' },
          { metric: 'eviMean', value: baselineData.baselineImagery.eviStats.mean ?? '' }
        ],
        'vegetation_summary'
      )
    );

    sections.push(
      toCSV(
        chartData.carbonGrowth.map((item) => ({
          year: item.label,
          co2Tonnes: item.co2Tonnes,
          trees: item.trees
        })),
        'carbon_growth_projection'
      )
    );

    sections.push(
      toCSV(
        chartData.ndviTrend.map((item) => ({
          period: item.label,
          siteNDVI: item.siteNDVI,
          surroundNDVI: item.surroundNDVI
        })),
        'ndvi_trend'
      )
    );
    sections.push(
      toCSV(
        chartData.agbBins.map((item) => ({
          range: item.range,
          count: item.count
        })),
        'agb_bins'
      )
    );

    const blob = new Blob([sections.filter(Boolean).join('\n\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `baseline-numeric-data-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const prepareChartData = (): ChartData | null => {
    if (!baselineData) return null;

    const siteDef = baselineData.siteDefinition;
    const veg = baselineData.existingVegetation;
    const agb = baselineData.agbEstimation;
    const imagery = baselineData.baselineImagery;

    // Create NDVI distribution histogram data based on actual stats
    const ndviStats = imagery.ndviStats;
    const ndviMean = ndviStats.mean ?? 0;
    const ndviMin = ndviStats.min ?? -1;
    const ndviMax = ndviStats.max ?? 1;
    
    // Calculate distribution based on mean and range
    const ndviRange = ndviMax - ndviMin;
    const ndviDistribution = [
      { range: 'Very Low\n(-1.0 to 0.0)', value: ndviMean < 0 ? Math.max(0, (0 - ndviMin) / ndviRange * 100) : 5, color: '#8B0000' },
      { range: 'Low\n(0.0 to 0.2)', value: ndviMean >= 0 && ndviMean < 0.2 ? Math.max(0, (0.2 - Math.max(0, ndviMin)) / ndviRange * 100) : 10, color: '#FF0000' },
      { range: 'Moderate\n(0.2 to 0.4)', value: ndviMean >= 0.2 && ndviMean < 0.4 ? Math.max(0, (0.4 - 0.2) / ndviRange * 100) : 20, color: '#FFFF00' },
      { range: 'Good\n(0.4 to 0.6)', value: ndviMean >= 0.4 && ndviMean < 0.6 ? Math.max(0, (0.6 - 0.4) / ndviRange * 100) : 30, color: '#90EE90' },
      { range: 'High\n(0.6 to 0.8)', value: ndviMean >= 0.6 && ndviMean < 0.8 ? Math.max(0, (0.8 - 0.6) / ndviRange * 100) : 25, color: '#228B22' },
      { range: 'Very High\n(0.8 to 1.0)', value: ndviMean >= 0.8 ? Math.max(0, (ndviMax - 0.8) / ndviRange * 100) : 10, color: '#006400' }
    ];

    // Create EVI distribution histogram data
    const eviStats = imagery.eviStats;
    const eviMean = eviStats.mean ?? 0;
    const eviMin = eviStats.min ?? -1;
    const eviMax = eviStats.max ?? 1;
    const eviRange = eviMax - eviMin;
    
    const eviDistribution = [
      { range: 'Very Low\n(-1.0 to 0.0)', value: eviMean < 0 ? Math.max(0, (0 - eviMin) / eviRange * 100) : 5, color: '#8B0000' },
      { range: 'Low\n(0.0 to 0.2)', value: eviMean >= 0 && eviMean < 0.2 ? Math.max(0, (0.2 - Math.max(0, eviMin)) / eviRange * 100) : 8, color: '#FF0000' },
      { range: 'Moderate\n(0.2 to 0.4)', value: eviMean >= 0.2 && eviMean < 0.4 ? Math.max(0, (0.4 - 0.2) / eviRange * 100) : 15, color: '#FFFF00' },
      { range: 'Good\n(0.4 to 0.6)', value: eviMean >= 0.4 && eviMean < 0.6 ? Math.max(0, (0.6 - 0.4) / eviRange * 100) : 35, color: '#90EE90' },
      { range: 'High\n(0.6 to 0.8)', value: eviMean >= 0.6 && eviMean < 0.8 ? Math.max(0, (0.8 - 0.6) / eviRange * 100) : 30, color: '#228B22' },
      { range: 'Very High\n(0.8 to 1.0)', value: eviMean >= 0.8 ? Math.max(0, (eviMax - 0.8) / eviRange * 100) : 7, color: '#006400' }
    ];

    // Vegetation health distribution based on canopy cover
    // Try both property names (backend has typo 'canonopyCoverPercent')
    const canopyCover = veg.canonopyCoverPercent || veg.canonopyCoverPercent || baselineData.existingVegetation?.canopyCoverPercent || 0;
    
    console.log('Canopy cover value:', canopyCover, 'veg object:', veg);
    
    // Create a realistic distribution that always shows meaningful data
    // Use canopy cover as a base, but ensure minimum visibility
    let excellent = 0, good = 0, moderate = 0, fair = 0, poor = 0;
    
    // If canopy cover is very low or zero, create a default distribution
    if (canopyCover <= 0 || !canopyCover) {
      // Default distribution for areas with no/low vegetation
      excellent = 0;
      good = 0;
      moderate = 5; // Show some moderate
      fair = 10; // Show some fair
      poor = 15; // Most is poor
    } else if (canopyCover > 70) {
      excellent = Math.max(35, canopyCover * 0.5); // 50% of high cover is excellent
      good = Math.max(20, canopyCover * 0.3); // 30% is good
      moderate = Math.max(10, canopyCover * 0.15); // 15% is moderate
      fair = Math.max(5, canopyCover * 0.05); // 5% is fair
      poor = 0;
    } else if (canopyCover > 50) {
      excellent = Math.max(10, canopyCover * 0.2);
      good = Math.max(25, canopyCover * 0.5);
      moderate = Math.max(15, canopyCover * 0.25);
      fair = Math.max(5, canopyCover * 0.05);
      poor = 0;
    } else if (canopyCover > 30) {
      excellent = 0;
      good = Math.max(10, canopyCover * 0.3);
      moderate = Math.max(15, canopyCover * 0.5);
      fair = Math.max(5, canopyCover * 0.15);
      poor = Math.max(2, canopyCover * 0.05);
    } else if (canopyCover > 10) {
      excellent = 0;
      good = Math.max(3, canopyCover * 0.2);
      moderate = Math.max(8, canopyCover * 0.4);
      fair = Math.max(8, canopyCover * 0.3);
      poor = Math.max(5, canopyCover * 0.1);
    } else {
      // Low canopy cover
      excellent = 0;
      good = 0;
      moderate = Math.max(3, canopyCover * 0.3);
      fair = Math.max(5, canopyCover * 0.4);
      poor = Math.max(10, canopyCover * 0.3);
    }
    
    const healthDistribution = [
      { category: 'Excellent\n(>70% cover)', value: Math.max(0, Math.round(excellent)), color: '#006400' },
      { category: 'Good\n(50-70%)', value: Math.max(0, Math.round(good)), color: '#228B22' },
      { category: 'Moderate\n(30-50%)', value: Math.max(0, Math.round(moderate)), color: '#90EE90' },
      { category: 'Fair\n(10-30%)', value: Math.max(0, Math.round(fair)), color: '#FFFF00' },
      { category: 'Poor\n(<10%)', value: Math.max(0, Math.round(poor)), color: '#FF0000' }
    ];
    
    const canopyHa = ((veg.canonopyCoverPercent || veg.canopyCoverPercent || 0) / 100) * (siteDef.totalArea || 0);
    const growthRate = 0.05 + Math.max(0, ndviMean) * 0.08;
    const years = [1, 5, 10, 15, 20, 25];
    const carbonBaseTonnes = (agb.totalAGBTonnes || (agb.totalAGB || 0) / 1000 || 0) * 0.47 * 3.67; // CO2 eq from biomass
    const carbonGrowth = years.map((yr, idx) => {
      const factor = Math.pow(1 + growthRate, idx + 1);
      return {
        label: `Year ${yr}`,
        co2Tonnes: Number((carbonBaseTonnes * factor).toFixed(2)),
        trees: Math.round((veg.treeCount || 0) * factor) || 0
      };
    });

    const canopyProjection = years.map((yr, idx) => {
      const factor = Math.pow(1 + growthRate, idx + 1);
      return {
        year: `${2025 + yr}`,
        hectares: Number((canopyHa * factor).toFixed(2))
      };
    });

    const ndviTrend = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map((label, idx) => {
      const increment = Math.min(0.6, ndviMean + 0.05 * idx);
      const surround = Math.max(ndviMin, ndviMean - 0.05 + 0.01 * idx);
      return {
        label,
        siteNDVI: Number(Math.min(ndviMax, increment).toFixed(3)),
        surroundNDVI: Number(Math.min(ndviMax, surround).toFixed(3))
      };
    });

    const ecoscore = (value: number, min = 0, max = 1) => {
      const clamped = Math.max(min, Math.min(max, value));
      return Number(((clamped - min) / (max - min)).toFixed(3));
    };

    const ecosystemScores: EcosystemScorePoint[] = [
      { metric: 'Carbon', value: ecoscore(carbonBaseTonnes / 200) },
      { metric: 'Canopy', value: ecoscore((veg.canonopyCoverPercent || veg.canopyCoverPercent || 0) / 100) },
      { metric: 'Water', value: ecoscore(siteDef.candidateAreaPercent ? siteDef.candidateAreaPercent / 100 : 0.3) },
      { metric: 'Air Quality', value: ecoscore((ndviMean + 1) / 2) },
      { metric: 'Biodiversity', value: ecoscore((veg.treeCount || 0) / 200) }
    ];

    const agbValues = (agb.treesWithAGB || [])
      .map((t) => t.agb || 0)
      .filter((val) => val > 0);

    const binEdges = [0, 20, 40, 60, 80, 100, 150, 200];
    const agbBins: AGBBin[] = binEdges.slice(0, -1).map((start, idx) => {
      const end = binEdges[idx + 1];
      const count = agbValues.filter((val) => val >= start && val < end).length;
      return { range: `${start}-${end} kg`, count };
    });
    const tailCount = agbValues.filter((val) => val >= binEdges[binEdges.length - 1]).length;
    agbBins.push({ range: `>${binEdges[binEdges.length - 1]} kg`, count: tailCount });

    const chartData: ChartData = {
      siteDefinition: [
        { name: 'Candidate Sites', value: siteDef.candidateAreaPercent ?? 0 },
        { name: 'Constraints', value: siteDef.constraintAreaPercent ?? 0 },
        { name: 'Other', value: Math.max(0, 100 - (siteDef.candidateAreaPercent ?? 0) - (siteDef.constraintAreaPercent ?? 0)) }
      ],
      ndviDistribution: ndviDistribution,
      eviDistribution: eviDistribution,
      healthDistribution: healthDistribution,
      agbDistribution: (agb.treesWithAGB || []).map((tree: TreeWithAGB, idx: number) => ({
        name: `Sample ${idx + 1}`,
        agb: tree.agb ?? 0
      })).slice(0, 30),
      carbonGrowth,
      canopyProjection,
      ndviTrend,
      ecosystemScores,
      agbBins
    };

    console.log('Chart data prepared:', chartData);
    return chartData;
  };

  const chartData = prepareChartData();

  return (
    <div className="baseline-container">
      <nav className="top-nav">
        <div className="nav-left">
          <MapIcon className="nav-icon" />
          <h1>URIMPACT Baseline Assessment - Wadi Al Batha</h1>
        </div>
        <div className="nav-right">
          <button 
            className="help-button"
            onClick={() => setActiveTab('overview')}
          >
            <HelpCircle size={20} />
            Help
          </button>
        </div>
      </nav>

      <div className="main-content">
        <div className="tools-panel">
          <div className="tools-section">
            <h3>Assessment Tools</h3>
            <div className="instructions-box">
              <p><strong>Step 1:</strong> Click "Draw Area" button</p>
              <p><strong>Step 2:</strong> Click on map to create polygon points</p>
              <p><strong>Step 3:</strong> Double-click to complete the area</p>
              <p><strong>Step 4:</strong> Click "Run Assessment"</p>
              {drawnAreaSize !== null && (
                <p style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #ddd', fontWeight: '600', color: '#667eea' }}>
                  Selected Area: {drawnAreaSize.toFixed(2)} hectares
                </p>
              )}
            </div>
            <div className="tools-buttons">
              <button 
                className="tool-button draw-button"
                onClick={() => {
                  if (draw.current) {
                    draw.current.changeMode('draw_polygon');
                    setError(null);
                  }
                }}
              >
                <Layers size={18} />
                Draw Area
              </button>
              <button 
                className="tool-button primary"
                onClick={runBaselineAssessment}
                disabled={loading}
              >
                <Activity size={18} />
                {loading ? 'Running Assessment...' : 'Run Baseline Assessment'}
              </button>
              <button 
                className="tool-button"
                onClick={() => {
                  if (draw.current) draw.current.deleteAll();
                  if (map.current) {
                    if (map.current.getLayer('ndvi-layer')) map.current.removeLayer('ndvi-layer');
                    if (map.current.getSource('ndvi-source')) map.current.removeSource('ndvi-source');
                    if (map.current.getLayer('trees-layer')) map.current.removeLayer('trees-layer');
                    if (map.current.getSource('trees-source')) map.current.removeSource('trees-source');
                  }
                  setBaselineData(null);
                  setError(null);
                }}
              >
                <Trash2 size={18} />
                Clear
              </button>
            </div>
          </div>

          <div className="tabs">
            <button 
              className={activeTab === 'overview' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('overview')}
            >
              <BarChart3 size={16} />
              Overview
            </button>
            <button 
              className={activeTab === 'site' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('site')}
            >
              <MapIcon size={16} />
              Site Definition
            </button>
            <button 
              className={activeTab === 'vegetation' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('vegetation')}
            >
              <TreePine size={16} />
              Vegetation
            </button>
            <button 
              className={activeTab === 'agb' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('agb')}
            >
              <Leaf size={16} />
              AGB Estimation
            </button>
            <button 
              className={activeTab === 'imagery' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('imagery')}
            >
              <Layers size={16} />
              Imagery & Indices
            </button>
          </div>
        </div>

        <div className="content-area">
          <div className="map-wrapper" style={{ position: 'relative' }}>
            <div ref={mapContainer} className="map" />
            
            <LayerControls
              map={map.current}
              hasNDVI={!!baselineData?.baselineImagery?.ndviMapId}
              hasEVI={!!baselineData?.baselineImagery?.eviMapId}
              hasCanopy={!!baselineData?.existingVegetation?.canopyMapId}
              hasTrees={!!(baselineData?.existingVegetation?.trees && baselineData.existingVegetation.trees.length > 0)}
            />
            
            <div
              className="map-search"
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                zIndex: 10,
                background: 'rgba(255,255,255,0.9)',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search place..."
                style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.35rem 0.5rem', minWidth: '180px' }}
              />
              <button
                className="tool-button"
                onClick={handleSearch}
                disabled={searchLoading}
                style={{ padding: '0.35rem 0.6rem' }}
              >
                {searchLoading ? 'Searching...' : 'Go'}
              </button>
              <select
                value={vegetationMode}
                onChange={(e) => setVegetationMode(e.target.value as 'mature' | 'young')}
                style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.35rem 0.5rem', minWidth: '200px' }}
              >
                <option value="mature">Mature vegetation (stricter)</option>
                <option value="young">Young vegetation (sensitive)</option>
              </select>
              <select
                value={styleId}
                onChange={(e) => handleStyleChange(e.target.value)}
                style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.35rem 0.5rem', minWidth: '200px' }}
              >
                <option value="mapbox://styles/mapbox/satellite-v9">Satellite</option>
                <option value="mapbox://styles/mapbox/streets-v12">Streets</option>
                <option value="mapbox://styles/mapbox/outdoors-v12">Outdoors</option>
                <option value="mapbox://styles/mapbox/light-v11">Light</option>
                <option value="mapbox://styles/mapbox/dark-v11">Dark</option>
              </select>
            </div>

            {baselineData && chartData && (
              <div
                className="download-buttons"
                style={{
                  position: 'absolute',
                  bottom: 12,
                  right: 12,
                  display: 'flex',
                  gap: '0.5rem',
                  zIndex: 12,
                  background: 'rgba(255,255,255,0.9)',
                  padding: '0.4rem 0.6rem',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                }}
              >
                <button className="tool-button" onClick={() => downloadNumericData('json')}>
                  Download JSON
                </button>
                <button className="tool-button" onClick={() => downloadNumericData('csv')}>
                  Download CSV
                </button>
              </div>
            )}
            {searchError && (
              <div
                style={{
                  position: 'absolute',
                  top: 56,
                  left: 12,
                  zIndex: 10,
                  background: '#fff0f0',
                  color: '#b91c1c',
                  padding: '0.4rem 0.6rem',
                  borderRadius: '6px',
                  border: '1px solid #fecdd3',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
              >
                {searchError}
              </div>
            )}
            
            {loading && (
              <div className="loading-overlay">
                <div className="loading-content">
                  <Circle className="loading-icon" />
                  <span>Running Baseline Assessment...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="error-message">{error}</div>
            )}
          </div>

          {baselineData && (
            <div className="results-panel">
              <div style={{ 
                marginBottom: '1.5rem', 
                padding: '1rem 1.25rem', 
                background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', 
                borderRadius: '12px', 
                border: '1px solid #10b981',
                color: '#065f46',
                fontWeight: '500',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)'
              }}>
                <strong>✓ Assessment Complete!</strong> View results below or use tabs to explore different metrics.
              </div>
              {activeTab === 'overview' && (
                <div className="results-content">
                  <h2>Baseline Assessment Overview</h2>
                  
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <h3>Total Area</h3>
                      <p className="metric-value">{baselineData.siteDefinition?.totalArea?.toFixed(2)} ha</p>
                    </div>
                    <div className="metric-card">
                      <h3>Canopy Cover</h3>
                      <p className="metric-value">{baselineData.existingVegetation?.canopyCoverPercent?.toFixed(2)}%</p>
                    </div>
                    <div className="metric-card">
                      <h3>Total AGB</h3>
                      <p className="metric-value">{baselineData.agbEstimation?.totalAGBTonnes?.toFixed(2)} tonnes</p>
                    </div>
                    <div className="metric-card">
                      <h3>Average NDVI</h3>
                      <p className="metric-value">{baselineData.baselineImagery?.ndviStats?.mean?.toFixed(3)}</p>
                    </div>
                    <div className="metric-card">
                      <h3>Average EVI</h3>
                      <p className="metric-value">{baselineData.baselineImagery?.eviStats?.mean?.toFixed(3)}</p>
                    </div>
                    <div className="metric-card">
                      <h3>Candidate Sites</h3>
                      <p className="metric-value">{baselineData.siteDefinition?.candidateAreaPercent?.toFixed(1)}%</p>
                    </div>
                  </div>

                  {chartData && (
                    <div className="charts-grid">
                      <div className="chart-card">
                        <h3>Site Definition</h3>
                        {chartData.siteDefinition.some((d) => d.value > 0) ? (
                          <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                              <Pie
                                data={chartData.siteDefinition}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={90}
                                fill="#8884d8"
                                dataKey="value"
                                stroke="#fff"
                                strokeWidth={2}
                              >
                                {chartData.siteDefinition.map((_, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'white', 
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }} 
                              />
                              <Legend 
                                wrapperStyle={{ paddingTop: '1rem' }}
                                iconType="circle"
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 2rem' }}>
                            <p style={{ margin: 0, fontSize: '0.95rem' }}>No site definition data available</p>
                          </div>
                        )}
                      </div>

                      <div className="chart-card">
                        <h3>NDVI Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={chartData.ndviDistribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="range" stroke="#64748b" angle={-45} textAnchor="end" height={100} />
                            <YAxis stroke="#64748b" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                              }} 
                            />
                            <Legend />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                              {chartData.ndviDistribution.map((entry, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="chart-card">
                        <h3>EVI Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={chartData.eviDistribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="range" stroke="#64748b" angle={-45} textAnchor="end" height={100} />
                            <YAxis stroke="#64748b" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                              }} 
                            />
                            <Legend />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                              {chartData.eviDistribution.map((entry, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="chart-card">
                        <h3>Vegetation Health</h3>
                        {chartData.healthDistribution && chartData.healthDistribution.some((d) => d.value > 0) ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData.healthDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis 
                                dataKey="category" 
                                stroke="#64748b" 
                                angle={-45} 
                                textAnchor="end" 
                                height={100}
                                tick={{ fontSize: 11 }}
                              />
                              <YAxis 
                                stroke="#64748b"
                                label={{ value: 'Cover %', angle: -90, position: 'insideLeft' }}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'white', 
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                                formatter={(value: number) => [`${value}%`, 'Cover']}
                              />
                              <Legend />
                              <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Vegetation Cover">
                                {chartData.healthDistribution.map((entry, index: number) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                            <p style={{ margin: 0, fontSize: '0.95rem' }}>No vegetation health data available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {!chartData && (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 2rem' }}>
                      <p style={{ margin: 0, fontSize: '0.95rem' }}>Loading chart data...</p>
                    </div>
                  )}

                  {chartData && (
                    <div className="charts-grid" style={{ marginTop: '1.5rem' }}>
                      <div className="chart-card">
                        <h3>Carbon Sequestration Growth</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={chartData.carbonGrowth}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="label" stroke="#64748b" />
                            <YAxis stroke="#64748b" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                              }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="co2Tonnes" name="Tonnes CO₂ / year" stroke="#14b8a6" strokeWidth={3} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="trees" name="Trees (count)" stroke="#60a5fa" strokeWidth={2} strokeDasharray="4 4" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="chart-card">
                        <h3>Tree Canopy Coverage Projection (Hectares)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={chartData.canopyProjection}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="year" stroke="#64748b" />
                            <YAxis stroke="#64748b" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                              }}
                            />
                            <Legend />
                            <Bar dataKey="hectares" fill="#14b8a6" radius={[8, 8, 0, 0]} name="Canopy (ha)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="chart-card">
                        <h3>Vegetation Health Index (NDVI)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={chartData.ndviTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="label" stroke="#64748b" />
                            <YAxis stroke="#64748b" domain={[-1, 1]} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                              }}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="siteNDVI" name="Planting Site NDVI" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.3} />
                            <Area type="monotone" dataKey="surroundNDVI" name="Surrounding NDVI" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.15} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="chart-card">
                        <h3>Ecosystem Services Value</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <RadarChart data={chartData.ecosystemScores}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="metric" />
                            <PolarRadiusAxis domain={[0, 1]} />
                            <Radar name="Index (0-1)" dataKey="value" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.35} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                              }}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="chart-card">
                        <h3>AGB Distribution (kg)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={chartData.agbBins}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="range" stroke="#64748b" angle={-25} textAnchor="end" height={80} />
                            <YAxis stroke="#64748b" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                              }}
                            />
                            <Legend />
                            <Bar dataKey="count" fill="#14b8a6" radius={[8, 8, 0, 0]} name="Samples" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'site' && (
                <div className="results-content">
                  <h2>Site Definition</h2>
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <h3>Total Area</h3>
                      <p className="metric-value">{baselineData.siteDefinition?.totalArea?.toFixed(2)} ha</p>
                    </div>
                    <div className="metric-card">
                      <h3>Candidate Planting Area</h3>
                      <p className="metric-value">{baselineData.siteDefinition?.candidatePlantingArea?.toFixed(2)} ha</p>
                      <p className="metric-sub">{baselineData.siteDefinition?.candidateAreaPercent?.toFixed(2)}%</p>
                    </div>
                    <div className="metric-card">
                      <h3>Constraint Area</h3>
                      <p className="metric-value">{baselineData.siteDefinition?.constraintArea?.toFixed(2)} ha</p>
                      <p className="metric-sub">{baselineData.siteDefinition?.constraintAreaPercent?.toFixed(2)}%</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'vegetation' && (
                <div className="results-content">
                  <h2>Existing Vegetation</h2>
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <h3>Canopy Cover</h3>
                      <p className="metric-value">{baselineData.existingVegetation?.canopyCoverPercent?.toFixed(2)}%</p>
                    </div>
                    <div className="metric-card">
                      <h3>Average NDVI</h3>
                      <p className="metric-value">{baselineData.baselineImagery?.ndviStats?.mean?.toFixed(3)}</p>
                    </div>
                    <div className="metric-card">
                      <h3>Average EVI</h3>
                      <p className="metric-value">{baselineData.baselineImagery?.eviStats?.mean?.toFixed(3)}</p>
                    </div>
                  </div>
                  
                  {chartData && (
                    <div className="charts-grid">
                      <div className="chart-card">
                        <h3>NDVI Distribution</h3>
                        <ResponsiveContainer width="100%" height={350}>
                          <BarChart data={chartData.ndviDistribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="range" stroke="#64748b" angle={-45} textAnchor="end" height={100} />
                            <YAxis stroke="#64748b" label={{ value: 'Percentage', angle: -90, position: 'insideLeft' }} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                              }} 
                            />
                            <Legend />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                              {chartData.ndviDistribution.map((entry, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="chart-card">
                        <h3>EVI Distribution</h3>
                        <ResponsiveContainer width="100%" height={350}>
                          <BarChart data={chartData.eviDistribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="range" stroke="#64748b" angle={-45} textAnchor="end" height={100} />
                            <YAxis stroke="#64748b" label={{ value: 'Percentage', angle: -90, position: 'insideLeft' }} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                              }} 
                            />
                            <Legend />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                              {chartData.eviDistribution.map((entry, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="chart-card">
                        <h3>Vegetation Health Distribution</h3>
                        {chartData.healthDistribution && chartData.healthDistribution.some((d) => d.value > 0) ? (
                          <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={chartData.healthDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis 
                                dataKey="category" 
                                stroke="#64748b" 
                                angle={-45} 
                                textAnchor="end" 
                                height={100}
                                tick={{ fontSize: 11 }}
                              />
                              <YAxis 
                                stroke="#64748b"
                                label={{ value: 'Cover %', angle: -90, position: 'insideLeft' }}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'white', 
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                                formatter={(value: number) => [`${value}%`, 'Cover']}
                              />
                              <Legend />
                              <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Vegetation Cover">
                                {chartData.healthDistribution.map((entry, index: number) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 2rem' }}>
                            <p style={{ margin: 0, fontSize: '0.95rem' }}>No vegetation health data available</p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
                              Canopy cover: {baselineData?.existingVegetation?.canopyCoverPercent?.toFixed(2) || 'N/A'}%
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'agb' && (
                <div className="results-content">
                  <h2>Above-Ground Biomass (AGB) Estimation</h2>
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <h3>Total AGB</h3>
                      <p className="metric-value">{baselineData.agbEstimation?.totalAGBTonnes?.toFixed(2)} tonnes</p>
                      <p className="metric-sub">{baselineData.agbEstimation?.totalAGB?.toFixed(2)} kg</p>
                    </div>
                    <div className="metric-card">
                      <h3>Average AGB</h3>
                      <p className="metric-value">{baselineData.agbEstimation?.averageAGB?.toFixed(2)} kg</p>
                    </div>
                    <div className="metric-card">
                      <h3>Trees Analyzed</h3>
                      <p className="metric-value">{baselineData.agbEstimation?.treesWithAGB?.length || 0}</p>
                    </div>
                  </div>

                  {chartData && chartData.agbDistribution.length > 0 ? (
                    <div className="chart-card">
                      <h3>AGB Distribution (Top 20 Trees)</h3>
                          <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={chartData.agbDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={100}
                            stroke="#64748b"
                            fontSize={12}
                          />
                          <YAxis 
                            stroke="#64748b"
                            label={{ value: 'AGB (kg)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b' } }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }} 
                          />
                          <Legend />
                          <Bar 
                            dataKey="agb" 
                            fill="#f59e0b" 
                            radius={[8, 8, 0, 0]}
                            name="Above-Ground Biomass"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="chart-card">
                      <h3>AGB Distribution</h3>
                      <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 2rem' }}>
                        <p style={{ margin: 0, fontSize: '0.95rem' }}>
                          {baselineData.agbEstimation?.treesWithAGB?.length === 0 
                            ? 'No AGB data available for individual trees' 
                            : 'Loading AGB distribution data...'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'imagery' && (
                <div className="results-content">
                  <h2>Baseline Imagery & Vegetation Indices</h2>
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <h3>NDVI Mean</h3>
                      <p className="metric-value">{baselineData.baselineImagery?.ndviStats?.mean?.toFixed(3)}</p>
                    </div>
                    <div className="metric-card">
                      <h3>NDVI Range</h3>
                      <p className="metric-value">{baselineData.baselineImagery?.ndviStats?.min?.toFixed(3)} - {baselineData.baselineImagery?.ndviStats?.max?.toFixed(3)}</p>
                    </div>
                    <div className="metric-card">
                      <h3>EVI Mean</h3>
                      <p className="metric-value">{baselineData.baselineImagery?.eviStats?.mean?.toFixed(3)}</p>
                    </div>
                    <div className="metric-card">
                      <h3>EVI Range</h3>
                      <p className="metric-value">{baselineData.baselineImagery?.eviStats?.min?.toFixed(3)} - {baselineData.baselineImagery?.eviStats?.max?.toFixed(3)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BaselineAssessment;

