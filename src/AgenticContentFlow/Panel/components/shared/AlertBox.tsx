import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertBoxProps {
  type: AlertType;
  icon?: LucideIcon;
  title?: string;
  message: string | ReactNode;
  children?: ReactNode;
  className?: string;
}

export const AlertBox: React.FC<AlertBoxProps> = ({
  type,
  icon: Icon,
  title,
  message,
  children,
  className
}) => {
  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className={`p-3 rounded border text-xs ${getAlertStyles()} ${className || ''}`}>
      <div className="flex items-start space-x-2">
        {Icon && <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />}
        <div className="flex-1">
          {title && <div className="font-medium mb-1">{title}</div>}
          <div>{message}</div>
          {children && <div className="mt-2">{children}</div>}
        </div>
      </div>
    </div>
  );
};

interface ValidationResultProps {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
  successMessage?: string;
}

export const ValidationResult: React.FC<ValidationResultProps> = ({
  isValid,
  errors = [],
  warnings = [],
  successMessage = 'Validation passed successfully'
}) => {
  return (
    <div className="space-y-2">
      {isValid ? (
        <AlertBox
          type="success"
          message={successMessage}
        />
      ) : (
        <AlertBox
          type="error"
          title="Validation Errors:"
          message={
            <div className="space-y-1">
              {errors.map((error, index) => (
                <p key={index}>• {error}</p>
              ))}
            </div>
          }
        />
      )}
      
      {warnings.length > 0 && (
        <AlertBox
          type="warning"
          title="Warnings:"
          message={
            <div className="space-y-1">
              {warnings.map((warning, index) => (
                <p key={index}>• {warning}</p>
              ))}
            </div>
          }
        />
      )}
    </div>
  );
};