import { ValidationResult } from '../types';
import { Edge, Node } from '@xyflow/react';

export class ProcessContextManager {
  constructor(private codeValidator: CodeValidator) {}

  async executeFrontend(
    code: string,
    incomingData: any,
    nodeData: any,
    parameters: any,
    targetMap?: Map<string, Node>,
    sourceMap?: Map<string, Node>,
    edgeMap?: Map<string, Edge>,
    edgeMetadataMap?: Map<string, any>
  ): Promise<any> {
    try {
      const processFunction = this.codeValidator.compileFunction(code);
      
      // Check if function expects the new signature with targetMap/sourceMap
      const funcStr = processFunction.toString();
      const hasExtendedSignature = funcStr.includes('targetMap') || funcStr.includes('sourceMap');
      
      if (hasExtendedSignature && targetMap && sourceMap) {
        console.log('🎯 Executing with TargetMap/SourceMap support');
        return await processFunction(incomingData, nodeData, parameters, targetMap, sourceMap, edgeMap, edgeMetadataMap);
      } else {
        console.log('📦 Executing with legacy signature');
        return await processFunction(incomingData, nodeData, parameters);
      }
    } catch (error) {
      console.error(`❌ Frontend execution failed:`, error);
      throw error;
    }
  }

  async executeBackend(
    code: string,
    incomingData: any,
    nodeData: any,
    parameters: any,
    targetMap?: Map<string, Node>,
    sourceMap?: Map<string, Node>,
    edgeMap?: Map<string, Edge>,
    edgeMetadataMap?: Map<string, any>
  ): Promise<any> {
    // In the future, this would handle secure backend execution
    // For now, we use the frontend execution
    return this.executeFrontend(code, incomingData, nodeData, parameters, targetMap, sourceMap, edgeMap, edgeMetadataMap);
  }
}

export class CodeValidator {
  validateProcessCode(code: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Check for both legacy and new signatures
      const legacyPattern = /function\s+process\s*\(\s*incomingData\s*,\s*nodeData\s*,\s*params\s*\)/;
      const extendedPattern = /function\s+process\s*\(\s*incomingData\s*,\s*nodeData\s*,\s*params\s*,\s*targetMap\s*,\s*sourceMap/;
      
      if (!legacyPattern.test(code) && !extendedPattern.test(code)) {
        // Try creating function to check syntax
        new Function('incomingData', 'nodeData', 'params', 'targetMap', 'sourceMap', 'edgeMap', code);
      }
      
      // Enhanced dangerous pattern detection with context awareness
      const dangerousPatterns = [
        {
          pattern: /eval\s*\(/,
          message: "eval() usage is not allowed"
        },
        {
          pattern: /Function\s*\(\s*[^)]*\)\s*\(\s*[^)]*\)/,
          message: "Dynamic function execution is not allowed"
        },
        {
          pattern: /document\./,
          message: "Direct DOM manipulation is not allowed"
        },
        {
          pattern: /window\./,
          message: "Window object access is not allowed"
        },
        {
          pattern: /global\./,
          message: "Global object access is not allowed"
        },
        {
          pattern: /process\./,
          message: "Process object access is not allowed"
        },
        {
          pattern: /require\s*\(/,
          message: "CommonJS require() is not allowed"
        },
        {
          pattern: /import\s+/,
          message: "ES6 imports are not allowed in process functions"
        }
      ];
      
      // Check for dangerous patterns with exceptions for safe usage
      for (const { pattern, message } of dangerousPatterns) {
        if (pattern.test(code)) {
          // Allow safe Function constructor usage in specific contexts
          if (pattern.source.includes('Function') && this.isSafeFunctionUsage(code)) {
            continue; // Skip this error for safe Function usage
          }
          errors.push(message);
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
  
  /**
   * Check if Function constructor usage is safe
   */
  private isSafeFunctionUsage(code: string): boolean {
    // Allow Function constructor in these safe contexts:
    // 1. For expression evaluation with limited scope
    // 2. When parameters are clearly defined and safe
    const safeFunctionPatterns = [
      /new Function\s*\(\s*['"`]data['"`]\s*,\s*['"`]incomingData['"`]\s*,\s*[^)]*\)/,
      /const evalFunction = new Function\s*\(/,
      /const.*Function\s*\(\s*['"`][^'"`]*['"`]\s*,\s*[^)]*\)/,
      // Allow the specific pattern used in ConditionalNode
      /const evalFunction = new Function\s*\(\s*['"`]data['"`]\s*,\s*['"`]incomingData['"`]\s*,/,
      // More flexible pattern for expression evaluation
      /new Function\s*\(\s*['"`]data['"`]\s*,\s*[^)]*return\s+.*?\$\{condition\}/
    ];
    
    // Also check if it's a simple expression evaluation pattern
    if (code.includes('new Function(\'data\', \'incomingData\'') && 
        code.includes('return ${condition}') &&
        !code.includes('eval(') &&
        !code.includes('require(')) {
      return true;
    }
    
    return safeFunctionPatterns.some(pattern => pattern.test(code));
  }
  
  compileFunction(code: string): Function {
    const validation = this.validateProcessCode(code);
    if (!validation.isValid) {
      throw new Error(`Invalid code: ${validation.errors.join(', ')}`);
    }
    
    try {
      // Create function that accepts both legacy and extended signatures
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