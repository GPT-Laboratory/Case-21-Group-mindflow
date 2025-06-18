/**
 * Custom hook for API Setup Dialog logic
 * 
 * Manages state, configuration loading, validation, and saving for API setup.
 */

import { useState, useEffect, useCallback } from 'react';
import { LLMProvider, LLMAPIConfig } from '../../../generatortypes';
import { apiKeyManager } from '../../../providers/management/APIKeyManager';
import { LLMProviderFactory } from '../../../providers/factory/LLMProviderFactory';

export const useAPISetup = (initialProvider?: LLMProvider) => {
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>(initialProvider || 'openai');
  const [config, setConfig] = useState<Partial<LLMAPIConfig>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [existingConfigs, setExistingConfigs] = useState<LLMProvider[]>([]);
  const [providerInfo, setProviderInfo] = useState<Record<LLMProvider, any>>({} as Record<LLMProvider, any>);

  // Load existing configurations and provider info when hook initializes
  useEffect(() => {
    const loadProviderInfo = async () => {
      const configured = apiKeyManager.getConfiguredProviders();
      setExistingConfigs(configured);
      
      // Load existing config if available
      const existingConfig = apiKeyManager.getConfig(selectedProvider);
      const info = await apiKeyManager.getProviderInfo();
      const providerInfoRecord = info.reduce((acc, p) => ({ ...acc, [p.provider]: p }), {}) as Record<LLMProvider, any>;
      setProviderInfo(providerInfoRecord);
      
      if (existingConfig) {
        setConfig(existingConfig);
      } else {
        setConfig({
          provider: selectedProvider,
          model: providerInfoRecord[selectedProvider]?.defaultModel,
          temperature: 0.3,
          maxTokens: 2048
        });
      }
      setValidationResult(null);
    };
    loadProviderInfo();
  }, [selectedProvider]);

  // Update selected provider when initialProvider changes
  useEffect(() => {
    if (initialProvider) {
      setSelectedProvider(initialProvider);
    }
  }, [initialProvider]);

  const handleProviderChange = useCallback((provider: LLMProvider) => {
    setSelectedProvider(provider);
    setValidationResult(null);
    
    // Load existing config or set defaults
    const existingConfig = apiKeyManager.getConfig(provider);
    const loadProviderInfo = async () => {
      const info = await apiKeyManager.getProviderInfo();
      const providerInfoRecord = info.reduce((acc, p) => ({ ...acc, [p.provider]: p }), {}) as Record<LLMProvider, any>;
      setProviderInfo(providerInfoRecord);
      
      if (existingConfig) {
        setConfig(existingConfig);
      } else {
        setConfig({
          provider,
          model: providerInfoRecord[provider]?.defaultModel,
          temperature: 0.3,
          maxTokens: 2048
        });
      }
    };
    loadProviderInfo();
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

      // Use the provider's real testConnection method
      const providerInstance = LLMProviderFactory.createProvider(selectedProvider);
      const result = await providerInstance.testConnection(testConfig);
      setValidationResult(result);
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
    providerInfo,
    currentProviderInfo: providerInfo[selectedProvider],
    
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