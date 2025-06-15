/**
 * API Setup Dialog
 * 
 * React component for configuring LLM API providers.
 * Provides easy setup for popular providers with validation and testing.
 * 
 * @author Agentic Content Flow Team
 * @version 1.0.0
 * @since 2025-06-15
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Key, Globe, Settings } from 'lucide-react';
import { LLMProvider, LLMAPIConfig } from '../types';
import { apiKeyManager } from '../APIKeyManager';
import { GenerationOrchestrator } from '../GenerationOrchestrator';

interface APISetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const PROVIDER_INFO = {
  openai: {
    name: 'OpenAI',
    description: 'GPT-4 and GPT-3.5 models',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o-mini',
    keyLabel: 'API Key',
    keyPlaceholder: 'sk-...',
    helpUrl: 'https://platform.openai.com/api-keys'
  },
  gemini: {
    name: 'Google Gemini',
    description: 'Google\'s Gemini Pro models',
    models: ['gemini-pro', 'gemini-pro-vision'],
    defaultModel: 'gemini-pro',
    keyLabel: 'API Key',
    keyPlaceholder: 'AI...',
    helpUrl: 'https://makersuite.google.com/app/apikey'
  },
  claude: {
    name: 'Anthropic Claude',
    description: 'Claude 3 family models',
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    defaultModel: 'claude-3-sonnet-20240229',
    keyLabel: 'API Key',
    keyPlaceholder: 'sk-ant-...',
    helpUrl: 'https://console.anthropic.com/account/keys'
  },
  ollama: {
    name: 'Ollama (Local)',
    description: 'Local LLM models via Ollama',
    models: ['gemma3:1b', 'llama2', 'codellama', 'llama2:13b', 'llama2:70b', 'codellama:7b', 'codellama:13b', 'mistral', 'neural-chat'],
    defaultModel: 'gemma3:1b',
    keyLabel: 'API Key (not required)',
    keyPlaceholder: 'Leave empty for local use',
    helpUrl: 'https://ollama.com'
  },
  custom: {
    name: 'Custom Provider',
    description: 'Self-hosted or other compatible APIs',
    models: ['custom-model'],
    defaultModel: 'custom-model',
    keyLabel: 'API Key (optional)',
    keyPlaceholder: 'your-api-key',
    helpUrl: '#'
  }
};

export const APISetupDialog: React.FC<APISetupDialogProps> = ({
  open,
  onOpenChange,
  onComplete
}) => {
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>('openai');
  const [config, setConfig] = useState<Partial<LLMAPIConfig>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [existingConfigs, setExistingConfigs] = useState<LLMProvider[]>([]);

  const orchestrator = new GenerationOrchestrator();
  const providerInfo = PROVIDER_INFO[selectedProvider];

  // Load existing configurations
  useEffect(() => {
    if (open) {
      const configured = apiKeyManager.getConfiguredProviders();
      setExistingConfigs(configured);
      
      // Load existing config if available
      const existingConfig = apiKeyManager.getConfig(selectedProvider);
      if (existingConfig) {
        setConfig(existingConfig);
      } else {
        setConfig({
          provider: selectedProvider,
          model: providerInfo.defaultModel,
          temperature: 0.3,
          maxTokens: 2048
        });
      }
      setValidationResult(null);
    }
  }, [open, selectedProvider, providerInfo.defaultModel]);

  const handleProviderChange = (provider: LLMProvider) => {
    setSelectedProvider(provider);
    setValidationResult(null);
    
    // Load existing config or set defaults
    const existingConfig = apiKeyManager.getConfig(provider);
    const newProviderInfo = PROVIDER_INFO[provider];
    
    if (existingConfig) {
      setConfig(existingConfig);
    } else {
      setConfig({
        provider,
        model: newProviderInfo.defaultModel,
        temperature: 0.3,
        maxTokens: 2048
      });
    }
  };

  const handleConfigChange = (field: keyof LLMAPIConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setValidationResult(null);
  };

  const handleTest = async () => {
    if (!config.apiKey && selectedProvider !== 'custom' && selectedProvider !== 'ollama') {
      setValidationResult({ success: false, error: 'API key is required' });
      return;
    }

    setIsValidating(true);
    try {
      // Save the config temporarily so the orchestrator can access it
      apiKeyManager.saveConfig(selectedProvider, config as LLMAPIConfig);
      
      // Test the connection using just the provider (orchestrator will get config internally)
      const result = await orchestrator.testConnection(selectedProvider);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Test failed' 
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = () => {
    if (!config.apiKey && selectedProvider !== 'custom' && selectedProvider !== 'ollama') {
      setValidationResult({ success: false, error: 'API key is required' });
      return;
    }

    // Save configuration
    apiKeyManager.saveConfig(selectedProvider, config as LLMAPIConfig);
    
    // Set as preferred if it's the first one
    if (existingConfigs.length === 0) {
      apiKeyManager.setPreferredProvider(selectedProvider);
    }

    onComplete?.();
    onOpenChange(false);
  };

  const handleQuickSetup = (provider: LLMProvider) => {
    setSelectedProvider(provider);
    const info = PROVIDER_INFO[provider];
    setConfig({
      provider,
      model: info.defaultModel,
      temperature: 0.3,
      maxTokens: 2048
    });
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
          {/* Quick Setup Cards */}
          {existingConfigs.length === 0 && (
            <div>
              <Label className="text-sm font-medium mb-3 block">Quick Setup</Label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(PROVIDER_INFO).slice(0, 3).map(([provider, info]) => (
                  <Card 
                    key={provider}
                    className={`cursor-pointer transition-colors ${
                      selectedProvider === provider ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleQuickSetup(provider as LLMProvider)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{info.name}</CardTitle>
                      <CardDescription className="text-xs">{info.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select value={selectedProvider} onValueChange={handleProviderChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROVIDER_INFO).map(([provider, info]) => (
                  <SelectItem key={provider} value={provider}>
                    <div className="flex items-center gap-2">
                      {info.name}
                      {existingConfigs.includes(provider as LLMProvider) && (
                        <Badge variant="secondary" className="text-xs">Configured</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Configuration Form */}
          <div className="space-y-4">
            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="flex items-center gap-2">
                {providerInfo.keyLabel}
                {selectedProvider !== 'custom' && <span className="text-red-500">*</span>}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={providerInfo.keyPlaceholder}
                  value={config.apiKey || ''}
                  onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                  className="flex-1"
                />
                {providerInfo.helpUrl !== '#' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(providerInfo.helpUrl, '_blank')}
                  >
                    <Globe className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Custom Provider URL */}
            {selectedProvider === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="baseUrl">
                  Base URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="baseUrl"
                  placeholder="https://your-api.example.com/v1"
                  value={config.baseUrl || ''}
                  onChange={(e) => handleConfigChange('baseUrl', e.target.value)}
                />
              </div>
            )}

            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select 
                value={config.model || providerInfo.defaultModel} 
                onValueChange={(value) => handleConfigChange('model', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providerInfo.models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Settings */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Advanced Settings
              </Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature" className="text-sm">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.temperature || 0.3}
                    onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxTokens" className="text-sm">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="100"
                    max="4096"
                    value={config.maxTokens || 2048}
                    onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Test Results */}
            {validationResult && (
              <div className={`p-3 rounded-md flex items-center gap-2 ${
                validationResult.success 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {validationResult.success ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                {validationResult.success ? 'Connection successful!' : validationResult.error}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={isValidating || (!config.apiKey && selectedProvider !== 'custom' && selectedProvider !== 'ollama')}
            >
              {isValidating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Test Connection
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!config.apiKey && selectedProvider !== 'custom' && selectedProvider !== 'ollama'}
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