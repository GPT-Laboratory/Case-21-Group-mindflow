import * as t from '@babel/types';
import { Node } from '@babel/types';
import { BaseExtractor } from '../core/BaseExtractor';
import { ASTTraverser } from '../interfaces/CoreInterfaces';
import { VariableDeclaration, ScopeLevel } from '../types/ASTTypes';
import { NodeUtils } from '../utils/NodeUtils';
import { ValidationUtils } from '../utils/ValidationUtils';

/**
 * VariableExtractor following SOLID principles and new architecture.
 * Extends BaseExtractor to eliminate code duplication and use shared utilities.
 * Follows Single Responsibility Principle - only handles variable extraction.
 * Uses dependency injection for ASTTraverser to support testing and flexibility.
 */
export class VariableExtractor extends BaseExtractor<VariableDeclaration> {
  private scopeStack: ScopeLevel[] = [];

  /**
   * Create a new VariableExtractor instance with dependency injection.
   * 
   * @param traverser The ASTTraverser instance for consistent traversal logic
   */
  constructor(traverser: ASTTraverser) {
    super(traverser);
  }

  /**
   * Extract variable declarations from an AST node.
   * Implements the abstract method from BaseExtractor.
   * Uses visitor pattern for consistent traversal.
   * 
   * @param ast The root AST node to extract variables from
   * @returns Array of variable declarations
   * @throws ASTError if extraction fails
   */
  extract(ast: Node): VariableDeclaration[] {
    try {
      // Validate input
      this.validateNode(ast);

      const variables: VariableDeclaration[] = [];

      // Reset scope stack for new extraction
      this.scopeStack = [];

      // Use a custom traversal approach that tracks scope properly
      this.traverseWithScopeTracking(ast, variables);

      // Validate results before returning
      this.validateResults(variables, (variable) => {
        ValidationUtils.validateVariableDeclaration(variable);
      });

      return variables;

    } catch (error) {
      this.handleExtractionError(error, 'Variable extraction failed', ast);
    }
  }


  /**
   * Check if a node is a variable declaration.
   * Uses shared NodeUtils for consistent type checking.
   * 
   * @param node The node to check
   * @returns true if the node is a variable declaration
   */
  private isVariableDeclaration(node: Node): boolean {
    return NodeUtils.isVariableDeclaration(node);
  }

  /**
   * Extract variables from a variable declaration node.
   * Handles multiple declarators in a single declaration.
   * 
   * @param node The variable declaration node
   * @param variables Array to collect extracted variables
   * @param scope The scope level for the variables
   */
  private extractVariablesFromDeclaration(
    node: t.VariableDeclaration,
    variables: VariableDeclaration[],
    scope: ScopeLevel
  ): void {
    try {
      // Validate the declaration node
      this.validateNode(node, 'VariableDeclaration');

      // Process each declarator in the declaration
      node.declarations.forEach((declarator, index) => {
        try {
          const variable = this.extractSingleVariable(node, declarator, scope);
          if (variable) {
            variables.push(variable);
          }
        } catch (error) {
          // Log error but continue with other declarators
          console.warn(`Failed to extract variable at declarator index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

    } catch (error) {
      this.handleExtractionError(error, 'Failed to extract variables from declaration', node);
    }
  }

  /**
   * Extract a single variable from a variable declarator.
   * 
   * @param declaration The parent variable declaration
   * @param declarator The specific variable declarator
   * @param scope The current scope level
   * @returns The extracted variable metadata or null if extraction fails
   */
  private extractSingleVariable(
    declaration: t.VariableDeclaration,
    declarator: t.VariableDeclarator,
    scope: ScopeLevel
  ): VariableDeclaration | null {
    try {
      // Validate the declarator
      this.validateNode(declarator, 'VariableDeclarator');

      // Extract variable name
      const name = this.extractVariableName(declarator);
      if (!name) {
        return null;
      }

      // Extract default value if present
      const defaultValue = this.safeExtract(
        () => this.extractDefaultValue(declarator),
        'default value extraction'
      );

      // Extract description from comments
      const description = this.safeExtract(
        () => this.extractVariableDescription(declarator),
        'description extraction'
      ) || '';

      return {
        name,
        type: declaration.kind as 'var' | 'let' | 'const',
        sourceLocation: this.extractSourceLocation(declaration),
        scope,
        defaultValue,
        description
      };

    } catch (error) {
      console.warn(`Failed to extract single variable: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Extract variable name from a declarator.
   * Uses shared NodeUtils for consistent name extraction.
   * 
   * @param declarator The variable declarator
   * @returns The variable name or null if extraction fails
   */
  private extractVariableName(declarator: t.VariableDeclarator): string | null {
    try {
      return NodeUtils.getVariableName(declarator);
    } catch (error) {
      console.warn(`Failed to extract variable name: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Extract default value from a variable declarator.
   * 
   * @param declarator The variable declarator
   * @returns The default value as a string or undefined
   */
  private extractDefaultValue(declarator: t.VariableDeclarator): string | undefined {
    if (!declarator.init) {
      return undefined;
    }

    try {
      // Handle different types of initializers
      if (t.isLiteral(declarator.init)) {
        // Handle different literal types
        if (t.isNullLiteral(declarator.init)) {
          return 'null';
        }
        if ('value' in declarator.init && declarator.init.value !== undefined) {
          return String(declarator.init.value);
        }
        // Fallback for other literal types
        return String(declarator.init);
      }

      if (t.isIdentifier(declarator.init)) {
        return declarator.init.name;
      }

      // For complex expressions, return a simplified representation
      return `/* ${declarator.init.type} */`;

    } catch (error) {
      console.warn(`Failed to extract default value: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return undefined;
    }
  }

  /**
   * Extract description from variable comments.
   * 
   * @param declarator The variable declarator
   * @returns The variable description or empty string
   */
  private extractVariableDescription(declarator: t.VariableDeclarator): string {
    try {
      // Check for leading comments on the declarator
      if (declarator.leadingComments && declarator.leadingComments.length > 0) {
        const comment = declarator.leadingComments[0];
        return comment.value.trim();
      }

      return '';

    } catch (error) {
      console.warn(`Failed to extract variable description: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return '';
    }
  }

  /**
   * Determine the scope of a variable declaration node based on its context in the AST.
   * Uses the scope stack maintained during traversal instead of relying on parent properties.
   * 
   * @param node The variable declaration node
   * @returns The scope level for the variable
   */
  private determineNodeScope(node: Node): ScopeLevel {
    try {
      // Use the current scope from our traversal stack
      // This is more reliable than trying to walk up parent nodes
      return this.getCurrentScope();

    } catch (error) {
      console.warn(`Failed to determine node scope: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Default to global scope on error
      return 'global';
    }
  }

  /**
   * Update the scope stack based on the current node.
   * Tracks function and block scopes for accurate variable scoping.
   * 
   * @param node The current node being processed
   */
  private updateScopeStack(node: Node): void {
    try {
      // Enter function scope
      if (NodeUtils.isFunctionNode(node)) {
        this.scopeStack.push('function');
      }
      // Enter block scope for let/const declarations
      else if (t.isBlockStatement(node)) {
        this.scopeStack.push('block');
      }

    } catch (error) {
      console.warn(`Failed to update scope stack: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the current scope level based on the scope stack.
   * 
   * @returns The current scope level
   */
  private getCurrentScope(): ScopeLevel {
    if (this.scopeStack.length === 0) {
      return 'global';
    }

    // Return the most recent scope
    return this.scopeStack[this.scopeStack.length - 1];
  }

  /**
   * Check if the extractor can handle a specific AST node type.
   * Overrides BaseExtractor method for specificity.
   * 
   * @param node The AST node to check
   * @returns true if the extractor can handle variable declarations
   */
  protected canHandle(node: Node): boolean {
    return this.isVariableDeclaration(node);
  }

  /**
   * Pre-process an AST before extraction.
   * Resets scope stack and validates the root node.
   * 
   * @param ast The AST to pre-process
   * @throws ASTError if pre-processing fails
   */
  protected preProcess(ast: Node): void {
    // Reset scope stack for new extraction
    this.scopeStack = [];

    // Call parent pre-processing
    super.preProcess(ast);
  }

  /**
   * Post-process extraction results.
   * Cleans up scope stack and validates results.
   * 
   * @param results The extraction results to post-process
   * @returns The processed results
   */
  protected postProcess(results: VariableDeclaration[]): VariableDeclaration[] {
    // Clean up scope stack
    this.scopeStack = [];

    // Call parent post-processing
    return super.postProcess(results);
  }

  /**
   * Get the current scope stack for debugging and testing.
   * 
   * @returns A copy of the current scope stack
   */
  public getCurrentScopeStack(): ScopeLevel[] {
    return [...this.scopeStack];
  }

  /**
   * Check if currently in a nested scope.
   * 
   * @returns true if in function or block scope, false if global
   */
  public isInNestedScope(): boolean {
    return this.scopeStack.length > 0;
  }

  /**
   * Get the current scope level.
   * 
   * @returns The current scope level
   */
  public getCurrentScopeLevel(): ScopeLevel {
    return this.getCurrentScope();
  }

  /**
   * Traverse the AST with proper scope tracking.
   * This method manually traverses the AST and maintains scope context.
   * 
   * @param node The current node to traverse
   * @param variables Array to collect extracted variables
   */
  private traverseWithScopeTracking(node: Node, variables: VariableDeclaration[]): void {
    try {
      // Check if this node is a variable declaration
      if (this.isVariableDeclaration(node)) {
        const scope = this.getCurrentScope();
        this.extractVariablesFromDeclaration(node as t.VariableDeclaration, variables, scope);
      }

      // Update scope stack when entering function or block scopes
      const wasFunction = NodeUtils.isFunctionNode(node);
      const wasBlock = t.isBlockStatement(node);

      if (wasFunction) {
        this.scopeStack.push('function');
      } else if (wasBlock) {
        this.scopeStack.push('block');
      }

      // Traverse child nodes
      this.traverseChildren(node, variables);

      // Pop scope when exiting function or block scopes
      if (wasFunction || wasBlock) {
        this.scopeStack.pop();
      }

    } catch (error) {
      console.warn(`Failed to traverse node with scope tracking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Traverse child nodes of the current node.
   * 
   * @param node The parent node
   * @param variables Array to collect extracted variables
   */
  private traverseChildren(node: Node, variables: VariableDeclaration[]): void {
    try {
      for (const key in node) {
        if (!this.shouldTraverseProperty(key)) {
          continue;
        }

        const child = (node as any)[key];

        if (Array.isArray(child)) {
          child.forEach(item => {
            if (NodeUtils.isValidNode(item)) {
              this.traverseWithScopeTracking(item, variables);
            }
          });
        } else if (NodeUtils.isValidNode(child)) {
          this.traverseWithScopeTracking(child, variables);
        }
      }
    } catch (error) {
      console.warn(`Failed to traverse children: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Determine if a property should be traversed.
   * Uses the same logic as the shared ASTTraverser.
   * 
   * @param key The property key to check
   * @returns true if the property should be traversed
   */
  private shouldTraverseProperty(key: string): boolean {
    // Properties that don't contain child nodes or are metadata
    const skipProperties = [
      // Parent references (prevent cycles)
      'parent',

      // Comment metadata (handled separately by CommentExtractor)
      'leadingComments',
      'trailingComments',
      'innerComments',

      // Source location metadata
      'loc',
      'start',
      'end',
      'range',

      // Raw values and metadata
      'raw',
      'value',
      'extra',

      // Babel-specific metadata
      '_babelType',
      '_compact',
      '_generated',

      // TypeScript-specific metadata
      'typeAnnotation',
      'optional',

      // Flow-specific metadata
      'variance',
      'bound'
    ];

    return !skipProperties.includes(key);
  }
}