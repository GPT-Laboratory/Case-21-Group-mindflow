/**
 * LLM Providers
 * 
 * Implementation of different LLM provider APIs for code generation.
 * Supports OpenAI, Google Gemini, Anthropic Claude, and custom providers.
 * 
 * @author Agentic Content Flow Team
 * @version 1.0.0
 * @since 2025-06-15
 */

import { LLMAPIConfig, LLMGenerationRequest, LLMGenerationResult, LLMProvider } from './types';

export interface LLMProviderInterface {
  generateCode(request: LLMGenerationRequest): Promise<LLMGenerationResult>;
  testConnection(config: LLMAPIConfig): Promise<{ success: boolean; error?: string }>;
  getProviderInfo(): { name: string; models: string[]; defaultModel: string };
}

/**
 * OpenAI GPT Provider
 */
export class OpenAIProvider implements LLMProviderInterface {
  private readonly baseUrl = 'https://api.openai.com/v1';

  async generateCode(request: LLMGenerationRequest): Promise<LLMGenerationResult> {
    const config = request.config!;
    const model = config.model || 'gpt-4o-mini';

    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert JavaScript developer specializing in creating process functions for node-based workflows. Generate clean, efficient, and well-documented code.'
            },
            {
              role: 'user',
              content: request.prompt
            }
          ],
          max_tokens: config.maxTokens || 2048,
          temperature: config.temperature || 0.3,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      const generatedCode = data.choices[0]?.message?.content || '';

      // Extract just the function code if wrapped in markdown
      const codeMatch = generatedCode.match(/```(?:javascript|js)?\n([\s\S]*?)\n```/);
      const code = codeMatch ? codeMatch[1] : generatedCode;

      return {
        code: code.trim(),
        confidence: 0.85,
        provider: 'openai',
        model,
        tokensUsed: data.usage?.total_tokens,
        explanation: 'Generated using OpenAI GPT with process-specific prompt',
        suggestions: ['Review generated code for your specific requirements', 'Test with sample data'],
        warnings: []
      };

    } catch (error) {
      console.error('OpenAI generation failed:', error);
      throw new Error(`OpenAI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnection(config: LLMAPIConfig): Promise<{ success: boolean; error?: string }> {
    if (!config.apiKey) {
      return { success: false, error: 'API key is required' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
      });

      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${error}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Connection failed' };
    }
  }

  getProviderInfo() {
    return {
      name: 'OpenAI',
      models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      defaultModel: 'gpt-4o-mini'
    };
  }
}

/**
 * Google Gemini Provider
 */
export class GeminiProvider implements LLMProviderInterface {
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  async generateCode(request: LLMGenerationRequest): Promise<LLMGenerationResult> {
    const config = request.config!;
    const model = config.model || 'gemini-pro';

    try {
      const response = await fetch(`${this.baseUrl}/models/${model}:generateContent?key=${config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: request.prompt
            }]
          }],
          generationConfig: {
            maxOutputTokens: config.maxTokens || 2048,
            temperature: config.temperature || 0.3,
          }
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      const generatedCode = data.candidates[0]?.content?.parts[0]?.text || '';

      // Extract just the function code if wrapped in markdown
      const codeMatch = generatedCode.match(/```(?:javascript|js)?\n([\s\S]*?)\n```/);
      const code = codeMatch ? codeMatch[1] : generatedCode;

      return {
        code: code.trim(),
        confidence: 0.8,
        provider: 'gemini',
        model,
        explanation: 'Generated using Google Gemini with process-specific prompt',
        suggestions: ['Review generated code for your specific requirements', 'Test with sample data'],
        warnings: []
      };

    } catch (error) {
      console.error('Gemini generation failed:', error);
      throw new Error(`Gemini generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnection(config: LLMAPIConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/models?key=${config.apiKey}`);

      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${error}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Connection failed' };
    }
  }

  getProviderInfo() {
    return {
      name: 'Google Gemini',
      models: ['gemini-pro', 'gemini-pro-vision'],
      defaultModel: 'gemini-pro'
    };
  }
}

/**
 * Anthropic Claude Provider
 */
export class ClaudeProvider implements LLMProviderInterface {
  private readonly baseUrl = 'https://api.anthropic.com/v1';

  async generateCode(request: LLMGenerationRequest): Promise<LLMGenerationResult> {
    const config = request.config!;
    const model = config.model || 'claude-3-sonnet-20240229';

    if (!config.apiKey) {
      throw new Error('Claude API key is required');
    }

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': config.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          max_tokens: config.maxTokens || 2048,
          temperature: config.temperature || 0.3,
          messages: [
            {
              role: 'user',
              content: request.prompt
            }
          ]
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      const generatedCode = data.content[0]?.text || '';

      // Extract just the function code if wrapped in markdown
      const codeMatch = generatedCode.match(/```(?:javascript|js)?\n([\s\S]*?)\n```/);
      const code = codeMatch ? codeMatch[1] : generatedCode;

      return {
        code: code.trim(),
        confidence: 0.85,
        provider: 'claude',
        model,
        explanation: 'Generated using Anthropic Claude with process-specific prompt',
        suggestions: ['Review generated code for your specific requirements', 'Test with sample data'],
        warnings: []
      };

    } catch (error) {
      console.error('Claude generation failed:', error);
      throw new Error(`Claude generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnection(config: LLMAPIConfig): Promise<{ success: boolean; error?: string }> {
    if (!config.apiKey) {
      return { success: false, error: 'API key is required' };
    }

    try {
      // Claude doesn't have a simple ping endpoint, so we make a minimal request
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': config.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        }),
      });

      if (response.ok || response.status === 400) { // 400 might be rate limit but key is valid
        return { success: true };
      } else {
        const error = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${error}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Connection failed' };
    }
  }

  getProviderInfo() {
    return {
      name: 'Anthropic Claude',
      models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
      defaultModel: 'claude-3-sonnet-20240229'
    };
  }
}

/**
 * Custom Provider for self-hosted or other APIs
 */
export class CustomProvider implements LLMProviderInterface {
  async generateCode(request: LLMGenerationRequest): Promise<LLMGenerationResult> {
    const config = request.config!;

    if (!config.baseUrl || !config.model) {
      throw new Error('Custom provider requires baseUrl and model');
    }

    try {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert JavaScript developer specializing in creating process functions for node-based workflows. Generate clean, efficient, and well-documented code.'
            },
            {
              role: 'user',
              content: request.prompt
            }
          ],
          max_tokens: config.maxTokens || 2048,
          temperature: config.temperature || 0.3,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Custom API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      const generatedCode = data.choices?.[0]?.message?.content || data.response || '';

      // Extract just the function code if wrapped in markdown
      const codeMatch = generatedCode.match(/```(?:javascript|js)?\n([\s\S]*?)\n```/);
      const code = codeMatch ? codeMatch[1] : generatedCode;

      return {
        code: code.trim(),
        confidence: 0.75,
        provider: 'custom',
        model: config.model,
        explanation: 'Generated using custom provider with process-specific prompt',
        suggestions: ['Review generated code for your specific requirements', 'Test with sample data'],
        warnings: []
      };

    } catch (error) {
      console.error('Custom provider generation failed:', error);
      throw new Error(`Custom provider generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnection(config: LLMAPIConfig): Promise<{ success: boolean; error?: string }> {
    if (!config.baseUrl) {
      return { success: false, error: 'Base URL is required for custom provider' };
    }

    try {
      const response = await fetch(`${config.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
      });

      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${error}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Connection failed' };
    }
  }

  getProviderInfo() {
    return {
      name: 'Custom Provider',
      models: ['custom-model'],
      defaultModel: 'custom-model'
    };
  }
}

/**
 * Ollama Local LLM Provider
 */
export class OllamaProvider implements LLMProviderInterface {
  private readonly defaultBaseUrl = 'http://localhost:11434';

  async generateCode(request: LLMGenerationRequest): Promise<LLMGenerationResult> {
    const config = request.config!;
    const model = config.model || 'llama2';
    const baseUrl = config.baseUrl || this.defaultBaseUrl;

    try {
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: `You are an expert JavaScript developer specializing in creating process functions for node-based workflows. Generate clean, efficient, and well-documented code.\n\n${request.prompt}`,
          stream: false,
          options: {
            temperature: config.temperature || 0.3,
            num_predict: config.maxTokens || 2048,
          }
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ollama API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      const generatedCode = data.response || '';

      // Extract just the function code if wrapped in markdown
      const codeMatch = generatedCode.match(/```(?:javascript|js)?\n([\s\S]*?)\n```/);
      const code = codeMatch ? codeMatch[1] : generatedCode;

      return {
        code: code.trim(),
        confidence: 0.75, // Local models generally have good consistency
        provider: 'ollama',
        model,
        explanation: 'Generated using Ollama local LLM with process-specific prompt',
        suggestions: ['Review generated code for your specific requirements', 'Test with sample data', 'Ollama runs locally for privacy'],
        warnings: []
      };

    } catch (error) {
      console.error('Ollama generation failed:', error);
      throw new Error(`Ollama generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnection(config: LLMAPIConfig): Promise<{ success: boolean; error?: string }> {
    const baseUrl = config.baseUrl || this.defaultBaseUrl;
    
    try {
      // Test if Ollama is running by checking the tags endpoint
      const response = await fetch(`${baseUrl}/api/tags`);

      if (response.ok) {
        const data = await response.json();
        if (data.models && Array.isArray(data.models)) {
          return { success: true };
        } else {
          return { success: false, error: 'Ollama is running but no models are available' };
        }
      } else {
        const error = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${error}` };
      }
    } catch (error) {
      return { 
        success: false, 
        error: `Cannot connect to Ollama at ${baseUrl}. Make sure Ollama is running locally.`
      };
    }
  }

  getProviderInfo() {
    return {
      name: 'Ollama (Local)',
      models: ['llama2', 'codellama', 'llama2:13b', 'llama2:70b', 'codellama:7b', 'codellama:13b', 'mistral', 'neural-chat'],
      defaultModel: 'llama2'
    };
  }
}

/**
 * Provider Factory
 */
export class LLMProviderFactory {
  static createProvider(provider: LLMProvider): LLMProviderInterface {
    switch (provider) {
      case 'openai':
        return new OpenAIProvider();
      case 'gemini':
        return new GeminiProvider();
      case 'claude':
        return new ClaudeProvider();
      case 'ollama':
        return new OllamaProvider();
      case 'custom':
        return new CustomProvider();
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  static getAllProviders(): Record<LLMProvider, LLMProviderInterface> {
    return {
      openai: new OpenAIProvider(),
      gemini: new GeminiProvider(),
      claude: new ClaudeProvider(),
      ollama: new OllamaProvider(),
      custom: new CustomProvider()
    };
  }
}