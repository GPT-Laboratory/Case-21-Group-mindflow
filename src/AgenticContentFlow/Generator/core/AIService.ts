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
   * Process individual request with fallback logic
   */
  private async processRequest(request: LLMRequest): Promise<LLMResponse> {
    const provider = this.config.defaultProvider || 'openai';
    
    try {
      if (!provider) {
        throw new Error('No LLM provider configured');
      }

      const providerInstance = LLMProviderFactory.createProvider(provider);
      const response = await providerInstance.generateContent({
        prompt: request.prompt,
        context: request.context,
        type: request.type
      });

      return response;
    } catch (error) {
      console.warn(`Primary provider ${provider} failed:`, error);
      return await this.attemptFallback(request, provider);
    }
  }

  /**
   * Attempt fallback to other providers
   */
  private async attemptFallback(request: LLMRequest, failedProvider: LLMProvider): Promise<LLMResponse> {
    const fallbackProviders: LLMProvider[] = (['openai', 'gemini', 'claude', 'ollama'] as LLMProvider[])
      .filter(p => p !== failedProvider);

    for (const provider of fallbackProviders) {
      try {
        const providerInstance = LLMProviderFactory.createProvider(provider);
        const response = await providerInstance.generateContent({
          prompt: request.prompt,
          context: request.context,
          type: request.type
        });

        console.log(`✅ Fallback to ${provider} succeeded`);
        return response;
      } catch (error) {
        console.warn(`Fallback provider ${provider} failed:`, error);
        continue;
      }
    }

    throw new Error('All LLM providers failed');
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