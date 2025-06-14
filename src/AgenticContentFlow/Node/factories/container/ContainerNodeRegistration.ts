/** @format */

import { ContainerNodeFactory, containerNodeFactory } from './ContainerNodeFactory';
import { ContainerConfigurationLoader } from './ContainerConfigurationLoader';
import { ContainerNodeJSON } from './types';
import { registerNodeType } from '../../registry/nodeTypeRegistry';
import { Node } from '@xyflow/react';
import { NodeData } from '../../../types';

/**
 * Container-based node registration system
 * 
 * This integrates the JSON-driven container factory with the existing node registration system.
 * Container nodes are generated from JSON configurations and handle expand/collapse, resizing,
 * and parent-child relationships.
 */
export class ContainerNodeRegistration {
  private factory: ContainerNodeFactory;
  private configLoader: ContainerConfigurationLoader;
  
  constructor() {
    this.factory = containerNodeFactory; // Use the singleton instance
    this.configLoader = new ContainerConfigurationLoader();
  }
  
  /**
   * Initialize and register all container-based nodes
   */
  async initializeContainerNodes(): Promise<void> {
    // Load built-in configurations
    await this.configLoader.loadBuiltInConfigurations();
    
    // Get all configurations and register them with the factory
    const configurations = this.configLoader.getAllConfigurations();
    
    // Register each configuration with the factory and node registry
    configurations.forEach((config) => {
      // Register configuration with the factory
      this.factory.registerConfiguration(config.nodeType, config);
      
      // Register as a node type
      this.registerContainerNode(config);
    });
    
    console.log(`✅ Registered ${configurations.size} container-based node types:`, 
                Array.from(configurations.keys()));
  }
  
  /**
   * Register a single container-based node
   */
  private registerContainerNode(config: ContainerNodeJSON): void {
    // Create the container node factory result
    const factoryResult = this.factory.createContainerNode(config);
    
    // Create template function for node creation
    const createTemplate = (params: {
      id: string;
      position: { x: number; y: number };
      eventNode?: Node<NodeData>;
    } & Record<string, any>): Node<NodeData> => {
      return factoryResult.templateFunction(params);
    };
    
    // Register with the existing node type registry
    registerNodeType(
      config.nodeType,
      factoryResult.nodeComponent,
      createTemplate,
      config.behavior.canContainChildren, // Container nodes can have children
      config.dimensions.collapsed, // Default dimensions
      true // Force immediate registration for container nodes
    );
    
    console.log(`🏗️ Registered container node: ${config.nodeType}`);
  }
  
  /**
   * Add a custom container configuration and register it
   */
  async addCustomConfiguration(config: ContainerNodeJSON): Promise<void> {
    await this.configLoader.loadConfiguration(config.nodeType, config);
    this.registerContainerNode(config);
  }
  
  /**
   * Get the factory instance for advanced usage
   */
  getFactory(): ContainerNodeFactory {
    return this.factory;
  }
  
  /**
   * Get the configuration loader for advanced usage
   */
  getConfigurationLoader(): ContainerConfigurationLoader {
    return this.configLoader;
  }
  
  /**
   * Test a container node configuration
   */
  async testContainerConfiguration(
    nodeType: string, 
    nodeData: any
  ): Promise<any> {
    const config = this.configLoader.getConfiguration(nodeType);
    if (!config) {
      throw new Error(`No configuration found for container node type: ${nodeType}`);
    }
    
    // For container nodes, we can test the template creation
    const testTemplate = this.factory.createContainerNode(config).templateFunction({
      id: 'test-node',
      position: { x: 0, y: 0 },
      ...nodeData
    });
    
    return testTemplate;
  }
}

// Create a singleton instance for global use
export const containerNodeRegistration = new ContainerNodeRegistration();

/**
 * Initialize container-based nodes
 * Call this function during application startup to register all container-based nodes
 */
export async function initializeContainerNodes(): Promise<void> {
  await containerNodeRegistration.initializeContainerNodes();
}

/**
 * Example usage and demonstration
 */
export async function demonstrateContainerUsage(): Promise<void> {
  try {
    // Initialize the container factory system
    await initializeContainerNodes();
    
    console.log('🧪 Testing Container Nodes...');
    
    // Test Data Node
    const dataNodeResult = await containerNodeRegistration.testContainerConfiguration(
      'datanode',
      {
        label: 'Test Data Source',
        dataFormat: 'json',
        records: 1000
      }
    );
    console.log('Data Node Test Result:', dataNodeResult);
    
    // Test Page Node
    const pageNodeResult = await containerNodeRegistration.testContainerConfiguration(
      'pagenode',
      {
        label: 'Test Page',
        pageType: 'html',
        htmlContent: '<h1>Test Content</h1>'
      }
    );
    console.log('Page Node Test Result:', pageNodeResult);
    
    // Test Statistics Node
    const statsNodeResult = await containerNodeRegistration.testContainerConfiguration(
      'statisticsnode',
      {
        label: 'Test Statistics',
        chartType: 'line',
        metrics: 'Views: 1200, Clicks: 84, CTR: 7%'
      }
    );
    console.log('Statistics Node Test Result:', statsNodeResult);
    
    // Test Invisible Node
    const invisibleNodeResult = await containerNodeRegistration.testContainerConfiguration(
      'invisiblenode',
      {
        label: 'Test Container',
        layoutDirection: 'LR',
        isContainer: true
      }
    );
    console.log('Invisible Node Test Result:', invisibleNodeResult);
    
  } catch (error) {
    console.error('❌ Container demonstration failed:', error);
  }
}