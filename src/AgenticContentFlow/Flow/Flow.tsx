import { Edge, MarkerType, Node, ReactFlow, SelectionMode, useOnSelectionChange } from "@xyflow/react";
import { memo, useEffect, useCallback, useRef, useMemo, useState } from "react";
import useNodeSelection from "../Node/hooks/useNodeSelect";
import { useEdgeSelect } from "../Edge/hooks/useEdgeSelect";
import { VIEWPORT_CONSTRAINTS } from "../constants";
import { useConnectionOperations } from "../Node/hooks/useConnectionOperations";
import { useNodeTypeRegistry } from "../Node/registry/nodeTypeRegistry";
import { useSelect } from "../Select/contexts/SelectContext";
import { useNodeContext } from "../Node/store/useNodeContext";
import { useEdgeContext } from "../Edge/store/useEdgeContext";
import { useInputFocus } from "../Panel/contexts/InputFocusContext";
// Import the grid controls registration
import GridControlsRegistration from "./controls/GridControlsRegistration";
import { useLayoutContext } from "@jalez/react-flow-automated-layout";
import { useTransaction } from "@jalez/react-state-history";
import { useEdgeTypeRegistry } from "../Edge/registry/edgeTypeRegistry";
import { ensureEdgeTypesRegistered } from "../Edges/registerBasicEdgeTypes";
import { ensureNodeTypesRegistered } from "../Nodes/registerBasicNodeTypes";
import NodeConfigPanel from "../Panel/NodePanel";


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
  const { visibleEdges, onEdgesChange, onEdgeRemove } = useEdgeContext();
  const selectedNodesRef = useRef<any[]>([]);
  const selectedEdgesRef = useRef<any[]>([]);
  const { isInputFocused } = useInputFocus();

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
    removeNodes,
  } = useNodeContext();

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
  const isDeleting = useRef(false);
  const { withTransaction } = useTransaction();

  

  
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

  // Ensure node types are registered on component mount
  useEffect(() => {
  }, []);

  // Use the improved node type registry hook

  // Optimize pan start/end handling
  const handlePanStart = useCallback(() => {
    isPanning.current = true;
    lastPanTime.current = Date.now();
  }, []);

  const handlePanEnd = useCallback(() => {
    isPanning.current = false;
  }, []);


const filteredNodes = useMemo(() => {
  const sourceNodes = isDragging ? localNodes : nodes;
  return sourceNodes.filter(node => !node.hidden);
}, [nodes, localNodes, isDragging]);

  // 🔧 NEW: Add loading state for factory system initialization
  const [isFactorySystemReady, setIsFactorySystemReady] = useState(false);
  const [initializationProgress, setInitializationProgress] = useState("Initializing...");

  // 🔧 NEW: Enhanced initialization with proper loading states
  useEffect(() => {
    const initializeNodeTypes = async () => {
      try {
        setInitializationProgress("Registering edge types...");
        ensureEdgeTypesRegistered();
        
        setInitializationProgress("Registering factory-based nodes...");
        await ensureNodeTypesRegistered();
        
        setInitializationProgress("Finalizing setup...");
        // Give a small delay to ensure all registry updates are complete
        setTimeout(() => {
          setIsFactorySystemReady(true);
          console.log("✅ Factory system initialization complete");
        }, 100);
      } catch (error) {
        console.error("❌ Failed to register node types:", error);
        setInitializationProgress("Error during initialization");
        // Still mark as ready to avoid infinite loading
        setTimeout(() => setIsFactorySystemReady(true), 1000);
      }
    };
    
    initializeNodeTypes();
  }, []);

  // Show loading screen until factory system is ready
  if (!isFactorySystemReady) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        fontSize: 18,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        🏭 {initializationProgress}
      </div>
    );
  }

  return (
    <>
        {/* Register the grid controls */}
        <GridControlsRegistration />
        
        <ReactFlow
          nodeTypes={memoizedNodeTypes}
          edgeTypes={memoizedEdgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          nodes={filteredNodes}
          onNodesDelete={() => handleDelete("removeNodes")}
          onNodesChange={onNodesChange}
          onNodeDragStart={onNodeDragStart}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={DetermineNodeClickFunction}
          onNodeDoubleClick={DetermineNodeClickFunction}
          edges={visibleEdges}
          onEdgesChange={onEdgesChange}
          onEdgeClick={DetermineEdgeClickFunction}
          onEdgeDoubleClick={DetermineEdgeClickFunction}
          onEdgesDelete={() => handleDelete("onEdgesDelete")}
          onConnect={onConnect}
          onConnectEnd={onConnectEnd}
          // Enable node functionality
          nodesFocusable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          selectionMode={SelectionMode.Partial}
          selectNodesOnDrag={true}
          onSelectionStart={handleSelectionDragStart}
          onSelectionEnd={handleSelectionEnd}
          selectionKeyCode="Control"
          //multiSelectionKeyCode="Control"
          fitView
          zoomOnScroll={true}
          zoomOnPinch={true}
          minZoom={VIEWPORT_CONSTRAINTS.MIN_ZOOM}
          maxZoom={VIEWPORT_CONSTRAINTS.MAX_ZOOM}
          onMoveStart={handlePanStart}
          onMoveEnd={handlePanEnd}
          panOnScroll={false}

          onPaneClick={handleClearSelection}
        >
          {children}
          {/* Add any additional components or overlays here */}
        </ReactFlow>
        
        {/* Node Configuration Panel */}
        <NodeConfigPanel />
      </>
  );
})

export default Flow;
