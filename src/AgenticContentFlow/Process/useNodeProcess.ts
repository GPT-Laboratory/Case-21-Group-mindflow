import { useCallback, useEffect, useRef } from 'react';
import { useProcessContext } from './ProcessContext';
import { useReactFlow } from '@xyflow/react';

export interface UseNodeProcessOptions {
  /** Node ID */
  nodeId: string;
  /** Auto-start processing when data is received */
  autoStartOnData?: boolean;
  /** Delay before auto-starting processing (ms) */
  autoStartDelay?: number;
}

export const useNodeProcess = (options: UseNodeProcessOptions) => {
  const { 
    nodeId, 
    autoStartOnData = false,
    autoStartDelay = 300
  } = options;
  const processContext = useProcessContext();
  const { getEdges } = useReactFlow();
  
  // Track processed data to prevent duplicate processing
  const processedDataRef = useRef(new Set<string>());
  const autoStartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const processState = processContext.getNodeProcessState(nodeId);

  // Auto-start processing when new data arrives
  useEffect(() => {
    if (!autoStartOnData || processState.status === 'processing') return;

    // Check for data available for this node
    const nodeData = processContext.getFlowData(nodeId);
    
    if (!nodeData) return;

    // Create a simple deduplication key
    const dataKey = `${nodeId}-${JSON.stringify(nodeData)}-${Date.now()}`;
    
    // Check if we've already processed this exact data
    if (processedDataRef.current.has(dataKey)) return;

    // Mark this data as being processed
    processedDataRef.current.add(dataKey);

    // Clear any existing timeout
    if (autoStartTimeoutRef.current) {
      clearTimeout(autoStartTimeoutRef.current);
    }

    // Start processing after delay
    autoStartTimeoutRef.current = setTimeout(() => {
      // Verify we're still idle and data is still available
      const currentState = processContext.getNodeProcessState(nodeId);
      const currentData = processContext.getFlowData(nodeId);
      
      if (currentState.status === 'idle' && currentData) {
        console.log(`🚀 Auto-starting processing for node ${nodeId} with data:`, currentData);
        startProcess(currentData);
        
        // Clear the data after consuming it
        processContext.clearFlowData(nodeId);
      }
      autoStartTimeoutRef.current = null;
    }, autoStartDelay);

    // Cleanup old processed data tracking
    const cutoffTime = Date.now() - (autoStartDelay * 5);
    const keysToDelete: string[] = [];
    
    processedDataRef.current.forEach(key => {
      const timestamp = parseInt(key.split('-').pop() || '0');
      if (timestamp < cutoffTime) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => processedDataRef.current.delete(key));

    return () => {
      if (autoStartTimeoutRef.current) {
        clearTimeout(autoStartTimeoutRef.current);
        autoStartTimeoutRef.current = null;
      }
    };
  }, [processContext.getFlowData(nodeId), autoStartOnData, autoStartDelay, processState.status, processContext, nodeId]);

  // Start processing
  const startProcess = useCallback((data?: any) => {
    processContext.startNodeProcess(nodeId, data);
  }, [processContext, nodeId]);

  // Complete processing and publish data to outgoing edges
  const completeProcess = useCallback((result?: any) => {
    processContext.completeNodeProcess(nodeId, result);
    
    // Publish result to outgoing edges if we have meaningful data
    if (result !== undefined && result !== null) {
      const edges = getEdges();
      const outgoingEdges = edges.filter(edge => edge.source === nodeId);
      
      // Set data for each outgoing edge
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoStartTimeoutRef.current) {
        clearTimeout(autoStartTimeoutRef.current);
      }
    };
  }, []);

  return {
    processState,
    isProcessing: processState.status === 'processing',
    isCompleted: processState.status === 'completed',
    hasError: processState.status === 'error',
    startProcess,
    completeProcess,
    setError,
    getAvailableData
  };
};

export default useNodeProcess;