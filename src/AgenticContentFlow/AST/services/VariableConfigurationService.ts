/**
 * Variable Configuration Service
 * 
 * This service extends the existing AST variable extraction to provide
 * configurable variables within functions and flow wrapper functions.
 * It detects variables declared inside functions and makes them configurable
 * through the visual interface while maintaining pure functionality.
 */

import * as t from '@babel/types';
import { BabelParser } from '../parsers/BabelParser';
import { VariableDeclaration, FunctionMetadata, SourceLocation } from '../types/ASTTypes';

export interface ConfigurableVariable extends VariableDeclaration {
  /** Unique identifier for the variable */
  id: string;
  /** Function that contains this variable */
  containingFunction: string;
  /** Initial value extracted from code */
  initialValue?: any;
  /** Current configured value */
  currentValue?: any;
  /** Whether this variable can be configured through UI */
  isConfigurable: boolean;
  /** Whether this variable is in a wrapper function (flow-level) */
  isFlowLevel: boolean;
  /** Suggested type based on initial value */
  suggestedType?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  /** Line of code where variable is declared */
  declarationCode: string;
}

export interface WrapperFunctionInfo {
  /** Function metadata for the wrapper function */
  functionInfo: FunctionMetadata;
  /** Variables declared in the wrapper function */
  variables: ConfigurableVariable[];
  /** Whether this appears to be a flow wrapper function */
  isFlowWrapper: boolean;
  /** Confidence score that this is a wrapper function (0-1) */
  wrapperConfidence: number;
}

export interface GlobalVariableWarning {
  /** Variable that is declared globally */
  variable: VariableDeclaration;
  /** Suggested function to move it to */
  suggestedFunction?: string;
  /** Warning message */
  message: string;
  /** Severity of the warning */
  severity: 'warning' | 'error';
}

export interface FlowStructureNotification {
  /** Type of notification */
  type: 'missing_wrapper' | 'multiple_wrappers' | 'no_wrapper_needed';
  /** Notification message */
  message: string;
  /** Severity level */
  severity: 'info' | 'warning' | 'suggestion';
  /** Suggested action */
  suggestedAction?: string;
}

export interface VariableConfigurationResult {
  /** All configurable variables found */
  configurableVariables: ConfigurableVariable[];
  /** Wrapper function information if found */
  wrapperFunction?: WrapperFunctionInfo;
  /** Warnings about global variables */
  globalVariableWarnings: GlobalVariableWarning[];
  /** Flow-level variables (from wrapper function) */
  flowLevelVariables: ConfigurableVariable[];
  /** Function-level variables (from individual functions) */
  functionLevelVariables: ConfigurableVariable[];
  /** Flow structure notification */
  flowStructureNotification?: FlowStructureNotification;
}

export class VariableConfigurationService {
  private babelParser: BabelParser;

  constructor(babelParser: BabelParser) {
    this.babelParser = babelParser;
  }

  /**
   * Analyze code for configurable variables and wrapper functions
   */
  public analyzeVariableConfiguration(
    code: string,
    functions: FunctionMetadata[]
  ): VariableConfigurationResult {
    try {
      const ast = this.babelParser.parse(code);
      
      // Extract all variables with enhanced information
      const allVariables = this.extractConfigurableVariables(ast, code, functions);
      
      // Identify wrapper function and generate flow structure notification
      const { wrapperFunction, flowStructureNotification } = this.identifyWrapperFunctionWithNotification(functions, allVariables);
      
      // Check for global variables and create warnings
      const globalVariableWarnings = this.analyzeGlobalVariables(allVariables, functions);
      
      // Categorize variables
      const flowLevelVariables = allVariables.filter(v => v.isFlowLevel);
      const functionLevelVariables = allVariables.filter(v => !v.isFlowLevel && v.scope === 'function');
      
      return {
        configurableVariables: allVariables,
        wrapperFunction,
        globalVariableWarnings,
        flowLevelVariables,
        functionLevelVariables,
        flowStructureNotification
      };
    } catch (error) {
      console.error('Variable configuration analysis error:', error);
      throw new Error(`Failed to analyze variable configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update variable value in code
   */
  public updateVariableValue(
    code: string,
    variable: ConfigurableVariable,
    newValue: any
  ): string {
    try {
      const ast = this.babelParser.parse(code);
      let updatedCode = code;
      
      // Find and update the variable declaration
      const lines = code.split('\n');
      const targetLine = variable.sourceLocation.start.line - 1; // Convert to 0-based
      
      if (targetLine >= 0 && targetLine < lines.length) {
        const originalLine = lines[targetLine];
        const updatedLine = this.replaceVariableValue(originalLine, variable.name, newValue);
        lines[targetLine] = updatedLine;
        updatedCode = lines.join('\n');
      }
      
      // Update the variable's current value
      variable.currentValue = newValue;
      
      return updatedCode;
    } catch (error) {
      console.error('Variable update error:', error);
      throw new Error(`Failed to update variable ${variable.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get configurable parameters for a flow when used as a node
   */
  public getFlowParameters(wrapperFunction: WrapperFunctionInfo): ConfigurableVariable[] {
    return wrapperFunction.variables.filter(v => v.isConfigurable);
  }

  /**
   * Create a flow node configuration from wrapper function
   */
  public createFlowNodeConfiguration(wrapperFunction: WrapperFunctionInfo): {
    nodeId: string;
    title: string;
    description: string;
    parameters: ConfigurableVariable[];
    isFlowNode: boolean;
  } {
    return {
      nodeId: `flow_${wrapperFunction.functionInfo.id}`,
      title: wrapperFunction.functionInfo.name,
      description: wrapperFunction.functionInfo.description || `Flow wrapper function: ${wrapperFunction.functionInfo.name}`,
      parameters: this.getFlowParameters(wrapperFunction),
      isFlowNode: true
    };
  }

  /**
   * Validate variable scoping according to JavaScript rules
   */
  public validateVariableScoping(
    variables: ConfigurableVariable[],
    functions: FunctionMetadata[]
  ): {
    isValid: boolean;
    violations: Array<{
      variable: ConfigurableVariable;
      violation: 'scope_leak' | 'undefined_reference' | 'shadowing';
      message: string;
    }>;
  } {
    const violations: Array<{
      variable: ConfigurableVariable;
      violation: 'scope_leak' | 'undefined_reference' | 'shadowing';
      message: string;
    }> = [];

    // Check for scope violations
    for (const variable of variables) {
      // Check for variable shadowing
      const shadowingVars = variables.filter(v => 
        v.name === variable.name && 
        v.id !== variable.id &&
        this.isInNestedScope(v, variable, functions)
      );

      if (shadowingVars.length > 0) {
        violations.push({
          variable,
          violation: 'shadowing',
          message: `Variable '${variable.name}' shadows another variable in outer scope`
        });
      }
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  /**
   * Generate wrapper function code with configurable parameters
   */
  public generateWrapperFunctionCode(
    originalFunction: FunctionMetadata,
    configurableVariables: ConfigurableVariable[]
  ): string {
    const parameters = configurableVariables
      .filter(v => v.isConfigurable)
      .map(v => `${v.name} = ${this.formatValueForCode(v.currentValue || v.initialValue)}`)
      .join(', ');

    const functionBody = this.replaceVariableDeclarationsWithParameters(
      originalFunction.code,
      configurableVariables
    );

    return `function ${originalFunction.name}(${parameters}) {
${functionBody}
}`;
  }

  /**
   * Extract configurable variables from AST
   */
  private extractConfigurableVariables(
    ast: t.Node,
    code: string,
    functions: FunctionMetadata[]
  ): ConfigurableVariable[] {
    const variables: ConfigurableVariable[] = [];
    const lines = code.split('\n');
    
    const traverse = (node: t.Node, currentFunction?: string) => {
      if (t.isVariableDeclaration(node)) {
        node.declarations.forEach(declarator => {
          if (t.isIdentifier(declarator.id)) {
            const sourceLocation = this.babelParser.getSourceLocation(node);
            const lineIndex = sourceLocation.start.line - 1;
            const declarationCode = lineIndex >= 0 && lineIndex < lines.length 
              ? lines[lineIndex].trim() 
              : '';
            
            const initialValue = this.extractInitialValue(declarator.init);
            const suggestedType = this.inferType(initialValue);
            
            const variable: ConfigurableVariable = {
              id: `${currentFunction || 'global'}_${declarator.id.name}_${sourceLocation.start.line}`,
              name: declarator.id.name,
              type: node.kind as 'var' | 'let' | 'const',
              sourceLocation,
              scope: currentFunction ? 'function' : 'global',
              containingFunction: currentFunction || 'global',
              initialValue,
              currentValue: initialValue,
              isConfigurable: this.isVariableConfigurable(declarator, currentFunction),
              isFlowLevel: false, // Will be updated when wrapper function is identified
              suggestedType,
              declarationCode
            };
            
            variables.push(variable);
          }
        });
      }

      // Track function context
      let functionName = currentFunction;
      if (t.isFunctionDeclaration(node) && node.id) {
        functionName = node.id.name;
      }

      // Traverse child nodes
      this.traverseChildren(node, (child) => traverse(child, functionName));
    };

    // Start traversal
    if (ast && (ast as any).program && (ast as any).program.body) {
      (ast as any).program.body.forEach((node: t.Node) => traverse(node));
    }

    return variables;
  }

  /**
   * Identify wrapper function with notification - SIMPLIFIED APPROACH
   */
  private identifyWrapperFunctionWithNotification(
    functions: FunctionMetadata[],
    variables: ConfigurableVariable[]
  ): { wrapperFunction?: WrapperFunctionInfo; flowStructureNotification?: FlowStructureNotification } {
    // Case 1: Only one function - it's automatically the wrapper
    if (functions.length === 1) {
      const singleFunction = functions[0];
      const wrapperVariables = variables.filter(v => v.containingFunction === singleFunction.name);
      
      // Mark variables as flow-level
      wrapperVariables.forEach(v => {
        v.isFlowLevel = true;
      });

      return {
        wrapperFunction: {
          functionInfo: singleFunction,
          variables: wrapperVariables,
          isFlowWrapper: true,
          wrapperConfidence: 1.0
        },
        flowStructureNotification: {
          type: 'no_wrapper_needed',
          message: 'Single function detected - automatically treated as flow wrapper',
          severity: 'info'
        }
      };
    }

    // Case 2: Multiple functions - find the one that calls others or has wrapper-like characteristics
    const candidatesWithScores = functions.map(func => {
      const score = this.calculateWrapperScore(func, functions, variables);
      return { func, score };
    }).sort((a, b) => b.score - a.score);

    // Check if we have multiple functions that call others (multiple wrapper candidates)
    // Only consider it multiple wrappers if they have significant scores (> 0.5)
    const functionsWithSignificantCalls = candidatesWithScores.filter(c => c.score > 0.5);
    
    if (functionsWithSignificantCalls.length > 1) {
      return {
        flowStructureNotification: {
          type: 'multiple_wrappers',
          message: 'Multiple functions call other functions. Consider creating a single main wrapper function.',
          severity: 'suggestion',
          suggestedAction: 'Create a main() function that orchestrates your flow by calling the other functions in sequence.'
        }
      };
    }

    // If we have a clear winner (score > 0.6), use it as wrapper
    if (candidatesWithScores.length > 0 && candidatesWithScores[0].score > 0.6) {
      const wrapper = candidatesWithScores[0].func;
      const wrapperVariables = variables.filter(v => v.containingFunction === wrapper.name);
      
      // Mark variables as flow-level
      wrapperVariables.forEach(v => {
        v.isFlowLevel = true;
      });

      return {
        wrapperFunction: {
          functionInfo: wrapper,
          variables: wrapperVariables,
          isFlowWrapper: true,
          wrapperConfidence: candidatesWithScores[0].score
        }
      };
    }

    // Look for functions with wrapper-like names, but only if they also have some score
    const wrapperNameCandidates = functions.filter(func => 
      ['main', 'init', 'setup', 'run', 'start'].some(name => 
        func.name.toLowerCase().includes(name.toLowerCase())
      )
    );

    if (wrapperNameCandidates.length === 1) {
      const wrapper = wrapperNameCandidates[0];
      const wrapperScore = candidatesWithScores.find(c => c.func.name === wrapper.name)?.score || 0;
      
      // Only use wrapper name as fallback if it has some score or calls other functions
      if (wrapperScore > 0) {
        const wrapperVariables = variables.filter(v => v.containingFunction === wrapper.name);
        
        // Mark variables as flow-level
        wrapperVariables.forEach(v => {
          v.isFlowLevel = true;
        });

        return {
          wrapperFunction: {
            functionInfo: wrapper,
            variables: wrapperVariables,
            isFlowWrapper: true,
            wrapperConfidence: Math.max(wrapperScore, 0.7)
          }
        };
      }
    }

    // Case 2c: No function calls others - missing wrapper
    return {
      flowStructureNotification: {
        type: 'missing_wrapper',
        message: 'No wrapper function detected. Consider creating a main function that calls your other functions.',
        severity: 'suggestion',
        suggestedAction: 'Add a main() or start() function that orchestrates your flow by calling the other functions.'
      }
    };
  }

  /**
   * Calculate wrapper function score - SIMPLIFIED APPROACH
   * A wrapper function is simply one that calls other functions in the file
   */
  private calculateWrapperScore(
    candidate: FunctionMetadata,
    allFunctions: FunctionMetadata[],
    variables: ConfigurableVariable[]
  ): number {
    // If there's only one function, it's automatically the wrapper
    if (allFunctions.length === 1) {
      return 1.0;
    }
    
    // Check if this function calls other functions in the file
    const otherFunctionNames = allFunctions
      .filter(f => f.name !== candidate.name)
      .map(f => f.name);
    
    // Extract just the function body from the candidate's code
    const functionBody = this.extractFunctionBody(candidate);
    
    const functionCallsCount = otherFunctionNames.filter(name => 
      functionBody.includes(`${name}(`)
    ).length;
    
    // If it calls other functions, it's likely a wrapper
    if (functionCallsCount > 0) {
      // The more functions it calls, the more likely it's a wrapper
      const callRatio = functionCallsCount / otherFunctionNames.length;
      return Math.min(callRatio + 0.5, 1.0); // Base score + call ratio
    }
    
    // Check if it has wrapper-like characteristics (name, variables, etc.)
    const hasWrapperName = ['main', 'init', 'setup', 'run', 'start'].some(name => 
      candidate.name.toLowerCase().includes(name.toLowerCase())
    );
    
    if (hasWrapperName) {
      return 0.7; // High confidence for wrapper-named functions
    }
    
    // If it doesn't call other functions and doesn't have wrapper characteristics, it's probably not a wrapper
    return 0.0;
  }

  /**
   * Extract function body from function metadata
   */
  private extractFunctionBody(func: FunctionMetadata): string {
    // If the code contains the entire file, extract just this function's part
    if (func.sourceLocation && func.code.includes('function')) {
      const lines = func.code.split('\n');
      const startLine = func.sourceLocation.start.line - 1;
      const endLine = func.sourceLocation.end.line - 1;
      
      if (startLine >= 0 && endLine < lines.length && startLine <= endLine) {
        const extracted = lines.slice(startLine, endLine + 1).join('\n');
        // console.log(`Extracted function body for ${func.name}:`, extracted);
        return extracted;
      }
    }
    
    // Fallback to the entire code if we can't extract properly
    return func.code;
  }

  /**
   * Analyze global variables and create warnings
   */
  private analyzeGlobalVariables(
    variables: ConfigurableVariable[],
    functions: FunctionMetadata[]
  ): GlobalVariableWarning[] {
    const warnings: GlobalVariableWarning[] = [];
    
    const globalVariables = variables.filter(v => v.scope === 'global');
    
    for (const globalVar of globalVariables) {
      // Suggest moving to the most appropriate function
      const suggestedFunction = this.suggestFunctionForGlobalVariable(globalVar, functions);
      
      warnings.push({
        variable: globalVar,
        suggestedFunction,
        message: `Global variable '${globalVar.name}' should be moved inside a function for better configurability and pure functionality`,
        severity: 'warning'
      });
    }
    
    return warnings;
  }

  /**
   * Suggest which function a global variable should be moved to
   */
  private suggestFunctionForGlobalVariable(
    globalVar: ConfigurableVariable,
    functions: FunctionMetadata[]
  ): string | undefined {
    // Simple heuristic: suggest the first function or a main/wrapper function
    const wrapperFunction = functions.find(f => 
      ['main', 'init', 'setup', 'run', 'start'].some(name => 
        f.name.toLowerCase().includes(name)
      )
    );
    
    return wrapperFunction?.name || functions[0]?.name;
  }

  /**
   * Check if a variable should be configurable
   */
  private isVariableConfigurable(
    declarator: t.VariableDeclarator,
    functionName?: string
  ): boolean {
    // Variables with initial values are more likely to be configurable
    if (!declarator.init) {
      return false;
    }
    
    // Simple literals are good candidates for configuration
    if (t.isStringLiteral(declarator.init) || 
        t.isNumericLiteral(declarator.init) || 
        t.isBooleanLiteral(declarator.init)) {
      return true;
    }
    
    // Object and array literals can also be configurable
    if (t.isObjectExpression(declarator.init) || t.isArrayExpression(declarator.init)) {
      return true;
    }
    
    return false;
  }

  /**
   * Extract initial value from variable declarator
   */
  private extractInitialValue(init: t.Expression | null | undefined): any {
    if (!init) return undefined;
    
    if (t.isStringLiteral(init)) return init.value;
    if (t.isNumericLiteral(init)) return init.value;
    if (t.isBooleanLiteral(init)) return init.value;
    if (t.isNullLiteral(init)) return null;
    
    // For complex expressions, return the code representation
    return undefined;
  }

  /**
   * Infer type from initial value
   */
  private inferType(value: any): 'string' | 'number' | 'boolean' | 'object' | 'array' | undefined {
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'array';
    if (value && typeof value === 'object') return 'object';
    return undefined;
  }

  /**
   * Replace variable value in a line of code
   */
  private replaceVariableValue(line: string, variableName: string, newValue: any): string {
    // Simple regex-based replacement for variable assignment
    const valueString = this.formatValueForCode(newValue);
    const regex = new RegExp(`(${variableName}\\s*=\\s*)([^;,\\n]+)`, 'g');
    return line.replace(regex, `$1${valueString}`);
  }

  /**
   * Format value for insertion into code
   */
  private formatValueForCode(value: any): string {
    if (typeof value === 'string') {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (value === null) {
      return 'null';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * Check if one variable is in a nested scope relative to another
   */
  private isInNestedScope(
    inner: ConfigurableVariable,
    outer: ConfigurableVariable,
    functions: FunctionMetadata[]
  ): boolean {
    // If they're in the same function, check block scoping
    if (inner.containingFunction === outer.containingFunction) {
      return inner.sourceLocation.start.line > outer.sourceLocation.start.line;
    }

    // Check if inner function is nested within outer function
    const innerFunction = functions.find(f => f.name === inner.containingFunction);
    const outerFunction = functions.find(f => f.name === outer.containingFunction);

    if (innerFunction && outerFunction) {
      return innerFunction.isNested && innerFunction.parentFunction === outerFunction.name;
    }

    return false;
  }

  /**
   * Replace variable declarations with parameters in function body
   */
  private replaceVariableDeclarationsWithParameters(
    functionCode: string,
    configurableVariables: ConfigurableVariable[]
  ): string {
    let modifiedCode = functionCode;

    // Remove variable declarations that are now parameters
    for (const variable of configurableVariables.filter(v => v.isConfigurable)) {
      const declarationRegex = new RegExp(
        `\\s*(const|let|var)\\s+${variable.name}\\s*=\\s*[^;\\n]+[;\\n]?`,
        'g'
      );
      modifiedCode = modifiedCode.replace(declarationRegex, '');
    }

    // Clean up extra whitespace
    modifiedCode = modifiedCode.replace(/\n\s*\n/g, '\n');

    return modifiedCode;
  }

  /**
   * Traverse child nodes of an AST node
   */
  private traverseChildren(node: t.Node, callback: (node: t.Node) => void) {
    for (const key in node) {
      const child = (node as any)[key];
      if (Array.isArray(child)) {
        child.forEach(item => {
          if (item && typeof item === 'object' && item.type) {
            callback(item);
          }
        });
      } else if (child && typeof child === 'object' && child.type) {
        callback(child);
      }
    }
  }
}