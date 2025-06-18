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
    const llmRequest: LLMRequest = {
      prompt,
      type: 'flow',
      context: `Generating flow for: ${request.description}`,
      provider: request.provider,
      config: undefined
    };

    const response = await this.aiService.generateContent(llmRequest);

    try {
      const flowData = JSON.parse(response.content);
      
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
      throw new Error('Failed to parse AI-generated flow structure');
    }
  }
}

