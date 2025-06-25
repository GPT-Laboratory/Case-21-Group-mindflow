import { Edge, MarkerType, Node, ReactFlow, SelectionMode, useOnSelectionChange } from "@xyflow/react";
import { memo, useEffect, useCallback, useRef, useMemo, useState } from "react";
import useNodeSelection from "../Node/hooks/useNodeSelect";
import { useEdgeSelect } from "../Edge/hooks/useEdgeSelect";
import { VIEWPORT_CONSTRAINTS } from "../constants";
import { useConnectionOperations } from "../Node/hooks/useConnectionOperations";
import { useNodeTypeRegistry } from "../Node/registry/nodeTypeRegistry";
import { useSelect } from "../Select/contexts/SelectContext";
import { useNodeContext } from "../Node/context/useNodeContext";
import { useEdgeContext } from "../Edge/store/useEdgeContext";
// Import the grid controls registration
import { useLayoutContext } from "@jalez/react-flow-automated-layout";
import { useEdgeTypeRegistry } from "../Edge/registry/edgeTypeRegistry";
import { ensureEdgeTypesRegistered } from "../Edges/registerBasicEdgeTypes";
import { ensureNodeTypesRegistered } from "../Nodes/registerBasicNodeTypes";
import NodeConfigPanel from "../Panel/NodePanel";
import { useNotifications } from "../Notifications";
import { GenerationControl } from "../Generator/ui";
import { GenerationResult, FlowGenerationResult } from "../Generator/generatortypes";
import { handleContainerization } from "../Node/hooks/utils/nodeUtils";
import { isHorizontalConnection } from "../Node/hooks/utils/dragUtils";
import { NodeData } from "../types";


const defaultEdgeOptions = {
  zIndex: 10000, //WARNING: THIS NEEDS TO BE HIGHER THAN THE Z-INDEX OF THE NODE OVERLAY
  type: "default",
  //animated: true,
  markerEnd: { type: MarkerType.Arrow },
};

export interface FlowProps {
  children?: React.ReactNode;
}

/**
 * Core Flow component that renders the main ReactFlow diagram
 */
export const Flow: React.FC<FlowProps> = memo(({ children }) => {
  const { applyLayout, autoLayout } = useLayoutContext();
  const { visibleEdges, onEdgesChange } = useEdgeContext();
  const selectedNodesRef = useRef<any[]>([]);
  const selectedEdgesRef = useRef<any[]>([]);

  const { nodeTypes } = useNodeTypeRegistry();
  const { edgeTypes } = useEdgeTypeRegistry();

  // Ensure both node and edge types are registered on component mount
  useEffect(() => {
    const initializeNodeTypes = async () => {
      try {
        ensureEdgeTypesRegistered();
        await ensureNodeTypesRegistered();
        console.log("✅ All node and edge types registered successfully");
      } catch (error) {
        console.error("❌ Failed to register node types:", error);
      }
    };
    
    initializeNodeTypes();
  }, []);

  const memoizedNodeTypes = useMemo(() => nodeTypes, [nodeTypes]);
  const memoizedEdgeTypes = useMemo(() => edgeTypes, [edgeTypes]);

    const onChange = useCallback(
      ({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) => {
        selectedNodesRef.current = nodes;
        selectedEdgesRef.current = edges;
      },
      []
    );
  
    useOnSelectionChange({
      onChange,
    });
  const {
    nodes,
    localNodes,
    isNewState,
    changeStateAge,
    onNodesChange,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
    isDragging,
    setNodes,
  } = useNodeContext();

  const { setEdges } = useEdgeContext();

  const filteredNodes = useMemo(() => {
    const sourceNodes = isDragging ? localNodes : nodes;
    const visibleNodes = sourceNodes.filter(node => !node.hidden);
    console.log("sourceNodes", sourceNodes);
    
    // Debug: Check if the updated node data is present
    const updatedNode = visibleNodes.find(node => node.id === 'api-user-request');
    if (updatedNode && updatedNode.data?.instanceCode) {
      console.log('🔍 [Flow] Found updated node in filteredNodes:', {
        nodeId: updatedNode.id,
        hasInstanceCode: !!updatedNode.data.instanceCode,
        instanceCodeLength: typeof updatedNode.data.instanceCode === 'string' ? updatedNode.data.instanceCode.length : 0,
        lastGenerated: updatedNode.data.lastGenerated
      });
    }
    
    // Deduplicate nodes by ID before rendering to prevent React key collisions
    const nodeIdMap = new Map<string, Node<NodeData>>();
    const duplicateIds = new Set<string>();
    
    visibleNodes.forEach(node => {
      if (nodeIdMap.has(node.id)) {
        duplicateIds.add(node.id);
        console.warn(`[FilteredNodes] Duplicate node ID found: ${node.id}. Keeping the last occurrence.`);
      }
      nodeIdMap.set(node.id, node);
    });
    
    // Log if we found duplicates
    if (duplicateIds.size > 0) {
      console.warn(`[FilteredNodes] Removed ${duplicateIds.size} duplicate nodes from filtered nodes`);
    }
    
    const deduplicatedNodes = Array.from(nodeIdMap.values());
    return deduplicatedNodes;
  }, [nodes, localNodes, isDragging]);

  /**
   * Apply containerization logic to generated flow for horizontal connections
   * This ensures nodes with left/right connections are properly placed in invisible containers
   */
  const applyContainerizationToGeneratedFlow = useCallback((generatedNodes: Node<NodeData>[], generatedEdges: Edge[]) => {
    console.log('🔧 Applying containerization to generated flow');
    
    // Deduplicate generated nodes by ID before processing
    const nodeIdMap = new Map<string, Node<NodeData>>();
    const duplicateIds = new Set<string>();
    
    generatedNodes.forEach(node => {
      if (nodeIdMap.has(node.id)) {
        duplicateIds.add(node.id);
        console.warn(`[Containerization] Duplicate node ID found in generated flow: ${node.id}. Keeping the last occurrence.`);
      }
      nodeIdMap.set(node.id, node);
    });
    
    // Log if we found duplicates
    if (duplicateIds.size > 0) {
      console.warn(`[Containerization] Removed ${duplicateIds.size} duplicate nodes from generated flow`);
    }
    
    const deduplicatedNodes = Array.from(nodeIdMap.values());
    
    // Create maps for efficient lookups
    const nodeMap = new Map(deduplicatedNodes.map(n => [n.id, n]));
    const nodeParentIdMapWithChildIdSet = new Map<string, Set<string>>();
    
    // Build parent-child relationship map
    deduplicatedNodes.forEach(node => {
      if (node.parentId) {
        if (!nodeParentIdMapWithChildIdSet.has(node.parentId)) {
          nodeParentIdMapWithChildIdSet.set(node.parentId, new Set());
        }
        nodeParentIdMapWithChildIdSet.get(node.parentId)!.add(node.id);
      }
    });
    
    // Find horizontal connections
    const horizontalEdges = generatedEdges.filter(edge =>
      isHorizontalConnection(edge.sourceHandle, edge.targetHandle)
    );
    
    if (horizontalEdges.length === 0) {
      console.log('🔧 No horizontal connections found, no containerization needed');
      return { nodes: deduplicatedNodes, edges: generatedEdges };
    }
    
    console.log(`🔧 Found ${horizontalEdges.length} horizontal connection(s), applying containerization`);
    
    const nodesToUpdate: Node<NodeData>[] = [...deduplicatedNodes];
    const containersToAdd: Node<NodeData>[] = [];
    const processedEdges = new Set<string>();
    
    // Process each horizontal edge
    horizontalEdges.forEach(edge => {
      if (processedEdges.has(edge.id)) return;
      
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);
      
      if (sourceNode && targetNode) {
        const containerizationResult = handleContainerization(
          targetNode,
          sourceNode,
          edge,
          nodeMap,
          nodeParentIdMapWithChildIdSet
        );
        
        // Update nodes based on containerization result
        if (containerizationResult.containerToAdd) {
          containersToAdd.push(containerizationResult.containerToAdd);
          // Update the nodeMap with the new container
          nodeMap.set(containerizationResult.containerToAdd.id, containerizationResult.containerToAdd);
        }
        
        if (containerizationResult.updatedFromNode) {
          const index = nodesToUpdate.findIndex(n => n.id === containerizationResult.updatedFromNode!.id);
          if (index >= 0) {
            nodesToUpdate[index] = containerizationResult.updatedFromNode;
            nodeMap.set(containerizationResult.updatedFromNode.id, containerizationResult.updatedFromNode);
          }
        }
        
        if (containerizationResult.updatedToNode) {
          const index = nodesToUpdate.findIndex(n => n.id === containerizationResult.updatedToNode!.id);
          if (index >= 0) {
            nodesToUpdate[index] = containerizationResult.updatedToNode;
            nodeMap.set(containerizationResult.updatedToNode.id, containerizationResult.updatedToNode);
          }
        }
        
        if (containerizationResult.updatedToNodeSiblings) {
          containerizationResult.updatedToNodeSiblings.forEach(sibling => {
            const index = nodesToUpdate.findIndex(n => n.id === sibling.id);
            if (index >= 0) {
              nodesToUpdate[index] = sibling;
              nodeMap.set(sibling.id, sibling);
            }
          });
        }
        
        processedEdges.add(edge.id);
      }
    });
    
    // Combine original nodes with new containers
    const finalNodes = [...nodesToUpdate, ...containersToAdd];
    
    console.log(`🔧 Containerization complete: ${containersToAdd.length} containers added`);
    
    return { nodes: finalNodes, edges: generatedEdges };
  }, []);

  // Handle flow generation with the new unified system
  const handleFlowGenerated = useCallback((result: GenerationResult) => {
    // Type guard to ensure we have a flow result
    if (result.type === 'flow') {
      const flowResult = result as FlowGenerationResult;
      console.log('🎯 Flow generated:', { nodeCount: flowResult.nodes.length, edgeCount: flowResult.edges.length });
      
      // Type-cast the generated nodes to our NodeData interface since they come from our flow generation service
      const typedNodes = flowResult.nodes as Node<NodeData>[];
      
      // Apply containerization logic for horizontal connections
      const processedResult = applyContainerizationToGeneratedFlow(typedNodes, flowResult.edges);
      
      // Final deduplication check before setting nodes
      const finalNodeIdMap = new Map<string, Node<NodeData>>();
      const finalDuplicateIds = new Set<string>();
      
      processedResult.nodes.forEach(node => {
        if (finalNodeIdMap.has(node.id)) {
          finalDuplicateIds.add(node.id);
          console.warn(`[Final] Duplicate node ID found before setting flow: ${node.id}. Keeping the last occurrence.`);
        }
        finalNodeIdMap.set(node.id, node);
      });
      
      // Log if we found duplicates
      if (finalDuplicateIds.size > 0) {
        console.warn(`[Final] Removed ${finalDuplicateIds.size} duplicate nodes before setting flow`);
      }
      
      const finalDeduplicatedNodes = Array.from(finalNodeIdMap.values());
      
      // Replace current flow with processed flow (includes containerization)
      setNodes(finalDeduplicatedNodes);
      setEdges(processedResult.edges);
      
      console.log('✅ Flow generation complete with containerization applied');
    } else {
      console.warn('Expected flow generation result, got:', result.type);
    }
  }, [setNodes, setEdges, applyContainerizationToGeneratedFlow]);

  useEffect(() => {
    // Apply layout when nodes change
    if (isNewState) {
      autoLayout && applyLayout();
      changeStateAge(false);
    }
  }, [isNewState]);

  // Add ref for tracking panning performance
  const isPanning = useRef(false);
  const lastPanTime = useRef(0);
  
  const { onConnect, onConnectEnd } = useConnectionOperations();
  const {
    handleSelectionDragStart,
    DetermineNodeClickFunction,
    handleSelectionEnd,
  } = useNodeSelection({
    nodes,
    isDragging,
  });
  const { DetermineEdgeClickFunction } = useEdgeSelect({
    nodes,
    edges: visibleEdges,
  });

  // Add this to get clearSelection and deleteSelected
  const { clearSelection, deleteSelected } = useSelect();

  // Simplified handleDelete that delegates to SelectContext
  const handleDelete = useCallback((_source: string) => {
    // Delegate to SelectContext which will show confirmation dialog
    // and use the proper deletion service with transaction handling
    deleteSelected();
  }, [deleteSelected]);

  const handleClearSelection = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  // Optimize pan start/end handling
  const handlePanStart = useCallback(() => {
    isPanning.current = true;
    lastPanTime.current = Date.now();
  }, []);

  const handlePanEnd = useCallback(() => {
    isPanning.current = false;
  }, []);

  // Type-safe drag handlers that match ReactFlow's expected signatures
  const handleNodeDragStart = useCallback((event: any, node: Node) => {
    onNodeDragStart(event, node as Node<any>, [node as Node<any>]);
  }, [onNodeDragStart]);

  const handleNodeDrag = useCallback((event: any, node: Node) => {
    onNodeDrag(event, node as Node<any>, [node as Node<any>]);
  }, [onNodeDrag]);

  const handleNodeDragStop = useCallback((event: any, node: Node) => {
    onNodeDragStop(event, node as Node<any>, [node as Node<any>]);
  }, [onNodeDragStop]);


  // 🔧 NEW: Use notification system for factory initialization
  const { showBlockingNotification, updateBlockingNotification, completeBlockingNotification } = useNotifications();
  const [isFactorySystemReady, setIsFactorySystemReady] = useState(false);
  const [initializationNotificationId, setInitializationNotificationId] = useState<string | null>(null);

  // 🔧 NEW: Enhanced initialization with notification system
  useEffect(() => {
    const initializeNodeTypes = async () => {
      try {
        // Start blocking notification
        const notificationId = showBlockingNotification(
          "🏭 Initializing Factory System",
          "Preparing your workspace..."
        );
        setInitializationNotificationId(notificationId);

        // Register edge types
        updateBlockingNotification(notificationId, 'loading', 25);
        updateBlockingNotification(notificationId, 'loading', 25);
        ensureEdgeTypesRegistered();
        
        // Register factory-based nodes
        updateBlockingNotification(notificationId, 'loading', 75);
        await ensureNodeTypesRegistered();
        
        // Finalize setup
        updateBlockingNotification(notificationId, 'loading', 95);
        
        // Complete initialization
        setTimeout(() => {
          completeBlockingNotification(notificationId, "Factory system ready!");
          setIsFactorySystemReady(true);
          console.log("✅ Factory system initialization complete");
        }, 100);
      } catch (error) {
        console.error("❌ Failed to register node types:", error);
        if (initializationNotificationId) {
          updateBlockingNotification(initializationNotificationId, 'error');
        }
        // Still mark as ready to avoid infinite loading
        setTimeout(() => setIsFactorySystemReady(true), 1000);
      }
    };
    
    initializeNodeTypes();
  }, [showBlockingNotification, updateBlockingNotification, completeBlockingNotification]);

  return (
    <>
      {/* Register the grid controls */}
      
      {/* Always render ReactFlow with background visible */}
      <ReactFlow
        nodeTypes={memoizedNodeTypes}
        edgeTypes={memoizedEdgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        // Only show nodes and edges when factory system is ready
        nodes={isFactorySystemReady ? filteredNodes : []}
        onNodesDelete={isFactorySystemReady ? () => handleDelete("removeNodes") : undefined}
        onNodesChange={isFactorySystemReady ? onNodesChange : undefined}
        onNodeDragStart={isFactorySystemReady ? handleNodeDragStart : undefined}
        onNodeDrag={isFactorySystemReady ? handleNodeDrag : undefined}
        onNodeDragStop={isFactorySystemReady ? handleNodeDragStop : undefined}
        onNodeClick={isFactorySystemReady ? DetermineNodeClickFunction : undefined}
        onNodeDoubleClick={isFactorySystemReady ? DetermineNodeClickFunction : undefined}
        edges={isFactorySystemReady ? visibleEdges : []}
        onEdgesChange={isFactorySystemReady ? onEdgesChange : undefined}
        onEdgeClick={isFactorySystemReady ? DetermineEdgeClickFunction : undefined}
        onEdgeDoubleClick={isFactorySystemReady ? DetermineEdgeClickFunction : undefined}
        onEdgesDelete={isFactorySystemReady ? () => handleDelete("onEdgesDelete") : undefined}
        onConnect={isFactorySystemReady ? onConnect : undefined}
        onConnectEnd={isFactorySystemReady ? onConnectEnd : undefined}
        // Enable node functionality only when ready
        nodesFocusable={isFactorySystemReady}
        nodesConnectable={isFactorySystemReady}
        elementsSelectable={isFactorySystemReady}
        selectionMode={SelectionMode.Partial}
        selectNodesOnDrag={isFactorySystemReady}
        onSelectionStart={isFactorySystemReady ? handleSelectionDragStart : undefined}
        onSelectionEnd={isFactorySystemReady ? handleSelectionEnd : undefined}
        selectionKeyCode="Control"
        //multiSelectionKeyCode="Control"
        fitView
        zoomOnScroll={isFactorySystemReady}
        zoomOnPinch={isFactorySystemReady}
        minZoom={VIEWPORT_CONSTRAINTS.MIN_ZOOM}
        maxZoom={VIEWPORT_CONSTRAINTS.MAX_ZOOM}
        onMoveStart={isFactorySystemReady ? handlePanStart : undefined}
        onMoveEnd={isFactorySystemReady ? handlePanEnd : undefined}
        panOnScroll={false}
        onPaneClick={isFactorySystemReady ? handleClearSelection : undefined}
      >
        {children}
      </ReactFlow>
      
      {/* Flow Generation Controls - Always visible when system is ready */}
      <GenerationControl 
        type="flow"
        onGenerated={handleFlowGenerated}
      />
     
      {/* Node Configuration Panel */}
      <NodeConfigPanel />
      
      {/* Temporary demo component for testing */}
      {/* {process.env.NODE_ENV === 'development' && <NotificationDemo />} */}
    </>
  );
})

export default Flow;
