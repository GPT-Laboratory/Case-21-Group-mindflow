import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, RotateCcw, Sparkles, MoreHorizontal, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

type PanelPosition = 'top' | 'bottom' | 'left' | 'right';

interface PanelMenuProps {
  hasChanges?: boolean;
  hasDataChanges?: boolean;
  onSave?: () => void;
  onReset?: () => void;
  onGenerate?: () => void;
}

export const PanelMenu: React.FC<PanelMenuProps> = ({ 
  hasChanges = false,
  hasDataChanges = false,
  onSave,
  onReset,
  onGenerate,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleGenerate = async () => {
    if (onGenerate) {
      setIsGenerating(true);
      try {
        await onGenerate();
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const positionOptions = [
    { value: 'top', label: 'Top', icon: ArrowUp },
    { value: 'bottom', label: 'Bottom', icon: ArrowDown },
    { value: 'left', label: 'Left', icon: ArrowLeft },
    { value: 'right', label: 'Right', icon: ArrowRight },
  ] as const;

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 w-7 p-0 hover:bg-accent"
        onClick={() => setShowMenu(!showMenu)}
      >
        <MoreHorizontal className="w-3 h-3" />
      </Button>
      
      {showMenu && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-popover border rounded-md shadow-lg z-50">
          {/* Save & Reset */}
          <button
            onClick={() => {
              onSave?.();
              setShowMenu(false);
            }}
            disabled={!hasChanges}
            className="w-full px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Save className="w-3 h-3 mr-2" />
            Save Changes
          </button>
          
          <button
            onClick={() => {
              onReset?.();
              setShowMenu(false);
            }}
            disabled={!hasChanges}
            className="w-full px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <RotateCcw className="w-3 h-3 mr-2" />
            Reset Changes
          </button>
          
          <div className="border-t my-1" />
          
          {/* Generate */}
          {onGenerate && (
            <button
              onClick={() => {
                handleGenerate();
                setShowMenu(false);
              }}
              disabled={!hasDataChanges || isGenerating}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Sparkles className="w-3 h-3 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Code'}
            </button>
          )}
          
          <div className="border-t my-1" />
          
          {/* Position */}
          {/* Position section removed as per instructions */}
        </div>
      )}
      
      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}; 