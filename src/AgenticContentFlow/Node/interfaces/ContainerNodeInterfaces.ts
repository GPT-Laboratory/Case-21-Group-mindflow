/** @format */

import { Node } from '@xyflow/react';

/**
 * Scope context for nested functions and child nodes
 */
export interface ScopeContext {
  /** The scope level (0 = global, 1 = function level, etc.) */
  level: number;
  /** Variables available in this scope */
  variables: string[];
  /** Parent scope context */
  parentScope?: ScopeContext;
  /** Function name that defines this scope */
  functionName?: string;
}

/**
 * Enhanced container node interface that extends the base Node
 * This allows any node to contain child nodes
 */
export interface EnhancedContainerNode<T extends Record<string, unknown> = Record<string, unknown>> extends Node<T> {
  /** Array of child node IDs */
  childNodeIds?: string[];
  /** Parent node ID (already exists in React Flow Node) */
  parentId?: string;
  /** Scope context for this node */
  scope?: ScopeContext;
  /** Whether this node can contain children */
  canContainChildren: boolean;
  /** Whether this node is currently expanded to show children */
  expanded?: boolean;
  /** Depth level in the hierarchy */
  depth?: number;
  /** Container configuration for this node */
  containerConfig?: ContainerNodeConfig;
}

/**
 * Child node management methods interface
 */
export interface ChildNodeManager {
  /** Add a child node to a parent */
  addChildNode(parentId: string, childNode: EnhancedContainerNode): void;
  /** Remove a child node from a parent */
  removeChildNode(parentId: string, childNodeId: string): void;
  /** Get all child nodes of a parent */
  getChildNodes(parentId: string): EnhancedContainerNode[];
  /** Get the parent node of a child */
  getParentNode(childNodeId: string): EnhancedContainerNode | undefined;
  /** Check if a node can contain children */
  canNodeContainChildren(nodeId: string): boolean;
  /** Update the scope context of a node */
  updateNodeScope(nodeId: string, scope: ScopeContext): void;
}

/**
 * Parent-child relationship data structure
 */
export interface ParentChildRelationship {
  /** Parent node ID */
  parentId: string;
  /** Child node ID */
  childId: string;
  /** Type of relationship */
  relationshipType: 'nested_function' | 'external_dependency' | 'container_child';
  /** Scope information for the relationship */
  scope?: ScopeContext;
}

/**
 * Container node configuration
 */
export interface ContainerNodeConfig {
  /** Whether the node can contain children by default */
  canContainChildren: boolean;
  /** Maximum number of children allowed (-1 for unlimited) */
  maxChildren: number;
  /** Allowed child node types (empty array means all types allowed) */
  allowedChildTypes: string[];
  /** Default expanded state */
  defaultExpanded: boolean;
  /** Layout direction for child nodes */
  childLayoutDirection?: 'horizontal' | 'vertical' | 'grid';
}

/**
 * Enhanced node data that includes container functionality
 */
export interface EnhancedNodeData {
  /** Standard node data properties */
  label: string;
  details?: string;
  
  /** Container-specific properties */
  canContainChildren?: boolean;
  expanded?: boolean;
  childNodeIds?: string[];
  scope?: ScopeContext;
  
  /** Function-specific properties for AST parsing */
  functionName?: string;
  functionDescription?: string;
  isNestedFunction?: boolean;
  externalDependencies?: string[];
  
  /** Additional properties */
  [key: string]: any;
}