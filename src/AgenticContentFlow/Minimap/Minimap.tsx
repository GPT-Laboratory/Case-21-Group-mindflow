import { useEffect, useMemo, useCallback } from "react";
import { useMinimapStore } from "./store/useMinimapStore";
import { MiniMap, Node } from "@xyflow/react";
import { registerControl } from "../Controls";
import MinimapToggle from "./Controls/MinimapToggle";
import { CONTROL_PRIORITIES, CONTROL_TYPES } from "../constants";
import { useNodeContext } from "../Node/context/useNodeContext";

// Custom MiniMap wrapper
const CustomMiniMap = () => {
  const { showMiniMap } = useMinimapStore();
  const { nodeMap } = useNodeContext();

  useEffect(() => {
    registerControl(
      CONTROL_TYPES.NAVIGATION,
      CONTROL_TYPES.MINDMAP,
      "MINIMAP_TOGGLE",
      MinimapToggle,
      {},
      CONTROL_PRIORITIES.NAVIGATION
    );
  }, []);

  // Add CSS for minimap styling
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Add a subtle pattern to minimap nodes to make them more identifiable */
      .react-flow__minimap-node {
        stroke-dasharray: 2,2;
        stroke-opacity: 0.8;
      }
      
      /* Add a subtle inner border to create visual interest */
      .react-flow__minimap-node {
        filter: drop-shadow(0 0 1px rgba(0,0,0,0.1));
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Helper function to get parent node color
  const getParentNodeColor = useCallback((node: Node): string | null => {
    if (!node.parentId) return null;
    
    const parentNode = nodeMap.get(node.parentId);
    if (!parentNode) return null;
    
    // Check if parent has a color
    const parentMinimapColor = parentNode.data?.minimapColor;
    const parentNodeColor = parentNode.data?.nodeColor;
    
    if (parentMinimapColor) return parentMinimapColor as string;
    if (parentNodeColor) return parentNodeColor as string;
    
    // If parent doesn't have a color, recursively check its parent
    return getParentNodeColor(parentNode);
  }, [nodeMap]);

  // Helper function to check if node should inherit parent's color
  const shouldInheritParentColor = useCallback((node: Node): boolean => {
    // Invisible nodes should inherit parent colors
    if (node.type === 'invisiblenode') return true;
    
    // Nodes with transparent backgrounds should inherit parent colors
    const minimapColor = node.data?.minimapColor;
    if (minimapColor === '#f3f4f6') return true; // Default transparent gray
    
    return false;
  }, []);

  // Helper function to get appropriate color for root invisible nodes
  const getRootInvisibleNodeColor = useCallback((node: Node): string => {
    // Root invisible nodes (no parent) should use white color
    if (node.type === 'invisiblenode' && !node.parentId) {
      return '#ffffff'; // white
    }
    return '';
  }, []);

  // Memoized color functions
  const getNodeStrokeColor = useCallback((node: Node): string => {
    const processState = node.data?.processState;
    if (processState === 'processing') return '#3b82f6';
    if (processState === 'completed') return '#10b981';
    if (processState === 'error') return '#ef4444';
    return node.selected ? 'var(--color-primary)' : 'var(--color-border)';
  }, []);

  const getNodeColor = useCallback((node: Node): string => {
    // Check for root invisible node color first
    const rootColor = getRootInvisibleNodeColor(node);
    if (rootColor) return rootColor;
    
    // If node should inherit parent color, check for parent color first
    if (shouldInheritParentColor(node)) {
      const parentColor = getParentNodeColor(node);
      if (parentColor) return parentColor;
    }
    
    const minimapColor = node.data?.minimapColor;
    const nodeColor = node.data?.nodeColor;
    
    // If node has its own explicit color (not the default transparent gray), use it
    if (minimapColor && minimapColor !== '#f3f4f6') return minimapColor as string;
    if (nodeColor) return nodeColor as string;
    
    // Fallback to the calculated minimap color or default colors
    if (minimapColor) return minimapColor as string;
    return node.selected ? 'var(--color-primary-foreground)' : 'var(--color-card)';
  }, [getParentNodeColor, shouldInheritParentColor, getRootInvisibleNodeColor]);
  
  const miniMapComponent = useMemo(
    () =>
      showMiniMap ? (
        <MiniMap
          nodeStrokeWidth={4}
          nodeStrokeColor={getNodeStrokeColor}
          nodeColor={getNodeColor}
          zoomable
          pannable
        />
      ) : null,
    [showMiniMap, getNodeStrokeColor, getNodeColor]
  );

  return miniMapComponent;
};

export default CustomMiniMap;
