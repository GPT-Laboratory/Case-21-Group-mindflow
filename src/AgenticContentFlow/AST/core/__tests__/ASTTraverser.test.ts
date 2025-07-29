import { Node } from '@babel/types';
import { ASTTraverser } from '../ASTTraverser';
import { NodeVisitor } from '../../interfaces/CoreInterfaces';
import { ASTError } from '../../utils/ValidationUtils';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('ASTTraverser', () => {
  let traverser: ASTTraverser;
  let mockVisitor: { visit: any };

  beforeEach(() => {
    traverser = new ASTTraverser();
    mockVisitor = {
      visit: vi.fn()
    };
    
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create traverser with default max depth', () => {
      const defaultTraverser = new ASTTraverser();
      expect(defaultTraverser.getMaxDepth()).toBe(100);
    });

    it('should create traverser with custom max depth', () => {
      const customTraverser = new ASTTraverser(50);
      expect(customTraverser.getMaxDepth()).toBe(50);
    });
  });

  describe('traverse', () => {
    it('should visit a single node', () => {
      const node: Node = {
        type: 'Identifier',
        name: 'test'
      } as any;

      traverser.traverse(node, mockVisitor);

      expect(mockVisitor.visit).toHaveBeenCalledTimes(1);
      expect(mockVisitor.visit).toHaveBeenCalledWith(node);
    });

    it('should validate node before traversal', () => {
      const node: Node = {
        type: 'Identifier',
        name: 'test'
      } as any;

      // This test verifies that traversal works with valid nodes
      expect(() => traverser.traverse(node, mockVisitor)).not.toThrow();
      expect(mockVisitor.visit).toHaveBeenCalledWith(node);
    });

    it('should throw ASTError if node validation fails', () => {
      // Test with an invalid node (null)
      const invalidNode = null as any;

      expect(() => traverser.traverse(invalidNode, mockVisitor)).toThrow(ASTError);
      expect(() => traverser.traverse(invalidNode, mockVisitor)).toThrow(/Invalid node for traversal/);
    });

    it('should reset state before and after traversal', () => {
      const node: Node = {
        type: 'Identifier',
        name: 'test'
      } as any;

      // Set some initial state
      traverser.traverse(node, mockVisitor);
      
      // Traverse again - state should be reset
      traverser.traverse(node, mockVisitor);
      
      expect(traverser.getCurrentDepth()).toBe(0);
      expect(mockVisitor.visit).toHaveBeenCalledTimes(2); // Called once for each traversal
    });

    it('should handle traversal errors gracefully', () => {
      const node: Node = {
        type: 'Identifier',
        name: 'test'
      } as any;

      mockVisitor.visit = vi.fn(() => {
        throw new Error('Visitor error');
      });

      expect(() => traverser.traverse(node, mockVisitor)).toThrow(ASTError);
      expect(() => traverser.traverse(node, mockVisitor)).toThrow(/Traversal failed: Visitor error/);
    });
  });

  describe('child node traversal', () => {
    it('should traverse child nodes', () => {
      const childNode: Node = {
        type: 'Identifier',
        name: 'child'
      } as any;

      const parentNode: Node = {
        type: 'FunctionDeclaration',
        id: childNode,
        params: [],
        body: {
          type: 'BlockStatement',
          body: []
        }
      } as any;

      traverser.traverse(parentNode, mockVisitor);

      expect(mockVisitor.visit).toHaveBeenCalledTimes(3); // parent, id, body
      expect(mockVisitor.visit).toHaveBeenCalledWith(parentNode);
      expect(mockVisitor.visit).toHaveBeenCalledWith(childNode);
      expect(mockVisitor.visit).toHaveBeenCalledWith((parentNode as any).body);
    });

    it('should traverse array children', () => {
      const param1: Node = {
        type: 'Identifier',
        name: 'param1'
      } as any;

      const param2: Node = {
        type: 'Identifier',
        name: 'param2'
      } as any;

      const functionNode: Node = {
        type: 'FunctionDeclaration',
        params: [param1, param2],
        body: {
          type: 'BlockStatement',
          body: []
        }
      } as any;

      traverser.traverse(functionNode, mockVisitor);

      expect(mockVisitor.visit).toHaveBeenCalledTimes(4); // function, param1, param2, body
      expect(mockVisitor.visit).toHaveBeenCalledWith(param1);
      expect(mockVisitor.visit).toHaveBeenCalledWith(param2);
    });

    it('should skip invalid nodes in arrays', () => {
      const validChild: Node = {
        type: 'Identifier',
        name: 'valid'
      } as any;

      const parentNode: Node = {
        type: 'ArrayExpression',
        elements: [
          validChild,
          null, // Invalid node
          undefined, // Invalid node
          'string', // Invalid node
          42 // Invalid node
        ]
      } as any;

      traverser.traverse(parentNode, mockVisitor);

      expect(mockVisitor.visit).toHaveBeenCalledTimes(2); // parent and valid child only
      expect(mockVisitor.visit).toHaveBeenCalledWith(parentNode);
      expect(mockVisitor.visit).toHaveBeenCalledWith(validChild);
    });
  });

  describe('property filtering', () => {
    it('should skip metadata properties', () => {
      const node: Node = {
        type: 'Identifier',
        name: 'test',
        loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 4 } },
        start: 0,
        end: 4,
        leadingComments: [{ type: 'Line', value: 'comment' }],
        trailingComments: [],
        parent: { type: 'Program' },
        raw: 'test',
        value: 'test'
      } as any;

      traverser.traverse(node, mockVisitor);

      // Should only visit the main node, not any of the metadata properties
      expect(mockVisitor.visit).toHaveBeenCalledTimes(1);
      expect(mockVisitor.visit).toHaveBeenCalledWith(node);
    });

    it('should traverse valid child properties', () => {
      const bodyNode: Node = {
        type: 'BlockStatement',
        body: []
      } as any;

      const node: Node = {
        type: 'FunctionDeclaration',
        body: bodyNode,
        loc: { start: { line: 1, column: 0 }, end: { line: 3, column: 1 } } // Should be skipped
      } as any;

      traverser.traverse(node, mockVisitor);

      expect(mockVisitor.visit).toHaveBeenCalledTimes(2);
      expect(mockVisitor.visit).toHaveBeenCalledWith(node);
      expect(mockVisitor.visit).toHaveBeenCalledWith(bodyNode);
    });
  });

  describe('cycle detection', () => {
    it('should prevent infinite recursion with cycles', () => {
      const node1: Node = {
        type: 'Identifier',
        name: 'node1'
      } as any;

      const node2: Node = {
        type: 'Identifier',
        name: 'node2'
      } as any;

      // Create a cycle
      (node1 as any).child = node2;
      (node2 as any).child = node1;

      traverser.traverse(node1, mockVisitor);

      // Should visit each node only once despite the cycle
      expect(mockVisitor.visit).toHaveBeenCalledTimes(2);
      expect(mockVisitor.visit).toHaveBeenCalledWith(node1);
      expect(mockVisitor.visit).toHaveBeenCalledWith(node2);
    });
  });

  describe('depth limiting', () => {
    it('should respect maximum depth limit', () => {
      const shallowTraverser = new ASTTraverser(2);

      // Create a deep nested structure
      const deepNode: Node = {
        type: 'Program',
        body: [{
          type: 'FunctionDeclaration',
          body: {
            type: 'BlockStatement',
            body: [{
              type: 'ExpressionStatement',
              expression: {
                type: 'Identifier',
                name: 'deep'
              }
            }]
          }
        }]
      } as any;

      expect(() => shallowTraverser.traverse(deepNode, mockVisitor)).toThrow(ASTError);
      expect(() => shallowTraverser.traverse(deepNode, mockVisitor)).toThrow(/Maximum traversal depth \(2\) exceeded/);
    });

    it('should track current depth correctly', () => {
      const depthTracker: number[] = [];
      const depthTrackingVisitor: NodeVisitor = {
        visit: () => {
          depthTracker.push(traverser.getCurrentDepth());
        }
      };

      const nestedNode: Node = {
        type: 'Program',
        body: [{
          type: 'FunctionDeclaration',
          body: {
            type: 'BlockStatement',
            body: []
          }
        }]
      } as any;

      traverser.traverse(nestedNode, depthTrackingVisitor);

      expect(depthTracker).toEqual([1, 2, 3]); // Program, FunctionDeclaration, BlockStatement
    });
  });

  describe('state management', () => {
    it('should provide current depth', () => {
      expect(traverser.getCurrentDepth()).toBe(0);
    });

    it('should provide max depth', () => {
      expect(traverser.getMaxDepth()).toBe(100);
    });

    it('should provide visited node count during traversal', () => {
      const countTrackingVisitor: NodeVisitor = {
        visit: () => {
          // Count should increase with each visit
          expect(traverser.getVisitedNodeCount()).toBeGreaterThan(0);
        }
      };

      const node: Node = {
        type: 'Identifier',
        name: 'test'
      } as any;

      traverser.traverse(node, countTrackingVisitor);
    });

    it('should reset state', () => {
      const node: Node = {
        type: 'Identifier',
        name: 'test'
      } as any;

      traverser.traverse(node, mockVisitor);
      traverser.reset();

      expect(traverser.getCurrentDepth()).toBe(0);
      expect(traverser.getVisitedNodeCount()).toBe(0);
    });

    it('should clone traverser with same configuration', () => {
      const customTraverser = new ASTTraverser(50);
      const cloned = customTraverser.clone();

      expect(cloned.getMaxDepth()).toBe(50);
      expect(cloned.getCurrentDepth()).toBe(0);
      expect(cloned.getVisitedNodeCount()).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle missing node type', () => {
      const invalidNode = {
        name: 'test'
        // Missing type property
      } as any;

      expect(() => traverser.traverse(invalidNode, mockVisitor)).toThrow(ASTError);
    });

    it('should wrap non-ASTError exceptions', () => {
      const node: Node = {
        type: 'Identifier',
        name: 'test'
      } as any;

      mockVisitor.visit = vi.fn(() => {
        throw new TypeError('Type error');
      });

      expect(() => traverser.traverse(node, mockVisitor)).toThrow(ASTError);
      expect(() => traverser.traverse(node, mockVisitor)).toThrow(/Traversal failed: Type error/);
    });

    it('should preserve ASTError exceptions', () => {
      const node: Node = {
        type: 'Identifier',
        name: 'test'
      } as any;

      const astError = new ASTError('Custom AST error', 'TestComponent');
      mockVisitor.visit = vi.fn(() => {
        throw astError;
      });

      expect(() => traverser.traverse(node, mockVisitor)).toThrow(ASTError);
      expect(() => traverser.traverse(node, mockVisitor)).toThrow(/Custom AST error/);
    });

    it('should clean up state even when errors occur', () => {
      const node: Node = {
        type: 'Identifier',
        name: 'test'
      } as any;

      mockVisitor.visit = vi.fn(() => {
        throw new Error('Test error');
      });

      try {
        traverser.traverse(node, mockVisitor);
      } catch (error) {
        // Expected error
      }

      // State should be cleaned up
      expect(traverser.getCurrentDepth()).toBe(0);
      expect(traverser.getVisitedNodeCount()).toBe(0);
    });
  });

  describe('complex traversal scenarios', () => {
    it('should handle deeply nested function declarations', () => {
      const deeplyNested: Node = {
        type: 'Program',
        body: [{
          type: 'FunctionDeclaration',
          id: { type: 'Identifier', name: 'outer' },
          params: [],
          body: {
            type: 'BlockStatement',
            body: [{
              type: 'FunctionDeclaration',
              id: { type: 'Identifier', name: 'inner' },
              params: [],
              body: {
                type: 'BlockStatement',
                body: [{
                  type: 'ReturnStatement',
                  argument: {
                    type: 'Identifier',
                    name: 'result'
                  }
                }]
              }
            }]
          }
        }]
      } as any;

      traverser.traverse(deeplyNested, mockVisitor);

      // Should visit all nodes in the structure
      // Program, FunctionDeclaration, Identifier(outer), BlockStatement, FunctionDeclaration, Identifier(inner), BlockStatement, ReturnStatement, Identifier(result)
      expect(mockVisitor.visit).toHaveBeenCalledTimes(9);
    });

    it('should handle mixed array and object children', () => {
      const mixedStructure: Node = {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: 'func'
        },
        arguments: [
          {
            type: 'Identifier',
            name: 'arg1'
          },
          {
            type: 'Identifier',
            name: 'arg2'
          }
        ]
      } as any;

      traverser.traverse(mixedStructure, mockVisitor);

      expect(mockVisitor.visit).toHaveBeenCalledTimes(4); // CallExpression, callee, arg1, arg2
    });

    it('should handle empty arrays and null values gracefully', () => {
      const nodeWithEmpties: Node = {
        type: 'FunctionDeclaration',
        id: {
          type: 'Identifier',
          name: 'test'
        },
        params: [], // Empty array
        body: {
          type: 'BlockStatement',
          body: [] // Empty array
        },
        returnType: null // Null value
      } as any;

      traverser.traverse(nodeWithEmpties, mockVisitor);

      expect(mockVisitor.visit).toHaveBeenCalledTimes(3); // Function, id, body
    });
  });
});