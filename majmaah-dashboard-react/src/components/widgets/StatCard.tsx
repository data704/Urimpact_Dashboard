import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  descriptionIcon?: React.ReactNode;
  chart?: number[];
  chartColor?: string;
  onClick?: () => void;
  clickable?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  description,
  descriptionIcon,
  chart = [],
  chartColor = '#13c5bc',
  onClick,
  clickable = false,
}) => {
  return (
    <div 
      className={`stat-card ${clickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={clickable && onClick ? onClick : undefined}
      style={clickable ? { cursor: 'pointer' } : {}}
    >
      {/* Label */}
      <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
      
      {/* Value */}
      <p className="text-3xl font-bold text-[#13c5bc] mb-2 leading-tight">{value}</p>
      
      {/* Description with Icon */}
      {description && (
        <div className="flex items-center gap-2 mb-3">
          {descriptionIcon && (
            <span style={{ color: chartColor }}>
              {descriptionIcon}
            </span>
          )}
          <span className="text-sm font-medium" style={{ color: chartColor }}>
            {description}
          </span>
        </div>
      )}
      
      {/* Simple Line Chart - Professional Dark Style */}
      {chart.length > 0 && (
        <div className="mt-auto pt-3 border-t border-gray-100">
          <svg 
            width="100%" 
            height="40" 
            viewBox="0 0 100 40" 
            preserveAspectRatio="none"
            className="block"
          >
            {/* Create smooth line path */}
            <path
              d={(() => {
                const maxValue = Math.max(...chart);
                const minValue = Math.min(...chart);
                const range = maxValue - minValue || 1;
                
                // Calculate points for the line
                const points = chart.map((value, index) => {
                  const x = (index / (chart.length - 1)) * 100;
                  const y = 45 - ((value - minValue) / range) * 40;
                  return { x, y };
                });
                
                // Create smooth curve using quadratic bezier curves
                let path = `M ${points[0].x} ${points[0].y}`;
                
                for (let i = 1; i < points.length; i++) {
                  const curr = points[i];
                  const prev = points[i - 1];
                  
                  // Control point for smooth curve
                  const cpx = prev.x + (curr.x - prev.x) / 2;
                  const cpy = prev.y;
                  
                  path += ` Q ${cpx} ${cpy}, ${curr.x} ${curr.y}`;
                }
                
                return path;
              })()}
              fill="none"
              stroke={chartColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

