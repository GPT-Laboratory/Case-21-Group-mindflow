import React, { useState, useEffect, useCallback } from 'react';
import { useEdgeContext } from '../Edge/store/useEdgeContext';
import { useNodeContext } from '../Node/context/useNodeContext';
import type { Flow } from '../stores/useFlowsStore';
import { PanelToggleDragHandle } from '../Panel/components/PanelHandle';
import { useResizePanel } from '../Panel/hooks/useResizePanel';
import { useFlowsStore } from '../stores/useFlowsStore';
import { useNotifications } from '../Notifications/hooks/useNotifications';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FlowsPanelHeader, FlowsList } from './components';
import { CreateFlowDialog } from './components/CreateFlowDialog';
import { RenameFlowDialog } from './components/RenameFlowDialog';

const DEFAULT_SIZES = {
  top: { width: 0, height: 350 },
  bottom: { width: 0, height: 350 },
  left: { width: 140, height: 0 },
  right: { width: 400, height: 0 }
};

export const FlowsPanel: React.FC = () => {
  const { setEdges, edges } = useEdgeContext();
  const { setNodes, nodes } = useNodeContext();
  const { showErrorToast, showSuccessToast } = useNotifications();
  const [isExpanded, setIsExpanded] = useState(false);
  const [position] = useState<'left'>('left');

  const {
    flows: flowsMap,
    loading,
    error,
    selectedFlowId,
    fetchFlows,
    setSelectedFlow,
    deleteFlow,
    getAllFlows
  } = useFlowsStore();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [flowToRename, setFlowToRename] = useState<Flow | null>(null);

  const { size, isResizing, handleResizeStart } = useResizePanel({
    position,
    defaultSizes: DEFAULT_SIZES,
  });

  // Fetch flows on component mount
  useEffect(() => {
    fetchFlows().catch((error) => {
      console.warn('Failed to fetch flows from server:', error.message);
    });
  }, [fetchFlows]);

  // Show error notifications and then clear the error to prevent repeat toasts
  useEffect(() => {
    if (error) {
      showErrorToast('Flows Error', error);
      useFlowsStore.getState().clearError();
    }
  }, [error, showErrorToast]);

  const flows = getAllFlows();

  const loadFlow = (flowId: string) => {
    if (flowId === 'create-new') {
      setNodes([]);
      setEdges([]);
      setSelectedFlow(null);
      setShowCreateDialog(true);
      return;
    }

    const flow = flowsMap[flowId];
    if (flow) {
      setNodes(flow.nodes);
      setEdges(flow.edges);
      setSelectedFlow(flowId);
      showSuccessToast('Flow Loaded', `Loaded "${flow.name}" successfully`);
    } else {
      showErrorToast('Flow Error', `Flow "${flowId}" not found`);
    }
  };

  const handleCreateFlow = useCallback(async (name: string, description: string) => {
    const { createFlow } = useFlowsStore.getState();
    const newFlow = await createFlow({
      name,
      description,
      nodes: [],
      edges: [],
    });
    if (newFlow) {
      setNodes([]);
      setEdges([]);
      setSelectedFlow(newFlow.id);
      showSuccessToast('Flow Created', `Created "${name}" successfully`);
      setShowCreateDialog(false);
    }
  }, [setNodes, setEdges, setSelectedFlow, showSuccessToast]);

  const handleRenameFlowPersist = useCallback(
    async (flowId: string, name: string) => {
      const { renameFlow } = useFlowsStore.getState();
      const opts =
        selectedFlowId === flowId ? { nodes, edges } : undefined;
      const updated = await renameFlow(flowId, name, opts);
      if (updated) {
        showSuccessToast('Flow renamed', `Saved as "${name}"`);
        return true;
      }
      showErrorToast('Rename failed', 'Could not save the new name');
      return false;
    },
    [selectedFlowId, nodes, edges, showSuccessToast, showErrorToast]
  );

  const handleDeleteFlow = async (flowId: string) => {
    if (flowId === 'create-new') return;

    const success = await deleteFlow(flowId);
    if (success) {
      showSuccessToast('Flow Deleted', 'Flow deleted successfully');
      if (selectedFlowId === flowId) {
        setSelectedFlow(null);
      }
    } else {
      showErrorToast('Delete Error', 'Failed to delete flow');
    }
  };

  const getPositionStyles = () => {
    const baseStyle = {
      position: 'relative' as const,
      backgroundColor: 'var(--background)',
      zIndex: 100,
      transition: isResizing ? 'none' : 'all 0.3s ease-in-out',
      height: '100%',
      overflow: 'visible' as const,
      paddingRight: '10px',
    };

    return {
      ...baseStyle,
      width: isExpanded ? `${size.width}px` : '0px',
      minWidth: isExpanded ? `${size.width}px` : '0px',
      maxWidth: isExpanded ? `${size.width}px` : '0px',
    };
  };

  return (
    <div style={getPositionStyles()}>
      {/* Handle */}
      <PanelToggleDragHandle
        isExpanded={isExpanded}
        position={position}
        size={size}
        hasChanges={false}
        onToggle={() => setIsExpanded(!isExpanded)}
        onResizeStart={handleResizeStart}
      />

      {/* Panel Content */}
      {isExpanded && (
        <TooltipProvider>
          <div className="h-full flex flex-col">
            <FlowsPanelHeader />

            {/* Flows List */}
            <div className="flex-1 overflow-y-auto p-1 space-y-1">
              <FlowsList
                flows={flows}
                loading={loading}
                error={error}
                selectedFlowId={selectedFlowId}
                onLoadFlow={loadFlow}
                onRenameFlow={setFlowToRename}
                onDeleteFlow={handleDeleteFlow}
              />
            </div>
          </div>
        </TooltipProvider>
      )}

      <CreateFlowDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={handleCreateFlow}
      />

      <RenameFlowDialog
        open={Boolean(flowToRename)}
        onOpenChange={(open) => {
          if (!open) setFlowToRename(null);
        }}
        flow={flowToRename}
        onRename={handleRenameFlowPersist}
      />
    </div>
  );
};

export default FlowsPanel; 