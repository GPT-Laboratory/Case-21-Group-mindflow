import React, { useState, useEffect, useCallback } from 'react';
import { 
  GenerationType, 
  GenerationResult,
  LLMProvider 
} from '../../generatortypes';
import { useSelect } from '../../../Select/contexts/SelectContext';
import { useInputFocusHandlers } from '../../../Panel/hooks/useInputFocusHandlers';
import { useGenerationForm } from '../../hooks/useGenerationForm';
import { MoreHorizontal, Lightbulb, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';
import { GenerationInput } from './GenerationInput';
import { GenerationStatus } from './GenerationStatus';
import { ProviderDropdown } from './ProviderDropdown';
import { APISetupDialog } from '../api-setup/APISetupDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { apiKeyManager } from '../../providers/management/APIKeyManager';
import { LLMProviderFactory } from '../../providers/factory/LLMProviderFactory';
import { useNotifications } from '../../../Notifications/hooks/useNotifications';

export interface GenerationPanelProps {
  type?: GenerationType;
  onGenerated: (result: GenerationResult) => void;
  onClose?: () => void;
  defaultRequest?: any;
}

const statusIcon = (status: string, error: string | null, onRetry: () => void, loading: boolean) => {
  if (loading || status === 'loading') {
    return <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />;
  }
  if (status === 'success') {
    return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  }
  if (status === 'error') {
    return (
      <button onClick={onRetry} className="p-0.5 hover:bg-gray-100 rounded-full" tabIndex={-1}>
        <XCircle className="w-4 h-4 text-red-500" />
      </button>
    );
  }
  // unknown or default
  return (
    <button onClick={onRetry} className="p-0.5 hover:bg-gray-100 rounded-full" tabIndex={-1}>
      <RefreshCw className="w-4 h-4 text-gray-400" />
    </button>
  );
};

/**
 * Generation Panel
 * 
 * Clean, focused panel for AI generation with smart type detection.
 * Automatically determines generation type based on selection context.
 */
const GenerationPanel: React.FC<GenerationPanelProps> = ({
  type,
  onGenerated,
  defaultRequest
}) => {
  const { selectedNodes } = useSelect();
  const { onFocus, onBlur } = useInputFocusHandlers();
  const [showAPISetup, setShowAPISetup] = useState(false);
  const [providerToConfigure, setProviderToConfigure] = useState<LLMProvider | undefined>(undefined);
  
  // Connection status state
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'loading' | 'success' | 'error'>('unknown');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(false);
  
  // Smart type detection: single node = process, multiple/none = flow
  const smartGenerationType: GenerationType = selectedNodes.length === 1 ? 'process' : 'flow';
  const actualType = type || smartGenerationType;
  
  // All form logic is now in a custom hook
  const { showErrorToast } = useNotifications();
  const {
    description,
    setDescription,
    selectedProvider,
    setSelectedProvider,
    handleGenerate,
    handleSuggest,
    isGenerating,
    availableProviders,
    promptHistory,
    historyIndex,
    navigateHistory,
    resetHistory
  } = useGenerationForm(actualType, selectedNodes as any[], onGenerated, defaultRequest, showErrorToast);

  // Update the type of availableProviders
  const typedAvailableProviders: Array<{
    provider: LLMProvider;
    name: string;
    configured: boolean;
    preferred: boolean;
    models?: string[];
    defaultModel?: string;
  }> = availableProviders;

  const [selectedModel, setSelectedModel] = useState<string>('');
  const [providersLoading, setProvidersLoading] = useState(false);

  // When availableProviders changes, set selectedModel to default for Ollama
  useEffect(() => {
    const ollama = typedAvailableProviders.find(p => p.provider === 'ollama');
    if (selectedProvider === 'ollama' && ollama && ollama.models && ollama.models.length > 0) {
      if (ollama.defaultModel) {
        setSelectedModel(ollama.defaultModel);
      } else if (ollama.models && ollama.models.length > 0) {
        setSelectedModel(ollama.models[0]);
      }
    }
  }, [selectedProvider, typedAvailableProviders]);

  // Pass selectedModel to generation requests if Ollama is selected
  const handleGenerateWithModel = async () => {
    if (selectedProvider === 'ollama' && selectedModel) {
      // Use selectedModel in the request
      // You may need to update handleGenerate in useGenerationForm to accept a model
      // For now, just set it in localStorage or context as a workaround
      localStorage.setItem('agentic_selected_model', selectedModel);
    }
    await handleGenerate();
  };

  // Test connection for selected provider
  const testConnection = useCallback(async () => {
    setConnectionLoading(true);
    setConnectionStatus('loading');
    setConnectionError(null);
    const minDuration = 500;
    const start = Date.now();
    try {
      const config = apiKeyManager.getConfig(selectedProvider);
      if (!config) {
        const elapsed = Date.now() - start;
        if (elapsed < minDuration) await new Promise(res => setTimeout(res, minDuration - elapsed));
        setConnectionStatus('error');
        setConnectionError('No configuration found for this provider');
        setConnectionLoading(false);
        return;
      }
      const providerInstance = LLMProviderFactory.createProvider(selectedProvider);
      const result = await providerInstance.testConnection(config);
      const elapsed = Date.now() - start;
      if (elapsed < minDuration) await new Promise(res => setTimeout(res, minDuration - elapsed));
      if (result.success) {
        setConnectionStatus('success');
        setConnectionError(null);
      } else {
        setConnectionStatus('error');
        setConnectionError(result.error || 'Unknown error');
      }
    } catch (err: any) {
      const elapsed = Date.now() - start;
      if (elapsed < minDuration) await new Promise(res => setTimeout(res, minDuration - elapsed));
      setConnectionStatus('error');
      setConnectionError(err?.message || 'Test failed');
    } finally {
      setConnectionLoading(false);
    }
  }, [selectedProvider]);

  // Test connection on mount and when selectedProvider changes
  useEffect(() => {
    setConnectionStatus('unknown');
    setConnectionError(null);
    if (typedAvailableProviders.find(p => p.provider === selectedProvider)?.configured) {
      testConnection();
    }
  }, [selectedProvider, typedAvailableProviders, testConnection]);

  // History navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newValue = navigateHistory('up', description);
      setDescription(newValue);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = navigateHistory('down', description);
      setDescription(newValue);
    }
  };

  const handleInputChange = (value: string) => {
    setDescription(value);
    resetHistory();
  };

  const handleConfigureProvider = (provider: LLMProvider) => {
    setProviderToConfigure(provider);
    setShowAPISetup(true);
  };

  const handleAPISetupComplete = () => {
    setShowAPISetup(false);
    setProviderToConfigure(undefined);
  };

  // Smart placeholder based on type and selection
  const getSmartPlaceholder = () => {
    if (actualType === 'process' && selectedNodes.length === 1) {
      const nodeType = selectedNodes[0].type;
      return `Describe how this ${nodeType} should process data...`;
    } else {
      return `Describe the ${actualType === 'flow' ? 'workflow' : 'process'} you want to generate...`;
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-2">
      {/* Main input and options row */}
      <div className="flex items-center gap-2">
        <GenerationInput
          value={description}
          onChange={handleInputChange}
          onSubmit={handleGenerateWithModel}
          onKeyDown={handleKeyDown}
          placeholder={getSmartPlaceholder()}
          disabled={isGenerating}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {/* Provider status icon and dropdown */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                {statusIcon(connectionStatus, connectionError, testConnection, connectionLoading)}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {connectionStatus === 'success' && 'Connection successful'}
              {connectionStatus === 'loading' && 'Testing connection...'}
              {connectionStatus === 'error' && (connectionError || 'Connection failed')}
              {connectionStatus === 'unknown' && 'Test connection'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {/* Triple dot menu for advanced options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              disabled={isGenerating}
              className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={handleSuggest}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Lightbulb className="w-4 h-4" />
              Suggest idea
            </DropdownMenuItem>
            
            {/* Provider selection dropdown */}
            <ProviderDropdown
              selectedProvider={selectedProvider}
              setSelectedProvider={setSelectedProvider}
              availableProviders={typedAvailableProviders}
              isGenerating={isGenerating}
              onConfigureProvider={handleConfigureProvider}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              providersLoading={providersLoading}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Status indicator */}
      <GenerationStatus
        isGenerating={isGenerating}
        generationType={actualType}
        historyIndex={historyIndex}
        historyLength={promptHistory.length}
      />

      {/* API Setup Dialog */}
      <APISetupDialog
        open={showAPISetup}
        onOpenChange={setShowAPISetup}
        onComplete={handleAPISetupComplete}
        initialProvider={providerToConfigure}
      />
    </div>
  );
};

export default GenerationPanel;