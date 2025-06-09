/** @format */
import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react';
import { useState } from 'react';
import { Package, PackageOpen } from 'lucide-react';
import { EdgeControls } from './EdgeControls';
import { useEdgeAnimation } from './hooks/useEdgeAnimation';
import { useEdgeControls } from './hooks/useEdgeControls';
import { getEdgeColors } from './utils/edgeStyles';

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
  } = useEdgeAnimation({
    id: id!,
    source: source!,
    target: target!,
  });

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

  // Calculate edge path
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Get colors based on lifecycle phase
  const colors = getEdgeColors(lifecyclePhase);

  const edgeStyle = {
    stroke: colors.edgeColor,
    strokeWidth: colors.strokeWidth,
    fill: 'none',
  };

  // Calculate midpoint for controls positioning
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  // Show controls when edge is hovered or selected
  const showControls = isHovered || selected || false;

  return (
    <>
      <BaseEdge 
        id={id} 
        path={edgePath} 
        style={edgeStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      
      {/* Edge Controls Component */}
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

      {/* SVG Animation Layer */}
      <svg
        style={{
          overflow: 'visible',
          position: 'absolute',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <path id={`path-${id}`} d={edgePath} style={{ visibility: 'hidden' }} />
        
        {/* Static package at source - visible in blue/green phases, hidden during/after animation */}
        {lifecyclePhase !== 'black' && !isAnimationStarted && !(hasCompletedOnce && isAnimationComplete) && (
          <g 
          transform={`translate(${sourceX - 12}, ${sourceY - 12})`}
          >
            {lifecyclePhase === 'blue' ? (
              <g>
                {/* White background circle for the open package */}
                <circle 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  fill="white" 
                  stroke="none"
                />
                <PackageOpen 
                  size={24} 
                  stroke={colors.packageColor} 
                  strokeWidth="2"
                />
              </g>
            ) : (
              <Package 
                size={24} 
                stroke={colors.packageColor} 
                fill="white"
                strokeWidth="2"
              />
            )}
          </g>
        )}
        
        {/* Animated package - only during animation */}
        {isAnimationStarted && !isAnimationComplete && (
          <g   transform="translate(-12, -12)">
            <Package 
              size={24} 
              stroke={colors.packageColor} 
              fill="white"
              strokeWidth="2"
            
            >
              <animateMotion
                ref={animationRef}
                dur={`${animationDuration}s`}
                repeatCount="1"
                begin="indefinite"
                fill="freeze"
                rotate="0"
                keyTimes="0;1"
                keyPoints="0;1"
              >
                <mpath href={`#path-${id}`} />
              </animateMotion>
            </Package>
          </g>
        )}
      </svg>
    </>
  );
}