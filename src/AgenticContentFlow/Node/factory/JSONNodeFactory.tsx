/** @format */

import React, { useState, useCallback, useEffect } from 'react';
import { NodeProps } from '@xyflow/react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { NodeFactoryJSON, NodeInstanceData } from './types';
import { IconResolver } from './IconResolver';
import { ProcessExecutor, CodeValidator } from './ProcessExecutor';
import { CellNode, CellNodeConfig } from '../../Nodes/common/CellNode';
import { useNodeProcess } from '../../Process/useNodeProcess';

/**
 * JSONNodeFactory creates React node components from JSON configurations
 */
export class JSONNodeFactory {
  private iconResolver: IconResolver;
  private processExecutor: ProcessExecutor;
  
  constructor() {
    this.iconResolver = new IconResolver();
    this.processExecutor = new ProcessExecutor(new CodeValidator());
  }
  
  /**
   * Create a node component from JSON configuration
   */
  createNodeComponent(config: NodeFactoryJSON): React.FC<NodeProps> {
    const processExecutor = this.processExecutor; // Capture instance for use in hooks
    
    return (props: NodeProps) => {
      const { id, data } = props;
      const [isRegenerating, setIsRegenerating] = useState(false);
      
      // Use the existing process system
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

      // 🔧 FIX: Add automatic processing logic for incoming data
      useEffect(() => {
        // Automatic processing when data is received and we're currently processing
        if (isProcessing && availableData) {
          const executeAutoProcessing = async () => {
            try {
              console.log(`🔄 Factory node ${config.nodeType} (${id}) auto-processing data:`, availableData);
              
              // Execute the stored process function with incoming data
              const result = await processExecutor.executeProcess(
                config, 
                data as NodeInstanceData, 
                availableData // Pass the incoming data
              );
              
              console.log(`✅ Factory node ${config.nodeType} (${id}) completed processing:`, result);
              completeProcess(result);
            } catch (error) {
              console.error(`❌ Factory node ${config.nodeType} (${id}) processing failed:`, error);
              setError(`Failed to auto-process: ${error}`);
            }
          };
          
          executeAutoProcessing();
        }
      }, [isProcessing, availableData, config, data, id, completeProcess, setError, processExecutor]); // Dependencies for auto-processing
      
      // Handle manual execution using the stored process function
      const handleManualExecution = useCallback(async () => {
        try {
          startProcess({ action: 'manual_execution', source: config.nodeType });
          
          console.log(`🔧 Factory node ${config.nodeType} (${id}) executing manual process...`);
          
          // Execute the stored process function
          const result = await processExecutor.executeProcess(
            config, 
            data as NodeInstanceData, 
            null // No incoming data for manual execution
          );
          
          console.log(`✅ Factory node ${config.nodeType} (${id}) manual execution result:`, result);
          completeProcess(result);
        } catch (error) {
          console.error(`❌ Factory node ${config.nodeType} (${id}) manual execution failed:`, error);
          setError(`Failed to execute: ${error}`);
        }
      }, [config, data, startProcess, completeProcess, setError, processExecutor]);
      
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
            // Regenerate AI function (placeholder for future AI integration)
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
      
      // Get node label
      const nodeLabel = (data as any)?.label || config.defaultLabel;
      
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
    return await this.processExecutor.executeProcess(config, nodeData, incomingData);
  }
}