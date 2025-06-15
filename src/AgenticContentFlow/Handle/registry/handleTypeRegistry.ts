/** @format */
import { 
  NodeHandleConfiguration, 
  HandleTypeDefinition, 
  ConnectionCompatibility,
  NodeCategory 
} from '../../types/handleTypes';
import { containerNodeFactory } from '../../Node/factories/container/ContainerNodeFactory';

import { nodeFactory } from '@/AgenticContentFlow/Node/factories/cell';

export class HandleTypeRegistry {
  private static instance: HandleTypeRegistry;
  
  // Store legacy handle configurations
  private legacyHandleConfigs: Map<string, NodeHandleConfiguration> = new Map();
  
  static getInstance(): HandleTypeRegistry {
    if (!HandleTypeRegistry.instance) {
      HandleTypeRegistry.instance = new HandleTypeRegistry();
      // Initialize legacy configurations
    }
    return HandleTypeRegistry.instance;
  }
  

  /**
   * Get all handle definitions for a node type from any source
   */
  getNodeHandles(nodeType: string): HandleTypeDefinition[] {
    // First try cell factory
    const cellConfig = nodeFactory.getNodeConfig(nodeType);
    if (cellConfig?.handles?.definitions) {
      return cellConfig.handles.definitions;
    }
    
    // Then try container factory
    const containerConfig = containerNodeFactory.getNodeConfig(nodeType);
    if (containerConfig?.handles?.definitions) {
      // Convert container handles to the expected format
      return containerConfig.handles.definitions.map(handle => ({
        position: handle.position,
        type: handle.type,
        dataFlow: handle.dataFlow,
        acceptsFrom: this.mapToNodeCategories(handle.acceptsFrom),
        connectsTo: this.mapToNodeCategories(handle.connectsTo),
        icon: handle.icon,
        edgeType: handle.edgeType
      }));
    }
    
    // Finally try legacy configurations
    const legacyConfig = this.legacyHandleConfigs.get(nodeType);
    return legacyConfig?.handles || [];
  }
  
  /**
   * Get the node category for a given node type from any source
   */
  getNodeCategory(nodeType: string): NodeCategory | undefined {
    // First try cell factory
    const cellConfig = nodeFactory.getNodeConfig(nodeType);
    if (cellConfig?.handles?.category) {
      return cellConfig.handles.category;
    }
    
    // Then try container factory
    const containerConfig = containerNodeFactory.getNodeConfig(nodeType);
    if (containerConfig?.handles?.category) {
      // Map container category to NodeCategory
      const categoryMap: { [key: string]: NodeCategory } = {
        'data': 'data',
        'page': 'page',
        'statistics': 'statistics',
        'container': 'container'
      };
      return categoryMap[containerConfig.handles.category] || containerConfig.handles.category as NodeCategory;
    }
    
    // Finally try legacy configurations
    const legacyConfig = this.legacyHandleConfigs.get(nodeType);
    return legacyConfig?.category;
  }
  
  /**
   * Helper to map string arrays to NodeCategory arrays
   */
  private mapToNodeCategories(strings?: string[]): NodeCategory[] {
    if (!strings) return [];
    return strings.map(str => {
      const categoryMap: { [key: string]: NodeCategory } = {
        'datanode': 'data',
        'pagenode': 'page', 
        'statisticsnode': 'statistics',
        'containernode': 'container',
        'logicnode': 'logic',
        'contentnode': 'view',
        'data': 'data',
        'page': 'page',
        'statistics': 'statistics',
        'container': 'container',
        'logic': 'logic',
        'view': 'view'
      };
      return categoryMap[str] || str as NodeCategory;
    });
  }
  
  /**
   * Get a specific handle definition by node type and position
   */
  getHandle(nodeType: string, position: string): HandleTypeDefinition | undefined {
    const handles = this.getNodeHandles(nodeType);
    return handles.find(handle => handle.position === position);
  }
  
  /**
   * Check if two nodes can connect via specific handles
   */
  canConnect(
    sourceNodeType: string, 
    sourceHandle: string, 
    targetNodeType: string, 
    targetHandle: string
  ): ConnectionCompatibility {
    const sourceHandleDef = this.getHandle(sourceNodeType, sourceHandle);
    const targetHandleDef = this.getHandle(targetNodeType, targetHandle);
    const sourceCategory = this.getNodeCategory(sourceNodeType);
    const targetCategory = this.getNodeCategory(targetNodeType);
    
    if (!sourceHandleDef || !targetHandleDef || !sourceCategory || !targetCategory) {
      return { 
        isValid: false, 
        reason: 'Handle or node category not found' 
      };
    }
    
    // Check if source handle can connect to target category
    if (sourceHandleDef.connectsTo && !sourceHandleDef.connectsTo.includes(targetCategory)) {
      return { 
        isValid: false, 
        reason: `Source handle cannot connect to ${targetCategory} nodes` 
      };
    }
    
    // Check if target handle can accept from source category
    if (targetHandleDef.acceptsFrom && !targetHandleDef.acceptsFrom.includes(sourceCategory)) {
      return { 
        isValid: false, 
        reason: `Target handle cannot accept connections from ${sourceCategory} nodes` 
      };
    }
    
    // Check handle types compatibility (source -> target)
    if (sourceHandleDef.type === 'target' || targetHandleDef.type === 'source') {
      return { 
        isValid: false, 
        reason: 'Invalid handle direction for connection' 
      };
    }
    
    // Determine edge type - prefer source handle's edge type, fall back to target
    const edgeType = sourceHandleDef.edgeType || targetHandleDef.edgeType || 'default';
    
    return { 
      isValid: true, 
      edgeType 
    };
  }
  
  /**
   * Get edge type for a valid connection
   */
  getEdgeTypeForConnection(
    sourceNodeType: string, 
    sourceHandle: string, 
    targetNodeType: string, 
    targetHandle: string
  ): string {
    const compatibility = this.canConnect(sourceNodeType, sourceHandle, targetNodeType, targetHandle);
    return compatibility.edgeType || 'default';
  }
  
  /**
   * Get compatible target categories for a source handle
   */
  getCompatibleTargets(sourceNodeType: string, sourceHandle: string): NodeCategory[] {
    const handleDef = this.getHandle(sourceNodeType, sourceHandle);
    return handleDef?.connectsTo || [];
  }
  
  /**
   * Get all registered node types from all sources
   */
  getRegisteredNodeTypes(): string[] {
    const cellTypes = nodeFactory.getRegisteredNodeTypes();
    const containerTypes = containerNodeFactory.getRegisteredNodeTypes();
    const legacyTypes = Array.from(this.legacyHandleConfigs.keys());
    
    return [...new Set([...cellTypes, ...containerTypes, ...legacyTypes])];
  }
  
  // Legacy methods for backward compatibility - now no-ops since handles come from node factory
  /**
   * @deprecated Handles are now automatically loaded from node factory configurations
   */
  registerNodeHandles(_config: NodeHandleConfiguration): void {
    console.warn('registerNodeHandles is deprecated - handles are now loaded automatically from node factory configurations');
  }
  
  /**
   * @deprecated No longer needed since handles come from node factory
   */
  clear(): void {
    console.warn('clear() is deprecated - handles are managed by the node factory');
  }
}

// Export singleton instance for convenience
export const handleRegistry = HandleTypeRegistry.getInstance();