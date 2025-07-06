/** @format */

import { Flow, FlowPayload, ApiResponse } from '../stores/useFlowsStore';

/**
 * Flows API Service
 * 
 * Handles all API communication for flows management.
 * Provides a clean interface for CRUD operations.
 */
export class FlowsService {
  private static readonly BASE_URL = '/api/flows';
  
  /**
   * Fetch all flows from the server
   */
  static async fetchFlows(): Promise<Flow[]> {
    const response = await this.makeRequest<Flow[]>(this.BASE_URL, {
      method: 'GET',
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch flows');
    }
    
    return response.data;
  }
  
  /**
   * Create a new flow
   */
  static async createFlow(payload: FlowPayload): Promise<Flow> {
    const response = await this.makeRequest<Flow>(this.BASE_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create flow');
    }
    
    return response.data;
  }
  
  /**
   * Update an existing flow
   */
  static async updateFlow(id: string, payload: FlowPayload): Promise<Flow> {
    const response = await this.makeRequest<Flow>(`${this.BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update flow');
    }
    
    return response.data;
  }
  
  /**
   * Delete a flow
   */
  static async deleteFlow(id: string): Promise<boolean> {
    const response = await this.makeRequest(`${this.BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete flow');
    }
    
    return true;
  }
  
  /**
   * Get a specific flow by ID
   */
  static async getFlow(id: string): Promise<Flow> {
    const response = await this.makeRequest<Flow>(`${this.BASE_URL}/${id}`, {
      method: 'GET',
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to get flow');
    }
    
    return response.data;
  }
  
  /**
   * Generic request method with error handling
   */
  private static async makeRequest<T = any>(
    url: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data as ApiResponse<T>;
    } catch (error) {
      console.error('API request failed:', error);
      
      // Provide more helpful error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please ensure the test server is running on http://localhost:3001');
      }
      
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        throw new Error('Invalid response from server. Please check if the server is running correctly.');
      }
      
      throw error;
    }
  }
  
  /**
   * Convert flow data to API payload format
   */
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
  
  /**
   * Convert API response to Flow format
   */
  static fromApiResponse(data: any): Flow {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      lastModified: new Date(data.lastModified),
      nodeCount: data.nodeCount || 0,
      edgeCount: data.edgeCount || 0,
      type: data.type || 'saved',
      nodes: data.nodes || [],
      edges: data.edges || [],
      metadata: data.metadata,
    };
  }
} 