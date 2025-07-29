import { ParsedFileStructure, ParseResult, ParseError, ScopeViolation } from './types/ASTTypes';
import { ASTParser, ASTExtractor, ASTParserServiceInterface } from './interfaces/CoreInterfaces';
import { externalDependencyProcessor, ExternalDependencyResult } from './services/ExternalDependencyProcessor';
import { errorHandlingService } from './services/ErrorHandlingService';
import { scopeViolationService } from './services/ScopeViolationService';
import { ScopeContext } from '../Node/interfaces/ContainerNodeInterfaces';
import { useNotifications } from '../Notifications/hooks/useNotifications';
import { ASTError } from './utils/ValidationUtils';

export class ASTParserService implements ASTParserServiceInterface {
  constructor(
    private parser: ASTParser,
    private extractors: Map<string, ASTExtractor<any>>
  ) {
    // Validate dependencies
    this.validateDependencies();
  }

  /**
   * Validate that all required dependencies are provided
   */
  private validateDependencies(): void {
    if (!this.parser) {
      throw new ASTError('ASTParser instance is required', 'ASTParserService');
    }

    if (!this.extractors || !(this.extractors instanceof Map)) {
      throw new ASTError('Extractors map is required', 'ASTParserService');
    }

    // Validate that all required extractors are present
    const requiredExtractors = ['function', 'call', 'variable', 'comment', 'dependency'];
    for (const extractorType of requiredExtractors) {
      if (!this.extractors.has(extractorType)) {
        throw new ASTError(`Missing ${extractorType} extractor`, 'ASTParserService');
      }
    }

    // Validate parser interface
    if (typeof this.parser.parse !== 'function') {
      throw new ASTError('Parser must implement parse method', 'ASTParserService');
    }

    // Validate extractor interfaces
    for (const [type, extractor] of this.extractors) {
      if (!extractor || typeof extractor.extract !== 'function') {
        throw new ASTError(`${type} extractor must implement extract method`, 'ASTParserService');
      }
    }
  }

  /**
   * Parse JavaScript code into AST and extract structure
   * Coordinates parsing and extraction operations using injected dependencies
   */
  parseFile(code: string): ParsedFileStructure {
    try {
      // Parse with injected parser
      const ast = this.parser.parse(code);

      // Extract all components using injected extractors
      const functions = this.extractors.get('function')?.extract(ast) || [];
      const calls = this.extractors.get('call')?.extract(ast) || [];
      const dependencies = this.extractors.get('dependency')?.extract(ast) || [];
      const variables = this.extractors.get('variable')?.extract(ast) || [];
      const comments = this.extractors.get('comment')?.extract(ast) || [];

      return {
        functions,
        calls,
        dependencies,
        variables,
        comments
      };
    } catch (error) {
      console.error('AST parsing error:', error);
      if (error instanceof ASTError) {
        throw error;
      }
      throw new ASTError(
        `Failed to parse JavaScript code: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ASTParserService'
      );
    }
  }

  /**
   * Parse JavaScript code with enhanced error handling and user notifications
   */
  parseFileWithErrorHandling(code: string, notificationHook?: ReturnType<typeof useNotifications>): ParseResult {
    const errors: ParseError[] = [];
    const warnings: ParseError[] = [];
    
    try {
      // First try to parse with the injected parser
      let ast: any;
      try {
        ast = this.parser.parse(code);
      } catch (parseError) {
        const error = errorHandlingService.createParseError(
          'syntax',
          `Parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
          { recoverable: false }
        );
        errors.push(error);
        
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
          partiallyParsed: false
        };
      }

      // Parse succeeded, now extract structure with error handling for each component
      let structure: ParsedFileStructure | undefined;
      
      try {
        // Extract components with individual error handling using injected extractors
        const functions = this.extractWithErrorHandling('function', ast, errors, warnings, 'functions');
        const calls = this.extractWithErrorHandling('call', ast, errors, warnings, 'function calls');
        const dependencies = this.extractWithErrorHandling('dependency', ast, errors, warnings, 'dependencies');
        const variables = this.extractWithErrorHandling('variable', ast, errors, warnings, 'variables');
        const comments = this.extractWithErrorHandling('comment', ast, errors, warnings, 'comments');

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
   * Extract data using an injected extractor with error handling
   */
  private extractWithErrorHandling(
    extractorType: string,
    ast: any,
    errors: ParseError[],
    warnings: ParseError[],
    componentName: string
  ): any[] {
    try {
      const extractor = this.extractors.get(extractorType);
      if (!extractor) {
        throw new ASTError(`${extractorType} extractor not found`, 'ASTParserService');
      }
      return extractor.extract(ast);
    } catch (error) {
      const parseError = errorHandlingService.createParseError(
        extractorType === 'dependency' ? 'dependency' : 'semantic',
        `Failed to extract ${componentName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { 
          recoverable: true,
          suggestion: this.getExtractionErrorSuggestion(extractorType)
        }
      );
      
      // Dependencies and calls are treated as warnings, others as errors
      if (extractorType === 'dependency' || extractorType === 'call') {
        warnings.push(parseError);
      } else {
        errors.push(parseError);
      }
      
      return []; // Return empty array to continue processing
    }
  }

  /**
   * Get appropriate error suggestion based on extractor type
   */
  private getExtractionErrorSuggestion(extractorType: string): string {
    switch (extractorType) {
      case 'function':
        return 'Some functions may be skipped. Check function syntax and structure.';
      case 'call':
        return 'Function call relationships may not be displayed correctly.';
      case 'dependency':
        return 'External dependencies may not be displayed correctly.';
      case 'variable':
        return 'Variable configuration may not be available for some functions.';
      case 'comment':
        return 'Some comments may not be processed correctly.';
      default:
        return 'Some components may not be processed correctly.';
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
   * Process external dependencies and create child nodes for a parent function
   */
  processExternalDependencies(
    code: string, 
    parentNodeId: string, 
    parentScope?: ScopeContext
  ): ExternalDependencyResult {
    try {
      const ast = this.parser.parse(code);
      return externalDependencyProcessor.processExternalDependencies(ast, parentNodeId, parentScope);
    } catch (error) {
      console.error('External dependency processing error:', error);
      if (error instanceof ASTError) {
        throw error;
      }
      throw new ASTError(
        `Failed to process external dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ASTParserService'
      );
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