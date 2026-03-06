import { useCallback, useRef, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { NodeData } from '../../types';

// Import the worker using Vite's ?worker suffix
import DragWorker from './workers/dragWorker.ts?worker';

interface UseDragWorkerReturn {
  calculateIntersections: (draggedNode: Node<NodeData>, allNodes: Node<NodeData>[], viewport: { x: number; y: number; zoom: number }) => Promise<Node<NodeData>[]>;
  calculateParentCandidate: (node: Node<NodeData>, potentialParentCandidates: Node<NodeData>[], nodeParentIdMapWithChildIdSet: Map<string, Set<string>>, poolOfAllNodes: Map<string, Node<NodeData>>, rootIndicator: string) => Promise<string>;
}

export const useDragWorker = (): UseDragWorkerReturn => {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequestsRef = useRef<Map<string, { resolve: Function; reject: Function }>>(new Map());

  useEffect(() => {
    // Create the worker
    workerRef.current = new DragWorker();

    // Set up message handler
    workerRef.current.onmessage = (event) => {
      const { type, payload } = event.data;
      
      // Find the pending request and resolve/reject it
      const pendingRequest = pendingRequestsRef.current.get(type);
      if (pendingRequest) {
        pendingRequestsRef.current.delete(type);
        pendingRequest.resolve(payload);
      }
    };

    // Set up error handler
    workerRef.current.onerror = (error) => {
      console.error('Drag worker error:', error);
      // Reject all pending requests
      pendingRequestsRef.current.forEach(({ reject }) => reject(error));
      pendingRequestsRef.current.clear();
    };

    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      pendingRequestsRef.current.clear();
    };
  }, []);

  const calculateIntersections = useCallback((
    draggedNode: Node<NodeData>, 
    allNodes: Node<NodeData>[], 
    viewport: { x: number; y: number; zoom: number }
  ): Promise<Node<NodeData>[]> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      // Store the promise handlers
      pendingRequestsRef.current.set('intersectionsCalculated', { resolve, reject });

      // Send the calculation request
      workerRef.current.postMessage({
        type: 'calculateIntersections',
        payload: { draggedNode, allNodes, viewport }
      });
    });
  }, []);

  const calculateParentCandidate = useCallback((
    node: Node<NodeData>,
    potentialParentCandidates: Node<NodeData>[],
    nodeParentIdMapWithChildIdSet: Map<string, Set<string>>,
    poolOfAllNodes: Map<string, Node<NodeData>>,
    rootIndicator: string
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      // Convert Maps to arrays for serialization
      const nodeParentIdMapWithChildIdSetArray: [string, string[]][] = Array.from(nodeParentIdMapWithChildIdSet.entries()).map(
        ([key, value]) => [key, Array.from(value)]
      );
      const poolOfAllNodesArray: [string, Node<NodeData>][] = Array.from(poolOfAllNodes.entries());

      // Store the promise handlers
      pendingRequestsRef.current.set('parentCandidateCalculated', { resolve, reject });

      // Send the calculation request
      workerRef.current.postMessage({
        type: 'calculateParentCandidate',
        payload: { 
          node, 
          potentialParentCandidates, 
          nodeParentIdMapWithChildIdSet: nodeParentIdMapWithChildIdSetArray, 
          poolOfAllNodes: poolOfAllNodesArray, 
          rootIndicator 
        }
      });
    });
  }, []);

  return {
    calculateIntersections,
    calculateParentCandidate
  };
}; 