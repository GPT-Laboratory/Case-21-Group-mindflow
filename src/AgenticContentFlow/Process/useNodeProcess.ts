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
    if (data === availableData) {
      processContext.clearFlowData(nodeId);
    }
  }, [processContext, nodeId, availableData]);

  // Complete processing and publish data to outgoing edges
  const completeProcess = useCallback((result?: any) => {
    processContext.completeNodeProcess(nodeId, result);
    
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

  return {
    processState,
    isProcessing: processState.status === 'processing',
    isCompleted: processState.status === 'completed',
    hasError: processState.status === 'error',
    startProcess,
    completeProcess,
    setError,
    getAvailableData,
    availableData // Expose available data directly
  };
};

export default useNodeProcess;