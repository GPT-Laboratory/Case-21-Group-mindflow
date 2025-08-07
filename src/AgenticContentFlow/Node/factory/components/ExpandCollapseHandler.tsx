import React, { useState, useCallback } from 'react';
import { Node } from '@xyflow/react';
import { useNodeContext } from '../../context/useNodeContext';
import { FrameJSON } from '../types/FrameJSON';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updateNodeHierarchyVisibility } from '../utils/nodeHierarchyUtils';

interface ExpandCollapseState {
  expanded: boolean;
  childCount: number;
  dimensions: {
    current: { width: number; height: number };
    collapsed: { width: number; height: number };
    expanded: { width: number; height: number };
  };
}

interface ExpandCollapseHandlerProps {
  config: FrameJSON;
  node: Node;
  onStateChange?: (state: ExpandCollapseState) => void;
}

/**
 * Handles expand/collapse logic for container nodes in the unified system
 */
export const ExpandCollapseHandler: React.FC<ExpandCollapseHandlerProps> = ({
  config,
  node,
  onStateChange
}) => {
  const { 
    nodeParentIdMapWithChildIdSet, 
    nodeMap, 
    updateNodes,
    getChildNodes,
  } = useNodeContext();
  
  // Get child count using enhanced container functionality
  const enhancedChildNodes = getChildNodes(node.id);
  const legacyChildIdSet = nodeParentIdMapWithChildIdSet.get(node.id) || new Set();
  
  // Use enhanced container child count if available, otherwise fall back to legacy
  const childCount = enhancedChildNodes.length > 0 ? enhancedChildNodes.length : legacyChildIdSet.size;
  
  // Local state for expanded status - default to false for unified system
  const [expanded, setExpanded] = useState(Boolean(node.data?.expanded) || false);

  // Handle toggle expand/collapse
  const handleToggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Only allow expand/collapse for nodes that can have children (containers or nodes with children)
    if (config.group !== 'container' && childCount === 0) return;
    
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    
    // Calculate dimensions based on config and node type
    const baseDimensions = config.defaultDimensions || { width: 200, height: 200 };
    const collapsedDimensions = {
      width: Math.min(baseDimensions.width, 200),
      height: Math.min(baseDimensions.height, 200)
    };
    const expandedDimensions = baseDimensions;
    
    // Update the parent node with new dimensions and expanded state
    const updatedParentNode = {
      ...node,
      data: {
        ...node.data,
        expanded: newExpanded,
      },
      style: {
        ...node.style,
        width: newExpanded ? expandedDimensions.width : collapsedDimensions.width,
        height: newExpanded ? expandedDimensions.height : collapsedDimensions.height,
      },
    };

    // Remove measurement properties to avoid conflicts
    delete updatedParentNode.measured;
    delete updatedParentNode.width;
    delete updatedParentNode.height;

    // Update visibility of all child nodes recursively
    const updatedChildNodes = updateNodeHierarchyVisibility(
      updatedParentNode, 
      nodeMap,
      nodeParentIdMapWithChildIdSet,
      newExpanded
    );

    // Combine parent and children updates
    const updatedNodes = [updatedParentNode, ...updatedChildNodes];
    updateNodes(updatedNodes);

    // Notify parent component of state change
    const newState: ExpandCollapseState = {
      expanded: newExpanded,
      childCount,
      dimensions: {
        current: {
          width: newExpanded ? expandedDimensions.width : collapsedDimensions.width,
          height: newExpanded ? expandedDimensions.height : collapsedDimensions.height
        },
        collapsed: collapsedDimensions,
        expanded: expandedDimensions
      }
    };
    
    onStateChange?.(newState);
  }, [
    expanded, 
    config, 
    node, 
    nodeMap, 
    nodeParentIdMapWithChildIdSet, 
    updateNodes, 
    childCount, 
    onStateChange
  ]);

  // Don't render if not a container group and has no children
  if ( childCount === 0) {
    return null;
  }

  return (
    <Button
      onClick={handleToggleExpand}
      size="icon"
      variant="ghost"
      className="mr-1 relative h-6 w-6"
      aria-label={expanded ? "Collapse" : "Expand"}
    >
      {expanded ? (
        <ChevronUp className="size-4" />
      ) : (
        <>
          <ChevronDown className="size-4" />
          {childCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[0.6rem] font-semibold text-primary-foreground">
              {childCount}
            </span>
          )}
        </>
      )}
    </Button>
  );
};

/**
 * Hook for managing expand/collapse state externally
 */
export const useExpandCollapseState = (
  config: FrameJSON,
  node: Node
) => {
  const { nodeParentIdMapWithChildIdSet, nodeMap, updateNodes } = useNodeContext();
  
  const childIdSet = nodeParentIdMapWithChildIdSet.get(node.id) || new Set();
  const childCount = childIdSet.size;
  
  const [expanded, setExpanded] = useState(Boolean(node.data?.expanded) || false);

  const toggleExpand = useCallback(() => {
    if (config.group !== 'container' && childCount === 0) return;
    
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    
    const baseDimensions = config.defaultDimensions || { width: 200, height: 200 };
    const collapsedDimensions = {
      width: Math.min(baseDimensions.width, 200),
      height: Math.min(baseDimensions.height, 200)
    };
    const expandedDimensions = baseDimensions;
    
    const updatedParentNode = {
      ...node,
      data: { ...node.data, expanded: newExpanded },
      style: {
        ...node.style,
        width: newExpanded ? expandedDimensions.width : collapsedDimensions.width,
        height: newExpanded ? expandedDimensions.height : collapsedDimensions.height,
      },
    };

    delete updatedParentNode.measured;
    delete updatedParentNode.width;
    delete updatedParentNode.height;

    const updatedChildNodes = updateNodeHierarchyVisibility(
      updatedParentNode, 
      nodeMap,
      nodeParentIdMapWithChildIdSet,
      newExpanded
    );

    updateNodes([updatedParentNode, ...updatedChildNodes]);
  }, [expanded, config, node, nodeMap, nodeParentIdMapWithChildIdSet, updateNodes]);

  const baseDimensions = config.defaultDimensions || { width: 200, height: 200 };
  const collapsedDimensions = {
    width: Math.min(baseDimensions.width, 200),
    height: Math.min(baseDimensions.height, 200)
  };
  const expandedDimensions = baseDimensions;
  
  const currentState: ExpandCollapseState = {
    expanded,
    childCount,
    dimensions: {
      current: {
        width: node.width || (expanded ? expandedDimensions.width : collapsedDimensions.width),
        height: node.height || (expanded ? expandedDimensions.height : collapsedDimensions.height)
      },
      collapsed: collapsedDimensions,
      expanded: expandedDimensions
    }
  };

  return {
    expanded,
    childCount,
    currentState,
    toggleExpand,
    canExpand: config.group === 'container' || childCount > 0
  };
};
