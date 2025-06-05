import React, { createContext, useContext, useCallback, useState, useMemo } from 'react';

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

  // Use React state instead of useRef for reactive updates
  const [nodeProcesses, setNodeProcesses] = useState<Map<string, ProcessState>>(new Map());
  const [flowData, setFlowData] = useState<Map<string, any>>(new Map());
  const [nodeLastData, setNodeLastData] = useState<Map<string, any>>(new Map());

  const updateConfig = useCallback((newConfig: Partial<ProcessConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const startNodeProcess = useCallback((nodeId: string, data?: any) => {
    const processState: ProcessState = {
      status: 'processing',
      startTime: Date.now(),
      data
    };
    
    setNodeProcesses(prev => new Map(prev).set(nodeId, processState));
    if (config.debug) {
      console.log(`[ProcessContext] Node process started: ${nodeId}`, data);
    }
  }, [config.debug]);

  const completeNodeProcess = useCallback((nodeId: string, result?: any) => {
    setNodeProcesses(prev => {
      const current = prev.get(nodeId);
      if (!current) return prev;

      const minDuration = config.minAnimationDuration;
      const elapsed = Date.now() - (current.startTime || 0);
      const remainingDelay = Math.max(0, minDuration - elapsed);

      const doComplete = () => {
        const completedState: ProcessState = {
          ...current,
          status: 'completed',
          data: result
        };
        
        setNodeProcesses(prevProcesses => new Map(prevProcesses).set(nodeId, completedState));
        setNodeLastData(prevLastData => new Map(prevLastData).set(nodeId, result));
        
        if (config.debug) {
          console.log(`[ProcessContext] Node process completed: ${nodeId}`, result);
        }

        // Auto-clear completed state after a delay
        setTimeout(() => {
          setNodeProcesses(prevProcesses => {
            const newMap = new Map(prevProcesses);
            newMap.delete(nodeId);
            return newMap;
          });
        }, 2000);
      };

      if (remainingDelay > 0) {
        setTimeout(doComplete, remainingDelay);
      } else {
        doComplete();
      }

      return prev;
    });
  }, [config.minAnimationDuration, config.debug]);

  const setNodeError = useCallback((nodeId: string, error: string) => {
    setNodeProcesses(prev => {
      const current = prev.get(nodeId);
      const errorState: ProcessState = {
        ...current,
        status: 'error',
        error
      };
      
      if (config.debug) {
        console.log(`[ProcessContext] Node process error: ${nodeId}`, error);
      }
      
      return new Map(prev).set(nodeId, errorState);
    });
  }, [config.debug]);

  const getNodeProcessState = useCallback((nodeId: string): ProcessState => {
    return nodeProcesses.get(nodeId) || { status: 'idle' };
  }, [nodeProcesses]);

  // FlowData methods - simplified and reactive
  const setFlowDataValue = useCallback((id: string, data: any) => {
    setFlowData(prev => {
      const newMap = new Map(prev);
      newMap.set(id, data);
      if (config.debug) {
        console.log(`[ProcessContext] FlowData set for ${id}:`, data);
      }
      return newMap;
    });
  }, [config.debug]);

  const getFlowData = useCallback((id: string) => {
    return flowData.get(id);
  }, [flowData]);

  const clearFlowData = useCallback((id: string) => {
    setFlowData(prev => {
      const newMap = new Map(prev);
      const existed = newMap.delete(id);
      if (config.debug && existed) {
        console.log(`[ProcessContext] FlowData cleared for ${id}`);
      }
      return newMap;
    });
  }, [config.debug]);

  const getNodeLastData = useCallback((nodeId: string) => {
    return nodeLastData.get(nodeId);
  }, [nodeLastData]);

  const setNodeLastDataValue = useCallback((nodeId: string, data: any) => {
    setNodeLastData(prev => {
      const newMap = new Map(prev);
      newMap.set(nodeId, data);
      if (config.debug) {
        console.log(`[ProcessContext] Node last data set for ${nodeId}:`, data);
      }
      return newMap;
    });
  }, [config.debug]);

  const contextValue: ProcessContextValue = useMemo(() => ({
    config,
    updateConfig,
    nodeProcesses,
    startNodeProcess,
    completeNodeProcess,
    setNodeError,
    getNodeProcessState,
    flowData,
    setFlowData: setFlowDataValue,
    getFlowData,
    clearFlowData,
    nodeLastData,
    getNodeLastData,
    setNodeLastData: setNodeLastDataValue
  }), [
    config,
    updateConfig,
    nodeProcesses,
    startNodeProcess,
    completeNodeProcess,
    setNodeError,
    getNodeProcessState,
    flowData,
    setFlowDataValue,
    getFlowData,
    clearFlowData,
    nodeLastData,
    getNodeLastData,
    setNodeLastDataValue
  ]);

  return (
    <ProcessContext.Provider value={contextValue}>
      {children}
    </ProcessContext.Provider>
  );
};

export default ProcessProvider;