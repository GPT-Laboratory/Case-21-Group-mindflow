/** @format */

import React, { useState, useCallback } from 'react';
import { Node } from '@xyflow/react';
import { useNodeContext } from '../../../store/useNodeContext';
import { updateNodeHierarchyVisibility } from '../../../../Nodes/common/utils/nodeHierarchyUtils';
import { ContainerNodeJSON, ExpandCollapseState } from '../types';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExpandCollapseHandlerProps {
  config: ContainerNodeJSON;
  node: Node;
  onStateChange?: (state: ExpandCollapseState) => void;
}

/**
 * Handles expand/collapse logic for container nodes
 */
export const ExpandCollapseHandler: React.FC<ExpandCollapseHandlerProps> = ({
  config,
  node,
  onStateChange
}) => {
  const { nodeParentIdMapWithChildIdSet, nodeMap, updateNodes } = useNodeContext();
  
  // Get child count for badge display
  const childIdSet = nodeParentIdMapWithChildIdSet.get(node.id) || new Set();
  const childCount = childIdSet.size;
  
  // Local state for expanded status
  const [expanded, setExpanded] = useState(Boolean(node.data?.expanded) || config.behavior.defaultExpanded);

  // Handle toggle expand/collapse
  const handleToggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!config.behavior.expandable) return;
    
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    
    // Update the parent node with new dimensions and expanded state
    const updatedParentNode = {
      ...node,
      data: {
        ...node.data,
        expanded: newExpanded,
      },
      style: {
        ...node.style,
        width: newExpanded ? config.dimensions.expanded.width : config.dimensions.collapsed.width,
        height: newExpanded ? config.dimensions.expanded.height : config.dimensions.collapsed.height,
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
          width: newExpanded ? config.dimensions.expanded.width : config.dimensions.collapsed.width,
          height: newExpanded ? config.dimensions.expanded.height : config.dimensions.collapsed.height
        },
        collapsed: config.dimensions.collapsed,
        expanded: config.dimensions.expanded
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

  // Don't render if not expandable
  if (!config.behavior.expandable) {
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
  config: ContainerNodeJSON,
  node: Node
) => {
  const { nodeParentIdMapWithChildIdSet, nodeMap, updateNodes } = useNodeContext();
  
  const childIdSet = nodeParentIdMapWithChildIdSet.get(node.id) || new Set();
  const childCount = childIdSet.size;
  
  const [expanded, setExpanded] = useState(Boolean(node.data?.expanded) || config.behavior.defaultExpanded);

  const toggleExpand = useCallback(() => {
    if (!config.behavior.expandable) return;
    
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    
    const updatedParentNode = {
      ...node,
      data: { ...node.data, expanded: newExpanded },
      style: {
        ...node.style,
        width: newExpanded ? config.dimensions.expanded.width : config.dimensions.collapsed.width,
        height: newExpanded ? config.dimensions.expanded.height : config.dimensions.collapsed.height,
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

  const currentState: ExpandCollapseState = {
    expanded,
    childCount,
    dimensions: {
      current: {
        width: node.width || (expanded ? config.dimensions.expanded.width : config.dimensions.collapsed.width),
        height: node.height || (expanded ? config.dimensions.expanded.height : config.dimensions.collapsed.height)
      },
      collapsed: config.dimensions.collapsed,
      expanded: config.dimensions.expanded
    }
  };

  return {
    expanded,
    childCount,
    currentState,
    toggleExpand,
    canExpand: config.behavior.expandable
  };
};