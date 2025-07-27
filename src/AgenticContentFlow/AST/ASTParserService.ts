import { ParsedFileStructure, ParseResult, ParseError, ScopeViolation } from './types/ASTTypes';
import { BabelParser } from './parsers/BabelParser';
import { CommentExtractor } from './extractors/CommentExtractor';
import { FunctionExtractor } from './extractors/FunctionExtractor';
import { CallExtractor } from './extractors/CallExtractor';
import { DependencyExtractor } from './extractors/DependencyExtractor';
import { VariableExtractor } from './extractors/VariableExtractor';
import { externalDependencyProcessor, ExternalDependencyResult } from './services/ExternalDependencyProcessor';
import { errorHandlingService } from './services/ErrorHandlingService';
import { scopeViolationService } from './services/ScopeViolationService';
import { ScopeContext } from '../Node/interfaces/ContainerNodeInterfaces';
import { useNotifications } from '../Notifications/hooks/useNotifications';

export class ASTParserService {
  private babelParser: BabelParser;
  private commentExtractor: CommentExtractor;
  private functionExtractor: FunctionExtractor;
  private callExtractor: CallExtractor;
  private dependencyExtractor: DependencyExtractor;
  private variableExtractor: VariableExtractor;

  constructor() {
    this.babelParser = new BabelParser();
    this.commentExtractor = new CommentExtractor();
    this.functionExtractor = new FunctionExtractor(this.babelParser, this.commentExtractor);
    this.callExtractor = new CallExtractor(this.babelParser);
    this.dependencyExtractor = new DependencyExtractor();
    this.variableExtractor = new VariableExtractor(this.babelParser);
  }

  /**
   * Parse JavaScript code into AST and extract structure
   */
  parseFile(code: string): ParsedFileStructure {
    try {
      // Parse with Babel
      const ast = this.babelParser.parse(code);

      // Extract comments first
      const comments = this.commentExtractor.extractComments(ast);

      // Extract all components using specialized extractors
      const functions = this.functionExtractor.extractFunctions(ast, code, comments);
      const calls = this.callExtractor.identifyFunctionCalls(ast);
      const dependencies = this.dependencyExtractor.extractDependencies(ast);
      const variables = this.variableExtractor.extractVariables(ast);

      return {
        functions,
        calls,
        dependencies,
        variables,
        comments
      };
    } catch (error) {
      console.error('AST parsing error:', error);
      throw new Error(`Failed to parse JavaScript code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse JavaScript code with enhanced error handling and user notifications
   */
  parseFileWithErrorHandling(code: string, notificationHook?: ReturnType<typeof useNotifications>): ParseResult {
    const errors: ParseError[] = [];
    const warnings: ParseError[] = [];
    
    try {
      // Use enhanced Babel parser with error handling
      const parseResult = this.babelParser.parseWithErrorHandling(code);
      
      // Add any parsing errors from Babel
      errors.push(...parseResult.errors);
      warnings.push(...parseResult.warnings);
      
      if (!parseResult.success) {
        // Log errors to console with detailed formatting
        errorHandlingService.logErrors(errors, warnings, code);
        
        // Notify user about errors
        if (notificationHook) {
          errorHandlingService.notifyUser(errors, warnings, notificationHook);
        }
        
        return {
          success: false,
          errors,
          warnings,
          partiallyParsed: parseResult.partiallyParsed
        };
      }

      // Parse succeeded, now extract structure with error handling for each component
      let structure: ParsedFileStructure | undefined;
      
      try {
        const ast = this.babelParser.parse(code);
        const comments = this.commentExtractor.extractComments(ast);
        
        // Extract components with individual error handling
        const functions = this.extractFunctionsWithErrorHandling(ast, code, comments, errors, warnings);
        const calls = this.extractCallsWithErrorHandling(ast, errors, warnings);
        const dependencies = this.extractDependenciesWithErrorHandling(ast, errors, warnings);
        const variables = this.extractVariablesWithErrorHandling(ast, errors, warnings);

        structure = {
          functions,
          calls,
          dependencies,
          variables,
          comments
        };

        // Analyze scope violations if structure was successfully extracted
        if (structure) {
          const scopeViolations = this.analyzeScopeViolations(structure, notificationHook);
          // Scope violations are handled separately and don't affect parsing success
        }
      } catch (extractionError) {
        const parseError = errorHandlingService.createParseError(
          'semantic',
          `Failed to extract code structure: ${extractionError instanceof Error ? extractionError.message : 'Unknown error'}`,
          { recoverable: true }
        );
        errors.push(parseError);
      }

      // Log any errors or warnings that occurred during extraction
      if (errors.length > 0 || warnings.length > 0) {
        errorHandlingService.logErrors(errors, warnings, code);
        
        if (notificationHook) {
          errorHandlingService.notifyUser(errors, warnings, notificationHook);
        }
      }

      return {
        success: structure !== undefined,
        structure,
        errors,
        warnings,
        partiallyParsed: errors.length > 0 && structure !== undefined
      };
    } catch (criticalError) {
      const parseError = errorHandlingService.createParseError(
        'syntax',
        `Critical parsing failure: ${criticalError instanceof Error ? criticalError.message : 'Unknown error'}`,
        { recoverable: false }
      );
      errors.push(parseError);
      
      errorHandlingService.logErrors(errors, warnings, code);
      
      if (notificationHook) {
        errorHandlingService.notifyUser(errors, warnings, notificationHook);
      }
      
      return {
        success: false,
        errors,
        warnings,
        partiallyParsed: false
      };
    }
  }

  /**
   * Analyze scope violations in parsed file structure
   */
  analyzeScopeViolations(structure: ParsedFileStructure, notificationHook?: ReturnType<typeof useNotifications>): ScopeViolation[] {
    try {
      const violations = scopeViolationService.analyzeScopeViolations(structure);
      
      // Log violations to console
      scopeViolationService.logViolations(violations);
      
      // Notify user about violations
      if (notificationHook) {
        scopeViolationService.notifyUser(violations, notificationHook);
      }
      
      return violations;
    } catch (error) {
      console.warn('Failed to analyze scope violations:', error);
      return [];
    }
  }

  /**
   * Get visual indicators for scope violations (for UI integration)
   */
  getScopeViolationIndicators(structure: ParsedFileStructure): Map<string, { type: string; severity: string; message: string }[]> {
    try {
      const violations = scopeViolationService.analyzeScopeViolations(structure);
      return scopeViolationService.createVisualIndicators(violations);
    } catch (error) {
      console.warn('Failed to create scope violation indicators:', error);
      return new Map();
    }
  }

  /**
   * Extract function definitions from AST
   * @deprecated Use functionExtractor.extractFunctions instead
   */
  extractFunctions(ast: any, sourceCode: string) {
    const comments = this.commentExtractor.extractComments(ast);
    return this.functionExtractor.extractFunctions(ast, sourceCode, comments);
  }

  /**
   * Identify function calls within the AST
   * @deprecated Use callExtractor.identifyFunctionCalls instead
   */
  identifyFunctionCalls(ast: any) {
    return this.callExtractor.identifyFunctionCalls(ast);
  }

  /**
   * Process external dependencies and create child nodes for a parent function
   */
  processExternalDependencies(
    code: string, 
    parentNodeId: string, 
    parentScope?: ScopeContext
  ): ExternalDependencyResult {
    try {
      const ast = this.babelParser.parse(code);
      return externalDependencyProcessor.processExternalDependencies(ast, parentNodeId, parentScope);
    } catch (error) {
      console.error('External dependency processing error:', error);
      throw new Error(`Failed to process external dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse file and create enhanced structure with child nodes for external dependencies
   */
  parseFileWithChildNodes(code: string): ParsedFileStructure & { externalDependencyResults: Map<string, ExternalDependencyResult> } {
    const baseStructure = this.parseFile(code);
    const externalDependencyResults = new Map<string, ExternalDependencyResult>();

    // Process external dependencies for each function
    baseStructure.functions.forEach(func => {
      try {
        const result = this.processExternalDependencies(
          func.code, 
          func.id, 
          this.createScopeFromFunction(func)
        );
        externalDependencyResults.set(func.id, result);
      } catch (error) {
        console.warn(`Failed to process external dependencies for function ${func.name}:`, error);
      }
    });

    return {
      ...baseStructure,
      externalDependencyResults
    };
  }

  /**
   * Extract functions with individual error handling
   */
  private extractFunctionsWithErrorHandling(ast: any, code: string, comments: any[], errors: ParseError[], warnings: ParseError[]) {
    try {
      return this.functionExtractor.extractFunctions(ast, code, comments);
    } catch (error) {
      const parseError = errorHandlingService.createParseError(
        'semantic',
        `Failed to extract functions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { 
          recoverable: true,
          suggestion: 'Some functions may be skipped. Check function syntax and structure.'
        }
      );
      errors.push(parseError);
      return []; // Return empty array to continue processing
    }
  }

  /**
   * Extract function calls with individual error handling
   */
  private extractCallsWithErrorHandling(ast: any, errors: ParseError[], warnings: ParseError[]) {
    try {
      return this.callExtractor.identifyFunctionCalls(ast);
    } catch (error) {
      const parseError = errorHandlingService.createParseError(
        'semantic',
        `Failed to extract function calls: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { 
          recoverable: true,
          suggestion: 'Function call relationships may not be displayed correctly.'
        }
      );
      warnings.push(parseError);
      return []; // Return empty array to continue processing
    }
  }

  /**
   * Extract dependencies with individual error handling
   */
  private extractDependenciesWithErrorHandling(ast: any, errors: ParseError[], warnings: ParseError[]) {
    try {
      return this.dependencyExtractor.extractDependencies(ast);
    } catch (error) {
      const parseError = errorHandlingService.createParseError(
        'dependency',
        `Failed to extract dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { 
          recoverable: true,
          suggestion: 'External dependencies may not be displayed correctly.'
        }
      );
      warnings.push(parseError);
      return []; // Return empty array to continue processing
    }
  }

  /**
   * Extract variables with individual error handling
   */
  private extractVariablesWithErrorHandling(ast: any, errors: ParseError[], warnings: ParseError[]) {
    try {
      return this.variableExtractor.extractVariables(ast);
    } catch (error) {
      const parseError = errorHandlingService.createParseError(
        'semantic',
        `Failed to extract variables: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { 
          recoverable: true,
          suggestion: 'Variable configuration may not be available for some functions.'
        }
      );
      warnings.push(parseError);
      return []; // Return empty array to continue processing
    }
  }

  /**
   * Create a scope context from function metadata
   */
  private createScopeFromFunction(func: any): ScopeContext {
    return {
      level: func.isNested ? 1 : 0,
      variables: func.parameters?.map((p: any) => p.name) || [],
      functionName: func.name,
      parentScope: func.parentFunction ? {
        level: 0,
        variables: [],
        functionName: func.parentFunction
      } : undefined
    };
  }
}

// Re-export types for backward compatibility
export * from './types/ASTTypes';