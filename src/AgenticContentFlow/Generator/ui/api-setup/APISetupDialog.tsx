/**
 * Simplified API Setup Dialog
 * 
 * Refactored to use smaller components and custom hook following single responsibility principle.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-17
 */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { APIConfigForm } from './APIConfigForm';
import { useAPISetup } from './hooks/useAPISetup';
import { LLMProvider } from '../../generatortypes';

interface APISetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProvider?: LLMProvider;
  onComplete?: () => void;
}

export const APISetupDialog: React.FC<APISetupDialogProps> = ({
  open,
  onOpenChange,
  initialProvider,
  onComplete
}) => {
  const {
    selectedProvider,
    config,
    isValidating,
    validationResult,
    isFetchingModels,
    lastFetchedModels,
    handleProviderChange,
    handleConfigChange,
    handleTest,
    handleSave,
    handleFetchModels,
    canSave
  } = useAPISetup(initialProvider);

  const handleSaveAndClose = () => {
    if (handleSave()) {
      onOpenChange(false);
      onComplete?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>API Configuration</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <APIConfigForm
            selectedProvider={selectedProvider}
            onProviderChange={handleProviderChange}
            config={config}
            onConfigChange={handleConfigChange}
            onTest={handleTest}
            onFetchModels={handleFetchModels}
            isValidating={isValidating}
            validationResult={validationResult}
            isFetchingModels={isFetchingModels}
            lastFetchedModels={lastFetchedModels}
            disabled={isValidating || isFetchingModels}
          />
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isValidating || isFetchingModels}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAndClose}
              disabled={!canSave || isValidating || isFetchingModels}
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};