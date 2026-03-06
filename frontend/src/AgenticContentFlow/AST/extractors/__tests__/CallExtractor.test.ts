import { Node } from '@babel/types';
import { CallExtractor } from '../CallExtractor';
import { ASTTraverser, NodeVisitor } from '../../interfaces/CoreInterfaces';
import { FunctionCall, SourceLocation } from '../../types/ASTTypes';
import { ASTError } from '../../utils/ValidationUtils';
import { BabelParser } from '../../parsers/BabelParser';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies
const mockTraverser: ASTTraverser = {
  traverse: vi.fn()
};

const mockBabelParser: BabelParser = {
  parse: vi.fn(),
  getSourceLocation: vi.fn()
} as any;

describe('CallExtractor', () => {
  let extractor: CallExtractor;
  
  const mockSourceLocation: SourceLocation = {
    start: { line: 1, column: 0 },
    end: { line: 1, column: 10 }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    extractor = new CallExtractor(mockTraverser);
  });

  describe('constructor', () => {
    it('should create instance with traverser dependency', () => {
      expect(extractor).toBeInstanceOf(CallExtractor);
    });

    it('should create instance with legacy BabelParser dependency', () => {
      const legacyExtractor = new CallExtractor(mockBabelParser);
      expect(legacyExtractor).toBeInstanceOf(CallExtractor);
    });

    it('should throw error if traverser is not provided', () => {
      expect(() => new CallExtractor(null as any)).toThrow(ASTError);
    });
  });

  describe('extract', () => {

    it('should extract function calls correctly', () => {
      const mockAST: Node = { type: 'Program' } as Node;
      
      // Mock traverser to simulate visiting function and call nodes
      mockTraverser.traverse.mockImplementation((node, visitor) => {
        // Simulate visiting a function declaration
        visitor.visit({
          type: 'FunctionDeclaration',
          id: { name: 'testFunction' },
          loc: { start: { line: 1, column: 0 }, end: { line: 3, column: 1 } }
        } as any);
        
        // Simulate visiting a call expression within the function
        visitor.visit({
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'console.log' },
          loc: mockSourceLocation
        } as any);
      });

      const result = extractor.extract(mockAST);

      expect(mockTraverser.traverse).toHaveBeenCalledWith(mockAST, expect.any(Object));
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        callerFunction: 'testFunction',
        calledFunction: 'console.log',
        isExternal: true
      });
    });

    it('should handle nested functions correctly', () => {
      const mockAST: Node = { type: 'Program' } as Node;
      
      mockTraverser.traverse.mockImplementation((node, visitor) => {
        // Outer function
        visitor.visit({
          type: 'FunctionDeclaration',
          id: { name: 'outerFunction' },
          loc: mockSourceLocation
        } as any);
        
        // Inner function
        visitor.visit({
          type: 'FunctionDeclaration',
          id: { name: 'innerFunction' },
          loc: mockSourceLocation
        } as any);
        
        // Call within inner function
        visitor.visit({
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'helper' },
          loc: mockSourceLocation
        } as any);
      });

      const result = extractor.extract(mockAST);

      expect(result).toHaveLength(1);
      expect(result[0].callerFunction).toBe('innerFunction');
      expect(result[0].calledFunction).toBe('helper');
    });

    it('should handle method calls correctly', () => {
      const mockAST: Node = { type: 'Program' } as Node;
      
      mockTraverser.traverse.mockImplementation((node, visitor) => {
        visitor.visit({
          type: 'FunctionDeclaration',
          id: { name: 'testFunction' },
          loc: mockSourceLocation
        } as any);
        
        visitor.visit({
          type: 'CallExpression',
          callee: {
            type: 'MemberExpression',
            property: { type: 'Identifier', name: 'push' }
          },
          loc: mockSourceLocation
        } as any);
      });

      const result = extractor.extract(mockAST);

      expect(result).toHaveLength(1);
      expect(result[0].calledFunction).toBe('push');
    });

    it('should handle anonymous functions correctly', () => {
      const mockAST: Node = { type: 'Program' } as Node;
      
      mockTraverser.traverse.mockImplementation((node, visitor) => {
        visitor.visit({
          type: 'ArrowFunctionExpression',
          loc: mockSourceLocation
        } as any);
        
        visitor.visit({
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'callback' },
          loc: mockSourceLocation
        } as any);
      });

      const result = extractor.extract(mockAST);

      expect(result).toHaveLength(1);
      expect(result[0].callerFunction).toBe('anonymous');
      expect(result[0].calledFunction).toBe('callback');
    });

    it('should skip calls outside of functions', () => {
      const mockAST: Node = { type: 'Program' } as Node;
      
      mockTraverser.traverse.mockImplementation((node, visitor) => {
        // Call expression without being in a function
        visitor.visit({
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'globalCall' },
          loc: mockSourceLocation
        } as any);
      });

      const result = extractor.extract(mockAST);

      expect(result).toHaveLength(0);
    });

    it('should identify external calls correctly', () => {
      const mockAST: Node = { type: 'Program' } as Node;
      
      mockTraverser.traverse.mockImplementation((node, visitor) => {
        visitor.visit({
          type: 'FunctionDeclaration',
          id: { name: 'testFunction' },
          loc: mockSourceLocation
        } as any);
        
        // External call
        visitor.visit({
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'console' },
          loc: mockSourceLocation
        } as any);
        
        // Internal call
        visitor.visit({
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'myFunction' },
          loc: mockSourceLocation
        } as any);
      });

      const result = extractor.extract(mockAST);

      expect(result).toHaveLength(2);
      expect(result[0].isExternal).toBe(true);
      expect(result[1].isExternal).toBe(false);
    });

    it('should handle extraction errors gracefully', () => {
      const mockAST: Node = { type: 'Program' } as Node;
      
      mockTraverser.traverse.mockImplementation(() => {
        throw new Error('Traversal failed');
      });

      expect(() => extractor.extract(mockAST)).toThrow(ASTError);
    });

    it('should validate results after extraction', () => {
      const mockAST: Node = { type: 'Program' } as Node;
      
      // Mock a scenario that would produce invalid results
      mockTraverser.traverse.mockImplementation((node, visitor) => {
        visitor.visit({
          type: 'FunctionDeclaration',
          id: { name: 'testFunction' },
          loc: mockSourceLocation
        } as any);
        
        visitor.visit({
          type: 'CallExpression',
          callee: null, // This should cause validation to fail
          loc: mockSourceLocation
        } as any);
      });

      const result = extractor.extract(mockAST);
      
      // Should handle invalid calls gracefully by filtering them out
      expect(result).toHaveLength(0);
    });

    it('should generate unique IDs for function calls', () => {
      const mockAST: Node = { type: 'Program' } as Node;
      let callCount = 0;
      
      mockTraverser.traverse.mockImplementation((node, visitor) => {
        visitor.visit({
          type: 'FunctionDeclaration',
          id: { name: 'testFunction' },
          loc: mockSourceLocation
        } as any);
        
        // Multiple calls to the same function with slight delay to ensure different timestamps
        visitor.visit({
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'helper' },
          loc: mockSourceLocation
        } as any);
        
        // Add a small delay to ensure different timestamps
        const start = Date.now();
        while (Date.now() - start < 1) { /* wait */ }
        
        visitor.visit({
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'helper' },
          loc: mockSourceLocation
        } as any);
      });

      const result = extractor.extract(mockAST);

      expect(result).toHaveLength(2);
      expect(result[0].id).toContain('testFunction_calls_helper');
      expect(result[1].id).toContain('testFunction_calls_helper');
      // IDs should be different due to timestamp
      expect(result[0].id !== result[1].id).toBe(true);
    });
  });

  describe('identifyFunctionCalls (legacy method)', () => {
    it('should delegate to extract method', () => {
      const mockAST: Node = { type: 'Program' } as Node;
      const extractSpy = vi.spyOn(extractor, 'extract');
      
      mockTraverser.traverse.mockImplementation(() => {});

      extractor.identifyFunctionCalls(mockAST);

      expect(extractSpy).toHaveBeenCalledWith(mockAST);
    });
  });

  describe('canHandle', () => {
    it('should return true for call expressions', () => {
      const callNode: Node = { type: 'CallExpression' } as Node;
      expect((extractor as any).canHandle(callNode)).toBe(true);
    });

    it('should return true for function nodes', () => {
      const functionNode: Node = { type: 'FunctionDeclaration' } as Node;
      expect((extractor as any).canHandle(functionNode)).toBe(true);
    });

    it('should return false for other node types', () => {
      const otherNode: Node = { type: 'VariableDeclaration' } as Node;
      expect((extractor as any).canHandle(otherNode)).toBe(false); // CallExtractor only handles calls and functions
    });
  });

  describe('error handling', () => {
    it('should handle invalid AST gracefully', () => {
      const invalidAST = null as any;
      
      expect(() => extractor.extract(invalidAST)).toThrow(ASTError);
    });

    it('should handle traversal errors', () => {
      const mockAST: Node = { type: 'Program' } as Node;
      
      mockTraverser.traverse.mockImplementation(() => {
        throw new ASTError('Traversal failed', 'ASTTraverser');
      });

      expect(() => extractor.extract(mockAST)).toThrow(ASTError);
    });

    it('should continue processing after individual node errors', () => {
      const mockAST: Node = { type: 'Program' } as Node;
      
      mockTraverser.traverse.mockImplementation((node, visitor) => {
        visitor.visit({
          type: 'FunctionDeclaration',
          id: { name: 'testFunction' },
          loc: mockSourceLocation
        } as any);
        
        // Valid call
        visitor.visit({
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'validCall' },
          loc: mockSourceLocation
        } as any);
        
        // Invalid call (will be handled gracefully)
        visitor.visit({
          type: 'CallExpression',
          callee: null,
          loc: mockSourceLocation
        } as any);
      });

      const result = extractor.extract(mockAST);
      
      // Should extract the valid call despite the invalid one
      expect(result).toHaveLength(1);
      expect(result[0].calledFunction).toBe('validCall');
    });
  });

  describe('function context tracking', () => {
    it('should track function stack correctly', () => {
      const mockAST: Node = { type: 'Program' } as Node;
      
      mockTraverser.traverse.mockImplementation((node, visitor) => {
        // Enter outer function
        visitor.visit({
          type: 'FunctionDeclaration',
          id: { name: 'outer' },
          loc: mockSourceLocation
        } as any);
        
        // Call in outer function
        visitor.visit({
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'outerCall' },
          loc: mockSourceLocation
        } as any);
        
        // Enter inner function
        visitor.visit({
          type: 'FunctionDeclaration',
          id: { name: 'inner' },
          loc: mockSourceLocation
        } as any);
        
        // Call in inner function
        visitor.visit({
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'innerCall' },
          loc: mockSourceLocation
        } as any);
      });

      const result = extractor.extract(mockAST);

      expect(result).toHaveLength(2);
      
      const outerCall = result.find(call => call.calledFunction === 'outerCall');
      const innerCall = result.find(call => call.calledFunction === 'innerCall');
      
      expect(outerCall?.callerFunction).toBe('outer');
      expect(innerCall?.callerFunction).toBe('inner');
    });

    it('should reset function stack between extractions', () => {
      const mockAST: Node = { type: 'Program' } as Node;
      
      mockTraverser.traverse.mockImplementation((node, visitor) => {
        visitor.visit({
          type: 'FunctionDeclaration',
          id: { name: 'testFunction' },
          loc: mockSourceLocation
        } as any);
      });

      // First extraction
      extractor.extract(mockAST);
      
      // Second extraction should start with clean state
      const result = extractor.extract(mockAST);
      
      expect(result).toHaveLength(0); // No calls, just function declaration
    });
  });

  describe('method definitions', () => {
    it('should handle class methods correctly', () => {
      const mockAST: Node = { type: 'Program' } as Node;
      
      mockTraverser.traverse.mockImplementation((node, visitor) => {
        visitor.visit({
          type: 'ClassMethod',
          key: { type: 'Identifier', name: 'methodName' },
          loc: mockSourceLocation
        } as any);
        
        visitor.visit({
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'helper' },
          loc: mockSourceLocation
        } as any);
      });

      const result = extractor.extract(mockAST);

      expect(result).toHaveLength(1);
      expect(result[0].callerFunction).toBe('methodName');
    });

    it('should handle object methods correctly', () => {
      const mockAST: Node = { type: 'Program' } as Node;
      
      mockTraverser.traverse.mockImplementation((node, visitor) => {
        visitor.visit({
          type: 'ObjectMethod',
          key: { type: 'Identifier', name: 'objMethod' },
          loc: mockSourceLocation
        } as any);
        
        visitor.visit({
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'utility' },
          loc: mockSourceLocation
        } as any);
      });

      const result = extractor.extract(mockAST);

      expect(result).toHaveLength(1);
      expect(result[0].callerFunction).toBe('objMethod');
    });
  });
});