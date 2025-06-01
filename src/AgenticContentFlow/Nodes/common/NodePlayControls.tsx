import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, RotateCcw } from 'lucide-react';
import ControlButton from '../../Controls/Components/ControlButton';
import { Input } from '@/components/ui/input';

interface NodePlayControlsProps {
  /** Whether the node is currently processing */
  isProcessing?: boolean;
  /** Whether loop mode is enabled */
  isLooping?: boolean;
  /** Current loop interval in seconds */
  loopInterval?: number;
  /** Callback when play button is clicked */
  onPlay?: () => void;
  /** Callback when stop button is clicked */
  onStop?: () => void;
  /** Callback when loop toggle is clicked */
  onLoopToggle?: () => void;
  /** Callback when loop interval changes */
  onLoopIntervalChange?: (interval: number) => void;
  /** Additional className for the container */
  className?: string;
}

export const NodePlayControls: React.FC<NodePlayControlsProps> = ({
  isProcessing = false,
  isLooping = false,
  loopInterval = 5,
  onPlay,
  onStop,
  onLoopToggle,
  onLoopIntervalChange,
  className = "",
}) => {
  const [intervalValue, setIntervalValue] = useState(loopInterval.toString());
  const [countdown, setCountdown] = useState(0);
  const [showIntervalDropdown, setShowIntervalDropdown] = useState(false);
  const loopButtonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update interval value when prop changes
  useEffect(() => {
    setIntervalValue(loopInterval.toString());
  }, [loopInterval]);

  // Handle loop state changes
  useEffect(() => {
    if (isLooping) {
      startCountdown();
    } else {
      stopCountdown();
    }
  }, [isLooping, loopInterval]);

  const startCountdown = () => {
    setCountdown(loopInterval);
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Time to trigger next execution
          onPlay?.();
          return loopInterval; // Reset countdown
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(0);
  };

  const handlePlay = () => {
    onPlay?.();
  };

  const handleStop = () => {
    // Stop any ongoing processing and looping
    onStop?.();
    stopCountdown();
    
    // If loop was active, toggle it off
    if (isLooping) {
      onLoopToggle?.();
    }
  };

  const handleLoopToggle = () => {
    onLoopToggle?.();
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIntervalValue(value);
    
    // Parse and validate the interval
    const parsedInterval = parseFloat(value);
    if (!isNaN(parsedInterval) && parsedInterval > 0) {
      onLoopIntervalChange?.(parsedInterval);
    }
  };

  const handleIntervalBlur = () => {
    // Ensure we have a valid value when the user leaves the field
    const parsedInterval = parseFloat(intervalValue);
    if (isNaN(parsedInterval) || parsedInterval <= 0) {
      setIntervalValue(loopInterval.toString());
    }
  };

  const handleLoopMouseEnter = () => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // Show dropdown after a short delay
    hoverTimeoutRef.current = setTimeout(() => {
      setShowIntervalDropdown(true);
    }, 300);
  };

  const handleLoopMouseLeave = () => {
    // Clear the show timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // Hide dropdown after a short delay
    hoverTimeoutRef.current = setTimeout(() => {
      setShowIntervalDropdown(false);
    }, 200);
  };

  const handleDropdownMouseEnter = () => {
    // Clear any hide timeout when hovering over dropdown
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleDropdownMouseLeave = () => {
    // Hide dropdown when leaving dropdown area
    hoverTimeoutRef.current = setTimeout(() => {
      setShowIntervalDropdown(false);
    }, 200);
  };

  // Clean up intervals and timeouts on unmount
  useEffect(() => {
    return () => {
      stopCountdown();
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Custom loop icon that shows countdown when looping
  const LoopIcon = () => {
    if (isLooping && countdown > 0) {
      return (
        <div className="relative w-3 h-3 flex items-center justify-center">
          <RotateCcw className="w-3 h-3 absolute" />
          <span className="text-[8px] font-bold text-center leading-none z-10 bg-white rounded-full px-0.5 min-w-[10px]">
            {countdown}
          </span>
        </div>
      );
    }
    return <RotateCcw className="w-3 h-3" />;
  };

  return (
    <div className={`flex items-center gap-1 relative ${className}`}>
      {/* Play Button */}
      <ControlButton
        tooltip={isProcessing ? "Running..." : "Run"}
        onClick={handlePlay}
        icon={<Play className="w-3 h-3" />}
        disabled={isProcessing}
        active={isProcessing}
      />

      {/* Stop Button */}
      <ControlButton
        tooltip="Stop"
        onClick={handleStop}
        icon={<Square className="w-3 h-3" />}
        disabled={!isProcessing && !isLooping}
      />

      {/* Loop Button with integrated countdown and hover dropdown */}
      <div 
        ref={loopButtonRef}
        className="relative"
        onMouseEnter={handleLoopMouseEnter}
        onMouseLeave={handleLoopMouseLeave}
      >
        <ControlButton
          tooltip={isLooping ? "Stop Loop" : "Start Loop"}
          onClick={handleLoopToggle}
          icon={<LoopIcon />}
          active={isLooping}
        />

        {/* Interval Dropdown */}
        {showIntervalDropdown && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 z-50"
            onMouseEnter={handleDropdownMouseEnter}
            onMouseLeave={handleDropdownMouseLeave}
          >
            <div className="bg-white border border-gray-200 rounded-md shadow-lg p-2 min-w-[80px]">
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={intervalValue}
                  onChange={handleIntervalChange}
                  onBlur={handleIntervalBlur}
                  min="0.1"
                  step="0.1"
                  className="w-12 h-6 text-xs px-1 text-center"
                  placeholder="5"
                />
                <span className="text-xs text-slate-500">s</span>
              </div>
              <div className="text-xs text-slate-400 mt-1 text-center">
                Interval
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NodePlayControls;