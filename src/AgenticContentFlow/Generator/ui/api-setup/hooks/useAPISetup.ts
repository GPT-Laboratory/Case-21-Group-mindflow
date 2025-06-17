/**
 * Custom hook for API Setup Dialog logic
 * 
 * Manages state, configuration loading, validation, and saving for API setup.
 */

import { useState, useEffect, useCallback } from 'react';
import { LLMProvider, LLMAPIConfig } from '../../../generatortypes';
import { apiKeyManager } from '../../../providers/management/APIKeyManager';

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

export const useAPISetup = () => {
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>('openai');
  const [config, setConfig] = useState<Partial<LLMAPIConfig>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [existingConfigs, setExistingConfigs] = useState<LLMProvider[]>([]);

  // Load existing configurations when hook initializes
  useEffect(() => {
    const configured = apiKeyManager.getConfiguredProviders();
    setExistingConfigs(configured);
    
    // Load existing config if available
    const existingConfig = apiKeyManager.getConfig(selectedProvider);
    const providerInfo = PROVIDER_INFO[selectedProvider];
    
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
  }, [selectedProvider]);

  const handleProviderChange = useCallback((provider: LLMProvider) => {
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
  }, []);

  const handleConfigChange = useCallback((field: keyof LLMAPIConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setValidationResult(null);
  }, []);

  const handleTest = useCallback(async () => {
    if (!config.apiKey && selectedProvider !== 'custom' && selectedProvider !== 'ollama') {
      setValidationResult({ success: false, error: 'API key is required' });
      return;
    }

    setIsValidating(true);
    try {
      // Save the config temporarily for testing
      const testConfig = config as LLMAPIConfig;
      apiKeyManager.saveConfig(selectedProvider, testConfig);
      
      // Test the connection by trying to make a simple API call
      // For now, we'll just validate the configuration format
      const isValidConfig = await validateConfiguration(selectedProvider, testConfig);
      
      if (isValidConfig) {
        setValidationResult({ success: true });
      } else {
        setValidationResult({ success: false, error: 'Invalid configuration' });
      }
    } catch (error) {
      setValidationResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Test failed' 
      });
    } finally {
      setIsValidating(false);
    }
  }, [config, selectedProvider]);

  const handleSave = useCallback(() => {
    if (!config.apiKey && selectedProvider !== 'custom' && selectedProvider !== 'ollama') {
      setValidationResult({ success: false, error: 'API key is required' });
      return false;
    }

    // Save configuration
    apiKeyManager.saveConfig(selectedProvider, config as LLMAPIConfig);
    
    // Set as preferred if it's the first one
    if (existingConfigs.length === 0) {
      apiKeyManager.setPreferredProvider(selectedProvider);
    }

    return true;
  }, [config, selectedProvider, existingConfigs]);

  return {
    // State
    selectedProvider,
    config,
    isValidating,
    validationResult,
    existingConfigs,
    
    // Provider info
    providerInfo: PROVIDER_INFO,
    currentProviderInfo: PROVIDER_INFO[selectedProvider],
    
    // Actions
    handleProviderChange,
    handleConfigChange,
    handleTest,
    handleSave,
    
    // Computed values
    hasApiKey: !!config.apiKey,
    canSave: config.apiKey || selectedProvider === 'custom' || selectedProvider === 'ollama'
  };
};

/**
 * Validate API configuration format
 */
async function validateConfiguration(provider: LLMProvider, config: LLMAPIConfig): Promise<boolean> {
  try {
    // Basic validation checks
    switch (provider) {
      case 'openai':
        return config.apiKey?.startsWith('sk-') || false;
      case 'gemini':
        return config.apiKey?.startsWith('AI') || false;
      case 'claude':
        return config.apiKey?.startsWith('sk-ant-') || false;
      case 'ollama':
        // For Ollama, just check if baseUrl is valid or use default
        return true;
      case 'custom':
        return !!config.baseUrl;
      default:
        return false;
    }
  } catch (error) {
    console.error('Configuration validation failed:', error);
    return false;
  }
}