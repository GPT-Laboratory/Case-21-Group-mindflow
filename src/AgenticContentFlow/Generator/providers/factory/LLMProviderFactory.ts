/**
 * Unified LLM Providers
 * 
 * Consolidated LLM provider implementations that serve both process and flow generation
 * with enhanced error handling, usage tracking, and provider-specific optimizations.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-16
 */

import { 
  LLMProvider, 
  LLMAPIConfig, 
  LLMRequest, 
  LLMResponse, 
} from '../../generatortypes';

// Import individual provider implementations
import { OpenAIProvider } from '../implementations/OpenAIProvider';
import { GeminiProvider } from '../implementations/GeminiProvider';
import { ClaudeProvider } from '../implementations/ClaudeProvider';
import { OllamaProvider } from '../implementations/OllamaProvider';
import { CustomProvider } from '../implementations/CustomProvider';

// ============================================================================
// BASE PROVIDER INTERFACE
// ============================================================================

export interface LLMProviderInterface {
  generateContent(request: LLMRequest): Promise<LLMResponse>;
  testConnection(config: LLMAPIConfig): Promise<{ success: boolean; error?: string }>;
  getProviderInfo(): { name: string; models: string[]; defaultModel: string };
  getUsageEstimate(request: LLMRequest): { estimatedTokens: number; estimatedCost: number };
}

// ============================================================================
// PROVIDER FACTORY
// ============================================================================

export class LLMProviderFactory {
  private static providers: Map<LLMProvider, () => LLMProviderInterface> = new Map<LLMProvider, () => LLMProviderInterface>([
    ['openai', () => new OpenAIProvider()],
    ['gemini', () => new GeminiProvider()],
    ['claude', () => new ClaudeProvider()],
    ['ollama', () => new OllamaProvider({})],
    ['custom', () => new CustomProvider()],
  ]);

  static createProvider(provider: LLMProvider): LLMProviderInterface {
    const factory = this.providers.get(provider);
    if (!factory) {
      throw new Error(`Unsupported LLM provider: ${provider}`);
    }
    return factory();
  }

  static getAllProviders(): Record<LLMProvider, LLMProviderInterface> {
    const result = {} as Record<LLMProvider, LLMProviderInterface>;
    for (const [provider, factory] of this.providers.entries()) {
      result[provider] = factory();
    }
    return result;
  }

  static getProviderNames(): LLMProvider[] {
    return Array.from(this.providers.keys());
  }
}