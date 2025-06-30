/**
 * Generator Orchestrator
 * 
 * Central orchestration service that coordinates all generation types and
 * manages the overall generation workflow.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-16
 */

import { 
  GenerationRequest,
  GenerationResult,
  GeneratorConfig,
  ProcessGenerationRequest,
  FlowGenerationRequest,
} from '../generatortypes';
import { UnifiedPromptBuilder } from './PromptBuilder';
import { ValidationService } from './ValidationService';
import { ProcessGenerator } from '../services/ProcessGenerator';
import { FlowGenerator } from '../services/FlowGenerator';

interface StatusCallback {
  (nodeId: string, status: 'generating_function' | 'generating_label' | 'generating_details' | 'generating_url' | 'generating_condition' | 'generating_content' | 'generating_transformation' | 'generating_config' | 'completed' | 'error', message: string, error?: string): void;
}

/**
 * Generator Orchestrator
 * 
 * Main coordination service for all generation operations
 */
export class GeneratorOrchestrator {
  private promptBuilder: UnifiedPromptBuilder;
  private validationService: ValidationService;
  private processGenerator: ProcessGenerator;
  private flowGenerator: FlowGenerator;
  private config: Partial<GeneratorConfig> = {};

  constructor(notifyError?: (title: string, message?: string) => void) {
    this.promptBuilder = new UnifiedPromptBuilder();
    this.validationService = new ValidationService();
    this.processGenerator = new ProcessGenerator(notifyError);
    this.flowGenerator = new FlowGenerator(notifyError);
  }

  /**
   * Configure all services
   */
  configure(config: Partial<GeneratorConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Configure all sub-services
    this.promptBuilder.configure(config);
    this.validationService.configure(config);
    this.processGenerator.configure(config);
    this.flowGenerator.configure(config);
  }

  /**
   * Generate process code
   */
  async generateProcess(request: ProcessGenerationRequest, statusCallback?: StatusCallback): Promise<GenerationResult> {
    console.log('🚀 Starting process generation:', request);
    
    try {
      // Use the new simplified approach
      const { code, updatedNodeData } = await this.processGenerator.generateProcessCode(
        request.nodeId,
        request.nodeType,
        request.nodeData,
        request.nodeData?.userRequest || '',
        request.nodeData?.currentInstanceCode,
        request.provider,
        request.model,
        statusCallback
      );

      return {
        type: 'process',
        strategy: 'ai',
        code: code,
        nodeId: request.nodeId,
        confidence: 0.8,
        generatedAt: new Date().toISOString(),
        provider: request.provider,
        updatedNodeData: updatedNodeData,
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
          syntaxValid: true,
          securityIssues: [],
          performanceWarnings: [],
          suggestions: []
        },
        metadata: {
          nodeType: request.nodeType,
          templateUsed: 'ai-generated',
          tokensUsed: 0,
          generationTime: Date.now(),
          validationScore: 0.8,
          confidence: 0.8
        }
      };
    } catch (error) {
      console.error('❌ Process generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate flow structure
   */
  async generateFlow(request: FlowGenerationRequest): Promise<GenerationResult> {
    const prompt = await this.promptBuilder.buildFlowPrompt(request);
    
    // Debug: Log the prompt being sent
    console.log('📝 Flow generation prompt:', prompt);
    console.log('📝 Prompt length:', prompt.length);
    
    // Always use 'ai' for flow generation
    const result = await this.flowGenerator.generate(request, {
      strategy: 'ai',
      prompt
    });

    // Check for common AI error: edges without nodes
    if (result && result.type === 'flow') {
      const flowData = result as any;
      if (flowData.edges && Array.isArray(flowData.edges) && flowData.edges.length > 0 && 
          (!flowData.nodes || !Array.isArray(flowData.nodes) || flowData.nodes.length === 0)) {
        throw new Error('AI generated edges without nodes. This is a common generation error. Please retry.');
      }
    }

    return result;
  }

  /**
   * Generate content based on request type
   */
  async generate(request: GenerationRequest, statusCallback?: StatusCallback): Promise<GenerationResult> {
    console.log(`🚀 Starting ${request.type} generation:`, request);

    try {
      let result: GenerationResult;

      switch (request.type) {
        case 'process':
          result = await this.generateProcess(request as ProcessGenerationRequest, statusCallback);
          break;
        case 'flow':
          result = await this.generateFlow(request as FlowGenerationRequest);
          break;
        default:
          throw new Error(`Unsupported generation type: ${(request as any).type}`);
      }

      // Validate result
      result = await this.validateResult(result);

      console.log(`✅ Generation completed:`, { type: result.type, confidence: result.confidence });
      return result;

    } catch (error) {
      console.error(`❌ Generation failed:`, error);
      throw error;
    }
  }

  /**
   * Validate generation result
   */
  private async validateResult(result: GenerationResult): Promise<GenerationResult> {
    switch (result.type) {
      case 'process':
        return await this.validationService.validateProcessResult(result);
      case 'flow':
        return await this.validationService.validateFlowResult(result);
      default:
        return result;
    }
  }

  /**
   * Get configuration status
   */
  getStatus(): {
    configured: boolean;
    services: Record<string, boolean>;
    config: Partial<GeneratorConfig>;
  } {
    return {
      configured: Object.keys(this.config).length > 0,
      services: {
        promptBuilder: true,
        validationService: true,
        processGenerator: true,
        flowGenerator: true
      },
      config: this.config
    };
  }
}