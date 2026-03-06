/** @format */

import { ChildNodeManagerService } from '../ChildNodeManager';
import { EnhancedContainerNode, ScopeContext } from '../../interfaces/ContainerNodeInterfaces';
import { beforeEach, describe, expect, it } from 'vitest';

describe('ChildNodeManagerService', () => {
  let childNodeManager: ChildNodeManagerService;

  beforeEach(() => {
    childNodeManager = new ChildNodeManagerService();
  });

  describe('Basic Container Functionality', () => {
    it('should initialize with empty nodes', () => {
      expect(childNodeManager.getAllNodes()).toHaveLength(0);
    });

    it('should initialize nodes correctly', () => {
      const testNodes: EnhancedContainerNode[] = [
        {
          id: 'parent-1',
          type: 'default',
          position: { x: 0, y: 0 },
          data: { label: 'Parent Node' },
          canContainChildren: true,
          childNodeIds: [],
        },
        {
          id: 'child-1',
          type: 'default',
          position: { x: 100, y: 100 },
          data: { label: 'Child Node' },
          canContainChildren: false,
          parentId: 'parent-1',
        },
      ];

      childNodeManager.initializeNodes(testNodes);
      
      expect(childNodeManager.getAllNodes()).toHaveLength(2);
      expect(childNodeManager.getNode('parent-1')).toBeDefined();
      expect(childNodeManager.getNode('child-1')).toBeDefined();
    });
  });

  describe('Child Node Management', () => {
    beforeEach(() => {
      const parentNode: EnhancedContainerNode = {
        id: 'parent-1',
        type: 'default',
        position: { x: 0, y: 0 },
        data: { label: 'Parent Node' },
        canContainChildren: true,
        childNodeIds: [],
        depth: 0,
      };

      childNodeManager.initializeNodes([parentNode]);
    });

    it('should add child node to parent', () => {
      const childNode: EnhancedContainerNode = {
        id: 'child-1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'Child Node', functionName: 'childFunction' },
        canContainChildren: false,
      };

      childNodeManager.addChildNode('parent-1', childNode);

      const parent = childNodeManager.getNode('parent-1');
      const child = childNodeManager.getNode('child-1');

      expect(parent?.childNodeIds).toContain('child-1');
      expect(child?.parentId).toBe('parent-1');
      expect(child?.depth).toBe(1);
      expect(child?.scope).toBeDefined();
      expect(child?.scope?.level).toBe(1);
      expect(child?.scope?.functionName).toBe('childFunction');
    });

    it('should throw error when adding child to non-existent parent', () => {
      const childNode: EnhancedContainerNode = {
        id: 'child-1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'Child Node' },
        canContainChildren: false,
      };

      expect(() => {
        childNodeManager.addChildNode('non-existent', childNode);
      }).toThrow('Parent node with ID non-existent not found');
    });

    it('should throw error when adding child to node that cannot contain children', () => {
      const nonContainerNode: EnhancedContainerNode = {
        id: 'non-container',
        type: 'default',
        position: { x: 0, y: 0 },
        data: { label: 'Non-container Node' },
        canContainChildren: false,
      };

      childNodeManager.initializeNodes([nonContainerNode]);

      const childNode: EnhancedContainerNode = {
        id: 'child-1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'Child Node' },
        canContainChildren: false,
      };

      expect(() => {
        childNodeManager.addChildNode('non-container', childNode);
      }).toThrow('Node non-container cannot contain children');
    });

    it('should remove child node from parent', () => {
      // First add a child
      const childNode: EnhancedContainerNode = {
        id: 'child-1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'Child Node' },
        canContainChildren: false,
      };

      childNodeManager.addChildNode('parent-1', childNode);

      // Then remove it
      childNodeManager.removeChildNode('parent-1', 'child-1');

      const parent = childNodeManager.getNode('parent-1');
      const child = childNodeManager.getNode('child-1');

      expect(parent?.childNodeIds).not.toContain('child-1');
      expect(child?.parentId).toBeUndefined();
      expect(child?.depth).toBe(0);
      expect(child?.scope).toBeUndefined();
    });

    it('should get all child nodes of a parent', () => {
      const childNode1: EnhancedContainerNode = {
        id: 'child-1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'Child Node 1' },
        canContainChildren: false,
      };

      const childNode2: EnhancedContainerNode = {
        id: 'child-2',
        type: 'default',
        position: { x: 200, y: 100 },
        data: { label: 'Child Node 2' },
        canContainChildren: false,
      };

      childNodeManager.addChildNode('parent-1', childNode1);
      childNodeManager.addChildNode('parent-1', childNode2);

      const childNodes = childNodeManager.getChildNodes('parent-1');

      expect(childNodes).toHaveLength(2);
      expect(childNodes.map(n => n.id)).toContain('child-1');
      expect(childNodes.map(n => n.id)).toContain('child-2');
    });

    it('should get parent node of a child', () => {
      const childNode: EnhancedContainerNode = {
        id: 'child-1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'Child Node' },
        canContainChildren: false,
      };

      childNodeManager.addChildNode('parent-1', childNode);

      const parent = childNodeManager.getParentNode('child-1');

      expect(parent).toBeDefined();
      expect(parent?.id).toBe('parent-1');
    });

    it('should return undefined for parent of node without parent', () => {
      const parent = childNodeManager.getParentNode('parent-1');
      expect(parent).toBeUndefined();
    });
  });

  describe('Container Functionality Management', () => {
    beforeEach(() => {
      const testNode: EnhancedContainerNode = {
        id: 'test-node',
        type: 'default',
        position: { x: 0, y: 0 },
        data: { label: 'Test Node' },
        canContainChildren: false,
      };

      childNodeManager.initializeNodes([testNode]);
    });

    it('should check if node can contain children', () => {
      expect(childNodeManager.canNodeContainChildren('test-node')).toBe(false);
    });

    it('should enable container functionality for a node', () => {
      childNodeManager.enableContainerFunctionality('test-node');

      const node = childNodeManager.getNode('test-node');
      expect(node?.canContainChildren).toBe(true);
      expect(node?.childNodeIds).toEqual([]);
      expect(node?.expanded).toBe(false);
    });

    it('should disable container functionality for a node', () => {
      // First enable it and add a child
      childNodeManager.enableContainerFunctionality('test-node');
      
      const childNode: EnhancedContainerNode = {
        id: 'child-1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'Child Node' },
        canContainChildren: false,
      };

      childNodeManager.addChildNode('test-node', childNode);

      // Then disable it
      childNodeManager.disableContainerFunctionality('test-node');

      const node = childNodeManager.getNode('test-node');
      const child = childNodeManager.getNode('child-1');

      expect(node?.canContainChildren).toBe(false);
      expect(node?.childNodeIds).toEqual([]);
      expect(child?.parentId).toBeUndefined();
    });

    it('should throw error when enabling container functionality for non-existent node', () => {
      expect(() => {
        childNodeManager.enableContainerFunctionality('non-existent');
      }).toThrow('Node with ID non-existent not found');
    });
  });

  describe('Scope Management', () => {
    beforeEach(() => {
      const parentNode: EnhancedContainerNode = {
        id: 'parent-1',
        type: 'default',
        position: { x: 0, y: 0 },
        data: { label: 'Parent Node', functionName: 'parentFunction' },
        canContainChildren: true,
        scope: {
          level: 0,
          variables: ['globalVar'],
          functionName: 'parentFunction',
        },
      };

      childNodeManager.initializeNodes([parentNode]);
    });

    it('should update node scope', () => {
      const newScope: ScopeContext = {
        level: 1,
        variables: ['localVar'],
        functionName: 'updatedFunction',
      };

      childNodeManager.updateNodeScope('parent-1', newScope);

      const node = childNodeManager.getNode('parent-1');
      expect(node?.scope).toEqual(newScope);
    });

    it('should update child scopes when parent scope changes', () => {
      // Add a child node
      const childNode: EnhancedContainerNode = {
        id: 'child-1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'Child Node', functionName: 'childFunction' },
        canContainChildren: false,
      };

      childNodeManager.addChildNode('parent-1', childNode);

      // Update parent scope
      const newParentScope: ScopeContext = {
        level: 0,
        variables: ['newGlobalVar'],
        functionName: 'newParentFunction',
      };

      childNodeManager.updateNodeScope('parent-1', newParentScope);

      const child = childNodeManager.getNode('child-1');
      expect(child?.scope?.level).toBe(1);
      expect(child?.scope?.parentScope).toEqual(newParentScope);
      expect(child?.scope?.functionName).toBe('childFunction');
    });

    it('should throw error when updating scope for non-existent node', () => {
      const scope: ScopeContext = {
        level: 1,
        variables: [],
        functionName: 'test',
      };

      expect(() => {
        childNodeManager.updateNodeScope('non-existent', scope);
      }).toThrow('Node with ID non-existent not found');
    });
  });

  describe('Relationship Management', () => {
    beforeEach(() => {
      const parentNode: EnhancedContainerNode = {
        id: 'parent-1',
        type: 'default',
        position: { x: 0, y: 0 },
        data: { label: 'Parent Node' },
        canContainChildren: true,
      };

      childNodeManager.initializeNodes([parentNode]);
    });

    it('should track parent-child relationships', () => {
      const childNode: EnhancedContainerNode = {
        id: 'child-1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'Child Node' },
        canContainChildren: false,
      };

      childNodeManager.addChildNode('parent-1', childNode);

      const relationships = childNodeManager.getRelationships('parent-1');
      expect(relationships).toHaveLength(1);
      expect(relationships[0].parentId).toBe('parent-1');
      expect(relationships[0].childId).toBe('child-1');
      expect(relationships[0].relationshipType).toBe('container_child');
    });

    it('should remove relationships when child is removed', () => {
      const childNode: EnhancedContainerNode = {
        id: 'child-1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'Child Node' },
        canContainChildren: false,
      };

      childNodeManager.addChildNode('parent-1', childNode);
      childNodeManager.removeChildNode('parent-1', 'child-1');

      const relationships = childNodeManager.getRelationships('parent-1');
      expect(relationships).toHaveLength(0);
    });
  });

  describe('Nested Hierarchies', () => {
    it('should handle multiple levels of nesting', () => {
      const grandparentNode: EnhancedContainerNode = {
        id: 'grandparent',
        type: 'default',
        position: { x: 0, y: 0 },
        data: { label: 'Grandparent Node' },
        canContainChildren: true,
        depth: 0,
      };

      const parentNode: EnhancedContainerNode = {
        id: 'parent',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'Parent Node', functionName: 'parentFunction' },
        canContainChildren: true,
      };

      const childNode: EnhancedContainerNode = {
        id: 'child',
        type: 'default',
        position: { x: 200, y: 200 },
        data: { label: 'Child Node', functionName: 'childFunction' },
        canContainChildren: false,
      };

      childNodeManager.initializeNodes([grandparentNode]);
      childNodeManager.addChildNode('grandparent', parentNode);
      childNodeManager.addChildNode('parent', childNode);

      const parent = childNodeManager.getNode('parent');
      const child = childNodeManager.getNode('child');

      expect(parent?.depth).toBe(1);
      expect(parent?.scope?.level).toBe(1);
      expect(child?.depth).toBe(2);
      expect(child?.scope?.level).toBe(2);
      expect(child?.scope?.parentScope?.functionName).toBe('parentFunction');
    });
  });
});