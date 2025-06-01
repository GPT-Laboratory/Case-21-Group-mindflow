/** @format */

export interface JSONSchema {
  type: string;
  items?: JSONSchema;
  properties?: Record<string, JSONSchema>;
  required?: string[];
}

export interface NodeSchema {
  nodeId: string;
  inputSchema?: JSONSchema;
  outputSchema?: JSONSchema;
  lastUpdated: number;
}

export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Data Schema Manager
 * 
 * Manages data schemas across all nodes in the flow, enabling:
 * - Automatic test data generation based on schemas
 * - Schema compatibility validation between connected nodes
 * - Schema propagation through the flow
 * - Schema mismatch detection and warnings
 */
export class DataSchemaManager {
  private schemas: Map<string, NodeSchema> = new Map();
  private edgeConnections: Map<string, string[]> = new Map(); // nodeId -> connected nodeIds
  private listeners: Map<string, Set<(schema: NodeSchema) => void>> = new Map();
  private globalListeners: Set<(nodeId: string, schema: NodeSchema) => void> = new Set();

  /**
   * Register a global schema change listener
   */
  addListener(listener: (nodeId: string, schema: NodeSchema) => void) {
    this.globalListeners.add(listener);
  }

  /**
   * Remove a global schema change listener
   */
  removeListener(listener: (nodeId: string, schema: NodeSchema) => void) {
    this.globalListeners.delete(listener);
  }

  /**
   * Update schema for a node
   */
  updateSchema(nodeId: string, inputSchema?: JSONSchema, outputSchema?: JSONSchema) {
    const existing = this.schemas.get(nodeId);
    const newSchema: NodeSchema = {
      nodeId,
      inputSchema: inputSchema || existing?.inputSchema,
      outputSchema: outputSchema || existing?.outputSchema,
      lastUpdated: Date.now()
    };
    
    this.schemas.set(nodeId, newSchema);
    this.notifyListeners(nodeId, newSchema);
    
    // Propagate changes to connected nodes
    this.propagateSchemaChange(nodeId, newSchema);
  }

  /**
   * Update node schema (alternative method signature)
   */
  updateNodeSchema(nodeId: string, schema: NodeSchema) {
    this.schemas.set(nodeId, schema);
    this.notifyListeners(nodeId, schema);
    this.propagateSchemaChange(nodeId, schema);
  }

  /**
   * Get schema for a node
   */
  getSchema(nodeId: string): NodeSchema | undefined {
    return this.schemas.get(nodeId);
  }

  /**
   * Get input schema for a node
   */
  getInputSchema(nodeId: string): JSONSchema | undefined {
    return this.schemas.get(nodeId)?.inputSchema;
  }

  /**
   * Update edge connections
   */
  updateConnections(sourceId: string, targetId: string, isConnected: boolean) {
    if (isConnected) {
      // Add connection
      const targets = this.edgeConnections.get(sourceId) || [];
      if (!targets.includes(targetId)) {
        targets.push(targetId);
        this.edgeConnections.set(sourceId, targets);
      }
      
      // Propagate schema from source to target
      const sourceSchema = this.schemas.get(sourceId);
      if (sourceSchema?.outputSchema) {
        this.updateSchema(targetId, sourceSchema.outputSchema);
      }
    } else {
      // Remove connection
      const targets = this.edgeConnections.get(sourceId) || [];
      const index = targets.indexOf(targetId);
      if (index > -1) {
        targets.splice(index, 1);
        this.edgeConnections.set(sourceId, targets);
      }
    }
  }

  /**
   * Generate test data based on a JSON schema
   */
  generateTestData(schema: JSONSchema): any {
    switch (schema.type) {
      case 'array':
        if (schema.items) {
          return Array(3).fill(null).map(() => this.generateTestData(schema.items!));
        }
        return [];
      
      case 'object':
        if (schema.properties) {
          const result: any = {};
          Object.entries(schema.properties).forEach(([key, propSchema]) => {
            result[key] = this.generateTestData(propSchema);
          });
          return result;
        }
        return {};
      
      case 'string':
        return 'Sample text';
      
      case 'number':
        return 42;
      
      case 'boolean':
        return true;
      
      default:
        return null;
    }
  }

  /**
   * Validate schema compatibility between source and target nodes
   */
  validateCompatibility(sourceSchema: JSONSchema, targetSchema: JSONSchema): SchemaValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic type compatibility check
    if (sourceSchema.type !== targetSchema.type) {
      errors.push(`Type mismatch: source produces ${sourceSchema.type}, target expects ${targetSchema.type}`);
    }

    // Object property compatibility
    if (sourceSchema.type === 'object' && targetSchema.type === 'object') {
      if (targetSchema.properties && sourceSchema.properties) {
        Object.entries(targetSchema.properties).forEach(([key, targetProp]) => {
          const sourceProp = sourceSchema.properties![key];
          if (!sourceProp) {
            if (targetSchema.required?.includes(key)) {
              errors.push(`Missing required property: ${key}`);
            } else {
              warnings.push(`Missing optional property: ${key}`);
            }
          } else if (sourceProp.type !== targetProp.type) {
            errors.push(`Property type mismatch for ${key}: source is ${sourceProp.type}, target expects ${targetProp.type}`);
          }
        });
      }
    }

    // Array item compatibility
    if (sourceSchema.type === 'array' && targetSchema.type === 'array') {
      if (sourceSchema.items && targetSchema.items) {
        const itemCompatibility = this.validateCompatibility(sourceSchema.items, targetSchema.items);
        errors.push(...itemCompatibility.errors.map(err => `Array items: ${err}`));
        warnings.push(...itemCompatibility.warnings.map(warn => `Array items: ${warn}`));
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Propagate schema changes through connected nodes
   * This would be called when edges are created/modified
   */
  propagateSchemaChanges(sourceNodeId: string, targetNodeIds: string[]) {
    const sourceSchema = this.getSchema(sourceNodeId);
    if (!sourceSchema?.outputSchema) return;

    targetNodeIds.forEach(targetNodeId => {
      const targetSchema = this.getSchema(targetNodeId);
      if (targetSchema?.inputSchema) {
        const compatibility = this.validateCompatibility(
          sourceSchema.outputSchema!,
          targetSchema.inputSchema
        );

        if (!compatibility.isValid) {
          console.warn(`Schema compatibility issues between ${sourceNodeId} and ${targetNodeId}:`, compatibility.errors);
        }
      }

      // Update target node's input schema to match source output
      this.updateSchema(targetNodeId, sourceSchema.outputSchema, targetSchema?.outputSchema);
    });
  }

  /**
   * Get all schemas
   */
  getAllSchemas(): Map<string, NodeSchema> {
    return new Map(this.schemas);
  }

  /**
   * Clear all schemas
   */
  clear() {
    this.schemas.clear();
  }

  // Private methods
  private propagateSchemaChange(nodeId: string, schema: NodeSchema) {
    const connectedNodes = this.edgeConnections.get(nodeId) || [];
    connectedNodes.forEach(targetNodeId => {
      if (schema.outputSchema) {
        this.updateSchema(targetNodeId, schema.outputSchema);
      }
    });
  }

  private notifyListeners(nodeId: string, schema: NodeSchema) {
    // Notify node-specific listeners
    const nodeListeners = this.listeners.get(nodeId);
    if (nodeListeners) {
      nodeListeners.forEach(listener => listener(schema));
    }

    // Notify global listeners
    this.globalListeners.forEach(listener => listener(nodeId, schema));
  }

  /**
   * Propagate schema to downstream nodes
   */
  propagateSchemaToDownstream(nodeId: string) {
    const connectedNodes = this.edgeConnections.get(nodeId) || [];
    const sourceSchema = this.schemas.get(nodeId);
    
    if (sourceSchema?.outputSchema) {
      connectedNodes.forEach(targetNodeId => {
        this.updateSchema(targetNodeId, sourceSchema.outputSchema);
      });
    }
  }

  /**
   * Subscribe method for global listeners
   */
  subscribe(listener: (nodeId: string, schema: NodeSchema) => void): () => void;
  subscribe(nodeId: string, listener: (schema: NodeSchema) => void): () => void;
  subscribe(nodeIdOrListener: string | ((nodeId: string, schema: NodeSchema) => void), listener?: (schema: NodeSchema) => void): () => void {
    if (typeof nodeIdOrListener === 'function') {
      // Global listener
      this.globalListeners.add(nodeIdOrListener);
      return () => this.globalListeners.delete(nodeIdOrListener);
    } else {
      // Node-specific listener
      const nodeId = nodeIdOrListener;
      if (!listener) throw new Error('Listener function is required for node-specific subscription');
      
      if (!this.listeners.has(nodeId)) {
        this.listeners.set(nodeId, new Set());
      }
      this.listeners.get(nodeId)!.add(listener);

      return () => {
        const nodeListeners = this.listeners.get(nodeId);
        if (nodeListeners) {
          nodeListeners.delete(listener);
        }
      };
    }
  }

  // Analyze REST endpoint and generate schema
  async analyzeRestEndpoint(url: string, method: string = 'GET'): Promise<JSONSchema> {
    try {
      // For demo purposes, return schema based on common API patterns
      // Note: method parameter is used for future extensibility
      console.log(`Analyzing ${method} ${url}`);
      
      if (url.includes('posts')) {
        return {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              title: { type: 'string' },
              body: { type: 'string' },
              userId: { type: 'number' }
            }
          }
        };
      } else if (url.includes('users')) {
        return {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              email: { type: 'string' },
              username: { type: 'string' }
            }
          }
        };
      } else if (url.includes('comments')) {
        return {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              email: { type: 'string' },
              body: { type: 'string' },
              postId: { type: 'number' }
            }
          }
        };
      }
      
      // Default schema
      return {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            data: { type: 'string' }
          }
        }
      };
    } catch (error) {
      console.error('Failed to analyze endpoint:', error);
      throw error;
    }
  }
}

// Global instance
export const dataSchemaManager = new DataSchemaManager();