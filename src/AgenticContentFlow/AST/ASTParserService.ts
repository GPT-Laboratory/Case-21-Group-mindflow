import { ParsedFileStructure } from './types/ASTTypes';
import { BabelParser } from './parsers/BabelParser';
import { CommentExtractor } from './extractors/CommentExtractor';
import { FunctionExtractor } from './extractors/FunctionExtractor';
import { CallExtractor } from './extractors/CallExtractor';
import { DependencyExtractor } from './extractors/DependencyExtractor';
import { VariableExtractor } from './extractors/VariableExtractor';
import { externalDependencyProcessor, ExternalDependencyResult } from './services/ExternalDependencyProcessor';
import { ScopeContext } from '../Node/interfaces/ContainerNodeInterfaces';

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