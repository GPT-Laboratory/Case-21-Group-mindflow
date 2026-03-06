/**
 * Security Module
 * 
 * Handles encryption, validation, and security operations for API configurations.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-16
 */

import { LLMProvider, LLMAPIConfig } from '../../../generatortypes';

/**
 * Security Service
 */
export class SecurityService {
  
  /**
   * Validate API configuration
   */
  validateConfig(config: Partial<LLMAPIConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.provider) {
      errors.push('Provider is required');
    }
    
    // API key is optional for ollama and some custom providers
    if (!config.apiKey && config.provider !== 'ollama' && config.provider !== 'custom') {
      errors.push('API key is required');
    }
    
    if (config.timeout && config.timeout < 1000) {
      errors.push('Timeout must be at least 1000ms');
    }
    
    if (config.maxTokens && config.maxTokens < 100) {
      errors.push('Max tokens must be at least 100');
    }
    
    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 1)) {
      errors.push('Temperature must be between 0 and 1');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Encrypt configuration (simple base64 for browser environment)
   */
  encryptConfig(config: LLMAPIConfig): LLMAPIConfig {
    // Simple base64 encoding for API keys (browser environment)
    // In production, use proper encryption
    return {
      ...config,
      apiKey: config.apiKey ? btoa(config.apiKey) : ''
    };
  }

  /**
   * Decrypt configuration
   */
  decryptConfig(config: LLMAPIConfig): LLMAPIConfig {
    try {
      return {
        ...config,
        apiKey: config.apiKey ? atob(config.apiKey) : ''
      };
    } catch (error) {
      console.error('Failed to decrypt API key:', error);
      return config;
    }
  }

  /**
   * Sanitize configuration for logging
   */
  sanitizeConfigForLogging(config: LLMAPIConfig): Partial<LLMAPIConfig> {
    return {
      provider: config.provider,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      timeout: config.timeout,
      apiKey: config.apiKey ? '***masked***' : undefined
    };
  }

  /**
   * Generate secure configuration ID
   */
  generateConfigId(provider: LLMProvider): string {
    return `${provider}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}