/** @format */

import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { UnifiedStyleManager } from '../utils/UnifiedStyleManager';
import { useUnifiedNodeState } from '../hooks/useUnifiedNodeState';
import { BaseNodeRenderer } from './NodeRenderer';
import { getNodeType } from '../../store/unifiedNodeTypeStoreInitializer';
import { useNodeProcess } from '../../../Process/useNodeProcess';

interface UnifiedNodeWrapperProps extends NodeProps {
  customContent?: React.ReactNode;
  onMenuAction?: (action: string, nodeData: any) => void;
  processingState?: 'idle' | 'processing' | 'completed' | 'error';
  isProcessing?: boolean;
  isCompleted?: boolean;
  hasError?: boolean;
  // Process control props
  isLooping?: boolean;
  loopInterval?: number;
  requiresUserApproval?: boolean;
  autoApprove?: boolean;
  waitingForApproval?: boolean;
  onPlay?: () => void;
  onStop?: () => void;
  onLoopToggle?: () => void;
  onLoopIntervalChange?: (interval: number) => void;
  onApprove?: () => void;
  onAutoApproveToggle?: () => void;
  disabled?: boolean;
}

/**
 * Universal wrapper component for all node types
 * Frame-agnostic: only distinguishes between cell-like and container-like behavior
 */
export const UnifiedNodeWrapper: React.FC<UnifiedNodeWrapperProps> = ({
  id,
  type,
  data,
  selected,
  customContent,
  onMenuAction,
  processingState = 'idle',
  isProcessing = false,
  isCompleted = false,
  hasError = false,
  // Process control props
  isLooping = false,
  loopInterval = 5,
  requiresUserApproval = false,
  autoApprove = false,
  waitingForApproval = false,
  onPlay,
  onStop,
  onLoopToggle,
  onLoopIntervalChange,
  onApprove,
  onAutoApproveToggle,
  disabled = false
}) => {
  // Get React Flow functions for building node maps
  const { getEdges, getNode, setNodes } = useReactFlow();
  
  // Look up the config from the unified store using the type prop
  const config = type && typeof type === 'string' ? getNodeType(type) : null;

  // Early return if config is undefined (unregistered node type)
  if (!config) {
    console.warn(`UnifiedNodeWrapper: No config found for node type "${type || 'unknown'}" (id: ${id}). This node type is not registered in the unified system.`);
    return null;
  }

  // Use the process execution system for cell-like nodes
  const { 
    isProcessing: processIsProcessing, 
    isCompleted: processIsCompleted, 
    hasError: processHasError,
    startProcess, 
    completeProcess, 
    setError,
    availableData,
    // Approval system
    approvalStatus,
    autoApprove: processAutoApprove,
    pendingData,
    setApprovalStatus,
    setAutoApprove,
    setPendingApproval,
    approveAndContinue,
    declineAndStop
  } = useNodeProcess({ 
    nodeId: id,
    autoStartOnData: true,
    enhancedCompleteProcess: true
  });

  // Auto-execute process when data is received (for downstream nodes)
  React.useEffect(() => {
    if (availableData && processIsProcessing && !processIsCompleted && !processHasError) {
      console.log(`🔧 Auto-executing process for downstream node ${id} with data:`, availableData);
      executeProcessFunction(availableData);
    }
  }, [availableData, processIsProcessing, processIsCompleted, processHasError, id]);

  // Extract process execution logic into a reusable function
  const executeProcessFunction = React.useCallback(async (incomingData: any) => {
    if (!config.process?.templateCode && !data?.instanceCode) {
      console.warn(`Node ${id} does not have a process function`);
      completeProcess(incomingData); // Pass through data if no process function
      return;
    }

    try {
      console.log(`🔧 Unified node ${config.nodeType} (${id}) executing process...`);
      
      // Build proper target and source maps using React Flow
      const edges = getEdges();
      const targetMap = new Map();
      const sourceMap = new Map();
      const edgeMap = new Map();
      const edgeMetadataMap = new Map();
      
      // Build target map (outgoing edges)
      edges
        .filter(edge => edge.source === id)
        .forEach(edge => {
          const targetNode = getNode(edge.target);
          if (targetNode) {
            targetMap.set(edge.target, targetNode);
            edgeMap.set(edge.target, edge);
            if (edge.data) {
              edgeMetadataMap.set(edge.target, edge.data);
            }
          }
        });
      
      // Build source map (incoming edges)
      edges
        .filter(edge => edge.target === id)
        .forEach(edge => {
          const sourceNode = getNode(edge.source);
          if (sourceNode) {
            sourceMap.set(edge.source, sourceNode);
          }
        });
      
      console.log(`🗺️ Built node maps for ${id}:`, {
        targets: targetMap.size,
        sources: sourceMap.size,
        targetIds: Array.from(targetMap.keys()),
        sourceIds: Array.from(sourceMap.keys())
      });
      
      // Combine templateData and instanceData for the process function
      const templateData = data?.templateData || {};
      const instanceData = data?.instanceData || {};
      const templateDefaults = config.process?.parameters || {};
      
      // Build the process node data by combining all sources
      const processNodeData: Record<string, any> = {
        ...templateDefaults,           // Start with template defaults
        ...templateData,              // Override with template data
        ...instanceData,              // Override with instance data
        // Include core node properties
        label: data?.label,
        details: data?.details,
        nodeType: config.nodeType,
        category: config.category,
        group: config.group
      };
      
      console.log(`🔧 Process node data built:`, {
        templateDefaults: Object.keys(templateDefaults),
        templateData: Object.keys(templateData),
        instanceData: Object.keys(instanceData),
        finalProcessData: Object.keys(processNodeData),
        hasUrl: !!processNodeData.url,
        url: processNodeData.url,
        method: processNodeData.method
      });
      
      // Execute the process function directly
      const processCode = data?.instanceCode || config.process?.templateCode || '';
      const processFunction = new Function(`
        'use strict';
        return (${processCode});
      `)();
      
      console.log(`🔧 Process function inputs:`, {
        incomingData,
        nodeData: processNodeData,
        params: config.process?.parameters || {},
        targetMapSize: targetMap.size,
        sourceMapSize: sourceMap.size
      });
      
      const result = await processFunction(
        incomingData, // Use the actual incoming data
        processNodeData, // Use the combined process node data
        config.process?.parameters || {}, // Parameters
        targetMap,
        sourceMap
      );
      
      console.log(`🔧 Process function execution completed, result:`, result);
      console.log(`🔧 Result type:`, typeof result);
      console.log(`🔧 Result is undefined:`, result === undefined);
      console.log(`🔧 Result is null:`, result === null);
      
      completeProcess(result);
    } catch (error) {
      console.error(`❌ Unified node ${config.nodeType} (${id}) process execution failed:`, error);
      console.error(`❌ Process error stack:`, (error as Error).stack);
      setError(`Failed to execute: ${error}`);
    }
  }, [config, data, completeProcess, setError, id, getEdges, getNode]);

  // Use custom hook for common state logic
  const {
    nodeInFlow,
    styleConfig,
    processingStyles,
    menuItems,
    nodeLabel,
    hasVariants,
    variantBadgeText,
    variantBadgeColor,
    currentDimensions,
    expanded,
    isHovered,
    containerRef
  } = useUnifiedNodeState({
    id,
    data,
    config,
    onMenuAction
  });

  // Early return if node not found
  if (!nodeInFlow) {
    console.error(`Node with id ${id} not found in store.`);
    return null;
  }

  // Handle manual execution for cell-like nodes
  const handleManualExecution = React.useCallback(async () => {
    console.log('🚀 handleManualExecution called for node:', id, 'type:', config.nodeType);
    
    if (!config.process?.templateCode && !data?.instanceCode) {
      console.warn(`Node ${id} does not have a process function`);
      return;
    }

    try {
      startProcess({ action: 'manual_execution', source: config.nodeType });
      
      // Use the shared process execution function
      await executeProcessFunction({ action: 'manual_execution', source: config.nodeType });
    } catch (error) {
      console.error(`❌ Unified node ${config.nodeType} (${id}) manual execution failed:`, error);
      setError(`Failed to execute: ${error}`);
    }
  }, [config, data, startProcess, setError, id, executeProcessFunction]);

  // Handle approval system
  const handleApprove = React.useCallback(() => {
    approveAndContinue();
  }, [approveAndContinue]);

  const handleAutoApproveToggle = React.useCallback(() => {
    setAutoApprove(!processAutoApprove);
  }, [setAutoApprove, processAutoApprove]);

  // Update style config with current state
  const updatedStyleConfig = UnifiedStyleManager.generateStyleConfig(
    config,
    data,
    {
      selected: Boolean(selected),
      expanded,
      isProcessing: processIsProcessing,
      hasError: processHasError,
      isCompleted: processIsCompleted
    }
  );

  // Update processing styles with current state
  const updatedProcessingStyles = UnifiedStyleManager.getProcessingStateStyles(
    updatedStyleConfig,
    processingState
  );

  // Update node data with current background color for minimap
  React.useEffect(() => {
    const currentColor = data?.nodeColor;
    const newColor = updatedStyleConfig.backgroundColor;
    
    if (currentColor !== newColor) {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  nodeColor: newColor
                }
              }
            : node
        )
      );
    }
  }, [updatedStyleConfig.backgroundColor, data?.nodeColor, id, setNodes]);

  // Calculate minimap-specific color that represents actual visual appearance
  React.useEffect(() => {
    const currentMinimapColor = data?.minimapColor;
    const minimapColor = UnifiedStyleManager.calculateMinimapColor(config, updatedStyleConfig);
    
    if (currentMinimapColor !== minimapColor) {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  minimapColor: minimapColor
                }
              }
            : node
        )
      );
    }
  }, [updatedStyleConfig, config, data?.minimapColor, id, setNodes]);

  // Calculate handle color that matches the node's visual appearance
  React.useEffect(() => {
    const currentHandleColor = data?.handleColor;
    const handleColor = UnifiedStyleManager.calculateHandleColor(config, updatedStyleConfig);
    
    if (currentHandleColor !== handleColor) {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  handleColor: handleColor
                }
              }
            : node
        )
      );
    }
  }, [updatedStyleConfig, config, data?.handleColor, id, setNodes]);

  // Update node data with current process state for minimap border color
  React.useEffect(() => {
    const currentProcessState = data?.processState;
    let newProcessState: 'idle' | 'processing' | 'completed' | 'error' = 'idle';
    
    if (processIsProcessing) {
      newProcessState = 'processing';
    } else if (processIsCompleted) {
      newProcessState = 'completed';
    } else if (processHasError) {
      newProcessState = 'error';
    }
    
    if (currentProcessState !== newProcessState) {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  processState: newProcessState
                }
              }
            : node
        )
      );
    }
  }, [processIsProcessing, processIsCompleted, processHasError, data?.processState, id, setNodes]);

  // Handle expand/collapse state change
  const handleExpandToggle = (newState: any) => {
    // This would typically update the node state
    // For now, we'll just log the state change
    console.log('Expand/collapse state changed:', newState);
  };

  // Render using the unified base renderer
  return (
    <BaseNodeRenderer
      id={id}
      selected={selected}
      config={config}
      nodeInFlow={nodeInFlow}
      customContent={customContent}
      isProcessing={processIsProcessing}
      isCompleted={processIsCompleted}
      hasError={processHasError}
      currentDimensions={currentDimensions}
      styleConfig={updatedStyleConfig}
      processingStyles={updatedProcessingStyles}
      menuItems={menuItems}
      nodeLabel={nodeLabel}
      hasVariants={hasVariants}
      variantBadgeText={variantBadgeText}
      variantBadgeColor={variantBadgeColor}
      expanded={expanded}
      isHovered={isHovered}
      containerRef={containerRef as React.RefObject<HTMLDivElement>}
      onExpandToggle={handleExpandToggle}
      // Process control props - use process system values
      isLooping={isLooping}
      loopInterval={loopInterval}
      requiresUserApproval={requiresUserApproval}
      autoApprove={processAutoApprove}
      waitingForApproval={Boolean(pendingData)}
      onPlay={handleManualExecution}
      onStop={onStop}
      onLoopToggle={onLoopToggle}
      onLoopIntervalChange={onLoopIntervalChange}
      onApprove={handleApprove}
      onAutoApproveToggle={handleAutoApproveToggle}
      disabled={disabled}
    />
  );
}; 