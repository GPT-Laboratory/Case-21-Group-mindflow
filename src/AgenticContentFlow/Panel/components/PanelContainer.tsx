import React from 'react';

type PanelPosition = 'top' | 'bottom' | 'left' | 'right';

interface PanelContainerProps {
  isExpanded: boolean;
  position: PanelPosition;
  size: { width: number; height: number };
  isResizing: boolean;
  children: React.ReactNode;
}

export const PanelContainer: React.FC<PanelContainerProps> = ({
  isExpanded,
  size,
  isResizing,
  children,
}) => {
  const getPositionStyles = () => {
    const baseStyle = {
      position: 'relative' as const,
      backgroundColor: 'var(--background)',
      borderColor: 'var(--border)',
      zIndex: 100,
      transition: isResizing ? 'none' : 'all 0.3s ease-in-out',
      height: '100%',
      overflow: 'visible' as const,
      paddingLeft: '10px',
    };

    // For side-by-side layout, we only support right position
    return {
      ...baseStyle,
      width: isExpanded ? `${size.width}px` : '0px',
      minWidth: isExpanded ? `${size.width}px` : '0px',
      maxWidth: isExpanded ? `${size.width}px` : '0px',
    };
  };

  return (
    <div style={getPositionStyles()}>
      {/* Handle and content are now separate */}
      {children}
    </div>
  );
};

export default PanelContainer;