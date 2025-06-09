/** @format */
import { useEffect, useRef, useState } from 'react';
import { useProcessContext } from '../../Process/ProcessContext';

interface UseEdgeAnimationProps {
  id: string;
  source: string;
  target: string;
  initialDuration?: number;
}

interface EdgeAnimationState {
  isAnimationComplete: boolean;
  isAnimationStarted: boolean;
  lifecyclePhase: 'black' | 'blue' | 'green';
  hasCompletedOnce: boolean;
  hasDeliveredData: boolean;
  animationDuration: number;
  animationKey: number;
}

interface UseEdgeAnimationReturn extends EdgeAnimationState {
  animationRef: React.RefObject<SVGAnimateMotionElement | null>;
  setAnimationDuration: (duration: number) => void;
  resetAnimation: () => void;
  shouldAnimate: boolean;
}

export function useEdgeAnimation({
  id,
  source,
  target,
  initialDuration
}: UseEdgeAnimationProps): UseEdgeAnimationReturn {
  const processContext = useProcessContext();
  const sourceProcessState = processContext.getNodeProcessState(source);
  
  const animationRef = useRef<SVGAnimateMotionElement>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const [isAnimationStarted, setIsAnimationStarted] = useState(false);
  const [lifecyclePhase, setLifecyclePhase] = useState<'black' | 'blue' | 'green'>('black');
  const [hasCompletedOnce, setHasCompletedOnce] = useState(false);
  const [hasDeliveredData, setHasDeliveredData] = useState(false);
  const [animationDuration, setAnimationDuration] = useState(
    initialDuration || processContext.config.minAnimationDuration / 1000
  );

  // Determine the lifecycle phase based on source node process state
  useEffect(() => {
    if (sourceProcessState.status === 'idle') {
      if (!hasCompletedOnce) {
        setLifecyclePhase('black');
        setIsAnimationComplete(false);
        setIsAnimationStarted(false);
        setHasDeliveredData(false);
      } else {
        setLifecyclePhase('green');
      }
    } else if (sourceProcessState.status === 'processing') {
      setLifecyclePhase('blue');
      setIsAnimationComplete(false);
      setIsAnimationStarted(false);
      setHasCompletedOnce(false);
      setHasDeliveredData(false);
    } else if (sourceProcessState.status === 'completed') {
      setLifecyclePhase('green');
      setHasCompletedOnce(true);
    } else if (sourceProcessState.status === 'error') {
      setLifecyclePhase('black');
      setIsAnimationComplete(false);
      setIsAnimationStarted(false);
      setHasCompletedOnce(false);
      setHasDeliveredData(false);
      setAnimationKey(prev => prev + 1);
    }
  }, [sourceProcessState.status, hasCompletedOnce]);

  const shouldAnimate = lifecyclePhase === 'green' && !isAnimationComplete && hasCompletedOnce && !hasDeliveredData;

  // Reset animation when process starts again
  useEffect(() => {
    if (sourceProcessState.status === 'processing' && lifecyclePhase === 'blue') {
      setAnimationKey(prev => prev + 1);
      setIsAnimationComplete(false);
      setIsAnimationStarted(false);
      setHasDeliveredData(false);
    }
  }, [sourceProcessState.status, lifecyclePhase]);

  // Handle animation end event
  useEffect(() => {
    const animationElement = animationRef.current;
    if (!animationElement) return;

    const handleAnimationEnd = () => {
      console.log(`🎉 Animation for edge ${id} completed`);
      setIsAnimationComplete(true);
      setIsAnimationStarted(false);
      
      if (!hasDeliveredData && target && source && id) {
        console.log(`🎯 Edge ${id} animation completed - delivering data from edge to node ${target}`);
        
        const edgeData = processContext.getFlowData(id);
        
        if (edgeData) {
          processContext.setFlowData(target, edgeData);
          processContext.clearFlowData(id);
          setHasDeliveredData(true);
          
          console.log(`📦 Data delivered from edge ${id} to node ${target}:`, edgeData);
        }
      }
    };

    const handleAnimationBegin = () => {
      console.log(`🚀 Animation for edge ${id} started`);
      setIsAnimationStarted(true);
      
      const timeoutId = setTimeout(() => {
        console.log(`⏰ Fallback timer triggered for edge ${id} (duration: ${animationDuration}s)`);
        if (isAnimationStarted && !isAnimationComplete && !hasDeliveredData) {
          handleAnimationEnd();
        }
      }, (animationDuration * 1000) + 100);
      
      (animationElement as any).__fallbackTimeoutId = timeoutId;
    };

    animationElement.addEventListener('endEvent', handleAnimationEnd);
    animationElement.addEventListener('beginEvent', handleAnimationBegin);
    
    return () => {
      animationElement.removeEventListener('endEvent', handleAnimationEnd);
      animationElement.removeEventListener('beginEvent', handleAnimationBegin);
      
      if ((animationElement as any).__fallbackTimeoutId) {
        clearTimeout((animationElement as any).__fallbackTimeoutId);
      }
    };
  }, [animationKey, hasDeliveredData, target, source, id, processContext, animationDuration, isAnimationStarted, isAnimationComplete]);

  // Start animation when entering green phase
  useEffect(() => {
    if (shouldAnimate && !isAnimationStarted) {
      const delay = animationDuration < 1 ? 10 : 50;
      
      const timeoutId = setTimeout(() => {
        setIsAnimationStarted(true);
        requestAnimationFrame(() => {
          if (animationRef.current) {
            try {
              console.log(`🎬 Starting animation for edge ${id} with duration ${animationDuration}s`);
              animationRef.current.beginElement();
            } catch (error) {
              console.warn('Animation restart failed:', error);
              setIsAnimationStarted(false);
            }
          }
        });
      }, delay);

      return () => clearTimeout(timeoutId);
    }
  }, [shouldAnimate, isAnimationStarted, animationKey, animationDuration, id]);

  const resetAnimation = () => {
    setAnimationKey(prev => prev + 1);
    setIsAnimationComplete(false);
    setIsAnimationStarted(false);
    setHasDeliveredData(false);
  };

  return {
    animationRef,
    isAnimationComplete,
    isAnimationStarted,
    lifecyclePhase,
    hasCompletedOnce,
    hasDeliveredData,
    animationDuration,
    animationKey,
    setAnimationDuration,
    resetAnimation,
    shouldAnimate
  };
}