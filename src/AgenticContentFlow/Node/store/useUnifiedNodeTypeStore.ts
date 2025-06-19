/** @format */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UnifiedFrameJSON } from '../factory//types/UnifiedFrameJSON';

/**
 * Unified Node Type Store
 * 
 * Centralized store for managing unified node type templates.
 * This replaces the separate cell and container stores with a single,
 * unified approach that handles all node types through the UnifiedFrameJSON format.
 */
export interface UnifiedNodeTypeStore {
  // Unified node templates
  nodeTypes: Record<string, UnifiedFrameJSON>;
  
  // Actions for node types
  addNodeType: (nodeType: string, config: UnifiedFrameJSON) => void;
  removeNodeType: (nodeType: string) => void;
  getNodeType: (nodeType: string) => UnifiedFrameJSON | undefined;
  getAllNodeTypes: () => Map<string, UnifiedFrameJSON>;
  hasNodeType: (nodeType: string) => boolean;
  
  // Bulk operations
  addMultipleNodeTypes: (configs: Record<string, UnifiedFrameJSON>) => void;
  clearAllNodeTypes: () => void;
  
  // Utility methods
  getAllNodeTypeNames: () => string[];
  getNodeTypesByCategory: (category: string) => UnifiedFrameJSON[];
  getNodeTypesByGroup: (group: string) => UnifiedFrameJSON[];
  getCellLikeNodes: () => UnifiedFrameJSON[];
  getContainerLikeNodes: () => UnifiedFrameJSON[];
}

export const useUnifiedNodeTypeStore = create<UnifiedNodeTypeStore>()(
  persist(
    (set, get) => ({
      nodeTypes: {},
      
      // Node type actions
      addNodeType: (nodeType: string, config: UnifiedFrameJSON) => {
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
      addMultipleNodeTypes: (configs: Record<string, UnifiedFrameJSON>) => {
        set((state) => ({
          nodeTypes: { ...state.nodeTypes, ...configs }
        }));
      },
      
      clearAllNodeTypes: () => {
        set({ nodeTypes: {} });
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