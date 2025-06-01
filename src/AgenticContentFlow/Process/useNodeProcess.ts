import { useCallback, useEffect } from 'react';
import { useProcessContext } from './ProcessContext';
import { useReactFlow } from '@xyflow/react';

export interface UseNodeProcessOptions {
  /** Node ID */
  nodeId: string;
  /** Auto-acknowledge incoming data flows */
  autoAcknowledge?: boolean;
  /** Delay before auto-acknowledging (ms) */
  acknowledgeDelay?: number;
  /** Auto-start processing when data is received */
  autoStartOnData?: boolean;
  /** Delay before auto-starting processing (ms) */
  autoStartDelay?: number;
}

export const useNodeProcess = (options: UseNodeProcessOptions) => {
  const { 
    nodeId, 
    autoAcknowledge = true, 
    acknowledgeDelay = 100,
    autoStartOnData = false,
    autoStartDelay = 300
  } = options;
  const processContext = useProcessContext();
  const { getEdges } = useReactFlow();

  const processState = processContext.getNodeProcessState(nodeId);

  // Start processing
  const startProcess = useCallback((data?: any) => {
    processContext.startNodeProcess(nodeId, data);
  }, [processContext, nodeId]);

  // Complete processing and optionally publish data to connected edges
  const completeProcess = useCallback((result?: any, publishToEdges = true) => {
    processContext.completeNodeProcess(nodeId, result);
    
    if (publishToEdges && result !== undefined) {
      // Find outgoing edges and publish data
      const edges = getEdges();
      const outgoingEdges = edges.filter(edge => edge.source === nodeId);
      
      outgoingEdges.forEach(edge => {
        processContext.publishToEdge(edge.id, nodeId, edge.target, result);
      });
    }
  }, [processContext, nodeId, getEdges]);

  // Set error state
  const setError = useCallback((error: string) => {
    processContext.setNodeError(nodeId, error);
  }, [processContext, nodeId]);

  // Acknowledge incoming data on edges
  const acknowledgeIncomingData = useCallback(() => {
    const edges = getEdges();
    const incomingEdges = edges.filter(edge => edge.target === nodeId);
    
    incomingEdges.forEach(edge => {
      const dataFlow = processContext.getEdgeDataFlow(edge.id);
      if (dataFlow && !dataFlow.acknowledged) {
        setTimeout(() => {
          processContext.acknowledgeEdgeData(edge.id, nodeId);
        }, acknowledgeDelay);
      }
    });
  }, [processContext, nodeId, getEdges, acknowledgeDelay]);

  // Auto-acknowledge incoming data flows when autoAcknowledge is enabled
  useEffect(() => {
    if (!autoAcknowledge && !autoStartOnData) return;

    const cleanup = processContext.addEventListener('edgeDataPublish', (data) => {
      if (data.targetNodeId === nodeId) {
        // Auto-acknowledge the data
        if (autoAcknowledge) {
          setTimeout(() => {
            processContext.acknowledgeEdgeData(data.edgeId, nodeId);
          }, acknowledgeDelay);
        }
        
        // Auto-start processing with the received data
        if (autoStartOnData && processState.status === 'idle') {
          setTimeout(() => {
            startProcess(data.data);
          }, autoStartDelay);
        }
      }
    });

    return cleanup;
  }, [processContext, nodeId, autoAcknowledge, acknowledgeDelay, autoStartOnData, autoStartDelay, processState.status, startProcess]);

  return {
    processState,
    isProcessing: processState.status === 'processing',
    isCompleted: processState.status === 'completed',
    hasError: processState.status === 'error',
    startProcess,
    completeProcess,
    setError,
    acknowledgeIncomingData
  };
};

export default useNodeProcess;