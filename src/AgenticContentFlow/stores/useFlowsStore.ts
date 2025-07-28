/** @format */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Node, Edge } from '@xyflow/react';
import { FlowsService } from '../services/FlowsService';

/**
 * Flow interface representing a saved flow
 */
export interface Flow {
  id: string;
  name: string;
  description: string;
  lastModified: Date;
  nodeCount: number;
  edgeCount: number;
  type: 'template' | 'saved' | 'recent';
  nodes: Node[];
  edges: Edge[];
  metadata?: Record<string, any>;
}

/**
 * Flow creation/update payload
 */
export interface FlowPayload {
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  type?: 'template' | 'saved' | 'recent';
  metadata?: Record<string, any>;
}

/**
 * API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Flows Store
 * 
 * Centralized store for managing flows with API integration.
 * Handles CRUD operations for flows and provides caching.
 */
export interface FlowsStore {
  // State
  flows: Record<string, Flow>;
  loading: boolean;
  error: string | null;
  selectedFlowId: string | null;
  
  // Actions
  setFlows: (flows: Flow[]) => void;
  addFlow: (flow: Flow) => void;
  updateFlow: (id: string, updates: Partial<Flow>) => void;
  removeFlow: (id: string) => void;
  getFlow: (id: string) => Flow | undefined;
  getAllFlows: () => Flow[];
  setSelectedFlow: (id: string | null) => void;
  
  // API Actions
  fetchFlows: () => Promise<void>;
  createFlow: (payload: FlowPayload) => Promise<Flow | null>;
  saveFlow: (id: string, payload: FlowPayload) => Promise<Flow | null>;
  deleteFlow: (id: string) => Promise<boolean>;
  
  // Utility methods
  getFlowById: (id: string) => Flow | undefined;
  getFlowsByType: (type: Flow['type']) => Flow[];
  clearError: () => void;
  clearAllFlows: () => void;
}

export const useFlowsStore = create<FlowsStore>()(
  persist(
    (set, get) => ({
      flows: {},
      loading: false,
      error: null,
      selectedFlowId: null,
      
      // State actions
      setFlows: (flows: Flow[]) => {
        const flowsMap = flows.reduce((acc, flow) => {
          acc[flow.id] = flow;
          return acc;
        }, {} as Record<string, Flow>);
        set({ flows: flowsMap });
      },
      
      addFlow: (flow: Flow) => {
        set((state) => ({
          flows: { ...state.flows, [flow.id]: flow }
        }));
      },
      
      updateFlow: (id: string, updates: Partial<Flow>) => {
        set((state) => {
          const existingFlow = state.flows[id];
          if (!existingFlow) return state;
          
          return {
            flows: {
              ...state.flows,
              [id]: {
                ...existingFlow,
                ...updates,
                lastModified: new Date()
              }
            }
          };
        });
      },
      
      removeFlow: (id: string) => {
        set((state) => {
          const { [id]: removed, ...remaining } = state.flows;
          return { flows: remaining };
        });
      },
      
      getFlow: (id: string) => {
        return get().flows[id];
      },
      
      getAllFlows: () => {
        return Object.values(get().flows);
      },
      
      setSelectedFlow: (id: string | null) => {
        set({ selectedFlowId: id });
      },
      
      // API Actions
      fetchFlows: async () => {
        set({ loading: true, error: null });
        try {
          const flows = await FlowsService.fetchFlows();
          get().setFlows(flows);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({ error: errorMessage });
          console.error('Failed to fetch flows:', error);
        } finally {
          set({ loading: false });
        }
      },
      
      createFlow: async (payload: FlowPayload): Promise<Flow | null> => {
        set({ loading: true, error: null });
        try {
          const flow = await FlowsService.createFlow(payload);
          get().addFlow(flow);
          return flow;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({ error: errorMessage });
          console.error('Failed to create flow:', error);
          return null;
        } finally {
          set({ loading: false });
        }
      },
      
      saveFlow: async (id: string, payload: FlowPayload): Promise<Flow | null> => {
        set({ loading: true, error: null });
        try {
          const flow = await FlowsService.updateFlow(id, payload);
          get().updateFlow(id, flow);
          return flow;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('Failed to save flow:', errorMessage);
          return null;
        } finally {
          set({ loading: false });
        }
      },
      
      deleteFlow: async (id: string): Promise<boolean> => {
        set({ loading: true, error: null });
        try {
          const success = await FlowsService.deleteFlow(id);
          if (success) {
            get().removeFlow(id);
          }
          return success;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({ error: errorMessage });
          console.error('Failed to delete flow:', error);
          return false;
        } finally {
          set({ loading: false });
        }
      },
      
      // Utility methods
      getFlowById: (id: string) => {
        return get().flows[id];
      },
      
      getFlowsByType: (type: Flow['type']) => {
        return Object.values(get().flows).filter(flow => flow.type === type);
      },
      
      clearError: () => {
        set({ error: null });
      },
      
      clearAllFlows: () => {
        set({ flows: {}, selectedFlowId: null });
      },
    }),
    {
      name: 'flows-store',
      partialize: (state) => ({
        flows: state.flows,
        selectedFlowId: state.selectedFlowId,
      }),
    }
  )
); 