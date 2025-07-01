import React, { useRef, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, GripVertical, GripHorizontal } from 'lucide-react';

type PanelPosition = 'top' | 'bottom' | 'left' | 'right';

interface PanelToggleDragHandleProps {
  isExpanded: boolean;
  position: PanelPosition;
  size: { width: number; height: number };
  hasChanges: boolean;
  onToggle: () => void;
  onResizeStart: (e: React.MouseEvent) => void;
}

export const PanelToggleDragHandle: React.FC<PanelToggleDragHandleProps> = ({
  isExpanded,
  position,
  size,
  hasChanges,
  onToggle,
  onResizeStart,
}) => {
  const handleRef = useRef<HTMLButtonElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartTime = useRef<number>(0);

  const getToggleIcon = () => {
    if (!isExpanded) {
      switch (position) {
        case 'top': return <ChevronDown className="w-3 h-3" />;
        case 'bottom': return <ChevronUp className="w-3 h-3" />;
        case 'left': return <ChevronRight className="w-3 h-3" />;
        case 'right': return <ChevronLeft className="w-3 h-3" />;
      }
    } else {
      switch (position) {
        case 'top': return <ChevronUp className="w-3 h-3" />;
        case 'bottom': return <ChevronDown className="w-3 h-3" />;
        case 'left': return <ChevronLeft className="w-3 h-3" />;
        case 'right': return <ChevronRight className="w-3 h-3" />;
      }
    }
  };

  const getGripIcon = () => {
    return position === 'top' || position === 'bottom' ? 
      <GripHorizontal className="w-3 h-3 opacity-50" /> : 
      <GripVertical className="w-3 h-3 opacity-50" />;
  };

  const getButtonStyles = () => {
    const baseStyle = {
      position: 'absolute' as const,
      zIndex: 1000,
      transition: isDragging ? 'none' : 'all 0.3s ease-in-out',
      background: 'var(--background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      cursor: isExpanded ? (position === 'top' || position === 'bottom' ? 'ns-resize' : 'ew-resize') : 'pointer',
      border: '2px solid var(--border)',
    };

    // Handle positioning for left and right panels
    if (position === 'left') {
      return {
        ...baseStyle,
        right: '-28px', // Position outside the panel on the right side
        top: '50%',
        transform: 'translateY(-50%)',
        width: '28px',
        height: '80px',
        borderTopRightRadius: '8px',
        borderBottomRightRadius: '8px',
        borderTopLeftRadius: '0px',
        borderBottomLeftRadius: '0px',
        borderLeft: 'none', // No left border since it's on the left edge
        flexDirection: 'column' as const,
      };
    } else {
      // Right position (existing logic)
      return {
        ...baseStyle,
        left: '-28px', // Always positioned outside the panel (between Flow and panel)
        top: '50%',
        transform: 'translateY(-50%)',
        width: '28px',
        height: '80px',
        borderTopLeftRadius: '8px',
        borderBottomLeftRadius: '8px',
        borderTopRightRadius: '0px',
        borderBottomRightRadius: '0px',
        borderRight: 'none',
        flexDirection: 'column' as const,
      };
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartTime.current = Date.now();
    
    if (isExpanded) {
      setIsDragging(true);
      onResizeStart(e);
      
      // Listen for mouse up to detect if this was a drag or click
      const handleMouseUp = () => {
        setIsDragging(false);
        const dragDuration = Date.now() - dragStartTime.current;
        
        // If the mouse was down for less than 200ms, treat it as a click
        if (dragDuration < 200) {
          onToggle();
        }
        
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      // Panel is collapsed, just toggle it open
      onToggle();
    }
  }, [isExpanded, onToggle, onResizeStart]);

  return (
    <>
      <Button
        ref={handleRef}
        variant="outline"
        size="sm"
        onMouseDown={handleMouseDown}
        className=" border-none select-none"
        style={getButtonStyles()}
        title={isExpanded ? 'Drag to resize or click to close' : 'Click to open panel'}
      >
        {getToggleIcon()}
        {isExpanded && getGripIcon()}
      </Button>

      {/* Change Indicator for Collapsed State */}
      {!isExpanded && hasChanges && (
        <div 
          className="absolute w-2 h-2 bg-amber-400 rounded-full z-100 transition-opacity duration-300"
          style={{ 
            [position === 'left' ? 'right' : 'left']: '-14px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none' 
          }}
        />
      )}
    </>
  );
};

export default PanelToggleDragHandle;