import { useCallback, useEffect } from 'react';
import { useReactFlow, Node } from '@xyflow/react';
import { UnifiedStyleManager } from '../factory/utils/UnifiedStyleManager';
import { FrameJSON } from '../factory/types/FrameJSON';

interface UseNodeColorSyncProps {
  id: string;
  config: FrameJSON;
  data: any;
  styleConfig: any;
}

export const useNodeColorSync = ({ id, config, data, styleConfig }: UseNodeColorSyncProps) => {
  const { setNodes } = useReactFlow();

  const updateNodeColors = useCallback(() => {
    const baseColor = styleConfig.backgroundColor;
    const minimapColor = UnifiedStyleManager.calculateMinimapColor(config, styleConfig);
    const handleColor = UnifiedStyleManager.calculateHandleColor(config, styleConfig);
    
    // Check if any colors have changed
    const colorsChanged = 
      data?.nodeColor !== baseColor ||
      data?.minimapColor !== minimapColor ||
      data?.handleColor !== handleColor;
    
    if (colorsChanged) {
      setNodes((nodes: Node[]) =>
        nodes.map((node: Node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  nodeColor: baseColor,
                }
              }
            : node
        )
      );
    }
  }, [styleConfig, config, data?.nodeColor, data?.minimapColor, data?.handleColor, id, setNodes]);

  useEffect(() => {
    updateNodeColors();
  }, [updateNodeColors]);

  return { updateNodeColors };
}; 