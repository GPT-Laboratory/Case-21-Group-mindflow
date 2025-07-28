import { Node } from '@babel/types';
import { ASTTraverser as IASTTraverser, NodeVisitor } from '../interfaces/CoreInterfaces';
import { NodeUtils } from '../utils/NodeUtils';
import { ValidationUtils, ASTError } from '../utils/ValidationUtils';

/**
 * Shared ASTTraverser class implementing consistent traversal logic.
 * Eliminates code duplication across extractors by providing a single traversal implementation.
 * Follows Single Responsibility Principle - only handles AST traversal.
 * Supports visitor pattern for flexible node processing.
 */
export class ASTTraverser implements IASTTraverser {
  private visitedNodes = new Set<Node>();
  private maxDepth: number;
  private currentDepth = 0;

  /**
   * Create a new ASTTraverser instance.
   * @param maxDepth Maximum traversal depth to prevent infinite recursion (default: 100)
   */
  constructor(maxDepth: number = 100) {
    this.maxDepth = maxDepth;
  }

  /**
   * Traverse an AST node using the visitor pattern.
   * Implements consistent traversal logic with proper validation and error handling.
   * 
   * @param node The root node to traverse
   * @param visitor The visitor to apply to each node
   * @throws ASTError if node validation fails or traversal encounters errors
   */
  traverse(node: Node, visitor: NodeVisitor): void {
    // Reset state for new traversal
    this.visitedNodes.clear();
    this.currentDepth = 0;

    try {
      this.traverseInternal(node, visitor);
    } catch (error) {
      if (ValidationUtils.isASTError(error)) {
        throw error;
      }
      throw new ASTError(
        `Traversal failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ASTTraverser'
      );
    } finally {
      // Clean up state
      this.visitedNodes.clear();
      this.currentDepth = 0;
    }
  }

  /**
   * Internal traversal method with depth tracking and cycle detection.
   * 
   * @param node The current node to traverse
   * @param visitor The visitor to apply
   */
  private traverseInternal(node: Node, visitor: NodeVisitor): void {
    // Validate the node before processing
    this.validateTraversalNode(node);

    // Check for maximum depth to prevent stack overflow
    if (this.currentDepth >= this.maxDepth) {
      throw new ASTError(
        `Maximum traversal depth (${this.maxDepth}) exceeded`,
        'ASTTraverser'
      );
    }

    // Check for cycles to prevent infinite recursion
    if (this.visitedNodes.has(node)) {
      // Skip already visited nodes to prevent cycles
      return;
    }

    // Mark node as visited
    this.visitedNodes.add(node);
    this.currentDepth++;

    try {
      // Apply visitor to current node
      visitor.visit(node);

      // Traverse child nodes
      this.traverseChildren(node, visitor);
    } finally {
      this.currentDepth--;
    }
  }

  /**
   * Traverse all child nodes of the given node.
   * 
   * @param node The parent node
   * @param visitor The visitor to apply to child nodes
   */
  private traverseChildren(node: Node, visitor: NodeVisitor): void {
    for (const key in node) {
      if (!this.shouldTraverseProperty(key)) {
        continue;
      }

      const child = (node as any)[key];

      if (Array.isArray(child)) {
        this.traverseArray(child, visitor);
      } else if (NodeUtils.isValidNode(child)) {
        this.traverseInternal(child, visitor);
      }
    }
  }

  /**
   * Traverse an array of potential child nodes.
   * 
   * @param array The array to traverse
   * @param visitor The visitor to apply to valid nodes
   */
  private traverseArray(array: any[], visitor: NodeVisitor): void {
    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      if (NodeUtils.isValidNode(item)) {
        this.traverseInternal(item, visitor);
      }
    }
  }

  /**
   * Determine if a property should be traversed.
   * Provides consistent property filtering across all traversals.
   * 
   * @param key The property key to check
   * @returns true if the property should be traversed, false otherwise
   */
  private shouldTraverseProperty(key: string): boolean {
    return this.shouldSkipProperty(key) === false;
  }

  /**
   * Determine if a property should be skipped during traversal.
   * Follows the design pattern of skipping metadata and parent references.
   * 
   * @param key The property key to check
   * @returns true if the property should be skipped, false otherwise
   */
  private shouldSkipProperty(key: string): boolean {
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

    return skipProperties.includes(key);
  }

  /**
   * Validate a node before traversal.
   * Ensures the node is valid and safe to traverse.
   * 
   * @param node The node to validate
   * @throws ASTError if validation fails
   */
  private validateTraversalNode(node: Node): void {
    try {
      ValidationUtils.validateNode(node);
    } catch (error) {
      if (ValidationUtils.isASTError(error)) {
        throw new ASTError(
          `Invalid node for traversal: ${error.message}`,
          'ASTTraverser',
          error.sourceLocation
        );
      }
      throw error;
    }

    // Additional traversal-specific validation
    if (!node.type) {
      throw new ASTError(
        'Node missing required type property for traversal',
        'ASTTraverser'
      );
    }
  }

  /**
   * Get the current traversal depth.
   * Useful for debugging and monitoring traversal progress.
   * 
   * @returns The current depth level
   */
  getCurrentDepth(): number {
    return this.currentDepth;
  }

  /**
   * Get the maximum allowed traversal depth.
   * 
   * @returns The maximum depth limit
   */
  getMaxDepth(): number {
    return this.maxDepth;
  }

  /**
   * Get the number of nodes visited in the current traversal.
   * 
   * @returns The count of visited nodes
   */
  getVisitedNodeCount(): number {
    return this.visitedNodes.size;
  }

  /**
   * Reset the traverser state.
   * Clears visited nodes and resets depth counter.
   */
  reset(): void {
    this.visitedNodes.clear();
    this.currentDepth = 0;
  }

  /**
   * Create a new traverser with the same configuration.
   * Useful for creating independent traversal instances.
   * 
   * @returns A new ASTTraverser instance with the same max depth
   */
  clone(): ASTTraverser {
    return new ASTTraverser(this.maxDepth);
  }
}