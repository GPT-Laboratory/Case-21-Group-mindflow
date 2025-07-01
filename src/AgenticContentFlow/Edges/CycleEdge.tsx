/** @format */
import { StepEdge, EdgeProps, Node } from '@xyflow/react'
import { pathfindingJumpPointNoDiagonal, SmartEdge, SmartEdgeOptions, svgDrawSmoothLinePath } from '@jalez/react-flow-smart-edge'
import { CSSProperties, useState } from 'react';
import { Package, PackageOpen } from 'lucide-react';
import { EdgeControls } from './EdgeControls';
import { useEdgeAnimation } from './hooks/useEdgeAnimation';
import { useEdgeControls } from './hooks/useEdgeControls';
import { getEdgeColors } from './utils/edgeStyles';
import { useNodeContext } from '../Node/context/useNodeContext';

const StepConfiguration: SmartEdgeOptions = {
	drawEdge: svgDrawSmoothLinePath,
	generatePath: pathfindingJumpPointNoDiagonal,
    nodePadding: 30,
	fallback: StepEdge as any // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
}

export function CycleEdge({
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
  ...props
}: EdgeProps) {
    //Lets take the source id and use that to find the node and get its parent, and only use the parents nodes 
  const {nodeMap, nodeParentIdMapWithChildIdSet} = useNodeContext();
  const sourceNode = nodeMap.get(source);
  const targetNode = nodeMap.get(target);
  const sourceParentChildrenIds = nodeParentIdMapWithChildIdSet.get(sourceNode?.parentId ?? "no-parent");
  
  const targetParentChildrenIds = nodeParentIdMapWithChildIdSet.get(targetNode?.parentId ?? "no-parent");
  
  //Get the nodes
  let sourceParentChildren: Node[] = []
  let targetParentChildren: Node[] = []
  sourceParentChildrenIds?.forEach(id => {
    if(nodeMap.has(id)) {
      const node = nodeMap.get(id);
      if (node) {
        sourceParentChildren.push(node as unknown as Node);
      }
    }
  });
  targetParentChildrenIds?.forEach(id => {
    if(nodeMap.has(id)) {
      const node = nodeMap.get(id);
      if (node) {
        targetParentChildren.push(node as unknown as Node);
      }
    }
  });

  //INclude the parents
  const targetParent = nodeMap.get(targetNode?.parentId ?? "no-parent");
  const sourceParent = nodeMap.get(sourceNode?.parentId ?? "no-parent");
  let parents: Node[] = []
  //If both parents exist and they are not the same, add them
  if(sourceParent && targetParent && sourceParent.id !== targetParent.id) {
    parents.push(sourceParent as unknown as Node, targetParent as unknown as Node);
  }
  else if(sourceParent && sourceParent.id === targetParent?.id) {
    parents.push(sourceParent as unknown as Node);
  }
  else if(targetParent && targetParent.id === sourceParent?.id) {
    parents.push(targetParent as unknown as Node);
  }

  const nodes = [
    ...parents,
    ...(sourceParentChildren || []), ...(targetParentChildren || [])];

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

  const colors = getEdgeColors(lifecyclePhase);
  const edgeStyle: CSSProperties = {
    stroke: colors.edgeColor,
    strokeWidth: colors.strokeWidth,
    fill: 'none',
  };

  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  const showControls = isHovered || selected || false;

  return (
    <>
      <SmartEdge 
        id={id}
        source={source}
        target={target}
        sourceX={sourceX}
        sourceY={sourceY}
        targetX={targetX}
        targetY={targetY}
        sourcePosition={sourcePosition}
        targetPosition={targetPosition}
        options={StepConfiguration} 
        nodes={nodes as any} // eslint-disable-line @typescript-eslint/no-explicit-any
        style={edgeStyle as any}
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
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
              path={`M ${sourceX} ${sourceY} L ${targetX} ${targetY}`}    
            />
          </Package>
        )}
      </svg>
    </>
  );
}