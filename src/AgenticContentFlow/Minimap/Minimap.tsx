import { useEffect, useMemo, useCallback } from "react";
import { useMinimapStore } from "./store/useMinimapStore";
import { MiniMap, Node } from "@xyflow/react";
import { registerControl } from "../Controls";
import MinimapToggle from "./Controls/MinimapToggle";
import { CONTROL_PRIORITIES, CONTROL_TYPES } from "../constants";
import { useNodeContext } from "../Node/context/useNodeContext";
import { UnifiedStyleManager } from "../Node/factory/utils/UnifiedStyleManager";
import { getNodeType } from "../Node/store/unifiedNodeTypeStoreInitializer";

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

  // Helper function to get parent node color using UnifiedStyleManager
  const getParentNodeColor = useCallback((node: Node): string | null => {
    if (!node.parentId) return null;
    
    const parentNode = nodeMap.get(node.parentId);
    if (!parentNode) return null;
    
    // Get parent node config and calculate color using UnifiedStyleManager
    const parentConfig = getNodeType(parentNode.type || '');
    if (parentConfig) {
      const parentStyleConfig = UnifiedStyleManager.generateStyleConfig(
        parentConfig,
        parentNode.data,
        {
          selected: parentNode.selected || false,
          expanded: Boolean(parentNode.data?.expanded),
          isProcessing: parentNode.data?.processState === 'processing',
          hasError: parentNode.data?.processState === 'error',
          isCompleted: parentNode.data?.processState === 'completed'
        }
      );
      return UnifiedStyleManager.calculateMinimapColor(parentConfig, parentStyleConfig);
    }
    
    // If parent doesn't have a config, recursively check its parent
    return getParentNodeColor(parentNode);
  }, [nodeMap]);

  // Helper function to check if node should inherit parent's color
  const shouldInheritParentColor = useCallback((node: Node): boolean => {
    // Invisible nodes should inherit parent colors
    if (node.type === 'invisiblenode') return true;
    
    // Get node config and check if it has transparent background
    const config = getNodeType(node.type || '');
    if (config) {
      const styleConfig = UnifiedStyleManager.generateStyleConfig(
        config,
        node.data,
        {
          selected: node.selected || false,
          expanded: Boolean(node.data?.expanded),
          isProcessing: node.data?.processState === 'processing',
          hasError: node.data?.processState === 'error',
          isCompleted: node.data?.processState === 'completed'
        }
      );
      const minimapColor = UnifiedStyleManager.calculateMinimapColor(config, styleConfig);
      if (minimapColor === '#f3f4f6') return true; // Default transparent gray
    }
    
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
    
    // Get node config and calculate color using UnifiedStyleManager
    const config = getNodeType(node.type || '');
    if (config) {
      const styleConfig = UnifiedStyleManager.generateStyleConfig(
        config,
        node.data,
        {
          selected: node.selected || false,
          expanded: Boolean(node.data?.expanded),
          isProcessing: node.data?.processState === 'processing',
          hasError: node.data?.processState === 'error',
          isCompleted: node.data?.processState === 'completed'
        }
      );
      return UnifiedStyleManager.calculateMinimapColor(config, styleConfig);
    }
    
    // Fallback to default colors
    return node.selected ? 'var(--color-primary-foreground)' : 'var(--color-card)';
  }, [getParentNodeColor, shouldInheritParentColor, getRootInvisibleNodeColor]);
  
  const miniMapComponent = useMemo(
    () =>
      showMiniMap ? (
        <MiniMap
          nodeStrokeWidth={20}
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
