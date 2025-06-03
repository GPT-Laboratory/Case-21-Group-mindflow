/** @format */
import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react';
import { useProcessContext } from '../Process/ProcessContext';
import { useEffect, useRef, useState } from 'react';
import { Package, PackageOpen } from 'lucide-react';

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
}: EdgeProps) {
  const processContext = useProcessContext();
  const sourceProcessState = processContext.getNodeProcessState(source!);
  
  const animationRef = useRef<SVGAnimateMotionElement>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const [isAnimationStarted, setIsAnimationStarted] = useState(false);
  const [lifecyclePhase, setLifecyclePhase] = useState<'black' | 'blue' | 'green'>('black');
  const [hasCompletedOnce, setHasCompletedOnce] = useState(false);
  const [hasDeliveredData, setHasDeliveredData] = useState(false);

  // Determine the lifecycle phase based on source node process state
  useEffect(() => {
    if (sourceProcessState.status === 'idle') {
      // Only reset to beginning if we're starting fresh (not coming from a completed state)
      if (!hasCompletedOnce) {
        setLifecyclePhase('black');
        setIsAnimationComplete(false);
        setIsAnimationStarted(false);
        setHasDeliveredData(false);
      } else {
        // Stay in completed state if we've finished before
        setLifecyclePhase('green');
      }
    } else if (sourceProcessState.status === 'processing') {
      setLifecyclePhase('blue');
      setIsAnimationComplete(false);
      setIsAnimationStarted(false);
      // Reset the completion flag when starting a new process
      setHasCompletedOnce(false);
      setHasDeliveredData(false);
    } else if (sourceProcessState.status === 'completed') {
      setLifecyclePhase('green');
      setHasCompletedOnce(true);
    } else if (sourceProcessState.status === 'error') {
      // Reset everything on error
      setLifecyclePhase('black');
      setIsAnimationComplete(false);
      setIsAnimationStarted(false);
      setHasCompletedOnce(false);
      setHasDeliveredData(false);
      setAnimationKey(prev => prev + 1);
    }
  }, [sourceProcessState.status, hasCompletedOnce]);

  // Start animation only during green phase and only if not already completed
  const shouldAnimate = lifecyclePhase === 'green' && !isAnimationComplete && hasCompletedOnce && !hasDeliveredData;

  // Reset animation when process starts again (goes from any state back to processing)
  useEffect(() => {
    if (sourceProcessState.status === 'processing' && lifecyclePhase === 'blue') {
      setAnimationKey(prev => prev + 1);
      setIsAnimationComplete(false);
      setIsAnimationStarted(false);
      setHasDeliveredData(false);
    }
  }, [sourceProcessState.status, lifecyclePhase]);

  // Start animation when entering green phase with proper timing
  useEffect(() => {
    if (shouldAnimate && !isAnimationStarted) {
      // Add a small delay to ensure DOM is fully updated and edge path is stable
      const timeoutId = setTimeout(() => {
        setIsAnimationStarted(true);
        // Use requestAnimationFrame twice to ensure all DOM updates are complete
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (animationRef.current) {
              try {
                animationRef.current.beginElement();
              } catch (error) {
                // Fallback if beginElement fails
                console.warn('Animation restart failed:', error);
                // Reset animation state on failure
                setIsAnimationStarted(false);
              }
            }
          });
        });
      }, 50); // Small delay to ensure stability

      return () => clearTimeout(timeoutId);
    }
  }, [shouldAnimate, isAnimationStarted, animationKey]);

  // Handle animation end event - THIS IS WHERE WE DRIVE THE PROCESS FLOW
  useEffect(() => {
    const animationElement = animationRef.current;
    if (!animationElement) return;

    const handleAnimationEnd = () => {
      setIsAnimationComplete(true);
      setIsAnimationStarted(false);
      
      // THIS IS THE KEY CHANGE: Move data from edge to target node when animation completes
      if (!hasDeliveredData && target && source && id) {
        console.log(`🎯 Edge ${id} animation completed - delivering data from edge to node ${target}`);
        
        // Get the data from the edge (put there by source node)
        const edgeData = processContext.getFlowData(id);
        
        if (edgeData) {
          // Move data from edge to target node
          processContext.setFlowData(target, edgeData);
          // Clear the edge data after delivery
          processContext.clearFlowData(id);
          setHasDeliveredData(true);
          
          console.log(`📦 Data delivered from edge ${id} to node ${target}:`, edgeData);
        }
      }
    };

    const handleAnimationBegin = () => {
      // Ensure animation started flag is set
      setIsAnimationStarted(true);
    };

    animationElement.addEventListener('endEvent', handleAnimationEnd);
    animationElement.addEventListener('beginEvent', handleAnimationBegin);
    
    return () => {
      animationElement.removeEventListener('endEvent', handleAnimationEnd);
      animationElement.removeEventListener('beginEvent', handleAnimationBegin);
    };
  }, [animationKey, hasDeliveredData, target, source, id, processContext]);

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Define colors based on lifecycle phase
  const getColors = () => {
    switch (lifecyclePhase) {
      case 'black':
        return {
          edgeColor: '#000000',
          packageColor: '#000000',
          strokeWidth: 2,
        };
      case 'blue':
        return {
          edgeColor: '#3b82f6',
          packageColor: '#3b82f6',
          strokeWidth: 3,
        };
      case 'green':
        return {
          edgeColor: '#10b981',
          packageColor: '#10b981',
          strokeWidth: 3,
        };
      default:
        return {
          edgeColor: '#000000',
          packageColor: '#000000',
          strokeWidth: 2,
        };
    }
  };

  const colors = getColors();

  const edgeStyle = {
    stroke: colors.edgeColor,
    strokeWidth: colors.strokeWidth,
    fill: 'none',
  };

  return (
    <>
      <BaseEdge 
        id={id} 
        path={edgePath} 
        style={edgeStyle}
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
        <path id={`path-${id}`} d={edgePath} style={{ visibility: 'hidden' }} />
        
        {/* Static package at source - visible in blue/green phases, hidden during/after animation */}
        {lifecyclePhase !== 'black' && !isAnimationStarted && !(hasCompletedOnce && isAnimationComplete) && (
          <g transform={`translate(${sourceX - 12}, ${sourceY - 12})`}>
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
        
        {/* Animated package - only during animation, positioned relative to the path start */}
        {isAnimationStarted && !isAnimationComplete && (
          <g>
            <Package 
              size={24} 
              stroke={colors.packageColor} 
              fill="white"
              strokeWidth="2"
              transform="translate(-12, -12)"
            >
              <animateMotion
                ref={animationRef}
                dur="2s"
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