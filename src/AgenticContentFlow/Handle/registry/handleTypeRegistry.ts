/** @format */
import { 
  NodeHandleConfiguration, 
  HandleTypeDefinition, 
  ConnectionCompatibility,
  NodeCategory 
} from '../../types/handleTypes';
import { nodeFactory } from '../../Node/factory/NodeFactory';

export class HandleTypeRegistry {
  private static instance: HandleTypeRegistry;
  
  static getInstance(): HandleTypeRegistry {
    if (!HandleTypeRegistry.instance) {
      HandleTypeRegistry.instance = new HandleTypeRegistry();
    }
    return HandleTypeRegistry.instance;
  }
  
  /**
   * Get all handle definitions for a node type from the node factory
   */
  getNodeHandles(nodeType: string): HandleTypeDefinition[] {
    const config = nodeFactory.getNodeConfig(nodeType);
    return config?.handles?.definitions || [];
  }
  
  /**
   * Get the node category for a given node type from the node factory
   */
  getNodeCategory(nodeType: string): NodeCategory | undefined {
    const config = nodeFactory.getNodeConfig(nodeType);
    return config?.handles?.category;
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
   * Get all registered node types from the node factory
   */
  getRegisteredNodeTypes(): string[] {
    return nodeFactory.getRegisteredNodeTypes();
  }
  
  // Legacy methods for backward compatibility - now no-ops since handles come from node factory
  /**
   * @deprecated Handles are now automatically loaded from node factory configurations
   */
  registerNodeHandles(config: NodeHandleConfiguration): void {
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