/** @format */
import {
  Background,
  Edge,
  Node,
  ReactFlowProvider,
} from "@xyflow/react";
import { SelectProvider } from "./Select/contexts/SelectContext";
import { useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useViewPreferencesStore } from "./stores";
import { NodeProvider, useNodeContext } from "./Node/context/useNodeContext";
import { EdgeProvider, useEdgeContext } from "./Edge/store/useEdgeContext";
import { useViewportManager } from "./Flow/hooks/useViewportManager";
import { GRID_SETTINGS } from "./constants";
import { FlowContainer } from "./Flow/FlowContainer";
import Flow from "./Flow/Flow";
import SelectLogic from "./Select/SelectLogic";
import Minimap from "./Minimap/Minimap";
import LayoutControlsRegistration from "./Layout/LayoutControlsRegistration";
import CopyWorkflowControlsRegistration from "./Flow/controls/CopyWorkflowControlsRegistration";
import { ensureEdgeTypesRegistered } from "./Edges/registerBasicEdgeTypes";
import { ensureNodeTypesRegistered } from "./Nodes/registerBasicNodeTypes";
import { ProcessProvider } from "./Process/ProcessContext";
import { InputFocusProvider } from "./Panel/contexts/InputFocusContext";
import { GeneratorProvider } from "./Generator/context/GeneratorContext";
import { FlowDocumentsPanel } from "./Panel/FlowDocumentsPanel";
import { FlowsPanel } from "./FlowsPanel";
import { useFlowsStore } from "./stores/useFlowsStore";
import { FlowsService } from "./services/FlowsService";
import { useAutoSave } from "./hooks/useAutoSave";
import { useCreateDraftFlowOnNewRoute } from "./hooks/useCreateDraftFlowOnNewRoute";

import "@xyflow/react/dist/style.css"; // Ensure to import the styles for React Flow
import ReactStateHistory from "./History/ReactStateHistory";
import { LayoutProvider } from "@jalez/react-flow-automated-layout";
//import { APISetupControlsRegistration } from "./Generator";
import GridControlsRegistration from "./Flow/controls/GridControlsRegistration";
import UnifiedControlsPanel from "./Controls/registry/UnifiedControlsPanel";
//import { GenerationControl } from "./Generator/ui";
import { ShortcutsRegistration } from "./ShortCuts/ShortcutControlRegistration";
import { ShortcutsProvider } from "@jalez/react-shortcuts-provider";
import { ShortcutsDisplayPanel } from "./ShortCuts/ShortcutsDisplayPanel";
import { NodeSearchControlRegistration } from "./Controls/Components/NodeSearchControlRegistration";
import { CodeImportExportControlsRegistration } from "./AST/ui/CodeImportExportControlsRegistration";
import { SaveFlowControlRegistration } from "./Controls/SaveFlowControlRegistration";
import { FlowSettingsControlRegistration } from "./Controls/FlowSettingsControlRegistration";
import SubmitDiagramRegistration from "./Controls/SubmitDiagramRegistration";

// Register edge types before any rendering occurs
ensureEdgeTypesRegistered();

export function AgenticContentFlowContent() {
  const flowWrapper = useRef<HTMLDivElement>(null);
  const { flowId } = useParams<{ flowId?: string }>();
  const navigate = useNavigate();
  const { showGrid, gridVariant } = useViewPreferencesStore();
  const { setNodes, updateNodes } = useNodeContext();
  const { setEdges, updateEdges } = useEdgeContext();

  // Initialize node types on component mount
  useEffect(() => {
    ensureNodeTypesRegistered().catch(console.error);
  }, []);

  // Load flow from URL param — always verify with API (auth-gated)
  const flowLoadedRef = useRef<string | null>(null);

  useCreateDraftFlowOnNewRoute(flowId, navigate);

  useEffect(() => {
    // Clear canvas when creating a new flow
    if (!flowId || flowId === 'new') {
      if (flowLoadedRef.current !== null) {
        setNodes([]);
        setEdges([]);
        useFlowsStore.getState().setSelectedFlow(null);
        flowLoadedRef.current = null;
      }
      return;
    }
    if (flowLoadedRef.current === flowId) return;

    let cancelled = false;

    const loadFlow = async () => {
      try {
        const flow = await FlowsService.getFlow(flowId);
        if (cancelled) return;
        setNodes(flow.nodes);
        setEdges(flow.edges);
        useFlowsStore.getState().setSelectedFlow(flowId);
        useFlowsStore.getState().addFlow(flow);
        flowLoadedRef.current = flowId;
      } catch (err: any) {
        if (cancelled) return;
        const status = err?.message?.match(/HTTP (\d+)/)?.[1];
        if (status === '401' || status === '403') {
          navigate('/flows', { replace: true });
        } else {
          console.warn('Failed to load flow:', err);
        }
      }
    };

    loadFlow();
    return () => { cancelled = true; };
  }, [flowId, setNodes, setEdges, navigate]);

  // Auto-save when nodes/edges change
  useAutoSave();

  // Use custom hooks for functionality
  const { handleWheel } = useViewportManager(flowWrapper);


  const handleNodeUpdate = useCallback((nodes: Node[]) => {
    updateNodes(nodes, false);
  }, [updateNodes])

  const handleEdgeUpdate = useCallback((edges: Edge[]) => {
    updateEdges(edges, false);
  }, [updateEdges]);



  return (
    <ProcessProvider
      initialConfig={{
        minAnimationDuration: 1200,
        defaultProcessingDelay: 800,
        debug: true
      }}
    >
      <GeneratorProvider>
        <LayoutProvider
          initialDirection="DOWN"
          initialAutoLayout={true}
          initialPadding={20}
          initialSpacing={{ node: 80, layer: 80 }}
          initialParentResizingOptions={{
            padding: {
              horizontal: 50,
              vertical: 50,
            },
            minWidth: 100,
            minHeight: 100,
          }}
          initialNodeDimensions={{
            width: 200,
            height: 200,
          }}
          updateNodes={handleNodeUpdate}
          updateEdges={handleEdgeUpdate}
        >
          <ShortcutsProvider>
            <div className="flex h-full w-full overflow-visible">
              {/* Flows Panel - Left side */}
              <FlowsPanel />

              {/* Flow area (includes Controls Panel and Flow) */}
              <div className="flex-1 flex flex-col">
                {/* Controls Panel - Full width of Flow area */}
                <UnifiedControlsPanel position="top" />

                {/* Flow takes up remaining space */}
                <div className="flex-1 border-2 border-border rounded-lg overflow-hidden">
                  <FlowContainer ref={flowWrapper} onWheel={handleWheel}>
                    <Flow>
                      {showGrid && (
                        <Background
                          variant={gridVariant}
                          gap={GRID_SETTINGS.BACKGROUND_GAP}
                          size={GRID_SETTINGS.BACKGROUND_SIZE}
                          color="var(--color-border)"
                        />
                      )}
                      <SelectLogic />
                      <Minimap />
                      <ShortcutsDisplayPanel />

                      {/* Register available controls here */}
                      <GridControlsRegistration />
                      <LayoutControlsRegistration />
                      <CopyWorkflowControlsRegistration />
                      {/* <APISetupControlsRegistration /> */}
                      <ShortcutsRegistration />
                      <SaveFlowControlRegistration />
                      <FlowSettingsControlRegistration />
                      <CodeImportExportControlsRegistration />
                      <NodeSearchControlRegistration />
                      <SubmitDiagramRegistration />
                    </Flow>
                  </FlowContainer>
                </div>

                {/* Generation Panel - Full width of Flow area */}
                {/* <GenerationControl type="flow" /> */}
              </div>

              <FlowDocumentsPanel />
            </div>
          </ShortcutsProvider>
        </LayoutProvider>
      </GeneratorProvider>
    </ProcessProvider>
  );
}

const AgenticContentFlow = () => (
  <ReactFlowProvider>
    <InputFocusProvider>
      <ReactStateHistory>
        <NodeProvider>
          <EdgeProvider>
            <SelectProvider>
              <AgenticContentFlowContent />
            </SelectProvider>
          </EdgeProvider>
        </NodeProvider>
      </ReactStateHistory>
    </InputFocusProvider>
  </ReactFlowProvider>
);

// Export edge type registry
export {
  registerEdgeType,
  unregisterEdgeType,
  getEdgeTypeComponent,
  getEdgeTypeInfo,
  getAllEdgeTypes,
  useEdgeTypeRegistry,
} from "./Edge/registry/edgeTypeRegistry";

export { ensureEdgeTypesRegistered } from "./Edges/registerBasicEdgeTypes";

export default AgenticContentFlow;
