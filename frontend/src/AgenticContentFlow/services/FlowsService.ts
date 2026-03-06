/** @format */

/**
 * Flows Service
 *
 * Thin wrapper over the unified API client.
 * All actual HTTP logic lives in `src/services/apiClient.ts`.
 */

import { Flow, FlowPayload } from '../stores/useFlowsStore';
import { flowsApi } from '@/services/apiClient';

function mapToFlow(raw: any): Flow {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? '',
    lastModified: new Date(raw.lastModified),
    nodeCount: raw.nodeCount ?? 0,
    edgeCount: raw.edgeCount ?? 0,
    type: raw.type ?? 'saved',
    nodes: raw.nodes ?? [],
    edges: raw.edges ?? [],
    metadata: raw.metadata,
  };
}

export class FlowsService {
  static async fetchFlows(): Promise<Flow[]> {
    const res = await flowsApi.getAll();
    if (!res.success || !res.data) throw new Error(res.message || 'Failed to fetch flows');
    return res.data.map(mapToFlow);
  }

  static async createFlow(payload: FlowPayload): Promise<Flow> {
    const res = await flowsApi.create(payload);
    if (!res.success || !res.data) throw new Error(res.message || 'Failed to create flow');
    return mapToFlow(res.data);
  }

  static async updateFlow(id: string, payload: FlowPayload): Promise<Flow> {
    const res = await flowsApi.update(id, payload);
    if (!res.success || !res.data) throw new Error(res.message || 'Failed to update flow');
    return mapToFlow(res.data);
  }

  static async deleteFlow(id: string): Promise<boolean> {
    const res = await flowsApi.delete(id);
    if (!res.success) throw new Error(res.message || 'Failed to delete flow');
    return true;
  }

  static async getFlow(id: string): Promise<Flow> {
    const res = await flowsApi.getById(id);
    if (!res.success || !res.data) throw new Error(res.message || 'Failed to get flow');
    return mapToFlow(res.data);
  }

  static toPayload(flow: Partial<Flow>): FlowPayload {
    return {
      name: flow.name || '',
      description: flow.description || '',
      nodes: flow.nodes || [],
      edges: flow.edges || [],
      type: flow.type || 'saved',
      metadata: flow.metadata,
    };
  }
}
