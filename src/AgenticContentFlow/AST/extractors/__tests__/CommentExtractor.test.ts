import { Node } from '@babel/types';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CommentExtractor } from '../CommentExtractor';
import { ASTTraverser } from '../../core/ASTTraverser';
import { CommentMetadata } from '../../types/ASTTypes';
import { CommentUtils } from '../../utils/CommentUtils';
import { SourceLocationUtils } from '../../utils/SourceLocationUtils';
import { ValidationUtils, ASTError } from '../../utils/ValidationUtils';

// Mock the dependencies
vi.mock('../../core/ASTTraverser');
vi.mock('../../utils/CommentUtils');
vi.mock('../../utils/SourceLocationUtils');
vi.mock('../../utils/ValidationUtils');

describe('CommentExtractor', () => {
  let extractor: CommentExtractor;
  let mockTraverser: any;
  let mockCommentUtils: any;
  let mockSourceLocationUtils: any;
  let mockValidationUtils: any;

  beforeEach(() => {
    // Create mock traverser
    mockTraverser = {
      traverse: vi.fn(),
      getCurrentDepth: vi.fn().mockReturnValue(0),
      getMaxDepth: vi.fn().mockReturnValue(100),
      getVisitedNodeCount: vi.fn().mockReturnValue(0),
      reset: vi.fn(),
      clone: vi.fn()
    };

    // Mock static methods
    mockCommentUtils = CommentUtils as any;
    mockSourceLocationUtils = SourceLocationUtils as any;
    mockValidationUtils = ValidationUtils as any;

    // Setup default mock implementations
    mockCommentUtils.processComment = vi.fn().mockImplementation((comment: any) => ({
      type: comment.type === 'CommentBlock' ? 'block' : 'line',
      value: comment.value.trim(),
      sourceLocation: {
        start: { line: comment.loc?.start?.line || 1, column: comment.loc?.start?.column || 0 },
        end: { line: comment.loc?.end?.line || 1, column: comment.loc?.end?.column || 10 }
      }
    }));

    mockCommentUtils.validateComment = vi.fn().mockReturnValue(true);
    mockCommentUtils.sortCommentsByLocation = vi.fn().mockImplementation((comments) => comments);
    mockCommentUtils.findFunctionDescription = vi.fn().mockReturnValue('');

    mockSourceLocationUtils.extract = vi.fn().mockReturnValue({
      start: { line: 1, column: 0 },
      end: { line: 1, column: 10 }
    });

    mockSourceLocationUtils.toString = vi.fn().mockReturnValue('1:0-1:10');

    mockValidationUtils.validateNode = vi.fn().mockImplementation(() => {});
    mockValidationUtils.validateCommentMetadata = vi.fn().mockImplementation(() => {});
    mockValidationUtils.isASTError = vi.fn().mockReturnValue(false);

    // Create extractor instance
    extractor = new CommentExtractor(mockTraverser);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create CommentExtractor with traverser dependency', () => {
      expect(extractor).toBeInstanceOf(CommentExtractor);
      expect(mockTraverser).toBeDefined();
    });

    it('should throw ASTError if traverser is not provided', () => {
      mockValidationUtils.isASTError.mockReturnValue(true);
      
      expect(() => new CommentExtractor(null as any)).toThrow();
    });
  });

  describe('extract', () => {
    it('should extract comments from AST root', () => {
      const mockAST = {
        type: 'Program',
        comments: [
          {
            type: 'CommentBlock',
            value: 'This is a block comment',
            loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 25 } }
          }
        ]
      } as any;

      const expectedComment: CommentMetadata = {
        type: 'block',
        value: 'This is a block comment',
        sourceLocation: {
          start: { line: 1, column: 0 },
          end: { line: 1, column: 25 }
        }
      };

      mockCommentUtils.processComment.mockReturnValue(expectedComment);

      const result = extractor.extract(mockAST);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expectedComment);
      expect(mockCommentUtils.processComment).toHaveBeenCalledWith(mockAST.comments[0]);
    });

    it('should extract comments from AST nodes during traversal', () => {
      const mockAST = {
        type: 'Program',
        body: []
      } as any;

      const mockNode = {
        type: 'FunctionDeclaration',
        leadingComments: [
          {
            type: 'CommentLine',
            value: 'Function comment',
            loc: { start: { line: 2, column: 0 }, end: { line: 2, column: 18 } }
          }
        ]
      } as any;

      const expectedComment: CommentMetadata = {
        type: 'line',
        value: 'Function comment',
        sourceLocation: {
          start: { line: 2, column: 0 },
          end: { line: 2, column: 18 }
        },
        position: 'leading'
      } as any;

      mockCommentUtils.processComment.mockReturnValue(expectedComment);

      // Mock traverser to call visitor with the node
      mockTraverser.traverse.mockImplementation((node, visitor) => {
        visitor.visit(mockNode);
      });

      const result = extractor.extract(mockAST);

      expect(mockTraverser.traverse).toHaveBeenCalledWith(mockAST, expect.any(Object));
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expectedComment);
    });

    it('should handle nodes with trailing comments', () => {
      const mockAST = { type: 'Program', body: [] } as any;
      const mockNode = {
        type: 'VariableDeclaration',
        trailingComments: [
          {
            type: 'CommentLine',
            value: 'Trailing comment',
            loc: { start: { line: 3, column: 20 }, end: { line: 3, column: 37 } }
          }
        ]
      } as any;

      const expectedComment: CommentMetadata = {
        type: 'line',
        value: 'Trailing comment',
        sourceLocation: {
          start: { line: 3, column: 20 },
          end: { line: 3, column: 37 }
        },
        position: 'trailing'
      } as any;

      mockCommentUtils.processComment.mockReturnValue(expectedComment);

      mockTraverser.traverse.mockImplementation((node, visitor) => {
        visitor.visit(mockNode);
      });

      const result = extractor.extract(mockAST);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expectedComment);
    });

    it('should handle nodes with inner comments', () => {
      const mockAST = { type: 'Program', body: [] } as any;
      const mockNode = {
        type: 'BlockStatement',
        innerComments: [
          {
            type: 'CommentBlock',
            value: 'Inner comment',
            loc: { start: { line: 4, column: 2 }, end: { line: 4, column: 17 } }
          }
        ]
      } as any;

      const expectedComment: CommentMetadata = {
        type: 'block',
        value: 'Inner comment',
        sourceLocation: {
          start: { line: 4, column: 2 },
          end: { line: 4, column: 17 }
        },
        position: 'inner'
      } as any;

      mockCommentUtils.processComment.mockReturnValue(expectedComment);

      mockTraverser.traverse.mockImplementation((node, visitor) => {
        visitor.visit(mockNode);
      });

      const result = extractor.extract(mockAST);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expectedComment);
    });

    it('should remove duplicate comments', () => {
      const mockAST = {
        type: 'Program',
        comments: [
          {
            type: 'CommentLine',
            value: 'Duplicate comment',
            loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 18 } }
          }
        ]
      } as any;

      const mockNode = {
        type: 'FunctionDeclaration',
        leadingComments: [
          {
            type: 'CommentLine',
            value: 'Duplicate comment',
            loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 18 } }
          }
        ]
      } as any;

      const expectedComment: CommentMetadata = {
        type: 'line',
        value: 'Duplicate comment',
        sourceLocation: {
          start: { line: 1, column: 0 },
          end: { line: 1, column: 18 }
        }
      };

      mockCommentUtils.processComment.mockReturnValue(expectedComment);

      mockTraverser.traverse.mockImplementation((node, visitor) => {
        visitor.visit(mockNode);
      });

      const result = extractor.extract(mockAST);

      // Should only have one comment despite being found in both root and node
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expectedComment);
    });

    it('should handle extraction errors gracefully', () => {
      const mockAST = { type: 'Program' } as any;
      const error = new Error('Traversal failed');

      mockTraverser.traverse.mockImplementation(() => {
        throw error;
      });

      mockValidationUtils.isASTError.mockReturnValue(false);

      expect(() => extractor.extract(mockAST)).toThrow(ASTError);
    });

    it('should continue extraction when individual node processing fails', () => {
      const mockAST = { type: 'Program', body: [] } as any;
      const mockNode1 = {
        type: 'FunctionDeclaration',
        leadingComments: [{ type: 'CommentLine', value: 'Good comment' }]
      } as any;
      const mockNode2 = {
        type: 'VariableDeclaration',
        leadingComments: [{ type: 'InvalidComment' }] // This will cause processing to fail
      } as any;

      const expectedComment: CommentMetadata = {
        type: 'line',
        value: 'Good comment',
        sourceLocation: {
          start: { line: 1, column: 0 },
          end: { line: 1, column: 12 }
        },
        position: 'leading'
      } as any;

      mockCommentUtils.processComment
        .mockReturnValueOnce(expectedComment)
        .mockImplementationOnce(() => {
          throw new Error('Invalid comment');
        });

      mockCommentUtils.validateComment
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      mockTraverser.traverse.mockImplementation((node, visitor) => {
        visitor.visit(mockNode1);
        visitor.visit(mockNode2);
      });

      const result = extractor.extract(mockAST);

      // Should still extract the valid comment despite the invalid one
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expectedComment);
    });

    it('should call postProcess to sort comments', () => {
      const mockAST = { type: 'Program', body: [] } as any;
      const comments = [
        {
          type: 'line' as const,
          value: 'Comment 1',
          sourceLocation: { start: { line: 2, column: 0 }, end: { line: 2, column: 10 } }
        },
        {
          type: 'line' as const,
          value: 'Comment 2',
          sourceLocation: { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } }
        }
      ];

      mockTraverser.traverse.mockImplementation(() => {});
      mockCommentUtils.sortCommentsByLocation.mockReturnValue([comments[1], comments[0]]);

      extractor.extract(mockAST);

      expect(mockCommentUtils.sortCommentsByLocation).toHaveBeenCalled();
    });
  });

  describe('findFunctionDescription', () => {
    it('should delegate to CommentUtils.findFunctionDescription', () => {
      const comments: CommentMetadata[] = [
        {
          type: 'block',
          value: 'Function description',
          sourceLocation: { start: { line: 1, column: 0 }, end: { line: 1, column: 20 } }
        }
      ];

      const functionLocation = {
        start: { line: 2, column: 0 },
        end: { line: 4, column: 1 }
      };

      const functionName = 'testFunction';
      const expectedDescription = 'Function description';

      mockCommentUtils.findFunctionDescription.mockReturnValue(expectedDescription);

      const result = extractor.findFunctionDescription(comments, functionLocation, functionName);

      expect(mockCommentUtils.findFunctionDescription).toHaveBeenCalledWith(
        comments,
        functionLocation,
        functionName
      );
      expect(result).toBe(expectedDescription);
    });

    it('should handle errors gracefully and return empty string', () => {
      const comments: CommentMetadata[] = [];
      const functionLocation = {
        start: { line: 2, column: 0 },
        end: { line: 4, column: 1 }
      };
      const functionName = 'testFunction';

      mockCommentUtils.findFunctionDescription.mockImplementation(() => {
        throw new Error('Processing failed');
      });

      const result = extractor.findFunctionDescription(comments, functionLocation, functionName);

      expect(result).toBe('');
    });
  });

  describe('extractComments (legacy method)', () => {
    it('should delegate to extract method for valid nodes', () => {
      const mockAST = { type: 'Program', body: [] } as Node;
      const expectedComments: CommentMetadata[] = [
        {
          type: 'line',
          value: 'Test comment',
          sourceLocation: { start: { line: 1, column: 0 }, end: { line: 1, column: 12 } }
        }
      ];

      // Mock the extract method
      vi.spyOn(extractor, 'extract').mockReturnValue(expectedComments);

      const result = extractor.extractComments(mockAST);

      expect(extractor.extract).toHaveBeenCalledWith(mockAST);
      expect(result).toEqual(expectedComments);
    });

    it('should handle legacy AST format', () => {
      const legacyAST = {
        comments: [
          {
            type: 'CommentLine',
            value: 'Legacy comment',
            loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 14 } }
          }
        ]
      };

      const expectedComment: CommentMetadata = {
        type: 'line',
        value: 'Legacy comment',
        sourceLocation: {
          start: { line: 1, column: 0 },
          end: { line: 1, column: 14 }
        }
      };

      mockCommentUtils.processComment.mockReturnValue(expectedComment);

      const result = extractor.extractComments(legacyAST);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expectedComment);
    });

    it('should handle empty legacy AST', () => {
      const legacyAST = {};

      const result = extractor.extractComments(legacyAST);

      expect(result).toHaveLength(0);
    });

    it('should handle legacy extraction errors', () => {
      const legacyAST = {
        comments: [{ type: 'InvalidComment' }]
      };

      // Mock validateComment to return false for invalid comment
      mockCommentUtils.validateComment.mockReturnValue(false);
      
      // Mock processComment to return null for invalid comment
      mockCommentUtils.processComment.mockReturnValue(null);

      // This should not throw because the implementation handles invalid comments gracefully
      const result = extractor.extractComments(legacyAST);
      expect(result).toHaveLength(0);
    });
  });

  describe('canHandle', () => {
    it('should return true for any node type', () => {
      const mockNode = { type: 'FunctionDeclaration' } as Node;
      
      // Access protected method through type assertion
      const result = (extractor as any).canHandle(mockNode);
      
      expect(result).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle ASTError properly', () => {
      const mockAST = { type: 'Program' } as any;
      const astError = new ASTError('Test error', 'TestComponent');

      mockTraverser.traverse.mockImplementation(() => {
        throw astError;
      });

      mockValidationUtils.isASTError.mockReturnValue(true);

      expect(() => extractor.extract(mockAST)).toThrow(ASTError);
    });

    it('should wrap non-ASTError in ASTError', () => {
      const mockAST = { type: 'Program' } as any;
      const genericError = new Error('Generic error');

      mockTraverser.traverse.mockImplementation(() => {
        throw genericError;
      });

      mockValidationUtils.isASTError.mockReturnValue(false);

      expect(() => extractor.extract(mockAST)).toThrow(ASTError);
    });
  });

  describe('validation', () => {
    it('should validate comments during post-processing', () => {
      const mockAST = { 
        type: 'Program', 
        body: [],
        comments: [
          {
            type: 'CommentLine',
            value: 'Test comment',
            loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 12 } }
          }
        ]
      } as any;

      const comment: CommentMetadata = {
        type: 'line',
        value: 'Test comment',
        sourceLocation: { start: { line: 1, column: 0 }, end: { line: 1, column: 12 } }
      };

      mockCommentUtils.processComment.mockReturnValue(comment);
      mockTraverser.traverse.mockImplementation(() => {});
      mockCommentUtils.sortCommentsByLocation.mockReturnValue([comment]);

      extractor.extract(mockAST);

      expect(mockValidationUtils.validateCommentMetadata).toHaveBeenCalledWith(comment);
    });

    it('should handle validation errors in post-processing', () => {
      const mockAST = { 
        type: 'Program', 
        body: [],
        comments: [
          {
            type: 'CommentLine',
            value: 'Test comment',
            loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 12 } }
          }
        ]
      } as any;

      const comment: CommentMetadata = {
        type: 'line',
        value: 'Test comment',
        sourceLocation: { start: { line: 1, column: 0 }, end: { line: 1, column: 12 } }
      };

      // Mock processComment to throw an error during processing
      mockCommentUtils.processComment.mockImplementation(() => {
        throw new Error('Processing failed');
      });
      
      mockTraverser.traverse.mockImplementation(() => {});
      mockCommentUtils.sortCommentsByLocation.mockReturnValue([]);
      
      mockValidationUtils.isASTError.mockReturnValue(false);

      // The processing error is caught in processComment and handled gracefully
      // So the extract method should not throw, but should return empty results
      const result = extractor.extract(mockAST);
      expect(result).toHaveLength(0); // No comments should be returned due to processing failure
    });
  });
});