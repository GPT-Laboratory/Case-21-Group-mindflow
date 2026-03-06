/** @format */

import { FunctionMetadata, ParsedFileStructure } from '../types/ASTTypes';
import {
  EnhancedContainerNode,
  ScopeContext,
  ParentChildRelationship,
  EnhancedNodeData
} from '../../Node/interfaces/ContainerNodeInterfaces';

/**
 * Service for processing nested functions and creating parent-child node relationships
 */
export class NestedFunctionProcessor {

  /**
   * Convert parsed file structure to enhanced container nodes with proper nesting
   */
  createNodesFromParsedFile(parsedFile: ParsedFileStructure): {
    nodes: EnhancedContainerNode[];
    relationships: ParentChildRelationship[];
  } {
    const nodes: EnhancedContainerNode[] = [];
    const relationships: ParentChildRelationship[] = [];
    const functionIdMap = new Map<string, string>(); // Maps function metadata ID to node ID

    // First pass: Create all nodes
    parsedFile.functions.forEach((func, index) => {
      const nodeId = `function-node-${index}`;
      functionIdMap.set(func.id, nodeId);

      const scope = this.createScopeFromFunction(func, parsedFile.functions);
      const nodeData: EnhancedNodeData = {
        label: func.name,
        details: func.description,
        functionName: func.name,
        functionDescription: func.description,
        isNestedFunction: func.isNested,
        canContainChildren: true, // All function nodes can potentially contain nested functions
      };

      const node: EnhancedContainerNode = {
        id: nodeId,
        type: 'function',
        position: this.calculateNodePosition(func, index),
        data: nodeData,
        canContainChildren: true,
        childNodeIds: [], // Initialize as empty array
        scope: scope,
        expanded: false,
        depth: this.calculateDepth(func, parsedFile.functions),
      };

      nodes.push(node);
    });

    // Second pass: Establish parent-child relationships
    parsedFile.functions.forEach((func) => {
      if (func.isNested && func.parentFunction) {
        const childNodeId = functionIdMap.get(func.id);
        const parentNodeId = functionIdMap.get(func.parentFunction);

        if (childNodeId && parentNodeId) {
          // Update parent node to include child
          const parentNode = nodes.find(n => n.id === parentNodeId);
          const childNode = nodes.find(n => n.id === childNodeId);

          if (parentNode && childNode) {
            // Ensure childNodeIds is initialized
            if (!parentNode.childNodeIds) {
              parentNode.childNodeIds = [];
            }
            
            // Add child to parent's childNodeIds if not already present
            if (!parentNode.childNodeIds.includes(childNodeId)) {
              parentNode.childNodeIds.push(childNodeId);
            }

            // Update child node with parent reference
            childNode.parentId = parentNodeId;

            // Create relationship
            relationships.push({
              parentId: parentNodeId,
              childId: childNodeId,
              relationshipType: 'nested_function',
              scope: childNode.scope,
            });
          }
        }
      }
    });



    return { nodes, relationships };
  }

  /**
   * Create scope context from function metadata
   */
  private createScopeFromFunction(func: FunctionMetadata, allFunctions: FunctionMetadata[]): ScopeContext {
    const parentScope = func.parentFunction
      ? this.findParentScope(func.parentFunction, allFunctions)
      : undefined;

    return {
      level: func.isNested ? (parentScope?.level || 0) + 1 : 0,
      variables: func.parameters.map(p => p.name),
      parentScope: parentScope,
      functionName: func.name,
    };
  }

  /**
   * Find parent scope context
   */
  private findParentScope(parentFunctionId: string, allFunctions: FunctionMetadata[]): ScopeContext | undefined {
    const parentFunc = allFunctions.find(f => f.id === parentFunctionId);
    if (!parentFunc) return undefined;

    return this.createScopeFromFunction(parentFunc, allFunctions);
  }

  /**
   * Calculate node depth in the hierarchy
   */
  private calculateDepth(func: FunctionMetadata, allFunctions: FunctionMetadata[]): number {
    if (!func.isNested) return 0;

    let depth = 0;
    let currentFunc = func;

    while (currentFunc.parentFunction) {
      depth++;
      const parentFunc = allFunctions.find(f => f.id === currentFunc.parentFunction);
      if (!parentFunc) break;
      currentFunc = parentFunc;
    }

    return depth;
  }

  /**
   * Calculate node position based on function metadata and nesting
   */
  private calculateNodePosition(func: FunctionMetadata, index: number): { x: number; y: number } {
    const baseX = 100;
    const baseY = 100;
    const spacing = 200;
    const nestingOffset = 50;

    // Calculate position based on source location if available
    const x = func.sourceLocation ?
      baseX + (func.sourceLocation.start.column * 2) :
      baseX + (index % 5) * spacing;

    const y = func.sourceLocation ?
      baseY + (func.sourceLocation.start.line * 30) :
      baseY + Math.floor(index / 5) * spacing;

    // Add nesting offset for nested functions
    const nestingDepth = this.calculateDepthFromMetadata(func);

    return {
      x: x + (nestingDepth * nestingOffset),
      y: y + (nestingDepth * nestingOffset),
    };
  }

  /**
   * Calculate nesting depth from function metadata
   */
  private calculateDepthFromMetadata(func: FunctionMetadata): number {
    return func.isNested ? 1 : 0; // Simplified for now, could be enhanced
  }

  /**
   * Update existing nodes with nested function relationships
   */
  updateNodesWithNesting(
    existingNodes: EnhancedContainerNode[],
    parsedFile: ParsedFileStructure
  ): {
    updatedNodes: EnhancedContainerNode[];
    newRelationships: ParentChildRelationship[];
  } {
    const { nodes: newNodes, relationships } = this.createNodesFromParsedFile(parsedFile);
    const updatedNodes = [...existingNodes];
    const newRelationships: ParentChildRelationship[] = [];

    // Merge new function nodes with existing nodes
    newNodes.forEach(newNode => {
      const existingIndex = updatedNodes.findIndex(n => n.id === newNode.id);
      if (existingIndex >= 0) {
        // Update existing node
        updatedNodes[existingIndex] = {
          ...updatedNodes[existingIndex],
          ...newNode,
          // Preserve some existing properties
          position: updatedNodes[existingIndex].position,
          selected: updatedNodes[existingIndex].selected,
        };
      } else {
        // Add new node
        updatedNodes.push(newNode);
      }
    });

    // Add new relationships
    newRelationships.push(...relationships);

    return { updatedNodes, newRelationships };
  }

  /**
   * Validate nested function structure
   */
  validateNestedStructure(nodes: EnhancedContainerNode[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    nodes.forEach(node => {
      // Check if parent exists
      if (node.parentId && !nodeMap.has(node.parentId)) {
        errors.push(`Node ${node.id} references non-existent parent ${node.parentId}`);
      }

      // Check if children exist
      node.childNodeIds?.forEach(childId => {
        if (!nodeMap.has(childId)) {
          errors.push(`Node ${node.id} references non-existent child ${childId}`);
        }
      });

      // Check for circular references
      if (this.hasCircularReference(node, nodeMap)) {
        errors.push(`Circular reference detected for node ${node.id}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check for circular references in parent-child relationships
   */
  private hasCircularReference(
    node: EnhancedContainerNode,
    nodeMap: Map<string, EnhancedContainerNode>,
    visited: Set<string> = new Set()
  ): boolean {
    if (visited.has(node.id)) {
      return true;
    }

    visited.add(node.id);

    if (node.parentId) {
      const parent = nodeMap.get(node.parentId);
      if (parent && this.hasCircularReference(parent, nodeMap, visited)) {
        return true;
      }
    }

    visited.delete(node.id);
    return false;
  }
}

/**
 * Singleton instance of the nested function processor
 */
export const nestedFunctionProcessor = new NestedFunctionProcessor();