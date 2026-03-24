/** @format */

import React, { useState, useEffect, useRef, createElement } from 'react';
import { useReactFlow } from '@xyflow/react';
import { FrameJSON, UnifiedNodeInstanceData, ExpandCollapseState } from '../types/FrameJSON';
import { UnifiedStyleManager } from '../utils/UnifiedStyleManager';
import { NodeColorPicker } from '../components/NodeColorPicker';

interface UseUnifiedNodeStateProps {
  id: string;
  data: any;
  config: FrameJSON;
  onMenuAction?: (action: string, nodeData: any) => void;
}

interface UseUnifiedNodeStateReturn {
  nodeInFlow: any;
  nodeData: UnifiedNodeInstanceData;
  expandCollapseState: ExpandCollapseState;
  isHovered: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  styleConfig: any;
  processingStyles: Record<string, any>;
  menuItems: React.ReactNode[];
  nodeLabel: string;
  hasVariants: boolean;
  variantBadgeText: string;
  variantBadgeColor?: string;
  currentDimensions: { width: number; height: number };
  expanded: boolean;
}

/**
 * Custom hook to handle common state logic for unified nodes
 */
export const useUnifiedNodeState = ({
  id,
  data,
  config,
  onMenuAction
}: UseUnifiedNodeStateProps): UseUnifiedNodeStateReturn => {
  const { getNode } = useReactFlow();
  const nodeInFlow = getNode(id);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Safely cast data to UnifiedNodeInstanceData
  const nodeData = (data || {}) as UnifiedNodeInstanceData;
  const dataExpanded = typeof nodeData.expanded === 'boolean' ? nodeData.expanded : false;
  
  // State for expandable nodes
  const [expandCollapseState, setExpandCollapseState] = useState<ExpandCollapseState>({
    expanded: dataExpanded || false,
    childCount: 0,
    dimensions: {
      current: config.defaultDimensions || { width: 200, height: 200 },
      collapsed: config.defaultDimensions || { width: 200, height: 200 },
      expanded: config.defaultDimensions || { width: 200, height: 200 }
    }
  });

  // State for invisible node hover behavior
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (nodeInFlow) {
      const nodeExpanded = typeof nodeInFlow.data?.expanded === 'boolean' ? nodeInFlow.data.expanded : false;
      setExpandCollapseState(prev => ({
        ...prev,
        expanded: nodeExpanded
      }));
    }
  }, [nodeInFlow]);

  // Setup hover detection for invisible nodes
  useEffect(() => {
    if (config.group === "container") {
      const handleMouseMove = (e: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const inside =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        setIsHovered(inside);
      };
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [config.group]);

  // Generate unified styling configuration
  const styleConfig = UnifiedStyleManager.generateStyleConfig(
    config,
    nodeData,
    {
      selected: false, // Will be passed from parent
      expanded: expandCollapseState.expanded,
      isProcessing: false, // Will be passed from parent
      hasError: false, // Will be passed from parent
      isCompleted: false // Will be passed from parent
    }
  );

  // Apply processing state styles
  const processingStyles = UnifiedStyleManager.getProcessingStateStyles(
    styleConfig,
    'idle' // Will be overridden by parent
  );

  // Generate menu items with color picker
  const { setNodes } = useReactFlow();
  const menuItems: React.ReactNode[] = [
    createElement(NodeColorPicker, {
      key: 'color-picker',
      nodeId: id,
      currentColor: styleConfig.backgroundColor,
      onColorChange: (color: string) => {
        setNodes((nodes) =>
          nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, nodeColor: color } } : n
          )
        );
      },
    }),
  ];

  // Empty until the user types — header uses config.defaultLabel as placeholder (see NodeRenderer)
  const nodeLabel =
    nodeData?.instanceData?.label ??
    nodeData?.label ??
    nodeData?.functionName ??
    "";

  // Check if node has variants
  const hasVariants = UnifiedStyleManager.hasVariants(config);
  const variantBadgeText = UnifiedStyleManager.getVariantBadgeText(config, nodeData);
  const variantBadgeColor = styleConfig.badgeColor;

  // Get current dimensions
  const currentDimensions = {
    width: nodeInFlow?.width || expandCollapseState.dimensions.current.width,
    height: nodeInFlow?.height || expandCollapseState.dimensions.current.height
  };

  return {
    nodeInFlow,
    nodeData,
    expandCollapseState,
    isHovered,
    containerRef,
    styleConfig,
    processingStyles,
    menuItems,
    nodeLabel,
    hasVariants,
    variantBadgeText,
    variantBadgeColor,
    currentDimensions,
    expanded: expandCollapseState.expanded
  };
}; 