/**
 * Generator Context
 * 
 * Provides centralized state management for the generator, including
 * selected provider, configuration details, and provider information.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LLMProvider, LLMAPIConfig } from '../generatortypes';
import { apiKeyManager } from '../providers/management/APIKeyManager';

interface ProviderInfo {
  provider: LLMProvider;
  name: string;
  configured: boolean;
  preferred: boolean;
  models?: string[];
  defaultModel?: string;
}

interface GeneratorContextType {
  // Provider state
  selectedProvider: LLMProvider;
  setSelectedProvider: (provider: LLMProvider) => void;
  availableProviders: ProviderInfo[];
  refreshProviders: () => Promise<void>;
  
  // Configuration state
  getProviderConfig: (provider: LLMProvider) => LLMAPIConfig | null;
  saveProviderConfig: (provider: LLMProvider, config: LLMAPIConfig) => void;
  
  // Loading state
  providersLoading: boolean;
  
  // Actions
  setPreferredProvider: (provider: LLMProvider) => void;
  getPreferredProvider: () => LLMProvider | null;
  
  // Node update state
  updatingNodes: Set<string>;
  setUpdatingNode: (nodeId: string, isUpdating: boolean) => void;
}

const GeneratorContext = createContext<GeneratorContextType | undefined>(undefined);

interface GeneratorProviderProps {
  children: React.ReactNode;
}

export const GeneratorProvider: React.FC<GeneratorProviderProps> = ({ children }) => {
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>('openai');
  const [availableProviders, setAvailableProviders] = useState<ProviderInfo[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [updatingNodes, setUpdatingNodes] = useState<Set<string>>(new Set());

  // Load providers on mount
  useEffect(() => {
    refreshProviders();
  }, []);

  // Refresh provider list
  const refreshProviders = useCallback(async () => {
    setProvidersLoading(true);
    try {
      const providers = await apiKeyManager.getProviderInfo();
      setAvailableProviders(providers);
      
      // Set preferred provider if available
      const preferred = providers.find(p => p.preferred);
      if (preferred) {
        setSelectedProvider(preferred.provider);
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setProvidersLoading(false);
    }
  }, []);

  // Get provider configuration
  const getProviderConfig = useCallback((provider: LLMProvider): LLMAPIConfig | null => {
    return apiKeyManager.getConfig(provider) || null;
  }, []);

  // Save provider configuration
  const saveProviderConfig = useCallback((provider: LLMProvider, config: LLMAPIConfig) => {
    apiKeyManager.saveConfig(provider, config);
    // Refresh providers to update the UI
    refreshProviders();
  }, [refreshProviders]);

  // Set preferred provider
  const setPreferredProvider = useCallback((provider: LLMProvider) => {
    apiKeyManager.setPreferredProvider(provider);
    setSelectedProvider(provider);
    // Refresh providers to update the preferred status
    refreshProviders();
  }, [refreshProviders]);

  // Get preferred provider
  const getPreferredProvider = useCallback((): LLMProvider | null => {
    return apiKeyManager.getPreferredProvider();
  }, []);

  // Node update state
  const setUpdatingNode = useCallback((nodeId: string, isUpdating: boolean) => {
    if (isUpdating) {
      setUpdatingNodes(prevNodes => new Set(prevNodes).add(nodeId));
    } else {
      setUpdatingNodes(prevNodes => {
        const newNodes = new Set(prevNodes);
        newNodes.delete(nodeId);
        return newNodes;
      });
    }
  }, []);

  const value: GeneratorContextType = {
    selectedProvider,
    setSelectedProvider,
    availableProviders,
    refreshProviders,
    getProviderConfig,
    saveProviderConfig,
    providersLoading,
    setPreferredProvider,
    getPreferredProvider,
    updatingNodes,
    setUpdatingNode,
  };

  return (
    <GeneratorContext.Provider value={value}>
      {children}
    </GeneratorContext.Provider>
  );
};

export const useGenerator = (): GeneratorContextType => {
  const context = useContext(GeneratorContext);
  if (context === undefined) {
    throw new Error('useGenerator must be used within a GeneratorProvider');
  }
  return context;
}; 