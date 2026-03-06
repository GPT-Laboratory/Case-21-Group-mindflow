/**
 * API Configuration Form Component
 * 
 * Handles the form fields for API configuration including API key, URL, model selection, and advanced settings.
 */

import React from 'react';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { HelpCircle, TestTube, Download, Loader2, CheckCircle2, XCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../components/ui/tooltip';
import { LLMProvider, LLMAPIConfig } from '../../generatortypes';
import { APIProviderSelector } from './APIProviderSelector';
import { ConnectionStatus } from '../shared/ConnectionStatus';
import { useGenerator } from '../../context/GeneratorContext';

interface APIConfigFormProps {
  selectedProvider: LLMProvider;
  onProviderChange: (provider: LLMProvider) => void;
  config: Partial<LLMAPIConfig>;
  onConfigChange: (field: keyof LLMAPIConfig, value: any) => void;
  onTest: () => Promise<void>;
  onFetchModels: () => Promise<void>;
  isValidating: boolean;
  validationResult: { success: boolean; error?: string } | null;
  isFetchingModels: boolean;
  lastFetchedModels: string;
  disabled?: boolean;
}

// Fetch models button component
const FetchModelsButton: React.FC<{
  onFetch: () => Promise<void>;
  isFetching: boolean;
  lastFetched: string;
}> = ({ onFetch, isFetching, lastFetched }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onFetch}
            disabled={isFetching}
            className="flex-shrink-0"
          >
            {isFetching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p>Fetch available models</p>
            {lastFetched && (
              <p className="text-xs text-muted-foreground mt-1">
                Last: {lastFetched}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const APIConfigForm: React.FC<APIConfigFormProps> = ({
  selectedProvider,
  onProviderChange,
  config,
  onConfigChange,
  onTest,
  onFetchModels,
  isValidating,
  validationResult,
  isFetchingModels,
  lastFetchedModels,
  disabled
}) => {
  const { getProviderConfig, availableProviders } = useGenerator();
  const currentConfig = getProviderConfig(selectedProvider);
  const providerInfo = availableProviders.find(p => p.provider === selectedProvider);
  
  // State for API key visibility
  const [showApiKey, setShowApiKey] = React.useState(false);

  return (
    <div className="space-y-3">
      {/* Provider Selection */}
      <APIProviderSelector
        selectedProvider={selectedProvider}
        onProviderChange={onProviderChange}
        disabled={disabled}
      />

      {/* API Key - Hide for Ollama */}
      {selectedProvider !== 'ollama' && (
        <div className="space-y-2">
          <Label htmlFor="apiKey" className="flex items-center gap-2">
            API Key <span className="text-red-500">*</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your API key for {selectedProvider}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <div className="flex gap-2">
            <Input
              id="apiKey"
              type={showApiKey ? "text" : "password"}
              placeholder="Enter your API key"
              value={config.apiKey || ''}
              onChange={(e) => onConfigChange('apiKey', e.target.value)}
              disabled={disabled}
              className="flex-1 min-w-0"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApiKey(!showApiKey)}
              className="flex-shrink-0"
              type="button"
            >
              {showApiKey ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Base URL */}
      <div className="space-y-2">
        <Label htmlFor="baseURL">
          Base URL {selectedProvider === 'custom' && <span className="text-red-500">*</span>}
        </Label>
        <div className="flex gap-2">
          <Input
            id="baseURL"
            placeholder={
              selectedProvider === 'ollama' ? 'http://localhost:11434' :
              selectedProvider === 'openai' ? 'https://api.openai.com/v1' :
              selectedProvider === 'gemini' ? 'https://generativelanguage.googleapis.com' :
              selectedProvider === 'claude' ? 'https://api.anthropic.com' :
              'https://your-api.example.com/v1'
            }
            value={config.baseURL || ''}
            onChange={(e) => onConfigChange('baseURL', e.target.value)}
            disabled={disabled}
            className="flex-1 min-w-0"
          />
          <ConnectionStatus
            provider={selectedProvider}
            size="sm"
          />
        </div>
      </div>

      {/* Model Selection */}
      <div className="space-y-2">
        <Label htmlFor="model">Model</Label>
        <div className="flex gap-2">
          <Select 
            value={config.model || ''} 
            onValueChange={(value: string) => onConfigChange('model', value)}
            disabled={disabled}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {providerInfo?.models?.map((model: string) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              )) || []}
            </SelectContent>
          </Select>
          <FetchModelsButton
            onFetch={onFetchModels}
            isFetching={isFetchingModels}
            lastFetched={lastFetchedModels}
          />
        </div>
      </div>

      {/* Temperature */}
      <div className="space-y-2">
        <Label htmlFor="temperature">Temperature</Label>
        <Input
          id="temperature"
          type="number"
          min="0"
          max="2"
          step="0.1"
          placeholder="0.3"
          value={config.temperature || ''}
          onChange={(e) => onConfigChange('temperature', parseFloat(e.target.value) || 0.3)}
          disabled={disabled}
        />
      </div>

      {/* Max Tokens */}
      <div className="space-y-2">
        <Label htmlFor="maxTokens">Max Tokens</Label>
        <Input
          id="maxTokens"
          type="number"
          min="1"
          placeholder="2048"
          value={config.maxTokens || ''}
          onChange={(e) => onConfigChange('maxTokens', parseInt(e.target.value) || 2048)}
          disabled={disabled}
        />
      </div>
    </div>
  );
};