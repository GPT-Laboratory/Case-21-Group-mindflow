import { useMemo } from 'react';
import { UnifiedStyleManager } from '../factory/utils/UnifiedStyleManager';
import { UnifiedFrameJSON } from '../factory/types/UnifiedFrameJSON';

interface UseNodeStyleManagementProps {
  config: UnifiedFrameJSON;
  data: any;
  selected: boolean;
  expanded: boolean;
  processIsProcessing: boolean;
  isNodeUpdating: boolean;
  processHasError: boolean;
  processIsCompleted: boolean;
}

export const useNodeStyleManagement = ({
  config,
  data,
  selected,
  expanded,
  processIsProcessing,
  isNodeUpdating,
  processHasError,
  processIsCompleted
}: UseNodeStyleManagementProps) => {
  // Update style config with current state
  const styleConfig = useMemo(() => {
    return UnifiedStyleManager.generateStyleConfig(
      config,
      data,
      {
        selected: Boolean(selected),
        expanded,
        isProcessing: processIsProcessing || isNodeUpdating,
        hasError: processHasError,
        isCompleted: processIsCompleted
      }
    );
  }, [config, data, selected, expanded, processIsProcessing, isNodeUpdating, processHasError, processIsCompleted]);

  // Update processing styles with current state
  const processingStyles = useMemo(() => {
    return UnifiedStyleManager.getProcessingStateStyles(
      styleConfig,
      isNodeUpdating ? 'processing' : (processIsProcessing ? 'processing' : 'idle')
    );
  }, [styleConfig, isNodeUpdating, processIsProcessing]);

  return {
    styleConfig,
    processingStyles
  };
}; 