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
    <div className="flex items-center justify-between gap-2">
      {/* Position selector */}
      <PositionSelector 
        position={position} 
        onPositionChange={onPositionChange} 
      />
      
      {/* Action buttons */}
      <div className="flex gap-1">
        {onGenerate && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onGenerate}
            disabled={!hasDataChanges}
            className="text-blue-600 border-blue-200 hover:bg-blue-50 h-7 px-2"
          >
            <Sparkles className="w-3 h-3" />
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onReset}
          disabled={!hasChanges}
          className="h-7 px-2"
        >
          <RotateCcw className="w-3 h-3" />
        </Button>
        <Button 
          size="sm" 
          onClick={onSave}
          disabled={!hasChanges}
          className="h-7 px-2"
        >
          <Save className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};