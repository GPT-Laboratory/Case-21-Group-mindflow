/** @format */

import { 
  EnhancedContainerNode, 
  ChildNodeManager, 
  ScopeContext, 
  ParentChildRelationship,
} from '../interfaces/ContainerNodeInterfaces';

/**
 * Implementation of child node management functionality
 * Handles adding, removing, and managing parent-child relationships for all nodes
 */
export class ChildNodeManagerService implements ChildNodeManager {
  private nodes: Map<string, EnhancedContainerNode>;
  private parentChildRelationships: Map<string, ParentChildRelationship[]>;

  constructor() {
    this.nodes = new Map();
    this.parentChildRelationships = new Map();
  }

  /**
   * Initialize the manager with existing nodes
   */
  initializeNodes(nodes: EnhancedContainerNode[]): void {
    this.nodes.clear();
    this.parentChildRelationships.clear();
    
    nodes.forEach(node => {
      this.nodes.set(node.id, node);
      
      // Build parent-child relationships
      if (node.parentId) {
        this.addRelationship({
          parentId: node.parentId,
          childId: node.id,
          relationshipType: 'container_child',
          scope: node.scope
        });
      }
    });
  }

  /**
   * Add a child node to a parent
   */
  addChildNode(parentId: string, childNode: EnhancedContainerNode): void {
    const parent = this.nodes.get(parentId);
    if (!parent) {
      throw new Error(`Parent node with ID ${parentId} not found`);
    }

    if (!parent.canContainChildren) {
      throw new Error(`Node ${parentId} cannot contain children`);
    }

    // Update parent node
    const updatedParent: EnhancedContainerNode = {
      ...parent,
      childNodeIds: [...(parent.childNodeIds || []), childNode.id]
    };

    // Update child node
    const updatedChild: EnhancedContainerNode = {
      ...childNode,
      parentId: parentId,
      depth: (parent.depth || 0) + 1,
      scope: this.createChildScope(parent.scope, (childNode.data as any)?.functionName)
    };

    // Store updated nodes
    this.nodes.set(parentId, updatedParent);
    this.nodes.set(childNode.id, updatedChild);

    // Add relationship
    this.addRelationship({
      parentId: parentId,
      childId: childNode.id,
      relationshipType: 'container_child',
      scope: updatedChild.scope
    });
  }

  /**
   * Remove a child node from a parent
   */
  removeChildNode(parentId: string, childNodeId: string): void {
    const parent = this.nodes.get(parentId);
    const child = this.nodes.get(childNodeId);

    if (!parent || !child) {
      throw new Error(`Parent or child node not found`);
    }

    // Update parent node
    const updatedParent: EnhancedContainerNode = {
      ...parent,
      childNodeIds: (parent.childNodeIds || []).filter(id => id !== childNodeId)
    };

    // Update child node
    const updatedChild: EnhancedContainerNode = {
      ...child,
      parentId: undefined,
      depth: 0,
      scope: undefined
    };

    // Store updated nodes
    this.nodes.set(parentId, updatedParent);
    this.nodes.set(childNodeId, updatedChild);

    // Remove relationship
    this.removeRelationship(parentId, childNodeId);
  }

  /**
   * Get all child nodes of a parent
   */
  getChildNodes(parentId: string): EnhancedContainerNode[] {
    const parent = this.nodes.get(parentId);
    if (!parent || !parent.childNodeIds) {
      return [];
    }

    return parent.childNodeIds
      .map(childId => this.nodes.get(childId))
      .filter((node): node is EnhancedContainerNode => node !== undefined);
  }

  /**
   * Get the parent node of a child
   */
  getParentNode(childNodeId: string): EnhancedContainerNode | undefined {
    const child = this.nodes.get(childNodeId);
    if (!child || !child.parentId) {
      return undefined;
    }

    return this.nodes.get(child.parentId);
  }

  /**
   * Check if a node can contain children
   */
  canNodeContainChildren(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    return node?.canContainChildren || false;
  }

  /**
   * Update the scope context of a node
   */
  updateNodeScope(nodeId: string, scope: ScopeContext): void {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node with ID ${nodeId} not found`);
    }

    const updatedNode: EnhancedContainerNode = {
      ...node,
      scope: scope
    };

    this.nodes.set(nodeId, updatedNode);

    // Update all child nodes' scopes
    this.updateChildrenScopes(nodeId, scope);
  }

  /**
   * Get all nodes as an array
   */
  getAllNodes(): EnhancedContainerNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get a specific node by ID
   */
  getNode(nodeId: string): EnhancedContainerNode | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * Update a node
   */
  updateNode(node: EnhancedContainerNode): void {
    this.nodes.set(node.id, node);
  }

  /**
   * Get parent-child relationships for a parent
   */
  getRelationships(parentId: string): ParentChildRelationship[] {
    return this.parentChildRelationships.get(parentId) || [];
  }

  /**
   * Enable container functionality for a node
   */
  enableContainerFunctionality(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node with ID ${nodeId} not found`);
    }

    const updatedNode: EnhancedContainerNode = {
      ...node,
      canContainChildren: true,
      childNodeIds: node.childNodeIds || [],
      expanded: node.expanded ?? false
    };

    this.nodes.set(nodeId, updatedNode);
  }

  /**
   * Disable container functionality for a node
   */
  disableContainerFunctionality(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node with ID ${nodeId} not found`);
    }

    // Remove all child relationships first
    const childNodes = this.getChildNodes(nodeId);
    childNodes.forEach(child => {
      this.removeChildNode(nodeId, child.id);
    });

    const updatedNode: EnhancedContainerNode = {
      ...node,
      canContainChildren: false,
      childNodeIds: [],
      expanded: false
    };

    this.nodes.set(nodeId, updatedNode);
  }

  /**
   * Convert a regular node to an enhanced container node
   */
  convertToEnhancedNode(node: any): EnhancedContainerNode {
    return {
      ...node,
      canContainChildren: node.canContainChildren ?? node.data?.canContainChildren ?? false,
      childNodeIds: node.childNodeIds ?? node.data?.childNodeIds ?? [],
      scope: node.scope ?? node.data?.scope,
      expanded: node.expanded ?? node.data?.expanded ?? false,
      depth: node.depth ?? node.data?.depth ?? 0,
      containerConfig: node.containerConfig ?? node.data?.containerConfig
    };
  }

  /**
   * Private method to add a relationship
   */
  private addRelationship(relationship: ParentChildRelationship): void {
    const existing = this.parentChildRelationships.get(relationship.parentId) || [];
    existing.push(relationship);
    this.parentChildRelationships.set(relationship.parentId, existing);
  }

  /**
   * Private method to remove a relationship
   */
  private removeRelationship(parentId: string, childId: string): void {
    const existing = this.parentChildRelationships.get(parentId) || [];
    const filtered = existing.filter(rel => rel.childId !== childId);
    this.parentChildRelationships.set(parentId, filtered);
  }

  /**
   * Private method to create child scope
   */
  private createChildScope(parentScope?: ScopeContext, functionName?: string): ScopeContext {
    return {
      level: (parentScope?.level || 0) + 1,
      variables: [], // Will be populated by AST parsing
      parentScope: parentScope,
      functionName: functionName
    };
  }

  /**
   * Private method to update children scopes recursively
   */
  private updateChildrenScopes(parentId: string, parentScope: ScopeContext): void {
    const childNodes = this.getChildNodes(parentId);
    
    childNodes.forEach(child => {
      const childScope = this.createChildScope(parentScope, (child.data as any)?.functionName);
      this.updateNodeScope(child.id, childScope);
    });
  }
}

/**
 * Singleton instance of the child node manager
 */
export const childNodeManager = new ChildNodeManagerService();