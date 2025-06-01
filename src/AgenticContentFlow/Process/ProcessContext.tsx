import React, { createContext, useContext, useCallback, useRef, useState } from 'react';

export interface ProcessConfig {
  /** Minimum duration (ms) for animations to remain visible */
  minAnimationDuration: number;
  /** Default processing delay (ms) for visual feedback */
  defaultProcessingDelay: number;
  /** Enable debug logging */
  debug: boolean;
}

export interface ProcessState {
  /** Current processing status */
  status: 'idle' | 'processing' | 'completed' | 'error';
  /** Start time of the process */
  startTime?: number;
  /** Data being processed or result */
  data?: any;
  /** Error information if status is 'error' */
  error?: string;
}

export interface EdgeDataFlow {
  /** Edge ID */
  edgeId: string;
  /** Source node ID */
  sourceNodeId: string;
  /** Target node ID */
  targetNodeId: string;
  /** Data being transmitted */
  data: any;
  /** Transmission start time */
  startTime: number;
  /** Whether the target has acknowledged receipt */
  acknowledged: boolean;
}

interface ProcessContextValue {
  /** Configuration settings */
  config: ProcessConfig;
  /** Update configuration */
  updateConfig: (config: Partial<ProcessConfig>) => void;
  
  /** Node process states */
  nodeProcesses: Map<string, ProcessState>;
  /** Start processing for a node */
  startNodeProcess: (nodeId: string, data?: any) => void;
  /** Complete processing for a node */
  completeNodeProcess: (nodeId: string, result?: any) => void;
  /** Set error state for a node */
  setNodeError: (nodeId: string, error: string) => void;
  /** Get process state for a node */
  getNodeProcessState: (nodeId: string) => ProcessState;
  
  /** Active edge data flows */
  edgeDataFlows: Map<string, EdgeDataFlow>;
  /** Publish data to an edge (source node releases data) */
  publishToEdge: (edgeId: string, sourceNodeId: string, targetNodeId: string, data: any) => void;
  /** Subscribe to edge data (target node acknowledges receipt) */
  acknowledgeEdgeData: (edgeId: string, targetNodeId: string) => void;
  /** Get edge data flow state */
  getEdgeDataFlow: (edgeId: string) => EdgeDataFlow | undefined;
  /** Check if edge should show animation */
  shouldAnimateEdge: (edgeId: string) => boolean;
  
  /** Event listeners */
  addEventListener: (event: ProcessEvent, callback: ProcessEventCallback) => () => void;
}

export type ProcessEvent = 
  | 'nodeProcessStart'
  | 'nodeProcessComplete' 
  | 'nodeProcessError'
  | 'edgeDataPublish'
  | 'edgeDataAcknowledge';

export type ProcessEventCallback = (data: any) => void;

const ProcessContext = createContext<ProcessContextValue | null>(null);

export const useProcessContext = () => {
  const context = useContext(ProcessContext);
  if (!context) {
    throw new Error('useProcessContext must be used within a ProcessProvider');
  }
  return context;
};

interface ProcessProviderProps {
  children: React.ReactNode;
  initialConfig?: Partial<ProcessConfig>;
}

export const ProcessProvider: React.FC<ProcessProviderProps> = ({ 
  children, 
  initialConfig = {} 
}) => {
  const [config, setConfig] = useState<ProcessConfig>({
    minAnimationDuration: 1000,
    defaultProcessingDelay: 500,
    debug: false,
    ...initialConfig
  });

  const nodeProcesses = useRef(new Map<string, ProcessState>());
  const edgeDataFlows = useRef(new Map<string, EdgeDataFlow>());
  const eventListeners = useRef(new Map<ProcessEvent, Set<ProcessEventCallback>>());
  const [, forceUpdate] = useState(0);

  const triggerUpdate = useCallback(() => {
    forceUpdate(prev => prev + 1);
  }, []);

  const emitEvent = useCallback((event: ProcessEvent, data: any) => {
    const listeners = eventListeners.current.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
    if (config.debug) {
      console.log(`[ProcessContext] Event: ${event}`, data);
    }
  }, [config.debug]);

  const updateConfig = useCallback((newConfig: Partial<ProcessConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const startNodeProcess = useCallback((nodeId: string, data?: any) => {
    const processState: ProcessState = {
      status: 'processing',
      startTime: Date.now(),
      data
    };
    
    nodeProcesses.current.set(nodeId, processState);
    emitEvent('nodeProcessStart', { nodeId, data });
    triggerUpdate();
  }, [emitEvent, triggerUpdate]);

  const completeNodeProcess = useCallback((nodeId: string, result?: any) => {
    const currentState = nodeProcesses.current.get(nodeId);
    if (!currentState) return;

    const minDuration = config.minAnimationDuration;
    const elapsed = Date.now() - (currentState.startTime || 0);
    const remainingDelay = Math.max(0, minDuration - elapsed);

    const doComplete = () => {
      const completedState: ProcessState = {
        ...currentState,
        status: 'completed',
        data: result
      };
      
      nodeProcesses.current.set(nodeId, completedState);
      emitEvent('nodeProcessComplete', { nodeId, result });
      triggerUpdate();

      // Auto-clear completed state after a delay
      setTimeout(() => {
        nodeProcesses.current.delete(nodeId);
        triggerUpdate();
      }, 2000);
    };

    if (remainingDelay > 0) {
      setTimeout(doComplete, remainingDelay);
    } else {
      doComplete();
    }
  }, [config.minAnimationDuration, emitEvent, triggerUpdate]);

  const setNodeError = useCallback((nodeId: string, error: string) => {
    const currentState = nodeProcesses.current.get(nodeId);
    const errorState: ProcessState = {
      ...currentState,
      status: 'error',
      error
    };
    
    nodeProcesses.current.set(nodeId, errorState);
    emitEvent('nodeProcessError', { nodeId, error });
    triggerUpdate();
  }, [emitEvent, triggerUpdate]);

  const getNodeProcessState = useCallback((nodeId: string): ProcessState => {
    return nodeProcesses.current.get(nodeId) || { status: 'idle' };
  }, []);

  const publishToEdge = useCallback((
    edgeId: string, 
    sourceNodeId: string, 
    targetNodeId: string, 
    data: any
  ) => {
    const dataFlow: EdgeDataFlow = {
      edgeId,
      sourceNodeId,
      targetNodeId,
      data,
      startTime: Date.now(),
      acknowledged: false
    };
    
    edgeDataFlows.current.set(edgeId, dataFlow);
    emitEvent('edgeDataPublish', { edgeId, sourceNodeId, targetNodeId, data });
    triggerUpdate();
  }, [emitEvent, triggerUpdate]);

  const acknowledgeEdgeData = useCallback((edgeId: string, targetNodeId: string) => {
    const dataFlow = edgeDataFlows.current.get(edgeId);
    if (!dataFlow || dataFlow.targetNodeId !== targetNodeId) return;

    const minDuration = config.minAnimationDuration;
    const elapsed = Date.now() - dataFlow.startTime;
    const remainingDelay = Math.max(0, minDuration - elapsed);

    const doAcknowledge = () => {
      dataFlow.acknowledged = true;
      edgeDataFlows.current.set(edgeId, dataFlow);
      emitEvent('edgeDataAcknowledge', { edgeId, targetNodeId });
      triggerUpdate();

      // Auto-clear acknowledged data flow after a delay
      setTimeout(() => {
        edgeDataFlows.current.delete(edgeId);
        triggerUpdate();
      }, 1000);
    };

    if (remainingDelay > 0) {
      setTimeout(doAcknowledge, remainingDelay);
    } else {
      doAcknowledge();
    }
  }, [config.minAnimationDuration, emitEvent, triggerUpdate]);

  const getEdgeDataFlow = useCallback((edgeId: string) => {
    return edgeDataFlows.current.get(edgeId);
  }, []);

  const shouldAnimateEdge = useCallback((edgeId: string) => {
    const dataFlow = edgeDataFlows.current.get(edgeId);
    return dataFlow ? !dataFlow.acknowledged : false;
  }, []);

  const addEventListener = useCallback((event: ProcessEvent, callback: ProcessEventCallback) => {
    if (!eventListeners.current.has(event)) {
      eventListeners.current.set(event, new Set());
    }
    eventListeners.current.get(event)!.add(callback);

    // Return cleanup function
    return () => {
      eventListeners.current.get(event)?.delete(callback);
    };
  }, []);

  const contextValue: ProcessContextValue = {
    config,
    updateConfig,
    nodeProcesses: nodeProcesses.current,
    startNodeProcess,
    completeNodeProcess,
    setNodeError,
    getNodeProcessState,
    edgeDataFlows: edgeDataFlows.current,
    publishToEdge,
    acknowledgeEdgeData,
    getEdgeDataFlow,
    shouldAnimateEdge,
    addEventListener
  };

  return (
    <ProcessContext.Provider value={contextValue}>
      {children}
    </ProcessContext.Provider>
  );
};

export default ProcessProvider;