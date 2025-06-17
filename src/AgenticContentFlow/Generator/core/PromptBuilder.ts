/**
 * Unified Prompt Builder
 * 
 * Intelligent prompt construction service that builds optimized prompts
 * for all generation types with context awareness and best practices.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-16
 */

import { 
  ProcessGenerationRequest,
  FlowGenerationRequest,
  GeneratorConfig
} from '../generatortypes';

import { PromptBuildRequest } from '../generatortypes';
import { ProcessPromptBuilder } from './prompts/ProcessPromptBuilder';
import { FlowPromptBuilder } from './prompts/FlowPromptBuilder';

/**
 * Unified Prompt Builder
 * 
 * Builds intelligent prompts for all generation types
 */
export class UnifiedPromptBuilder {
  private config: Partial<GeneratorConfig> = {};
  private processPromptBuilder: ProcessPromptBuilder;
  private flowPromptBuilder: FlowPromptBuilder;

  constructor() {
    this.processPromptBuilder = new ProcessPromptBuilder();
    this.flowPromptBuilder = new FlowPromptBuilder();
  }

  /**
   * Configure the prompt builder
   */
  configure(config: Partial<GeneratorConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Configure all sub-builders
    this.processPromptBuilder.configure(config);
    this.flowPromptBuilder.configure(config);
  }

  /**
   * Build process generation prompt
   */
  async buildProcessPrompt(request: ProcessGenerationRequest): Promise<string> {
    // Convert ProcessGenerationRequest to PromptBuildRequest format
    const promptRequest: PromptBuildRequest = {
      nodeType: request.nodeType,
      nodeId: request.nodeId,
      templateDescription: request.nodeData.description || 'Process node function',
      instanceData: request.nodeData,
      templateData: request.nodeData.templateData || {},
      inputSchema: request.inputSchema,
      outputSchema: request.outputSchema,
      sourceNodes: request.context?.availableParams?.sourceMap ? [] : undefined,
      targetNodes: request.context?.availableParams?.targetMap ? [] : undefined
    };

    return this.processPromptBuilder.buildPrompt(promptRequest);
  }

  /**
   * Build flow generation prompt
   */
  async buildFlowPrompt(request: FlowGenerationRequest): Promise<string> {
    return this.flowPromptBuilder.buildFlowPrompt(request);
  }

  /**
   * Build self-correction prompt for fixing validation errors
   */
  buildSelfCorrectionPrompt(
    invalidFlow: any,
    errors: Array<{ message: string; suggestedFix?: string }>,
    originalRequest: FlowGenerationRequest
  ): string {
    return this.flowPromptBuilder.buildSelfCorrectionPrompt(invalidFlow, errors, originalRequest);
  }

  /**
   * Build enhanced prompt with legacy Process/Generation compatibility
   */
  async buildLegacyProcessPrompt(request: PromptBuildRequest): Promise<string> {
    return this.processPromptBuilder.buildPrompt(request);
  }
}