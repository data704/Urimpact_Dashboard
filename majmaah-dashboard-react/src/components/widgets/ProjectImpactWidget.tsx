import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import mapboxgl from 'mapbox-gl';
import { WidgetCard } from './WidgetCard';
import { mockMajmaahTrees } from '@/services/mockData';
import apiService from '@/services/api';
import { config } from '@/config';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

interface MajmaahTree {
  id: string;
  tree_id: string;
  species: string;
  coordinates: [number, number];
  health: string;
  health_condition: string;
}

export const ProjectImpactWidget: React.FC = () => {
  const { t } = useTranslation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [trees, setTrees] = useState<MajmaahTree[]>(mockMajmaahTrees);
  const [dataLoading, setDataLoading] = useState(true);
  const [useRealData, setUseRealData] = useState(false);

  // Helper function to calculate bounds from coordinates
  const calculateBounds = (coords: number[][]): mapboxgl.LngLatBounds | null => {
    if (!coords || coords.length === 0) return null;
    
    const bounds = new mapboxgl.LngLatBounds();
    coords.forEach(coord => {
      if (Array.isArray(coord[0])) {
        // Polygon coordinates
        coord.forEach(point => {
          const pointCoords = point as [number, number];
          bounds.extend(pointCoords);
        });
      } else {
        // Single point
        const pointCoords = coord as [number, number];
        bounds.extend(pointCoords);
      }
    });
    
    return bounds;
  };

  // Helper function to calculate center from coordinates
  const calculateCenter = (coords: number[][]): [number, number] => {
    if (!coords || coords.length === 0) return config.mapbox.defaultCenter;
    
    let sumLng = 0;
    let sumLat = 0;
    let count = 0;
    
    coords.forEach(coord => {
      if (Array.isArray(coord[0])) {
        // Polygon coordinates
        coord.forEach(point => {
          const pointCoords = point as [number, number];
          sumLng += pointCoords[0];
          sumLat += pointCoords[1];
          count++;
        });
      } else {
        // Single point
        const pointCoords = coord as [number, number];
        sumLng += pointCoords[0];
        sumLat += pointCoords[1];
        count++;
      }
    });
    
    return count > 0 
      ? [sumLng / count, sumLat / count] as [number, number]
      : config.mapbox.defaultCenter;
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: config.mapbox.defaultCenter,
      zoom: config.mapbox.defaultZoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    map.current.on('load', () => {

      const addTreeLayers = (treeData: MajmaahTree[]) => {
        if (!map.current) return;

        const geojson: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: treeData.map(tree => ({
            type: 'Feature',
            properties: {
              id: tree.id,
              species: tree.species,
              health: tree.health,
            },
            geometry: {
              type: 'Point',
              coordinates: tree.coordinates,
            },
          })),
        };

        if (map.current.getSource('trees')) {
          (map.current.getSource('trees') as mapboxgl.GeoJSONSource).setData(geojson);
        } else {
          map.current.addSource('trees', {
            type: 'geojson',
            data: geojson,
            cluster: true,
            clusterMaxZoom: config.mapbox.clusterMaxZoom,
            clusterRadius: config.mapbox.clusterRadius,
          });

          // Cluster circles
          map.current.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'trees',
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': ['step', ['get', 'point_count'], '#10b981', 10, '#22c55e', 25, '#3b82f6', 50, '#2563eb'],
              'circle-radius': ['step', ['get', 'point_count'], 18, 10, 22, 25, 26, 50, 32],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff',
            },
          });

          // Cluster count
          map.current.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'trees',
            filter: ['has', 'point_count'],
            layout: {
              'text-field': '{point_count_abbreviated}',
              'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
              'text-size': 12,
            },
            paint: {
              'text-color': '#ffffff',
            },
          });

          // Unclustered points
          map.current.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'trees',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': '#10b981',
              'circle-radius': 8,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff',
            },
          });

          // Click handlers
          map.current.on('click', 'unclustered-point', (e) => {
            if (!e.features || e.features.length === 0) return;
            const feature = e.features[0];
            const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
            const props = feature.properties || {};

            new mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(`
                <div style="padding: 10px;">
                  <strong style="color: #13c5bc;">${t('dashboard.mapWidget.treeInformation')}</strong><br><br>
                  <strong>${t('dashboard.mapWidget.id')}:</strong> ${props.id || 'N/A'}<br>
                  <strong>${t('dashboard.mapWidget.species')}:</strong> ${props.species || 'Unknown'}<br>
                  <strong>${t('dashboard.mapWidget.health')}:</strong> ${props.health || 'Unknown'}
                </div>
              `)
              .addTo(map.current!);
          });

          // Cursor
          map.current.on('mouseenter', 'clusters', () => {
            map.current!.getCanvas().style.cursor = 'pointer';
          });
          map.current.on('mouseleave', 'clusters', () => {
            map.current!.getCanvas().style.cursor = '';
          });
        }
      };

      const fetchAnalysisAndTrees = async () => {
        try {
          setDataLoading(true);
          
          // Fetch latest analysis to get coordinates
          const analysisResponse = await apiService.getLatestAnalysis(config.app.projectId);
          let coords: number[][] | null = null;
          
          if (analysisResponse.success && analysisResponse.data?.coordinates) {
            try {
              coords = typeof analysisResponse.data.coordinates === 'string'
                ? JSON.parse(analysisResponse.data.coordinates)
                : analysisResponse.data.coordinates;
              setAnalysisCoordinates(coords);
            } catch (e) {
              console.warn('Failed to parse analysis coordinates:', e);
            }
          }
          
          // Fetch trees
          const treesResponse = await apiService.getTreesForMap(config.app.projectId);

          if (treesResponse.success && Array.isArray(treesResponse.data) && treesResponse.data.length > 0) {
            const realTrees = treesResponse.data as MajmaahTree[];
            setTrees(realTrees);
            setUseRealData(true);
            addTreeLayers(realTrees);
            
            // Wait for map to be ready, then zoom to analysis area or tree bounds
            if (map.current) {
              const zoomToArea = () => {
                if (coords && coords.length > 0) {
                  // Use analysis coordinates to set bounds
                  const bounds = calculateBounds(coords);
                  if (bounds) {
                    map.current!.fitBounds(bounds, {
                      padding: { top: 50, bottom: 50, left: 50, right: 50 },
                      maxZoom: 15
                    });
                  } else {
                    // Fallback to center on coordinates
                    const center = calculateCenter(coords);
                    map.current!.setCenter(center);
                    map.current!.setZoom(13);
                  }
                } else if (realTrees.length > 0) {
                  // Calculate bounds from tree coordinates
                  const treeBounds = new mapboxgl.LngLatBounds();
                  realTrees.forEach(tree => {
                    treeBounds.extend(tree.coordinates);
                  });
                  map.current!.fitBounds(treeBounds, {
                    padding: { top: 50, bottom: 50, left: 50, right: 50 },
                    maxZoom: 15
                  });
                }
              };
              
              // If map is already loaded, zoom immediately
              if (map.current.loaded()) {
                zoomToArea();
              } else {
                // Wait for map to load
                map.current.once('load', zoomToArea);
              }
            }
            
            console.log('✅ Using real GEE tree data for map');
          } else {
            setTrees(mockMajmaahTrees);
            setUseRealData(false);
            addTreeLayers(mockMajmaahTrees);
            console.warn('⚠️  Falling back to mock trees for map (no data returned)');
          }
        } catch (error) {
          console.warn('⚠️  Using mock trees for map (backend not available)', error);
          setTrees(mockMajmaahTrees);
          setUseRealData(false);
          addTreeLayers(mockMajmaahTrees);
        } finally {
          setDataLoading(false);
        }
      };

      fetchAnalysisAndTrees();
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <WidgetCard fullWidth title={t('dashboard.mapWidget.title')}>
      <div className="relative" style={{ height: '600px' }}>
        <div ref={mapContainer} className="w-full h-full rounded-xl" />
        
        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 z-10">
          <div className="font-semibold text-sm text-gray-900 mb-2">
            URIMPACT - Majmaah University
          </div>
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-gray-700">
                {t('dashboard.mapWidget.totalTrees')}:{' '}
                <strong className="text-green-600">
                  {trees.length.toLocaleString()}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium
                border
                {useRealData ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : 'border-gray-300 text-gray-600 bg-gray-50'}">
                {useRealData ? t('dashboard.mapWidget.liveGeeData') : t('dashboard.mapWidget.demoData')}
              </span>
              {dataLoading && (
                <span className="text-[10px] text-gray-400">{t('dashboard.mapWidget.updating')}</span>
              )}
            </div>
            <div className="text-gray-600">{t('dashboard.mapWidget.treesClustered')}</div>
            <div className="text-xs text-gray-500 mt-2">{t('dashboard.mapWidget.clickToZoom')}</div>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
};

