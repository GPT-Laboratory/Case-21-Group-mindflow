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
 * Simplified Data Schema Manager
 * 
 * Manages data schemas across all nodes in the flow with React-friendly patterns:
 * - Simple Map-based storage with reactive updates
 * - Straightforward schema propagation
 * - Easy subscription pattern for React components
 */
export class DataSchemaManager {
  private schemas = new Map<string, NodeSchema>();
  private connections = new Map<string, string[]>(); // sourceId -> targetIds
  private listeners = new Set<(nodeId: string, schema: NodeSchema) => void>();

  /**
   * Subscribe to schema changes (React-friendly)
   */
  subscribe(listener: (nodeId: string, schema: NodeSchema) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
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
    
    // Auto-propagate to connected nodes
    if (outputSchema) {
      this.propagateToConnected(nodeId, outputSchema);
    }
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
   * Update connections between nodes
   */
  updateConnections(sourceId: string, targetId: string, isConnected: boolean) {
    if (isConnected) {
      const targets = this.connections.get(sourceId) || [];
      if (!targets.includes(targetId)) {
        targets.push(targetId);
        this.connections.set(sourceId, targets);
        
        // Immediately propagate schema if available
        const sourceSchema = this.schemas.get(sourceId);
        if (sourceSchema?.outputSchema) {
          this.updateSchema(targetId, sourceSchema.outputSchema);
        }
      }
    } else {
      const targets = this.connections.get(sourceId) || [];
      const index = targets.indexOf(targetId);
      if (index > -1) {
        targets.splice(index, 1);
        this.connections.set(sourceId, targets);
      }
    }
  }

  /**
   * Generate simple test data from schema
   */
  generateTestData(schema: JSONSchema): any {
    switch (schema.type) {
      case 'array':
        return schema.items ? Array(3).fill(null).map(() => this.generateTestData(schema.items!)) : [];
      
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
   * Simple compatibility check
   */
  validateCompatibility(sourceSchema: JSONSchema, targetSchema: JSONSchema): SchemaValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic type compatibility
    if (sourceSchema.type !== targetSchema.type) {
      if (sourceSchema.type === 'object' && targetSchema.type === 'array') {
        warnings.push('Type mismatch: source is object, target expects array. Data may need extraction.');
      } else {
        errors.push(`Type mismatch: source is ${sourceSchema.type}, target expects ${targetSchema.type}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Analyze REST endpoint (simplified)
   */
  async analyzeRestEndpoint(url: string, method: string = 'GET'): Promise<JSONSchema> {
    // Simplified schema detection based on URL patterns
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
    }
    
    if (url.includes('users')) {
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
  }

  /**
   * Clear all data
   */
  clear() {
    this.schemas.clear();
    this.connections.clear();
  }

  // Private methods
  private notifyListeners(nodeId: string, schema: NodeSchema) {
    this.listeners.forEach(listener => listener(nodeId, schema));
  }

  private propagateToConnected(sourceId: string, outputSchema: JSONSchema) {
    const targets = this.connections.get(sourceId) || [];
    targets.forEach(targetId => {
      this.updateSchema(targetId, outputSchema);
    });
  }
}

// Global instance
export const dataSchemaManager = new DataSchemaManager();