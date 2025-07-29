import { Node } from '@babel/types';
import { ASTExtractor, ASTTraverser, NodeVisitor } from '../interfaces/CoreInterfaces';
import { SourceLocation } from '../types/ASTTypes';
import { SourceLocationUtils } from '../utils/SourceLocationUtils';
import { ValidationUtils, ASTError } from '../utils/ValidationUtils';
import { NodeUtils } from '../utils/NodeUtils';

/**
 * Abstract base class for all AST extractors.
 * Provides shared functionality and enforces consistent patterns across extractors.
 * Follows Single Responsibility Principle - handles common extraction operations.
 * Supports Dependency Inversion Principle - depends on ASTTraverser abstraction.
 * Eliminates code duplication by providing shared traversal and utility methods.
 */
export abstract class BaseExtractor<T> implements ASTExtractor<T> {
  protected readonly traverser: ASTTraverser;

  /**
   * Create a new BaseExtractor instance with dependency injection.
   * 
   * @param traverser The ASTTraverser instance for consistent traversal logic
   */
  constructor(traverser: ASTTraverser) {
    if (!traverser) {
      throw new ASTError(
        'ASTTraverser is required for BaseExtractor',
        'BaseExtractor'
      );
    }
    this.traverser = traverser;
  }

  /**
   * Abstract method that subclasses must implement to extract specific elements.
   * Follows Template Method pattern - defines the interface while allowing customization.
   * 
   * @param ast The root AST node to extract from
   * @returns Array of extracted elements of type T
   * @throws ASTError if extraction fails
   */
  abstract extract(ast: Node): T[];

  /**
   * Extract source location from an AST node using shared utility.
   * Eliminates code duplication across extractors.
   * 
   * @param node The AST node to extract location from
   * @returns The source location information
   */
  protected extractSourceLocation(node: Node): SourceLocation {
    try {
      return SourceLocationUtils.extract(node);
    } catch (error) {
      // Don't try to extract location again on error to avoid circular calls
      throw new ASTError(
        `Failed to extract source location: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.constructor.name
      );
    }
  }

  /**
   * Validate an AST node before processing.
   * Provides consistent validation patterns across all extractors.
   * 
   * @param node The node to validate
   * @param expectedType Optional expected node type for additional validation
   * @throws ASTError if validation fails
   */
  protected validateNode(node: any, expectedType?: string): void {
    try {
      if (expectedType) {
        ValidationUtils.validateNode(node, expectedType);
      } else {
        ValidationUtils.validateNode(node);
      }
    } catch (error) {
      if (ValidationUtils.isASTError(error)) {
        throw new ASTError(
          `Node validation failed in ${this.constructor.name}: ${error.message}`,
          this.constructor.name,
          error.sourceLocation
        );
      }
      throw error;
    }
  }

  /**
   * Check if a node is a valid AST node using shared utility.
   * Provides consistent node validation across extractors.
   * 
   * @param node The object to check
   * @returns true if the object is a valid AST node, false otherwise
   */
  protected isValidNode(node: any): node is Node {
    return NodeUtils.isValidNode(node);
  }

  /**
   * Generate a unique identifier for extracted elements.
   * Provides consistent ID generation across extractors.
   * 
   * @param node The AST node to generate ID for
   * @param prefix Optional prefix for the ID
   * @returns A unique identifier string
   */
  protected generateId(node: Node, prefix?: string): string {
    const location = this.extractSourceLocation(node);
    const locationStr = `${location.start.line}_${location.start.column}`;
    const nodeType = node.type.toLowerCase();
    const baseId = prefix ? `${prefix}_${nodeType}_${locationStr}` : `${nodeType}_${locationStr}`;

    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString(36);
    return `${baseId}_${timestamp}`;
  }

  /**
   * Traverse AST nodes using the visitor pattern with shared traverser.
   * Eliminates code duplication by using consistent traversal logic.
   * 
   * @param node The root node to traverse
   * @param visitor The visitor function to apply to each node
   * @throws ASTError if traversal fails
   */
  protected traverse(node: Node, visitor: NodeVisitor): void {
    try {
      this.validateNode(node);
      this.traverser.traverse(node, visitor);
    } catch (error) {
      if (ValidationUtils.isASTError(error)) {
        throw new ASTError(
          `Traversal failed in ${this.constructor.name}: ${error.message}`,
          this.constructor.name,
          error.sourceLocation
        );
      }
      throw new ASTError(
        `Traversal failed in ${this.constructor.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.constructor.name
      );
    }
  }

  /**
   * Collect nodes of specific types during traversal.
   * Provides a common pattern for type-specific node collection.
   * 
   * @param ast The root AST node to traverse
   * @param nodeTypePredicate Function to determine if a node should be collected
   * @returns Array of nodes that match the predicate
   */
  protected collectNodes(ast: Node, nodeTypePredicate: (node: Node) => boolean): Node[] {
    const collectedNodes: Node[] = [];

    this.traverse(ast, {
      visit: (node: Node) => {
        if (nodeTypePredicate(node)) {
          collectedNodes.push(node);
        }
      }
    });

    return collectedNodes;
  }

  /**
   * Extract metadata common to all extracted elements.
   * Provides consistent metadata extraction across extractors.
   * 
   * @param node The AST node to extract metadata from
   * @returns Common metadata object
   */
  protected extractCommonMetadata(node: Node): {
    id: string;
    sourceLocation: SourceLocation;
    nodeType: string;
  } {
    return {
      id: this.generateId(node),
      sourceLocation: this.extractSourceLocation(node),
      nodeType: node.type
    };
  }

  /**
   * Handle extraction errors consistently across all extractors.
   * Provides standardized error handling and recovery patterns.
   * 
   * @param error The error that occurred during extraction
   * @param context Additional context about where the error occurred
   * @param node Optional node where the error occurred for location context
   * @throws ASTError with consistent formatting and context
   */
  protected handleExtractionError(error: any, context: string, node?: Node): never {
    const sourceLocation = node ? this.extractSourceLocation(node) : undefined;

    if (ValidationUtils.isASTError(error)) {
      throw new ASTError(
        `${context} in ${this.constructor.name}: ${error.message}`,
        this.constructor.name,
        sourceLocation || error.sourceLocation
      );
    }

    throw new ASTError(
      `${context} in ${this.constructor.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      this.constructor.name,
      sourceLocation
    );
  }

  /**
   * Validate extraction results before returning.
   * Provides consistent result validation across extractors.
   * 
   * @param results The extraction results to validate
   * @param validator Optional custom validator function
   * @throws ASTError if validation fails
   */
  protected validateResults(results: T[], validator?: (result: T) => void): void {
    if (!Array.isArray(results)) {
      throw new ASTError(
        `Extraction results must be an array in ${this.constructor.name}`,
        this.constructor.name
      );
    }

    if (validator) {
      results.forEach((result, index) => {
        try {
          validator(result);
        } catch (error) {
          throw new ASTError(
            `Result validation failed at index ${index} in ${this.constructor.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            this.constructor.name
          );
        }
      });
    }
  }

  /**
   * Create a safe extraction wrapper that handles errors gracefully.
   * Provides consistent error handling for extraction operations.
   * 
   * @param extractionFn The extraction function to wrap
   * @param context Description of the extraction operation
   * @returns The wrapped extraction function
   */
  protected safeExtract<R>(
    extractionFn: () => R,
    context: string
  ): R | null {
    try {
      return extractionFn();
    } catch (error) {
      // Log the error but don't throw - allows partial extraction to continue
      console.warn(`Safe extraction failed - ${context} in ${this.constructor.name}:`, error);
      return null;
    }
  }

  /**
   * Get the extractor name for error reporting and logging.
   * Provides consistent naming across all extractors.
   * 
   * @returns The name of the extractor class
   */
  protected getExtractorName(): string {
    return this.constructor.name;
  }

  /**
   * Check if the extractor can handle a specific AST node type.
   * Allows extractors to declare their supported node types.
   * Default implementation returns true - subclasses can override for specificity.
   * 
   * @param node The AST node to check
   * @returns true if the extractor can handle this node type
   */
  protected canHandle(_node: Node): boolean {
    return true;
  }

  /**
   * Pre-process an AST before extraction.
   * Allows extractors to perform setup or validation before extraction.
   * Default implementation validates the root node.
   * 
   * @param ast The AST to pre-process
   * @throws ASTError if pre-processing fails
   */
  protected preProcess(ast: Node): void {
    this.validateNode(ast);
  }

  /**
   * Post-process extraction results.
   * Allows extractors to perform cleanup or additional processing after extraction.
   * Default implementation validates the results.
   * 
   * @param results The extraction results to post-process
   * @returns The processed results
   */
  protected postProcess(results: T[]): T[] {
    this.validateResults(results);
    return results;
  }

  /**
   * Template method that orchestrates the complete extraction process.
   * Follows Template Method pattern - defines the algorithm structure.
   * Subclasses can override individual steps while maintaining the overall flow.
   * 
   * @param ast The root AST node to extract from
   * @returns Array of extracted elements
   */
  public extractWithTemplate(ast: Node): T[] {
    try {
      // Pre-processing phase
      this.preProcess(ast);

      // Main extraction phase (implemented by subclasses)
      const results = this.extract(ast);

      // Post-processing phase
      return this.postProcess(results);

    } catch (error) {
      this.handleExtractionError(error, 'Template extraction failed', ast);
    }
  }
}