import { ParsedFileStructure } from './types/ASTTypes';
import { BabelParser } from './parsers/BabelParser';
import { CommentExtractor } from './extractors/CommentExtractor';
import { FunctionExtractor } from './extractors/FunctionExtractor';
import { CallExtractor } from './extractors/CallExtractor';
import { DependencyExtractor } from './extractors/DependencyExtractor';
import { VariableExtractor } from './extractors/VariableExtractor';

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
}

// Re-export types for backward compatibility
export * from './types/ASTTypes';