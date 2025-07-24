import React, { useMemo } from 'react';
import { Handle, HandleProps, HandleType, Position } from '@xyflow/react';
import { useConnectionValidation } from '../hooks/useConnectionValidation';

/**
 * Props for ValidatedHandle component
 */
export interface ValidatedHandleProps extends Omit<HandleProps, 'type' | 'position'> {
  nodeId: string;
  handleType: HandleType;
  position: Position;
  connectionType?: 'horizontal' | 'vertical';
  showValidationFeedback?: boolean;
  validationClassName?: string;
  invalidClassName?: string;
}

/**
 * Handle component with built-in connection validation and visual feedback
 */
export const ValidatedHandle: React.FC<ValidatedHandleProps> = ({
  nodeId,
  handleType,
  position,
  connectionType = 'horizontal',
  showValidationFeedback = true,
  validationClassName = 'validated-handle-valid',
  invalidClassName = 'validated-handle-invalid',
  className = '',
  style = {},
  ...handleProps
}) => {
  // Get validation context (this would need to be provided by a parent component)
  // For now, we'll create a simple validation state
  const [isValidTarget, setIsValidTarget] = React.useState(true);
  const [validationMessage, setValidationMessage] = React.useState<string | null>(null);

  // Determine handle ID based on type and connection type
  const handleId = useMemo(() => {
    return `${connectionType}-${handleType}`;
  }, [connectionType, handleType]);

  // Combine class names based on validation state
  const combinedClassName = useMemo(() => {
    const classes = [className];
    
    if (showValidationFeedback) {
      if (isValidTarget) {
        classes.push(validationClassName);
      } else {
        classes.push(invalidClassName);
      }
    }
    
    return classes.filter(Boolean).join(' ');
  }, [className, showValidationFeedback, isValidTarget, validationClassName, invalidClassName]);

  // Combine styles with validation feedback
  const combinedStyle = useMemo(() => {
    const baseStyle = { ...style };
    
    if (showValidationFeedback) {
      if (isValidTarget) {
        baseStyle.borderColor = '#22c55e'; // Green for valid
        baseStyle.backgroundColor = '#dcfce7';
      } else {
        baseStyle.borderColor = '#ef4444'; // Red for invalid
        baseStyle.backgroundColor = '#fef2f2';
      }
    }
    
    return baseStyle;
  }, [style, showValidationFeedback, isValidTarget]);

  // Handle mouse events for validation feedback
  const handleMouseEnter = React.useCallback(() => {
    // This would integrate with the validation service to check if this handle
    // can accept the current connection being dragged
    // For now, we'll simulate validation
    setValidationMessage(isValidTarget ? null : 'Invalid connection target');
  }, [isValidTarget]);

  const handleMouseLeave = React.useCallback(() => {
    setValidationMessage(null);
  }, []);

  return (
    <div className=\"validated-handle-container\" style={{ position: 'relative' }}>
      <Handle
        {...handleProps}
        id={handleId}
        type={handleType}
        position={position}
        className={combinedClassName}
        style={combinedStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Validation feedback tooltip */}
      {showValidationFeedback && validationMessage && (
        <div 
          className=\"validation-tooltip\"
          style={{
            position: 'absolute',
            top: position === Position.Top ? '-30px' : position === Position.Bottom ? '30px' : '50%',
            left: position === Position.Left ? '-120px' : position === Position.Right ? '30px' : '50%',
            transform: position === Position.Top || position === Position.Bottom ? 'translateX(-50%)' : 'translateY(-50%)',
            backgroundColor: '#1f2937',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          {validationMessage}
        </div>
      )}
    </div>
  );
};

/**
 * Convenience components for different handle types and orientations
 */
export const HorizontalSourceHandle: React.FC<Omit<ValidatedHandleProps, 'handleType' | 'connectionType'>> = (props) => (
  <ValidatedHandle {...props} handleType=\"source\" connectionType=\"horizontal\" />
);

export const HorizontalTargetHandle: React.FC<Omit<ValidatedHandleProps, 'handleType' | 'connectionType'>> = (props) => (
  <ValidatedHandle {...props} handleType=\"target\" connectionType=\"horizontal\" />
);

export const VerticalSourceHandle: React.FC<Omit<ValidatedHandleProps, 'handleType' | 'connectionType'>> = (props) => (
  <ValidatedHandle {...props} handleType=\"source\" connectionType=\"vertical\" />
);

export const VerticalTargetHandle: React.FC<Omit<ValidatedHandleProps, 'handleType' | 'connectionType'>> = (props) => (
  <ValidatedHandle {...props} handleType=\"target\" connectionType=\"vertical\" />
);

/**
 * CSS classes for styling (to be added to global styles)
 */
export const VALIDATED_HANDLE_STYLES = `
.validated-handle-container {
  position: relative;
}

.validated-handle-valid {
  border: 2px solid #22c55e;
  background-color: #dcfce7;
}

.validated-handle-invalid {
  border: 2px solid #ef4444;
  background-color: #fef2f2;
}

.validation-tooltip {
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;