/**
 * Provider Types
 * 
 * Type definitions for LLM providers and their configurations.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-16
 */

export type LLMProvider = 'openai' | 'gemini' | 'claude' | 'ollama' | 'custom';

export interface LLMProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

export interface LLMResponse {
  content: string;
  confidence?: number;
  provider: LLMProvider;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMProviderInterface {
  provider: LLMProvider;
  configured: boolean;
  
  configure(config: LLMProviderConfig): void;
  generateContent(request: any): Promise<LLMResponse>;
  testConnection(): Promise<{ success: boolean; error?: string }>;
}

export interface ProviderStatus {
  provider: LLMProvider;
  name: string;
  configured: boolean;
  available: boolean;
  lastUsed?: string;
  errorCount: number;
}