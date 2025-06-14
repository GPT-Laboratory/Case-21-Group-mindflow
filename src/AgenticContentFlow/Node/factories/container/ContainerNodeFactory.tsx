/** @format */

import React from 'react';
import { NodeProps } from '@xyflow/react';
import { ContainerNodeJSON, ContainerInstanceData, ContainerNodeFactoryResult } from './types';
import { ContainerNodeWrapper } from './components/ContainerNodeWrapper';
import { IconResolver } from '../shared/IconResolver';
import { ContainerConfigurationLoader } from './ContainerConfigurationLoader';

/**
 * Container Node Factory - creates container node components from JSON configurations
 */
export class ContainerNodeFactory {
  private iconResolver: IconResolver;
  private configLoader: ContainerConfigurationLoader;
  
  // Static instance for global access
  private static instance: ContainerNodeFactory;
  
  // Store configurations directly in the factory
  private configurations: Map<string, ContainerNodeJSON> = new Map();
  
  constructor() {
    this.iconResolver = new IconResolver();
    this.configLoader = new ContainerConfigurationLoader();
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): ContainerNodeFactory {
    if (!ContainerNodeFactory.instance) {
      ContainerNodeFactory.instance = new ContainerNodeFactory();
    }
    return ContainerNodeFactory.instance;
  }
  
  /**
   * Register a configuration
   */
  registerConfiguration(nodeType: string, config: ContainerNodeJSON): void {
    this.configurations.set(nodeType, config);
  }
  
  /**
   * Get node configuration by type
   */
  getNodeConfig(nodeType: string): ContainerNodeJSON | undefined {
    return this.configurations.get(nodeType);
  }
  
  /**
   * Get all registered node types
   */
  getRegisteredNodeTypes(): string[] {
    return Array.from(this.configurations.keys());
  }
  
  /**
   * Create a container node component from JSON configuration
   */
  createContainerNodeComponent(config: ContainerNodeJSON): React.FC<NodeProps> {
    return (props: NodeProps) => {
      // Handle menu actions specific to this container type
      const handleMenuAction = (action: string, nodeData: ContainerInstanceData) => {
        switch (action) {
          case 'expand':
            console.log(`Expanding ${config.nodeType}:`, nodeData.label);
            break;
          case 'collapse':
            console.log(`Collapsing ${config.nodeType}:`, nodeData.label);
            break;
          case 'configure':
            console.log(`Configure ${config.nodeType}:`, nodeData.label);
            break;
          case 'delete':
            console.log(`Delete ${config.nodeType}:`, nodeData.label);
            break;
          case 'load_data':
            console.log(`Load data for ${config.nodeType}:`, nodeData.label);
            break;
          case 'export_data':
            console.log(`Export data from ${config.nodeType}:`, nodeData.label);
            break;
          case 'edit_content':
            console.log(`Edit content in ${config.nodeType}:`, nodeData.label);
            break;
          case 'preview':
            console.log(`Preview ${config.nodeType}:`, nodeData.label);
            break;
          case 'analyze':
            console.log(`Analyze ${config.nodeType}:`, nodeData.label);
            break;
          case 'refresh':
            console.log(`Refresh ${config.nodeType}:`, nodeData.label);
            break;
          case 'toggle_visibility':
            console.log(`Toggle visibility of ${config.nodeType}:`, nodeData.label);
            break;
          default:
            console.log(`Unknown action ${action} for ${config.nodeType}:`, nodeData.label);
        }
      };

      // Generate custom content based on config
      const customContent = this.generateCustomContent(config, props.data as ContainerInstanceData);
      
      return (
        <ContainerNodeWrapper
          {...props}
          config={config}
          customContent={customContent}
          onMenuAction={handleMenuAction}
        />
      );
    };
  }
  
  /**
   * Generate custom content for expanded container
   */
  private generateCustomContent(
    config: ContainerNodeJSON, 
    nodeData: ContainerInstanceData
  ): React.ReactNode | undefined {
    if (!config.content.customContentFunction) {
      return undefined;
    }

    // Handle different content types based on node category
    switch (config.category) {
      case 'data':
        return this.generateDataNodeContent(nodeData);
      case 'page':
        return this.generatePageNodeContent(nodeData);
      case 'statistics':
        return this.generateStatisticsNodeContent(nodeData);
      case 'container':
        return this.generateContainerNodeContent(nodeData);
      default:
        return undefined;
    }
  }

  /**
   * Generate content for data nodes
   */
  private generateDataNodeContent(nodeData: ContainerInstanceData): React.ReactNode {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">Data Source Information</div>
        {nodeData.dataFormat && (
          <div className="text-xs text-gray-600">
            Format: {nodeData.dataFormat}
          </div>
        )}
        {nodeData.records && (
          <div className="text-xs text-gray-600">
            Records: {nodeData.records}
          </div>
        )}
        {nodeData.lastUpdated && (
          <div className="text-xs text-gray-500">
            Last updated: {new Date(nodeData.lastUpdated).toLocaleTimeString()}
          </div>
        )}
        <div className="text-xs text-gray-500">
          Click "Load Data" to fetch from this source
        </div>
      </div>
    );
  }

  /**
   * Generate content for page nodes
   */
  private generatePageNodeContent(nodeData: ContainerInstanceData): React.ReactNode {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">Page Content</div>
        {nodeData.pageType && (
          <div className="text-xs text-gray-600">
            Type: {nodeData.pageType}
          </div>
        )}
        {nodeData.htmlContent && (
          <div className="text-xs text-gray-600">
            Content Length: {nodeData.htmlContent.length} characters
          </div>
        )}
        <div className="text-xs text-gray-500">
          Use "Edit HTML" to modify page content
        </div>
      </div>
    );
  }

  /**
   * Generate content for statistics nodes
   */
  private generateStatisticsNodeContent(nodeData: ContainerInstanceData): React.ReactNode {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">Analytics Overview</div>
        {nodeData.metrics && (
          <div className="text-xs text-gray-600">
            {nodeData.metrics}
          </div>
        )}
        {nodeData.chartType && (
          <div className="text-xs text-gray-600">
            Chart Type: {nodeData.chartType}
          </div>
        )}
        <div className="text-xs text-gray-500">
          Use "Refresh Metrics" to update data
        </div>
      </div>
    );
  }

  /**
   * Generate content for generic container nodes
   */
  private generateContainerNodeContent(nodeData: ContainerInstanceData): React.ReactNode {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">Container Information</div>
        {nodeData.layoutDirection && (
          <div className="text-xs text-gray-600">
            Layout: {nodeData.layoutDirection}
          </div>
        )}
        <div className="text-xs text-gray-500">
          {nodeData.details || 'Container for organizing content'}
        </div>
      </div>
    );
  }
  
  /**
   * Create a complete container node factory result
   */
  createContainerNode(config: ContainerNodeJSON): ContainerNodeFactoryResult {
    // Create the React component
    const nodeComponent = this.createContainerNodeComponent(config);
    
    // Create template function
    const templateFunction = (params: any) => {
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
          expanded: params.expanded !== undefined ? params.expanded : config.behavior.defaultExpanded,
          isParent: config.behavior.canContainChildren,
          // Set parent relationships if available
          parent: eventNode?.id,
          subject: eventNode?.data.subject || config.category,
        },
        style: {
          width: config.behavior.defaultExpanded ? config.dimensions.expanded.width : config.dimensions.collapsed.width,
          height: config.behavior.defaultExpanded ? config.dimensions.expanded.height : config.dimensions.collapsed.height,
        },
        position,
        parentId: eventNode?.parentId,
        extent: eventNode?.parentId ? "parent" : undefined,
      };
    };
    
    return {
      nodeComponent,
      templateFunction,
      config
    };
  }
  
  /**
   * Register a custom icon component
   */
  registerIconComponent(name: string, component: React.ComponentType<any>) {
    this.iconResolver.registerComponent(name, component);
  }
  
  /**
   * Load all built-in container configurations
   */
  async loadBuiltInConfigurations(): Promise<void> {
    await this.configLoader.loadBuiltInConfigurations();
    
    // Get all configurations and register them
    const configurations = this.configLoader.getAllConfigurations();
    configurations.forEach((config: ContainerNodeJSON, nodeType: string) => {
      this.registerConfiguration(nodeType, config);
    });
  }
}

// Export singleton instance for global use
export const containerNodeFactory = ContainerNodeFactory.getInstance();