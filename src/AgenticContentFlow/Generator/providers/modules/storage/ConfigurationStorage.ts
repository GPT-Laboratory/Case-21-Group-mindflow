/**
 * Configuration Storage Module
 * 
 * Handles persistent storage and retrieval of API configurations.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-16
 */

import { LLMProvider, LLMAPIConfig } from '../../../generatortypes';

const STORAGE_KEY = 'agentic_flow_llm_configs';

/**
 * Configuration Storage Service
 */
export class ConfigurationStorage {
  
  /**
   * Load all configurations from storage
   */
  loadConfigurations(): Map<LLMProvider, LLMAPIConfig> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return new Map(Object.entries(data) as [LLMProvider, LLMAPIConfig][]);
      }
    } catch (error) {
      console.error('Failed to load configurations:', error);
    }
    return new Map();
  }

  /**
   * Save configurations to storage
   */
  saveConfigurations(configs: Map<LLMProvider, LLMAPIConfig>): void {
    try {
      const data = Object.fromEntries(configs.entries());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to persist configurations:', error);
      throw error;
    }
  }

  /**
   * Clear all configurations from storage
   */
  clearConfigurations(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}