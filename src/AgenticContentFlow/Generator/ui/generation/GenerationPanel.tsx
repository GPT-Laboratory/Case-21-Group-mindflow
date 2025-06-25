import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { GenerationInput } from './GenerationInput';
import { GenerationOptions } from './GenerationOptions';
import { ProviderDropdown } from './ProviderDropdown';
import { GenerationStatus } from './GenerationStatus';
import { APISetupDialog } from '../api-setup/APISetupDialog';
import { ConnectionStatus } from '../shared/ConnectionStatus';
import { ProviderIcon } from '../shared/ProviderIcon';
import { LLMProvider, GenerationResult, ProcessGenerationResult } from '../../generatortypes';
import { useGenerator } from '../../context/GeneratorContext';
import { useGenerationForm } from '../../hooks/useGenerationForm';
import { useSelect } from '../../../Select/contexts/SelectContext';
import { useNodeContext } from '../../../Node/context/useNodeContext';
import { useInputFocusHandlers } from '../../../Panel/hooks/useInputFocusHandlers';
import { useNotifications } from '../../../Notifications/hooks/useNotifications';
import { MoreHorizontal, Lightbulb, Send } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../components/ui/tooltip';

interface GenerationPanelProps {
  type: 'flow' | 'process';
  selectedNodes: any[];
  onGenerated: (result: any) => void;
  defaultRequest?: any;
  notifyError?: (title: string, message?: string) => void;
}

export const GenerationPanel: React.FC<GenerationPanelProps> = ({
  type,
  selectedNodes,
  onGenerated,
  defaultRequest,
  notifyError
}) => {
  const [showAPISetup, setShowAPISetup] = useState(false);
  const [providerToConfigure, setProviderToConfigure] = useState<LLMProvider | undefined>();
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'loading' | 'success' | 'error'>('unknown');
  const [selectedModel, setSelectedModel] = useState<string>('');

  const { selectedNodes: selectNodes } = useSelect();
  const { updateNode } = useNodeContext();
  const { onFocus, onBlur } = useInputFocusHandlers();
  const { showErrorToast, showSuccessToast } = useNotifications();
  const { availableProviders, providersLoading } = useGenerator();

  // Determine the actual generation type based on selection
  const actualGenerationType = selectNodes.length === 1 ? 'process' : type;

  const handleAPISetupComplete = () => {
    setShowAPISetup(false);
    setProviderToConfigure(undefined);
  };

  const handleConfigureProvider = (provider: LLMProvider) => {
    setProviderToConfigure(provider);
    setShowAPISetup(true);
  };

  // Handle node update when process generation completes
  const handleNodeUpdate = (result: GenerationResult) => {
    console.log('📋 [GenerationPanel] handleNodeUpdate called with result:', result);
    
    if (result.type === 'process' && selectNodes.length === 1) {
      const processResult = result as ProcessGenerationResult;
      const selectedNode = selectNodes[0];
      
      console.log('🎯 [GenerationPanel] Processing node update for:', {
        nodeId: selectedNode.id,
        nodeType: selectedNode.type,
        resultType: processResult.type,
        hasCode: !!processResult.code,
        codeLength: processResult.code?.length || 0
      });
      
      try {
        // Update the node with new process code and metadata
        const updatedNode = {
          ...selectedNode,
          data: {
            ...selectedNode.data,
            // Apply the updated node data from AI (labels, URLs, etc.)
            ...(processResult.updatedNodeData || {}),
            // Update the process code
            instanceCode: processResult.code,
            lastGenerated: new Date().toISOString(),
            generationMetadata: {
              provider: processResult.provider,
              confidence: processResult.confidence,
              strategy: processResult.strategy,
              generatedAt: processResult.generatedAt,
              validation: processResult.validation,
              metadata: processResult.metadata
            }
          }
        };
        
        console.log('📝 [GenerationPanel] Updated node data:', {
          nodeId: updatedNode.id,
          hasInstanceCode: !!updatedNode.data.instanceCode,
          instanceCodeLength: updatedNode.data.instanceCode?.length || 0,
          lastGenerated: updatedNode.data.lastGenerated,
          generationMetadata: updatedNode.data.generationMetadata,
          updatedNodeData: processResult.updatedNodeData,
          hasUpdatedNodeData: !!processResult.updatedNodeData && Object.keys(processResult.updatedNodeData).length > 0
        });
        
        // Log the specific updated node data for debugging
        if (processResult.updatedNodeData) {
          console.log('🔍 [GenerationPanel] AI returned updated node data:', {
            instanceData: processResult.updatedNodeData.instanceData,
            templateData: processResult.updatedNodeData.templateData,
            fullUpdatedData: processResult.updatedNodeData
          });
        }
        
        console.log('🔄 [GenerationPanel] Calling updateNode with updated node');
        updateNode(updatedNode);
        
        showSuccessToast(
          'Node Updated', 
          `Successfully updated ${selectedNode.type} node with new process code`
        );
        
        // Clear the input after successful update
        setDescription('');
        resetHistory();
        
        console.log('✅ [GenerationPanel] Node update completed successfully');
        
      } catch (error) {
        console.error('❌ [GenerationPanel] Failed to update node:', error);
        showErrorToast('Update Failed', 'Failed to update node with new process code');
      }
    } else {
      console.log('🌊 [GenerationPanel] Handling flow generation result');
      // Handle flow generation as before
      onGenerated(result);
    }
  };

  // Use the generation form hook with custom onGenerated callback and actual generation type
  const {
    description,
    setDescription,
    selectedProvider,
    setSelectedProvider,
    handleGenerate,
    handleSuggest,
    isGenerating,
    promptHistory,
    historyIndex,
    navigateHistory,
    resetHistory
  } = useGenerationForm(actualGenerationType, selectNodes as any[], handleNodeUpdate, defaultRequest, showErrorToast);

  // Check if current provider is configured
  const currentProviderInfo = availableProviders.find(p => p.provider === selectedProvider);
  const isProviderConfigured = currentProviderInfo?.configured || false;

  // Handle model selection for all providers
  useEffect(() => {
    const currentProvider = availableProviders.find(p => p.provider === selectedProvider);
    if (currentProvider && currentProvider.models && currentProvider.models.length > 0) {
      // Set default model if none selected
      if (!selectedModel && currentProvider.defaultModel) {
        setSelectedModel(currentProvider.defaultModel);
        localStorage.setItem('agentic_selected_model', currentProvider.defaultModel);
      } else if (!selectedModel && currentProvider.models.length > 0) {
        setSelectedModel(currentProvider.models[0]);
        localStorage.setItem('agentic_selected_model', currentProvider.models[0]);
      }
    }
  }, [selectedProvider, availableProviders, selectedModel]);

  // Load selected model from localStorage on mount
  useEffect(() => {
    const savedModel = localStorage.getItem('agentic_selected_model');
    if (savedModel) {
      setSelectedModel(savedModel);
    }
  }, []);

  // Save selected model to localStorage when it changes
  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem('agentic_selected_model', selectedModel);
    }
  }, [selectedModel]);

  // Smart placeholder based on type and selection
  const getSmartPlaceholder = () => {
    if (actualGenerationType === 'process' && selectNodes.length === 1) {
      const nodeType = selectNodes[0].type;
      return `Describe how this ${nodeType} should process data...`;
    } else {
      return `Describe the ${actualGenerationType === 'flow' ? 'workflow' : 'process'} you want to generate...`;
    }
  };

  const handleInputChange = (value: string) => {
    setDescription(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow arrow key navigation through prompt history
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

  const handleConnectionChange = (status: 'unknown' | 'loading' | 'success' | 'error', error?: string) => {
    setConnectionStatus(status);
  };

  // Custom generate function that includes model selection and node updates
  const handleGenerateWithModel = async () => {
    if (!description.trim() || isGenerating) return;

    // For all providers, ensure we have a model selected if models are available
    const currentProvider = availableProviders.find(p => p.provider === selectedProvider);
    if (currentProvider && currentProvider.models && currentProvider.models.length > 0 && !selectedModel) {
      const defaultModel = currentProvider.defaultModel || currentProvider.models[0];
      setSelectedModel(defaultModel);
      localStorage.setItem('agentic_selected_model', defaultModel);
    }

    // Call the original handleGenerate
    await handleGenerate();
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-0 sm:p-2">
      {/* Main input and options row */}
      <div className="flex items-center gap-2 min-w-0">
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

        {/* Connection status or generate button */}
        {isProviderConfigured ? (
          connectionStatus === 'success' ? (
            <button
              onClick={handleGenerateWithModel}
              disabled={!description.trim() || isGenerating}
              className="flex items-center justify-center w-8 h-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              title={selectNodes.length === 1 ? "Update Node" : "Generate"}
            >
              <Send className="w-4 h-4" />
            </button>
          ) : (
            <ConnectionStatus
              provider={selectedProvider}
              size="sm"
              onConnectionChange={handleConnectionChange}
            />
          )
        ) : (
          <button
            onClick={() => handleConfigureProvider(selectedProvider)}
            disabled={isGenerating}
            className="flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            title="Configure provider"
          >
            <span className="text-xs font-medium">!</span>
          </button>
        )}

        {/* Provider icon as dropdown trigger */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              disabled={isGenerating}
              className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              title={`Provider: ${currentProviderInfo?.name || selectedProvider}`}
            >
              <ProviderIcon provider={selectedProvider} size="sm" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 sm:w-56">
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
              availableProviders={availableProviders}
              isGenerating={isGenerating}
              onConfigureProvider={handleConfigureProvider}
              providersLoading={providersLoading}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
            />
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status indicator */}
        <GenerationStatus
          isGenerating={isGenerating}
          generationType={actualGenerationType}
          historyIndex={historyIndex}
          historyLength={promptHistory.length}
        />

      </div>
      {/* API Setup Dialog */}
      <APISetupDialog
        open={showAPISetup}
        onOpenChange={setShowAPISetup}
        initialProvider={providerToConfigure}
        onComplete={handleAPISetupComplete}
      />
    </div>
  );
};