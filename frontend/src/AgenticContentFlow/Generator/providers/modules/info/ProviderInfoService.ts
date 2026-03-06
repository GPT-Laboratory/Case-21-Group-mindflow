/**
 * Provider Information Module
 * 
 * Handles provider metadata, models, and display information.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-16
 */

import { LLMProvider, LLMProviderInfo } from '../../../generatortypes';

const PREFERRED_PROVIDER_KEY = 'agentic_flow_preferred_provider';

/**
 * Provider Information Service
 */
export class ProviderInfoService {
  
  /**
   * Get provider information with configuration status
   */
  getProviderInfo(configuredProviders: LLMProvider[]): LLMProviderInfo[] {
    const providers: LLMProvider[] = ['openai', 'gemini', 'claude', 'ollama', 'custom'];
    const preferred = this.getPreferredProvider();

    return providers.map(provider => ({
      provider,
      name: this.getProviderDisplayName(provider),
      configured: configuredProviders.includes(provider),
      preferred: provider === preferred,
      models: this.getProviderModels(provider),
      defaultModel: this.getProviderDefaultModel(provider)
    }));
  }

  /**
   * Get display name for provider
   */
  getProviderDisplayName(provider: LLMProvider): string {
    const names = {
      openai: 'OpenAI',
      gemini: 'Google Gemini',
      claude: 'Anthropic Claude',
      ollama: 'Ollama (Local)',
      custom: 'Custom Provider'
    };
    return names[provider] || provider;
  }

  /**
   * Get available models for provider
   */
  getProviderModels(provider: LLMProvider): string[] {
    const models = {
      openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      gemini: ['gemini-pro', 'gemini-pro-vision'],
      claude: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
      ollama: [],
      custom: ['custom-model']
    };
    return models[provider] || [];
  }

  /**
   * Get default model for provider
   */
  getProviderDefaultModel(provider: LLMProvider): string | undefined {
    const defaults = {
      openai: 'gpt-4o-mini',
      gemini: 'gemini-pro',
      claude: 'claude-3-sonnet-20240229',
      ollama: undefined,
      custom: 'custom-model'
    };
    return defaults[provider] || undefined;
  }

  /**
   * Set preferred provider
   */
  setPreferredProvider(provider: LLMProvider): void {
    localStorage.setItem(PREFERRED_PROVIDER_KEY, provider);
  }

  /**
   * Get preferred provider
   */
  getPreferredProvider(): LLMProvider | null {
    return localStorage.getItem(PREFERRED_PROVIDER_KEY) as LLMProvider;
  }

  /**
   * Clear preferred provider
   */
  clearPreferredProvider(): void {
    localStorage.removeItem(PREFERRED_PROVIDER_KEY);
  }

  /**
   * Get best available provider from configured list
   */
  getBestProvider(
    configuredProviders: LLMProvider[], 
    isValidProvider: (provider: LLMProvider) => boolean,
    getMostRecentlyUsed: (providers: LLMProvider[]) => LLMProvider | null
  ): LLMProvider | null {
    const preferred = this.getPreferredProvider();
    
    // Check if preferred provider is valid and configured
    if (preferred && configuredProviders.includes(preferred) && isValidProvider(preferred)) {
      return preferred;
    }

    // Find the most recently used valid provider
    const validProviders = configuredProviders.filter(p => isValidProvider(p));
    
    if (validProviders.length === 0) return null;

    return getMostRecentlyUsed(validProviders);
  }
}