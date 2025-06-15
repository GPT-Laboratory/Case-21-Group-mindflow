/**
 * LLM API Configuration Types and Validation
 * 
 * Defines types and interfaces for configuring different LLM providers
 * for process code generation.
 * 
 * @author Agentic Content Flow Team
 * @version 1.0.0
 * @since 2025-06-15
 */

export type LLMProvider = 'openai' | 'gemini' | 'claude' | 'custom';

export interface LLMAPIConfig {
  /** Provider identifier */
  provider: LLMProvider;
  
  /** API key for authentication */
  apiKey: string;
  
  /** Base URL for API requests */
  baseUrl?: string;
  
  /** Model to use for generation */
  model?: string;
  
  /** Request timeout in milliseconds */
  timeout?: number;
  
  /** Maximum tokens to generate */
  maxTokens?: number;
  
  /** Temperature for generation (0-1) */
  temperature?: number;
  
  /** Additional provider-specific options */
  options?: Record<string, any>;
}

export interface LLMProviderDefaults {
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

export const PROVIDER_DEFAULTS: Record<LLMProvider, Partial<LLMProviderDefaults>> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
    maxTokens: 4000,
    temperature: 0.3,
    timeout: 30000
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-pro',
    maxTokens: 2048,
    temperature: 0.3,
    timeout: 30000
  },
  claude: {
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-sonnet-20240229',
    maxTokens: 4000,
    temperature: 0.3,
    timeout: 30000
  },
  custom: {
    maxTokens: 2048,
    temperature: 0.3,
    timeout: 30000
  }
};

export interface LLMRequest {
  /** The prompt to send to the LLM */
  prompt: string;
  
  /** Node type for context */
  nodeType: string;
  
  /** Node instance data */
  nodeData: Record<string, any>;
  
  /** Input schema if available */
  inputSchema?: any;
  
  /** Output schema if available */
  outputSchema?: any;
  
  /** Template description */
  templateDescription?: string;
}

export interface LLMResponse {
  /** Generated code */
  code: string;
  
  /** Provider that generated the response */
  provider: LLMProvider;
  
  /** Model used for generation */
  model: string;
  
  /** Confidence score if available */
  confidence?: number;
  
  /** Token usage information */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  
  /** Generation timestamp */
  timestamp: string;
  
  /** Additional metadata from provider */
  metadata?: Record<string, any>;
}

export interface LLMError {
  /** Error type */
  type: 'authentication' | 'rate_limit' | 'network' | 'invalid_response' | 'unknown';
  
  /** Human-readable error message */
  message: string;
  
  /** Technical error details */
  details?: any;
  
  /** Provider that caused the error */
  provider: LLMProvider;
  
  /** Suggested action for user */
  suggestion?: string;
}

/**
 * Validate LLM API configuration
 */
export function validateLLMConfig(config: Partial<LLMAPIConfig>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.provider) {
    errors.push('Provider is required');
  }
  
  if (!config.apiKey || config.apiKey.trim() === '') {
    errors.push('API key is required');
  }
  
  if (config.timeout && config.timeout < 1000) {
    errors.push('Timeout must be at least 1000ms');
  }
  
  if (config.maxTokens && config.maxTokens < 100) {
    errors.push('Max tokens must be at least 100');
  }
  
  if (config.temperature && (config.temperature < 0 || config.temperature > 1)) {
    errors.push('Temperature must be between 0 and 1');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get complete configuration with defaults
 */
export function getCompleteConfig(config: Partial<LLMAPIConfig>): LLMAPIConfig {
  const defaults = PROVIDER_DEFAULTS[config.provider || 'openai'];
  
  return {
    provider: config.provider || 'openai',
    apiKey: config.apiKey || '',
    baseUrl: config.baseUrl || defaults?.baseUrl || '',
    model: config.model || defaults?.model || '',
    timeout: config.timeout || defaults?.timeout || 30000,
    maxTokens: config.maxTokens || defaults?.maxTokens || 2048,
    temperature: config.temperature ?? defaults?.temperature ?? 0.3,
    options: config.options || {}
  };
}