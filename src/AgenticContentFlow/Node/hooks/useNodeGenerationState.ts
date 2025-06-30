import { useMemo } from 'react';

interface UseNodeGenerationStateProps {
  nodeStatus: any;
  isNodeUpdating: boolean;
}

export const useNodeGenerationState = ({ nodeStatus, isNodeUpdating }: UseNodeGenerationStateProps) => {
  // Check if label is being updated (for flashing effect)
  const isLabelUpdating = useMemo(() => {
    return nodeStatus?.status === 'generating_label';
  }, [nodeStatus?.status]);

  // Map detailed generation status to basic states for BaseNodeRenderer
  const generationState = useMemo(() => {
    if (!nodeStatus) {
      return isNodeUpdating ? 'generating' : 'idle';
    }
    
    switch (nodeStatus.status) {
      case 'generating_function':
        return 'generating';
      case 'generating_label':
      case 'generating_details':
      case 'generating_url':
        return 'generating';
      case 'completed':
        return 'completed';
      case 'error':
        return 'error';
      default:
        return 'idle';
    }
  }, [nodeStatus, isNodeUpdating]);

  return {
    isLabelUpdating,
    generationState
  };
}; 