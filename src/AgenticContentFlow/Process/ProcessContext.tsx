import React, { createContext, useContext, useCallback, useRef, useState, useMemo } from 'react';

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

interface ProcessContextValue {
  /** Configuration settings */
  config: ProcessConfig;
  /** Update configuration */
  updateConfig: (config: Partial<ProcessConfig>) => void;
  
  /** Node process states - reactive */
  nodeProcesses: Map<string, ProcessState>;
  /** Start processing for a node */
  startNodeProcess: (nodeId: string, data?: any) => void;
  /** Complete processing for a node */
  completeNodeProcess: (nodeId: string, result?: any) => void;
  /** Set error state for a node */
  setNodeError: (nodeId: string, error: string) => void;
  /** Get process state for a node */
  getNodeProcessState: (nodeId: string) => ProcessState;
  
  /** FlowData - map of node/edge IDs to their data */
  flowData: Map<string, any>;
  /** Set data for a node or edge */
  setFlowData: (id: string, data: any) => void;
  /** Get data for a node or edge */
  getFlowData: (id: string) => any;
  /** Clear data for a node or edge */
  clearFlowData: (id: string) => void;
  
  /** Persistent node data - keeps last processed data for Preview */
  nodeLastData: Map<string, any>;
  /** Get last processed data for a node */
  getNodeLastData: (nodeId: string) => any;
  /** Set last processed data for a node */
  setNodeLastData: (nodeId: string, data: any) => void;
}

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
  const flowData = useRef(new Map<string, any>());
  const nodeLastData = useRef(new Map<string, any>());
  const [updateCounter, setUpdateCounter] = useState(0);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Batched update function to prevent excessive re-renders
  const triggerUpdate = useCallback(() => {
    if (updateTimeoutRef.current) return; // Already scheduled
    
    updateTimeoutRef.current = setTimeout(() => {
      setUpdateCounter(prev => prev + 1);
      updateTimeoutRef.current = null;
    }, 0); // Batch updates in next tick
  }, []);

  const updateConfig = useCallback((newConfig: Partial<ProcessConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Create reactive Maps that trigger re-renders when accessed
  const reactiveNodeProcesses = useMemo(() => {
    // Access updateCounter to ensure re-render when data changes
    updateCounter;
    return new Map(nodeProcesses.current);
  }, [updateCounter]);

  const reactiveFlowData = useMemo(() => {
    updateCounter; // Ensure re-render when data changes
    return new Map(flowData.current);
  }, [updateCounter]);

  const startNodeProcess = useCallback((nodeId: string, data?: any) => {
    const processState: ProcessState = {
      status: 'processing',
      startTime: Date.now(),
      data
    };
    
    nodeProcesses.current.set(nodeId, processState);
    if (config.debug) {
      console.log(`[ProcessContext] Node process started: ${nodeId}`, data);
    }
    triggerUpdate();
  }, [config.debug, triggerUpdate]);

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
      nodeLastData.current.set(nodeId, result);
      if (config.debug) {
        console.log(`[ProcessContext] Node process completed: ${nodeId}`, result);
      }
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
  }, [config.minAnimationDuration, config.debug, triggerUpdate]);

  const setNodeError = useCallback((nodeId: string, error: string) => {
    const currentState = nodeProcesses.current.get(nodeId);
    const errorState: ProcessState = {
      ...currentState,
      status: 'error',
      error
    };
    
    nodeProcesses.current.set(nodeId, errorState);
    if (config.debug) {
      console.log(`[ProcessContext] Node process error: ${nodeId}`, error);
    }
    triggerUpdate();
  }, [config.debug, triggerUpdate]);

  const getNodeProcessState = useCallback((nodeId: string): ProcessState => {
    return nodeProcesses.current.get(nodeId) || { status: 'idle' };
  }, []);

  // FlowData methods - simplified data flow
  const setFlowData = useCallback((id: string, data: any) => {
    flowData.current.set(id, data);
    if (config.debug) {
      console.log(`[ProcessContext] FlowData set for ${id}:`, data);
    }
    triggerUpdate();
  }, [config.debug, triggerUpdate]);

  const getFlowData = useCallback((id: string) => {
    return flowData.current.get(id);
  }, []);

  const clearFlowData = useCallback((id: string) => {
    flowData.current.delete(id);
    if (config.debug) {
      console.log(`[ProcessContext] FlowData cleared for ${id}`);
    }
    triggerUpdate();
  }, [config.debug, triggerUpdate]);

  const getNodeLastData = useCallback((nodeId: string) => {
    return nodeLastData.current.get(nodeId);
  }, []);

  const setNodeLastData = useCallback((nodeId: string, data: any) => {
    nodeLastData.current.set(nodeId, data);
    if (config.debug) {
      console.log(`[ProcessContext] Node last data set for ${nodeId}:`, data);
    }
    triggerUpdate();
  }, [config.debug, triggerUpdate]);

  const contextValue: ProcessContextValue = {
    config,
    updateConfig,
    nodeProcesses: reactiveNodeProcesses,
    startNodeProcess,
    completeNodeProcess,
    setNodeError,
    getNodeProcessState,
    flowData: reactiveFlowData,
    setFlowData,
    getFlowData,
    clearFlowData,
    nodeLastData: nodeLastData.current,
    getNodeLastData,
    setNodeLastData
  };

  return (
    <ProcessContext.Provider value={contextValue}>
      {children}
    </ProcessContext.Provider>
  );
};

export default ProcessProvider;