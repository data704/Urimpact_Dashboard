import React from 'react';

// Mapbox style URLs
export const MAP_STYLES = {
  street: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
};

interface MapStyleSwitcherProps {
  currentStyle: string;
  onStyleChange: (style: string) => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const MapStyleSwitcher: React.FC<MapStyleSwitcherProps> = ({
  currentStyle,
  onStyleChange,
  position = 'bottom-left',
}) => {
  const isSatellite = currentStyle.includes('satellite');

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-8 left-4',
    'bottom-right': 'bottom-8 right-4',
  };

  const handleToggle = () => {
    onStyleChange(isSatellite ? MAP_STYLES.street : MAP_STYLES.satellite);
  };

  return (
    <div className={`absolute ${positionClasses[position]} z-10`}>
      <button
        onClick={handleToggle}
        className="group relative w-[70px] h-[70px] rounded-lg overflow-hidden shadow-lg border-2 border-white hover:shadow-xl transition-all duration-200 cursor-pointer"
        title={isSatellite ? 'Switch to Map view' : 'Switch to Satellite view'}
      >
        {/* Background representing the OPPOSITE view */}
        {isSatellite ? (
          // Currently Satellite - show Street/Map preview
          <div className="w-full h-full bg-[#e5e3df] relative">
            {/* Simplified street map lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 70 70">
              <rect width="70" height="70" fill="#e5e3df" />
              {/* Main roads */}
              <line x1="0" y1="28" x2="70" y2="28" stroke="#fff" strokeWidth="6" />
              <line x1="0" y1="50" x2="70" y2="50" stroke="#fff" strokeWidth="4" />
              <line x1="20" y1="0" x2="20" y2="70" stroke="#fff" strokeWidth="5" />
              <line x1="50" y1="0" x2="50" y2="70" stroke="#fff" strokeWidth="4" />
              {/* Blocks */}
              <rect x="3" y="3" width="14" height="22" fill="#c8e6c9" rx="1" />
              <rect x="24" y="3" width="23" height="22" fill="#ffecb3" rx="1" />
              <rect x="53" y="3" width="14" height="22" fill="#c8e6c9" rx="1" />
              <rect x="3" y="32" width="14" height="15" fill="#bbdefb" rx="1" />
              <rect x="24" y="32" width="23" height="15" fill="#c8e6c9" rx="1" />
              <rect x="53" y="32" width="14" height="15" fill="#ffecb3" rx="1" />
            </svg>
          </div>
        ) : (
          // Currently Street - show Satellite preview
          <div className="w-full h-full relative">
            {/* Satellite-like dark terrain */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 70 70">
              <rect width="70" height="70" fill="#3d5245" />
              {/* Terrain patches */}
              <ellipse cx="15" cy="20" rx="12" ry="10" fill="#2d4035" />
              <ellipse cx="50" cy="15" rx="15" ry="12" fill="#4a6352" />
              <ellipse cx="35" cy="45" rx="20" ry="15" fill="#2d4035" />
              <ellipse cx="10" cy="55" rx="10" ry="8" fill="#4a6352" />
              <ellipse cx="60" cy="50" rx="12" ry="10" fill="#3d5245" />
              {/* Roads on satellite */}
              <line x1="0" y1="30" x2="70" y2="35" stroke="#6b7280" strokeWidth="2" opacity="0.6" />
              <line x1="30" y1="0" x2="35" y2="70" stroke="#6b7280" strokeWidth="2" opacity="0.6" />
            </svg>
          </div>
        )}

        {/* Label at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 py-1.5">
          <span className="text-[11px] font-semibold text-gray-700 block text-center">
            {isSatellite ? 'Map' : 'Satellite'}
          </span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
      </button>
    </div>
  );
};

export default MapStyleSwitcher;
