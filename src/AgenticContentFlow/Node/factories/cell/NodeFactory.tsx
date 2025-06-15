/** @format */

import React, { useState, useCallback, useEffect } from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { NodeFactoryJSON, NodeInstanceData } from './types';
import { IconResolver } from './IconResolver';
import { ProcessExecutor } from './ProcessExecutor';
import { useNodeProcess } from '../../../Process/useNodeProcess';

// DataSchemaManager integration for factory nodes
import { dataSchemaManager } from '../../../Schema';
import { CellNode, CellNodeConfig } from './components';

/**
 * NodeFactory creates React node components from JSON configurations
 */
export class NodeFactory {
  private iconResolver: IconResolver;
  private processExecutor: ProcessExecutor;
  
  // Static instance for global access
  private static instance: NodeFactory;
  
  // Store configurations directly in the factory
  private configurations: Map<string, NodeFactoryJSON> = new Map();
  
  constructor() {
    this.iconResolver = new IconResolver();
    this.processExecutor = new ProcessExecutor(); // No longer needs CodeValidator
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): NodeFactory {
    if (!NodeFactory.instance) {
      NodeFactory.instance = new NodeFactory();
    }
    return NodeFactory.instance;
  }
  
  /**
   * Register a configuration
   */
  registerConfiguration(nodeType: string, config: NodeFactoryJSON): void {
    this.configurations.set(nodeType, config);
  }
  
  /**
   * Get node configuration by type
   */
  getNodeConfig(nodeType: string): NodeFactoryJSON | undefined {
    return this.configurations.get(nodeType);
  }
  
  /**
   * Get all registered node types
   */
  getRegisteredNodeTypes(): string[] {
    return Array.from(this.configurations.keys());
  }

  /**
   * Create a node component from JSON configuration
   */
  createNodeComponent(config: NodeFactoryJSON): React.FC<NodeProps> {
    const processExecutor = this.processExecutor; // Capture instance for use in hooks
    
    return (props: NodeProps) => {
      const { id, data } = props;
      const [isRegenerating, setIsRegenerating] = useState(false);
      const { getEdges, getNode } = useReactFlow();
      
      // Use the existing process system with enhanced selective routing
      const { 
        isProcessing, 
        isCompleted, 
        hasError,
        startProcess, 
        completeProcess, 
        setError,
        availableData
      } = useNodeProcess({ 
        nodeId: id,
        autoStartOnData: true,
        // NEW: Enhanced complete process that handles selective routing
        enhancedCompleteProcess: true
      });

      // Loop state management (required by CellNode)
      const [isLooping, setIsLooping] = useState(false);
      const [loopInterval, setLoopInterval] = useState(5);

      // Handle loop toggle
      const handleLoopToggle = () => {
        setIsLooping(!isLooping);
      };

      // Handle loop interval change
      const handleLoopIntervalChange = (interval: number) => {
        setLoopInterval(interval);
      };

      // 🔧 ENHANCED: Auto-processing with TargetMap/SourceMap support
      useEffect(() => {
        // Automatic processing when data is received and we're currently processing
        if (isProcessing && availableData) {
          const executeAutoProcessing = async () => {
            try {
              console.log(`🔄 Factory node ${config.nodeType} (${id}) auto-processing data:`, availableData);
              
              // Execute the stored process function with incoming data and node maps
              const result = await processExecutor.executeProcess(
                config, 
                data as NodeInstanceData, 
                availableData, // Pass the incoming data
                id,           // NEW: Pass node ID for map building
                getEdges,     // NEW: Pass getEdges function
                getNode       // NEW: Pass getNode function
              );
              
              console.log(`✅ Factory node ${config.nodeType} (${id}) completed processing:`, result);
              console.log(`🔍 Input data type:`, typeof availableData, Array.isArray(availableData) ? `Array[${availableData.length}]` : 'Non-array');
              console.log(`🔍 Output data type:`, typeof result, Array.isArray(result) ? `Array[${result.length}]` : 'Non-array');
              console.log(`🔍 Data reference equality:`, result === availableData);
          
              // 🔧 NEW: Update schemas in DataSchemaManager
              const { inputSchema, outputSchema } = generateFactoryNodeSchemas(
                config.nodeType,
                availableData, // incoming data for input schema
                result        // output data for output schema
              );
              
              console.log(`📊 Generated schemas for factory node ${config.nodeType} (${id}):`, {
                inputSchema: inputSchema ? 'Generated' : 'None',
                outputSchema: outputSchema ? 'Generated' : 'None',
                inputSchemaDetails: inputSchema,
                outputSchemaDetails: outputSchema
              });
              
              if (inputSchema || outputSchema) {
                dataSchemaManager.updateSchema(id, inputSchema, outputSchema);
                console.log(`📊 Updated schemas in DataSchemaManager for factory node ${config.nodeType} (${id})`);
              }
              
              // 🎯 NEW: Enhanced complete process with selective routing support
              completeProcess(result);
            } catch (error) {
              console.error(`❌ Factory node ${config.nodeType} (${id}) processing failed:`, error);
              setError(`Failed to auto-process: ${error}`);
            }
          };
          
          executeAutoProcessing();
        }
      }, [isProcessing, availableData, config, data, id, completeProcess, setError, processExecutor, getEdges, getNode]); // Enhanced dependencies

      // Handle manual execution using the stored process function
      const handleManualExecution = useCallback(async () => {
        try {
          startProcess({ action: 'manual_execution', source: config.nodeType });
          
          console.log(`🔧 Factory node ${config.nodeType} (${id}) executing manual process...`);
          
          // Execute the stored process function with enhanced context
          const result = await processExecutor.executeProcess(
            config, 
            data as NodeInstanceData, 
            null, // No incoming data for manual execution
            id,   // NEW: Pass node ID for map building
            getEdges, // NEW: Pass getEdges function
            getNode   // NEW: Pass getNode function
          );
          
          console.log(`✅ Factory node ${config.nodeType} (${id}) manual execution result:`, result);
          
          // 🔧 NEW: Update schemas in DataSchemaManager for manual execution
          const { inputSchema, outputSchema } = generateFactoryNodeSchemas(
            config.nodeType,
            null,        // no incoming data for manual execution
            result       // output data for output schema
          );
        
          if (inputSchema || outputSchema) {
            dataSchemaManager.updateSchema(id, inputSchema, outputSchema);
            console.log(`📊 Updated schemas for factory node ${config.nodeType} (${id}) after manual execution:`, {
              inputSchema,
              outputSchema
            });
          }
          
          completeProcess(result);
        } catch (error) {
          console.error(`❌ Factory node ${config.nodeType} (${id}) manual execution failed:`, error);
          setError(`Failed to execute: ${error}`);
        }
      }, [config, data, startProcess, completeProcess, setError, processExecutor, id, getEdges, getNode]);
      
      // Handle menu actions
      const handleMenuAction = useCallback((action: string) => {
        switch (action) {
          case 'execute':
            handleManualExecution();
            break;
          case 'configure':
            // Open configuration panel with parameters
            console.log('Configure parameters for:', config.nodeType);
            break;
          case 'debug':
            // Show debug information including process code
            console.log('Process code:', config.process.code);
            console.log('Parameters:', config.process.parameters);
            break;
          case 'analyze':
            // Analyze node performance
            console.log('Analyze node performance');
            break;
          case 'regenerate':
            // Regenerate function (placeholder for future AI integration)
            setIsRegenerating(true);
            setTimeout(() => setIsRegenerating(false), 2000);
            break;
        }
      }, [config, handleManualExecution]);
      
      // Resolve icons
      const icon = this.iconResolver.resolveIcon(config.visual.icon);
      const headerIcon = this.iconResolver.resolveIcon(config.visual.headerIcon);
      
      // Get variant styling based on node data
      const variant = this.getVariantStyling(config.visual.variants, data);
      
      // Get additional content
      const additionalContent = this.getAdditionalContent(
        config.visual.additionalContentFunction, 
        data
      );
      
      // Generate menu items
      const menuItems = config.menu.items.map(item => (
        <DropdownMenuItem 
          key={item.key} 
          onClick={() => handleMenuAction(item.action)}
        >
          {item.label}
        </DropdownMenuItem>
      ));
      
      // Build CellNodeConfig
      const cellNodeConfig: CellNodeConfig = {
        nodeType: config.nodeType,
        icon,
        headerIcon,
        headerGradient: config.visual.headerGradient,
        selectedColor: config.visual.selectedColor,
        badge: {
          text: variant.badgeText,
          colorClasses: variant.badgeColor
        },
        additionalContent,
        menuItems
      };
      
      // Get node label - check instanceData first, then fallback to old structure
      const nodeLabel = (data as any)?.instanceData?.label || (data as any)?.label || config.defaultLabel;
      
      // Extract approval settings from instanceData
      const requiresUserApproval = (data as any)?.instanceData?.requiresUserApproval || (data as any)?.requiresUserApproval || false;
      const autoApprove = (data as any)?.instanceData?.autoApprove || (data as any)?.autoApprove || false;
      
      return (
        <CellNode
          {...props}
          config={cellNodeConfig}
          label={nodeLabel}
          isProcessing={isProcessing || isRegenerating}
          isCompleted={isCompleted}
          hasError={hasError}
          onPlay={handleManualExecution}
          onStop={() => {/* stop logic */}}
          isLooping={isLooping}
          loopInterval={loopInterval}
          onLoopToggle={handleLoopToggle}
          onLoopIntervalChange={handleLoopIntervalChange}
          requiresUserApproval={requiresUserApproval}
          autoApprove={autoApprove}
        />
      );
    };
  }
  
  /**
   * Get variant styling based on node data and configuration
   */
  private getVariantStyling(
    variants: NodeFactoryJSON['visual']['variants'], 
    data: any
  ): { badgeText: string; badgeColor: string } {
    if (!variants) {
      return { badgeText: 'NODE', badgeColor: 'bg-gray-100 text-gray-800' };
    }
    
    const fieldValue = data?.[variants.fieldName];
    const variant = variants.options[fieldValue] || variants.default;
    
    return {
      badgeText: variant.badgeText,
      badgeColor: variant.badgeColor
    };
  }
  
  /**
   * Get additional content to display based on configuration
   */
  private getAdditionalContent(
    contentFunction: string | undefined, 
    data: any
  ): string | undefined {
    if (!contentFunction || !data) {
      return undefined;
    }
    
    try {
      // Simple property accessor like "data.url" or "data.condition"
      if (contentFunction.startsWith('.')) {
        const property = contentFunction.substring(1);
        const value = data[property];
        
        // Special handling for URLs - show only the meaningful part
        if (property === 'url' && typeof value === 'string') {
          try {
            const url = new URL(value);
            // Extract the last meaningful part of the path
            const pathParts = url.pathname.split('/').filter(Boolean);
            if (pathParts.length > 0) {
              return pathParts[pathParts.length - 1]; // Return last part like "posts"
            }
            return url.hostname; // Fallback to hostname
          } catch {
            // If URL parsing fails, return the original value
            return value;
          }
        }
        
        return value?.toString();
      }
      
      // More complex accessors could be added here
      return contentFunction;
    } catch (error) {
      console.warn('Failed to resolve additional content:', error);
      return undefined;
    }
  }
  
  /**
   * Register a custom icon component
   */
  registerIconComponent(name: string, component: React.ComponentType<any>) {
    this.iconResolver.registerComponent(name, component);
  }
  
  /**
   * Execute a process function for testing/debugging
   */
  async executeProcessFunction(
    config: NodeFactoryJSON,
    nodeData: NodeInstanceData,
    incomingData?: any
  ): Promise<any> {
    console.log('Executing process function with nodeData:', nodeData); // Use the parameter
    return await this.processExecutor.executeProcess(config, nodeData, incomingData);
  }
}

/**
 * Helper function to generate schemas for factory nodes based on their type and data
 */
const generateFactoryNodeSchemas = (
  nodeType: string, 
  incomingData: any, 
  outputData: any
) => {
  console.log(`🔍 generateFactoryNodeSchemas called for ${nodeType}:`, {
    hasIncomingData: !!incomingData,
    hasOutputData: !!outputData,
    incomingDataType: typeof incomingData,
    outputDataType: typeof outputData
  });

  let inputSchema = undefined;
  let outputSchema = undefined;

  // Generate input schema from incoming data
  if (incomingData !== null && incomingData !== undefined) {
    inputSchema = generateSchemaFromData(incomingData);
    console.log(`📥 Generated input schema for ${nodeType}:`, inputSchema);
  }

  // Generate output schema from output data
  if (outputData !== null && outputData !== undefined) {
    // Handle selective routing result format
    if (typeof outputData === 'object' && outputData.data && outputData.targets) {
      outputSchema = generateSchemaFromData(outputData.data);
      console.log(`📤 Generated output schema for ${nodeType} (selective routing):`, outputSchema);
    } else {
      outputSchema = generateSchemaFromData(outputData);
      console.log(`📤 Generated output schema for ${nodeType}:`, outputSchema);
    }
  }

  return { inputSchema, outputSchema };
};

/**
 * Generate a JSON schema from sample data
 */
const generateSchemaFromData = (data: any): any => {
  if (data === null || data === undefined) {
    return { type: 'null' };
  }
  
  if (Array.isArray(data)) {
    // Generate schema for array
    const itemSchema = data.length > 0 ? generateSchemaFromData(data[0]) : { type: 'any' };
    return {
      type: 'array',
      items: itemSchema
    };
  }
  
  if (typeof data === 'object') {
    const properties: Record<string, any> = {};
    
    // Generate schema for each property
    Object.keys(data).forEach(key => {
      properties[key] = generateSchemaFromData(data[key]);
    });
    
    return {
      type: 'object',
      properties
    };
  }
  
  // Handle primitive types
  return { type: typeof data };
};

// Export singleton instance for global use
export const nodeFactory = NodeFactory.getInstance();

