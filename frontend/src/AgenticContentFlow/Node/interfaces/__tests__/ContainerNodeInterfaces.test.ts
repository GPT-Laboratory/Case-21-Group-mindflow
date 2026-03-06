/** @format */

import { 
  EnhancedContainerNode, 
  ScopeContext, 
  ParentChildRelationship,
  ContainerNodeConfig,
  EnhancedNodeData 
} from '../ContainerNodeInterfaces';

describe('ContainerNodeInterfaces', () => {
  describe('EnhancedContainerNode', () => {
    it('should create a valid enhanced container node', () => {
      const scope: ScopeContext = {
        level: 1,
        variables: ['localVar'],
        functionName: 'testFunction',
      };

      const node: EnhancedContainerNode = {
        id: 'test-node',
        type: 'default',
        position: { x: 100, y: 200 },
        data: { label: 'Test Node' },
        canContainChildren: true,
        childNodeIds: ['child-1', 'child-2'],
        parentId: 'parent-1',
        scope: scope,
        expanded: true,
        depth: 2,
      };

      expect(node.id).toBe('test-node');
      expect(node.canContainChildren).toBe(true);
      expect(node.childNodeIds).toHaveLength(2);
      expect(node.scope?.level).toBe(1);
      expect(node.depth).toBe(2);
    });

    it('should work with minimal required properties', () => {
      const node: EnhancedContainerNode = {
        id: 'minimal-node',
        type: 'default',
        position: { x: 0, y: 0 },
        data: { label: 'Minimal Node' },
        canContainChildren: false,
      };

      expect(node.id).toBe('minimal-node');
      expect(node.canContainChildren).toBe(false);
      expect(node.childNodeIds).toBeUndefined();
      expect(node.parentId).toBeUndefined();
    });
  });

  describe('ScopeContext', () => {
    it('should create a valid scope context', () => {
      const parentScope: ScopeContext = {
        level: 0,
        variables: ['globalVar'],
        functionName: 'parentFunction',
      };

      const childScope: ScopeContext = {
        level: 1,
        variables: ['localVar'],
        parentScope: parentScope,
        functionName: 'childFunction',
      };

      expect(childScope.level).toBe(1);
      expect(childScope.parentScope).toBe(parentScope);
      expect(childScope.variables).toContain('localVar');
    });

    it('should work without parent scope', () => {
      const scope: ScopeContext = {
        level: 0,
        variables: [],
      };

      expect(scope.level).toBe(0);
      expect(scope.parentScope).toBeUndefined();
      expect(scope.functionName).toBeUndefined();
    });
  });

  describe('ParentChildRelationship', () => {
    it('should create valid relationship types', () => {
      const nestedRelationship: ParentChildRelationship = {
        parentId: 'parent-1',
        childId: 'child-1',
        relationshipType: 'nested_function',
        scope: {
          level: 1,
          variables: [],
          functionName: 'nestedFunc',
        },
      };

      const externalRelationship: ParentChildRelationship = {
        parentId: 'parent-1',
        childId: 'external-1',
        relationshipType: 'external_dependency',
      };

      const containerRelationship: ParentChildRelationship = {
        parentId: 'parent-1',
        childId: 'container-child-1',
        relationshipType: 'container_child',
      };

      expect(nestedRelationship.relationshipType).toBe('nested_function');
      expect(externalRelationship.relationshipType).toBe('external_dependency');
      expect(containerRelationship.relationshipType).toBe('container_child');
    });
  });

  describe('ContainerNodeConfig', () => {
    it('should create valid container configuration', () => {
      const config: ContainerNodeConfig = {
        canContainChildren: true,
        maxChildren: 5,
        allowedChildTypes: ['function', 'external'],
        defaultExpanded: false,
        childLayoutDirection: 'vertical',
      };

      expect(config.canContainChildren).toBe(true);
      expect(config.maxChildren).toBe(5);
      expect(config.allowedChildTypes).toContain('function');
      expect(config.childLayoutDirection).toBe('vertical');
    });

    it('should work with unlimited children', () => {
      const config: ContainerNodeConfig = {
        canContainChildren: true,
        maxChildren: -1,
        allowedChildTypes: [],
        defaultExpanded: true,
      };

      expect(config.maxChildren).toBe(-1);
      expect(config.allowedChildTypes).toHaveLength(0);
    });
  });

  describe('EnhancedNodeData', () => {
    it('should create enhanced node data with all properties', () => {
      const nodeData: EnhancedNodeData = {
        label: 'Function Node',
        details: 'This is a function node',
        canContainChildren: true,
        expanded: false,
        childNodeIds: ['child-1'],
        scope: {
          level: 1,
          variables: ['param1', 'param2'],
          functionName: 'myFunction',
        },
        functionName: 'myFunction',
        functionDescription: 'A sample function',
        isNestedFunction: false,
        externalDependencies: ['lodash', 'axios'],
        customProperty: 'custom value',
      };

      expect(nodeData.label).toBe('Function Node');
      expect(nodeData.functionName).toBe('myFunction');
      expect(nodeData.externalDependencies).toContain('lodash');
      expect(nodeData.customProperty).toBe('custom value');
    });

    it('should work with minimal properties', () => {
      const nodeData: EnhancedNodeData = {
        label: 'Simple Node',
      };

      expect(nodeData.label).toBe('Simple Node');
      expect(nodeData.canContainChildren).toBeUndefined();
      expect(nodeData.functionName).toBeUndefined();
    });
  });

  describe('Type Compatibility', () => {
    it('should be compatible with React Flow Node type', () => {
      const enhancedNode: EnhancedContainerNode = {
        id: 'test',
        type: 'default',
        position: { x: 0, y: 0 },
        data: { label: 'Test' },
        canContainChildren: true,
      };

      // This should compile without errors, proving compatibility
      const reactFlowNode = {
        id: enhancedNode.id,
        type: enhancedNode.type,
        position: enhancedNode.position,
        data: enhancedNode.data,
      };

      expect(reactFlowNode.id).toBe('test');
    });

    it('should support generic data types', () => {
      interface CustomNodeData {
        title: string;
        value: number;
      }

      const customNode: EnhancedContainerNode<CustomNodeData> = {
        id: 'custom',
        type: 'custom',
        position: { x: 0, y: 0 },
        data: {
          title: 'Custom Node',
          value: 42,
        },
        canContainChildren: false,
      };

      expect(customNode.data.title).toBe('Custom Node');
      expect(customNode.data.value).toBe(42);
    });
  });
});