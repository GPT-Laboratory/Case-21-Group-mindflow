/** @format */

import { FrameJSON } from '../Node/factory/types/FrameJSON';

/**
 * Node Type interface matching the API response
 */
export interface NodeType {
  nodeType: string;
  defaultLabel: string;
  category: string;
  group: string;
  description?: string;
  visual: any;
  handles: any;
  process: any;
  defaultDimensions?: any;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * API Response interface
 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
}

/**
 * Node Types Service
 * Handles all API calls related to node types
 */
export class NodeTypesService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Convert NodeType to FrameJSON format
   */
  private convertToFrameJSON(nodeType: NodeType): FrameJSON {
    // Ensure group is either 'cell' or 'container'
    const validGroup = (nodeType.group === 'cell' || nodeType.group === 'container') 
      ? nodeType.group 
      : 'cell'; // Default to 'cell' if invalid

    return {
      nodeType: nodeType.nodeType,
      defaultLabel: nodeType.defaultLabel,
      category: nodeType.category,
      group: validGroup,
      description: nodeType.description || '',
      visual: nodeType.visual,
      handles: nodeType.handles,
      process: nodeType.process,
      defaultDimensions: nodeType.defaultDimensions || {
        width: 200,
        height: 150
      }
    };
  }

  /**
   * Convert FrameJSON to NodeType format for API
   */
  private convertFromFrameJSON(frameJSON: FrameJSON): Partial<NodeType> {
    return {
      nodeType: frameJSON.nodeType,
      defaultLabel: frameJSON.defaultLabel,
      category: frameJSON.category,
      group: frameJSON.group,
      description: frameJSON.description,
      visual: frameJSON.visual,
      handles: frameJSON.handles,
      process: frameJSON.process,
      defaultDimensions: frameJSON.defaultDimensions
    };
  }

  /**
   * Get all node types
   */
  async getAllNodeTypes(): Promise<FrameJSON[]> {
    try {
      const response = await fetch(`${this.baseUrl}/nodeTypes`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<NodeType[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch node types');
      }
      
      return result.data.map(nodeType => this.convertToFrameJSON(nodeType));
    } catch (error) {
      console.error('Error fetching node types:', error);
      throw error;
    }
  }

  /**
   * Get node type by ID
   */
  async getNodeTypeById(nodeType: string): Promise<FrameJSON | null> {
    try {
      const response = await fetch(`${this.baseUrl}/nodeTypes/${encodeURIComponent(nodeType)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<NodeType> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch node type');
      }
      
      return this.convertToFrameJSON(result.data);
    } catch (error) {
      console.error('Error fetching node type:', error);
      throw error;
    }
  }

  /**
   * Create a new node type
   */
  async createNodeType(nodeType: FrameJSON): Promise<FrameJSON> {
    try {
      const nodeTypeData = this.convertFromFrameJSON(nodeType);
      
      const response = await fetch(`${this.baseUrl}/nodeTypes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nodeTypeData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<NodeType> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create node type');
      }
      
      return this.convertToFrameJSON(result.data);
    } catch (error) {
      console.error('Error creating node type:', error);
      throw error;
    }
  }

  /**
   * Update an existing node type
   */
  async updateNodeType(nodeType: string, nodeTypeData: FrameJSON): Promise<FrameJSON> {
    try {
      const updateData = this.convertFromFrameJSON(nodeTypeData);
      
      const response = await fetch(`${this.baseUrl}/nodeTypes/${encodeURIComponent(nodeType)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<NodeType> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update node type');
      }
      
      return this.convertToFrameJSON(result.data);
    } catch (error) {
      console.error('Error updating node type:', error);
      throw error;
    }
  }

  /**
   * Delete a node type
   */
  async deleteNodeType(nodeType: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/nodeTypes/${encodeURIComponent(nodeType)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<null> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete node type');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting node type:', error);
      throw error;
    }
  }

  /**
   * Bulk create node types
   */
  async createMultipleNodeTypes(nodeTypes: FrameJSON[]): Promise<FrameJSON[]> {
    try {
      const promises = nodeTypes.map(nodeType => this.createNodeType(nodeType));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error creating multiple node types:', error);
      throw error;
    }
  }

  /**
   * Get node types by category
   */
  async getNodeTypesByCategory(category: string): Promise<FrameJSON[]> {
    try {
      const allNodeTypes = await this.getAllNodeTypes();
      return allNodeTypes.filter(nodeType => nodeType.category === category);
    } catch (error) {
      console.error('Error getting node types by category:', error);
      throw error;
    }
  }

  /**
   * Get node types by group
   */
  async getNodeTypesByGroup(group: string): Promise<FrameJSON[]> {
    try {
      const allNodeTypes = await this.getAllNodeTypes();
      return allNodeTypes.filter(nodeType => nodeType.group === group);
    } catch (error) {
      console.error('Error getting node types by group:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const nodeTypesService = new NodeTypesService(); 