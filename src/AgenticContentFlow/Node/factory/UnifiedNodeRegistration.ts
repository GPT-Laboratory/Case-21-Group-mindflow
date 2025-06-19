/** @format */

import { Node } from '@xyflow/react';
import { NodeData } from '@/AgenticContentFlow/types';
import { registerNodeType } from '@/AgenticContentFlow/Node/registry/nodeTypeRegistry';
import { UnifiedNodeWrapper } from '@/AgenticContentFlow/Node/factory/components/NodeWrapper';
import { UnifiedFrameJSON } from '@/AgenticContentFlow/Node/factory/types/UnifiedFrameJSON';
import { getNodeType } from '@/AgenticContentFlow/Node/store/unifiedNodeTypeStoreInitializer';

/**
 * Unified Node Registration System
 * 
 * This integrates the unified node factory with the existing node registration system.
 * All unified nodes use the same wrapper component but with different configurations.
 */
export class UnifiedNodeRegistration {
  
  /**
   * Initialize and register all unified nodes
   */
  async initializeUnifiedNodes(): Promise<void> {
    // Get all available node types from the unified store
    const { useUnifiedNodeTypeStore } = await import('../store/useUnifiedNodeTypeStore');
    const nodeTypeNames = useUnifiedNodeTypeStore.getState().getAllNodeTypeNames();
    
    // Register each node type with the unified wrapper
    nodeTypeNames.forEach((nodeType: string) => {
      this.registerUnifiedNode(nodeType);
    });
    
    console.log(`✅ Registered ${nodeTypeNames.length} unified node types:`, nodeTypeNames);
  }
  
  /**
   * Register a single unified node
   */
  private registerUnifiedNode(nodeType: string): void {
    // Get the node configuration from the store
    const config = getNodeType(nodeType);
    if (!config) {
      console.error(`No configuration found for node type: ${nodeType}`);
      return;
    }
    
    // Create template function for node creation
    const createTemplate = (params: {
      id: string;
      position: { x: number; y: number };
      eventNode?: Node<NodeData>;
    } & Record<string, any>): Node<NodeData> => {
      const { id, position, eventNode, ...customData } = params;
      
      return {
        id,
        type: nodeType, // Use the actual node type name, not 'unifiedNode'
        data: {
          // Merge default data with any overrides
          label: params.label || config.defaultLabel,
          details: params.details || config.description,
          nodeLevel: params.nodeLevel || 'basic',
          expanded: params.expanded ?? false,
          // Set parent relationships if available
          parent: eventNode?.id,
          subject: eventNode?.data.subject || config.category,
          // Pass any custom data
          ...customData
        },
        style: {
          width: config.defaultDimensions.width,
          height: config.defaultDimensions.height,
        },
        position,
        parentId: eventNode?.parentId,
        extent: eventNode?.parentId ? "parent" : undefined,
      };
    };
    
    // Register with the existing node type registry
    registerNodeType(
      nodeType,
      UnifiedNodeWrapper,
      createTemplate,
      config.group === "container", // Container nodes can be parents
      config.defaultDimensions,
      true // Force immediate registration for unified nodes
    );
    
    console.log(`🏭 Registered unified node: ${nodeType} (${config.group})`);
  }
  
  /**
   * Add a custom unified node configuration and register it
   */
  async addCustomUnifiedNode(nodeType: string, config: UnifiedFrameJSON): Promise<void> {
    // Add to the unified store
    const { useUnifiedNodeTypeStore } = await import('../store/useUnifiedNodeTypeStore');
    useUnifiedNodeTypeStore.getState().addNodeType(nodeType, config);
    
    // Register with the node type registry
    this.registerUnifiedNode(nodeType);
  }
  
  /**
   * Get all registered unified node types
   */
  async getRegisteredNodeTypes(): Promise<string[]> {
    const { useUnifiedNodeTypeStore } = await import('../store/useUnifiedNodeTypeStore');
    return useUnifiedNodeTypeStore.getState().getAllNodeTypeNames();
  }
  
  /**
   * Test a unified node configuration by executing its process function
   */
  async testUnifiedNode(
    nodeType: string, 
    nodeData: any, 
    incomingData?: any
  ): Promise<any> {
    const config = getNodeType(nodeType);
    if (!config) {
      throw new Error(`No configuration found for node type: ${nodeType}`);
    }
    
    if (!config.process) {
      throw new Error(`Node type ${nodeType} does not have a process function`);
    }
    
    // Execute the process function
    const processFunction = new Function(
      'incomingData', 'nodeData', 'params', 'targetMap', 'sourceMap',
      config.process.templateCode || ''
    );
    
    // Create mock target and source maps for testing
    const targetMap = new Map();
    const sourceMap = new Map();
    
    return await processFunction(incomingData, nodeData, config.process.parameters || {}, targetMap, sourceMap);
  }
}

// Create a singleton instance for global use
export const unifiedNodeRegistration = new UnifiedNodeRegistration();

/**
 * Initialize unified nodes
 * Call this function during application startup to register all unified nodes
 */
export async function initializeUnifiedNodes(): Promise<void> {
  await unifiedNodeRegistration.initializeUnifiedNodes();
}

/**
 * Example usage and demonstration
 */
export async function demonstrateUnifiedNodeUsage(): Promise<void> {
  try {
    // Initialize the unified system
    await initializeUnifiedNodes();
    
    // Test REST node with sample data
    console.log('🧪 Testing Unified REST Node...');
    const restResult = await unifiedNodeRegistration.testUnifiedNode(
      'restnode',
      {
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    console.log('Unified REST Node Result:', restResult);
    
    // Test Data node with sample data
    console.log('🧪 Testing Unified Data Node...');
    const sampleData = [
      { id: 1, title: 'Post 1', userId: 1 },
      { id: 2, title: 'Post 2', userId: 2 },
      { id: 3, title: 'Post 3', userId: 1 }
    ];
    
    const dataResult = await unifiedNodeRegistration.testUnifiedNode(
      'datanode',
      {
        operation: 'filter',
        condition: 'userId === 1'
      },
      sampleData
    );
    console.log('Unified Data Node Result:', dataResult);
    
    console.log('✅ Unified node system demonstration completed successfully');
    
  } catch (error) {
    console.error('❌ Unified node system demonstration failed:', error);
  }
} 