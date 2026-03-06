import { CommentMetadata, SourceLocation } from '../types/ASTTypes';
import { SourceLocationUtils } from './SourceLocationUtils';

/**
 * Shared utility class for comment processing logic
 * Eliminates code duplication across extractors
 */
export class CommentUtils {
  /**
   * Extract and clean comments from AST
   */
  static extractComments(ast: any): CommentMetadata[] {
    const comments: CommentMetadata[] = [];
    
    if (ast && ast.comments) {
      ast.comments.forEach((comment: any) => {
        comments.push(this.processComment(comment));
      });
    }
    
    return comments;
  }

  /**
   * Process a single comment node
   */
  static processComment(comment: any): CommentMetadata {
    let cleanValue = comment.value.trim();
    
    // Clean JSDoc-style comments
    if (comment.type === 'CommentBlock') {
      cleanValue = this.cleanJSDocComment(cleanValue);
    }
    
    return {
      type: comment.type === 'CommentBlock' ? 'block' : 'line',
      value: cleanValue,
      sourceLocation: SourceLocationUtils.extractFromComment(comment)
    };
  }

  /**
   * Clean JSDoc-style comment formatting
   */
  static cleanJSDocComment(value: string): string {
    return value
      .split('\n')
      .map(line => line.replace(/^\s*\*\s?/, '').trim())
      .filter(line => line.length > 0)
      .join('\n')
      .trim();
  }

  /**
   * Clean single-line comment formatting
   */
  static cleanLineComment(value: string): string {
    return value.replace(/^\/\/\s?/, '').trim();
  }

  /**
   * Find function description from preceding block comment
   */
  static findFunctionDescription(
    comments: CommentMetadata[], 
    functionLocation: SourceLocation, 
    functionName: string
  ): string {
    // Find the closest preceding block comment
    const precedingComments = comments.filter(comment => 
      comment.type === 'block' && 
      SourceLocationUtils.isBefore(comment.sourceLocation, functionLocation)
    );
    
    if (precedingComments.length > 0) {
      // Get the closest comment (latest line number before function)
      const closestComment = precedingComments.reduce((closest, current) => 
        SourceLocationUtils.isAfter(current.sourceLocation, closest.sourceLocation) ? current : closest
      );
      
      // Mark this comment as associated with the function
      closestComment.associatedFunction = functionName;
      
      return closestComment.value;
    }
    
    return '';
  }

  /**
   * Find comments within a specific range
   */
  static findCommentsInRange(
    comments: CommentMetadata[], 
    startLocation: SourceLocation, 
    endLocation: SourceLocation
  ): CommentMetadata[] {
    return comments.filter(comment => 
      SourceLocationUtils.isWithinRange(comment.sourceLocation, startLocation, endLocation)
    );
  }

  /**
   * Group comments by their associated functions
   */
  static groupCommentsByFunction(comments: CommentMetadata[]): Map<string, CommentMetadata[]> {
    const grouped = new Map<string, CommentMetadata[]>();
    
    comments.forEach(comment => {
      if (comment.associatedFunction) {
        const existing = grouped.get(comment.associatedFunction) || [];
        existing.push(comment);
        grouped.set(comment.associatedFunction, existing);
      }
    });
    
    return grouped;
  }

  /**
   * Check if a comment is a JSDoc comment
   */
  static isJSDocComment(comment: CommentMetadata): boolean {
    return comment.type === 'block' && 
           (comment.value.startsWith('*') || comment.value.includes('@'));
  }

  /**
   * Extract JSDoc tags from a comment
   */
  static extractJSDocTags(comment: CommentMetadata): Map<string, string[]> {
    const tags = new Map<string, string[]>();
    
    if (!this.isJSDocComment(comment)) {
      return tags;
    }
    
    const lines = comment.value.split('\n');
    let currentTag: string | null = null;
    let currentContent: string[] = [];
    
    lines.forEach(line => {
      const tagMatch = line.match(/^\s*@(\w+)\s*(.*)/);
      
      if (tagMatch) {
        // Save previous tag if exists
        if (currentTag) {
          tags.set(currentTag, currentContent);
        }
        
        // Start new tag
        currentTag = tagMatch[1];
        currentContent = tagMatch[2] ? [tagMatch[2]] : [];
      } else if (currentTag && line.trim()) {
        // Continue current tag content
        currentContent.push(line.trim());
      }
    });
    
    // Save last tag
    if (currentTag) {
      tags.set(currentTag, currentContent);
    }
    
    return tags;
  }

  /**
   * Get the main description from a JSDoc comment (before any tags)
   */
  static getJSDocDescription(comment: CommentMetadata): string {
    if (!this.isJSDocComment(comment)) {
      return comment.value;
    }
    
    const lines = comment.value.split('\n');
    const descriptionLines: string[] = [];
    
    for (const line of lines) {
      if (line.trim().startsWith('@')) {
        break;
      }
      descriptionLines.push(line.trim());
    }
    
    return descriptionLines.join('\n').trim();
  }

  /**
   * Check if a comment is likely a TODO comment
   */
  static isTodoComment(comment: CommentMetadata): boolean {
    const todoKeywords = ['TODO', 'FIXME', 'HACK', 'NOTE', 'BUG'];
    const upperValue = comment.value.toUpperCase();
    return todoKeywords.some(keyword => upperValue.includes(keyword));
  }

  /**
   * Extract TODO items from comments
   */
  static extractTodoItems(comments: CommentMetadata[]): Array<{
    type: string;
    content: string;
    location: SourceLocation;
  }> {
    const todos: Array<{
      type: string;
      content: string;
      location: SourceLocation;
    }> = [];
    
    comments.forEach(comment => {
      if (this.isTodoComment(comment)) {
        const todoKeywords = ['TODO', 'FIXME', 'HACK', 'NOTE', 'BUG'];
        const upperValue = comment.value.toUpperCase();
        
        for (const keyword of todoKeywords) {
          if (upperValue.includes(keyword)) {
            todos.push({
              type: keyword,
              content: comment.value,
              location: comment.sourceLocation
            });
            break;
          }
        }
      }
    });
    
    return todos;
  }

  /**
   * Validate comment structure
   */
  static validateComment(comment: any): boolean {
    if (!comment || typeof comment !== 'object') {
      return false;
    }
    
    if (typeof comment.value !== 'string') {
      return false;
    }
    
    if (comment.type !== 'CommentBlock' && comment.type !== 'CommentLine') {
      return false;
    }
    
    if (!comment.loc) {
      return false;
    }
    
    return true;
  }

  /**
   * Sort comments by their source location
   */
  static sortCommentsByLocation(comments: CommentMetadata[]): CommentMetadata[] {
    return comments.sort((a, b) => SourceLocationUtils.compare(a.sourceLocation, b.sourceLocation));
  }
}