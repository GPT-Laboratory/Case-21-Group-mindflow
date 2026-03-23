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
import UnifiedControlsPanel from "../Controls/registry/UnifiedControlsPanel";
import { getNodeType } from "../Node/store/NodeTypeStoreInitializer";
import { UnifiedStyleManager } from "../Node/factory/utils/UnifiedStyleManager";


const defaultEdgeOptions = {
  zIndex: 10000, //WARNING: THIS NEEDS TO BE HIGHER THAN THE Z-INDEX OF THE NODE OVERLAY
  type: "default",
  //animated: true,
  markerEnd: { type: MarkerType.ArrowClosed, width: 26, height: 26 },
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
    nodeMap,
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
    if (updatedNode && updatedNode.data?.filePath) {
      console.log('🔍 [Flow] Found updated node in filteredNodes:', {
        nodeId: updatedNode.id,
        hasFilePath: !!updatedNode.data.filePath,
        filePath: updatedNode.data.filePath,
        lastGenerated: updatedNode.data.lastGenerated
      });
    }
    
    // Deduplicate nodes by ID before rendering to prevent React key collisions
    const nodeIdMap = new Map<string, Node<any>>();
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

  const coloredVisibleEdges = useMemo(() => {
    return visibleEdges.map((edge) => {
      const sourceNode = edge.source ? nodeMap.get(edge.source) : undefined;
      let sourceColor = '#000000';

      if (sourceNode?.data?.nodeColor) {
        sourceColor = sourceNode.data.nodeColor as string;
      } else if (sourceNode) {
        const sourceConfig = sourceNode.type ? getNodeType(String(sourceNode.type)) : null;
        if (sourceConfig) {
          sourceColor = UnifiedStyleManager.generateStyleConfig(
            sourceConfig,
            sourceNode.data ?? {},
            {
              selected: false,
              expanded: false,
              isProcessing: false,
              hasError: false,
              isCompleted: false,
            }
          ).backgroundColor;
        }
      }

      return {
        ...edge,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: sourceColor,
          width: 26,
          height: 26,
        },
      };
    });
  }, [visibleEdges, nodeMap]);



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
    edges: coloredVisibleEdges,
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
        edges={isFactorySystemReady ? coloredVisibleEdges : []}
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
        deleteKeyCode={null}
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
    </>
  );
})

export default Flow;
