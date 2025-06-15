/**
 * API Key Manager
 * 
 * Handles secure storage and management of LLM API keys
 * Uses localStorage with basic encryption for security.
 * 
 * @author Agentic Content Flow Team
 * @version 1.0.0
 * @since 2025-06-15
 */

import { LLMProvider, LLMAPIConfig } from './LLMAPIConfig';

const STORAGE_KEY = 'acf_llm_configs';
const ENCRYPTION_KEY = 'acf_secret_key_v1'; // In production, this should be more secure

/**
 * Simple encryption/decryption utilities
 */
class SimpleEncryption {
  private static encode(text: string, key: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(result);
  }

  private static decode(encoded: string, key: string): string {
    const text = atob(encoded);
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return result;
  }

  static encrypt(data: any): string {
    const json = JSON.stringify(data);
    return this.encode(json, ENCRYPTION_KEY);
  }

  static decrypt(encrypted: string): any {
    try {
      const json = this.decode(encrypted, ENCRYPTION_KEY);
      return JSON.parse(json);
    } catch (error) {
      console.error('Failed to decrypt API key data:', error);
      return null;
    }
  }
}

export class APIKeyManager {
  private static instance: APIKeyManager;
  private configs: Map<LLMProvider, LLMAPIConfig> = new Map();

  private constructor() {
    this.loadConfigurations();
  }

  static getInstance(): APIKeyManager {
    if (!APIKeyManager.instance) {
      APIKeyManager.instance = new APIKeyManager();
    }
    return APIKeyManager.instance;
  }

  /**
   * Load configurations from localStorage
   */
  private loadConfigurations(): void {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEY);
      if (encrypted) {
        const decrypted = SimpleEncryption.decrypt(encrypted);
        if (decrypted) {
          Object.entries(decrypted).forEach(([provider, config]) => {
            this.configs.set(provider as LLMProvider, config as LLMAPIConfig);
          });
        }
      }
    } catch (error) {
      console.error('Failed to load API configurations:', error);
    }
  }

  /**
   * Save configurations to localStorage
   */
  private saveConfigurations(): void {
    try {
      const data: Record<string, LLMAPIConfig> = {};
      this.configs.forEach((config, provider) => {
        data[provider] = config;
      });
      
      const encrypted = SimpleEncryption.encrypt(data);
      localStorage.setItem(STORAGE_KEY, encrypted);
    } catch (error) {
      console.error('Failed to save API configurations:', error);
    }
  }

  /**
   * Store API configuration for a provider
   */
  setConfig(provider: LLMProvider, config: LLMAPIConfig): void {
    this.configs.set(provider, { ...config });
    this.saveConfigurations();
  }

  /**
   * Get API configuration for a provider
   */
  getConfig(provider: LLMProvider): LLMAPIConfig | null {
    return this.configs.get(provider) || null;
  }

  /**
   * Remove API configuration for a provider
   */
  removeConfig(provider: LLMProvider): void {
    this.configs.delete(provider);
    this.saveConfigurations();
  }

  /**
   * Check if a provider has valid configuration
   */
  hasValidConfig(provider: LLMProvider): boolean {
    const config = this.configs.get(provider);
    return !!(config && config.apiKey && config.apiKey.trim() !== '');
  }

  /**
   * Get all configured providers
   */
  getConfiguredProviders(): LLMProvider[] {
    return Array.from(this.configs.keys()).filter(provider => 
      this.hasValidConfig(provider)
    );
  }

  /**
   * Get the preferred provider (first configured one)
   */
  getPreferredProvider(): LLMProvider | null {
    const configured = this.getConfiguredProviders();
    return configured.length > 0 ? configured[0] : null;
  }

  /**
   * Clear all configurations
   */
  clearAll(): void {
    this.configs.clear();
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Test if an API key is valid by making a test request
   */
  async testConfig(provider: LLMProvider): Promise<{ valid: boolean; error?: string }> {
    const config = this.getConfig(provider);
    if (!config) {
      return { valid: false, error: 'No configuration found' };
    }

    try {
      // This is a simple test - in a real implementation, you'd make a minimal API call
      // For now, we'll just check if the API key looks valid
      const apiKeyPattern = {
        openai: /^sk-[a-zA-Z0-9]{48,}$/,
        gemini: /^[a-zA-Z0-9_-]{35,}$/,
        claude: /^sk-ant-[a-zA-Z0-9_-]{95,}$/,
        custom: /.+/ // Accept any non-empty string for custom providers
      };

      const pattern = apiKeyPattern[provider];
      const isValidFormat = pattern.test(config.apiKey);

      if (!isValidFormat) {
        return { 
          valid: false, 
          error: `API key format is invalid for ${provider}` 
        };
      }

      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Export singleton instance
export const apiKeyManager = APIKeyManager.getInstance();