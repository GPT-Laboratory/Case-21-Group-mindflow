import { Node } from '@babel/types';
import { SourceLocation, CommentMetadata, ParsedFileStructure } from '../types/ASTTypes';

/**
 * Core abstraction for AST extraction operations.
 * Follows Single Responsibility Principle - each extractor handles one type of extraction.
 * Supports Open/Closed Principle - new extractors can be added without modifying existing ones.
 */
export interface ASTExtractor<T> {
  /**
   * Extract specific elements from an AST node.
   * @param ast The root AST node to extract from
   * @returns Array of extracted elements of type T
   */
  extract(ast: Node): T[];
}

/**
 * Core abstraction for AST parsing operations.
 * Follows Dependency Inversion Principle - high-level modules depend on this abstraction.
 * Supports Liskov Substitution Principle - different parser implementations are interchangeable.
 */
export interface ASTParser {
  /**
   * Parse source code into an AST.
   * @param code The source code to parse
   * @returns The root AST node
   * @throws ASTError if parsing fails
   */
  parse(code: string): Node;
}

/**
 * Core abstraction for AST traversal operations.
 * Eliminates code duplication by providing shared traversal logic.
 * Follows Single Responsibility Principle - only handles traversal.
 */
export interface ASTTraverser {
  /**
   * Traverse an AST node using the visitor pattern.
   * @param node The root node to traverse
   * @param visitor The visitor to apply to each node
   */
  traverse(node: Node, visitor: NodeVisitor): void;
}

/**
 * Visitor pattern interface for AST node processing.
 * Follows Interface Segregation Principle - minimal, focused interface.
 * Enables flexible node processing without modifying traversal logic.
 */
export interface NodeVisitor {
  /**
   * Visit a single AST node.
   * @param node The node to visit
   */
  visit(node: Node): void;
}

/**
 * Specialized interface for parameter extraction operations.
 * Follows Interface Segregation Principle - clients only depend on methods they use.
 * Separates parameter extraction concerns from general extraction.
 */
export interface ParameterExtractor {
  /**
   * Extract parameter metadata from function parameters.
   * @param params Array of parameter nodes
   * @returns Array of parameter metadata
   */
  extractParameters(params: any[]): ParameterMetadata[];
}

/**
 * Specialized interface for comment processing operations.
 * Follows Interface Segregation Principle - focused on comment-specific operations.
 * Separates comment processing from general extraction concerns.
 */
export interface CommentProcessor {
  /**
   * Process comments associated with an AST node.
   * @param node The node to process comments for
   * @returns Array of comment metadata
   */
  processComments(node: Node): CommentMetadata[];
}

/**
 * Interface for syntax validation operations.
 * Follows Single Responsibility Principle - only handles validation.
 * Separates validation concerns from parsing operations.
 */
export interface SyntaxValidator {
  /**
   * Validate the syntax of source code.
   * @param code The source code to validate
   * @returns true if syntax is valid, false otherwise
   */
  validateSyntax(code: string): boolean;
}

// Enhanced metadata interfaces for the new architecture

/**
 * Enhanced parameter metadata with additional validation and type information.
 */
export interface ParameterMetadata {
  name: string;
  type: string;
  defaultValue?: string;
  isOptional: boolean;
  sourceLocation: SourceLocation;
  description?: string;
}

/**
 * Enhanced comment metadata with position and processing information.
 * Extends the existing CommentMetadata interface with additional fields.
 */
export interface EnhancedCommentMetadata {
  text: string;
  type: 'block' | 'line';
  position: 'leading' | 'trailing' | 'inner';
  sourceLocation: SourceLocation;
  associatedFunction?: string;
  tags?: string[]; // For JSDoc-style tags
}

/**
 * Interface for AST node validation operations.
 * Provides consistent validation patterns across all components.
 */
export interface NodeValidator {
  /**
   * Validate that an object is a valid AST node.
   * @param node The object to validate
   * @param expectedType Optional expected node type
   * @throws ASTError if validation fails
   */
  validateNode(node: any, expectedType?: string): void;
  
  /**
   * Validate an array of parameters.
   * @param params The parameters to validate
   * @throws ASTError if validation fails
   */
  validateParameters(params: any[]): void;
}

/**
 * Interface for source code validation operations.
 * Separates code validation from parsing concerns.
 */
export interface CodeValidator {
  /**
   * Validate source code before parsing.
   * @param code The source code to validate
   * @throws ASTError if validation fails
   */
  validateSourceCode(code: string): void;
}

/**
 * Interface for AST parser service operations.
 * Follows Dependency Inversion Principle - high-level modules depend on this abstraction.
 * Coordinates parsing and extraction operations without handling implementation details.
 */
export interface ASTParserServiceInterface {
  /**
   * Parse a file and extract all relevant metadata.
   * @param code The source code to parse
   * @returns Parsed file structure with all extracted metadata
   * @throws ASTError if parsing or extraction fails
   */
  parseFile(code: string): ParsedFileStructure;
}