import React from 'react';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface StatusBadgeProps {
  status: 'idle' | 'processing' | 'success' | 'error' | 'analyzing' | 'completed';
  icon?: LucideIcon;
  customText?: string;
  timestamp?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  icon: Icon, 
  customText,
  timestamp 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'processing':
      case 'analyzing':
        return {
          text: customText || (status === 'processing' ? 'Processing...' : 'Analyzing...'),
          className: 'text-blue-600 bg-blue-50 border-blue-200'
        };
      case 'success':
      case 'completed':
        return {
          text: customText || (status === 'success' ? 'Success' : 'Completed'),
          className: 'text-green-600 bg-green-50 border-green-200'
        };
      case 'error':
        return {
          text: customText || 'Error',
          className: 'text-red-600 bg-red-50 border-red-200'
        };
      default:
        return {
          text: customText || 'Ready',
          className: 'text-gray-600 bg-gray-50 border-gray-200'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={`text-xs ${config.className}`}>
        {Icon && <Icon className="w-4 h-4" />}
        {config.text}
      </Badge>
      {timestamp && (
        <span className="text-xs text-gray-500">
          {timestamp}
        </span>
      )}
    </div>
  );
};