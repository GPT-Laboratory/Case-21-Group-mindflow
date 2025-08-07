import { forwardRef, useState, useEffect, useRef } from "react";
import { Handle, HandleProps, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";

export type ExcalidrawHandleProps = HandleProps & {
  variant?: 'default' | 'minimal' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  nodeColor?: string; // Color of the parent node for shadow matching
  hoverArea?: number; // Area around node to trigger handle visibility
};

// Excalidraw-style handle base styles - seamless with node border
const excalidrawHandleStyles = {
  borderWidth: '3px', // Match node border width
  borderStyle: 'solid', // Match node border style
  borderColor: 'rgba(0, 0, 0, 0)', // Black border for visibility
  backgroundColor: 'transparent', // Transparent background
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  opacity: '1', // Always visible
  borderRadius: '8px', // Match node border radius
  zIndex: '10', // Put it above the node content
  boxShadow: 'none', // No shadow by default
};

// Size variants for border thickness
const sizeVariants = {
  sm: { borderWidth: '2px' },
  md: { borderWidth: '3px' }, // Match node border width
  lg: { borderWidth: '4px' },
};

// Style variants
const styleVariants = {
  default: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    boxShadow: 'none',
  },
  minimal: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    boxShadow: 'none',
  },
  glow: {

  },
};

export const ExcalidrawHandle = forwardRef<HTMLDivElement, ExcalidrawHandleProps>(
  ({ 
    className, 
    children, 
    style = {}, 
    variant = 'default',
    size = 'md',
    showIcon = false,
    nodeColor,
    position,
    ...props 
  }, ref) => {
    
    const handleRef = useRef<HTMLDivElement>(null);

    // Combine base styles with variant and size
    const combinedStyles = {
      ...excalidrawHandleStyles,
      ...sizeVariants[size],
      ...styleVariants[variant],
      opacity: 1, // Always visible
      ...style,
    };

    // If node color is provided, create a subtle border effect that matches
    if (nodeColor) {
      // Convert hex to rgba for border effect
      const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };
      
      combinedStyles.borderColor = hexToRgba(nodeColor, 0.3);
    }

    // Position-specific styles for edge handles
    const getPositionStyle = () => {
      const borderWidth = sizeVariants[size].borderWidth;
      const borderColor = 'rgba(0, 0, 0, 0)'; // Always use black border
      
      // Use React Flow's native positioning and extend with transforms
      switch (position) {
        case Position.Top:
          return {
            width: '100%', // Match node width
            height: '15px',
            borderTop: `${borderWidth} solid ${borderColor}`,
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: 'none',
          };
        case Position.Bottom:
          return {
            width: '100%', // Match node width
            height: '15px',
            borderBottom: `${borderWidth} solid ${borderColor}`,
            borderLeft: 'none',
            borderRight: 'none',
            borderTop: 'none',
          };
        case Position.Left:
          return {
            width: '15px',
            height: '100%', // Match node height
            borderLeft: `${borderWidth} solid ${borderColor}`,
            borderTop: 'none',
            borderRight: 'none',
            borderBottom: 'none',
          };
        case Position.Right:
          return {
            width: '15px',
            height: '100%', // Match node height
            borderRight: `${borderWidth} solid ${borderColor}`,
            borderTop: 'none',
            borderLeft: 'none',
            borderBottom: 'none',
          };
        default:
          return {};
      }
    };

    return (
      <Handle
        ref={(node) => {
          handleRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }

        }}
        position={position}
        {...props}
        style={{
          ...combinedStyles,
          ...getPositionStyle(),
          // Use React Flow's default positioning for edges
          position: 'absolute',
          // Don't override React Flow's positioning
        }}
        className={cn(
          "absolute",
          // Hover effects - very subtle
          "hover:opacity-80",
          // Active state
          "active:opacity-90",
          // Focus state for accessibility
          "focus:outline-none",
          // Smooth transitions
          "transition-all duration-200 ease-out",
          className,
        )}

      >
        {children && showIcon && (
          <div 
            className="absolute inset-0 flex items-center justify-center text-black opacity-30"
            style={{ pointerEvents: 'none' }}
          >
            {children}
          </div>
        )}
      </Handle>
    );
  },
);

ExcalidrawHandle.displayName = "ExcalidrawHandle"; 