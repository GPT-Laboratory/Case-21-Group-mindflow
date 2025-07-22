import { CommentMetadata } from '../types/ASTTypes';

export class CommentExtractor {
  /**
   * Extract and clean comments from AST
   */
  extractComments(ast: any): CommentMetadata[] {
    const comments: CommentMetadata[] = [];
    
    if (ast && ast.comments) {
      ast.comments.forEach((comment: any) => {
        let cleanValue = comment.value.trim();
        
        // Clean JSDoc-style comments
        if (comment.type === 'CommentBlock') {
          cleanValue = this.cleanJSDocComment(cleanValue);
        }
        
        comments.push({
          type: comment.type === 'CommentBlock' ? 'block' : 'line',
          value: cleanValue,
          sourceLocation: {
            start: { line: comment.loc.start.line, column: comment.loc.start.column },
            end: { line: comment.loc.end.line, column: comment.loc.end.column }
          }
        });
      });
    }
    
    return comments;
  }

  /**
   * Clean JSDoc-style comment formatting
   */
  private cleanJSDocComment(value: string): string {
    return value
      .split('\n')
      .map(line => line.replace(/^\s*\*\s?/, '').trim())
      .filter(line => line.length > 0)
      .join('\n')
      .trim();
  }

  /**
   * Find function description from preceding block comment
   */
  findFunctionDescription(comments: CommentMetadata[], functionLocation: { start: { line: number; column: number }; end: { line: number; column: number } }, functionName: string): string {
    // Find the closest preceding block comment
    const precedingComments = comments.filter(comment => 
      comment.type === 'block' && 
      comment.sourceLocation.end.line < functionLocation.start.line
    );
    
    if (precedingComments.length > 0) {
      // Get the closest comment (highest line number)
      const closestComment = precedingComments.reduce((closest, current) => 
        current.sourceLocation.end.line > closest.sourceLocation.end.line ? current : closest
      );
      
      // Mark this comment as associated with the function
      closestComment.associatedFunction = functionName;
      
      return closestComment.value;
    }
    
    return '';
  }
}