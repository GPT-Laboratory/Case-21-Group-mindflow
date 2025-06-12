import { ValidationResult } from '../types';

export class ProcessContextManager {
  constructor(private codeValidator: CodeValidator) {}

  async executeFrontend(
    code: string,
    incomingData: any,
    nodeData: any,
    parameters: any
  ): Promise<any> {
    try {
      const processFunction = this.codeValidator.compileFunction(code);
      
      return await processFunction(incomingData, nodeData, parameters);
    } catch (error) {
      console.error(`❌ Frontend execution failed:`, error);
      throw error;
    }
  }

  async executeBackend(
    code: string,
    incomingData: any,
    nodeData: any,
    parameters: any
  ): Promise<any> {
    // In the future, this would handle secure backend execution
    // For now, we use the frontend execution
    return this.executeFrontend(code, incomingData, nodeData, parameters);
  }
}

export class CodeValidator {
  validateProcessCode(code: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      new Function('incomingData', 'nodeData', 'params', code);
      
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
    const validation = this.validateProcessCode(code);
    if (!validation.isValid) {
      throw new Error(`Invalid code: ${validation.errors.join(', ')}`);
    }
    
    try {
      const functionWrapper = new Function(`
        'use strict';
        return (${code});
      `);
      
      return functionWrapper();
    } catch (error) {
      throw new Error(`Failed to compile function: ${error}`);
    }
  }
}