/** @format */

import { NestedFunctionProcessor } from '../NestedFunctionProcessor';
import { FunctionMetadata, ParsedFileStructure } from '../../types/ASTTypes';
import { EnhancedContainerNode } from '../../../Node/interfaces/ContainerNodeInterfaces';

describe('NestedFunctionProcessor', () => {
  let processor: NestedFunctionProcessor;

  beforeEach(() => {
    processor = new NestedFunctionProcessor();
  });

  describe('createNodesFromParsedFile', () => {
    it('should create nodes for simple functions without nesting', () => {
      const parsedFile: ParsedFileStructure = {
        functions: [
          {
            id: 'func1',
            name: 'simpleFunction',
            description: 'A simple function',
            parameters: [{ name: 'param1', type: 'string' }],
            sourceLocation: { start: { line: 1, column: 0 }, end: { line: 3, column: 1 } },
            isNested: false,
            scope: 'global',
            code: 'function simpleFunction(param1) { return param1; }',
          },
        ],
        calls: [],
        dependencies: [],
        variables: [],
        comments: [],
      };

      const result = processor.createNodesFromParsedFile(parsedFile);

      expect(result.nodes).toHaveLength(1);
      expect(result.relationships).toHaveLength(0);

      const node = result.nodes[0];
      expect(node.data.functionName).toBe('simpleFunction');
      expect(node.canContainChildren).toBe(true);
      expect(node.depth).toBe(0);
      expect(node.scope?.level).toBe(0);
      expect(node.scope?.functionName).toBe('simpleFunction');
      expect(node.scope?.variables).toContain('param1');
    });

    it('should create parent-child relationships for nested functions', () => {
      const parsedFile: ParsedFileStructure = {
        functions: [
          {
            id: 'parent_func',
            name: 'parentFunction',
            description: 'Parent function',
            parameters: [],
            sourceLocation: { start: { line: 1, column: 0 }, end: { line: 10, column: 1 } },
            isNested: false,
            scope: 'global',
            code: 'function parentFunction() { /* ... */ }',
          },
          {
            id: 'nested_func',
            name: 'nestedFunction',
            description: 'Nested function',
            parameters: [{ name: 'x', type: 'number' }],
            sourceLocation: { start: { line: 3, column: 2 }, end: { line: 5, column: 3 } },
            isNested: true,
            parentFunction: 'parent_func',
            scope: 'function',
            code: 'function nestedFunction(x) { return x * 2; }',
          },
        ],
        calls: [],
        dependencies: [],
        variables: [],
        comments: [],
      };

      const result = processor.createNodesFromParsedFile(parsedFile);

      expect(result.nodes).toHaveLength(2);
      expect(result.relationships).toHaveLength(1);

      const parentNode = result.nodes.find(n => n.data.functionName === 'parentFunction');
      const childNode = result.nodes.find(n => n.data.functionName === 'nestedFunction');

      expect(parentNode).toBeDefined();
      expect(childNode).toBeDefined();

      // Check parent-child relationship
      expect(parentNode?.childNodeIds).toContain(childNode?.id);
      expect(childNode?.parentId).toBe(parentNode?.id);

      // Check depths
      expect(parentNode?.depth).toBe(0);
      expect(childNode?.depth).toBe(1);

      // Check scopes
      expect(parentNode?.scope?.level).toBe(0);
      expect(childNode?.scope?.level).toBe(1);
      expect(childNode?.scope?.parentScope?.functionName).toBe('parentFunction');

      // Check relationship
      const relationship = result.relationships[0];
      expect(relationship.parentId).toBe(parentNode?.id);
      expect(relationship.childId).toBe(childNode?.id);
      expect(relationship.relationshipType).toBe('nested_function');
    });

    it('should handle multiple levels of nesting', () => {
      const parsedFile: ParsedFileStructure = {
        functions: [
          {
            id: 'grandparent',
            name: 'grandparentFunction',
            description: 'Grandparent function',
            parameters: [],
            sourceLocation: { start: { line: 1, column: 0 }, end: { line: 15, column: 1 } },
            isNested: false,
            scope: 'global',
            code: 'function grandparentFunction() { /* ... */ }',
          },
          {
            id: 'parent',
            name: 'parentFunction',
            description: 'Parent function',
            parameters: [],
            sourceLocation: { start: { line: 3, column: 2 }, end: { line: 12, column: 3 } },
            isNested: true,
            parentFunction: 'grandparent',
            scope: 'function',
            code: 'function parentFunction() { /* ... */ }',
          },
          {
            id: 'child',
            name: 'childFunction',
            description: 'Child function',
            parameters: [],
            sourceLocation: { start: { line: 6, column: 4 }, end: { line: 8, column: 5 } },
            isNested: true,
            parentFunction: 'parent',
            scope: 'function',
            code: 'function childFunction() { return true; }',
          },
        ],
        calls: [],
        dependencies: [],
        variables: [],
        comments: [],
      };

      const result = processor.createNodesFromParsedFile(parsedFile);

      expect(result.nodes).toHaveLength(3);
      expect(result.relationships).toHaveLength(2);

      const grandparentNode = result.nodes.find(n => n.data.functionName === 'grandparentFunction');
      const parentNode = result.nodes.find(n => n.data.functionName === 'parentFunction');
      const childNode = result.nodes.find(n => n.data.functionName === 'childFunction');

      // Check depths
      expect(grandparentNode?.depth).toBe(0);
      expect(parentNode?.depth).toBe(1);
      expect(childNode?.depth).toBe(2);

      // Check scope levels
      expect(grandparentNode?.scope?.level).toBe(0);
      expect(parentNode?.scope?.level).toBe(1);
      expect(childNode?.scope?.level).toBe(2);

      // Check parent-child relationships
      expect(grandparentNode?.childNodeIds).toContain(parentNode?.id);
      expect(parentNode?.childNodeIds).toContain(childNode?.id);
      expect(parentNode?.parentId).toBe(grandparentNode?.id);
      expect(childNode?.parentId).toBe(parentNode?.id);
    });

    it('should handle multiple nested functions at the same level', () => {
      const parsedFile: ParsedFileStructure = {
        functions: [
          {
            id: 'parent',
            name: 'parentFunction',
            description: 'Parent function',
            parameters: [],
            sourceLocation: { start: { line: 1, column: 0 }, end: { line: 15, column: 1 } },
            isNested: false,
            scope: 'global',
            code: 'function parentFunction() { /* ... */ }',
          },
          {
            id: 'child1',
            name: 'childFunction1',
            description: 'First child function',
            parameters: [],
            sourceLocation: { start: { line: 3, column: 2 }, end: { line: 5, column: 3 } },
            isNested: true,
            parentFunction: 'parent',
            scope: 'function',
            code: 'function childFunction1() { return 1; }',
          },
          {
            id: 'child2',
            name: 'childFunction2',
            description: 'Second child function',
            parameters: [],
            sourceLocation: { start: { line: 7, column: 2 }, end: { line: 9, column: 3 } },
            isNested: true,
            parentFunction: 'parent',
            scope: 'function',
            code: 'function childFunction2() { return 2; }',
          },
        ],
        calls: [],
        dependencies: [],
        variables: [],
        comments: [],
      };

      const result = processor.createNodesFromParsedFile(parsedFile);

      expect(result.nodes).toHaveLength(3);
      expect(result.relationships).toHaveLength(2);

      const parentNode = result.nodes.find(n => n.data.functionName === 'parentFunction');
      const child1Node = result.nodes.find(n => n.data.functionName === 'childFunction1');
      const child2Node = result.nodes.find(n => n.data.functionName === 'childFunction2');

      // Check parent has both children
      expect(parentNode?.childNodeIds).toHaveLength(2);
      expect(parentNode?.childNodeIds).toContain(child1Node?.id);
      expect(parentNode?.childNodeIds).toContain(child2Node?.id);

      // Check both children have same parent
      expect(child1Node?.parentId).toBe(parentNode?.id);
      expect(child2Node?.parentId).toBe(parentNode?.id);

      // Check both children have same depth and scope level
      expect(child1Node?.depth).toBe(1);
      expect(child2Node?.depth).toBe(1);
      expect(child1Node?.scope?.level).toBe(1);
      expect(child2Node?.scope?.level).toBe(1);
    });
  });

  describe('updateNodesWithNesting', () => {
    it('should update existing nodes with new nesting information', () => {
      const existingNodes: EnhancedContainerNode[] = [
        {
          id: 'existing-node',
          type: 'default',
          position: { x: 50, y: 50 },
          data: { label: 'Existing Node' },
          canContainChildren: false,
        },
      ];

      const parsedFile: ParsedFileStructure = {
        functions: [
          {
            id: 'new_func',
            name: 'newFunction',
            description: 'New function',
            parameters: [],
            sourceLocation: { start: { line: 1, column: 0 }, end: { line: 3, column: 1 } },
            isNested: false,
            scope: 'global',
            code: 'function newFunction() { return true; }',
          },
        ],
        calls: [],
        dependencies: [],
        variables: [],
        comments: [],
      };

      const result = processor.updateNodesWithNesting(existingNodes, parsedFile);

      expect(result.updatedNodes).toHaveLength(2);
      expect(result.newRelationships).toHaveLength(0);

      // Check existing node is preserved
      const existingNode = result.updatedNodes.find(n => n.id === 'existing-node');
      expect(existingNode).toBeDefined();
      expect(existingNode?.position).toEqual({ x: 50, y: 50 });

      // Check new node is added
      const newNode = result.updatedNodes.find(n => n.data.functionName === 'newFunction');
      expect(newNode).toBeDefined();
    });
  });

  describe('validateNestedStructure', () => {
    it('should validate correct nested structure', () => {
      const nodes: EnhancedContainerNode[] = [
        {
          id: 'parent',
          type: 'function',
          position: { x: 0, y: 0 },
          data: { label: 'Parent' },
          canContainChildren: true,
          childNodeIds: ['child'],
        },
        {
          id: 'child',
          type: 'function',
          position: { x: 100, y: 100 },
          data: { label: 'Child' },
          canContainChildren: false,
          parentId: 'parent',
        },
      ];

      const result = processor.validateNestedStructure(nodes);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing parent references', () => {
      const nodes: EnhancedContainerNode[] = [
        {
          id: 'child',
          type: 'function',
          position: { x: 100, y: 100 },
          data: { label: 'Child' },
          canContainChildren: false,
          parentId: 'non-existent-parent',
        },
      ];

      const result = processor.validateNestedStructure(nodes);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('references non-existent parent');
    });

    it('should detect missing child references', () => {
      const nodes: EnhancedContainerNode[] = [
        {
          id: 'parent',
          type: 'function',
          position: { x: 0, y: 0 },
          data: { label: 'Parent' },
          canContainChildren: true,
          childNodeIds: ['non-existent-child'],
        },
      ];

      const result = processor.validateNestedStructure(nodes);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('references non-existent child');
    });

    it('should detect circular references', () => {
      const nodes: EnhancedContainerNode[] = [
        {
          id: 'node1',
          type: 'function',
          position: { x: 0, y: 0 },
          data: { label: 'Node 1' },
          canContainChildren: true,
          childNodeIds: ['node2'],
          parentId: 'node2', // Circular reference
        },
        {
          id: 'node2',
          type: 'function',
          position: { x: 100, y: 100 },
          data: { label: 'Node 2' },
          canContainChildren: true,
          childNodeIds: ['node1'],
          parentId: 'node1', // Circular reference
        },
      ];

      const result = processor.validateNestedStructure(nodes);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('Circular reference'))).toBe(true);
    });
  });

  describe('position calculation', () => {
    it('should calculate positions based on source location', () => {
      const parsedFile: ParsedFileStructure = {
        functions: [
          {
            id: 'func1',
            name: 'function1',
            description: 'Function 1',
            parameters: [],
            sourceLocation: { start: { line: 5, column: 10 }, end: { line: 7, column: 1 } },
            isNested: false,
            scope: 'global',
            code: 'function function1() {}',
          },
          {
            id: 'func2',
            name: 'function2',
            description: 'Function 2',
            parameters: [],
            sourceLocation: { start: { line: 10, column: 5 }, end: { line: 12, column: 1 } },
            isNested: false,
            scope: 'global',
            code: 'function function2() {}',
          },
        ],
        calls: [],
        dependencies: [],
        variables: [],
        comments: [],
      };

      const result = processor.createNodesFromParsedFile(parsedFile);

      const node1 = result.nodes.find(n => n.data.functionName === 'function1');
      const node2 = result.nodes.find(n => n.data.functionName === 'function2');

      expect(node1?.position.y).toBeLessThan(node2?.position.y);
      expect(node1?.position.x).toBeGreaterThan(node2?.position.x);
    });
  });
});