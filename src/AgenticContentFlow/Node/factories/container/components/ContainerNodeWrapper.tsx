/** @format */

import React, { useState, useEffect, useRef } from 'react';
import { NodeProps, useUpdateNodeInternals, useReactFlow } from '@xyflow/react';
import { ContainerNodeJSON, ContainerInstanceData, ExpandCollapseState } from '../types';
import { ContainerStyleManager } from './ContainerStyleManager';
import { ExpandCollapseHandler } from './ContainerExpandCollapseHandler';
import { IconResolver } from '../../shared/IconResolver';
import { NodeHeader } from '../../shared/components/NodeHeader';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import CornerResizer from '../../shared/components/CornerResizer';
import ConnectionHandles from '../../shared/components/ConnectionHandles';
import { LAYOUT_CONSTANTS } from '../../../../Layout/utils/layoutUtils';
import { colorByDepth } from '../../shared/utils/colorByDepth';

// Import container styles from shared location
import { DataNodeContainer, PageNodeContainer, InvisibleNodeContainer } from './ContainerStyles';

interface ContainerNodeWrapperProps extends NodeProps {
  config: ContainerNodeJSON;
  customContent?: React.ReactNode;
  onMenuAction?: (action: string, nodeData: any) => void;
  processingState?: 'idle' | 'processing' | 'completed' | 'error';
  isProcessing?: boolean;
  isCompleted?: boolean;
  hasError?: boolean;
}

/**
 * Universal wrapper component for container nodes
 */
export const ContainerNodeWrapper: React.FC<ContainerNodeWrapperProps> = ({
  id,
  data,
  selected,
  config,
  customContent,
  onMenuAction,
  processingState = 'idle',
  isProcessing = false,
  isCompleted = false,
  hasError = false
}) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const { getNode } = useReactFlow();
  const nodeInFlow = getNode(id);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Safely cast data to ContainerInstanceData with proper type checking
  const nodeData = (data || {}) as ContainerInstanceData;
  const dataExpanded = typeof nodeData.expanded === 'boolean' ? nodeData.expanded : false;
  
  const [expandCollapseState, setExpandCollapseState] = useState<ExpandCollapseState>({
    expanded: dataExpanded || config.behavior.defaultExpanded,
    childCount: 0,
    dimensions: {
      current: config.dimensions.collapsed,
      collapsed: config.dimensions.collapsed,
      expanded: config.dimensions.expanded
    }
  });

  // State for invisible node hover behavior
  const [isHovered, setIsHovered] = useState(false);

  const iconResolver = new IconResolver();

  useEffect(() => {
    if (nodeInFlow) {
      const nodeExpanded = typeof nodeInFlow.data?.expanded === 'boolean' ? nodeInFlow.data.expanded : false;
      setExpandCollapseState(prev => ({
        ...prev,
        expanded: nodeExpanded
      }));
    }
  }, [nodeInFlow]);

  // Setup hover detection for invisible nodes
  useEffect(() => {
    if (config.category === 'container') {
      const handleMouseMove = (e: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const inside =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        setIsHovered(inside);
      };
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [config.category]);

  if (!nodeInFlow) {
    console.error(`Container node with id ${id} not found in store.`);
    return null;
  }

  const { expanded } = expandCollapseState;

  // Use depth-based coloring like the originals
  const nodeDepth = nodeInFlow?.data.depth || 0;
  const depthColor = colorByDepth(nodeDepth as number);

  // Generate styling configuration with depth color
  const styleConfig = ContainerStyleManager.generateStyleConfig(
    config,
    nodeData,
    {
      selected: Boolean(selected),
      expanded,
      isProcessing,
      hasError,
      isCompleted
    }
  );

  // Override color with depth-based color
  styleConfig.color = depthColor;
  styleConfig.borderColor = selected ? '#3b82f6' : depthColor;

  // Get icon styling
  const iconStyling = ContainerStyleManager.getIconStyling(config, expanded);
  
  // Get icon styling with proper positioning classes
  const getIconClasses = (expanded: boolean) => {
    if (expanded) {
      return 'relative w-6 h-6';
    } else {
      return 'absolute w-16 h-16 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2';
    }
  };

  // Resolve icons with proper styling and positioning
  const mainIcon = iconResolver.resolveIcon(config.visual.icon, {
    className: `${getIconClasses(expanded)} ${config.visual.icon.className || ''} ${isProcessing ? 'animate-pulse' : ''}`
  });

  // Get current dimensions
  const currentDimensions = {
    width: nodeInFlow?.width || expandCollapseState.dimensions.current.width,
    height: nodeInFlow?.height || expandCollapseState.dimensions.current.height
  };

  // Apply processing state styles
  const processingStyles = ContainerStyleManager.getProcessingStateStyles(
    styleConfig,
    processingState
  );

  // Generate menu items
  const menuItems = config.menu.items
    .filter(item => {
      if (item.requiresExpanded && !expanded) return false;
      if (item.requiresCollapsed && expanded) return false;
      return true;
    })
    .map(item => (
      <DropdownMenuItem 
        key={item.key} 
        onClick={() => onMenuAction?.(item.action, nodeData)}
      >
        {item.label}
      </DropdownMenuItem>
    ));

  // Add container-specific menu items if available
  if (config.menu.containerSpecificItems) {
    const containerMenuItems = config.menu.containerSpecificItems
      .filter(item => {
        if (item.requiresExpanded && !expanded) return false;
        if (item.requiresCollapsed && expanded) return false;
        return true;
      })
      .map(item => (
        <DropdownMenuItem 
          key={item.key} 
          onClick={() => onMenuAction?.(item.action, nodeData)}
        >
          {item.label}
        </DropdownMenuItem>
      ));
    menuItems.push(...containerMenuItems);
  }

  // Handle state change from expand/collapse
  const handleExpandCollapseStateChange = (newState: ExpandCollapseState) => {
    setExpandCollapseState(newState);
  };

  // Get node label
  const nodeLabel = nodeData?.label || config.defaultLabel;

  // Choose the appropriate container component based on category
  const renderContainer = () => {
    const containerProps = {
      ref: containerRef,
      onTransitionEnd: () => updateNodeInternals(id),
      selected,
      color: depthColor,
      className: "w-full h-full flex flex-col select-none transition-[width,height] duration-200 ease-in-out",
      style: {
        width: currentDimensions.width,
        height: currentDimensions.height,
        backgroundColor: depthColor,
        ...processingStyles
      }
    };

    const content = (
      <>
        {/* Corner Resizer - only show if resizable */}
        {config.behavior.resizable && (
          <CornerResizer
            minHeight={config.dimensions.minDimensions?.height || LAYOUT_CONSTANTS.NODE_DEFAULT_HEIGHT}
            minWidth={config.dimensions.minDimensions?.width || LAYOUT_CONSTANTS.NODE_DEFAULT_WIDTH}
            nodeToResize={nodeInFlow}
            canResize={Boolean(selected)}
            color={depthColor}
          />
        )}

        {/* Connection Handles */}
        <ConnectionHandles 
          nodeType={config.nodeType}
          color={depthColor}
          icons={{
            left: config.handles.definitions.find(h => h.position === 'left')?.icon,
            right: config.handles.definitions.find(h => h.position === 'right')?.icon,
            top: config.handles.definitions.find(h => h.position === 'top')?.icon,
            bottom: config.handles.definitions.find(h => h.position === 'bottom')?.icon,
          }}
        />

        {/* Conditional rendering based on node type */}
        {config.category === 'container' ? (
          // Invisible node - only show header when not expanded or when hovered
          <div className="dragHandle">
            {(!expanded || isHovered) && (
              <NodeHeader 
                className={`bg-transparent border-none`}
                color={depthColor}
                icon={iconStyling.position === 'header' ? mainIcon : undefined}
                label={nodeLabel}
                isProcessing={isProcessing}
                isCompleted={isCompleted}
                hasError={hasError}
                menuItems={menuItems}
              >
                {/* Main icon when positioned in center */}
                {iconStyling.position === 'center' && mainIcon}
                
                {/* Expand/Collapse Button */}
                <ExpandCollapseHandler
                  config={config}
                  node={nodeInFlow}
                  onStateChange={handleExpandCollapseStateChange}
                />
              </NodeHeader>
            )}
          </div>
        ) : (
          // Regular container nodes
          <>
            <NodeHeader 
              className={`bg-${depthColor} border-none`}
              color={depthColor}
              icon={iconStyling.position === 'header' ? mainIcon : undefined}
              label={nodeLabel}
              isProcessing={isProcessing}
              isCompleted={isCompleted}
              hasError={hasError}
              menuItems={menuItems}
            >
              {/* Main icon when positioned in center */}
              {iconStyling.position === 'center' && mainIcon}
              
              {/* Expand/Collapse Button */}
              <ExpandCollapseHandler
                config={config}
                node={nodeInFlow}
                onStateChange={handleExpandCollapseStateChange}
              />
            </NodeHeader>

            {/* Content Area - show when expanded */}
            {expanded && (
              <div style={ContainerStyleManager.getContentAreaStyles(expanded)}>
                {customContent || (
                  <div className="text-gray-500">
                    {nodeData.details || config.description}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </>
    );

    // Return appropriate styled container
    switch (config.category) {
      case 'data':
        return (
          <DataNodeContainer
            {...containerProps}
            processing={isProcessing}
            processState={processingState}
          >
            {content}
          </DataNodeContainer>
        );

      case 'page':
        return (
          <PageNodeContainer
            {...containerProps}
            isExpanded={expanded}
          >
            {content}
          </PageNodeContainer>
        );

      case 'container':
        return (
          <InvisibleNodeContainer
            {...containerProps}
            isExpanded={expanded}
            isHovered={isHovered}
          >
            {content}
          </InvisibleNodeContainer>
        );

      default:
        // Statistics or other categories - use generic styled div
        return (
          <div
            {...containerProps}
            className={`${containerProps.className} border-2 border-gray-300 rounded-lg shadow-md`}
            style={{
              ...containerProps.style,
              borderColor: selected ? '#3b82f6' : '#d1d5db',
            }}
          >
            {content}
          </div>
        );
    }
  };

  return renderContainer();
};