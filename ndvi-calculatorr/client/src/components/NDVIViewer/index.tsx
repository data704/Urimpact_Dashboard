import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Circle, Map as MapIcon, Layers, Trash2, HelpCircle } from 'lucide-react';
import './styles.css';

interface DrawEvent {
 features: Array<{
   geometry: {
     coordinates: number[][][];
   };
 }>;
 type: string;
}

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

const NDVIViewer: React.FC = () => {
 const mapContainer = useRef<HTMLDivElement>(null);
 const map = useRef<mapboxgl.Map | null>(null);
 const draw = useRef<MapboxDraw | null>(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [showHelp, setShowHelp] = useState(false);

 useEffect(() => {
   if (!mapContainer.current || map.current) return;

  map.current = new mapboxgl.Map({
    container: mapContainer.current,
    style: 'mapbox://styles/mapbox/satellite-v9',
    center: [57.5, 23.5], // Wadi Al Batha, Oman
    zoom: 13
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

   map.current.on('draw.create', async (e: DrawEvent) => {
    try {
      setLoading(true);
      setError(null);
  
      const coordinates = e.features[0].geometry.coordinates[0];
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE}/calculate-ndvi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinates })
      });
  
      if (!response.ok) throw new Error('Failed to calculate NDVI');
  
      const mapId = await response.json();
      
      if (map.current) {
        if (map.current.getLayer('ndvi-layer')) map.current.removeLayer('ndvi-layer');
        if (map.current.getSource('ndvi-source')) map.current.removeSource('ndvi-source');
  
      
map.current.addSource('ndvi-source', {
  type: 'raster',
  tiles: [`${mapId.urlFormat}?access_token=${mapId.mapid}`],
  tileSize: 256
});
  
        map.current.addLayer({
          id: 'ndvi-layer',
          type: 'raster',
          source: 'ndvi-source',
          paint: { 'raster-opacity': 0.7 }
        });
  
        addLegend();
      }
    } catch (err) {
      console.error('Draw completion error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  });

   map.current.on('style.load', () => {
     const images = document.querySelectorAll('img[src*="earthengine.googleapis.com"]');
     images.forEach((element) => {
       const img = element as HTMLImageElement;
       if (img.crossOrigin !== 'anonymous') {
         img.crossOrigin = 'anonymous';
       }
     });
   });

   return () => {
     if (map.current) {
       map.current.remove();
       map.current = null;
     }
   };
 }, []);

 const addLegend = () => {
   if (!mapContainer.current) return;

   const existingLegend = document.querySelector('.map-legend');
   if (existingLegend) {
     existingLegend.remove();
   }

   const legend = document.createElement('div');
   legend.className = 'map-legend';
   legend.innerHTML = `
     <h4>NDVI Values</h4>
     <div class="legend-items">
       <div class="legend-item">
         <div class="legend-color" style="background: #00FF00;"></div>
         <span>High Vegetation (0.6 to 1.0)</span>
       </div>
       <div class="legend-item">
         <div class="legend-color" style="background: #FFFF00;"></div>
         <span>Moderate (0.2 to 0.6)</span>
       </div>
       <div class="legend-item">
         <div class="legend-color" style="background: #FF0000;"></div>
         <span>Low/None (-1.0 to 0.2)</span>
       </div>
     </div>
   `;

   mapContainer.current.appendChild(legend);
 };

 const handleClear = () => {
   if (draw.current) {
     draw.current.deleteAll();
   }
   const existingLegend = document.querySelector('.map-legend');
   if (existingLegend) {
     existingLegend.remove();
   }
   if (map.current?.getLayer('ndvi-layer')) {
     map.current.removeLayer('ndvi-layer');
   }
   if (map.current?.getSource('ndvi-source')) {
     map.current.removeSource('ndvi-source');
   }
 };

 return (
   <div className="app-container">
     <nav className="top-nav">
       <div className="nav-left">
         <MapIcon className="nav-icon" />
         <h1>NDVI Analysis Tool</h1>
       </div>
       <div className="nav-right">
         <button 
           className="help-button"
           onClick={() => setShowHelp(!showHelp)}
         >
           <HelpCircle size={20} />
           Help
         </button>
       </div>
     </nav>

     <div className="main-content">
       <div className="tools-panel">
         <div className="tools-section">
           <h3>Analysis Tools</h3>
           <div className="tools-buttons">
             <button 
               className="tool-button"
               onClick={() => draw.current?.changeMode('draw_polygon')}
             >
               <Layers size={18} />
               Draw Area
             </button>
             <button 
               className="tool-button"
               onClick={handleClear}
             >
               <Trash2 size={18} />
               Clear
             </button>
           </div>
         </div>

         <div className="tools-section">
           <h3>Instructions</h3>
           <ol className="instructions-list">
             <li>Click <span className="highlight">Draw Area</span> button</li>
             <li>Click on the map to create polygon points</li>
             <li>Double-click to complete the area selection</li>
             <li>Wait for NDVI calculation to complete</li>
           </ol>
         </div>
       </div>

       <div className="map-wrapper">
         <div ref={mapContainer} className="map" />
         
         {loading && (
           <div className="loading-overlay">
             <div className="loading-content">
               <Circle className="loading-icon" />
               <span>Calculating NDVI...</span>
             </div>
           </div>
         )}

         {error && (
           <div className="error-message">{error}</div>
         )}
       </div>
     </div>

     {showHelp && (
       <div className="help-modal">
         <div className="help-content">
           <h2>How to Use NDVI Analysis Tool</h2>
           <div className="help-section">
             <h3>About NDVI</h3>
             <p>The Normalized Difference Vegetation Index (NDVI) is a measure used to determine the density of green vegetation in an area.</p>
           </div>
           <button 
             className="close-help"
             onClick={() => setShowHelp(false)}
           >
             Close
           </button>
         </div>
       </div>
     )}
   </div>
 );
};

export default NDVIViewer;