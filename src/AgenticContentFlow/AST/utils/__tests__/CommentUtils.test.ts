import { CommentUtils } from '../CommentUtils';
import { CommentMetadata, SourceLocation } from '../../types/ASTTypes';
import { describe, expect, it } from 'vitest';

describe('CommentUtils', () => {
  const createSourceLocation = (startLine: number, startColumn: number, endLine: number, endColumn: number): SourceLocation => ({
    start: { line: startLine, column: startColumn },
    end: { line: endLine, column: endColumn }
  });

  const createMockComment = (type: string, value: string, startLine: number, startColumn: number, endLine: number, endColumn: number) => ({
    type,
    value,
    loc: {
      start: { line: startLine, column: startColumn },
      end: { line: endLine, column: endColumn }
    }
  });

  describe('extractComments', () => {
    it('should extract comments from AST', () => {
      const ast = {
        comments: [
          createMockComment('CommentBlock', ' This is a block comment ', 1, 0, 1, 27),
          createMockComment('CommentLine', ' This is a line comment', 2, 0, 2, 25)
        ]
      };

      const comments = CommentUtils.extractComments(ast);
      expect(comments).toHaveLength(2);
      expect(comments[0].type).toBe('block');
      expect(comments[0].value).toBe('This is a block comment');
      expect(comments[1].type).toBe('line');
      expect(comments[1].value).toBe('This is a line comment');
    });

    it('should return empty array for AST without comments', () => {
      const ast = {};
      const comments = CommentUtils.extractComments(ast);
      expect(comments).toEqual([]);
    });

    it('should return empty array for null AST', () => {
      const comments = CommentUtils.extractComments(null);
      expect(comments).toEqual([]);
    });
  });

  describe('processComment', () => {
    it('should process block comment', () => {
      const comment = createMockComment('CommentBlock', ' Test comment ', 1, 0, 1, 15);
      const result = CommentUtils.processComment(comment);

      expect(result).toEqual({
        type: 'block',
        value: 'Test comment',
        sourceLocation: createSourceLocation(1, 0, 1, 15)
      });
    });

    it('should process line comment', () => {
      const comment = createMockComment('CommentLine', ' Test comment', 1, 0, 1, 14);
      const result = CommentUtils.processComment(comment);

      expect(result).toEqual({
        type: 'line',
        value: 'Test comment',
        sourceLocation: createSourceLocation(1, 0, 1, 14)
      });
    });

    it('should clean JSDoc-style block comments', () => {
      const comment = createMockComment('CommentBlock', '*\n * This is a JSDoc comment\n * @param test\n ', 1, 0, 3, 1);
      const result = CommentUtils.processComment(comment);

      expect(result.value).toBe('This is a JSDoc comment\n@param test');
    });
  });

  describe('cleanJSDocComment', () => {
    it('should clean JSDoc formatting', () => {
      const value = '*\n * This is a description\n * @param {string} name - The name\n * @returns {boolean} result\n ';
      const cleaned = CommentUtils.cleanJSDocComment(value);
      
      expect(cleaned).toBe('This is a description\n@param {string} name - The name\n@returns {boolean} result');
    });

    it('should handle single line JSDoc', () => {
      const value = '* Single line comment';
      const cleaned = CommentUtils.cleanJSDocComment(value);
      
      expect(cleaned).toBe('Single line comment');
    });

    it('should handle empty JSDoc', () => {
      const value = '*\n *\n ';
      const cleaned = CommentUtils.cleanJSDocComment(value);
      
      expect(cleaned).toBe('');
    });
  });

  describe('cleanLineComment', () => {
    it('should clean line comment formatting', () => {
      const value = '// This is a line comment';
      const cleaned = CommentUtils.cleanLineComment(value);
      
      expect(cleaned).toBe('This is a line comment');
    });

    it('should handle line comment without space', () => {
      const value = '//This is a line comment';
      const cleaned = CommentUtils.cleanLineComment(value);
      
      expect(cleaned).toBe('This is a line comment');
    });

    it('should handle already clean line comment', () => {
      const value = 'This is a line comment';
      const cleaned = CommentUtils.cleanLineComment(value);
      
      expect(cleaned).toBe('This is a line comment');
    });
  });

  describe('findFunctionDescription', () => {
    it('should find preceding block comment for function', () => {
      const comments: CommentMetadata[] = [
        {
          type: 'block',
          value: 'This describes the function',
          sourceLocation: createSourceLocation(1, 0, 1, 28)
        },
        {
          type: 'line',
          value: 'This is not relevant',
          sourceLocation: createSourceLocation(2, 0, 2, 21)
        }
      ];

      const functionLocation = createSourceLocation(3, 0, 5, 1);
      const description = CommentUtils.findFunctionDescription(comments, functionLocation, 'testFunction');

      expect(description).toBe('This describes the function');
      expect(comments[0].associatedFunction).toBe('testFunction');
    });

    it('should return empty string when no preceding comment found', () => {
      const comments: CommentMetadata[] = [
        {
          type: 'block',
          value: 'This comes after',
          sourceLocation: createSourceLocation(5, 0, 5, 17)
        }
      ];

      const functionLocation = createSourceLocation(3, 0, 4, 1);
      const description = CommentUtils.findFunctionDescription(comments, functionLocation, 'testFunction');

      expect(description).toBe('');
    });

    it('should find closest preceding comment', () => {
      const comments: CommentMetadata[] = [
        {
          type: 'block',
          value: 'Far comment',
          sourceLocation: createSourceLocation(1, 0, 1, 12)
        },
        {
          type: 'block',
          value: 'Close comment',
          sourceLocation: createSourceLocation(2, 0, 2, 14)
        }
      ];

      const functionLocation = createSourceLocation(3, 0, 4, 1);
      const description = CommentUtils.findFunctionDescription(comments, functionLocation, 'testFunction');

      expect(description).toBe('Close comment');
    });
  });

  describe('findCommentsInRange', () => {
    it('should find comments within range', () => {
      const comments: CommentMetadata[] = [
        {
          type: 'block',
          value: 'Before range',
          sourceLocation: createSourceLocation(1, 0, 1, 12)
        },
        {
          type: 'block',
          value: 'In range',
          sourceLocation: createSourceLocation(3, 0, 3, 8)
        },
        {
          type: 'block',
          value: 'After range',
          sourceLocation: createSourceLocation(6, 0, 6, 11)
        }
      ];

      const startLocation = createSourceLocation(2, 0, 2, 0);
      const endLocation = createSourceLocation(5, 0, 5, 0);
      const inRange = CommentUtils.findCommentsInRange(comments, startLocation, endLocation);

      expect(inRange).toHaveLength(1);
      expect(inRange[0].value).toBe('In range');
    });
  });

  describe('groupCommentsByFunction', () => {
    it('should group comments by associated function', () => {
      const comments: CommentMetadata[] = [
        {
          type: 'block',
          value: 'Function A comment',
          sourceLocation: createSourceLocation(1, 0, 1, 18),
          associatedFunction: 'functionA'
        },
        {
          type: 'block',
          value: 'Function B comment',
          sourceLocation: createSourceLocation(3, 0, 3, 18),
          associatedFunction: 'functionB'
        },
        {
          type: 'block',
          value: 'Another Function A comment',
          sourceLocation: createSourceLocation(5, 0, 5, 26),
          associatedFunction: 'functionA'
        }
      ];

      const grouped = CommentUtils.groupCommentsByFunction(comments);

      expect(grouped.size).toBe(2);
      expect(grouped.get('functionA')).toHaveLength(2);
      expect(grouped.get('functionB')).toHaveLength(1);
    });
  });

  describe('isJSDocComment', () => {
    it('should return true for JSDoc comments starting with *', () => {
      const comment: CommentMetadata = {
        type: 'block',
        value: '* This is JSDoc',
        sourceLocation: createSourceLocation(1, 0, 1, 15)
      };

      expect(CommentUtils.isJSDocComment(comment)).toBe(true);
    });

    it('should return true for JSDoc comments with tags', () => {
      const comment: CommentMetadata = {
        type: 'block',
        value: 'This has @param tag',
        sourceLocation: createSourceLocation(1, 0, 1, 19)
      };

      expect(CommentUtils.isJSDocComment(comment)).toBe(true);
    });

    it('should return false for line comments', () => {
      const comment: CommentMetadata = {
        type: 'line',
        value: 'This is a line comment',
        sourceLocation: createSourceLocation(1, 0, 1, 22)
      };

      expect(CommentUtils.isJSDocComment(comment)).toBe(false);
    });

    it('should return false for regular block comments', () => {
      const comment: CommentMetadata = {
        type: 'block',
        value: 'Regular block comment',
        sourceLocation: createSourceLocation(1, 0, 1, 21)
      };

      expect(CommentUtils.isJSDocComment(comment)).toBe(false);
    });
  });

  describe('extractJSDocTags', () => {
    it('should extract JSDoc tags', () => {
      const comment: CommentMetadata = {
        type: 'block',
        value: 'Description\n@param {string} name - The name\n@returns {boolean} result\n@throws {Error} When invalid',
        sourceLocation: createSourceLocation(1, 0, 4, 1)
      };

      const tags = CommentUtils.extractJSDocTags(comment);

      expect(tags.size).toBe(3);
      expect(tags.get('param')).toEqual(['{string} name - The name']);
      expect(tags.get('returns')).toEqual(['{boolean} result']);
      expect(tags.get('throws')).toEqual(['{Error} When invalid']);
    });

    it('should handle multi-line tag content', () => {
      const comment: CommentMetadata = {
        type: 'block',
        value: '@param {Object} options\n  The configuration object\n  with multiple properties',
        sourceLocation: createSourceLocation(1, 0, 3, 1)
      };

      const tags = CommentUtils.extractJSDocTags(comment);

      expect(tags.get('param')).toEqual([
        '{Object} options',
        'The configuration object',
        'with multiple properties'
      ]);
    });

    it('should return empty map for non-JSDoc comments', () => {
      const comment: CommentMetadata = {
        type: 'line',
        value: 'Regular comment',
        sourceLocation: createSourceLocation(1, 0, 1, 15)
      };

      const tags = CommentUtils.extractJSDocTags(comment);
      expect(tags.size).toBe(0);
    });
  });

  describe('getJSDocDescription', () => {
    it('should extract description before tags', () => {
      const comment: CommentMetadata = {
        type: 'block',
        value: 'This is the description\nof the function\n@param name The parameter',
        sourceLocation: createSourceLocation(1, 0, 3, 1)
      };

      const description = CommentUtils.getJSDocDescription(comment);
      expect(description).toBe('This is the description\nof the function');
    });

    it('should return full value for non-JSDoc comments', () => {
      const comment: CommentMetadata = {
        type: 'line',
        value: 'Regular comment',
        sourceLocation: createSourceLocation(1, 0, 1, 15)
      };

      const description = CommentUtils.getJSDocDescription(comment);
      expect(description).toBe('Regular comment');
    });
  });

  describe('isTodoComment', () => {
    it('should return true for TODO comments', () => {
      const comment: CommentMetadata = {
        type: 'line',
        value: 'TODO: Fix this later',
        sourceLocation: createSourceLocation(1, 0, 1, 20)
      };

      expect(CommentUtils.isTodoComment(comment)).toBe(true);
    });

    it('should return true for FIXME comments', () => {
      const comment: CommentMetadata = {
        type: 'line',
        value: 'FIXME: This is broken',
        sourceLocation: createSourceLocation(1, 0, 1, 21)
      };

      expect(CommentUtils.isTodoComment(comment)).toBe(true);
    });

    it('should return false for regular comments', () => {
      const comment: CommentMetadata = {
        type: 'line',
        value: 'Regular comment',
        sourceLocation: createSourceLocation(1, 0, 1, 15)
      };

      expect(CommentUtils.isTodoComment(comment)).toBe(false);
    });
  });

  describe('extractTodoItems', () => {
    it('should extract TODO items from comments', () => {
      const comments: CommentMetadata[] = [
        {
          type: 'line',
          value: 'TODO: Fix this',
          sourceLocation: createSourceLocation(1, 0, 1, 14)
        },
        {
          type: 'line',
          value: 'FIXME: Broken code',
          sourceLocation: createSourceLocation(2, 0, 2, 18)
        },
        {
          type: 'line',
          value: 'Regular comment',
          sourceLocation: createSourceLocation(3, 0, 3, 15)
        }
      ];

      const todos = CommentUtils.extractTodoItems(comments);

      expect(todos).toHaveLength(2);
      expect(todos[0]).toEqual({
        type: 'TODO',
        content: 'TODO: Fix this',
        location: createSourceLocation(1, 0, 1, 14)
      });
      expect(todos[1]).toEqual({
        type: 'FIXME',
        content: 'FIXME: Broken code',
        location: createSourceLocation(2, 0, 2, 18)
      });
    });
  });

  describe('validateComment', () => {
    it('should return true for valid comment', () => {
      const comment = createMockComment('CommentBlock', 'Test', 1, 0, 1, 4);
      expect(CommentUtils.validateComment(comment)).toBe(true);
    });

    it('should return false for null comment', () => {
      expect(CommentUtils.validateComment(null)).toBe(false);
    });

    it('should return false for comment without value', () => {
      const comment = { type: 'CommentBlock', loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 4 } } };
      expect(CommentUtils.validateComment(comment)).toBe(false);
    });

    it('should return false for comment without type', () => {
      const comment = { value: 'Test', loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 4 } } };
      expect(CommentUtils.validateComment(comment)).toBe(false);
    });

    it('should return false for comment without location', () => {
      const comment = { type: 'CommentBlock', value: 'Test' };
      expect(CommentUtils.validateComment(comment)).toBe(false);
    });
  });

  describe('sortCommentsByLocation', () => {
    it('should sort comments by source location', () => {
      const comments: CommentMetadata[] = [
        {
          type: 'block',
          value: 'Third',
          sourceLocation: createSourceLocation(3, 0, 3, 5)
        },
        {
          type: 'block',
          value: 'First',
          sourceLocation: createSourceLocation(1, 0, 1, 5)
        },
        {
          type: 'block',
          value: 'Second',
          sourceLocation: createSourceLocation(2, 0, 2, 6)
        }
      ];

      const sorted = CommentUtils.sortCommentsByLocation(comments);

      expect(sorted[0].value).toBe('First');
      expect(sorted[1].value).toBe('Second');
      expect(sorted[2].value).toBe('Third');
    });
  });
});