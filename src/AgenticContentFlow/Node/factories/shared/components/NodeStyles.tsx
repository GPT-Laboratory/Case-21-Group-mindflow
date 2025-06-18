import { Handle } from "@xyflow/react";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

// Common type for color props
export interface BaseNodeProps {
  color?: string;
  selected?: boolean;
  isExpanded?: boolean;
  /** Whether the node is currently processing */
  processing?: boolean;
  /** Processing state for visual feedback */
  processState?: 'idle' | 'processing' | 'completed' | 'error' | 'generating';
  className?: string;
  children?: ReactNode;
  style?: React.CSSProperties;
  ref?: React.Ref<HTMLElement>;
  onTransitionEnd?: () => void;
}

interface SelectableProps {
  selected?: boolean;
}

// Base component for all node containers using Tailwind CSS
export function BaseNodeContainer({
  color,
  selected,
  processing,
  processState = 'idle',
  className,
  children,
  style,
  ref,
  ...props
}: BaseNodeProps) {
  const [borderColorAfterProcess, setBorderColorAfterProcess] = React.useState<string | undefined>('#000000'); // Start with black
  
  // Update border color when process state changes, not during render
  React.useEffect(() => {
    if (processState === 'processing' || processing) {
      setBorderColorAfterProcess('#2a8af6');
    } else if (processState === 'completed') {
      setBorderColorAfterProcess('#04a46e');
    } else if (processState === 'error') {
      setBorderColorAfterProcess('#ef4444');
    } else if (processState === 'generating') {
      setBorderColorAfterProcess('#f59e0b'); // Amber color for generation
    }
    // Don't reset to black when going back to idle - persist the last process color
  }, [processState, processing]);

  // Generate gradient border styles based on processing state
  const getProcessingStyles = () => {
    const baseStyle = style || {};

    if (processState === 'processing' || processing) {
      return {
        ...baseStyle,
        border: '3px solid transparent',
      
        borderImage: 'linear-gradient(var(--angle, 0deg), #ae53ba, #2a8af6, #ae53ba) 1',
        borderRadius: '8px',
        animation: 'processingRotate 2s linear infinite',
      };
    }

    if (processState === 'generating') {
      return {
        ...baseStyle,
        border: '3px solid transparent',
        borderImage: 'linear-gradient(var(--angle, 0deg), #f59e0b, #fbbf24, #f59e0b) 1',
        animation: 'processingRotate 1.5s linear infinite',
      };
    }
    
    if (processState === 'completed') {
      return {
        border: '3px solid transparent',
        ...baseStyle,
        borderImage: 'linear-gradient(var(--angle, 0deg), #04a46e, #34d399, #04a46e) 1',
        
        animation: 'processingRotate 2s linear infinite',
      };
    }
    
    if (processState === 'error') {
      return {
        border: '3px solid transparent',
        ...baseStyle,
        borderImage: 'linear-gradient(var(--angle, 0deg), #ef4444, #f87171, #ef4444) 1',
        animation: 'errorPulse 1s ease-out',
      };
    }
    
    // Default state - use persisted border color (starts as black, then persists last process color)
    return {
      border: `3px solid ${borderColorAfterProcess}`,
      ...baseStyle,
      // Add glow effect when selected
      ...(selected && {
        boxShadow: `0 0 15px 3px ${borderColorAfterProcess}40, 0 0 25px 6px ${borderColorAfterProcess}20`
      })
    };
  };

  const finalStyle = getProcessingStyles();

  return (
    <div 
      className={cn(
        "relative rounded-lg w-full h-full transition-all",
        // Only apply min dimensions if not processing (to avoid size conflicts)
    
        className
      )}
      style={{
        ...finalStyle
      }}
      ref={ref as React.Ref<HTMLDivElement>}
      {...props}
    >
      {children}
    </div>
  );
}

// Handle component using Tailwind CSS
export function StyledHandle({
  selected,
  className,
  children,
  position,
  ...props
}: React.ComponentProps<typeof Handle> & SelectableProps) {
  // Custom styles based on position for positioning and transforms
  const positionClasses = {
    left: "left-[-1px] [--translate-x:-5px]",
    right: "right-[-1px] [--translate-x:5px]",
    top: "top-[-1px] [--translate-y:-5px]",
    bottom: "bottom-[-1px] [--translate-y:5px]",
  };

  // Determine which position class to use
  const positionClass = position ? 
    positionClasses[position.toLowerCase() as keyof typeof positionClasses] : "";

  return (
    <Handle
      className={cn(
        // Base handle styles
        "w-[20px] h-[20px] border border-black rounded-full overflow-hidden flex items-center justify-center transition-all duration-300",
        // Positioning and transform styles
        positionClass,
        // Apply transform with CSS variables
        "[transform-origin:center] [transform:translateX(var(--translate-x,0)_translateY(var(--translate-y,0)_scale(var(--scale,1)))]",
        // Hover effects
        "hover:[--scale:1.6] hover:z-[1000] hover:shadow-md",
        className
      )}
      position={position}
      {...props}
    >
      {children && (
        <div className="w-full h-full flex items-center justify-center text-xs transition-all duration-300">
          {children}
        </div>
      )}
    </Handle>
  );
}

// Resize control component using Tailwind CSS
export function StyledResizeControl({
  color,
  selected,
  className,
  children,
  ...props
}: {
  color?: string;
  selected?: boolean;
  className?: string;
  children?: ReactNode;
  [key: string]: any;
}) {
  return (
    <div
      className={cn(
        "absolute cursor-nwse-resize text-white transition-transform shadow-md",
        "hover:scale-110",
        className
      )}
      style={{
        backgroundColor: color
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// Title component using Tailwind CSS
export function StyledTitle({
  color,
  className,
  children,
  ...props
}: {
  color?: string;
  className?: string;
  children?: ReactNode;
  [key: string]: any;
}) {
  return (
    <h3
      className={cn(
        "font-bold",
        className
      )}
      style={{ color }}
      {...props}
    >
      {children}
    </h3>
  );
}
