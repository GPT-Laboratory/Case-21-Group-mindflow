import { 
  JSONNodeFactory, 
  NodeConfigurationLoader,
  NodeFactoryJSON 
} from './index';
import { registerNodeType } from '../registry/nodeTypeRegistry';
import { Node } from '@xyflow/react';
import { NodeData } from '../../types';
import { handleRegistry } from '../../Handle/registry/handleTypeRegistry';
import { NodeHandleConfiguration } from '../../types/handleTypes';

/**
 * Factory-based node registration system
 * 
 * This integrates the JSON-driven node factory with the existing node registration system.
 * Instead of manually creating node components, nodes are generated from JSON configurations.
 */
export class FactoryNodeRegistration {
  private factory: JSONNodeFactory;
  private configLoader: NodeConfigurationLoader;
  
  constructor() {
    this.factory = new JSONNodeFactory();
    this.configLoader = new NodeConfigurationLoader();
  }
  
  /**
   * Initialize and register all factory-based nodes
   */
  async initializeFactoryNodes(): Promise<void> {
    // Load built-in configurations
    await this.configLoader.loadBuiltInConfigurations();
    
    // Get all configurations
    const configurations = this.configLoader.getAllConfigurations();
    
    // Register each configuration as a node type
    configurations.forEach((config) => {
      this.registerFactoryNode(config);
      this.registerFactoryHandles(config);
    });
    
    console.log(`✅ Registered ${configurations.size} factory-based node types:`, 
                Array.from(configurations.keys()));
  }
  
  /**
   * Register a single factory-based node
   */
  private registerFactoryNode(config: NodeFactoryJSON): void {
    // Create the React component from the JSON configuration
    const NodeComponent = this.factory.createNodeComponent(config);
    
    // Create template function for node creation
    const createTemplate = (params: {
      id: string;
      position: { x: number; y: number };
      eventNode?: Node<NodeData>;
    } & Record<string, any>): Node<NodeData> => {
      const { id, position, eventNode } = params;
      
      return {
        id,
        type: config.nodeType,
        data: {
          // Merge template defaults with any overrides
          ...config.template.defaultData,
          ...params,
          label: params.label || config.defaultLabel,
          nodeLevel: params.nodeLevel || 'intermediate',
          details: params.details || config.description,
          // Set parent relationships if available
          parent: eventNode?.id,
          subject: eventNode?.data.subject || config.category,
        },
        style: {
          width: config.template.defaultDimensions.width,
          height: config.template.defaultDimensions.height,
        },
        position,
        parentId: eventNode?.parentId,
        extent: eventNode?.parentId ? "parent" : undefined,
      };
    };
    
    // Register with the existing node type registry
    registerNodeType(
      config.nodeType,
      NodeComponent,
      createTemplate,
      false, // These are cell-based nodes, not parent containers
      config.template.defaultDimensions,
      true // Force immediate registration for factory nodes
    );
    
    console.log(`🏭 Registered factory node: ${config.nodeType}`);
  }
  
  /**
   * Register handle configurations for factory nodes
   */
  private registerFactoryHandles(config: NodeFactoryJSON): void {
    console.log(`🔍 Attempting to register handles for: ${config.nodeType}`);
    
    // Create handle configuration based on node type
    let handleConfig: NodeHandleConfiguration;
    
    switch (config.nodeType) {
      case 'restnode':
        handleConfig = {
          nodeType: 'restnode',
          category: 'integration',
          handles: [
            {
              position: 'right',
              type: 'source',
              dataFlow: 'data',
              connectsTo: ['logic', 'view'],
              icon: 'arrow-right',
              edgeType: 'package'
            },
            {
              position: 'left',
              type: 'target',
              dataFlow: 'control',
              acceptsFrom: ['data', 'logic'],
              icon: 'arrow-left',
              edgeType: 'default'
            }
          ]
        };
        break;
        
      case 'logicalnode':
        handleConfig = {
          nodeType: 'logicalnode',
          category: 'logic',
          handles: [
            {
              position: 'left',
              type: 'target',
              dataFlow: 'data',
              acceptsFrom: ['integration', 'data'],
              icon: 'arrow-left',
              edgeType: 'package'
            },
            {
              position: 'right',
              type: 'source',
              dataFlow: 'data',
              connectsTo: ['view', 'logic'],
              icon: 'arrow-right',
              edgeType: 'package'
            }
          ]
        };
        break;
        
      case 'contentnode':
        handleConfig = {
          nodeType: 'contentnode',
          category: 'view',
          handles: [
            {
              position: 'left',
              type: 'target',
              dataFlow: 'data',
              acceptsFrom: ['logic', 'integration', 'data'],
              icon: 'arrow-left',
              edgeType: 'package'
            },
            {
              position: 'right',
              type: 'source',
              dataFlow: 'data',
              connectsTo: ['integration', 'data'],
              icon: 'arrow-right',
              edgeType: 'package'
            }
          ]
        };
        break;
        
      default:
        console.warn(`❌ No handle configuration available for factory node: ${config.nodeType}`);
        return;
    }
    
    console.log(`📋 Handle config created for ${config.nodeType}:`, handleConfig);
    
    try {
      // Register the handle configuration immediately
      handleRegistry.registerNodeHandles(handleConfig);
      console.log(`🔌 Successfully registered handles for factory node: ${config.nodeType}`);
    } catch (error) {
      console.error(`❌ Failed to register handles for ${config.nodeType}:`, error);
    }
  }
  
  /**
   * Add a custom configuration and register it
   */
  async addCustomConfiguration(config: NodeFactoryJSON): Promise<void> {
    await this.configLoader.loadConfiguration(config.nodeType, config);
    this.registerFactoryNode(config);
  }
  
  /**
   * Get the factory instance for advanced usage
   */
  getFactory(): JSONNodeFactory {
    return this.factory;
  }
  
  /**
   * Get the configuration loader for advanced usage
   */
  getConfigurationLoader(): NodeConfigurationLoader {
    return this.configLoader;
  }
  
  /**
   * Test a node configuration by executing its process function
   */
  async testNodeConfiguration(
    nodeType: string, 
    nodeData: any, 
    incomingData?: any
  ): Promise<any> {
    const config = this.configLoader.getConfiguration(nodeType);
    if (!config) {
      throw new Error(`No configuration found for node type: ${nodeType}`);
    }
    
    return await this.factory.executeProcessFunction(config, nodeData, incomingData);
  }
}

// Create a singleton instance for global use
export const factoryNodeRegistration = new FactoryNodeRegistration();

/**
 * Initialize factory-based nodes
 * Call this function during application startup to register all factory-based nodes
 */
export async function initializeFactoryNodes(): Promise<void> {
  await factoryNodeRegistration.initializeFactoryNodes();
}

/**
 * Example usage and demonstration
 */
export async function demonstrateFactoryUsage(): Promise<void> {
  try {
    // Initialize the factory system
    await initializeFactoryNodes();
    
    // Test REST node with sample data
    console.log('🧪 Testing REST Node...');
    const restResult = await factoryNodeRegistration.testNodeConfiguration(
      'restnode',
      {
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    console.log('REST Node Result:', restResult);
    
    // Test Logical Node with sample data
    console.log('🧪 Testing Logical Node...');
    const sampleData = [
      { id: 1, title: 'Post 1', userId: 1 },
      { id: 2, title: 'Post 2', userId: 2 },
      { id: 3, title: 'Post 3', userId: 1 }
    ];
    
    const logicalResult = await factoryNodeRegistration.testNodeConfiguration(
      'logicalnode',
      {
        operation: 'filter',
        condition: 'userId === 1'
      },
      sampleData
    );
    console.log('Logical Node Result:', logicalResult);
    
    // Test Content Node with processed data
    console.log('🧪 Testing Content Node...');
    const contentResult = await factoryNodeRegistration.testNodeConfiguration(
      'contentnode',
      {
        displayType: 'list',
        maxItems: 5
      },
      logicalResult
    );
    console.log('Content Node Result:', contentResult);
    
  } catch (error) {
    console.error('❌ Factory demonstration failed:', error);
  }
}