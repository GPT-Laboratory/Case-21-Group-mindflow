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

  const isTopicNode = config.nodeType === 'topicnode';

  // Resolve main icon - only one icon for both header and content
  const mainIcon = config.visual.icon
    ? iconResolver.resolveIcon(config.visual.icon, {
        className: `relative w-6 h-6 ${config.visual.icon.className || ''} ${isProcessing || isUpdating ? 'animate-pulse' : ''}`
      })
    : null;



  // Cell-specific props (also used for closed containers)
  const hasCustomNodeColor = Boolean(nodeInFlow?.data?.nodeColor);
  const headerGradientClass = hasCustomNodeColor ? "" : (config.visual.headerGradient || "");

  // Determine text color for topic nodes — use a legible, darker color than the pastel background.
  // We use custom node color if set, or the selectedColor (which is darker indigo), or default to slate-700.
  const topicTextColor = isTopicNode ? (nodeInFlow?.data?.nodeColor || config.visual.selectedColor || '#334155') : undefined;

  const cellProps = {
    onTransitionEnd: () => updateNodeInternals(id),
    selected: selected,
    color: selected ? config.visual.selectedColor || styleConfig.backgroundColor : styleConfig.backgroundColor,
    processing: isProcessing,
    processState: 'idle' as const,
    className: cn(
      "w-full flex flex-col select-none transition-all duration-200 ease-in-out group",
      isTopicNode ? "" : "rounded-lg shadow-lg",
      "!min-w-0 !min-h-0",
      isTopicNode ? "" : headerGradientClass
    ),
    style: {
      width: currentDimensions.width,
      minHeight: isTopicNode ? undefined : config.defaultDimensions.height,
      backgroundColor: isTopicNode ? 'transparent' : styleConfig.backgroundColor,
      ...processingStyles,
      userSelect: 'auto' as const,
      ...(isTopicNode ? { borderColor: topicTextColor, borderWidth: '2px', borderStyle: 'solid', boxShadow: 'none' } : {}),
    }
  };


  return (
    <>
      {/* Main container */}

      <BaseNodeContainer {...cellProps}>
        <ConnectionHandles
          nodeType={config.nodeType}
          color={isTopicNode && topicTextColor ? topicTextColor : UnifiedStyleManager.calculateHandleColor(config, styleConfig)}
        />
        <NodeHeader
          className={cn("dragHandle", isTopicNode ? "" : headerGradientClass, "border-none")}
          color={isTopicNode ? 'transparent' : styleConfig.backgroundColor}
          icon={mainIcon ?? undefined}
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
          topicTextColor={topicTextColor}
          style={{
            backgroundColor: isTopicNode ? 'transparent' : styleConfig.backgroundColor,
            ...(topicTextColor ? { color: topicTextColor } : {}),
          }}
          labelClassName={topicTextColor ? `!text-[${topicTextColor}]` : undefined}
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
          hidden={config.group === 'cell'}
        />

      </BaseNodeContainer>
    </>
  );
}; 