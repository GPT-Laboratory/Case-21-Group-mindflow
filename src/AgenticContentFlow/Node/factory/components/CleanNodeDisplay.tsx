/** @format */

import React from 'react';
import { cn } from '@/lib/utils';
import { Code } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CleanNodeDisplayProps {
  /** Function name (used as title) */
  functionName?: string;
  /** Function description from block comments */
  functionDescription?: string;
  /** Node label (fallback if no function name) */
  label?: string;
  /** Additional details for expanded view */
  details?: string;
  /** Function parameters for detailed view */
  parameters?: Array<{
    name: string;
    type?: string;
    defaultValue?: string;
  }>;
  /** Whether this is a nested function */
  isNested?: boolean;
  /** External dependencies for detailed view */
  externalDependencies?: string[];
  /** Custom className */
  className?: string;
  /** Whether to show in compact mode */
  compact?: boolean;
  /** Whether the node is processing */
  isProcessing?: boolean;
  /** Whether the node has completed */
  isCompleted?: boolean;
  /** Whether the node has an error */
  hasError?: boolean;
  /** Child nodes for container display */
  childNodes?: Array<{
    id: string;
    data: {
      functionName?: string;
      functionDescription?: string;
      label?: string;
    };
  }>;
  /** Whether this node can contain children */
  canContainChildren?: boolean;
  /** Show description without Details button (for function nodes with children) */
  showDescriptionWithoutDetails?: boolean;
}

/**
 * Clean node display component that shows only essential information by default
 * with expandable views for detailed information
 */
export const CleanNodeDisplay: React.FC<CleanNodeDisplayProps> = ({
  functionName,
  functionDescription,
  label,
  details,
  parameters = [],
  isNested = false,
  externalDependencies = [],
  className,
  compact = false,
  isProcessing = false,
  isCompleted = false,
  hasError = false,
  childNodes = [],
  canContainChildren = false,
  showDescriptionWithoutDetails = false
}) => {

  // Determine the display title - prefer function name, fallback to label
  const displayTitle = functionName || label || 'Unnamed Function';
  
  // Determine the display description - use function description from block comments
  const displayDescription = functionDescription || details || '';

  // Status indicator - prioritize error > processing > completed
  const getStatusBadge = () => {
    if (hasError) {
      return <Badge variant="outline" className="text-xs bg-red-50 text-red-700">Error</Badge>;
    }
    if (isProcessing) {
      return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">Processing</Badge>;
    }
    if (isCompleted) {
      return <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Complete</Badge>;
    }
    return null;
  };

  // Nested function indicator
  const getNestedIndicator = () => {
    if (isNested) {
      return <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">Nested</Badge>;
    }
    return null;
  };

  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      {/* Essential Information - Always Visible */}
      <div className="flex-1 flex flex-col justify-center p-3 space-y-2">
        {/* Title with status indicators */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Code className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <span className="font-semibold text-sm text-gray-900 truncate">
              {displayTitle}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {getNestedIndicator()}
            {getStatusBadge()}
          </div>
        </div>

        {/* Description - Show if available and not in compact mode, or if showDescriptionWithoutDetails is true */}
        {displayDescription && (!compact || showDescriptionWithoutDetails) && (
          <div className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
            {displayDescription}
          </div>
        )}

        {/* Child nodes count for containers */}
        {canContainChildren && childNodes.length > 0 && (
          <div className="text-xs text-gray-500">
            Contains {childNodes.length} function{childNodes.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Expandable Details Section - Hide if showDescriptionWithoutDetails is true */}
      {!compact && !showDescriptionWithoutDetails && (displayDescription || parameters.length > 0 || externalDependencies.length > 0 || childNodes.length > 0) && (
        <div className="border-t border-gray-200">
        
        </div>
      )}
    </div>
  );
};

export default CleanNodeDisplay;