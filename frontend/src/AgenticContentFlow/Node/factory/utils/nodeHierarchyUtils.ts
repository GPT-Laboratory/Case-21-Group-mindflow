import { Node } from '@xyflow/react';

/**
 * Updates the visibility of all child nodes in a hierarchy
 * This function recursively traverses the node hierarchy and updates
 * the visibility of all child nodes based on the parent's expanded state
 */
export function updateNodeHierarchyVisibility(
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

/**
 * Applies initial visibility to all nodes based on their parent's expanded state
 * This function should be called when nodes are first loaded/imported
 */
export function applyInitialNodeVisibility(
  nodes: Node[],
  nodeParentIdMapWithChildIdSet?: Map<string, Set<string>>
): Node[] {
  const nodeMap = new Map<string, Node>();
  const updatedNodes: Node[] = [];
  
  // First, create a map of all nodes
  nodes.forEach(node => {
    nodeMap.set(node.id, node);
  });
  
  // Build parent-child relationships if not provided
  let parentChildMap: Map<string, Set<string>> = nodeParentIdMapWithChildIdSet || new Map<string, Set<string>>();
  if (!nodeParentIdMapWithChildIdSet) {
    
    // Initialize with empty sets for all nodes
    nodes.forEach(node => {
      parentChildMap.set(node.id, new Set());
    });
    
    // Build relationships based on node IDs and types
    nodes.forEach(node => {
      // Check if this is a child node based on naming convention
      if (node.type === 'childnode' && node.id.includes('-ext-dep-')) {
        // Extract parent function ID from child node ID
        // Example: "sanitizeString_functiondeclaration_45kvzi-ext-dep-0" -> "sanitizeString_functiondeclaration_45kvzi"
        const parentIdMatch = node.id.match(/^(.+)-ext-dep-\d+$/);
        if (parentIdMatch) {
          const parentId = parentIdMatch[1];
          const parentNode = nodeMap.get(parentId);
          
          if (parentNode) {
            // Add child to parent's set
            const parentSet = parentChildMap.get(parentId);
            if (parentSet) {
              parentSet.add(node.id);
            }
            
            // Set parentId on the child node
            node.parentId = parentId;
          }
        }
      }
      
      // Also check explicit parentId relationships
      if (node.parentId) {
        const parentSet = parentChildMap.get(node.parentId);
        if (parentSet) {
          parentSet.add(node.id);
        }
      }
    });
  }
  
  // Process each node to apply visibility
  nodes.forEach(node => {
    let updatedNode = { ...node };
    
    // Check if this node has a parent
    const parentId = node.parentId;
    if (parentId) {
      const parentNode = nodeMap.get(parentId);
      if (parentNode) {
        // Check if parent is expanded (default to false if not specified)
        const isParentExpanded = Boolean(parentNode.data?.expanded);
        
        // Set hidden property based on parent's expanded state
        updatedNode = {
          ...updatedNode,
          hidden: !isParentExpanded,
        };
      }
    } else {
      // Root level nodes should always be visible
      updatedNode = {
        ...updatedNode,
        hidden: false,
      };
    }
    
    updatedNodes.push(updatedNode);
  });
  
  return updatedNodes;
}

/**
 * Gets all descendant nodes of a given parent node
 */
export function getAllDescendants(
  parentId: string,
  nodeParentIdMapWithChildIdSet: Map<string, Set<string>>
): Set<string> {
  const descendants = new Set<string>();
  const childIdSet = nodeParentIdMapWithChildIdSet.get(parentId);
  
  if (!childIdSet) {
    return descendants;
  }

  for (const childId of childIdSet) {
    descendants.add(childId);
    
    // Recursively get descendants of this child
    const childDescendants = getAllDescendants(childId, nodeParentIdMapWithChildIdSet);
    childDescendants.forEach(id => descendants.add(id));
  }

  return descendants;
}

/**
 * Checks if a node has any visible children
 */
export function hasVisibleChildren(
  nodeId: string,
  nodeMap: Map<string, Node>,
  nodeParentIdMapWithChildIdSet: Map<string, Set<string>>
): boolean {
  const childIdSet = nodeParentIdMapWithChildIdSet.get(nodeId);
  
  if (!childIdSet) {
    return false;
  }

  for (const childId of childIdSet) {
    const childNode = nodeMap.get(childId);
    if (childNode && childNode.style?.display !== 'none') {
      return true;
    }
  }

  return false;
} 