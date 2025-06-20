/**
 * Flow Generation Strategies
 * 
 * Handles different generation strategies for flow creation.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-16
 */

import { 
  FlowGenerationRequest,
  GenerationResult,
  LLMRequest,
  FlowMetadata
} from '../../generatortypes';
import { UnifiedAIService } from '../../core/AIService';
import { apiKeyManager } from '../../providers/management/APIKeyManager';

export interface FlowGenerationOptions {
  strategy: 'ai' | 'hybrid';
  prompt?: string;
}

/**
 * Generate unique request ID
 */
const generateRequestId = (): string => {
  return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * AI-based Flow Generation Strategy
 */
export class AIFlowStrategy {
  private aiService: UnifiedAIService;

  constructor(aiService: UnifiedAIService) {
    this.aiService = aiService;
  }

  async generate(request: FlowGenerationRequest, prompt: string): Promise<GenerationResult> {
    // Get API configuration for the provider using the singleton instance
    if (!request.provider) {
      throw new Error('No provider specified in request');
    }
    
    console.log('🔍 Retrieving API config for provider:', request.provider);
    const apiConfig = apiKeyManager.getConfig(request.provider);
    console.log('📋 Retrieved API config:', apiConfig ? { 
      provider: apiConfig.provider, 
      hasApiKey: !!apiConfig.apiKey, 
      baseURL: apiConfig.baseURL,
      model: apiConfig.model 
    } : 'null');
    
    if (!apiConfig) {
      throw new Error(`No API configuration found for provider: ${request.provider}`);
    }

    if (!apiConfig.apiKey && request.provider !== 'ollama' && request.provider !== 'custom') {
      throw new Error(`API key is required for provider: ${request.provider}`);
    }

    // Use the model from API configuration, with fallback to request model
    const modelToUse = apiConfig.model || request.model;
    console.log('🤖 Using model:', modelToUse);

    const llmRequest: LLMRequest = {
      prompt,
      type: 'flow',
      context: `Generating flow for: ${request.description}`,
      provider: request.provider,
      config: {
        ...apiConfig, // Include the full API config (apiKey, baseURL, etc.)
        model: modelToUse, // Use the selected model
        temperature: 0.7,
        maxTokens: 4000
      }
    };

    const response = await this.aiService.generateContent(llmRequest);

    // Debug: Log the AI response
    console.log('🤖 AI Response:', response.content);
    console.log('📝 Response length:', response.content.length);

    try {
      // Extract JSON from markdown code blocks if present
      let jsonContent = response.content.trim();
      
      // Remove markdown code block wrappers
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log('🧹 Cleaned JSON content:', jsonContent);
      
      const flowData = JSON.parse(jsonContent);
      console.log('✅ Parsed flow data:', flowData);
      
      const metadata: FlowMetadata = {
        requestId: generateRequestId(),
        timestamp: Date.now(),
        version: '2.0.0',
        nodeCount: flowData.nodes?.length || 0,
        edgeCount: flowData.edges?.length || 0,
        flowType: request.type,
        features: request.features || [],
        autoCorrections: 0
      };
      
      return {
        type: 'flow',
        strategy: 'ai',
        nodes: flowData.nodes || [],
        edges: flowData.edges || [],
        description: request.description,
        confidence: response.confidence || 0.8,
        generatedAt: new Date().toISOString(),
        provider: response.provider,
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
          nodeTypeValidation: true,
          handleValidation: true,
          structureValidation: true,
          circularDependencies: false
        },
        metadata
      };
    } catch (error) {
      console.error('❌ JSON Parse Error:', error);
      console.error('🔍 Raw content that failed to parse:', response.content);
      throw new Error('Failed to parse AI-generated flow structure');
    }
  }
}

