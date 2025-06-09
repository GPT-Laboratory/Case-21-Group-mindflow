import React from 'react';
import { Play, Pause } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

interface EdgeControlsProps {
  isVisible: boolean;
  isPlaying: boolean;
  localDuration: string;
  midX: number;
  midY: number;
  onDurationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDurationBlur: () => void;
  onPlayPause: () => void;
}

export const EdgeControls: React.FC<EdgeControlsProps> = ({
  isVisible,
  isPlaying,
  localDuration,
  midX,
  midY,
  onDurationChange,
  onDurationBlur,
  onPlayPause,
}) => {
  if (!isVisible) return null;

  return (
    <>
      {/* Play/Pause Controls - positioned above the edge */}
      <foreignObject
        x={midX - 15}
        y={midY - 35}
        width={30}
        height={24}
        style={{ pointerEvents: 'auto' }}
      >
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onPlayPause}
                className="w-7 h-6 p-0 bg-white/90 hover:bg-white border border-gray-200 rounded-sm shadow-sm transition-all duration-200"
              >
                {isPlaying ? (
                  <Pause className="w-3 h-3" />
                ) : (
                  <Play className="w-3 h-3 ml-0.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {isPlaying ? 'Pause animation' : 'Play animation'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </foreignObject>

      {/* Duration Input - positioned below the edge */}
      <foreignObject
        x={midX - 20}
        y={midY + 10}
        width={40}
        height={18}
        style={{ pointerEvents: 'auto' }}
      >
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={localDuration}
                onChange={onDurationChange}
                onBlur={onDurationBlur}
                className="w-10 h-4 text-xs bg-white/90 hover:bg-white border-0 focus:border focus:border-blue-300 rounded-sm px-1 text-center font-mono shadow-sm transition-all duration-200 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                style={{
                  fontSize: '10px',
                  lineHeight: '1',
                }}
              />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Process & Animation Duration (seconds)
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </foreignObject>
    </>
  );
};