import { useCallback, useEffect, useState } from 'react';
import { useProcessContext } from './ProcessContext';
import { useReactFlow } from '@xyflow/react';

export interface UseNodeProcessOptions {
  /** Node ID */
  nodeId: string;
  /** Auto-start processing when data is received */
  autoStartOnData?: boolean;
  /** Enhanced complete process for selective routing */
  enhancedCompleteProcess?: boolean;
}

export const useNodeProcess = (options: UseNodeProcessOptions) => {
  const { nodeId, autoStartOnData = false, enhancedCompleteProcess = false } = options;
  const processContext = useProcessContext();
  const { getEdges } = useReactFlow();
  
  // Simple state management
  const [hasProcessedCurrentData, setHasProcessedCurrentData] = useState(false);
  
  const processState = processContext.getNodeProcessState(nodeId);
  const availableData = processContext.getFlowData(nodeId);

  // Start processing
  const startProcess = useCallback((data?: any) => {
    processContext.startNodeProcess(nodeId, data);
    // Clear the input data since we're now processing it
    console.log(`🔄 Node ${nodeId} started processing with data:`, data);
  }, [processContext, nodeId]);

  // Auto-start processing when new data arrives - FIXED: Added startProcess to dependencies and improved logic
  useEffect(() => {
    if (!autoStartOnData || !availableData || hasProcessedCurrentData) return;
    if (processState.status === 'processing') return;

    console.log(`🚀 Auto-starting processing for node ${nodeId} with data:`, availableData);
    
    // Use setTimeout to ensure the data is fully propagated through React's state system
    const timeoutId = setTimeout(() => {
      startProcess(availableData);
      setHasProcessedCurrentData(true);
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [autoStartOnData, availableData, hasProcessedCurrentData, processState.status, nodeId, startProcess]);

  // Reset processed flag when data changes
  useEffect(() => {
    setHasProcessedCurrentData(false);
  }, [availableData]);

  // Complete processing and publish data to outgoing edges
  const completeProcess = useCallback((result?: any) => {
    console.log(`✅ Node ${nodeId} completed processing with result:`, result);
    processContext.completeNodeProcess(nodeId, result);
    processContext.clearFlowData(nodeId);
    
    // 🎯 NEW: Enhanced selective routing support
    if (enhancedCompleteProcess && result !== undefined && result !== null) {
      // Check if result has selective routing format
      if (typeof result === 'object' && result.data && result.targets && Array.isArray(result.targets)) {
        const { data, targets } = result;
        
        console.log(`🎯 Node ${nodeId} using selective routing to targets:`, targets);
        
        // Only publish to specified targets
        const edges = getEdges();
        const targetEdges = edges.filter(edge => 
          edge.source === nodeId && targets.includes(edge.target)
        );
        
        targetEdges.forEach(edge => {
          console.log(`📤 Node ${nodeId} publishing data to specific target ${edge.target} via edge ${edge.id}:`, data);
          processContext.setFlowData(edge.id, data);
        });
        
        // Log which edges were skipped
        const allOutgoingEdges = edges.filter(edge => edge.source === nodeId);
        const skippedEdges = allOutgoingEdges.filter(edge => !targets.includes(edge.target));
        if (skippedEdges.length > 0) {
          console.log(`⏭️ Node ${nodeId} skipped publishing to:`, skippedEdges.map(e => e.target));
        }
        
      } else {
        // Legacy behavior - send to all targets
        console.log(`📤 Node ${nodeId} using legacy routing (all targets)`);
        const edges = getEdges();
        const outgoingEdges = edges.filter(edge => edge.source === nodeId);
        
        // Set data for each outgoing EDGE (not directly to target node)
        outgoingEdges.forEach(edge => {
          console.log(`📤 Node ${nodeId} publishing data to edge ${edge.id}:`, result);
          processContext.setFlowData(edge.id, result);
        });
      }
    } else {
      // Standard behavior for non-enhanced nodes
      if (result !== undefined && result !== null) {
        const edges = getEdges();
        const outgoingEdges = edges.filter(edge => edge.source === nodeId);
        
        // Set data for each outgoing EDGE (not directly to target node)
        outgoingEdges.forEach(edge => {
          console.log(`📤 Node ${nodeId} publishing data to edge ${edge.id}:`, result);
          processContext.setFlowData(edge.id, result);
        });
      }
    }
  }, [processContext, nodeId, getEdges, enhancedCompleteProcess]);

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