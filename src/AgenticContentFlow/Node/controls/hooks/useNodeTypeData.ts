import { useMemo } from 'react';
import { useUnifiedNodeTypeStore } from '../../store/useUnifiedNodeTypeStore';
import { UnifiedFrameJSON } from '../../factory/types/UnifiedFrameJSON';

interface UseNodeTypeDataReturn {
  nodeTypes: UnifiedFrameJSON[];
  getNodeTypeConfig: (nodeType: string) => UnifiedFrameJSON | undefined;
}

export const useNodeTypeData = (): UseNodeTypeDataReturn => {
  const { getAllNodeTypes } = useUnifiedNodeTypeStore();
  const nodeTypeMap = getAllNodeTypes();

  // Convert node type map to array of UnifiedFrameJSON objects
  const nodeTypes = useMemo(() => {
    const types: UnifiedFrameJSON[] = [];
    nodeTypeMap.forEach((config) => {
      types.push(config);
    });
    return types;
  }, [nodeTypeMap]);

  const getNodeTypeConfig = useMemo(() => {
    return (nodeType: string): UnifiedFrameJSON | undefined => {
      return nodeTypeMap.get(nodeType);
    };
  }, [nodeTypeMap]);

  return {
    nodeTypes,
    getNodeTypeConfig
  };
}; 