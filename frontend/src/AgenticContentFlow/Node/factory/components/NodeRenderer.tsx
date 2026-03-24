/** @format */

import React from 'react';
import { useUpdateNodeInternals } from '@xyflow/react';
import { FrameJSON } from '../types/FrameJSON';
import { IconResolver } from '../IconResolver';
import { NodeHeader } from './NodeHeader';
import { cn } from '@/lib/utils';
import ConnectionHandles from './NodeHandles';
import { BaseNodeContainer } from './NodeStyles';
import { ExpandCollapseHandler } from './ExpandCollapseHandler';
import { NodeContent } from './NodeContent';
import { UnifiedStyleManager } from '../utils/UnifiedStyleManager';

interface BaseNodeRendererProps {
  id: string;
  selected: boolean;
  config: FrameJSON;
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
  // Enhanced container props
  childNodes?: any[];
  canContainChildren?: boolean;
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
  // Enhanced container props
  childNodes,
  canContainChildren = false,
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



  // Cell-specific props (also used for closed containers)
  const hasCustomNodeColor = Boolean(nodeInFlow?.data?.nodeColor);
  const headerGradientClass = hasCustomNodeColor ? "" : (config.visual.headerGradient || "");

  const cellProps = {
    onTransitionEnd: () => updateNodeInternals(id),
    selected: selected,
    color: selected ? config.visual.selectedColor || styleConfig.backgroundColor : styleConfig.backgroundColor,
    processing: isProcessing,
    processState: 'idle' as const,
    className: cn(
      "w-full flex flex-col select-none transition-all duration-200 ease-in-out",
      "rounded-lg shadow-lg",
      "!min-w-0 !min-h-0",
      headerGradientClass
    ),
    style: {
      width: currentDimensions.width,
      minHeight: config.defaultDimensions.height,
      backgroundColor: styleConfig.backgroundColor, // Depth-based color
      ...processingStyles,
      userSelect: 'auto' as const
    }
  };


  return (
    <>
      {/* Main container */}

      <BaseNodeContainer {...cellProps}>
        <ConnectionHandles
          nodeType={config.nodeType}
          color={UnifiedStyleManager.calculateHandleColor(config, styleConfig)}
        />
        <NodeHeader
          className={cn("dragHandle", headerGradientClass, "border-none")}
          color={styleConfig.backgroundColor}
          icon={mainIcon}
          label={nodeLabel}
          editableLabel
          labelPlaceholder={config.defaultLabel}
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
          <ExpandCollapseHandler
            config={config}
            node={nodeInFlow}
            onStateChange={onExpandToggle}
          />
        </NodeHeader>

        {/* Node content - shows description when not expanded */}
        <NodeContent
          node={nodeInFlow}
          expanded={expanded}
        />

      </BaseNodeContainer>
    </>
  );
}; 