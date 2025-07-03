import { Node } from "@xyflow/react";
import { NodeData } from "../../../types";

// Cache for expensive calculations
const overlapCache = new Map<string, number>();
const distanceCache = new Map<string, number>();

// Clear cache periodically to prevent memory leaks
let cacheClearCounter = 0;
const CACHE_CLEAR_INTERVAL = 100000;

/**
 * Helper function to check if a node is a descendant
 */
export const isDescendant = (potentialChildId: string, ancestorId: string, poolOfAllNodes: Map<string, any>, visited = new Set<string>()): boolean => {
  if (potentialChildId === ancestorId) return true;
  if (visited.has(potentialChildId)) return false;
  visited.add(potentialChildId);

  const nodeParentId = poolOfAllNodes.get(potentialChildId)?.parentId;
  if (!nodeParentId) return false;
  
  return isDescendant(nodeParentId, ancestorId, poolOfAllNodes, visited);
};

/**
 * Helper function to check if nodes are siblings
 */
export const areSiblings = (nodeA: any, nodeB: any): boolean => {
  return nodeA.parentId != null && nodeA.parentId === nodeB.parentId;
};

/**
 * Calculate overlap area between two nodes with caching
 */
export const getOverlapArea = (nodeA: any, nodeB: any): number => {
  // Clear cache periodically
  cacheClearCounter++;
  if (cacheClearCounter > CACHE_CLEAR_INTERVAL) {
    overlapCache.clear();
    distanceCache.clear();
    cacheClearCounter = 0;
  }

  const cacheKey = `${nodeA.id}-${nodeB.id}`;
  if (overlapCache.has(cacheKey)) {
    return overlapCache.get(cacheKey)!;
  }

  const aWidth = nodeA.width || nodeA.measured?.width || 0;
  const aHeight = nodeA.height || nodeA.measured?.height || 0;
  const bWidth = nodeB.width || nodeB.measured?.width || 0;
  const bHeight = nodeB.height || nodeB.measured?.height || 0;

  const left = Math.max(nodeA.position.x, nodeB.position.x);
  const right = Math.min(nodeA.position.x + aWidth, nodeB.position.x + bWidth);
  const top = Math.max(nodeA.position.y, nodeB.position.y);
  const bottom = Math.min(nodeA.position.y + aHeight, nodeB.position.y + bHeight);

  const overlap = (right < left || bottom < top) ? 0 : (right - left) * (bottom - top);
  overlapCache.set(cacheKey, overlap);
  return overlap;
};

/**
 * Calculate distance between node centers with caching
 */
export const getDistance = (nodeA: any, nodeB: any): number => {
  const cacheKey = `${nodeA.id}-${nodeB.id}`;
  if (distanceCache.has(cacheKey)) {
    return distanceCache.get(cacheKey)!;
  }

  const aWidth = nodeA.width || nodeA.measured?.width || 0;
  const aHeight = nodeA.height || nodeA.measured?.height || 0;
  const bWidth = nodeB.width || nodeB.measured?.width || 0;
  const bHeight = nodeB.height || nodeB.measured?.height || 0;

  const aCenterX = nodeA.position.x + aWidth / 2;
  const aCenterY = nodeA.position.y + aHeight / 2;
  const bCenterX = nodeB.position.x + bWidth / 2;
  const bCenterY = nodeB.position.y + bHeight / 2;

  const distance = Math.sqrt(
    Math.pow(bCenterX - aCenterX, 2) + 
    Math.pow(bCenterY - aCenterY, 2)
  );
  distanceCache.set(cacheKey, distance);
  return distance;
};

/**


/**
 * Calculate potential parent candidate
 */
export const calculateParentCandidate = (
  node: any,
  potentialParentCandidates: any[],
  nodeParentIdMapWithChildIdSet: Map<string, Set<string>>,
  poolOfAllNodes: Map<string, any>,
  rootIndicator: string
): string => {
  // Early return for empty candidates
  if (potentialParentCandidates.length === 0) return rootIndicator;

  // Filter out descendants and self, and only allow existing parents or current parent
  const validCandidates = potentialParentCandidates.filter(
    candidate => !isDescendant(candidate.id, node.id, poolOfAllNodes) && 
                candidate.id !== node.id &&
                (nodeParentIdMapWithChildIdSet.has(candidate.id) || // is already a parent
                 candidate.id === node.parentId) // or is the current parent
  );

  // Only return rootIndicator when there are no valid candidates
  if (validCandidates.length === 0) return rootIndicator;

  // Early return for single candidate
  if (validCandidates.length === 1) return validCandidates[0].id;

  // First check for siblings
  const siblings = validCandidates.filter(candidate => areSiblings(candidate, node));
  if (siblings.length > 0) {
    // For siblings, prefer by overlap then distance then age
    return siblings.reduce((best, current) => {
      const bestOverlap = getOverlapArea(node, best);
      const currentOverlap = getOverlapArea(node, current);
      
      if (currentOverlap > bestOverlap) return current;
      if (currentOverlap < bestOverlap) return best;
      
      // If overlap is equal and both are 0, compare distance
      if (currentOverlap === 0 && bestOverlap === 0) {
        const bestDist = getDistance(node, best);
        const currentDist = getDistance(node, current);
        if (currentDist < bestDist) return current;
        if (currentDist > bestDist) return best;
      }
      
      // If still equal, prefer younger node (higher number in ID)
      const bestNum = parseInt(best.id.match(/\d+/)?.[0] || '0');
      const currentNum = parseInt(current.id.match(/\d+/)?.[0] || '0');
      return currentNum > bestNum ? current : best;
    }).id;
  }

  // Then check if current parent is among valid candidates
  if (node.parentId) {
    const currentParentCandidate = validCandidates.find(
      candidate => candidate.id === node.parentId
    );
    if (currentParentCandidate) {
      return currentParentCandidate.id;
    }
  }

  // If no siblings or current parent, find best remaining candidate
  return validCandidates.reduce((best, current) => {
    const bestOverlap = getOverlapArea(node, best);
    const currentOverlap = getOverlapArea(node, current);
    
    if (currentOverlap > bestOverlap) return current;
    if (currentOverlap < bestOverlap) return best;
    
    // If overlap is equal and both are 0, compare distance
    if (currentOverlap === 0 && bestOverlap === 0) {
      const bestDist = getDistance(node, best);
      const currentDist = getDistance(node, current);
      if (currentDist < bestDist) return current;
      if (currentDist > bestDist) return best;
    }
    
    // If still equal, prefer younger node (higher number in ID)
    const bestNum = parseInt(best.id.match(/\d+/)?.[0] || '0');
    const currentNum = parseInt(current.id.match(/\d+/)?.[0] || '0');
    return currentNum > bestNum ? current : best;
  }).id;
}; 