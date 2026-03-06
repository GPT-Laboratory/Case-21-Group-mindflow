import * as t from '@babel/types';
import { FunctionMetadata, Parameter, ScopeLevel } from '../types/ASTTypes';
import { BaseExtractor } from '../core/BaseExtractor';
import { ASTTraverser, NodeVisitor } from '../interfaces/CoreInterfaces';
import { NodeUtils } from '../utils/NodeUtils';
import { ParameterUtils } from '../utils/ParameterUtils';
import { ValidationUtils, ASTError } from '../utils/ValidationUtils';
import { ASTTraverser as ASTTraverserClass } from '../core/ASTTraverser';
import { useCodeStore } from '../../../stores/codeStore';

/**
 * FunctionExtractor refactored to follow SOLID principles and use new architecture.
 * Extends BaseExtractor to eliminate code duplication and use shared traversal logic.
 * Follows Single Responsibility Principle - only handles function extraction.
 * Uses dependency injection for ASTTraverser to support testing and flexibility.
 */
export class FunctionExtractor extends BaseExtractor<FunctionMetadata> {
  private functionStack: string[] = []; // Track nested function context
  private sourceCode: string = '';
  private filePath: string = '';

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
    // Determine the traverser to use and call super() unconditionally
    const traverser = (() => {
      // Handle both new and old constructor signatures
      if (traverserOrBabelParser && typeof traverserOrBabelParser.traverse === 'function') {
        // New constructor with ASTTraverser
        return traverserOrBabelParser as ASTTraverser;
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
          return new ASTTraverserClass();
        }
      } else {
        // Old constructor - create a default traverser
        return new ASTTraverserClass();
      }
    })();
    
    super(traverser);
  }

  /**
   * Set the source code and file path for function extraction
   */
  setSourceContext(sourceCode: string, filePath: string = 'unknown'): void {
    this.sourceCode = sourceCode;
    this.filePath = filePath;
    
    // Store the source code in the code store
    const codeStore = useCodeStore.getState();
    codeStore.setSourceCode(filePath, sourceCode);
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
      // Skip small inline arrow functions (like those in reduce, map, etc.)
      if (this.shouldSkipInlineFunction(node as t.Function)) {
        return;
      }
      
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
   * Determine if an inline function should be skipped (not treated as a separate node).
   * Skips small arrow functions that are typically used as callbacks in array methods.
   * 
   * @param node The function AST node
   * @returns true if the function should be skipped, false otherwise
   */
  private shouldSkipInlineFunction(node: t.Function): boolean {
    // Only skip arrow functions (not regular function declarations)
    if (node.type !== 'ArrowFunctionExpression') {
      return false;
    }

    // Skip if the function is very short (likely a simple callback)
    if (node.loc) {
      const lineSpan = node.loc.end.line - node.loc.start.line;
      const columnSpan = node.loc.end.column - node.loc.start.column;
      
      // Skip single-line arrow functions that are less than 50 characters
      if (lineSpan === 0 && columnSpan < 50) {
        return true;
      }
      
      // Skip multi-line arrow functions that span only 1-2 lines
      if (lineSpan <= 1) {
        return true;
      }
    }

    // Check if it's a simple expression (not a block statement)
    if (node.body && node.body.type !== 'BlockStatement') {
      return true; // Simple expression like (x) => x + 1
    }

    // Check if it has a very simple body (single return statement)
    if (node.body && node.body.type === 'BlockStatement') {
      const blockBody = node.body as t.BlockStatement;
      if (blockBody.body.length === 1 && blockBody.body[0].type === 'ReturnStatement') {
        return true; // Simple block like (x) => { return x + 1; }
      }
    }

    return false; // Keep more complex arrow functions
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
      
      // Generate stable ID based on function characteristics (no timestamp)
      const id = this.generateStableFunctionId(node, name);
      
      // Extract comments from the node itself
      const nodeComments = this.extractNodeComments(node);
      const description = this.extractFunctionDescriptionFromComments(nodeComments, name);
      
      // Determine nesting and scope
      const isNested = this.functionStack.length > 0;
      const parentFunction = isNested ? this.functionStack[this.functionStack.length - 1] : undefined;
      const scope: ScopeLevel = isNested ? 'function' : 'global';
      
      // Store function location in the code store for later retrieval
      if (node.loc && this.sourceCode) {
        const codeStore = useCodeStore.getState();
        
        // Calculate extended range to include JSDoc comments
        const extendedRange = this.calculateExtendedFunctionRange(node, nodeComments);
        
        codeStore.setFunctionLocation(id, {
          filePath: this.filePath,
          functionName: name,
          startLine: extendedRange.startLine,
          endLine: extendedRange.endLine,
          startColumn: extendedRange.startColumn,
          endColumn: extendedRange.endColumn
        });
      }
      
      const functionMetadata: FunctionMetadata = {
        id,
        name,
        description,
        parameters,
        sourceLocation,
        isNested,
        parentFunction,
        scope,
        filePath: this.filePath
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
   * Extract comments attached to a function node.
   * 
   * @param node The function AST node
   * @returns Array of comment objects
   */
  private extractNodeComments(node: t.Function): any[] {
    const comments: any[] = [];
    const nodeAny = node as any;
    
    // Extract leading comments (JSDoc comments are typically leading comments)
    if (nodeAny.leadingComments && Array.isArray(nodeAny.leadingComments)) {
      nodeAny.leadingComments.forEach((comment: any) => {
        comments.push({
          type: comment.type === 'CommentBlock' ? 'block' : 'line',
          value: comment.value,
          position: 'leading'
        });
      });
    }
    
    // Extract trailing comments
    if (nodeAny.trailingComments && Array.isArray(nodeAny.trailingComments)) {
      nodeAny.trailingComments.forEach((comment: any) => {
        comments.push({
          type: comment.type === 'CommentBlock' ? 'block' : 'line',
          value: comment.value,
          position: 'trailing'
        });
      });
    }
    
    return comments;
  }

  /**
   * Extract function description from JSDoc comments.
   * Looks for @title and @description tags in block comments.
   * Prioritizes comments that specifically mention the function name or are function-specific.
   * 
   * @param comments Array of comment objects
   * @param functionName The name of the function
   * @returns Function description or empty string
   */
  private extractFunctionDescriptionFromComments(comments: any[], functionName: string): string {
    if (!Array.isArray(comments) || comments.length === 0) {
      return '';
    }
    
    // Look for leading block comments that might contain JSDoc
    const leadingBlockComments = comments.filter(comment => 
      comment.position === 'leading' && comment.type === 'block'
    );
    
    if (leadingBlockComments.length === 0) {
      return '';
    }
    
    // If there are multiple leading comments, try to find the one that's function-specific
    let targetComment = null;
    
    if (leadingBlockComments.length > 1) {
      // Look for a comment that contains @title with the function name
      targetComment = leadingBlockComments.find(comment => {
        const commentValue = comment.value;
        const titleMatch = commentValue.match(/\*?\s*@title\s+(.+)/);
        return titleMatch && titleMatch[1].trim() === functionName;
      });
      
      // If no function-specific comment found, use the last leading comment
      // (which is typically the one immediately before the function)
      if (!targetComment) {
        targetComment = leadingBlockComments[leadingBlockComments.length - 1];
      }
    } else {
      targetComment = leadingBlockComments[0];
    }
    
    if (targetComment) {
      const commentValue = targetComment.value;
      
      // First try to extract @description tag
      const descriptionMatch = commentValue.match(/\*?\s*@description\s+(.+)/);
      if (descriptionMatch) {
        return descriptionMatch[1].trim();
      }
      
      // If no @description, try to extract @title tag
      const titleMatch = commentValue.match(/\*?\s*@title\s+(.+)/);
      if (titleMatch) {
        return titleMatch[1].trim();
      }
      
      // If no specific tags, extract the main description (before any @ tags)
      const lines = commentValue.split('\n');
      const descriptionLines: string[] = [];
      
      for (const line of lines) {
        const cleanLine = line.replace(/^\s*\*\s?/, '').trim();
        if (cleanLine.startsWith('@')) {
          break; // Stop at first @ tag
        }
        if (cleanLine.length > 0) {
          descriptionLines.push(cleanLine);
        }
      }
      
      if (descriptionLines.length > 0) {
        return descriptionLines.join(' ').trim();
      }
    }
    
    return '';
  }

  /**
   * Generate a stable function ID based on function characteristics (no timestamp).
   * This ensures the same function always gets the same ID across different parses.
   * 
   * @param node The function AST node
   * @param functionName The name of the function
   * @returns A stable, deterministic function ID
   */
  private generateStableFunctionId(node: t.Function, functionName: string): string {
    const nodeType = node.type.toLowerCase();
    
    // For named functions, use name as primary identifier
    if (functionName && functionName !== 'anonymous') {
      // Create a simple hash based on function name and file path for uniqueness
      const stableComponents = [functionName, nodeType, this.filePath].join('_');
      let hash = 0;
      for (let i = 0; i < stableComponents.length; i++) {
        const char = stableComponents.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      const hashStr = Math.abs(hash).toString(36);
      return `${functionName}_${nodeType}_${hashStr}`;
    }
    
    // For anonymous functions, fall back to location-based ID
    const location = this.extractSourceLocation(node);
    const locationStr = `${location.start.line}_${location.start.column}`;
    const stableComponents = [functionName, nodeType, locationStr, this.filePath].join('_');
    
    let hash = 0;
    for (let i = 0; i < stableComponents.length; i++) {
      const char = stableComponents.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const hashStr = Math.abs(hash).toString(36);
    return `${functionName}_${nodeType}_${locationStr}_${hashStr}`;
  }

  /**
   * Calculate extended function range to include JSDoc comments.
   * 
   * @param node The function AST node
   * @param nodeComments The comments extracted from the node
   * @returns Extended range including JSDoc comments
   */
  private calculateExtendedFunctionRange(node: t.Function, nodeComments: any[]): {
    startLine: number;
    endLine: number;
    startColumn: number;
    endColumn: number;
  } {
    if (!node.loc) {
      // Fallback to original range if no location info
      return {
        startLine: 1,
        endLine: 1,
        startColumn: 0,
        endColumn: 0
      };
    }

    let startLine = node.loc.start.line;
    let startColumn = node.loc.start.column;
    const endLine = node.loc.end.line;
    const endColumn = node.loc.end.column;

    // Check if there are leading comments (JSDoc)
    const nodeAny = node as any;
    if (nodeAny.leadingComments && Array.isArray(nodeAny.leadingComments) && nodeAny.leadingComments.length > 0) {
      // Find the earliest leading comment
      let earliestCommentLine = startLine;
      let earliestCommentColumn = startColumn;

      nodeAny.leadingComments.forEach((comment: any) => {
        if (comment.loc && comment.loc.start) {
          if (comment.loc.start.line < earliestCommentLine) {
            earliestCommentLine = comment.loc.start.line;
            earliestCommentColumn = comment.loc.start.column;
          } else if (comment.loc.start.line === earliestCommentLine && comment.loc.start.column < earliestCommentColumn) {
            earliestCommentColumn = comment.loc.start.column;
          }
        }
      });

      // Use the earliest comment as the start of our range
      if (earliestCommentLine < startLine) {
        startLine = earliestCommentLine;
        startColumn = earliestCommentColumn;
      }
    }

    return {
      startLine,
      endLine,
      startColumn,
      endColumn
    };
  }

  /**
   * Extract function description from comments.
   * 
   * @param comments Array of comment metadata
   * @returns Function description or empty string
   * @deprecated Use extractFunctionDescriptionFromComments instead
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
  extractFunctions(ast: t.Node, _sourceCode: string, _comments: any[]): FunctionMetadata[] {
    // For backward compatibility, just call the new extract method
    return this.extract(ast);
  }
}