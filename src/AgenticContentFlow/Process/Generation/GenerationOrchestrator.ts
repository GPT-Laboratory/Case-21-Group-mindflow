/**
 * Generation Orchestrator
 * 
 * Main orchestrator that coordinates the LLM-powered code generation process.
 * Handles prompt building, LLM communication, validation, and result processing.
 * 
 * @author Agentic Content Flow Team
 * @version 1.0.0
 * @since 2025-06-15
 */

import { PromptBuilder } from './PromptBuilder';
import { LLMProviderFactory } from './LLMProviders';
import { ProcessCodeValidator } from './validation';
import { apiKeyManager } from './APIKeyManager';
import { dataSchemaManager } from '../../Schema';
import { 
  LLMProvider, 
  LLMGenerationResult, 
  GenerationContext, 
  PromptBuildRequest 
} from './types';

export interface GenerationProgress {
  stage: 'preparing' | 'building_prompt' | 'calling_llm' | 'validating' | 'complete' | 'error';
  message: string;
  progress: number; // 0-100
}

export type ProgressCallback = (progress: GenerationProgress) => void;

export class GenerationOrchestrator {
  private promptBuilder: PromptBuilder;
  private validator: ProcessCodeValidator;
  
  constructor() {
    this.promptBuilder = new PromptBuilder();
    this.validator = new ProcessCodeValidator();
  }

  /**
   * Generate code for a node using LLM
   */
  async generateCode(
    context: GenerationContext,
    onProgress?: ProgressCallback
  ): Promise<LLMGenerationResult> {
    try {
      onProgress?.({ stage: 'preparing', message: 'Preparing generation request...', progress: 10 });

      // Get LLM provider configuration
      const provider = this.selectLLMProvider();
      if (!provider) {
        throw new Error('No LLM provider configured');
      }

      const config = apiKeyManager.getConfig(provider);
      if (!config) {
        throw new Error(`No valid configuration for ${provider}`);
      }

      onProgress?.({ stage: 'building_prompt', message: 'Building intelligent prompt...', progress: 20 });

      // Build comprehensive prompt
      const promptRequest = await this.buildPromptRequest(context);
      const prompt = this.promptBuilder.buildPrompt(promptRequest);

      console.log('🎯 Generated prompt for LLM:', {
        nodeType: context.nodeType,
        nodeId: context.nodeId,
        promptLength: prompt.length,
        provider
      });

      onProgress?.({ stage: 'calling_llm', message: `Calling ${provider} API...`, progress: 40 });

      // Generate code using LLM
      const llmProvider = LLMProviderFactory.createProvider(provider);
      const result = await llmProvider.generateCode({
        prompt,
        nodeType: context.nodeType,
        nodeId: context.nodeId,
        config
      });

      // Mark provider as recently used
      apiKeyManager.markAsUsed(provider);

      onProgress?.({ stage: 'validating', message: 'Validating generated code...', progress: 70 });

      // Validate the generated code
      const validationResult = this.validator.validateCode(result.code);
      
      console.log('🔍 Code validation result:', {
        isValid: validationResult.isValid,
        errors: validationResult.errors.length,
        warnings: validationResult.warnings.length,
        securityIssues: validationResult.securityIssues.length
      });

      // Enhance result with validation info
      const enhancedResult: LLMGenerationResult = {
        ...result,
        warnings: [
          ...(result.warnings || []),
          ...validationResult.warnings,
          ...validationResult.performanceWarnings
        ],
        suggestions: [
          ...(result.suggestions || []),
          ...validationResult.suggestions
        ]
      };

      // Add validation errors as warnings if code has issues
      if (!validationResult.isValid) {
        enhancedResult.warnings = [
          ...(enhancedResult.warnings || []),
          ...validationResult.errors.map(error => `Validation: ${error}`)
        ];
      }

      // Add security issues as warnings
      if (validationResult.securityIssues.length > 0) {
        enhancedResult.warnings = [
          ...(enhancedResult.warnings || []),
          ...validationResult.securityIssues.map(issue => `Security: ${issue.description}`)
        ];
      }

      onProgress?.({ stage: 'complete', message: 'Code generation completed!', progress: 100 });

      // Update the node with generated code
      this.updateNodeWithGeneratedCode(context, enhancedResult);

      return enhancedResult;

    } catch (error) {
      console.error('❌ Code generation failed:', error);
      
      // Mark provider as potentially invalid if it's an API error
      const provider = this.selectLLMProvider();
      if (provider && error instanceof Error && error.message.includes('API error')) {
        apiKeyManager.markAsInvalid(provider);
      }

      onProgress?.({ 
        stage: 'error', 
        message: error instanceof Error ? error.message : 'Generation failed', 
        progress: 0 
      });

      throw error;
    }
  }

  /**
   * Test connection to LLM provider
   */
  async testConnection(provider: LLMProvider): Promise<{ success: boolean; error?: string }> {
    try {
      const config = apiKeyManager.getConfig(provider);
      if (!config) {
        return { success: false, error: 'No configuration found' };
      }

      const llmProvider = LLMProviderFactory.createProvider(provider);
      return await llmProvider.testConnection(config);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection test failed' 
      };
    }
  }

  /**
   * Select the best available LLM provider
   */
  private selectLLMProvider(): LLMProvider | null {
    // Try to get the preferred provider first
    const preferred = apiKeyManager.getPreferredProvider();
    if (preferred && apiKeyManager.hasValidConfig(preferred)) {
      return preferred;
    }

    // Fall back to any configured provider
    const configured = apiKeyManager.getConfiguredProviders();
    return configured.length > 0 ? configured[0] : null;
  }

  /**
   * Build prompt request from generation context
   */
  private async buildPromptRequest(context: GenerationContext): Promise<PromptBuildRequest> {
    // Get template description from factory config
    const templateDescription = await this.getTemplateDescription(context.nodeType);
    
    // Extract data sections
    const templateData = context.formData.templateData || {};
    const instanceData = context.formData.instanceData || {};
    
    // Get input schema from DataSchemaManager
    const nodeSchema = dataSchemaManager.getSchema(context.nodeId);
    const inputSchema = nodeSchema?.inputSchema;
    const outputSchema = nodeSchema?.outputSchema;

    // TODO: Get source and target nodes from flow context
    // This would require access to the flow state
    const sourceNodes: Array<{ id: string; type: string; data: any }> = [];
    const targetNodes: Array<{ id: string; type: string; data: any }> = [];

    return {
      nodeType: context.nodeType,
      nodeId: context.nodeId,
      templateDescription,
      instanceData,
      templateData,
      inputSchema,
      outputSchema,
      sourceNodes,
      targetNodes
    };
  }

  /**
   * Get template description for a node type
   */
  private async getTemplateDescription(nodeType: string): Promise<string> {
    // This would ideally come from the factory configuration
    // For now, provide basic descriptions
    switch (nodeType) {
      case 'restnode':
        return 'Fetches data from REST API endpoints with configurable HTTP methods and authentication';
      case 'logicalnode':
        return 'Processes data with logical operations like filtering, transforming, aggregating, or conditional routing';
      case 'conditionalnode':
        return 'Evaluates conditions and routes data to different paths based on the result';
      case 'contentnode':
        return 'Displays and renders data in various formats for user interfaces';
      default:
        return `Processes data according to ${nodeType} specifications`;
    }
  }

  /**
   * Update node with generated code
   */
  private updateNodeWithGeneratedCode(
    context: GenerationContext, 
    result: LLMGenerationResult
  ): void {
    // Update the instanceCode field
    context.onFieldChange('instanceCode', result.code);
    
    // Update metadata
    context.onFieldChange('instanceCodeMetadata', {
      generatedBy: 'llm',
      provider: result.provider,
      model: result.model,
      generatedAt: new Date().toISOString(),
      confidence: result.confidence,
      tokensUsed: result.tokensUsed
    });

    // Call completion callback if provided
    context.onGenerationComplete?.(result);

    console.log('✅ Updated node with generated code:', {
      nodeId: context.nodeId,
      codeLength: result.code.length,
      provider: result.provider,
      confidence: result.confidence
    });
  }

  /**
   * Get available LLM providers with their status
   */
  getAvailableProviders(): Array<{
    provider: LLMProvider;
    name: string;
    configured: boolean;
    preferred: boolean;
  }> {
    const providers = LLMProviderFactory.getAllProviders();
    const configured = apiKeyManager.getConfiguredProviders();
    const preferred = apiKeyManager.getPreferredProvider();

    return Object.entries(providers).map(([provider, instance]) => ({
      provider: provider as LLMProvider,
      name: instance.getProviderInfo().name,
      configured: configured.includes(provider as LLMProvider),
      preferred: provider === preferred
    }));
  }
}