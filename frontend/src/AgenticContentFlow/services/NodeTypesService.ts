/** @format */

/**
 * Node Types Service
 *
 * Thin wrapper over the unified API client.
 * All actual HTTP logic lives in `src/services/apiClient.ts`.
 */

import { FrameJSON } from '../Node/factory/types/FrameJSON';
import { nodeTypesApi, NodeTypeData } from '@/services/apiClient';

export type { NodeTypeData as NodeType };

function toFrameJSON(nt: NodeTypeData): FrameJSON {
  const validGroup =
    nt.group === 'cell' || nt.group === 'container' ? nt.group : 'cell';

  return {
    nodeType: nt.nodeType,
    defaultLabel: nt.defaultLabel,
    category: nt.category,
    group: validGroup,
    description: nt.description || '',
    visual: nt.visual,
    handles: nt.handles,
    process: nt.process,
    defaultDimensions: nt.defaultDimensions || { width: 200, height: 150 },
  };
}

function fromFrameJSON(f: FrameJSON): Partial<NodeTypeData> {
  return {
    nodeType: f.nodeType,
    defaultLabel: f.defaultLabel,
    category: f.category,
    group: f.group,
    description: f.description,
    visual: f.visual,
    handles: f.handles,
    process: f.process,
    defaultDimensions: f.defaultDimensions,
  };
}

export class NodeTypesService {
  async getAllNodeTypes(): Promise<FrameJSON[]> {
    const res = await nodeTypesApi.getAll();
    if (!res.success || !res.data) throw new Error(res.message || 'Failed to fetch node types');
    return res.data.map(toFrameJSON);
  }

  async getNodeTypeById(nodeType: string): Promise<FrameJSON | null> {
    const res = await nodeTypesApi.getById(nodeType);
    if (!res.success) return null;
    if (!res.data) return null;
    return toFrameJSON(res.data);
  }

  async createNodeType(nodeType: FrameJSON): Promise<FrameJSON> {
    const payload = fromFrameJSON(nodeType) as NodeTypeData;
    const res = await nodeTypesApi.create(payload);
    if (!res.success || !res.data) throw new Error(res.message || 'Failed to create node type');
    return toFrameJSON(res.data);
  }

  async updateNodeType(nodeType: string, data: FrameJSON): Promise<FrameJSON> {
    const payload = fromFrameJSON(data);
    const res = await nodeTypesApi.update(nodeType, payload);
    if (!res.success || !res.data) throw new Error(res.message || 'Failed to update node type');
    return toFrameJSON(res.data);
  }

  async deleteNodeType(nodeType: string): Promise<boolean> {
    const res = await nodeTypesApi.delete(nodeType);
    if (!res.success) throw new Error(res.message || 'Failed to delete node type');
    return true;
  }

  async createMultipleNodeTypes(nodeTypes: FrameJSON[]): Promise<FrameJSON[]> {
    return Promise.all(nodeTypes.map((nt) => this.createNodeType(nt)));
  }

  async getNodeTypesByCategory(category: string): Promise<FrameJSON[]> {
    const all = await this.getAllNodeTypes();
    return all.filter((nt) => nt.category === category);
  }

  async getNodeTypesByGroup(group: string): Promise<FrameJSON[]> {
    const all = await this.getAllNodeTypes();
    return all.filter((nt) => nt.group === group);
  }
}

// Export singleton instance
export const nodeTypesService = new NodeTypesService();
