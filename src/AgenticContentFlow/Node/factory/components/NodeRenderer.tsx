/** @format */

import React from 'react';
import { useUpdateNodeInternals } from '@xyflow/react';
import { UnifiedFrameJSON } from '../types/UnifiedFrameJSON';
import { IconResolver } from '../IconResolver';
import { NodeHeader } from './NodeHeader';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ScrollingText from './ScrollingText';
import ConnectionHandles from './NodeHandles';
import { BaseNodeContainer } from './NodeStyles';
import ProcessControls from './ProcessControls';
import { ExpandCollapseHandler } from './ExpandCollapseHandler';
import { UnifiedStyleManager } from '../utils/UnifiedStyleManager';

interface BaseNodeRendererProps {
  id: string;
  selected: boolean;
  config: UnifiedFrameJSON;
  nodeInFlow: any;
  customContent?: React.ReactNode;
  isProcessing?: boolean;
  isCompleted?: boolean;
  hasError?: boolean;
  currentDimensions: { width: number; height: number };
  styleConfig: any;
  processingStyles: Record<string, any>;
  menuItems: React.ReactNode[];
  nodeLabel: string;
  hasVariants: boolean;
  variantBadgeText: string;
  variantBadgeColor?: string;
  // Container-specific props
  expanded?: boolean;
  isHovered?: boolean;
  containerRef?: React.RefObject<HTMLDivElement>;
  onExpandToggle?: (state?: any) => void;
  // Process control props
  isLooping?: boolean;
  loopInterval?: number;
  requiresUserApproval?: boolean;
  autoApprove?: boolean;
  waitingForApproval?: boolean;
  onPlay?: () => void;
  onStop?: () => void;
  onLoopToggle?: () => void;
  onLoopIntervalChange?: (interval: number) => void;
  onApprove?: () => void;
  onAutoApproveToggle?: () => void;
  disabled?: boolean;
  // Node update state
  isUpdating?: boolean;
  // Generation state
  generationState?: 'idle' | 'generating' | 'completed' | 'error';
  generationMessage?: string;
  // Label update state for flashing effect
  isLabelUpdating?: boolean;
}

/**
 * Base renderer for all node types with common rendering logic
 */
export const BaseNodeRenderer: React.FC<BaseNodeRendererProps> = ({
  id,
  selected,
  config,
  nodeInFlow,
  customContent,
  isProcessing,
  isCompleted,
  hasError,
  currentDimensions,
  styleConfig,
  processingStyles,
  menuItems,
  nodeLabel,
  hasVariants,
  variantBadgeText,
  variantBadgeColor,
  // Container-specific props
  expanded = false,
  isHovered = false,
  containerRef,
  onExpandToggle,
  // Process control props
  isLooping = false,
  loopInterval = 5,
  requiresUserApproval = false,
  autoApprove = false,
  waitingForApproval = false,
  onPlay,
  onStop,
  onLoopToggle,
  onLoopIntervalChange,
  onApprove,
  onAutoApproveToggle,
  disabled = false,
  // Node update state
  isUpdating,
  // Generation state
  generationState,
  generationMessage,
  // Label update state for flashing effect
  isLabelUpdating,
}) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const iconResolver = new IconResolver();

  // Resolve main icon - only one icon for both header and content
  const mainIcon = iconResolver.resolveIcon(config.visual.icon, {
    className: `relative w-6 h-6 ${config.visual.icon.className || ''} ${isProcessing || isUpdating ? 'animate-pulse' : ''}`
  });

  // Determine if this is a container node
  const isContainer = config.group === "container";

  // Container-specific props
  const containerProps = isContainer ? {
    ref: containerRef,
    className: cn(
      "w-full h-full flex flex-col select-none transition-[width,height] duration-200 ease-in-out",
      "rounded-lg shadow-md"
      // Removed Tailwind border classes to avoid conflicts with borderColor
    ),
    style: {
      width: currentDimensions.width,
      height: currentDimensions.height,
      backgroundColor: styleConfig.backgroundColor, // Depth-based color
      borderWidth: config.visual.style?.borderStyle === 'none' ? '0px' : '2px',
      borderStyle: config.visual.style?.borderStyle === 'dashed' ? 'dashed' : 
                   config.visual.style?.borderStyle === 'solid' ? 'solid' : 'none',
      borderColor: selected ? '#3b82f6' : styleConfig.backgroundColor,
      boxShadow: config.visual.style?.shadowStyle || "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      ...config.visual.style?.customStyles,
      ...processingStyles
    }
  } : {};

  // Cell-specific props (also used for closed containers)
  const cellProps = {
    onTransitionEnd: () => updateNodeInternals(id),
    selected: selected,
    color: selected ? config.visual.selectedColor || styleConfig.backgroundColor : styleConfig.backgroundColor,
    processing: isProcessing,
    processState: 'idle' as const,
    className: cn(
      "w-full h-full flex flex-col select-none transition-all duration-200 ease-in-out",
      "rounded-lg shadow-lg",
      "!min-w-0 !min-h-0",
      config.visual.headerGradient || ""
    ),
    style: {
      width: currentDimensions.width,
      height: currentDimensions.height,
      backgroundColor: styleConfig.backgroundColor, // Depth-based color
      ...processingStyles,
      userSelect: 'auto' as const
    }
  };

  // Determine header content based on node type
  const renderHeader = () => {
    if (isContainer && config.group === "container" && expanded) {
      // Expanded container - only show header when hovered
      return isHovered ? (
        <NodeHeader 
          className="bg-transparent border-none"
          color={styleConfig.backgroundColor}
          icon={mainIcon}
          label={nodeLabel}
          isProcessing={isProcessing}
          isCompleted={isCompleted}
          hasError={hasError}
          isUpdating={isUpdating}
          menuItems={menuItems}
          generationMessage={generationMessage}
          isLabelUpdating={isLabelUpdating}
        >
          {/* Expand/Collapse Button */}
          <ExpandCollapseHandler
            config={config}
            node={nodeInFlow}
            onStateChange={onExpandToggle}
          />
        </NodeHeader>
      ) : null;
    }

    // Regular header for cell nodes and closed containers
    return (
      <NodeHeader 
        className={cn("dragHandle", config.visual.headerGradient || "", "border-none")}
        color={styleConfig.backgroundColor}
        icon={mainIcon}
        isProcessing={isProcessing}
        isCompleted={isCompleted}
        hasError={hasError}
        isUpdating={isUpdating}
        menuItems={menuItems}
        generationMessage={generationMessage}
        isLabelUpdating={isLabelUpdating}
        style={{ backgroundColor: styleConfig.backgroundColor }}
      >
        {/* Expand/Collapse Button for container nodes */}
        {isContainer && (
          <ExpandCollapseHandler
            config={config}
            node={nodeInFlow}
            onStateChange={onExpandToggle}
          />
        )}
      </NodeHeader>
    );
  };

  // Determine content area
  const renderContent = () => {
    if (isContainer && config.group === "container" && expanded) {
      // Expanded container - show content when expanded
      return (
        <div style={{ flex: 1, padding: '1rem' }}>
          {customContent || (
            <div className="text-gray-500">
              {/* Default content would go here */}
            </div>
          )}
        </div>
      );
    }

    // Cell-like content for cell nodes and closed containers
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-3">
        <ScrollingText 
          text={nodeLabel}
          maxWidth="100%"
          className="text-center text-lg font-semibold text-slate-800"
          sx={{ maxWidth: '100%' }}
        />
        
        {hasVariants && (
          <div className="text-center text-sm text-slate-700 leading-relaxed px-1 flex flex-row items-center">
            <Badge variant="outline" className={cn("text-xs px-2 py-1 m-1 font-mono", variantBadgeColor || '')}>
              {isUpdating ? 'UPDATING...' : isProcessing ? 'PROCESSING...' : variantBadgeText}
            </Badge>
          </div>
        )}
        
 
        
        {/* Process Controls for cell-like nodes and containers with processes */}
        {(() => {
          if (config.process) {
            return (
              <ProcessControls
                isProcessing={isProcessing}
                isLooping={isLooping}
                loopInterval={loopInterval}
                requiresUserApproval={requiresUserApproval}
                autoApprove={autoApprove}
                waitingForApproval={waitingForApproval}
                onPlay={() => {
                  console.log('🎯 ProcessControls onPlay clicked for:', config.nodeType);
                  onPlay?.();
                }}
                onStop={onStop}
                onLoopToggle={onLoopToggle}
                onLoopIntervalChange={onLoopIntervalChange}
                onApprove={onApprove}
                onAutoApproveToggle={onAutoApproveToggle}
                disabled={disabled}
                className="mt-1"
              />
            );
          }
          return null;
        })()}
        
        {customContent}
      </div>
    );
  };

  return (
    <>
      {/* Main container */}
      {isContainer && expanded ? (
        // Expanded container - use container div
        <div {...containerProps}>
          <ConnectionHandles 
            nodeType={config.nodeType}
            color={UnifiedStyleManager.calculateHandleColor(config, styleConfig)}
            icons={{
              left: config.handles.definitions.find(h => h.position === 'left')?.icon,
              right: config.handles.definitions.find(h => h.position === 'right')?.icon,
              top: config.handles.definitions.find(h => h.position === 'top')?.icon,
              bottom: config.handles.definitions.find(h => h.position === 'bottom')?.icon,
            }}
          />
          {renderHeader()}
          {renderContent()}
        </div>
      ) : (
        // Cell nodes OR closed containers - use BaseNodeContainer
        <BaseNodeContainer {...cellProps}>
          <ConnectionHandles 
            nodeType={config.nodeType}
            color={UnifiedStyleManager.calculateHandleColor(config, styleConfig)}
          />
          {renderHeader()}
          {renderContent()}
        </BaseNodeContainer>
      )}
    </>
  );
}; 