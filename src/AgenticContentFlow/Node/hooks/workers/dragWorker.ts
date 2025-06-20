// Web Worker for expensive drag calculations
// This runs in a separate thread to keep the UI responsive

// Import shared utilities (these will be bundled with the worker)
import { calculateIntersections, calculateParentCandidate } from '../utils/sharedDragUtils';

interface DragWorkerMessage {
  type: 'calculateIntersections' | 'calculateParentCandidate';
  payload: any;
}

interface IntersectionCalculationPayload {
  draggedNode: any;
  allNodes: any[];
  viewport: { x: number; y: number; zoom: number };
}

interface ParentCandidatePayload {
  node: any;
  potentialParentCandidates: any[];
  nodeParentIdMapWithChildIdSet: [string, string[]][]; // Converted from Map for serialization
  poolOfAllNodes: [string, any][]; // Converted from Map for serialization
  rootIndicator: string;
}

// Helper function to check if a node is a descendant
const isDescendant = (potentialChildId: string, ancestorId: string, poolOfAllNodes: Map<string, any>, visited = new Set<string>()): boolean => {
  if (potentialChildId === ancestorId) return true;
  if (visited.has(potentialChildId)) return false;
  visited.add(potentialChildId);

  const nodeParentId = poolOfAllNodes.get(potentialChildId)?.parentId;
  if (!nodeParentId) return false;
  
  return isDescendant(nodeParentId, ancestorId, poolOfAllNodes, visited);
};

// Helper function to check if nodes are siblings
const areSiblings = (nodeA: any, nodeB: any): boolean => {
  return nodeA.parentId != null && nodeA.parentId === nodeB.parentId;
};

// Calculate overlap area between two nodes
const getOverlapArea = (nodeA: any, nodeB: any): number => {
  const aWidth = nodeA.width || nodeA.measured?.width || 0;
  const aHeight = nodeA.height || nodeA.measured?.height || 0;
  const bWidth = nodeB.width || nodeB.measured?.width || 0;
  const bHeight = nodeB.height || nodeB.measured?.height || 0;

  const left = Math.max(nodeA.position.x, nodeB.position.x);
  const right = Math.min(nodeA.position.x + aWidth, nodeB.position.x + bWidth);
  const top = Math.max(nodeA.position.y, nodeB.position.y);
  const bottom = Math.min(nodeA.position.y + aHeight, nodeB.position.y + bHeight);

  return (right < left || bottom < top) ? 0 : (right - left) * (bottom - top);
};

// Calculate distance between node centers
const getDistance = (nodeA: any, nodeB: any): number => {
  const aWidth = nodeA.width || nodeA.measured?.width || 0;
  const aHeight = nodeA.height || nodeA.measured?.height || 0;
  const bWidth = nodeB.width || nodeB.measured?.width || 0;
  const bHeight = nodeB.height || nodeB.measured?.height || 0;

  const aCenterX = nodeA.position.x + aWidth / 2;
  const aCenterY = nodeA.position.y + aHeight / 2;
  const bCenterX = nodeB.position.x + bWidth / 2;
  const bCenterY = nodeB.position.y + bHeight / 2;

  return Math.sqrt(
    Math.pow(bCenterX - aCenterX, 2) + 
    Math.pow(bCenterY - aCenterY, 2)
  );
};

// Handle messages from the main thread
self.onmessage = (event: MessageEvent<DragWorkerMessage>) => {
  const { type, payload } = event.data;
  
  try {
    switch (type) {
      case 'calculateIntersections': {
        const { draggedNode, allNodes, viewport } = payload as IntersectionCalculationPayload;
        const intersectingNodes = calculateIntersections(draggedNode, allNodes, viewport);
        self.postMessage({
          type: 'intersectionsCalculated',
          payload: intersectingNodes
        });
        break;
      }
      
      case 'calculateParentCandidate': {
        const { node, potentialParentCandidates, nodeParentIdMapWithChildIdSet, poolOfAllNodes, rootIndicator } = payload as ParentCandidatePayload;
        
        // Convert arrays back to Maps for efficient lookup
        const nodeParentIdMapWithChildIdSetMap = new Map(
          nodeParentIdMapWithChildIdSet.map(([key, value]) => [key, new Set(value)])
        );
        const poolOfAllNodesMap = new Map(poolOfAllNodes);
        
        const parentCandidateId = calculateParentCandidate(
          node, 
          potentialParentCandidates, 
          nodeParentIdMapWithChildIdSetMap, 
          poolOfAllNodesMap, 
          rootIndicator
        );
        
        self.postMessage({
          type: 'parentCandidateCalculated',
          payload: parentCandidateId
        });
        break;
      }
      
      default:
        console.warn('Unknown message type in drag worker:', type);
    }
  } catch (error) {
    console.error('Error in drag worker:', error);
    self.postMessage({
      type: 'error',
      payload: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 