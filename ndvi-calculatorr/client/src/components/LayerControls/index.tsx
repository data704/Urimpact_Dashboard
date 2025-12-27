import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Layers } from 'lucide-react';
import './styles.css';

interface LayerControlsProps {
  map: mapboxgl.Map | null;
  hasNDVI: boolean;
  hasEVI: boolean;
  hasCanopy: boolean;
  hasTrees: boolean;
}

const LayerControls: React.FC<LayerControlsProps> = ({ 
  map, 
  hasNDVI, 
  hasEVI, 
  hasCanopy, 
  hasTrees
}) => {
  const [layers, setLayers] = useState({
    ndvi: true,  // NDVI visible by default
    evi: false,  // EVI hidden by default
    canopy: false, // Canopy hidden by default
    trees: true   // Trees visible by default
  });

  useEffect(() => {
    if (!map) return;

    const updateLayerVisibility = (layerId: string, visible: boolean) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    };

    updateLayerVisibility('ndvi-layer', layers.ndvi);
    updateLayerVisibility('evi-layer', layers.evi);
    updateLayerVisibility('canopy-layer', layers.canopy);
    updateLayerVisibility('trees-layer', layers.trees);
  }, [map, layers]);

  const toggleLayer = (layerName: keyof typeof layers) => {
    setLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  };

  if (!hasNDVI && !hasEVI && !hasCanopy && !hasTrees) {
    return null;
  }

  return (
    <div className="layer-controls">
      <div className="layer-controls-header">
        <Layers size={18} />
        <span>Map Layers</span>
      </div>
      <div className="layer-controls-list">
        {hasNDVI && (
          <div 
            className={`layer-control-item ${layers.ndvi ? 'active' : ''}`}
            onClick={() => toggleLayer('ndvi')}
          >
            {layers.ndvi ? <Eye size={16} /> : <EyeOff size={16} />}
            <span>NDVI</span>
          </div>
        )}
        {hasEVI && (
          <div 
            className={`layer-control-item ${layers.evi ? 'active' : ''}`}
            onClick={() => toggleLayer('evi')}
          >
            {layers.evi ? <Eye size={16} /> : <EyeOff size={16} />}
            <span>EVI</span>
          </div>
        )}
        {hasCanopy && (
          <div 
            className={`layer-control-item ${layers.canopy ? 'active' : ''}`}
            onClick={() => toggleLayer('canopy')}
          >
            {layers.canopy ? <Eye size={16} /> : <EyeOff size={16} />}
            <span>Canopy Cover</span>
          </div>
        )}
        {hasTrees && (
          <div 
            className={`layer-control-item ${layers.trees ? 'active' : ''}`}
            onClick={() => toggleLayer('trees')}
          >
            {layers.trees ? <Eye size={16} /> : <EyeOff size={16} />}
            <span>Tree Points</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LayerControls;

