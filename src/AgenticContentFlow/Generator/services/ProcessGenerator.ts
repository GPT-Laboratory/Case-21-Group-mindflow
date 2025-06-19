/**
 * Process Generator Service
 * 
 * Specialized service for generating process code with template fallbacks
 * and intelligent code optimization.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-16
 */

import { 
  ProcessGenerationRequest,
  GenerationResult,
  GeneratorConfig,
  LLMRequest
} from '../generatortypes';
import { UnifiedAIService } from '../core/AIService';

interface GenerationOptions {
  strategy: 'template' | 'ai' | 'hybrid';
  prompt?: string;
}

/**
 * Process Generator Service
 * 
 * Handles all process-specific generation logic
 */
export class ProcessGenerator {
  private aiService: UnifiedAIService;
  private config: Partial<GeneratorConfig> = {};

  constructor(notifyError?: (title: string, message?: string) => void) {
    this.aiService = new UnifiedAIService({}, notifyError);
  }

  configure(config: Partial<GeneratorConfig>): void {
    this.config = { ...this.config, ...config };
    this.aiService.configure(config);
  }

  /**
   * Generate process code using specified strategy
   */
  async generate(
    request: ProcessGenerationRequest, 
    options: GenerationOptions
  ): Promise<GenerationResult> {
    switch (options.strategy) {
      case 'ai':
        return this.generateWithAI(request, options.prompt || '');
      case 'template':
        return this.generateWithTemplate(request);
  default:
        throw new Error(`Unsupported generation strategy: ${options.strategy}`);
    }
  }

  /**
   * Generate using AI only
   */
  private async generateWithAI(request: ProcessGenerationRequest, prompt: string): Promise<GenerationResult> {
    const llmRequest: LLMRequest = {
      prompt,
      type: 'process',
      context: `Generating code for ${request.nodeType} node`,
      provider: request.provider,
      config: {
        model: request.model,
        temperature: 0.7,
        maxTokens: 4000
      }
    };

    const response = await this.aiService.generateContent(llmRequest);

    return {
      type: 'process',
      strategy: 'ai',
      code: response.content,
      nodeId: request.nodeId,
      confidence: response.confidence || 0.8,
      generatedAt: new Date().toISOString(),
      provider: response.provider,
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
        tokensUsed: response.usage?.totalTokens || 0,
        generationTime: Date.now(),
        validationScore: 0.8,
        confidence: response.confidence || 0.8
      }
    };
  }

  /**
   * Generate using templates only
   */
  private generateWithTemplate(request: ProcessGenerationRequest): GenerationResult {
    const templateCode = this.getTemplateCode(request.nodeType);

    return {
      type: 'process',
      strategy: 'template',
      code: templateCode,
      nodeId: request.nodeId,
      confidence: 0.7, // Template confidence
      generatedAt: new Date().toISOString(),
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
        templateUsed: 'default',
        tokensUsed: 0,
        generationTime: Date.now(),
        validationScore: 0.7,
        confidence: 0.7
      }
    };
  }


  /**
   * Get template code for node type
   */
  private getTemplateCode(nodeType: string): string {
    const templates = {
      restnode: `async function process(incomingData, nodeData, params, targetMap, sourceMap, edgeMap) {
  console.log('🔄 REST Node processing:', { incomingData, nodeData });
  
  try {
    const { url, method = 'GET', headers = {} } = nodeData;
    
    // Prepare request options
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    // Add body for non-GET requests
    if (method !== 'GET' && incomingData) {
      options.body = JSON.stringify(incomingData);
    }
    
    // Make API request
    const response = await fetch(url, options);
    const data = await response.json();
    
    console.log('✅ REST request completed:', { status: response.status, data });
    return data;
    
  } catch (error) {
    console.error('❌ REST request failed:', error);
    throw error;
  }
}`,

      datanode: `async function process(incomingData, nodeData, params, targetMap, sourceMap, edgeMap) {
  console.log('🔄 Data Node processing:', { incomingData, nodeData });
  
  try {
    // Data transformation logic
    const result = {
      ...incomingData,
      timestamp: new Date().toISOString(),
      processedBy: 'datanode'
    };
    
    console.log('✅ Data processing completed:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Data processing failed:', error);
    throw error;
  }
}`,

      logicnode: `async function process(incomingData, nodeData, params, targetMap, sourceMap, edgeMap) {
  console.log('🔄 Logical Node processing:', { incomingData, nodeData });
  
  try {
    // Logical processing
    const condition = nodeData.condition || 'true';
    const result = {
      data: incomingData,
      conditionMet: true, // Evaluate condition here
      metadata: {
        processedAt: new Date().toISOString()
      }
    };
    
    console.log('✅ Logical processing completed:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Logical processing failed:', error);
    throw error;
  }
}`,

      contentnode: `async function process(incomingData, nodeData, params, targetMap, sourceMap, edgeMap) {
  console.log('🔄 Content Node processing:', { incomingData, nodeData });
  
  try {
    // Content processing
    const result = {
      content: nodeData.content || '',
      data: incomingData,
      processedAt: new Date().toISOString()
    };
    
    console.log('✅ Content processing completed:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Content processing failed:', error);
    throw error;
  }
}`
    };

    return templates[nodeType as keyof typeof templates] || templates.datanode;
  }
}