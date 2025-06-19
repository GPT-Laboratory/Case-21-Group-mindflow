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

    // Update child node visibility
    const updatedChildNode = {
      ...childNode,
      style: {
        ...childNode.style,
        display: expanded ? 'block' : 'none',
        opacity: expanded ? 1 : 0,
        pointerEvents: expanded ? 'auto' as const : 'none' as const
      }
    };

    updatedNodes.push(updatedChildNode);

    // Recursively update grandchildren if this child is also a container
    const grandchildIdSet = nodeParentIdMapWithChildIdSet.get(childId);
    if (grandchildIdSet && grandchildIdSet.size > 0) {
      const updatedGrandchildren = updateNodeHierarchyVisibility(
        updatedChildNode,
        nodeMap,
        nodeParentIdMapWithChildIdSet,
        expanded && Boolean(childNode.data?.expanded)
      );
      updatedNodes.push(...updatedGrandchildren);
    }
  }

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