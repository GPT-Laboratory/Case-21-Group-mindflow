import React, { ReactNode } from 'react';
import { NodeProps, useReactFlow, useUpdateNodeInternals } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ConnectionHandles from './ConnectionHandles';
import { NodeHeader } from './NodeHeader';
import CornerResizer from './CornerResizer';
import { BaseNodeContainer } from './NodeStyles';
import NodePlayControls from './NodePlayControls';

export interface CellNodeConfig {
  /** Node type for handle configuration */
  nodeType: string;
  /** Main icon to display in the center */
  icon: ReactNode;
  /** Header icon (smaller version for header) */
  headerIcon: ReactNode;
  /** Header background gradient classes */
  headerGradient: string;
  /** Selected color for border */
  selectedColor: string;
  /** Main badge configuration */
  badge: {
    text: string;
    colorClasses: string;
  };
  /** Additional content to display below badge */
  additionalContent?: ReactNode;
  /** Menu items for dropdown */
  menuItems: ReactNode[];
}

export interface CellNodeProps extends NodeProps {
  /** Configuration for this cell node */
  config: CellNodeConfig;
  /** Node label */
  label: string;
  /** Processing state */
  isProcessing: boolean;
  /** Completed state */
  isCompleted: boolean;
  /** Error state */
  hasError: boolean;
  /** Play handler */
  onPlay: () => void;
  /** Stop handler */
  onStop: () => void;
  /** Loop state */
  isLooping: boolean;
  /** Loop interval */
  loopInterval: number;
  /** Loop toggle handler */
  onLoopToggle: () => void;
  /** Loop interval change handler */
  onLoopIntervalChange: (interval: number) => void;
  /** Whether the node requires user approval */
  requiresUserApproval?: boolean;
  /** Whether auto-approve is enabled */
  autoApprove?: boolean;
  /** Whether waiting for user approval */
  waitingForApproval?: boolean;
  /** Callback when approve button is clicked */
  onApprove?: () => void;
  /** Callback when auto-approve toggle is clicked */
  onAutoApproveToggle?: () => void;
}

/**
 * CellNode Component
 * 
 * A shared visual component for square nodes that display an icon, badge, and controls.
 * Used by LogicalNode, RestNode, and ContentNode for consistent appearance.
 */
export const CellNode: React.FC<CellNodeProps> = ({
  id,
  selected,
  config,
  label,
  isProcessing,
  isCompleted,
  hasError,
  onPlay,
  onStop,
  isLooping,
  loopInterval,
  onLoopToggle,
  onLoopIntervalChange,
  requiresUserApproval,
  autoApprove,
  waitingForApproval,
  onApprove,
  onAutoApproveToggle
}) => {
  const { getNode } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const nodeInFlow = getNode(id);

  const color = "white";

  if (!nodeInFlow) {
    console.error(`Node with id ${id} not found in store.`);
    return null;
  }

  // Square dimensions
  const nodeDimensions = {
    width: 200,
    height: 200,
  };

  return (
    <>
      <CornerResizer
        minHeight={nodeDimensions.height}
        minWidth={nodeDimensions.width}
        nodeToResize={nodeInFlow}
        canResize={selected}
        color={color}
      />

      <BaseNodeContainer
        onTransitionEnd={() => updateNodeInternals(id)}
        selected={selected}
        color={selected ? config.selectedColor : color}
        processing={isProcessing}
        processState={isProcessing ? 'processing' : isCompleted ? 'completed' : hasError ? 'error' : 'idle'}
        className={cn(
          "w-full h-full flex flex-col select-none transition-all duration-200 ease-in-out",
          "rounded-lg shadow-lg bg-white",
          "!min-w-0 !min-h-0"
        )}
        style={{
          width: nodeInFlow?.width || nodeDimensions.width,
          height: nodeInFlow?.height || nodeDimensions.height,
        }}
      >
        <ConnectionHandles 
          nodeType={config.nodeType}
          color={color}
        />

        <NodeHeader 
          className={cn("dragHandle", config.headerGradient)}
          icon={config.headerIcon}
          label={label}
          isProcessing={isProcessing}
          isCompleted={isCompleted}
          hasError={hasError}
          menuItems={config.menuItems}
        />

        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-3">
          <div className="flex items-center justify-center">
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center transition-all",
              isProcessing ? "bg-blue-100 animate-pulse" : "bg-blue-100",
              hasError ? "bg-red-100" : "",
              isCompleted ? "bg-green-100" : ""
            )}>
              {React.isValidElement(config.icon) ? (
                React.cloneElement(config.icon as React.ReactElement<any>, {
                  className: cn(
                    "w-6 h-6 transition-all",
                    isProcessing ? "text-blue-600 animate-pulse" : "text-blue-600",
                    hasError ? "text-red-600" : "",
                    isCompleted ? "text-green-600" : "",
                    (config.icon as any)?.props?.className
                  )
                })
              ) : (
                config.icon
              )}
            </div>
          </div>
          
          <div className="text-center text-sm text-slate-700 leading-relaxed px-1 flex flex-row items-center">
            <Badge variant="outline" className={cn("text-xs px-2 py-1 m-1 font-mono", config.badge.colorClasses)}>
              {config.badge.text}
            </Badge>
            {config.additionalContent && (
              <div className="mt-1 text-xs text-slate-600">
                {config.additionalContent}
              </div>
            )}
          </div>
          
          {/* Play Controls */}
          <NodePlayControls
            isProcessing={isProcessing}
            isLooping={isLooping}
            loopInterval={loopInterval}
            requiresUserApproval={requiresUserApproval}
            autoApprove={autoApprove}
            waitingForApproval={waitingForApproval}
            onPlay={onPlay}
            onStop={onStop}
            onLoopToggle={onLoopToggle}
            onLoopIntervalChange={onLoopIntervalChange}
            onApprove={onApprove}
            onAutoApproveToggle={onAutoApproveToggle}
            className="mt-1"
          />
        </div>
      </BaseNodeContainer>
    </>
  );
};

export default CellNode;