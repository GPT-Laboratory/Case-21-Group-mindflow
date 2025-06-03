import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { SchemaValidationResult } from './utils/contentPreviewUtils';

interface SchemaValidationDisplayProps {
  validation: SchemaValidationResult | null;
}

export const SchemaValidationDisplay: React.FC<SchemaValidationDisplayProps> = ({ validation }) => {
  if (!validation) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {validation.isValid ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <AlertCircle className="w-4 h-4 text-red-600" />
        )}
        <span className="text-sm font-medium">
          Schema Validation: {validation.isValid ? 'Valid' : 'Issues Found'}
        </span>
      </div>
      
      {validation.errors.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-red-600">Errors:</div>
          {validation.errors.map((error: string, index: number) => (
            <div key={index} className="text-xs text-red-600 ml-2">• {error}</div>
          ))}
        </div>
      )}
      
      {validation.warnings.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-yellow-600">Warnings:</div>
          {validation.warnings.map((warning: string, index: number) => (
            <div key={index} className="text-xs text-yellow-600 ml-2">• {warning}</div>
          ))}
        </div>
      )}
    </div>
  );
};