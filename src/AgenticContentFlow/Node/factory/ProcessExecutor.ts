/** @format */

import { NodeFactoryJSON, NodeInstanceData, ProcessParameter, ValidationResult } from './types';

/**
 * ProcessExecutor handles execution of stored process functions with parameter management
 */
export class ProcessExecutor {
  constructor(private validator: CodeValidator) {}
  
  async executeProcess(
    config: NodeFactoryJSON,
    nodeData: NodeInstanceData,
    incomingData: any
  ): Promise<any> {
    console.log(`🔍 ProcessExecutor.executeProcess called for ${config.nodeType}:`, {
      nodeData,
      incomingData,
      hasCode: !!config.process.code
    });
    
    // Get the process code (either from config or instance override)
    const processCode = nodeData.processOverrides?.customCode || config.process.code;
    
    console.log(`📜 Process code for ${config.nodeType}:`, processCode ? 'Found' : 'Missing');
    
    // Merge parameters (config defaults + instance overrides)
    const parameters = this.mergeParameters(config, nodeData);
    
    console.log(`⚙️ Merged parameters for ${config.nodeType}:`, parameters);
    
    // Validate parameters
    this.validateParameters(config.process.parameters, parameters);
    
    // Execute based on context
    if (config.process.metadata.executionContext === 'frontend') {
      return await this.executeFrontend(processCode, incomingData, nodeData, parameters);
    } else {
      return await this.executeBackend(processCode, incomingData, nodeData, parameters);
    }
  }
  
  private mergeParameters(config: NodeFactoryJSON, nodeData: NodeInstanceData): Record<string, any> {
    // Start with template defaults
    const merged = { ...config.template.defaultParameters };
    
    // Apply instance-specific overrides
    if (nodeData.processOverrides?.parameters) {
      Object.assign(merged, nodeData.processOverrides.parameters);
    }
    
    return merged;
  }
  
  private validateParameters(
    parameterSchema: Record<string, ProcessParameter>,
    actualParameters: Record<string, any>
  ): void {
    for (const [key, schema] of Object.entries(parameterSchema)) {
      const value = actualParameters[key];
      
      // Check required parameters
      if (schema.required && (value === undefined || value === null)) {
        throw new Error(`Required parameter '${key}' is missing`);
      }
      
      // Type validation
      if (value !== undefined && typeof value !== schema.type) {
        throw new Error(`Parameter '${key}' must be of type ${schema.type}`);
      }
      
      // Custom validation
      if (schema.validation && value !== undefined) {
        this.validateParameterValue(key, value, schema.validation);
      }
    }
  }
  
  private validateParameterValue(
    key: string,
    value: any,
    validation: NonNullable<ProcessParameter['validation']>
  ): void {
    if (validation.min !== undefined && value < validation.min) {
      throw new Error(`Parameter '${key}' must be at least ${validation.min}`);
    }
    
    if (validation.max !== undefined && value > validation.max) {
      throw new Error(`Parameter '${key}' must be at most ${validation.max}`);
    }
    
    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        throw new Error(`Parameter '${key}' does not match required pattern`);
      }
    }
    
    if (validation.enum && !validation.enum.includes(value)) {
      throw new Error(`Parameter '${key}' must be one of: ${validation.enum.join(', ')}`);
    }
  }
  
  private async executeFrontend(
    code: string,
    incomingData: any,
    nodeData: any,
    parameters: any
  ): Promise<any> {
    console.log(`🚀 Executing frontend code for node:`, {
      codeLength: code.length,
      codePreview: code.substring(0, 100) + '...',
      incomingData,
      nodeData,
      parameters
    });
    
    try {
      // Compile function safely
      const processFunction = this.validator.compileFunction(code);
      console.log(`✅ Function compiled successfully`);
      
      // Execute with timeout
      const timeout = nodeData.processOverrides?.constraints?.timeout || 30000;
      console.log(`⏱️ Executing with timeout: ${timeout}ms`);
      
      const result = await this.executeWithTimeout(
        async () => {
          console.log(`🔥 About to call processFunction with:`, {
            incomingData,
            nodeData: JSON.stringify(nodeData, null, 2), // Expand nodeData for debugging
            parameters
          });
          
          try {
            const functionResult = await processFunction(incomingData, nodeData, parameters);
            console.log(`🏁 Process function returned:`, functionResult);
            return functionResult;
          } catch (processError) {
            console.error(`💥 Process function threw an error:`, processError);
            // Re-throw to be handled by outer catch
            throw processError;
          }
        },
        timeout
      );
      
      console.log(`🎯 Function execution result:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Frontend execution failed:`, error);
      throw error;
    }
  }
  
  private async executeBackend(
    code: string,
    incomingData: any,
    nodeData: any,
    parameters: any
  ): Promise<any> {
    // For backend execution, we would send to a secure execution environment
    // For now, we'll use the same frontend execution
    return await this.executeFrontend(code, incomingData, nodeData, parameters);
  }
  
  private async executeWithTimeout<T>(
    operation: () => Promise<T> | T,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      
      Promise.resolve(operation())
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
}

/**
 * CodeValidator handles validation and compilation of stored process code
 */
export class CodeValidator {
  validateProcessCode(code: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Basic syntax validation
      new Function('incomingData', 'nodeData', 'params', code);
      
      // Check for dangerous patterns
      const dangerousPatterns = [
        /eval\s*\(/,
        /Function\s*\(/,
        /document\./,
        /window\./,
        /global\./,
        /process\./,
        /require\s*\(/,
        /import\s+/,
      ];
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(code)) {
          errors.push(`Potentially dangerous code pattern detected: ${pattern.source}`);
        }
      }
      
      // Check for common issues
      if (!code.includes('return')) {
        warnings.push('Function should return a value');
      }
      
      if (!code.includes('try') && !code.includes('catch')) {
        warnings.push('Consider adding error handling with try/catch');
      }
      
    } catch (syntaxError) {
      errors.push(`Syntax error: ${syntaxError}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  compileFunction(code: string): Function {
    // Validate first
    const validation = this.validateProcessCode(code);
    if (!validation.isValid) {
      throw new Error(`Invalid code: ${validation.errors.join(', ')}`);
    }
    
    console.log(`🔧 Compiling function code:`, code.substring(0, 200) + '...');
    
    // The stored code is a complete function definition, so we need to evaluate it and return the function
    try {
      // Create a safe execution context and evaluate the function
      const functionWrapper = new Function(`
        'use strict';
        return (${code});
      `);
      
      const compiledFunction = functionWrapper();
      console.log(`✅ Function compilation successful, type:`, typeof compiledFunction);
      
      return compiledFunction;
    } catch (error) {
      console.error(`❌ Function compilation failed:`, error);
      throw new Error(`Failed to compile function: ${error}`);
    }
  }
}