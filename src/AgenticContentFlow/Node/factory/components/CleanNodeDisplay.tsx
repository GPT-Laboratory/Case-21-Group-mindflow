/** @format */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Code, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  canContainChildren = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

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

        {/* Description - Only show if available and not in compact mode */}
        {displayDescription && !compact && (
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

      {/* Expandable Details Section */}
      {!compact && (displayDescription || parameters.length > 0 || externalDependencies.length > 0 || childNodes.length > 0) && (
        <div className="border-t border-gray-200">
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 px-3 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 justify-between"
              >
                <div className="flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  <span>Details</span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="px-3 pb-3 space-y-3">
              {/* Full Description */}
              {displayDescription && (
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">Description</div>
                  <div className="text-xs text-gray-600 leading-relaxed">
                    {displayDescription}
                  </div>
                </div>
              )}

              {/* Parameters */}
              {parameters.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">Parameters</div>
                  <div className="space-y-1">
                    {parameters.map((param, index) => (
                      <div key={index} className="text-xs text-gray-600 flex items-center gap-2">
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                          {param.name}
                        </code>
                        {param.type && (
                          <span className="text-gray-500">: {param.type}</span>
                        )}
                        {param.defaultValue && (
                          <span className="text-gray-500">= {param.defaultValue}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* External Dependencies */}
              {externalDependencies.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">Dependencies</div>
                  <div className="flex flex-wrap gap-1">
                    {externalDependencies.map((dep, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {dep}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Child Functions (for containers) */}
              {canContainChildren && childNodes.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">
                    Child Functions ({childNodes.length})
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {childNodes.map((child) => (
                      <div key={child.id} className="text-xs p-2 bg-gray-50 rounded border">
                        <div className="font-medium text-gray-800">
                          {child.data.functionName || child.data.label || 'Unnamed'}
                        </div>
                        {child.data.functionDescription && (
                          <div className="text-gray-600 mt-0.5 line-clamp-1">
                            {child.data.functionDescription}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  );
};

export default CleanNodeDisplay;