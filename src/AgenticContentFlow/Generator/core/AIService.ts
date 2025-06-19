/**
 * Unified AI Service
 * 
 * Central service for all LLM interactions with intelligent fallback strategies,
 * response caching, and request queuing.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-16
 */

import { 
  LLMRequest,
  LLMResponse,
  GeneratorConfig,
  LLMProvider
} from '../generatortypes';
import { LLMProviderFactory } from '../providers/factory/LLMProviderFactory';

/**
 * Unified AI Service
 * 
 * Handles all LLM communication with fallbacks and optimization
 */
export class UnifiedAIService {
  private config: Partial<GeneratorConfig> = {};
  private responseCache = new Map<string, LLMResponse>();
  private requestQueue: (() => Promise<void>)[] = [];
  private processing = false;
  private notifyError?: (title: string, message?: string) => void;

  constructor(config: Partial<GeneratorConfig>, notifyError?: (title: string, message?: string) => void) {
    this.config = config;
    this.notifyError = notifyError;
  }

  /**
   * Configure the AI service
   */
  configure(config: Partial<GeneratorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Generate content using configured LLM provider
   */
  async generateContent(request: LLMRequest): Promise<LLMResponse> {
    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    if (this.responseCache.has(cacheKey)) {
      return this.responseCache.get(cacheKey)!;
    }

    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const response = await this.processRequest(request);
          this.responseCache.set(cacheKey, response);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  /**
   * Process individual request with NO fallback logic
   */
  private async processRequest(request: LLMRequest): Promise<LLMResponse> {
    // Use the provider from the request instead of config
    const provider = request.provider || this.config.defaultProvider || 'openai';
    try {
      if (!provider) {
        throw new Error('No LLM provider configured');
      }
      const providerInstance = LLMProviderFactory.createProvider(provider);
      const response = await providerInstance.generateContent({
        prompt: request.prompt,
        context: request.context,
        type: request.type,
        provider, // Pass the provider to the provider instance
        config: request.config // Pass the config that contains the model
      });
      return response;
    } catch (error) {
      console.error(`Provider ${provider} failed:`, error);
      if (this.notifyError) {
        this.notifyError('Generation failed', error instanceof Error ? error.message : String(error));
      }
      throw error;
    }
  }

  /**
   * Process request queue sequentially
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.requestQueue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Request processing failed:', error);
        }
      }
    }

    this.processing = false;
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: LLMRequest): string {
    return `${request.type}:${btoa(request.prompt).substring(0, 32)}`;
  }

  /**
   * Clear response cache
   */
  clearCache(): void {
    this.responseCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.responseCache.size,
      keys: Array.from(this.responseCache.keys())
    };
  }
}