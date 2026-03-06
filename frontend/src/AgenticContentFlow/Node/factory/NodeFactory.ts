/** @format */

import { Node } from '@xyflow/react';
import { FrameJSON, UnifiedNodeInstanceData } from './types/FrameJSON';
import { getNodeType } from '../store/NodeTypeStoreInitializer';

/**
 * Unified Node Factory
 * 
 * Creates nodes of any type using the unified frame format.
 * This factory replaces the separate cell and container factories
 * with a single, unified approach.
 */
export class UnifiedNodeFactory {
  /**
   * Create a node instance from a node type
   */
  static createNode(
    nodeType: string,
    id: string,
    position: { x: number; y: number },
    data?: Partial<UnifiedNodeInstanceData>
  ): Node | null {
    // Get the node configuration from the store
    const config = getNodeType(nodeType);
    if (!config) {
      console.error(`Node type '${nodeType}' not found in store`);
      return null;
    }

    // Merge default data with provided data
    const nodeData: UnifiedNodeInstanceData = {
      label: data?.label || config.defaultLabel,
      details: data?.details || config.description,
      nodeLevel: data?.nodeLevel || 'basic',
      expanded: data?.expanded ?? false,
      ...data
    };

    // Determine dimensions based on node type and state
    const dimensions = this.getNodeDimensions(config, nodeData.expanded);

    // Create the node instance
    const node: Node = {
      id,
      type: 'unifiedNode', // All nodes use the same wrapper component
      position,
      data: {
        ...nodeData,
        config // Pass the configuration to the wrapper
      },
      ...dimensions
    };

    return node;
  }

  /**
   * Create multiple nodes of the same type
   */
  static createMultipleNodes(
    nodeType: string,
    positions: Array<{ id: string; position: { x: number; y: number } }>,
    data?: Partial<UnifiedNodeInstanceData>
  ): Node[] {
    return positions
      .map(({ id, position }) => this.createNode(nodeType, id, position, data))
      .filter((node): node is Node => node !== null);
  }

  /**
   * Create a node with custom configuration
   */
  static createCustomNode(
    config: FrameJSON,
    id: string,
    position: { x: number; y: number },
    data?: Partial<UnifiedNodeInstanceData>
  ): Node | null {
    // Merge default data with provided data
    const nodeData: UnifiedNodeInstanceData = {
      label: data?.label || config.defaultLabel,
      details: data?.details || config.description,
      nodeLevel: data?.nodeLevel || 'basic',
      expanded: data?.expanded ?? false,
      ...data
    };

    // Determine dimensions based on node type and state
    const dimensions = this.getNodeDimensions(config, nodeData.expanded);

    // Create the node instance
    const node: Node = {
      id,
      type: 'unifiedNode',
      position,
      data: {
        ...nodeData,
        config
      },
      ...dimensions
    };

    return node;
  }

  /**
   * Get node dimensions based on configuration and state
   */
  private static getNodeDimensions(
    config: FrameJSON,
    expanded?: boolean
  ): { width: number; height: number } {
    // Use defaultDimensions for all node types
    return config.defaultDimensions || { width: 200, height: 200 };
  }

  /**
   * Validate a node configuration
   */
  static validateConfig(config: FrameJSON): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!config.nodeType) errors.push('nodeType is required');
    if (!config.defaultLabel) errors.push('defaultLabel is required');
    if (!config.category) errors.push('category is required');
    if (!config.group) errors.push('group is required');
    if (!config.description) errors.push('description is required');

    // Visual configuration
    if (!config.visual?.icon) errors.push('visual.icon is required');

    // Group configuration
    if (!['cell', 'container'].includes(config.group)) {
      errors.push('group must be either "cell" or "container"');
    }

    // Default dimensions configuration
    if (!config.defaultDimensions) {
      errors.push('defaultDimensions is required');
    }

    // Handles configuration
    if (!config.handles?.category) errors.push('handles.category is required');
    if (!config.handles?.definitions?.length) {
      errors.push('handles.definitions must have at least one definition');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get node type information
   */
  static getNodeTypeInfo(nodeType: string): {
    exists: boolean;
    isCellLike: boolean;
    isContainerLike: boolean;
    category: string;
    group: string;
  } {
    const config = getNodeType(nodeType);
    if (!config) {
      return {
        exists: false,
        isCellLike: false,
        isContainerLike: false,
        category: '',
        group: ''
      };
    }

    return {
      exists: true,
      isCellLike: config.group === "cell",
      isContainerLike: config.group === "container",
      category: config.category,
      group: config.group
    };
  }

  /**
   * Get all available node types
   */
  static getAvailableNodeTypes(): string[] {
    // This would need to be imported from the store initializer
    // For now, return a placeholder
    return ['restnode', 'datanode'];
  }
}

/**
 * Factory function for creating unified nodes
 * This is the main entry point for creating nodes
 */
export function createUnifiedNode(
  nodeType: string,
  id: string,
  position: { x: number; y: number },
  data?: Partial<UnifiedNodeInstanceData>
): Node | null {
  return UnifiedNodeFactory.createNode(nodeType, id, position, data);
}

/**
 * Factory function for creating custom unified nodes
 */
export function createCustomUnifiedNode(
  config: FrameJSON,
  id: string,
  position: { x: number; y: number },
  data?: Partial<UnifiedNodeInstanceData>
): Node | null {
  return UnifiedNodeFactory.createCustomNode(config, id, position, data);
} 