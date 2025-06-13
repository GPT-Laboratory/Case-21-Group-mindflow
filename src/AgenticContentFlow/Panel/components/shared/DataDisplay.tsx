import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DataDisplayProps {
  data: any;
  title: string;
  icon: LucideIcon;
  maxHeight?: string;
  className?: string;
}

export const DataDisplay: React.FC<DataDisplayProps> = ({
  data,
  title,
  icon: Icon,
  maxHeight = 'max-h-40',
  className
}) => {
  if (!data) return null;

  return (
    <div className={`space-y-2 ${className || ''}`}>
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {title}
      </h4>
      <div className={`border rounded p-3 bg-gray-50 font-mono text-xs overflow-y-auto ${maxHeight}`}>
        <pre className="overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
};

interface MetadataGridProps {
  items: Array<{
    label: string;
    value: string | number;
    span?: 1 | 2; // How many columns to span
  }>;
  columns?: 2 | 3 | 4;
  className?: string;
}

export const MetadataGrid: React.FC<MetadataGridProps> = ({
  items,
  columns = 2,
  className
}) => {
  return (
    <div className={`grid grid-cols-${columns} gap-3 text-xs ${className || ''}`}>
      {items.map((item, index) => (
        <div
          key={index}
          className={`p-2 bg-gray-50 rounded ${
            item.span === 2 ? 'col-span-2' : ''
          }`}
        >
          <span className="font-medium">{item.label}:</span> {item.value}
        </div>
      ))}
    </div>
  );
};

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    text: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className
}) => {
  return (
    <div className={`text-center py-8 text-gray-500 ${className || ''}`}>
      <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs mt-1">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-3 text-xs text-blue-600 hover:text-blue-800 underline"
        >
          {action.text}
        </button>
      )}
    </div>
  );
};