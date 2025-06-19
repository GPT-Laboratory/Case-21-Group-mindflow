import React, { useState, useCallback } from 'react';
import { Node } from '@xyflow/react';
import { useNodeContext } from '../../context/useNodeContext';
import { UnifiedFrameJSON } from '../types/UnifiedFrameJSON';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  config: UnifiedFrameJSON;
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
  const { nodeParentIdMapWithChildIdSet, nodeMap, updateNodes } = useNodeContext();
  
  // Get child count for badge display
  const childIdSet = nodeParentIdMapWithChildIdSet.get(node.id) || new Set();
  const childCount = childIdSet.size;
  
  // Local state for expanded status - default to false for unified system
  const [expanded, setExpanded] = useState(Boolean(node.data?.expanded) || false);

  // Handle toggle expand/collapse
  const handleToggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Only allow expand/collapse for container group nodes
    if (config.group !== 'container') return;
    
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    
    // Use default dimensions from config
    const collapsedDimensions = { width: 200, height: 200 };
    const expandedDimensions = { width: 300, height: 300 };
    
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

  // Don't render if not a container group
  if (config.group !== 'container') {
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
  config: UnifiedFrameJSON,
  node: Node
) => {
  const { nodeParentIdMapWithChildIdSet, nodeMap, updateNodes } = useNodeContext();
  
  const childIdSet = nodeParentIdMapWithChildIdSet.get(node.id) || new Set();
  const childCount = childIdSet.size;
  
  const [expanded, setExpanded] = useState(Boolean(node.data?.expanded) || false);

  const toggleExpand = useCallback(() => {
    if (config.group !== 'container') return;
    
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    
    const collapsedDimensions = { width: 200, height: 200 };
    const expandedDimensions = { width: 300, height: 300 };
    
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

  const collapsedDimensions = { width: 200, height: 200 };
  const expandedDimensions = { width: 300, height: 300 };
  
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
    canExpand: config.group === 'container'
  };
};

/**
 * Updates the visibility of all child nodes in a hierarchy
 */
function updateNodeHierarchyVisibility(
  parentNode: Node,
  nodeMap: Map<string, Node>,
  nodeParentIdMapWithChildIdSet: Map<string, Set<string>>,
  expanded: boolean
): Node[] {
  const updatedNodes: Node[] = [];
  const childIdSet = nodeParentIdMapWithChildIdSet.get(parentNode.id);
  
  if (!childIdSet) {
    return updatedNodes;
  }

  // Recursively update all children
  for (const childId of childIdSet) {
    const childNode = nodeMap.get(childId);
    if (!childNode) continue;

    // Update child node visibility using hidden property (affects edges)
    const updatedChildNode = {
      ...childNode,
      hidden: !expanded,
    };

    updatedNodes.push(updatedChildNode);

    // Recursively update grandchildren if this child is also a container
    const grandchildIdSet = nodeParentIdMapWithChildIdSet.get(childId);
    if (grandchildIdSet && grandchildIdSet.size > 0) {
      // Check if child is expanded (default to true if not specified)
      let isChildExpanded = true;
      if (Object.prototype.hasOwnProperty.call(childNode.data, "expanded")) {
        isChildExpanded = childNode.data.expanded as boolean;
      }
      
      if (isChildExpanded) {
        const updatedGrandchildren = updateNodeHierarchyVisibility(
          updatedChildNode,
          nodeMap,
          nodeParentIdMapWithChildIdSet,
          expanded
        );
        updatedNodes.push(...updatedGrandchildren);
      }
    }
  }

  return updatedNodes;
} 