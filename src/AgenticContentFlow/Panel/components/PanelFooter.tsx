import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, RotateCcw, Sparkles } from 'lucide-react';
import { PositionSelector } from './PositionSelector';

type PanelPosition = 'top' | 'bottom' | 'left' | 'right';

interface PanelFooterProps {
  hasChanges: boolean;
  onSave: () => void;
  onReset: () => void;
  position: PanelPosition;
  onPositionChange: (position: PanelPosition) => void;
  hasDataChanges?: boolean;
  onGenerate?: () => void;
}

export const PanelFooter: React.FC<PanelFooterProps> = ({ 
  hasChanges, 
  onSave, 
  onReset,
  position,
  onPositionChange,
  hasDataChanges = false,
  onGenerate
}) => {
  return (
    <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-2">
      {/* Top row (or left side on wider screens) - Position selector */}
      <div className="flex items-center justify-center sm:justify-start">
        <PositionSelector 
          position={position} 
          onPositionChange={onPositionChange} 
        />
      </div>
      
      {/* Bottom row (or right side on wider screens) - Action buttons */}
      <div className="flex justify-center space-x-2 sm:justify-end">
        {onGenerate && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onGenerate}
            disabled={!hasDataChanges}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Sparkles className="w-3 h-3" />
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onReset}
          disabled={!hasChanges}
        >
          <RotateCcw className="w-3 h-3" />
        </Button>
        <Button 
          size="sm" 
          onClick={onSave}
          disabled={!hasChanges}
        >
          <Save className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};