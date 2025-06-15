/**
 * API Key Manager
 * 
 * Secure storage and management of LLM API credentials with encryption.
 * Handles multiple providers and provides validation of stored credentials.
 * 
 * @author Agentic Content Flow Team
 * @version 1.0.0
 * @since 2025-06-15
 */

import { LLMProvider, LLMAPIConfig } from './types';

interface StoredConfig extends LLMAPIConfig {
  encrypted: boolean;
  lastUsed?: string;
  isValid?: boolean;
}

export class APIKeyManager {
  private static instance: APIKeyManager;
  private readonly storageKey = 'agentic_llm_configs';

  static getInstance(): APIKeyManager {
    if (!APIKeyManager.instance) {
      APIKeyManager.instance = new APIKeyManager();
    }
    return APIKeyManager.instance;
  }

  /**
   * Simple encryption for API keys in localStorage
   * Note: This is basic obfuscation, not cryptographically secure
   */
  private encrypt(text: string): string {
    try {
      return btoa(text);
    } catch {
      return text;
    }
  }

  private decrypt(encrypted: string): string {
    try {
      return atob(encrypted);
    } catch {
      return encrypted;
    }
  }

  /**
   * Store API configuration for a provider
   */
  saveConfig(provider: LLMProvider, config: LLMAPIConfig): void {
    const configs = this.getAllConfigs();
    
    const storedConfig: StoredConfig = {
      ...config,
      apiKey: this.encrypt(config.apiKey),
      encrypted: true,
      lastUsed: new Date().toISOString(),
      isValid: true
    };

    configs[provider] = storedConfig;
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(configs));
      console.log(`✅ Saved configuration for ${provider}`);
    } catch (error) {
      console.error('Failed to save API configuration:', error);
      throw new Error('Failed to save API configuration');
    }
  }

  /**
   * Get API configuration for a provider
   */
  getConfig(provider: LLMProvider): LLMAPIConfig | null {
    const configs = this.getAllConfigs();
    const stored = configs[provider];

    if (!stored) {
      return null;
    }

    try {
      return {
        ...stored,
        apiKey: stored.encrypted ? this.decrypt(stored.apiKey) : stored.apiKey
      };
    } catch (error) {
      console.error(`Failed to decrypt config for ${provider}:`, error);
      return null;
    }
  }

  /**
   * Check if a provider has valid configuration
   */
  hasValidConfig(provider: LLMProvider): boolean {
    const config = this.getConfig(provider);
    return !!(config?.apiKey && config.apiKey.trim() !== '');
  }

  /**
   * Get all stored configurations (without decrypting)
   */
  private getAllConfigs(): Partial<Record<LLMProvider, StoredConfig>> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load API configurations:', error);
      return {};
    }
  }

  /**
   * Get list of configured providers
   */
  getConfiguredProviders(): LLMProvider[] {
    const configs = this.getAllConfigs();
    return Object.keys(configs).filter(provider => 
      this.hasValidConfig(provider as LLMProvider)
    ) as LLMProvider[];
  }

  /**
   * Get the preferred provider (most recently used valid config)
   */
  getPreferredProvider(): LLMProvider | null {
    const configs = this.getAllConfigs();
    let mostRecent: { provider: LLMProvider; lastUsed: string } | null = null;

    for (const [provider, config] of Object.entries(configs)) {
      if (config && this.hasValidConfig(provider as LLMProvider) && config.lastUsed) {
        if (!mostRecent || config.lastUsed > mostRecent.lastUsed) {
          mostRecent = { provider: provider as LLMProvider, lastUsed: config.lastUsed };
        }
      }
    }

    return mostRecent?.provider || null;
  }

  /**
   * Set preferred provider
   */
  setPreferredProvider(provider: LLMProvider): void {
    const configs = this.getAllConfigs();
    if (configs[provider]) {
      configs[provider]!.lastUsed = new Date().toISOString();
      localStorage.setItem(this.storageKey, JSON.stringify(configs));
    }
  }

  /**
   * Update last used timestamp for a provider
   */
  markAsUsed(provider: LLMProvider): void {
    const configs = this.getAllConfigs();
    if (configs[provider]) {
      configs[provider]!.lastUsed = new Date().toISOString();
      localStorage.setItem(this.storageKey, JSON.stringify(configs));
    }
  }

  /**
   * Mark a provider configuration as invalid (e.g., after API error)
   */
  markAsInvalid(provider: LLMProvider): void {
    const configs = this.getAllConfigs();
    if (configs[provider]) {
      configs[provider]!.isValid = false;
      localStorage.setItem(this.storageKey, JSON.stringify(configs));
    }
  }

  /**
   * Remove configuration for a provider
   */
  removeConfig(provider: LLMProvider): void {
    const configs = this.getAllConfigs();
    delete configs[provider];
    localStorage.setItem(this.storageKey, JSON.stringify(configs));
    console.log(`🗑️ Removed configuration for ${provider}`);
  }

  /**
   * Clear all stored configurations
   */
  clearAllConfigs(): void {
    localStorage.removeItem(this.storageKey);
    console.log('🗑️ Cleared all API configurations');
  }

  /**
   * Validate configuration format
   */
  validateConfig(config: LLMAPIConfig): boolean {
    if (!config.apiKey || config.apiKey.trim() === '') {
      return false;
    }

    // Provider-specific validation
    switch (config.provider) {
      case 'openai':
        return config.apiKey.startsWith('sk-');
      case 'gemini':
        return config.apiKey.length > 20; // Basic length check
      case 'claude':
        return config.apiKey.startsWith('sk-ant-');
      case 'custom':
        return !!(config.baseUrl && config.model);
      default:
        return false;
    }
  }
}

// Export singleton instance
export const apiKeyManager = APIKeyManager.getInstance();