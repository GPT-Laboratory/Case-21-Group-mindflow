/** @format */
import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react';
import { useMemo, useState } from 'react';
import { Package, PackageOpen } from 'lucide-react';
import { EdgeControls } from './EdgeControls';
import { useEdgeAnimation } from './hooks/useEdgeAnimation';
import { useEdgeControls } from './hooks/useEdgeControls';
import { getEdgeColors } from './utils/edgeStyles';
import { useNodeContext } from '../Node/context/useNodeContext';
import { getNodeType } from '../Node/store/NodeTypeStoreInitializer';
import { UnifiedStyleManager } from '../Node/factory/utils/UnifiedStyleManager';

export function AnimatedPackageEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  source,
  target,
  selected,
}: EdgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { nodeMap } = useNodeContext();
  const sourceNode = source ? nodeMap.get(source) : undefined;

  // Animation logic
  const {
    animationRef,
    isAnimationComplete,
    isAnimationStarted,
    lifecyclePhase,
    hasCompletedOnce,
    animationDuration,
    setAnimationDuration,
    resetAnimation,
  } = useEdgeAnimation({ id: id!, source: source!, target: target! });

  // Controls logic
  const {
    isPlaying,
    localDuration,
    handleDurationChange,
    handleDurationBlur,
    handlePlayPause,
  } = useEdgeControls({
    initialDuration: animationDuration,
    onDurationChange: setAnimationDuration,
  });

  const sourceNodeColor = useMemo(() => {
    if (!sourceNode) {
      return undefined;
    }

    if (sourceNode.data?.nodeColor) {
      return sourceNode.data.nodeColor as string;
    }

    const sourceConfig = sourceNode.type ? getNodeType(String(sourceNode.type)) : null;
    if (!sourceConfig) {
      return undefined;
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

  // Compute the smooth step path
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const colors = getEdgeColors(lifecyclePhase, sourceNodeColor);
  const edgeStyle = {
    stroke: colors.edgeColor,
    strokeWidth: colors.strokeWidth,
    fill: 'none',
  };

  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  const showControls = isHovered || selected || false

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={edgeStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      <EdgeControls
        isVisible={showControls}
        isPlaying={isPlaying}
        localDuration={localDuration}
        midX={midX}
        midY={midY}
        onDurationChange={handleDurationChange}
        onDurationBlur={handleDurationBlur}
        onPlayPause={() => handlePlayPause(animationRef, resetAnimation)}
      />

      <svg
        style={{
          overflow: 'visible',
          position: 'absolute',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        {/* Hidden path remains for visibility or debugging if needed */}
        <path id={`path-${id}`} d={edgePath} style={{ visibility: 'hidden' }} />

        {/* Static package at source */}
        {lifecyclePhase !== 'black' &&
          !isAnimationStarted &&
          !(hasCompletedOnce && isAnimationComplete) && (
            <g transform={`translate(${sourceX - 12}, ${sourceY - 12})`}>
              {lifecyclePhase === 'blue' ? (
                <g>
                  <circle cx="12" cy="12" r="10" fill="white" />
                  <PackageOpen size={24} stroke={colors.packageColor} strokeWidth={2} />
                </g>
              ) : (
                <Package size={24} stroke={colors.packageColor} fill="white" strokeWidth={2} />
              )}
            </g>
          )}

        {/* Inline‐path animation */}
        {isAnimationStarted && !isAnimationComplete && (
          <Package
            size={24}
            stroke={colors.packageColor}
            fill="white"
            strokeWidth={2}
            transform="translate(-12, -12)"
          >
            <animateMotion
              ref={animationRef}
              dur={`${animationDuration}s`}
              repeatCount="1"
              begin="indefinite"
              fill="freeze"
              rotate="0"
              path={edgePath}    
            />
          </Package>
        )}
      </svg>
    </>
  );
}
