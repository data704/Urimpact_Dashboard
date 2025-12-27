import React from 'react';
import clsx from 'clsx';

interface WidgetCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  fullWidth?: boolean;
}

export const WidgetCard: React.FC<WidgetCardProps> = ({
  children,
  className = '',
  title,
  fullWidth = false,
}) => {
  return (
    <div
      className={clsx(
        'widget-card',
        fullWidth ? 'col-span-full' : '',
        className
      )}
    >
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

