/** @format */
import {
  Background,
  Edge,
  Node,
  ReactFlowProvider,
} from "@xyflow/react";
import { SelectProvider } from "./Select/contexts/SelectContext";
import { useCallback, useRef, useEffect } from "react";
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
import { NotificationProvider } from "./Notifications";
import { GeneratorProvider } from "./Generator/context/GeneratorContext";
import NodeConfigPanel from "./Panel/NodePanel";
import { FlowsPanel } from "./FlowsPanel";

import "@xyflow/react/dist/style.css"; // Ensure to import the styles for React Flow
import ReactStateHistory from "./History/ReactStateHistory";
import { LayoutProvider } from "@jalez/react-flow-automated-layout";
import { APISetupControlsRegistration } from "./Generator";
import GridControlsRegistration from "./Flow/controls/GridControlsRegistration";
import UnifiedControlsPanel from "./Controls/registry/UnifiedControlsPanel";
import { GenerationControl } from "./Generator/ui";
import { ShortcutsRegistration } from "./ShortCuts/ShortcutControlRegistration";
import { SaveFlowControlRegistration } from "./Controls/SaveFlowControlRegistration";
import { CodeImportExportControlRegistration } from "./Controls/CodeImportExportControlRegistration";
import { NodeSearchControlRegistration } from "./Controls/Components/NodeSearchControlRegistration";
import { ShortcutsDisplayPanel } from "./ShortCuts/ShortcutsDisplayPanel";
import { ShortcutsProvider } from "@jalez/react-shortcuts-provider";

// Register edge types before any rendering occurs
ensureEdgeTypesRegistered();

export function AgenticContentFlowContent() {
  const flowWrapper = useRef<HTMLDivElement>(null);
  const { showGrid, gridVariant } = useViewPreferencesStore();
  const { updateNodes } = useNodeContext();
  const { updateEdges } = useEdgeContext();

  // Initialize node types on component mount
  useEffect(() => {
    ensureNodeTypesRegistered().catch(console.error);
  }, []);

  // Use custom hooks for functionality
  const { handleWheel } = useViewportManager(flowWrapper);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      flowWrapper.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, [flowWrapper]);

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
        debug: true // Enable for development
      }}
    >
      <NotificationProvider>
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
                        <ShortcutsDisplayPanel/>

                        {/* Register available controls here */}
                        <GridControlsRegistration />
                        <LayoutControlsRegistration />
                        <CopyWorkflowControlsRegistration />
                        <APISetupControlsRegistration />
                        <ShortcutsRegistration />
                        <SaveFlowControlRegistration />
                        <CodeImportExportControlRegistration />
                        <NodeSearchControlRegistration />
                      </Flow>
                    </FlowContainer>
                  </div>
                  
                  {/* Generation Panel - Full width of Flow area */}
                  <GenerationControl 
                    type="flow"
                  />
                </div>
                
                {/* Node Configuration Panel - Side by side */}
                <NodeConfigPanel />
              </div>
            </ShortcutsProvider>
          </LayoutProvider>
        </GeneratorProvider>
      </NotificationProvider>
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
