import { Node } from '@babel/types';
import { CommentMetadata } from '../types/ASTTypes';
import { BaseExtractor } from '../core/BaseExtractor';
import { ASTTraverser } from '../core/ASTTraverser';
import { CommentUtils } from '../utils/CommentUtils';
import { SourceLocationUtils } from '../utils/SourceLocationUtils';
import { ValidationUtils, ASTError } from '../utils/ValidationUtils';

/**
 * CommentExtractor refactored to follow SOLID principles and use new architecture.
 * Extends BaseExtractor and implements ASTExtractor interface.
 * Uses shared ASTTraverser for consistent traversal logic.
 * Uses CommentUtils and SourceLocationUtils for consistent processing.
 * Implements proper error handling patterns.
 * Uses visitor pattern for AST traversal.
 * 
 * Requirements addressed:
 * - 1.2: Single Responsibility Principle - only handles comment extraction
 * - 6.1: Eliminates code duplication by using shared traversal logic
 * - 6.3: Uses shared comment processing utilities
 * - 8.4: Implements proper error handling patterns
 * - 9.2: Supports dependency injection for testing
 */
export class CommentExtractor extends BaseExtractor<CommentMetadata> {
  /**
   * Create a new CommentExtractor instance with dependency injection.
   * 
   * @param traverser The ASTTraverser instance for consistent traversal logic
   */
  constructor(traverser: ASTTraverser) {
    super(traverser);
  }

  /**
   * Extract comments from an AST node using the new architecture.
   * Follows the visitor pattern and uses shared utilities.
   * 
   * @param ast The root AST node to extract comments from
   * @returns Array of comment metadata
   * @throws ASTError if extraction fails
   */
  extract(ast: Node): CommentMetadata[] {
    try {
      // Pre-process the AST
      this.preProcess(ast);

      const comments: CommentMetadata[] = [];

      // Extract comments from the AST root if they exist
      if (this.hasComments(ast)) {
        const rootComments = this.extractRootComments(ast);
        comments.push(...rootComments);
      }

      // Traverse the AST to find comments attached to nodes
      this.traverse(ast, {
        visit: (node: Node) => {
          try {
            const nodeComments = this.extractNodeComments(node);
            comments.push(...nodeComments);
          } catch (error) {
            // Log error but continue extraction for other nodes
            console.warn(`Failed to extract comments from node ${node.type}:`, error);
          }
        }
      });

      // Post-process and validate results
      const processedComments = this.postProcess(comments);
      
      // Remove duplicates that might occur from different extraction methods
      return this.removeDuplicateComments(processedComments);

    } catch (error) {
      this.handleExtractionError(error, 'Comment extraction failed', ast);
    }
  }

  /**
   * Check if an AST node has comments attached.
   * 
   * @param ast The AST node to check
   * @returns true if the node has comments, false otherwise
   */
  private hasComments(ast: any): boolean {
    return ast && (
      (ast.comments && Array.isArray(ast.comments) && ast.comments.length > 0) ||
      (ast.leadingComments && Array.isArray(ast.leadingComments) && ast.leadingComments.length > 0) ||
      (ast.trailingComments && Array.isArray(ast.trailingComments) && ast.trailingComments.length > 0) ||
      (ast.innerComments && Array.isArray(ast.innerComments) && ast.innerComments.length > 0)
    );
  }

  /**
   * Extract comments from the root AST node.
   * Uses CommentUtils for consistent processing.
   * 
   * @param ast The root AST node
   * @returns Array of comment metadata from the root
   */
  private extractRootComments(ast: any): CommentMetadata[] {
    const comments: CommentMetadata[] = [];

    try {
      // Extract comments from the root AST (typically from Babel parser)
      if (ast.comments && Array.isArray(ast.comments)) {
        ast.comments.forEach((comment: any) => {
          if (this.isValidComment(comment)) {
            const processedComment = this.processComment(comment);
            if (processedComment) {
              comments.push(processedComment);
            }
          }
        });
      }
    } catch (error) {
      throw new ASTError(
        `Failed to extract root comments: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.getExtractorName()
      );
    }

    return comments;
  }

  /**
   * Extract comments attached to a specific AST node.
   * Uses CommentUtils for consistent processing.
   * 
   * @param node The AST node to extract comments from
   * @returns Array of comment metadata from the node
   */
  private extractNodeComments(node: Node): CommentMetadata[] {
    const comments: CommentMetadata[] = [];

    try {
      const nodeAny = node as any;

      // Extract leading comments
      if (nodeAny.leadingComments && Array.isArray(nodeAny.leadingComments)) {
        nodeAny.leadingComments.forEach((comment: any) => {
          if (this.isValidComment(comment)) {
            const processedComment = this.processComment(comment, 'leading');
            if (processedComment) {
              comments.push(processedComment);
            }
          }
        });
      }

      // Extract trailing comments
      if (nodeAny.trailingComments && Array.isArray(nodeAny.trailingComments)) {
        nodeAny.trailingComments.forEach((comment: any) => {
          if (this.isValidComment(comment)) {
            const processedComment = this.processComment(comment, 'trailing');
            if (processedComment) {
              comments.push(processedComment);
            }
          }
        });
      }

      // Extract inner comments (for block statements, etc.)
      if (nodeAny.innerComments && Array.isArray(nodeAny.innerComments)) {
        nodeAny.innerComments.forEach((comment: any) => {
          if (this.isValidComment(comment)) {
            const processedComment = this.processComment(comment, 'inner');
            if (processedComment) {
              comments.push(processedComment);
            }
          }
        });
      }

    } catch (error) {
      throw new ASTError(
        `Failed to extract node comments: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.getExtractorName(),
        this.extractSourceLocation(node)
      );
    }

    return comments;
  }

  /**
   * Process a single comment using CommentUtils.
   * 
   * @param comment The raw comment object
   * @param position The position of the comment relative to its node
   * @returns Processed comment metadata or null if processing fails
   */
  private processComment(comment: any, position?: 'leading' | 'trailing' | 'inner'): CommentMetadata | null {
    try {
      // Validate the comment structure
      if (!this.isValidComment(comment)) {
        return null;
      }

      // Use CommentUtils for consistent processing
      const baseComment = CommentUtils.processComment(comment);

      // Add position information if provided
      const processedComment: CommentMetadata = {
        ...baseComment,
        // Add position as additional metadata if needed
        ...(position && { position })
      };

      // Validate the processed comment
      ValidationUtils.validateCommentMetadata(processedComment);

      return processedComment;

    } catch (error) {
      // Log warning but don't throw - allows partial extraction to continue
      console.warn(`Failed to process comment:`, error);
      return null;
    }
  }

  /**
   * Validate that a comment object has the required structure.
   * 
   * @param comment The comment object to validate
   * @returns true if the comment is valid, false otherwise
   */
  private isValidComment(comment: any): boolean {
    try {
      return CommentUtils.validateComment(comment);
    } catch (error) {
      return false;
    }
  }

  /**
   * Remove duplicate comments that might occur from different extraction methods.
   * 
   * @param comments Array of comment metadata
   * @returns Array with duplicates removed
   */
  private removeDuplicateComments(comments: CommentMetadata[]): CommentMetadata[] {
    const seen = new Set<string>();
    const unique: CommentMetadata[] = [];

    for (const comment of comments) {
      // Create a unique key based on content and location
      const key = `${comment.type}:${comment.value}:${SourceLocationUtils.toString(comment.sourceLocation)}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(comment);
      }
    }

    return unique;
  }

  /**
   * Find function description from preceding block comment.
   * Uses CommentUtils for consistent processing.
   * 
   * @param comments Array of comment metadata
   * @param functionLocation Source location of the function
   * @param functionName Name of the function
   * @returns Function description or empty string if not found
   */
  findFunctionDescription(
    comments: CommentMetadata[], 
    functionLocation: { start: { line: number; column: number }; end: { line: number; column: number } }, 
    functionName: string
  ): string {
    try {
      // Convert the function location to our SourceLocation format
      const sourceLocation = {
        start: functionLocation.start,
        end: functionLocation.end
      };

      // Use CommentUtils for consistent processing
      return CommentUtils.findFunctionDescription(comments, sourceLocation, functionName);

    } catch (error) {
      // Log error but return empty string to maintain backward compatibility
      console.warn(`Failed to find function description for ${functionName}:`, error);
      return '';
    }
  }

  /**
   * Extract comments from AST (legacy method for backward compatibility).
   * Delegates to the new extract method.
   * 
   * @param ast The AST to extract comments from
   * @returns Array of comment metadata
   * @deprecated Use extract() method instead
   */
  extractComments(ast: any): CommentMetadata[] {
    try {
      // Convert to Node if needed and delegate to new extract method
      if (this.isValidNode(ast)) {
        return this.extract(ast);
      } else {
        // Handle legacy AST format
        return this.extractLegacyComments(ast);
      }
    } catch (error) {
      this.handleExtractionError(error, 'Legacy comment extraction failed');
    }
  }

  /**
   * Extract comments from legacy AST format.
   * Maintains backward compatibility with existing code.
   * 
   * @param ast The legacy AST object
   * @returns Array of comment metadata
   */
  private extractLegacyComments(ast: any): CommentMetadata[] {
    const comments: CommentMetadata[] = [];
    
    try {
      if (ast && ast.comments && Array.isArray(ast.comments)) {
        ast.comments.forEach((comment: any) => {
          if (this.isValidComment(comment)) {
            const processedComment = this.processComment(comment);
            if (processedComment) {
              comments.push(processedComment);
            }
          }
        });
      }
    } catch (error) {
      throw new ASTError(
        `Failed to extract legacy comments: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.getExtractorName()
      );
    }
    
    return comments;
  }

  /**
   * Override canHandle to specify that this extractor handles comment extraction.
   * 
   * @param node The AST node to check
   * @returns true if the extractor can handle this node type
   */
  protected canHandle(node: Node): boolean {
    // CommentExtractor can handle any node type since comments can be attached to any node
    return true;
  }

  /**
   * Override postProcess to add comment-specific validation and sorting.
   * 
   * @param results The extraction results to post-process
   * @returns The processed results
   */
  protected postProcess(results: CommentMetadata[]): CommentMetadata[] {
    // Call parent post-processing
    const processedResults = super.postProcess(results);

    // Add comment-specific post-processing
    try {
      // Validate all comments
      processedResults.forEach(comment => {
        ValidationUtils.validateCommentMetadata(comment);
      });

      // Sort comments by source location for consistent ordering
      return CommentUtils.sortCommentsByLocation(processedResults);

    } catch (error) {
      throw new ASTError(
        `Comment post-processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.getExtractorName()
      );
    }
  }
}