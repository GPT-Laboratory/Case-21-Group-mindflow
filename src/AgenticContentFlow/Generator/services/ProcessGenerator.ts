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
  LLMRequest,
  LLMProvider
} from '../generatortypes';
import { UnifiedAIService } from '../core/AIService';
import { ProcessPromptBuilder } from '../core/prompts/ProcessPromptBuilder';

interface GenerationOptions {
  strategy: 'template' | 'ai';
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
  private promptBuilder: ProcessPromptBuilder;

  constructor(notifyError?: (title: string, message?: string) => void) {
    this.aiService = new UnifiedAIService({}, notifyError);
    this.promptBuilder = new ProcessPromptBuilder();
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
    console.log('🤖 [ProcessGenerator] Starting AI generation for node:', {
      nodeId: request.nodeId,
      nodeType: request.nodeType,
      provider: request.provider,
      model: request.model
    });
    
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

    console.log('📤 [ProcessGenerator] Sending LLM request:', {
      promptLength: prompt.length,
      provider: llmRequest.provider,
      model: llmRequest.config?.model
    });

    // Log the exact prompt being sent to the AI
    console.log('📝 [ProcessGenerator] Full prompt sent to AI:', prompt);

    const response = await this.aiService.generateContent(llmRequest);

    console.log('📥 [ProcessGenerator] Received AI response:', {
      contentLength: response.content.length,
      provider: response.provider,
      model: response.model,
      confidence: response.confidence,
      contentPreview: response.content.substring(0, 200) + '...'
    });

    // Parse the AI response to extract both code and node data
    const { code, updatedNodeData } = this.parseAIResponse(response.content);

    return {
      type: 'process',
      strategy: 'ai',
      code: code,
      nodeId: request.nodeId,
      confidence: response.confidence || 0.8,
      generatedAt: new Date().toISOString(),
      provider: response.provider,
      updatedNodeData: updatedNodeData, // Include the updated node data
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

  private parseAIResponse(content: string): { code: string; updatedNodeData: any } {
    try {
      console.log('🔍 [ProcessGenerator] Parsing AI response:', {
        contentLength: content.length,
        contentPreview: content.substring(0, 300) + '...',
        fullContent: content // Log the full content for debugging
      });

      // Try to find JSON data at the end of the response
      let code = content;
      let updatedNodeData = {};
      
      // Simple approach: look for JSON object at the very end
      const lines = content.split('\n');
      const lastLine = lines[lines.length - 1].trim();
      
      // Check if the last line starts with a JSON object
      if (lastLine.startsWith('{') && lastLine.endsWith('}')) {
        try {
          updatedNodeData = JSON.parse(lastLine);
          // Remove the last line from the code
          code = lines.slice(0, -1).join('\n').trim();
          console.log('📋 [ProcessGenerator] Extracted JSON from last line:', updatedNodeData);
        } catch (parseError) {
          console.warn('⚠️ [ProcessGenerator] Failed to parse JSON from last line:', parseError);
        }
      } else {
        // Try to find JSON object in the last few lines
        const lastFewLines = lines.slice(-5).join('\n');
        const jsonMatch = lastFewLines.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          try {
            updatedNodeData = JSON.parse(jsonMatch[0]);
            // Remove the JSON part from the code
            const jsonStartIndex = content.lastIndexOf('{');
            code = content.substring(0, jsonStartIndex).trim();
            console.log('📋 [ProcessGenerator] Extracted JSON from last few lines:', updatedNodeData);
          } catch (parseError) {
            console.warn('⚠️ [ProcessGenerator] Failed to parse JSON from last few lines:', parseError);
            console.log('🔍 [ProcessGenerator] JSON string that failed to parse:', jsonMatch[0]);
          }
        }
      }
      
      // If still no JSON found, try a more aggressive approach
      if (!updatedNodeData || Object.keys(updatedNodeData).length === 0) {
        // Look for JSON object anywhere in the content after the function
        const functionEndIndex = content.lastIndexOf('}');
        if (functionEndIndex !== -1) {
          const afterFunction = content.substring(functionEndIndex + 1);
          const jsonMatch = afterFunction.match(/\s*\{[\s\S]*\}/);
          
          if (jsonMatch) {
            try {
              updatedNodeData = JSON.parse(jsonMatch[0].trim());
              // Remove the JSON part from the code
              const jsonStartIndex = content.lastIndexOf('{');
              code = content.substring(0, jsonStartIndex).trim();
              console.log('📋 [ProcessGenerator] Extracted JSON after function:', updatedNodeData);
            } catch (parseError) {
              console.warn('⚠️ [ProcessGenerator] Failed to parse JSON after function:', parseError);
              console.log('🔍 [ProcessGenerator] JSON string that failed to parse:', jsonMatch[0]);
            }
          }
        }
      }
      
      // If no code blocks found, treat the entire content as code (fallback)
      if (!code && content.trim()) {
        code = content.trim();
        console.log('🔄 [ProcessGenerator] No code blocks found, using entire content as code');
      }
      
      // If no JSON found, return empty object
      if (!updatedNodeData || Object.keys(updatedNodeData).length === 0) {
        console.log('ℹ️ [ProcessGenerator] No JSON node data found in response');
        updatedNodeData = {};
      }
      
      return { code, updatedNodeData };
      
    } catch (error) {
      console.error('❌ [ProcessGenerator] Error parsing AI response:', error);
      // Fallback: return the entire content as code
      return { code: content.trim(), updatedNodeData: {} };
    }
  }

  async generateProcessCode(
    nodeId: string,
    nodeType: string,
    templateData: any,
    userRequest: string,
    currentCode?: string,
    provider?: string,
    model?: string
  ): Promise<{ code: string; updatedNodeData?: any }> {
    try {
      console.log('ProcessGenerator: Starting generation for node', nodeId);
      console.log('ProcessGenerator: Node type:', nodeType);
      console.log('ProcessGenerator: User request:', userRequest);
      console.log('ProcessGenerator: Current code:', currentCode);
      console.log('ProcessGenerator: Provider:', provider);
      console.log('ProcessGenerator: Model:', model);

      // Step 1: Generate the updated process function
      const promptRequest = {
        nodeId,
        nodeType,
        templateDescription: templateData?.description || 'Process node',
        instanceData: templateData?.instanceData || {},
        templateData: templateData?.templateData || {},
        inputSchema: templateData?.inputSchema,
        outputSchema: templateData?.outputSchema,
        sourceNodes: [],
        targetNodes: []
      };

      const functionPrompt = this.promptBuilder.buildPrompt(promptRequest);
      console.log('ProcessGenerator: Generated function prompt:', functionPrompt);

      const llmRequest: LLMRequest = {
        prompt: functionPrompt,
        type: 'process',
        context: `Generating code for ${nodeType} node`,
        provider: (provider || 'openai') as LLMProvider,
        config: {
          model: model || 'gpt-4',
          temperature: 0.7,
          maxTokens: 4000
        }
      };

      const functionResponse = await this.aiService.generateContent(llmRequest);
      console.log('ProcessGenerator: AI function response:', functionResponse);

      if (!functionResponse || !functionResponse.content) {
        throw new Error('No response from AI service for function generation');
      }

      // Extract just the function code
      const functionCode = this.extractFunctionCode(functionResponse.content);
      console.log('ProcessGenerator: Extracted function code:', functionCode);

      if (!functionCode) {
        throw new Error('Could not extract function code from AI response');
      }

      // Step 2: Generate updated node data by asking for specific fields
      const updatedNodeData = await this.generateUpdatedNodeData(nodeType, userRequest, templateData, provider, model);

      return {
        code: functionCode,
        updatedNodeData
      };
    } catch (error) {
      console.error('ProcessGenerator: Error generating process code:', error);
      throw error;
    }
  }

  private extractFunctionCode(response: string): string {
    // Look for code blocks
    const codeBlockMatch = response.match(/```(?:javascript|js)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // If no code block, assume the entire response is the function
    return response.trim();
  }

  private async generateUpdatedNodeData(nodeType: string, userRequest: string, templateData: any, provider?: string, model?: string): Promise<any> {
    try {
      const updatedNodeData: any = {};

      // Ask for label update - make it very specific
      const labelPrompt = `Based on this user request: "${userRequest}"

For a ${nodeType} node, what should the SHORT LABEL be? This should be a brief, descriptive name (2-4 words max).

Current label: ${templateData?.instanceData?.label || 'Unknown'}

Return ONLY the short label, nothing else.`;

      const labelRequest: LLMRequest = {
        prompt: labelPrompt,
        type: 'process',
        context: `Generating short label for ${nodeType} node`,
        provider: (provider || 'openai') as LLMProvider,
        config: {
          model: model || 'gpt-4',
          temperature: 0.7,
          maxTokens: 50
        }
      };

      const labelResponse = await this.aiService.generateContent(labelRequest);
      if (labelResponse && labelResponse.content) {
        updatedNodeData.instanceData = {
          ...updatedNodeData.instanceData,
          label: labelResponse.content.trim()
        };
      }

      // Ask for details update - make it different and more descriptive
      const detailsPrompt = `Based on this user request: "${userRequest}"

For a ${nodeType} node, what should the DETAILED DESCRIPTION be? This should be a longer explanation of what the node does (1-2 sentences).

Current details: ${templateData?.instanceData?.details || 'No description'}

Return ONLY the detailed description, nothing else.`;

      const detailsRequest: LLMRequest = {
        prompt: detailsPrompt,
        type: 'process',
        context: `Generating detailed description for ${nodeType} node`,
        provider: (provider || 'openai') as LLMProvider,
        config: {
          model: model || 'gpt-4',
          temperature: 0.7,
          maxTokens: 150
        }
      };

      const detailsResponse = await this.aiService.generateContent(detailsRequest);
      if (detailsResponse && detailsResponse.content) {
        updatedNodeData.instanceData = {
          ...updatedNodeData.instanceData,
          details: detailsResponse.content.trim()
        };
      }

      // Ask for URL update if this is an API node
      if (nodeType === 'api' || templateData?.templateData?.url) {
        const urlPrompt = `Based on this user request: "${userRequest}"

For a ${nodeType} node, what should the API URL be? Return ONLY the complete URL, nothing else.

Current URL: ${templateData?.templateData?.url || 'No URL'}`;

        const urlRequest: LLMRequest = {
          prompt: urlPrompt,
          type: 'process',
          context: `Generating URL for ${nodeType} node`,
          provider: (provider || 'openai') as LLMProvider,
          config: {
            model: model || 'gpt-4',
            temperature: 0.7,
            maxTokens: 200
          }
        };

        const urlResponse = await this.aiService.generateContent(urlRequest);
        if (urlResponse && urlResponse.content) {
          updatedNodeData.templateData = {
            ...updatedNodeData.templateData,
            url: urlResponse.content.trim()
          };
        }
      }

      console.log('ProcessGenerator: Generated updated node data:', updatedNodeData);
      return updatedNodeData;
    } catch (error) {
      console.error('ProcessGenerator: Error generating node data:', error);
      return {};
    }
  }
}