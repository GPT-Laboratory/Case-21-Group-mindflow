import { FlowGenerator } from './FlowGenerator';
import { useCodeStore } from '../../../stores/codeStore';

/**
 * Service for synchronizing code changes with visual flows
 * This is a singleton service that can be used without React hooks
 */
class FlowSyncService {
  private static instance: FlowSyncService;
  private flowGenerator: FlowGenerator;
  private syncCallbacks: Set<(nodes: any[], edges: any[]) => void> = new Set();

  private constructor() {
    this.flowGenerator = new FlowGenerator();
  }

  static getInstance(): FlowSyncService {
    if (!FlowSyncService.instance) {
      FlowSyncService.instance = new FlowSyncService();
    }
    return FlowSyncService.instance;
  }

  /**
   * Register a callback to be called when the flow needs to be updated
   */
  onFlowUpdate(callback: (nodes: any[], edges: any[]) => void): () => void {
    this.syncCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.syncCallbacks.delete(callback);
    };
  }

  /**
   * Update function code and trigger flow synchronization
   */
  async updateFunctionCodeAndSync(
    functionId: string,
    newFunctionCode: string,
    filePath: string,
    currentNodes: any[] = [],
    currentEdges: any[] = []
  ): Promise<boolean> {
    try {
      // Update the code in the code store
      const { updateFunctionCode, getSourceCode } = useCodeStore.getState();
      const success = updateFunctionCode(functionId, newFunctionCode);
      
      if (!success) {
        console.warn('Failed to update function code in store');
        return false;
      }

      // Get the updated source code
      const updatedSourceCode = getSourceCode(filePath);
      if (!updatedSourceCode) {
        console.warn('Could not retrieve updated source code');
        return false;
      }

      // Re-generate the flow from the updated code
      const updatedFlow = this.flowGenerator.generateFlow(updatedSourceCode, filePath);

      // Create a mapping from old node IDs to preserve positions and UI state
      const nodePositionMap = new Map();
      const nodeUIStateMap = new Map();
      
      currentNodes.forEach(node => {
        if (node.type === 'functionnode' && node.data.functionName) {
          nodePositionMap.set(node.data.functionName, node.position);
          nodeUIStateMap.set(node.data.functionName, {
            selected: node.selected,
            width: node.width,
            height: node.height,
            expanded: node.data.expanded
          });
        } else if (node.type === 'flownode') {
          // Preserve container node state
          nodePositionMap.set('container', node.position);
          nodeUIStateMap.set('container', {
            selected: node.selected,
            width: node.width,
            height: node.height,
            expanded: node.data.expanded
          });
        }
      });

      // Update the nodes with preserved positions and UI state
      const updatedNodes = updatedFlow.nodes.map(node => {
        if (node.type === 'functionnode' && node.data.functionName) {
          const savedPosition = nodePositionMap.get(node.data.functionName);
          const savedUIState = nodeUIStateMap.get(node.data.functionName);
          
          return {
            ...node,
            position: savedPosition || node.position,
            selected: savedUIState?.selected || false,
            width: savedUIState?.width || node.width,
            height: savedUIState?.height || node.height,
            data: {
              ...node.data,
              expanded: savedUIState?.expanded ?? node.data.expanded
            }
          };
        }
        
        // For container node, preserve its state
        if (node.type === 'flownode') {
          const savedPosition = nodePositionMap.get('container');
          const savedUIState = nodeUIStateMap.get('container');
          
          return {
            ...node,
            position: savedPosition || node.position,
            selected: savedUIState?.selected || false,
            width: savedUIState?.width || node.width,
            height: savedUIState?.height || node.height,
            data: {
              ...node.data,
              expanded: savedUIState?.expanded ?? node.data.expanded
            }
          };
        }
        
        return node;
      });

      // Debug: Validate edges before sending to callbacks
      console.log('🔍 FlowSyncService: Validating edges before callback');
      const nodeIds = new Set(updatedNodes.map(n => n.id));
      const validEdges = updatedFlow.edges.filter(edge => {
        const sourceExists = nodeIds.has(edge.source);
        const targetExists = nodeIds.has(edge.target);
        if (!sourceExists || !targetExists) {
          console.warn(`❌ Invalid edge ${edge.id}: source=${edge.source} (exists: ${sourceExists}), target=${edge.target} (exists: ${targetExists})`);
        }
        return sourceExists && targetExists;
      });

      console.log('🔍 FlowSyncService: Edge validation results', {
        totalEdges: updatedFlow.edges.length,
        validEdges: validEdges.length,
        invalidEdges: updatedFlow.edges.length - validEdges.length
      });

      // Debug: Log the actual edges being sent
      console.log('🔍 FlowSyncService: Edges being sent to callback:', validEdges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceExists: nodeIds.has(edge.source),
        targetExists: nodeIds.has(edge.target)
      })));

      // Notify all registered callbacks with validated edges
      this.syncCallbacks.forEach(callback => {
        try {
          callback(updatedNodes, validEdges);
        } catch (error) {
          console.error('Error in flow sync callback:', error);
        }
      });

      console.log('✅ Successfully synchronized code changes with flow', {
        nodesUpdated: updatedNodes.length,
        edgesUpdated: validEdges.length,
        callbacksNotified: this.syncCallbacks.size
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to synchronize code changes with flow:', error);
      return false;
    }
  }

  /**
   * Update entire file code and trigger flow synchronization
   */
  async updateFileCodeAndSync(
    filePath: string,
    newSourceCode: string,
    currentNodes: any[] = [],
    currentEdges: any[] = []
  ): Promise<boolean> {
    try {
      // Update the code in the code store
      const { setSourceCode } = useCodeStore.getState();
      setSourceCode(filePath, newSourceCode);

      // Re-generate the flow from the updated code
      const updatedFlow = this.flowGenerator.generateFlow(newSourceCode, filePath);

      // Preserve UI state similar to function updates
      const nodePositionMap = new Map();
      const nodeUIStateMap = new Map();
      
      currentNodes.forEach(node => {
        if (node.type === 'functionnode' && node.data.functionName) {
          nodePositionMap.set(node.data.functionName, node.position);
          nodeUIStateMap.set(node.data.functionName, {
            selected: node.selected,
            width: node.width,
            height: node.height,
            expanded: node.data.expanded
          });
        } else if (node.type === 'flownode') {
          nodePositionMap.set('container', node.position);
          nodeUIStateMap.set('container', {
            selected: node.selected,
            width: node.width,
            height: node.height,
            expanded: node.data.expanded
          });
        }
      });

      const updatedNodes = updatedFlow.nodes.map(node => {
        if (node.type === 'functionnode' && node.data.functionName) {
          const savedPosition = nodePositionMap.get(node.data.functionName);
          const savedUIState = nodeUIStateMap.get(node.data.functionName);
          
          return {
            ...node,
            position: savedPosition || node.position,
            selected: savedUIState?.selected || false,
            width: savedUIState?.width || node.width,
            height: savedUIState?.height || node.height,
            data: {
              ...node.data,
              expanded: savedUIState?.expanded ?? node.data.expanded
            }
          };
        }
        
        if (node.type === 'flownode') {
          const savedPosition = nodePositionMap.get('container');
          const savedUIState = nodeUIStateMap.get('container');
          
          return {
            ...node,
            position: savedPosition || node.position,
            selected: savedUIState?.selected || false,
            width: savedUIState?.width || node.width,
            height: savedUIState?.height || node.height,
            data: {
              ...node.data,
              expanded: savedUIState?.expanded ?? node.data.expanded
            }
          };
        }
        
        return node;
      });

      // Debug: Validate edges before sending to callbacks
      console.log('🔍 FlowSyncService: Validating edges before callback (file update)');
      const nodeIds = new Set(updatedNodes.map(n => n.id));
      const validEdges = updatedFlow.edges.filter(edge => {
        const sourceExists = nodeIds.has(edge.source);
        const targetExists = nodeIds.has(edge.target);
        if (!sourceExists || !targetExists) {
          console.warn(`❌ Invalid edge ${edge.id}: source=${edge.source} (exists: ${sourceExists}), target=${edge.target} (exists: ${targetExists})`);
        }
        return sourceExists && targetExists;
      });

      console.log('🔍 FlowSyncService: Edge validation results (file update)', {
        totalEdges: updatedFlow.edges.length,
        validEdges: validEdges.length,
        invalidEdges: updatedFlow.edges.length - validEdges.length
      });

      // Notify all registered callbacks with validated edges
      this.syncCallbacks.forEach(callback => {
        try {
          callback(updatedNodes, validEdges);
        } catch (error) {
          console.error('Error in flow sync callback:', error);
        }
      });

      console.log('✅ Successfully synchronized file code changes with flow', {
        nodesUpdated: updatedNodes.length,
        edgesUpdated: validEdges.length
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to synchronize file code changes with flow:', error);
      return false;
    }
  }
}

export const flowSyncService = FlowSyncService.getInstance();