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

interface StatusCallback {
  (nodeId: string, status: 'generating_function' | 'generating_label' | 'generating_details' | 'generating_url' | 'generating_condition' | 'generating_content' | 'generating_transformation' | 'generating_config' | 'completed' | 'error', message: string, error?: string): void;
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
    model?: string,
    statusCallback?: StatusCallback
  ): Promise<{ code: string; updatedNodeData?: any }> {
    try {
      console.log('ProcessGenerator: Starting generation for node', nodeId);
      console.log('ProcessGenerator: Node type:', nodeType);
      console.log('ProcessGenerator: User request:', userRequest);
      console.log('ProcessGenerator: Current code:', currentCode);
      console.log('ProcessGenerator: Provider:', provider);
      console.log('ProcessGenerator: Model:', model);

      // Step 1: Generate the updated process function
      statusCallback?.(nodeId, 'generating_function', 'Generating function code...');
      
      const promptRequest = {
        nodeId,
        nodeType,
        templateDescription: templateData?.description || 'Process node',
        instanceData: {
          ...templateData?.instanceData,
          userRequest: userRequest
        },
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
      const updatedNodeData = await this.generateUpdatedNodeData(
        nodeId,
        nodeType, 
        userRequest, 
        templateData, 
        functionCode, 
        provider, 
        model,
        statusCallback
      );

      // Generate node-specific configuration updates based on node type
      await this.generateNodeSpecificUpdates(
        nodeId,
        nodeType,
        userRequest,
        templateData,
        updatedNodeData,
        provider,
        model,
        statusCallback
      );

      console.log('ProcessGenerator: Generated updated node data:', updatedNodeData);
      
      // Debug: Log what was preserved vs updated
      console.log('ProcessGenerator: Data preservation check:', {
        originalInstanceData: Object.keys(templateData?.instanceData || {}),
        originalTemplateData: Object.keys(templateData?.templateData || {}),
        updatedInstanceData: Object.keys(updatedNodeData.instanceData || {}),
        updatedTemplateData: Object.keys(updatedNodeData.templateData || {}),
        preservedTemplateKeys: Object.keys(templateData?.templateData || {}).filter(key => 
          updatedNodeData.templateData && updatedNodeData.templateData[key] !== undefined
        )
      });
      
      // Additional debugging to show the actual values
      console.log('🔍 [ProcessGenerator] Final updatedNodeData:', {
        instanceData: updatedNodeData.instanceData,
        templateData: updatedNodeData.templateData,
        originalTemplateData: templateData?.templateData
      });
      
      return {
        code: functionCode,
        updatedNodeData
      };
    } catch (error) {
      console.error('ProcessGenerator: Error generating process code:', error);
      statusCallback?.(nodeId, 'error', 'Generation failed', error instanceof Error ? error.message : 'Unknown error');
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

  private async generateUpdatedNodeData(
    nodeId: string,
    nodeType: string, 
    userRequest: string, 
    templateData: any, 
    functionCode: string, 
    provider?: string, 
    model?: string,
    statusCallback?: StatusCallback
  ): Promise<any> {
    try {
      // Initialize with existing data to preserve configuration
      const updatedNodeData: any = {
        instanceData: { ...templateData?.instanceData },
        templateData: { ...templateData?.templateData }
      };

      // Ask for label update - make it very specific
      statusCallback?.(nodeId, 'generating_label', 'Generating node label...');
      
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

      // Ask for details update - generate based on what the function actually does
      statusCallback?.(nodeId, 'generating_details', 'Generating node description...');
      
      const functionDetailsPrompt = `Based on this function code:

${functionCode}

Write a brief, user-friendly description for what this function does. The description should:
- Be simple and easy to understand
- Explain the main purpose in plain language
- Be 1 sentence maximum
- Focus on what the user will see, not technical implementation

Examples of good descriptions:
- "Fetch posts from JSONPlaceholder API"
- "Get user data from external service"
- "Filter data based on conditions"

Return ONLY the brief description, nothing else.`;

      const functionDetailsRequest: LLMRequest = {
        prompt: functionDetailsPrompt,
        type: 'process',
        context: `Generating detailed description for ${nodeType} node`,
        provider: (provider || 'openai') as LLMProvider,
        config: {
          model: model || 'gpt-4',
          temperature: 0.7,
          maxTokens: 150
        }
      };

      const functionDetailsResponse = await this.aiService.generateContent(functionDetailsRequest);
      if (functionDetailsResponse && functionDetailsResponse.content) {
        updatedNodeData.instanceData = {
          ...updatedNodeData.instanceData,
          details: functionDetailsResponse.content.trim()
        };
      }

      console.log('ProcessGenerator: Generated updated node data:', updatedNodeData);
      
      // Debug: Log what was preserved vs updated
      console.log('ProcessGenerator: Data preservation check:', {
        originalInstanceData: Object.keys(templateData?.instanceData || {}),
        originalTemplateData: Object.keys(templateData?.templateData || {}),
        updatedInstanceData: Object.keys(updatedNodeData.instanceData || {}),
        updatedTemplateData: Object.keys(updatedNodeData.templateData || {}),
        preservedTemplateKeys: Object.keys(templateData?.templateData || {}).filter(key => 
          updatedNodeData.templateData && updatedNodeData.templateData[key] !== undefined
        )
      });
      
      return updatedNodeData;
    } catch (error) {
      console.error('ProcessGenerator: Error generating node data:', error);
      return {};
    }
  }

  private async generateNodeSpecificUpdates(
    nodeId: string,
    nodeType: string,
    userRequest: string,
    templateData: any,
    updatedNodeData: any,
    provider?: string,
    model?: string,
    statusCallback?: StatusCallback
  ): Promise<void> {
    // Get the current template data keys that could be updated
    const currentTemplateKeys = Object.keys(templateData?.templateData || {});
    
    console.log(`🔧 [ProcessGenerator] generateNodeSpecificUpdates called:`, {
      nodeId,
      nodeType,
      userRequest,
      currentTemplateKeys,
      hasTemplateData: !!templateData?.templateData,
      templateDataKeys: currentTemplateKeys
    });
    
    if (currentTemplateKeys.length === 0) {
      // No template data to update
      console.log(`⚠️ [ProcessGenerator] No template data keys found for node ${nodeId}`);
      return;
    }

    // Generate updates for each template data key
    for (const key of currentTemplateKeys) {
      console.log(`🔄 [ProcessGenerator] Processing key: ${key}`);
      await this.generateKeyValueUpdate(
        nodeId,
        nodeType,
        userRequest,
        key,
        templateData?.templateData[key],
        updatedNodeData,
        provider,
        model,
        statusCallback
      );
    }
    
    console.log(`✅ [ProcessGenerator] generateNodeSpecificUpdates completed for node ${nodeId}`);
  }

  private async generateKeyValueUpdate(
    nodeId: string,
    nodeType: string,
    userRequest: string,
    key: string,
    currentValue: any,
    updatedNodeData: any,
    provider?: string,
    model?: string,
    statusCallback?: StatusCallback
  ): Promise<void> {
    statusCallback?.(nodeId, 'generating_config', `Generating ${key}...`);
    
    // Create a generic prompt that works for any key
    const keyValuePrompt = `You are updating the "${key}" field for a ${nodeType} node.

User request: "${userRequest}"

Current ${key}: ${currentValue || 'No value'}

IMPORTANT: You must generate a value appropriate for the "${key}" field type.

Field-specific requirements:
- "url": Must be a complete HTTP/HTTPS URL (e.g., https://api.example.com/endpoint)
- "method": Must be GET, POST, PUT, DELETE, or PATCH
- "headers": Must be valid JSON object (e.g., {"Content-Type": "application/json"})
- "authentication": Must be none, basic, bearer, oauth, or api-key
- "condition": Must be a JavaScript expression (e.g., data.active === true)
- "content": Must be the content value (e.g., "Hello World")
- "body": Must be JSON data or string (e.g., {"name": "John"})

CRITICAL: Do NOT return a label or description. Return ONLY the value for the "${key}" field.

Return ONLY the value, nothing else.`;

    const keyValueRequest: LLMRequest = {
      prompt: keyValuePrompt,
      type: 'process',
      context: `Generating ${key} for ${nodeType} node`,
      provider: (provider || 'openai') as LLMProvider,
      config: {
        model: model || 'gpt-4',
        temperature: 0.7,
        maxTokens: 200
      }
    };

    const keyValueResponse = await this.aiService.generateContent(keyValueRequest);
    if (keyValueResponse && keyValueResponse.content) {
      const newValue = keyValueResponse.content.trim();
      
      console.log(`🔧 [ProcessGenerator] Key-value update attempt:`, {
        key,
        currentValue,
        newValue,
        isValid: this.isValidValueForKey(key, newValue)
      });
      
      // Validate the response based on key type
      if (this.isValidValueForKey(key, newValue)) {
        updatedNodeData.templateData = {
          ...updatedNodeData.templateData,
          [key]: newValue
        };
        console.log(`✅ [ProcessGenerator] Updated ${key} to:`, newValue);
      } else {
        console.log(`❌ [ProcessGenerator] Invalid value for ${key}:`, newValue);
      }
    }
  }

  private isValidValueForKey(key: string, value: string): boolean {
    // Add validation logic for different key types
    switch (key.toLowerCase()) {
      case 'url':
        return value.startsWith('http') && value.includes('://');
      case 'method':
        return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(value.toUpperCase());
      case 'condition':
        // Basic validation for JavaScript expressions
        return value.length > 0 && !value.includes('"') && !value.includes("'");
      case 'content':
        return value.length > 0;
      case 'headers':
        // Try to parse as JSON
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      case 'authentication':
        // Authentication should be specific values, not labels
        const validAuth = ['none', 'basic', 'bearer', 'oauth', 'api-key'];
        return validAuth.includes(value.toLowerCase()) || value === 'none';
      case 'body':
        // Try to parse as JSON if it looks like JSON
        if (value.startsWith('{') || value.startsWith('[')) {
          try {
            JSON.parse(value);
            return true;
          } catch {
            return false;
          }
        }
        return value.length > 0;
      default:
        // For unknown keys, accept any non-empty value that doesn't look like a label
        // Reject values that look like labels (title case with spaces)
        const looksLikeLabel = /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(value);
        return value.length > 0 && !looksLikeLabel;
    }
  }
}