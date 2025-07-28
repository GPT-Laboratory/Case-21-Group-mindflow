import * as t from '@babel/types';
import { FunctionMetadata, Parameter, ScopeLevel } from '../types/ASTTypes';
import { BaseExtractor } from '../core/BaseExtractor';
import { ASTTraverser, NodeVisitor } from '../interfaces/CoreInterfaces';
import { NodeUtils } from '../utils/NodeUtils';
import { ParameterUtils } from '../utils/ParameterUtils';
import { CommentUtils } from '../utils/CommentUtils';
import { ValidationUtils, ASTError } from '../utils/ValidationUtils';
import { ASTTraverser as ASTTraverserClass } from '../core/ASTTraverser';

/**
 * FunctionExtractor refactored to follow SOLID principles and use new architecture.
 * Extends BaseExtractor to eliminate code duplication and use shared traversal logic.
 * Follows Single Responsibility Principle - only handles function extraction.
 * Uses dependency injection for ASTTraverser to support testing and flexibility.
 */
export class FunctionExtractor extends BaseExtractor<FunctionMetadata> {
  private functionStack: string[] = []; // Track nested function context

  /**
   * Create a new FunctionExtractor with dependency injection.
   * 
   * @param traverser The ASTTraverser instance for consistent traversal logic
   */
  constructor(traverser: ASTTraverser);
  
  /**
   * Backward compatibility constructor for the old API.
   * @deprecated Use constructor(traverser: ASTTraverser) instead
   * 
   * @param babelParser The babel parser (not used in new implementation)
   * @param commentExtractor The comment extractor (not used in new implementation)
   */
  constructor(babelParser: any, commentExtractor?: any);
  
  constructor(traverserOrBabelParser: ASTTraverser | any, commentExtractor?: any) {
    // Handle both new and old constructor signatures
    if (traverserOrBabelParser && typeof traverserOrBabelParser.traverse === 'function') {
      // New constructor with ASTTraverser
      super(traverserOrBabelParser as ASTTraverser);
    } else if (traverserOrBabelParser === null || traverserOrBabelParser === undefined) {
      // Handle null/undefined case - should throw error for new API
      if (commentExtractor === undefined) {
        // New API with null traverser - throw error
        throw new ASTError(
          'ASTTraverser is required for BaseExtractor',
          'BaseExtractor'
        );
      } else {
        // Old API with null babel parser - create default traverser
        const defaultTraverser = new ASTTraverserClass();
        super(defaultTraverser);
      }
    } else {
      // Old constructor - create a default traverser
      const defaultTraverser = new ASTTraverserClass();
      super(defaultTraverser);
    }
  }

  /**
   * Extract function definitions from AST using visitor pattern.
   * Implements the abstract extract method from BaseExtractor.
   * 
   * @param ast The root AST node to extract functions from
   * @returns Array of function metadata
   * @throws ASTError if extraction fails
   */
  extract(ast: t.Node): FunctionMetadata[] {
    try {
      // Reset function stack for new extraction
      this.functionStack = [];
      
      // Validate input
      this.validateNode(ast);
      
      const functions: FunctionMetadata[] = [];
      
      // Use visitor pattern with shared traverser
      const visitor: NodeVisitor = {
        visit: (node: t.Node) => {
          this.processNode(node, functions);
        }
      };
      
      // Traverse using shared traversal logic
      this.traverse(ast, visitor);
      
      // Validate results before returning
      this.validateResults(functions, (func) => {
        ValidationUtils.validateFunctionMetadata(func);
      });
      
      return functions;
      
    } catch (error) {
      this.handleExtractionError(error, 'Function extraction failed', ast);
    }
  }

  /**
   * Process a single AST node to extract function information.
   * Handles function entry and exit for nested function tracking.
   * 
   * @param node The AST node to process
   * @param functions Array to collect extracted functions
   */
  private processNode(node: t.Node, functions: FunctionMetadata[]): void {
    if (this.isFunctionNode(node)) {
      // Extract function metadata
      const functionMetadata = this.extractFunction(node as t.Function);
      functions.push(functionMetadata);
      
      // Add to function stack for nested function detection
      this.functionStack.push(functionMetadata.id);
    }
  }

  /**
   * Check if a node is a function node using shared utilities.
   * 
   * @param node The AST node to check
   * @returns true if the node is a function, false otherwise
   */
  private isFunctionNode(node: t.Node): boolean {
    return NodeUtils.isFunctionNode(node) || NodeUtils.isMethodDefinition(node);
  }

  /**
   * Extract function metadata from a function node.
   * Uses shared utilities to eliminate code duplication.
   * 
   * @param node The function AST node
   * @returns Function metadata object
   */
  private extractFunction(node: t.Function): FunctionMetadata {
    try {
      // Validate the function node
      this.validateNode(node);
      
      // Extract basic information using shared utilities
      const name = this.getFunctionName(node);
      const sourceLocation = this.extractSourceLocation(node);
      const parameters = this.extractParameters(node);
      
      // Generate unique ID
      const id = this.generateId(node, name);
      
      // Extract comments using shared utility (simplified for now)
      const comments: any[] = [];
      const description = this.extractDescription(comments);
      
      // Determine nesting and scope
      const isNested = this.functionStack.length > 0;
      const parentFunction = isNested ? this.functionStack[this.functionStack.length - 1] : undefined;
      const scope: ScopeLevel = isNested ? 'function' : 'global';
      
      // Extract function code (simplified - would need source code for full implementation)
      const code = this.extractFunctionCode(node);
      
      const functionMetadata: FunctionMetadata = {
        id,
        name,
        description,
        parameters,
        sourceLocation,
        isNested,
        parentFunction,
        scope,
        code
      };
      
      return functionMetadata;
      
    } catch (error) {
      this.handleExtractionError(error, `Failed to extract function metadata`, node);
    }
  }

  /**
   * Get function name using shared utilities.
   * 
   * @param node The function AST node
   * @returns The function name or 'anonymous'
   */
  private getFunctionName(node: t.Function): string {
    try {
      if (NodeUtils.isMethodDefinition(node)) {
        return NodeUtils.getMethodName(node as t.ClassMethod | t.ObjectMethod);
      }
      return NodeUtils.getFunctionName(node);
    } catch (error) {
      // Fallback to anonymous if name extraction fails
      return 'anonymous';
    }
  }

  /**
   * Extract parameters using shared parameter utilities.
   * 
   * @param node The function AST node
   * @returns Array of parameter metadata
   */
  private extractParameters(node: t.Function): Parameter[] {
    try {
      // Validate parameters first
      ValidationUtils.validateParameters(node.params);
      
      // Use shared parameter extraction utility
      return ParameterUtils.extractParameters(node);
      
    } catch (error) {
      // Log error but don't fail extraction - return empty array
      console.warn(`Parameter extraction failed for function: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }

  /**
   * Extract function description from comments.
   * 
   * @param comments Array of comment metadata
   * @returns Function description or empty string
   */
  private extractDescription(comments: any[]): string {
    if (!Array.isArray(comments) || comments.length === 0) {
      return '';
    }
    
    // Look for leading block comments that might contain function description
    const leadingComment = comments.find(comment => 
      comment.position === 'leading' && comment.type === 'block'
    );
    
    if (leadingComment) {
      // Clean up JSDoc-style comments
      return leadingComment.text
        .replace(/^\*+\s*/gm, '') // Remove leading asterisks
        .replace(/^\/\*+\s*/, '') // Remove opening comment
        .replace(/\s*\*+\/$/, '') // Remove closing comment
        .trim();
    }
    
    return '';
  }

  /**
   * Extract function code representation.
   * Simplified implementation - in full version would need source code.
   * 
   * @param node The function AST node
   * @returns String representation of function code
   */
  private extractFunctionCode(node: t.Function): string {
    try {
      // This is a simplified implementation
      // In the full version, this would extract the actual source code
      const name = this.getFunctionName(node);
      const params = node.params.map(param => {
        if (t.isIdentifier(param)) return param.name;
        return 'param';
      }).join(', ');
      
      return `function ${name}(${params}) { /* ... */ }`;
      
    } catch (error) {
      return '/* function code extraction failed */';
    }
  }

  /**
   * Check if the extractor can handle a specific AST node type.
   * Overrides base implementation to be specific about function nodes.
   * 
   * @param node The AST node to check
   * @returns true if the node is a function type
   */
  protected canHandle(node: t.Node): boolean {
    return this.isFunctionNode(node);
  }

  /**
   * Pre-process AST before extraction.
   * Validates the AST and resets internal state.
   * 
   * @param ast The AST to pre-process
   */
  protected preProcess(ast: t.Node): void {
    super.preProcess(ast);
    
    // Reset function stack for new extraction
    this.functionStack = [];
    
    // Additional validation for function extraction
    if (!ast) {
      throw new ASTError('AST cannot be null or undefined for function extraction', this.getExtractorName());
    }
  }

  /**
   * Post-process extraction results.
   * Validates results and cleans up internal state.
   * 
   * @param results The extraction results to post-process
   * @returns The processed results
   */
  protected postProcess(results: FunctionMetadata[]): FunctionMetadata[] {
    // Clean up function stack
    this.functionStack = [];
    
    // Validate results using parent implementation
    return super.postProcess(results);
  }

  /**
   * Get the current function stack for debugging.
   * 
   * @returns Copy of the current function stack
   */
  getCurrentFunctionStack(): string[] {
    return [...this.functionStack];
  }

  /**
   * Check if currently processing nested functions.
   * 
   * @returns true if inside a function scope
   */
  isInNestedScope(): boolean {
    return this.functionStack.length > 0;
  }

  /**
   * Get the current parent function ID if in nested scope.
   * 
   * @returns Parent function ID or undefined
   */
  getCurrentParentFunction(): string | undefined {
    return this.functionStack.length > 0 ? this.functionStack[this.functionStack.length - 1] : undefined;
  }

  /**
   * Backward compatibility method for the old API.
   * @deprecated Use extract() method instead
   * 
   * @param ast The AST node to extract functions from
   * @param sourceCode The source code (not used in new implementation)
   * @param comments The comments array (not used in new implementation)
   * @returns Array of function metadata
   */
  extractFunctions(ast: t.Node, sourceCode: string, comments: any[]): FunctionMetadata[] {
    // For backward compatibility, just call the new extract method
    return this.extract(ast);
  }
}