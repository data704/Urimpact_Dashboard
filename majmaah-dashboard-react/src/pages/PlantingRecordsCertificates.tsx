import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import mapboxgl from 'mapbox-gl';
import apiService from '@/services/api';
import { config } from '@/config';
import MapStyleSwitcher, { MAP_STYLES } from '@/components/widgets/MapStyleSwitcher';
import { Download, Search, ChevronDown } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

interface Analysis {
  id: number;
  analysisId: number;
  displayName: string;
  analysisDate: string;
  treeCount?: number;
  carbonTonnes?: number;
  coordinates?: number[][];
}

interface MajmaahTree {
  id: string;
  tree_id: string;
  species: string;
  coordinates: [number, number];
  health: string;
  health_condition: string;
  analysisId?: number;
}

const PlantingRecordsCertificates: React.FC = () => {
  const { t } = useTranslation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [allTrees, setAllTrees] = useState<MajmaahTree[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [mapStyle, setMapStyle] = useState<string>(MAP_STYLES.satellite);
  const [currentMapStyle, setCurrentMapStyle] = useState<string>(MAP_STYLES.satellite);
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate total trees
  const totalTrees = analyses.reduce((sum, a) => sum + (a.treeCount || 0), 0);

  // Fetch user's assigned analyses
  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        setDataLoading(true);
        const response = await apiService.getMyAnalyses();
        if (response.success && Array.isArray(response.data)) {
          setAnalyses(response.data);
        }
      } catch (error) {
        console.error('Error fetching analyses:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchAnalyses();
  }, []);

  // Fetch trees for all analyses
  useEffect(() => {
    const fetchAllTrees = async () => {
      if (analyses.length === 0) return;

      try {
        console.log(`📊 Fetching trees for ${analyses.length} analyses...`);
        const treesPromises = analyses.map(analysis => 
          apiService.getTreesForMap(config.app.projectId, analysis.analysisId)
        );
        
        const responses = await Promise.all(treesPromises);
        const allTreesData: MajmaahTree[] = [];
        
        responses.forEach((response, index) => {
          if (response.success && Array.isArray(response.data)) {
            const trees = response.data.map((tree: any) => ({
              ...tree,
              analysisId: analyses[index].analysisId,
            }));
            allTreesData.push(...trees);
            console.log(`✅ Fetched ${trees.length} trees for analysis ${analyses[index].displayName} (ID: ${analyses[index].analysisId})`);
          } else {
            console.warn(`⚠️ No trees found for analysis ${analyses[index].displayName} (ID: ${analyses[index].analysisId})`);
          }
        });

        console.log(`🌳 Total trees fetched: ${allTreesData.length}`);
        setAllTrees(allTreesData);
      } catch (error) {
        console.error('Error fetching trees:', error);
      }
    };

    fetchAllTrees();
  }, [analyses]);

  // Function to add all areas and trees to map
  const addAllAreasAndTrees = useCallback(async () => {
    if (!map.current) {
      console.log('⚠️ Map instance not available');
      return;
    }

    if (!map.current.loaded()) {
      console.log('⚠️ Map not loaded yet, waiting...');
      map.current.once('load', () => {
        addAllAreasAndTrees();
      });
      return;
    }

    // Check if style is loaded - Mapbox removes all layers when style changes
    // So we need to ensure style is fully loaded before adding our custom layers
    try {
      // Try to get the style - if it fails, style isn't ready
      const style = map.current.getStyle();
      if (!style) {
        console.log('⚠️ Map style not available, waiting...');
        map.current.once('style.load', () => {
          setTimeout(() => addAllAreasAndTrees(), 300);
        });
        return;
      }
    } catch (e: any) {
      // Style might not be accessible yet - this happens during style transitions
      if (e && e.message && e.message.includes('not done loading')) {
        console.log('⚠️ Map style still loading, waiting...');
        map.current.once('style.load', () => {
          setTimeout(() => addAllAreasAndTrees(), 300);
        });
        return;
      }
      // Other error, proceed anyway
      console.log('⚠️ Style check error, proceeding:', e);
    }

    try {
      console.log(`🗺️ Adding areas and trees to map. Current trees count: ${allTrees.length}, analyses count: ${analyses.length}`);
      
      if (analyses.length === 0 && allTrees.length === 0) {
        console.log('⚠️ No data available yet');
        return;
      }

      // Fetch coordinates for each analysis
      const coordinatesPromises = analyses.map(analysis =>
        apiService.getAnalysisById(analysis.analysisId)
      );

      const coordinateResponses = await Promise.all(coordinatesPromises);
      const areasWithCoordinates = analyses.map((analysis, index) => {
        const coordResponse = coordinateResponses[index];
        return {
          ...analysis,
          coordinates: coordResponse?.success && coordResponse?.data?.coordinates
            ? coordResponse.data.coordinates
            : null,
        };
      }).filter(area => area.coordinates);

      // Remove existing sources and layers if they exist
      try {
        if (map.current.getSource('areas')) {
          if (map.current.getLayer('areas-fill')) map.current.removeLayer('areas-fill');
          if (map.current.getLayer('areas-border')) map.current.removeLayer('areas-border');
          map.current.removeSource('areas');
        }
      } catch (e) {
        // Source doesn't exist, ignore
      }

      try {
        if (map.current.getSource('trees-clusters')) {
          if (map.current.getLayer('clusters')) map.current.removeLayer('clusters');
          if (map.current.getLayer('cluster-count')) map.current.removeLayer('cluster-count');
          if (map.current.getLayer('unclustered-point')) map.current.removeLayer('unclustered-point');
          map.current.removeSource('trees-clusters');
        }
      } catch (e) {
        // Source doesn't exist, ignore
      }

      // Remove existing event listeners to avoid duplicates
      map.current.off('click', 'clusters');
      map.current.off('click', 'unclustered-point');
      map.current.off('mouseenter', 'clusters');
      map.current.off('mouseleave', 'clusters');
      map.current.off('mouseenter', 'unclustered-point');
      map.current.off('mouseleave', 'unclustered-point');

      // Add area polygons
      if (areasWithCoordinates.length > 0) {
        const areasGeoJSON = {
          type: 'FeatureCollection',
          features: areasWithCoordinates.map(area => ({
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: Array.isArray(area.coordinates) && area.coordinates[0] ? [area.coordinates] : area.coordinates,
            },
            properties: {
              id: area.id,
              name: area.displayName,
              analysisId: area.analysisId,
            },
          })),
        };

        map.current.addSource('areas', {
          type: 'geojson',
          data: areasGeoJSON as any,
        });

        map.current.addLayer({
          id: 'areas-fill',
          type: 'fill',
          source: 'areas',
          paint: {
            'fill-color': '#ff0000',
            'fill-opacity': 0.1,
          },
        });

        map.current.addLayer({
          id: 'areas-border',
          type: 'line',
          source: 'areas',
          paint: {
            'line-color': '#ff0000',
            'line-width': 2,
          },
        });
      }

      // Add tree markers
      if (allTrees.length > 0) {
        console.log(`🌳 Adding ${allTrees.length} trees to map`);
        const treesGeoJSON = {
          type: 'FeatureCollection',
          features: allTrees.map(tree => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: tree.coordinates,
            },
            properties: {
              id: tree.id,
              tree_id: tree.tree_id,
              species: tree.species,
              health: tree.health,
              health_condition: tree.health_condition,
            },
          })),
        };

        console.log('📍 Trees GeoJSON:', treesGeoJSON);

        map.current.addSource('trees-clusters', {
          type: 'geojson',
          data: treesGeoJSON as any,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });

        console.log('✅ Trees source added');

        map.current.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'trees-clusters',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#10b981',
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              20,
              100,
              30,
              750,
              40,
            ],
          },
        });

        map.current.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'trees-clusters',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 12,
          },
          paint: {
            'text-color': '#fff',
          },
        });

        map.current.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'trees-clusters',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': '#10b981',
            'circle-radius': 6,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
        });

        console.log('✅ Tree layers added successfully');

        // Add click handlers
        map.current.on('click', 'clusters', (e) => {
          const features = map.current!.queryRenderedFeatures(e.point, {
            layers: ['clusters'],
          });
          const clusterId = features[0].properties!.cluster_id;
          (map.current!.getSource('trees-clusters') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
            clusterId,
            (err, zoom) => {
              if (err) return;
              map.current!.easeTo({
                center: (features[0].geometry as any).coordinates,
                zoom: zoom,
              });
            }
          );
        });

        map.current.on('click', 'unclustered-point', (e) => {
          const coordinates = (e.features![0].geometry as any).coordinates.slice();
          const props = e.features![0].properties!;
          
          new mapboxgl.Popup()
            .setLngLat(coordinates as [number, number])
            .setHTML(`
              <div class="p-2">
                <h3 class="font-semibold">Tree Information</h3>
                <p><strong>ID:</strong> ${props.tree_id || props.id}</p>
                <p><strong>Species:</strong> ${props.species || 'Unknown'}</p>
                <p><strong>Health:</strong> ${props.health_condition || props.health || 'Unknown'}</p>
              </div>
            `)
            .addTo(map.current!);
        });

        map.current.on('mouseenter', 'clusters', () => {
          map.current!.getCanvas().style.cursor = 'pointer';
        });
        map.current.on('mouseleave', 'clusters', () => {
          map.current!.getCanvas().style.cursor = '';
        });
        map.current.on('mouseenter', 'unclustered-point', () => {
          map.current!.getCanvas().style.cursor = 'pointer';
        });
        map.current.on('mouseleave', 'unclustered-point', () => {
          map.current!.getCanvas().style.cursor = '';
        });
      }

      // Fit map to show all areas and trees
      if (areasWithCoordinates.length > 0 || allTrees.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        
        areasWithCoordinates.forEach(area => {
          if (area.coordinates && Array.isArray(area.coordinates)) {
            area.coordinates.forEach((coord: any) => {
              if (Array.isArray(coord)) {
                coord.forEach((c: any) => {
                  if (Array.isArray(c) && c.length >= 2) {
                    bounds.extend([c[0], c[1]]);
                  }
                });
              }
            });
          }
        });

        allTrees.forEach(tree => {
          bounds.extend(tree.coordinates);
        });

        if (!bounds.isEmpty()) {
          map.current.fitBounds(bounds, {
            padding: 50,
            maxZoom: 15,
          });
        }
      }
      console.log('✅ All layers added successfully');
    } catch (error) {
      console.error('❌ Error adding areas and trees to map:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
    }
  }, [allTrees, analyses]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [44.0, 25.9],
      zoom: 12,
    });

    map.current.on('load', () => {
      console.log('🗺️ Map loaded');
      setCurrentMapStyle(mapStyle);
      if (analyses.length > 0 || allTrees.length > 0) {
        setTimeout(() => {
          addAllAreasAndTrees();
        }, 500);
      }
    });
  }, []);

  // Update map when data changes (but not when style changes)
  useEffect(() => {
    if (!map.current) return;
    
    // Wait for map to load
    if (!map.current.loaded()) {
      map.current.once('load', () => {
        if (currentMapStyle === mapStyle && (analyses.length > 0 || allTrees.length > 0)) {
          addAllAreasAndTrees();
        }
      });
      return;
    }

    // Don't update during style change
    if (currentMapStyle !== mapStyle) return;
    
    // Only re-add layers when data changes
    if (analyses.length > 0 || allTrees.length > 0) {
      console.log('🔄 Data changed, re-adding layers');
      addAllAreasAndTrees();
    }
  }, [allTrees, analyses, addAllAreasAndTrees, currentMapStyle, mapStyle]);

  // Handle map style changes separately
  useEffect(() => {
    if (!map.current || !map.current.loaded()) return;
    
    // Only change style if it's actually different
    if (currentMapStyle === mapStyle) {
      return;
    }

    console.log(`🔄 Changing map style from ${currentMapStyle.includes('satellite') ? 'satellite' : 'street'} to ${mapStyle.includes('satellite') ? 'satellite' : 'street'}`);

    const styleChangeHandler = () => {
      console.log('✅ New style loaded, re-adding layers');
      setCurrentMapStyle(mapStyle);
      // Re-add layers after style loads - wait a bit longer for style to fully initialize
      setTimeout(() => {
        if (map.current?.loaded()) {
          console.log(`🔄 Re-adding layers: ${analyses.length} analyses, ${allTrees.length} trees`);
          addAllAreasAndTrees();
        }
      }, 500);
    };

    // Change the map style
    try {
      map.current.setStyle(mapStyle);
      // Remove the old style.load listener to avoid duplicates
      map.current.off('style.load', styleChangeHandler);
      map.current.once('style.load', styleChangeHandler);
    } catch (error) {
      console.error('Error changing map style:', error);
    }
  }, [mapStyle, currentMapStyle, analyses, allTrees, addAllAreasAndTrees]);

  const handleStyleChange = (newStyle: string) => {
    setMapStyle(newStyle);
  };

  const filteredAnalyses = analyses.filter(analysis =>
    analysis.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = analyses.map((analysis, index) => ({
        'S.No': index + 1,
        'Planting Site Name': analysis.displayName,
        'Trees Count': analysis.treeCount || 0,
        'Analysis Date': analysis.analysisDate ? new Date(analysis.analysisDate).toLocaleDateString() : 'N/A',
      }));

      // Add summary row
      excelData.push({
        'S.No': '',
        'Planting Site Name': 'TOTAL',
        'Trees Count': totalTrees,
        'Analysis Date': '',
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Planting Records');

      // Set column widths
      ws['!cols'] = [
        { wch: 8 },  // S.No
        { wch: 30 }, // Planting Site Name
        { wch: 15 }, // Trees Count
        { wch: 15 }, // Analysis Date
      ];

      // Generate filename with current date
      const fileName = `Planting_Records_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Write file
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export Excel file. Please try again.');
    }
  };

  const handleExportPDF = async () => {
    try {
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Planting Records Report</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                color: #333;
              }
              h1 {
                color: #13c5bc;
                margin-bottom: 10px;
              }
              .header {
                margin-bottom: 30px;
                border-bottom: 2px solid #13c5bc;
                padding-bottom: 10px;
              }
              .date {
                color: #666;
                font-size: 12px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
              }
              th {
                background-color: #13c5bc;
                color: white;
                font-weight: bold;
              }
              tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              .total-row {
                font-weight: bold;
                background-color: #e8f5e9 !important;
              }
              .footer {
                margin-top: 30px;
                padding-top: 10px;
                border-top: 1px solid #ddd;
                font-size: 12px;
                color: #666;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Planting Records Report</h1>
              <div class="date">Generated on: ${new Date().toLocaleString()}</div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Planting Site Name</th>
                  <th>Trees Count</th>
                  <th>Analysis Date</th>
                </tr>
              </thead>
              <tbody>
                ${analyses.map((analysis, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${analysis.displayName}</td>
                    <td>${(analysis.treeCount || 0).toLocaleString()}</td>
                    <td>${analysis.analysisDate ? new Date(analysis.analysisDate).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td></td>
                  <td><strong>TOTAL</strong></td>
                  <td><strong>${totalTrees.toLocaleString()}</strong></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            
            <div class="footer">
              <p>Verified by URIMPACT</p>
            </div>
          </body>
        </html>
      `;

      // Create a temporary container
      const element = document.createElement('div');
      element.innerHTML = htmlContent;
      document.body.appendChild(element);

      // Configure PDF options
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Planting_Records_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      // Generate PDF
      await html2pdf().set(opt).from(element).save();

      // Cleanup
      document.body.removeChild(element);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export PDF file. Please try again.');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('sidebar.plantingRecordsCertificates')}</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Download size={18} />
            Export List Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Download size={18} />
            Export List PDF
          </button>
        </div>
      </div>

      {/* Stats Card and Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Total Trees Planted Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Trees Planted</h3>
          <p className="text-4xl font-bold text-[#13c5bc]">{totalTrees.toLocaleString()}</p>
          <p className="text-sm text-green-600 mt-2">Verified by UrImpact</p>
        </div>

        {/* Map */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="relative" style={{ height: '500px' }}>
            <div ref={mapContainer} className="w-full h-full" />
            <MapStyleSwitcher
              currentStyle={mapStyle}
              onStyleChange={handleStyleChange}
              position="bottom-left"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-end">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13c5bc] focus:border-transparent"
            />
          </div>
        </div>

        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                Trees Count
                <ChevronDown className="inline ml-1 w-4 h-4" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Planting site name
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAnalyses.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-12 text-center text-gray-500">
                  No planting records found
                </td>
              </tr>
            ) : (
              filteredAnalyses.map((analysis) => (
                <tr key={analysis.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {analysis.treeCount?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {analysis.displayName}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlantingRecordsCertificates;
