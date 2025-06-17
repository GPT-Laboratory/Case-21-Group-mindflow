/**
 * Connection Test Component
 * 
 * Handles API connection testing with loading states and validation results.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { ValidationResult } from '@/AgenticContentFlow/Panel/components/shared/AlertBox';
import { LLMProvider } from '../../generatortypes';

interface ConnectionTestProps {
  isValidating: boolean;
  validationResult: { success: boolean; error?: string } | null;
  onTest: () => Promise<void>;
  hasApiKey: boolean;
  provider: LLMProvider;
}

export const ConnectionTest: React.FC<ConnectionTestProps> = ({
  isValidating,
  validationResult,
  onTest,
  hasApiKey,
  provider
}) => {
  const canTest = hasApiKey || provider === 'custom' || provider === 'ollama';

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        onClick={onTest}
        disabled={isValidating || !canTest}
        className="w-full"
      >
        {isValidating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Test Connection
      </Button>
      
      {validationResult && (
        <ValidationResult
          isValid={validationResult.success}
          errors={validationResult.success ? [] : [validationResult.error || 'Connection failed']}
          successMessage="Connection successful!"
        />
      )}
    </div>
  );
};