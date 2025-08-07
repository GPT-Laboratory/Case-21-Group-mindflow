/** @format */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FrameJSON } from '../factory/types/FrameJSON';

/**
 * Unified Node Type Store
 * 
 * Centralized store for managing unified node type templates.
 * This replaces the separate cell and container stores with a single,
 * unified approach that handles all node types through the FrameJSON format.
 * Now integrates with the API for persistence and synchronization.
 */
export interface UnifiedNodeTypeStore {
  // Unified node templates
  nodeTypes: Record<string, FrameJSON>;
  
  // Loading state
  isLoading: boolean;
  error: string | null;
  
  // Actions for node types
  addNodeType: (nodeType: string, config: FrameJSON) => void;
  removeNodeType: (nodeType: string) => void;
  getNodeType: (nodeType: string) => FrameJSON | undefined;
  getAllNodeTypes: () => Map<string, FrameJSON>;
  hasNodeType: (nodeType: string) => boolean;
  
  // Bulk operations
  addMultipleNodeTypes: (configs: Record<string, FrameJSON>) => void;
  clearAllNodeTypes: () => void;
  
  // API operations
  fetchNodeTypes: () => Promise<void>;
  createNodeType: (nodeType: string, config: FrameJSON) => Promise<void>;
  updateNodeType: (nodeType: string, config: FrameJSON) => Promise<void>;
  deleteNodeType: (nodeType: string) => Promise<void>;
  
  // Utility methods
  getAllNodeTypeNames: () => string[];
  getNodeTypesByCategory: (category: string) => FrameJSON[];
  getNodeTypesByGroup: (group: string) => FrameJSON[];
  getCellLikeNodes: () => FrameJSON[];
  getContainerLikeNodes: () => FrameJSON[];
}

export const useUnifiedNodeTypeStore = create<UnifiedNodeTypeStore>()(
  persist(
    (set, get) => ({
      nodeTypes: {},
      isLoading: false,
      error: null,
      
      // Node type actions
      addNodeType: (nodeType: string, config: FrameJSON) => {
        set((state) => ({
          nodeTypes: { ...state.nodeTypes, [nodeType]: config }
        }));
      },
      
      removeNodeType: (nodeType: string) => {
        set((state) => {
          const { [nodeType]: removed, ...remaining } = state.nodeTypes;
          return { nodeTypes: remaining };
        });
      },
      
      getNodeType: (nodeType: string) => {
        return get().nodeTypes[nodeType];
      },
      
      getAllNodeTypes: () => {
        return new Map(Object.entries(get().nodeTypes));
      },
      
      hasNodeType: (nodeType: string) => {
        return nodeType in get().nodeTypes;
      },
      
      // Bulk operations
      addMultipleNodeTypes: (configs: Record<string, FrameJSON>) => {
        set((state) => ({
          nodeTypes: { ...state.nodeTypes, ...configs }
        }));
      },
      
      clearAllNodeTypes: () => {
        set({ nodeTypes: {} });
      },
      
      // API operations
      fetchNodeTypes: async () => {
        set({ isLoading: true, error: null });
        try {
          const { nodeTypesService } = await import('../../services/NodeTypesService');
          const nodeTypes = await nodeTypesService.getAllNodeTypes();
          
          const nodeTypesMap: Record<string, FrameJSON> = {};
          nodeTypes.forEach(nodeType => {
            nodeTypesMap[nodeType.nodeType] = nodeType;
          });
          
          // Merge API data with existing node types instead of replacing
          set((state) => ({
            nodeTypes: { ...state.nodeTypes, ...nodeTypesMap },
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch node types', 
            isLoading: false 
          });
        }
      },
      
      createNodeType: async (nodeType: string, config: FrameJSON) => {
        set({ isLoading: true, error: null });
        try {
          const { nodeTypesService } = await import('../../services/NodeTypesService');
          await nodeTypesService.createNodeType(config);
          set((state) => ({
            nodeTypes: { ...state.nodeTypes, [nodeType]: config },
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create node type', 
            isLoading: false 
          });
        }
      },
      
      updateNodeType: async (nodeType: string, config: FrameJSON) => {
        set({ isLoading: true, error: null });
        try {
          const { nodeTypesService } = await import('../../services/NodeTypesService');
          await nodeTypesService.updateNodeType(nodeType, config);
          set((state) => ({
            nodeTypes: { ...state.nodeTypes, [nodeType]: config },
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update node type', 
            isLoading: false 
          });
        }
      },
      
      deleteNodeType: async (nodeType: string) => {
        set({ isLoading: true, error: null });
        try {
          const { nodeTypesService } = await import('../../services/NodeTypesService');
          await nodeTypesService.deleteNodeType(nodeType);
          set((state) => {
            const { [nodeType]: removed, ...remaining } = state.nodeTypes;
            return { nodeTypes: remaining, isLoading: false };
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete node type', 
            isLoading: false 
          });
        }
      },
      
      // Utility methods
      getAllNodeTypeNames: () => {
        return Object.keys(get().nodeTypes);
      },
      
      getNodeTypesByCategory: (category: string) => {
        const state = get();
        return Object.values(state.nodeTypes).filter(
          nodeType => nodeType.category === category
        );
      },
      
      getNodeTypesByGroup: (group: string) => {
        const state = get();
        return Object.values(state.nodeTypes).filter(
          nodeType => nodeType.group === group
        );
      },
      
      getCellLikeNodes: () => {
        const state = get();
        return Object.values(state.nodeTypes).filter(
          nodeType => nodeType.group === "cell"
        );
      },
      
      getContainerLikeNodes: () => {
        const state = get();
        return Object.values(state.nodeTypes).filter(
          nodeType => nodeType.group === "container"
        );
      },
    }),
    {
      name: 'unified-node-type-store',
    }
  )
); 