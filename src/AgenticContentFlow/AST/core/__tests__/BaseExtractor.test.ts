import { Node } from '@babel/types';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseExtractor } from '../BaseExtractor';
import { ASTTraverser } from '../ASTTraverser';
import { NodeVisitor } from '../../interfaces/CoreInterfaces';
import { ASTError } from '../../utils/ValidationUtils';

// Create a concrete implementation for testing
class TestExtractor extends BaseExtractor<{ id: string; name: string }> {
  extract(ast: Node): { id: string; name: string }[] {
    const results: { id: string; name: string }[] = [];
    
    this.traverse(ast, {
      visit: (node: Node) => {
        if (node.type === 'FunctionDeclaration') {
          results.push({
            id: this.generateId(node, 'test'),
            name: (node as any).id?.name || 'anonymous'
          });
        }
      }
    });
    
    return results;
  }
}

describe('BaseExtractor', () => {
  let mockTraverser: any;
  let extractor: TestExtractor;
  let mockNode: Node;

  beforeEach(() => {
    // Setup mock traverser
    mockTraverser = {
      traverse: vi.fn(),
      getCurrentDepth: vi.fn().mockReturnValue(0),
      getMaxDepth: vi.fn().mockReturnValue(100),
      getVisitedNodeCount: vi.fn().mockReturnValue(0),
      reset: vi.fn(),
      clone: vi.fn()
    };

    // Setup mock node
    mockNode = {
      type: 'FunctionDeclaration',
      id: { name: 'testFunction' },
      loc: {
        start: { line: 1, column: 0 },
        end: { line: 5, column: 1 }
      }
    } as any;

    // Create extractor instance
    extractor = new TestExtractor(mockTraverser);
  });

  describe('constructor', () => {
    it('should create instance with valid traverser', () => {
      expect(extractor).toBeInstanceOf(BaseExtractor);
      expect(extractor).toBeInstanceOf(TestExtractor);
    });

    it('should throw ASTError when traverser is null', () => {
      expect(() => new TestExtractor(null as any)).toThrow(ASTError);
      expect(() => new TestExtractor(null as any)).toThrow('ASTTraverser is required for BaseExtractor');
    });

    it('should throw ASTError when traverser is undefined', () => {
      expect(() => new TestExtractor(undefined as any)).toThrow(ASTError);
    });
  });

  describe('extractSourceLocation', () => {
    it('should extract source location from node with location', () => {
      const result = (extractor as any).extractSourceLocation(mockNode);
      
      expect(result).toEqual({
        start: { line: 1, column: 0 },
        end: { line: 5, column: 1 }
      });
    });

    it('should handle nodes without location', () => {
      const nodeWithoutLoc = { type: 'Identifier' } as Node;
      
      const result = (extractor as any).extractSourceLocation(nodeWithoutLoc);
      
      expect(result).toEqual({
        start: { line: 0, column: 0 },
        end: { line: 0, column: 0 }
      });
    });
  });

  describe('isValidNode', () => {
    it('should return true for valid nodes', () => {
      const result = (extractor as any).isValidNode(mockNode);
      expect(result).toBe(true);
    });

    it('should return false for invalid nodes', () => {
      expect((extractor as any).isValidNode(null)).toBe(false);
      expect((extractor as any).isValidNode(undefined)).toBe(false);
      expect((extractor as any).isValidNode({})).toBe(false);
      expect((extractor as any).isValidNode({ type: null })).toBe(false);
    });
  });

  describe('generateId', () => {
    beforeEach(() => {
      // Mock Date.now to return consistent timestamp
      vi.spyOn(Date, 'now').mockReturnValue(1234567890000);
    });

    it('should generate unique ID with location and timestamp', () => {
      const id = (extractor as any).generateId(mockNode);
      
      expect(id).toMatch(/functiondeclaration_1_0_[a-z0-9]+/);
    });

    it('should generate ID with custom prefix', () => {
      const id = (extractor as any).generateId(mockNode, 'custom');
      
      expect(id).toMatch(/custom_functiondeclaration_1_0_[a-z0-9]+/);
    });

    it('should handle nodes without location', () => {
      const nodeWithoutLoc = { type: 'Identifier' } as Node;
      
      const id = (extractor as any).generateId(nodeWithoutLoc);
      
      expect(id).toMatch(/identifier_0_0_[a-z0-9]+/);
    });
  });

  describe('traverse', () => {
    it('should call traverser with node and visitor', () => {
      const mockVisitor: NodeVisitor = { visit: vi.fn() };
      
      (extractor as any).traverse(mockNode, mockVisitor);
      
      expect(mockTraverser.traverse).toHaveBeenCalledWith(mockNode, mockVisitor);
    });
  });

  describe('collectNodes', () => {
    it('should collect nodes matching predicate', () => {
      const functionNode = { type: 'FunctionDeclaration' } as Node;
      const identifierNode = { type: 'Identifier' } as Node;
      
      // Mock traverser to call visitor with both nodes
      mockTraverser.traverse.mockImplementation((node, visitor) => {
        visitor.visit(functionNode);
        visitor.visit(identifierNode);
      });
      
      const predicate = (node: Node) => node.type === 'FunctionDeclaration';
      const result = (extractor as any).collectNodes(mockNode, predicate);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(functionNode);
    });

    it('should return empty array when no nodes match', () => {
      mockTraverser.traverse.mockImplementation((node, visitor) => {
        visitor.visit({ type: 'Identifier' } as Node);
      });
      
      const predicate = (node: Node) => node.type === 'FunctionDeclaration';
      const result = (extractor as any).collectNodes(mockNode, predicate);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('extractCommonMetadata', () => {
    it('should extract common metadata with ID and location', () => {
      const metadata = (extractor as any).extractCommonMetadata(mockNode);
      
      expect(metadata).toHaveProperty('id');
      expect(metadata).toHaveProperty('sourceLocation');
      expect(metadata).toHaveProperty('nodeType', 'FunctionDeclaration');
      expect(metadata.sourceLocation).toEqual({
        start: { line: 1, column: 0 },
        end: { line: 5, column: 1 }
      });
    });
  });

  describe('validateResults', () => {
    it('should validate that results is an array', () => {
      const results = [{ id: '1', name: 'test' }];
      
      expect(() => (extractor as any).validateResults(results)).not.toThrow();
    });

    it('should throw error for non-array results', () => {
      const results = { id: '1', name: 'test' } as any;
      
      expect(() => (extractor as any).validateResults(results)).toThrow(ASTError);
      expect(() => (extractor as any).validateResults(results)).toThrow('Extraction results must be an array');
    });

    it('should use custom validator when provided', () => {
      const results = [{ id: '1', name: 'test' }];
      const validator = vi.fn();
      
      (extractor as any).validateResults(results, validator);
      
      expect(validator).toHaveBeenCalledWith(results[0]);
    });

    it('should handle validator errors', () => {
      const results = [{ id: '1', name: 'test' }];
      const validator = vi.fn().mockImplementation(() => {
        throw new Error('Validation failed');
      });
      
      expect(() => (extractor as any).validateResults(results, validator)).toThrow(ASTError);
      expect(() => (extractor as any).validateResults(results, validator)).toThrow('Result validation failed at index 0');
    });
  });

  describe('safeExtract', () => {
    it('should return result when extraction succeeds', () => {
      const extractionFn = vi.fn().mockReturnValue('success');
      
      const result = (extractor as any).safeExtract(extractionFn, 'test extraction');
      
      expect(result).toBe('success');
      expect(extractionFn).toHaveBeenCalled();
    });

    it('should return null when extraction fails', () => {
      const extractionFn = vi.fn().mockImplementation(() => {
        throw new Error('Extraction failed');
      });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = (extractor as any).safeExtract(extractionFn, 'test extraction');
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Safe extraction failed - test extraction in TestExtractor:'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('getExtractorName', () => {
    it('should return the constructor name', () => {
      const name = (extractor as any).getExtractorName();
      expect(name).toBe('TestExtractor');
    });
  });

  describe('canHandle', () => {
    it('should return true by default', () => {
      const result = (extractor as any).canHandle(mockNode);
      expect(result).toBe(true);
    });
  });

  describe('postProcess', () => {
    it('should validate results and return them', () => {
      const results = [{ id: '1', name: 'test' }];
      
      const processed = (extractor as any).postProcess(results);
      
      expect(processed).toBe(results);
    });
  });

  describe('extractWithTemplate', () => {
    it('should orchestrate complete extraction process', () => {
      const mockResults = [{ id: '1', name: 'test' }];
      vi.spyOn(extractor, 'extract').mockReturnValue(mockResults);
      
      const result = extractor.extractWithTemplate(mockNode);
      
      expect(extractor.extract).toHaveBeenCalledWith(mockNode);
      expect(result).toBe(mockResults);
    });
  });

  describe('extract (concrete implementation)', () => {
    it('should extract function declarations', () => {
      const functionNode = {
        type: 'FunctionDeclaration',
        id: { name: 'testFunction' }
      } as Node;
      
      mockTraverser.traverse.mockImplementation((node, visitor) => {
        visitor.visit(functionNode);
      });
      
      const result = extractor.extract(mockNode);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('testFunction');
      expect(result[0].id).toMatch(/test_functiondeclaration_/);
    });

    it('should handle anonymous functions', () => {
      const functionNode = {
        type: 'FunctionDeclaration',
        id: null
      } as any;
      
      mockTraverser.traverse.mockImplementation((node, visitor) => {
        visitor.visit(functionNode);
      });
      
      const result = extractor.extract(mockNode);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('anonymous');
    });

    it('should ignore non-function nodes', () => {
      const identifierNode = { type: 'Identifier' } as Node;
      
      mockTraverser.traverse.mockImplementation((node, visitor) => {
        visitor.visit(identifierNode);
      });
      
      const result = extractor.extract(mockNode);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('integration with real ASTTraverser', () => {
    it('should work with actual ASTTraverser instance', () => {
      const realTraverser = new ASTTraverser();
      const realExtractor = new TestExtractor(realTraverser);
      
      const ast = {
        type: 'Program',
        body: [
          {
            type: 'FunctionDeclaration',
            id: { name: 'realFunction' },
            loc: { start: { line: 1, column: 0 }, end: { line: 3, column: 1 } }
          }
        ]
      } as any;
      
      const result = realExtractor.extract(ast);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('realFunction');
    });
  });
});