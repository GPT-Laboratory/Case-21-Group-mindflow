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
      console.log('Testing connection for provider:', selectedProvider);
      console.log('Initial config:', config);

      // For Ollama, ensure baseURL is set
      if (selectedProvider === 'ollama') {
        config.baseURL = config.baseURL || 'http://localhost:11434';
      }

      // Create test configuration
      const testConfig = {
        ...config,
        provider: selectedProvider,
        apiKey: selectedProvider === 'ollama' ? '' : config.apiKey
      } as LLMAPIConfig;

      console.log('Test config:', testConfig);

      // Create provider instance without config (will be passed to testConnection)
      const providerInstance = LLMProviderFactory.createProvider(selectedProvider);
      console.log('Provider instance created:', providerInstance);
      
      const result = await providerInstance.testConnection(testConfig);
      console.log('Test result:', result);
      
      setValidationResult(result);

      // Only save the config if the test was successful
      if (result.success) {
        console.log('Saving successful configuration');
        apiKeyManager.saveConfig(selectedProvider, testConfig);
      }
    } catch (error) {
      console.error('Test connection error:', error);
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

    // For Ollama, ensure baseURL is set
    if (selectedProvider === 'ollama') {
      config.baseURL = config.baseURL || 'http://localhost:11434';
    }

    // Save configuration
    const saveConfig = {
      ...config,
      provider: selectedProvider,
      apiKey: selectedProvider === 'ollama' ? '' : config.apiKey
    } as LLMAPIConfig;

    apiKeyManager.saveConfig(selectedProvider, saveConfig);
    
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

