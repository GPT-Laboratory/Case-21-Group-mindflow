/** @format */

import { contentNodeConfig } from './configs/contentnode-config';
import { logicNodeConfig } from './configs/logicnode-config';
import { restNodeConfig } from './configs/restnode-config';
import { NodeFactoryJSON } from './types';

/**
 * Configuration loader for JSON-driven node factory
 */
export class NodeConfigurationLoader {
  private configurations: Map<string, NodeFactoryJSON> = new Map();
  
  /**
   * Load a configuration from JSON
   */
  async loadConfiguration(nodeType: string, config: NodeFactoryJSON): Promise<void> {
    // Validate the configuration
    this.validateConfiguration(config);
    
    // Store the configuration
    this.configurations.set(nodeType, config);
  }
  
  /**
   * Load configuration from a JSON file (for future use)
   */
  async loadConfigurationFromFile(filePath: string): Promise<NodeFactoryJSON> {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load configuration: ${response.statusText}`);
      }
      
      const config = await response.json() as NodeFactoryJSON;
      this.validateConfiguration(config);
      this.configurations.set(config.nodeType, config);
      
      return config;
    } catch (error) {
      throw new Error(`Failed to load configuration from ${filePath}: ${error}`);
    }
  }
  
  /**
   * Get a configuration by node type
   */
  getConfiguration(nodeType: string): NodeFactoryJSON | undefined {
    return this.configurations.get(nodeType);
  }
  
  /**
   * Get all loaded configurations
   */
  getAllConfigurations(): Map<string, NodeFactoryJSON> {
    return new Map(this.configurations);
  }
  
  /**
   * Check if a configuration exists for a node type
   */
  hasConfiguration(nodeType: string): boolean {
    return this.configurations.has(nodeType);
  }
  
  /**
   * Load all built-in configurations
   */
  async loadBuiltInConfigurations(): Promise<void> {
    // Load the three main configurations
    const configs = [
      await this.loadRestNodeConfig(),
      await this.loadLogicalNodeConfig(),
      await this.loadContentNodeConfig()
    ];
    
    configs.forEach(config => {
      this.configurations.set(config.nodeType, config);
    });
  }
  
  /**
   * Validate a configuration object
   */
  private validateConfiguration(config: NodeFactoryJSON): void {
    const errors: string[] = [];
    
    // Required fields
    if (!config.nodeType) errors.push('nodeType is required');
    if (!config.defaultLabel) errors.push('defaultLabel is required');
    if (!config.category) errors.push('category is required');
    if (!config.description) errors.push('description is required');
    
    // Visual configuration
    if (!config.visual) {
      errors.push('visual configuration is required');
    } else {
      if (!config.visual.icon) errors.push('visual.icon is required');
      if (!config.visual.headerIcon) errors.push('visual.headerIcon is required');
      if (!config.visual.headerGradient) errors.push('visual.headerGradient is required');
      if (!config.visual.selectedColor) errors.push('visual.selectedColor is required');
    }
    
    // Process configuration
    if (!config.process) {
      errors.push('process configuration is required');
    } else {
      if (!config.process.code) errors.push('process.code is required');
      if (!config.process.metadata) errors.push('process.metadata is required');
      if (!config.process.parameters) errors.push('process.parameters is required');
    }
    
    // Menu configuration
    if (!config.menu || !config.menu.items || !Array.isArray(config.menu.items)) {
      errors.push('menu.items array is required');
    }
    
    // Template configuration
    if (!config.template) {
      errors.push('template configuration is required');
    } else {
      if (!config.template.defaultData) errors.push('template.defaultData is required');
      if (!config.template.defaultDimensions) errors.push('template.defaultDimensions is required');
      if (!config.template.defaultParameters) errors.push('template.defaultParameters is required');
    }
    
    if (errors.length > 0) {
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }
  }
  
  /**
   * Load REST node configuration
   */
  private async loadRestNodeConfig(): Promise<NodeFactoryJSON> {
    return restNodeConfig;
  }
  
  /**w
   * Load logical node configuration
   */
  private async loadLogicalNodeConfig(): Promise<NodeFactoryJSON> {
    // Return the logical node configuration (shortened for brevity)
    return logicNodeConfig;
  }
  
  /**
   * Load content node configuration
   */
  private async loadContentNodeConfig(): Promise<NodeFactoryJSON> {
    // Return the content node configuration (shortened for brevity)
    return contentNodeConfig;
  }
}