import { useState, useCallback, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useNodeContext } from '../../context/useNodeContext';
import { useTransaction } from '@jalez/react-state-history';
import { createNodeFromTemplate } from '../../registry/nodeTypeRegistry';
import { generateUniqueId } from '../../hooks/utils/nodeUtils';

interface UseNodePlacementReturn {
  isPlacingNode: boolean;
  mousePosition: { x: number; y: number };
  isOverFlow: boolean;
  startPlacement: (nodeType: string) => void;
  cancelPlacement: () => void;
  handleFlowClick: (event: React.MouseEvent) => void;
}

export const useNodePlacement = (): UseNodePlacementReturn => {
  const { addNode } = useNodeContext();
  const { screenToFlowPosition } = useReactFlow();
  const { withTransaction } = useTransaction();

  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
  const [isPlacingNode, setIsPlacingNode] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isOverFlow, setIsOverFlow] = useState(false);

  const startPlacement = useCallback((nodeType: string) => {
    setSelectedNodeType(nodeType);
    setIsPlacingNode(true);
  }, []);

  const cancelPlacement = useCallback(() => {
    setSelectedNodeType(null);
    setIsPlacingNode(false);
  }, []);

  const handleFlowClick = useCallback((event: React.MouseEvent) => {
    if (!isPlacingNode || !selectedNodeType) return;

    // Get the click position in flow coordinates
    const rect = event.currentTarget.getBoundingClientRect();
    const clickPosition = screenToFlowPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });

    // Create a new node at the clicked position
    const newNodeId = generateUniqueId("node");
    const newNode = createNodeFromTemplate(selectedNodeType, {
      id: newNodeId,
      position: clickPosition,
      details: "Add details about this concept",
    });

    if (newNode) {
      // Adjust position so the center of the node is at the click position
      // Get the node dimensions (default to 200x100 if not specified)
      const nodeWidth = Number(newNode.style?.width) || 200;
      const nodeHeight = Number(newNode.style?.height) || 100;
      
      // Calculate the offset to center the node
      const centerOffsetX = nodeWidth / 2;
      const centerOffsetY = nodeHeight / 2;
      
      // Update the position to center the node at the click point
      const centeredPosition = {
        x: clickPosition.x - centerOffsetX,
        y: clickPosition.y - centerOffsetY,
      };

      const centeredNode = {
        ...newNode,
        position: centeredPosition,
      };

      withTransaction(() => {
        // Add the new node only - no automatic connections
        addNode(centeredNode);
      }, "NodeCreationControl/Add");
    }

    // Reset the placing state
    setSelectedNodeType(null);
    setIsPlacingNode(false);
  }, [isPlacingNode, selectedNodeType, screenToFlowPosition, addNode, withTransaction]);

  // Track mouse position and flow hover state
  useEffect(() => {
    if (isPlacingNode) {
      const handleMouseMove = (event: MouseEvent) => {
        setMousePosition({ x: event.clientX, y: event.clientY });
        
        // Check if mouse is over the flow pane
        const flowPane = document.querySelector('.react-flow__pane') as HTMLElement;
        if (flowPane) {
          const rect = flowPane.getBoundingClientRect();
          const isOver = 
            event.clientX >= rect.left &&
            event.clientX <= rect.right &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom;
          setIsOverFlow(isOver);
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isPlacingNode]);

  // Add click handler to the flow pane when placing a node
  useEffect(() => {
    if (isPlacingNode) {
      const flowPane = document.querySelector('.react-flow__pane') as HTMLElement;
      if (flowPane) {
        flowPane.addEventListener('click', handleFlowClick as any);
        flowPane.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            cancelPlacement();
          }
        });
        
        // Add visual feedback - change cursor to plus sign
        flowPane.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 20 20\'><circle cx=\'10\' cy=\'10\' r=\'8\' fill=\'%233b82f6\' stroke=\'white\' stroke-width=\'2\'/><text x=\'10\' y=\'14\' text-anchor=\'middle\' fill=\'white\' font-size=\'12\' font-weight=\'bold\'>+</text></svg>") 10 10, crosshair';
        
        return () => {
          flowPane.removeEventListener('click', handleFlowClick as any);
          flowPane.style.cursor = 'default';
        };
      }
    }
  }, [isPlacingNode, handleFlowClick, cancelPlacement]);

  return {
    isPlacingNode,
    mousePosition,
    isOverFlow,
    startPlacement,
    cancelPlacement,
    handleFlowClick
  };
}; 