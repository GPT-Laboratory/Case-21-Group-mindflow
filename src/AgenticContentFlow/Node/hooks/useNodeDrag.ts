/** @format */
import { useCallback, useState, useRef } from "react";
import { Node, useReactFlow, useViewport } from "@xyflow/react";
import { NodeData } from "../../types";
import { updateNodeExtentInLocalNodes } from "./utils/dragUtils";
import { useDragWorker } from "./useDragWorker";
import { calculateParentCandidate as syncCalculateParentCandidate } from "./utils/sharedDragUtils";

// Define the root indicator string as a constant
const ROOT_INDICATOR = "no-parent";

/**
 * Hook for handling node drag operations with Web Worker support
 */
export const useNodeDrag = (
  nodes: Node<NodeData>[],
  trackUpdateNodes: (nodes: Node<NodeData>[], previousNodes: Node<NodeData>[], description: string) => void,
  nodeMap: Map<string, Node<NodeData>>,
  nodeParentIdMapWithChildIdSet: Map<string, Set<string>>,
  onDraggingStateChange?: (isDragging: boolean) => void
) => {
  const { updateNode, getIntersectingNodes } = useReactFlow();
  const { x, y, zoom } = useViewport();
  const { calculateIntersections, calculateParentCandidate } = useDragWorker();

  const [localNodes, setLocalNodes] = useState<Node<NodeData>[]>([]);
  const [currentParentCandidateId, setCurrentParentCandidateId] = useState<string | null>(null);
  const isDraggingRef = useRef(false);

  // Handle drag start
  const onNodeDragStart = useCallback(
    (event: React.MouseEvent, draggedNode: Node<NodeData>, draggedNodes: Node<NodeData>[]) => {
      isDraggingRef.current = true;
      onDraggingStateChange?.(true);
      
      // Create a set of dragged node IDs for efficient lookup
      const draggedNodeIds = new Set(draggedNodes.map(node => node.id));
      
      // Simply update the nodes with selection and highlighting
      const updatedNodes = nodes.map(node => ({
        ...node,
        selected: draggedNodeIds.has(node.id),
        data: {
          ...node.data,
          highlighted: false
        }
      }));

      setLocalNodes(updatedNodes);
    },
    [nodes, onDraggingStateChange]
  );

  /**
   * Helper function to update node highlighting
   */
  const updateNodeHighlight = useCallback((nodeId: string, highlighted: boolean) => {
    const node = nodeMap.get(nodeId);
    if (!node || !isDraggingRef.current) return null;
    const updatedNode = {
      ...node,
      data: {
        ...node.data,
        highlighted
      },
    } as Node<NodeData>;

    setLocalNodes(prev =>
      prev.map(n => n.id === nodeId ? updatedNode : n)
    );

  }, [nodeMap, setLocalNodes, localNodes]);

  /**
   * Optimized onNodeDrag with Web Worker support
   */
  const onNodeDrag = useCallback(
    async (event: React.MouseEvent, draggedNode: Node<NodeData>, draggedNodes: Node<NodeData>[]) => {
      // Handle breaking free from parent for all dragged nodes
      const mousePosition = {
        x: (event.clientX - x) / zoom,
        y: (event.clientY - y) / zoom
      };
      
      draggedNodes.forEach((dn) => {
        const parent = nodeMap.get(dn.parentId || "");
        if (!parent) return;

        const shouldBreakFree = getDragResistance(
          dn,
          parent,
          mousePosition
        );
        if (shouldBreakFree) {
          setLocalNodes(prev =>
            updateNodeExtentInLocalNodes(prev, dn.id, true)
          );
        }
      });

      // Use Web Worker for expensive intersection calculations
      try {
        const intersectingNodes = await calculateIntersections(draggedNode, nodes, { x, y, zoom });
        
        // Use Web Worker for parent candidate calculation
        const potentialParentId = await calculateParentCandidate(
          draggedNode,
          intersectingNodes,
          nodeParentIdMapWithChildIdSet,
          nodeMap,
          ROOT_INDICATOR
        );

        // Update highlighting based on worker results
        if (potentialParentId !== currentParentCandidateId) {
          // Clear previous highlight
          if (currentParentCandidateId && currentParentCandidateId !== ROOT_INDICATOR) {
            updateNodeHighlight(currentParentCandidateId, false);
          }
          
          // Set new highlight
          if (potentialParentId !== ROOT_INDICATOR) {
            updateNodeHighlight(potentialParentId, true);
          }
          
          setCurrentParentCandidateId(potentialParentId);
        }
      } catch (error) {
        console.error('Error in drag worker calculations:', error);
        // Fallback to synchronous calculation if worker fails
        // (You could implement fallback logic here if needed)
      }
    },
    [
      nodeMap,
      currentParentCandidateId,
      updateNode,
      localNodes,
      x,
      y,
      zoom,
      nodes,
      nodeParentIdMapWithChildIdSet,
      calculateIntersections,
      calculateParentCandidate,
      updateNodeHighlight
    ]
  );

  /**
   * Handle drag stop
   */
  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, draggedNode: Node<NodeData>, draggedNodes: Node<NodeData>[]) => {
      isDraggingRef.current = false;
      onDraggingStateChange?.(false);

      // Clear any current highlighting
      if (currentParentCandidateId && currentParentCandidateId !== ROOT_INDICATOR) {
        updateNodeHighlight(currentParentCandidateId, false);
      }
      setCurrentParentCandidateId(null);

      const updatedLocalNodes = draggedNodes;

      // Use synchronous calculations for drag stop (like the old version) to prevent glitching
      try {

        const intersectingNodes = getIntersectingNodes(draggedNode);

    
        const potentialParentId = syncCalculateParentCandidate(
          draggedNode,
          intersectingNodes,
          nodeParentIdMapWithChildIdSet,
          nodeMap,
          ROOT_INDICATOR
        );

        // Update parent relationships for all dragged nodes
        if (potentialParentId && potentialParentId !== ROOT_INDICATOR) {
          // Clear highlight on the candidate
          updatedLocalNodes.forEach(localNode => {
            if (localNode.id === potentialParentId) {
              localNode.data.highlighted = false;
            }
            // Assign new parent to each dragged node
            if (draggedNodes.some(dn => dn.id === localNode.id)) {
              localNode.parentId = potentialParentId;
              localNode.extent = "parent";
            }
          });
        } else {
          // If no parent candidate, make each dragged node a root
          updatedLocalNodes.forEach(localNode => {
            if (draggedNodes.some(dn => dn.id === localNode.id) && localNode.parentId) {
              localNode.parentId = undefined;
              delete localNode.extent;
            }
          });
        }
      } catch (error) {
        console.error('Error in synchronous drag stop calculations:', error);
        // Fallback: make all dragged nodes roots
        updatedLocalNodes.forEach(localNode => {
          if (draggedNodes.some(dn => dn.id === localNode.id) && localNode.parentId) {
            localNode.parentId = undefined;
            delete localNode.extent;
          }
        });
      }

      // Commit changes to node state
      if (updatedLocalNodes.length > 0) {
        // Update the nodes in the store
        trackUpdateNodes(updatedLocalNodes, nodes, "Update nodes on drag stop");
        setLocalNodes([]);
      }
    },
    [localNodes, nodes, currentParentCandidateId, nodeParentIdMapWithChildIdSet, nodeMap, trackUpdateNodes, updateNodeHighlight, onDraggingStateChange, x, y, zoom]
  );

  return {
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
    isDraggingRef,
    localNodes,
    setLocalNodes,
  };
};

/**
 * Helper function to determine if a node should break free from its parent
 */
const getDragResistance = (
  node: Node<NodeData>,
  parent: Node<NodeData>,
  mousePosition: { x: number; y: number }
): boolean => {
  const parentWidth = parent.width || parent.measured?.width || 0;
  const parentHeight = parent.height || parent.measured?.height || 0;
  const nodeWidth = node.width || node.measured?.width || 0;
  const nodeHeight = node.height || node.measured?.height || 0;

  const parentLeft = parent.position.x;
  const parentRight = parentLeft + parentWidth;
  const parentTop = parent.position.y;
  const parentBottom = parentTop + parentHeight;

  const nodeLeft = mousePosition.x - nodeWidth / 2;
  const nodeRight = mousePosition.x + nodeWidth / 2;
  const nodeTop = mousePosition.y - nodeHeight / 2;
  const nodeBottom = mousePosition.y + nodeHeight / 2;

  // Check if the node is completely outside the parent bounds
  return (
    nodeRight < parentLeft ||
    nodeLeft > parentRight ||
    nodeBottom < parentTop ||
    nodeTop > parentBottom
  );
};