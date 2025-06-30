import { useCallback, useEffect } from 'react';
import { useReactFlow, Node } from '@xyflow/react';

interface UseNodeProcessStateSyncProps {
  id: string;
  data: any;
  isNodeUpdating: boolean;
  processIsProcessing: boolean;
  processIsCompleted: boolean;
  processHasError: boolean;
}

export const useNodeProcessStateSync = ({ 
  id, 
  data, 
  isNodeUpdating, 
  processIsProcessing, 
  processIsCompleted, 
  processHasError 
}: UseNodeProcessStateSyncProps) => {
  const { setNodes } = useReactFlow();

  const updateProcessState = useCallback(() => {
    const currentProcessState = data?.processState;
    let newProcessState: 'idle' | 'processing' | 'completed' | 'error' = 'idle';
    
    if (isNodeUpdating) {
      newProcessState = 'processing';
    } else if (processIsProcessing) {
      newProcessState = 'processing';
    } else if (processIsCompleted) {
      newProcessState = 'completed';
    } else if (processHasError) {
      newProcessState = 'error';
    }
    
    if (currentProcessState !== newProcessState) {
      setNodes((nodes: Node[]) =>
        nodes.map((node: Node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  processState: newProcessState
                }
              }
            : node
        )
      );
    }
  }, [isNodeUpdating, processIsProcessing, processIsCompleted, processHasError, data?.processState, id, setNodes]);

  useEffect(() => {
    updateProcessState();
  }, [updateProcessState]);

  return { updateProcessState };
}; 