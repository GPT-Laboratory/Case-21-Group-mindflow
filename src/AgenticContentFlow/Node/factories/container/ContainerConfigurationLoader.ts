/** @format */

import { ContainerNodeJSON } from './types';
import { dataNodeConfig } from './configs/datanode-config';
import { pageNodeConfig } from './configs/pagenode-config';
import { statisticsNodeConfig } from './configs/statisticsnode-config';
import { invisibleNodeConfig } from './configs/invisiblenode-config';

/**
 * Configuration loader for container nodes
 */
export class ContainerConfigurationLoader {
  private configurations: Map<string, ContainerNodeJSON> = new Map();
  
  /**
   * Load a configuration from JSON
   */
  async loadConfiguration(nodeType: string, config: ContainerNodeJSON): Promise<void> {
    // Validate the configuration
    this.validateConfiguration(config);
    
    // Store the configuration
    this.configurations.set(nodeType, config);
  }
  
  /**
   * Get a configuration by node type
   */
  getConfiguration(nodeType: string): ContainerNodeJSON | undefined {
    return this.configurations.get(nodeType);
  }
  
  /**
   * Get all loaded configurations
   */
  getAllConfigurations(): Map<string, ContainerNodeJSON> {
    return new Map(this.configurations);
  }
  
  /**
   * Check if a configuration exists for a node type
   */
  hasConfiguration(nodeType: string): boolean {
    return this.configurations.has(nodeType);
  }
  
  /**
   * Load all built-in container configurations
   */
  async loadBuiltInConfigurations(): Promise<void> {
    // Load the four main container configurations from separate files
    const configs = [
      dataNodeConfig,
      pageNodeConfig,
      statisticsNodeConfig,
      invisibleNodeConfig
    ];
    
    configs.forEach(config => {
      this.configurations.set(config.nodeType, config);
    });
  }
  
  /**
   * Validate a configuration object
   */
  private validateConfiguration(config: ContainerNodeJSON): void {
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
      if (!config.visual.depthColorScheme) errors.push('visual.depthColorScheme is required');
      if (!config.visual.containerStyle) errors.push('visual.containerStyle is required');
    }
    
    // Behavior configuration
    if (!config.behavior) {
      errors.push('behavior configuration is required');
    } else {
      if (typeof config.behavior.expandable !== 'boolean') errors.push('behavior.expandable must be boolean');
      if (typeof config.behavior.resizable !== 'boolean') errors.push('behavior.resizable must be boolean');
      if (typeof config.behavior.canContainChildren !== 'boolean') errors.push('behavior.canContainChildren must be boolean');
    }
    
    // Dimensions configuration
    if (!config.dimensions) {
      errors.push('dimensions configuration is required');
    } else {
      if (!config.dimensions.collapsed) errors.push('dimensions.collapsed is required');
      if (!config.dimensions.expanded) errors.push('dimensions.expanded is required');
      if (!config.dimensions.minDimensions) errors.push('dimensions.minDimensions is required');
    }
    
    // Handles configuration
    if (!config.handles || !config.handles.definitions || !Array.isArray(config.handles.definitions)) {
      errors.push('handles.definitions array is required');
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
      if (!config.template.defaultParameters) errors.push('template.defaultParameters is required');
    }
    
    if (errors.length > 0) {
      throw new Error(`Container configuration validation failed: ${errors.join(', ')}`);
    }
  }
}