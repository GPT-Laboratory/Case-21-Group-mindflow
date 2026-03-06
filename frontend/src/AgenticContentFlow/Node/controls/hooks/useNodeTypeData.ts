import { useMemo } from 'react';
import { useUnifiedNodeTypeStore } from '../../store/useNodeTypeStore';
import { FrameJSON } from '../../factory/types/FrameJSON';

interface UseNodeTypeDataReturn {
  nodeTypes: FrameJSON[];
  getNodeTypeConfig: (nodeType: string) => FrameJSON | undefined;
}

export const useNodeTypeData = (): UseNodeTypeDataReturn => {
  const { getAllNodeTypes } = useUnifiedNodeTypeStore();
  const nodeTypeMap = getAllNodeTypes();

  // Convert node type map to array of FrameJSON objects
  const nodeTypes = useMemo(() => {
    const types: FrameJSON[] = [];
    nodeTypeMap.forEach((config) => {
      types.push(config);
    });
    return types;
  }, [nodeTypeMap]);

  const getNodeTypeConfig = useMemo(() => {
    return (nodeType: string): FrameJSON | undefined => {
      return nodeTypeMap.get(nodeType);
    };
  }, [nodeTypeMap]);

  return {
    nodeTypes,
    getNodeTypeConfig
  };
}; 