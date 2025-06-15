import { 
  ProcessDescriptor, 
  GenerationRequest, 
  GenerationResult 
} from './types';
import { AIProvider } from './ai';
import { ProcessCodeValidator } from './validation';
import { TemplateRegistry } from './templates';

export interface ProcessGeneratorOptions {
  aiProvider?: AIProvider;
  templateRegistry?: TemplateRegistry;
  validator?: ProcessCodeValidator;
}

/**
 * ProcessGenerator
 * 
 * Core engine for generating JavaScript process functions from structured
 * descriptions. Now uses modular components for templates, validation, and AI.
 */
export class ProcessGenerator {
  private templateRegistry: TemplateRegistry;
  private validator: ProcessCodeValidator;
  private aiProvider?: AIProvider;
  
  constructor(options?: ProcessGeneratorOptions) {
    this.templateRegistry = options?.templateRegistry || new TemplateRegistry();
    this.validator = options?.validator || new ProcessCodeValidator();
    this.aiProvider = options?.aiProvider;
  }
  
  /**
   * Generate process code from a structured description
   */
  async generateProcess(request: GenerationRequest): Promise<GenerationResult> {
    console.log('🎯 Generating process for:', request.nodeConfig.nodeType);
    
    try {
      const strategy = this.selectGenerationStrategy(request);
      
      let result: GenerationResult;
      
      switch (strategy) {
        case 'template':
          result = await this.generateFromTemplate(request);
          break;
        case 'ai':
          result = await this.generateFromAI(request);
          break;
        case 'hybrid':
          result = await this.generateHybrid(request);
          break;
        default:
          throw new Error(`Unknown generation strategy: ${strategy}`);
      }
      
      // Validate the generated code
      result = await this.validateGeneration(result);
      
      console.log('✅ Process generation completed:', {
        confidence: result.metadata.confidence,
        strategy: result.metadata.generatedBy
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Process generation failed:', error);
      throw new Error(`Process generation failed: ${error}`);
    }
  }
  
  /**
   * Generate a process descriptor from factory config and instance data
   */
  generateDescriptor(
    nodeConfig: any, 
    instanceData: Record<string, any>
  ): ProcessDescriptor {
    const nodeType = nodeConfig.nodeType;
    
    return {
      id: `${nodeType}-${Date.now()}`,
      description: nodeConfig.description || `Process for ${nodeType}`,
      steps: this.extractGenericSteps(nodeConfig, instanceData),
      expectedInput: {
        description: 'Data from upstream nodes or trigger signals',
        schema: instanceData.inputSchema,
        examples: instanceData.inputExamples
      },
      expectedOutput: {
        description: 'Processed data ready for downstream nodes',
        schema: instanceData.outputSchema,
        examples: instanceData.outputExamples
      },
      errorHandling: {
        required: true,
        fallbackBehavior: 'Return error object with details',
        retryLogic: nodeConfig.process?.constraints?.maxRetries ? 
          `Retry up to ${nodeConfig.process.constraints.maxRetries} times` : undefined
      },
      performance: {
        maxExecutionTime: nodeConfig.process?.constraints?.timeout || 30000
      },
      dependencies: this.extractGenericDependencies(nodeConfig, instanceData)
    };
  }
  
  private selectGenerationStrategy(request: GenerationRequest): 'template' | 'ai' | 'hybrid' {
    const { nodeConfig } = request;
    
    // If we have a template for this node type, prefer template
    if (this.templateRegistry.hasTemplate(nodeConfig.nodeType)) {
      return 'template';
    }
    
    // If AI provider is available and request is complex, use AI
    if (this.aiProvider && this.isComplexRequest(request)) {
      return 'ai';
    }
    
    // For simple requests, use hybrid approach
    return 'hybrid';
  }
  
  private async generateFromTemplate(request: GenerationRequest): Promise<GenerationResult> {
    const template = this.templateRegistry.getTemplate(request.nodeConfig.nodeType);
    if (!template) {
      throw new Error(`No template found for node type: ${request.nodeConfig.nodeType}`);
    }
    
    const code = template.generate(request);
    
    return {
      code,
      metadata: {
        generatedBy: 'template',
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        sourceDescriptorId: request.descriptor.id,
        confidence: 0.9
      },
      validation: {
        syntaxValid: true,
        securityChecks: true,
        performanceWarnings: [],
        suggestions: []
      },
      explanation: {
        summary: `Generated from ${request.nodeConfig.nodeType} template`,
        keyFeatures: template.getFeatures(),
        implementationNotes: template.getImplementationNotes(),
        usageInstructions: template.getUsageInstructions()
      }
    };
  }
  
  private async generateFromAI(request: GenerationRequest): Promise<GenerationResult> {
    if (!this.aiProvider) {
      throw new Error('AI provider not configured');
    }
    
    const prompt = this.createAIPrompt(request);
    const aiResult = await this.aiProvider.generateCode(prompt);
    
    return {
      code: aiResult.code,
      metadata: {
        generatedBy: 'ai',
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        sourceDescriptorId: request.descriptor.id,
        confidence: aiResult.confidence || 0.7
      },
      validation: {
        syntaxValid: aiResult.syntaxValid || false,
        securityChecks: aiResult.securityChecks || false,
        performanceWarnings: aiResult.warnings || [],
        suggestions: aiResult.suggestions || []
      },
      explanation: {
        summary: aiResult.explanation || 'AI-generated process function',
        keyFeatures: aiResult.features || [],
        implementationNotes: aiResult.notes || [],
        usageInstructions: aiResult.instructions || []
      }
    };
  }
  
  private async generateHybrid(request: GenerationRequest): Promise<GenerationResult> {
    // Use generic template as base
    const baseTemplate = this.templateRegistry.getGenericTemplate();
    let code = baseTemplate.generate(request);
    
    if (this.aiProvider) {
      const enhancementPrompt = this.createEnhancementPrompt(request, code);
      const enhancement = await this.aiProvider.enhanceCode(enhancementPrompt);
      code = enhancement.code || code;
    }
    
    return {
      code,
      metadata: {
        generatedBy: 'hybrid',
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        sourceDescriptorId: request.descriptor.id,
        confidence: 0.8
      },
      validation: {
        syntaxValid: true,
        securityChecks: true,
        performanceWarnings: [],
        suggestions: []
      },
      explanation: {
        summary: 'Generated using hybrid template + AI approach',
        keyFeatures: baseTemplate.getFeatures(),
        implementationNotes: ['Template-based foundation', 'AI-enhanced implementation'],
        usageInstructions: baseTemplate.getUsageInstructions()
      }
    };
  }
  
  private async validateGeneration(result: GenerationResult): Promise<GenerationResult> {
    const validationResult = this.validator.validateCode(result.code);
    
    result.validation = {
      syntaxValid: validationResult.isValid,
      securityChecks: validationResult.securityIssues.length === 0,
      performanceWarnings: validationResult.performanceWarnings,
      suggestions: [
        ...validationResult.suggestions,
        ...validationResult.securityIssues.map(issue => issue.suggestion || issue.description)
      ]
    };
    
    return result;
  }
  
  // Helper methods for descriptor generation
  private createAIPrompt(request: GenerationRequest): string {
    const { descriptor, nodeConfig, instanceData } = request;
    
    return `
Generate a JavaScript async function for a ${nodeConfig.nodeType} node with the following requirements:

**Node Description**: ${descriptor.description}

**Function Signature**: async function process(incomingData, nodeData, params, targetMap, sourceMap, edgeMap)

**Process Steps**:
${descriptor.steps.map(step => `- ${step.description}: ${step.implementation}`).join('\n')}

**Input**: ${descriptor.expectedInput.description}
**Output**: ${descriptor.expectedOutput.description}

**Node Configuration**:
${JSON.stringify(instanceData, null, 2)}

**Requirements**:
- Handle errors gracefully
- Include logging statements
- Follow async/await patterns
- Return data in the expected format
- Add comments explaining key logic

Generate only the function code, properly formatted and ready to execute.
    `.trim();
  }
  
  private createEnhancementPrompt(request: GenerationRequest, baseCode: string): string {
    return `
Enhance this template-generated code for a ${request.nodeConfig.nodeType} node:

\`\`\`javascript
${baseCode}
\`\`\`

Instance-specific requirements:
${JSON.stringify(request.instanceData, null, 2)}

Enhance the code to:
1. Include instance-specific logic
2. Add better error handling
3. Optimize for the specific use case
4. Add detailed logging

Return only the enhanced function code.
    `.trim();
  }
  
  private extractGenericSteps(nodeConfig: any, instanceData: Record<string, any>): any[] {
    // Extract steps based on both node configuration and instance data
    const steps = [];
    
    // Base processing step - always present
    steps.push({
      id: 'process-data',
      description: `Process data according to ${nodeConfig.nodeType} configuration`,
      implementation: 'Apply node-specific logic to transform data',
      inputs: ['incomingData', 'nodeData', 'params'],
      outputs: ['processed result']
    });
    
    // Add validation step if schema is provided
    if (instanceData.inputSchema || instanceData.outputSchema) {
      steps.push({
        id: 'validate-data',
        description: 'Validate input/output data against schemas',
        implementation: 'Check data structure and types',
        inputs: ['data', 'schema'],
        outputs: ['validation result']
      });
    }
    
    // Add transformation step if transform config exists
    if (instanceData.transform || instanceData.transformConfig) {
      steps.push({
        id: 'transform-data', 
        description: 'Transform data based on configuration',
        implementation: 'Apply configured data transformations',
        inputs: ['data', 'transformConfig'],
        outputs: ['transformed data']
      });
    }
    
    // Add authentication step for API nodes with auth
    if ((nodeConfig.nodeType === 'restnode' || nodeConfig.category === 'integration') && 
        instanceData.authentication && instanceData.authentication !== 'none') {
      steps.push({
        id: 'authenticate',
        description: 'Handle authentication for API requests',
        implementation: 'Apply authentication headers/tokens',
        inputs: ['credentials', 'authConfig'],
        outputs: ['authenticated request']
      });
    }
    
    return steps;
  }
  
  private extractGenericDependencies(nodeConfig: any, instanceData: Record<string, any>) {
    const deps: any = {};
    
    // Extract dependencies from instance data if present
    if (instanceData.dependencies) {
      deps.external = instanceData.dependencies;
    }
    
    // Extract any URLs that might indicate external dependencies
    if (instanceData.url) {
      deps.externalAPIs = [instanceData.url];
    }
    
    // Add node-type specific dependencies
    if (nodeConfig.nodeType === 'restnode' || nodeConfig.category === 'integration') {
      deps.runtime = deps.runtime || [];
      deps.runtime.push('fetch API');
      
      if (instanceData.authentication && instanceData.authentication !== 'none') {
        deps.runtime.push('authentication library');
      }
    }
    
    if (nodeConfig.nodeType === 'logicalnode' || nodeConfig.category === 'logic') {
      deps.runtime = deps.runtime || [];
      if (instanceData.operation === 'filter' || instanceData.logicRules) {
        deps.runtime.push('array processing');
      }
      if (instanceData.condition || instanceData.rules) {
        deps.runtime.push('expression evaluation');
      }
    }
    
    if (nodeConfig.nodeType === 'contentnode' || nodeConfig.category === 'view') {
      deps.runtime = deps.runtime || [];
      deps.runtime.push('data formatting');
      
      if (instanceData.displayType === 'table') {
        deps.runtime.push('table rendering');
      } else if (instanceData.displayType === 'chart') {
        deps.runtime.push('chart library');
      }
    }
    
    // Add constraints-based dependencies
    if (nodeConfig.process?.constraints?.timeout) {
      deps.features = deps.features || [];
      deps.features.push('timeout handling');
    }
    
    if (nodeConfig.process?.constraints?.maxRetries && nodeConfig.process.constraints.maxRetries > 0) {
      deps.features = deps.features || [];
      deps.features.push('retry logic');
    }
    
    return deps;
  }
  
  private isComplexRequest(request: GenerationRequest): boolean {
    const { descriptor, instanceData } = request;
    
    return descriptor.steps.length > 3 || 
           Object.keys(instanceData).length > 10 ||
           (descriptor.dependencies?.externalAPIs?.length || 0) > 0;
  }
}