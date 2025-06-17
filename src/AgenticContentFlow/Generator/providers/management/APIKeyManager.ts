/**
 * API Key Manager
 * 
 * Consolidated credential management system that serves both process and flow generation
 * with enhanced security and provider management capabilities.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-16
 */

import { LLMProvider, LLMAPIConfig, LLMProviderInfo } from '../../generatortypes';
import { ProviderInfoService } from '../modules/info/ProviderInfoService';
import { SecurityService } from '../modules/security/SecurityService';
import { ConfigurationStorage } from '../modules/storage/ConfigurationStorage';
import { UsageTracker } from '../modules/storage/UsageTracker';


/**
 * API Key Manager
 * 
 * Manages LLM provider configurations with enhanced security and usage tracking
 */
export class APIKeyManager {
  private configs: Map<LLMProvider, LLMAPIConfig> = new Map();
  
  // Modular services
  private storage: ConfigurationStorage;
  private usageTracker: UsageTracker;
  private security: SecurityService;
  private providerInfo: ProviderInfoService;
  
  constructor() {
    this.storage = new ConfigurationStorage();
    this.usageTracker = new UsageTracker();
    this.security = new SecurityService();
    this.providerInfo = new ProviderInfoService();
    
    this.loadConfigurations();
  }

  /**
   * Save configuration for a provider
   */
  saveConfig(provider: LLMProvider, config: LLMAPIConfig): void {
    try {
      // Validate configuration
      const validation = this.security.validateConfig(config);
      if (!validation.valid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }

      // Encrypt sensitive data
      const encryptedConfig = this.security.encryptConfig(config);
      this.configs.set(provider, encryptedConfig);
      
      // Mark as valid and update usage
      this.usageTracker.markAsUsed(provider);
      
      // Persist to storage
      this.storage.saveConfigurations(this.configs);
      
      console.log(`✅ Configuration saved for provider: ${provider}`);
    } catch (error) {
      console.error(`❌ Failed to save configuration for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Get configuration for a provider
   */
  getConfig(provider: LLMProvider): LLMAPIConfig | undefined {
    try {
      const config = this.configs.get(provider);
      if (!config) return undefined;
      
      return this.security.decryptConfig(config);
    } catch (error) {
      console.error(`❌ Failed to decrypt configuration for ${provider}:`, error);
      return undefined;
    }
  }

  /**
   * Get all configured providers
   */
  getConfiguredProviders(): LLMProvider[] {
    return Array.from(this.configs.keys());
  }

  /**
   * Get provider information with status
   */
  getProviderInfo(): LLMProviderInfo[] {
    const configured = this.getConfiguredProviders();
    return this.providerInfo.getProviderInfo(configured);
  }

  /**
   * Set preferred provider
   */
  setPreferredProvider(provider: LLMProvider): void {
    if (!this.configs.has(provider)) {
      throw new Error(`Provider ${provider} is not configured`);
    }
    
    this.providerInfo.setPreferredProvider(provider);
    console.log(`✅ Set preferred provider: ${provider}`);
  }

  /**
   * Get preferred provider
   */
  getPreferredProvider(): LLMProvider | null {
    const preferred = this.providerInfo.getPreferredProvider();
    
    // Verify the preferred provider is still configured
    if (preferred && this.configs.has(preferred)) {
      return preferred;
    }
    
    // Fallback to first configured provider
    const configured = this.getConfiguredProviders();
    return configured.length > 0 ? configured[0] : null;
  }

  /**
   * Get best available provider based on usage and validity
   */
  getBestProvider(): LLMProvider | null {
    const configured = this.getConfiguredProviders();
    
    return this.providerInfo.getBestProvider(
      configured,
      (provider: LLMProvider) => this.usageTracker.isProviderValid(provider),
      (providers: LLMProvider[]) => this.usageTracker.getMostRecentlyUsed(providers)
    );
  }

  /**
   * Mark provider as used (successful operation)
   */
  markAsUsed(provider: LLMProvider): void {
    this.usageTracker.markAsUsed(provider);
  }

  /**
   * Mark provider as invalid (failed operation)
   */
  markAsInvalid(provider: LLMProvider, error?: string): void {
    this.usageTracker.markAsInvalid(provider, error);
  }

  /**
   * Check if provider is valid
   */
  isProviderValid(provider: LLMProvider): boolean {
    return this.usageTracker.isProviderValid(provider);
  }

  /**
   * Remove configuration for a provider
   */
  removeConfig(provider: LLMProvider): void {
    this.configs.delete(provider);
    this.usageTracker.clearProvider(provider);
    
    // Clear as preferred if it was the preferred provider
    if (this.getPreferredProvider() === provider) {
      this.providerInfo.clearPreferredProvider();
    }
    
    this.storage.saveConfigurations(this.configs);
    
    console.log(`✅ Removed configuration for provider: ${provider}`);
  }

  /**
   * Clear all configurations
   */
  clearAll(): void {
    this.configs.clear();
    this.usageTracker.clearAll();
    this.storage.clearConfigurations();
    this.providerInfo.clearPreferredProvider();
    
    console.log('✅ Cleared all provider configurations');
  }

  /**
   * Get provider statistics
   */
  getProviderStats(): Record<LLMProvider, { usageCount: number; lastUsed?: string; isValid: boolean }> {
    return this.usageTracker.getAllStats();
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private loadConfigurations(): void {
    this.configs = this.storage.loadConfigurations();
  }
}

// Export singleton instance
export const apiKeyManager = new APIKeyManager();