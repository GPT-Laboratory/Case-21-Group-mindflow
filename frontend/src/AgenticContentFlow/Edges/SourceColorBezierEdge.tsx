/** @format */

import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';
import { useMemo } from 'react';
import { useNodeContext } from '../Node/context/useNodeContext';
import { getNodeType } from '../Node/store/NodeTypeStoreInitializer';
import { UnifiedStyleManager } from '../Node/factory/utils/UnifiedStyleManager';

export function SourceColorBezierEdge({
  id,
  source,
  markerEnd,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps) {
  const { nodeMap } = useNodeContext();
  const sourceNode = source ? nodeMap.get(source) : undefined;

  const sourceNodeColor = useMemo(() => {
    if (!sourceNode) {
      return '#000000';
    }

    if (sourceNode.data?.nodeColor) {
      return sourceNode.data.nodeColor as string;
    }

    const sourceConfig = sourceNode.type ? getNodeType(String(sourceNode.type)) : null;
    if (!sourceConfig) {
      return '#000000';
    }

    return UnifiedStyleManager.generateStyleConfig(
      sourceConfig,
      sourceNode.data ?? {},
      {
        selected: false,
        expanded: false,
        isProcessing: false,
        hasError: false,
        isCompleted: false,
      }
    ).backgroundColor;
  }, [sourceNode]);

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: sourceNodeColor,
        strokeWidth: selected ? 3 : 2,
      }}
    />
  );
}

export default SourceColorBezierEdge;
