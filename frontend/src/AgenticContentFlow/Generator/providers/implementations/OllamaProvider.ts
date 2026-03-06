/**
 * Ollama Provider
 * 
 * Ollama local LLM API implementation for content generation.
 * Supports local models like Llama 2, Code Llama, Mistral, etc.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-17
 */

import { 
  LLMAPIConfig, 
  LLMRequest, 
  LLMResponse, 
  GenerationType 
} from '../../generatortypes';
import { LLMProviderInterface, LLMProvider, LLMProviderConfig } from '../types';
import { OllamaAPI } from './api';
import { OllamaConfig, OllamaModel } from './types';


export class OllamaProvider implements LLMProviderInterface {
  private api: OllamaAPI;
  private availableModels: string[] = [];
  public provider: LLMProvider = 'ollama';
  public configured: boolean = false;

  constructor(config: OllamaConfig) {
    this.api = new OllamaAPI(config);
  }

  configure(config: LLMProviderConfig): void {
    this.api = new OllamaAPI(config as OllamaConfig);
    this.configured = true;
  }

  async initialize(): Promise<void> {
    try {
      // Fetch available models from Ollama
      const models = await this.api.listModels();
      this.availableModels = models.map((model: OllamaModel) => model.name);
    } catch (error) {
      console.error('Failed to fetch Ollama models:', error);
      this.availableModels = [];
    }
  }

  async generateContent(request: any): Promise<LLMResponse> {
    const config = request.config || {};
    const model = config.model;
    if (!model) {
      throw new Error('No model specified for Ollama generation');
    }
    const temperature = config.temperature || 0.7;

    try {
      const response = await this.api.generate({
        model,
        prompt: request.prompt,
        temperature,
        stream: false
      });

      return {
        content: response.response,
        provider: this.provider,
        model: response.model,
        confidence: 1.0,
        usage: {
          promptTokens: response.prompt_eval_count || 0,
          completionTokens: response.eval_count || 0,
          totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0)
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Ollama generation error:', error);
      throw error;
    }
  }

  async testConnection(config?: LLMProviderConfig): Promise<{ success: boolean; error?: string }> {
    try {
      // Update API with new config if provided
      if (config) {
        this.api = new OllamaAPI(config as OllamaConfig);
      }

      // First check if Ollama is running
      const isRunning = await this.api.isRunning();
      if (!isRunning) {
        return { 
          success: false, 
          error: 'Cannot connect to Ollama. Make sure it is running locally.'
        };
      }

      // Then check if we can list models
      const models = await this.api.listModels();
      this.availableModels = models.map((model: OllamaModel) => model.name);
      
      if (this.availableModels.length === 0) {
        return {
          success: false,
          error: 'No models available in Ollama. Please pull a model first.'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Ollama connection test failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  getProviderInfo() {
    return {
      name: 'Ollama',
      description: 'Local models for content generation',
      models: this.availableModels,
      defaultModel: this.availableModels.length > 0 ? this.availableModels[0] : '',
      requiresAPIKey: false,
      baseURL: this.api.getBaseURL()
    };
  }

  getUsageEstimate(request: any): { estimatedTokens: number; estimatedCost: number } {
    // Rough estimate: 1 token ≈ 4 characters
    const estimatedTokens = Math.ceil(request.prompt.length / 4);
    return { estimatedTokens, estimatedCost: 0 }; // Local models are free
  }

  private getSystemPrompt(type: GenerationType): string {
    const basePrompt = 'You are an expert code generator for the Agentic Content Flow system.';
    
    switch (type) {
      case 'process':
        return `${basePrompt} Generate JavaScript process functions that are secure, efficient, and well-documented.`;
      case 'flow':
        return `${basePrompt} Generate complete flow structures with nodes and edges that create meaningful data processing pipelines.`;
      default:
        return basePrompt;
    }
  }

  private calculateConfidence(data: any): number {
    // Local models generally have good consistency
    if (data.done === true) return 0.75;
    return 0.5;
  }
}