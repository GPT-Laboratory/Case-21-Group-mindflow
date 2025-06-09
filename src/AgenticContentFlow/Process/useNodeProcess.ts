import { useCallback, useEffect, useState } from 'react';
import { useProcessContext } from './ProcessContext';
import { useReactFlow } from '@xyflow/react';

export interface UseNodeProcessOptions {
  /** Node ID */
  nodeId: string;
  /** Auto-start processing when data is received */
  autoStartOnData?: boolean;
}

export const useNodeProcess = (options: UseNodeProcessOptions) => {
  const { nodeId, autoStartOnData = false } = options;
  const processContext = useProcessContext();
  const { getEdges } = useReactFlow();
  
  // Simple state management
  const [hasProcessedCurrentData, setHasProcessedCurrentData] = useState(false);
  
  const processState = processContext.getNodeProcessState(nodeId);
  const availableData = processContext.getFlowData(nodeId);

  // Auto-start processing when new data arrives
  useEffect(() => {
    if (!autoStartOnData || !availableData || hasProcessedCurrentData) return;
    if (processState.status === 'processing') return;

    console.log(`🚀 Auto-starting processing for node ${nodeId} with data:`, availableData);
    startProcess(availableData);
    setHasProcessedCurrentData(true);
  }, [autoStartOnData, availableData, hasProcessedCurrentData, processState.status, nodeId]);

  // Reset processed flag when data changes
  useEffect(() => {
    setHasProcessedCurrentData(false);
  }, [availableData]);

  // Start processing
  const startProcess = useCallback((data?: any) => {
    processContext.startNodeProcess(nodeId, data);
    // Clear the input data since we're now processing it
    console.log(`🔄 Node ${nodeId} started processing with data:`, data);

  }, [processContext, nodeId, availableData]);

  // Complete processing and publish data to outgoing edges
  const completeProcess = useCallback((result?: any) => {
    console.log(`✅ Node ${nodeId} completed processing with result:`, result);
    processContext.completeNodeProcess(nodeId, result);
    processContext.clearFlowData(nodeId);
    
    
    // Publish result to outgoing edges if we have meaningful data
    if (result !== undefined && result !== null) {
      const edges = getEdges();
      const outgoingEdges = edges.filter(edge => edge.source === nodeId);
      
      // Set data for each outgoing EDGE (not directly to target node)
      outgoingEdges.forEach(edge => {
        console.log(`📤 Node ${nodeId} publishing data to edge ${edge.id}:`, result);
        processContext.setFlowData(edge.id, result);
      });
    }
  }, [processContext, nodeId, getEdges]);

  // Set error state
  const setError = useCallback((error: string) => {
    processContext.setNodeError(nodeId, error);
  }, [processContext, nodeId]);

  // Get available data for this node
  const getAvailableData = useCallback(() => {
    return processContext.getFlowData(nodeId);
  }, [processContext, nodeId]);

  // Unified approval methods
  const setApprovalStatus = useCallback((status: 'pending' | 'approved' | 'declined') => {
    processContext.setNodeApprovalStatus(nodeId, status);
  }, [processContext, nodeId]);

  const setAutoApprove = useCallback((autoApprove: boolean) => {
    processContext.setNodeAutoApprove(nodeId, autoApprove);
  }, [processContext, nodeId]);

  const setPendingApproval = useCallback((data: any, autoApprove?: boolean) => {
    processContext.setNodePendingApproval(nodeId, data, autoApprove);
  }, [processContext, nodeId]);

  const approveAndContinue = useCallback(async () => {
    if (processState.pendingData) {
      setApprovalStatus('approved');
      // Don't call startProcess here - let the ContentNode's useEffect handle continuation
      console.log(`🔄 Node ${nodeId} approval status set to approved, ContentNode will continue processing`);
    }
  }, [processState.pendingData, setApprovalStatus, nodeId]);

  const declineAndStop = useCallback(() => {
    setApprovalStatus('declined');
    // Clear pending data and reset to idle
    processContext.setNodePendingData(nodeId, null);
  }, [setApprovalStatus, processContext, nodeId]);

  return {
    processState,
    isProcessing: processState.status === 'processing',
    isCompleted: processState.status === 'completed',
    hasError: processState.status === 'error',
    isPendingApproval: processState.status === 'pending_approval',
    startProcess,
    completeProcess,
    setError,
    getAvailableData,
    // Unified approval interface
    approvalStatus: processState.approvalStatus || 'pending',
    autoApprove: processState.autoApprove || false,
    pendingData: processState.pendingData,
    setApprovalStatus,
    setAutoApprove,
    setPendingApproval,
    approveAndContinue,
    declineAndStop,
    availableData // Expose available data directly
  };
};

export default useNodeProcess;