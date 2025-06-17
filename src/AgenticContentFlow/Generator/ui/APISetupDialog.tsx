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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Key } from 'lucide-react';
import { useAPISetup } from './api-setup/hooks/useAPISetup';
import { ProviderSelector } from './api-setup/APIProviderSelector';
import { APIConfigForm } from './api-setup/APIConfigForm';
import { ConnectionTest } from './api-setup/APIConnectionTest';

// Import the new smaller components


interface APISetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export const APISetupDialog: React.FC<APISetupDialogProps> = ({
  open,
  onOpenChange,
  onComplete
}) => {
  const {
    selectedProvider,
    config,
    isValidating,
    validationResult,
    existingConfigs,
    providerInfo,
    currentProviderInfo,
    handleProviderChange,
    handleConfigChange,
    handleTest,
    handleSave,
    hasApiKey,
    canSave
  } = useAPISetup();

  const handleSaveAndClose = () => {
    const success = handleSave();
    if (success) {
      onComplete?.();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            LLM API Configuration
          </DialogTitle>
          <DialogDescription>
            Configure API access to LLM providers for code generation. 
            {existingConfigs.length === 0 && ' Set up your first provider to get started.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Provider Selection */}
          <ProviderSelector
            selectedProvider={selectedProvider}
            onProviderSelect={handleProviderChange}
            existingConfigs={existingConfigs}
            providerInfo={providerInfo}
            showQuickSetup={existingConfigs.length === 0}
          />

          {/* Configuration Form */}
          <APIConfigForm
            config={config}
            onConfigChange={handleConfigChange}
            provider={selectedProvider}
            providerInfo={currentProviderInfo}
          />

          <Separator />

          {/* Connection Test */}
          <ConnectionTest
            isValidating={isValidating}
            validationResult={validationResult}
            onTest={handleTest}
            hasApiKey={hasApiKey}
            provider={selectedProvider}
          />

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <div /> {/* Spacer */}
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveAndClose}
                disabled={!canSave}
              >
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};