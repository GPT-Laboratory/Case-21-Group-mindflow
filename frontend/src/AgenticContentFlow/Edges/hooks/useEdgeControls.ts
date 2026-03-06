/** @format */
import { useState, useCallback } from 'react';

interface UseEdgeControlsProps {
  initialDuration: number;
  onDurationChange: (duration: number) => void;
}

interface UseEdgeControlsReturn {
  isPlaying: boolean;
  localDuration: string;
  setIsPlaying: (playing: boolean) => void;
  handleDurationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDurationBlur: () => void;
  handlePlayPause: (animationRef: React.RefObject<SVGAnimateMotionElement | null>, resetAnimation: () => void) => void;
}

export function useEdgeControls({
  initialDuration,
  onDurationChange
}: UseEdgeControlsProps): UseEdgeControlsReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [localDuration, setLocalDuration] = useState(initialDuration.toString());

  const handleDurationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalDuration(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      onDurationChange(numValue);
    }
  }, [onDurationChange]);

  const handleDurationBlur = useCallback(() => {
    const numValue = parseFloat(localDuration);
    if (isNaN(numValue) || numValue <= 0) {
      setLocalDuration(initialDuration.toString());
    }
  }, [localDuration, initialDuration]);

  const handlePlayPause = useCallback((
    animationRef: React.RefObject<SVGAnimateMotionElement | null>,
    resetAnimation: () => void
  ) => {
    if (isPlaying) {
      // Pause: stop current animation
      if (animationRef.current) {
        animationRef.current.endElement();
      }
      setIsPlaying(false);
    } else {
      // Play: start animation
      setIsPlaying(true);
      resetAnimation();
    }
  }, [isPlaying]);

  return {
    isPlaying,
    localDuration,
    setIsPlaying,
    handleDurationChange,
    handleDurationBlur,
    handlePlayPause
  };
}