/** @format */

import { JSONSchema } from '../core/DataSchemaManager';

/**
 * Schema Generation Utilities
 * 
 * Handles generating schemas from data and creating test data from schemas
 */
export class SchemaGenerator {
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
   * Generate schema from actual data
   */
  generateSchemaFromData(data: any): JSONSchema {
    if (data === null || data === undefined) return { type: 'null' };
    
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return { type: 'array', items: { type: 'object' } };
      }
      return {
        type: 'array',
        items: this.generateSchemaFromData(data[0])
      };
    }
    
    if (typeof data === 'object') {
      const properties: Record<string, JSONSchema> = {};
      Object.keys(data).forEach(key => {
        properties[key] = this.generateSchemaFromData(data[key]);
      });
      return {
        type: 'object',
        properties
      };
    }
    
    return { type: typeof data };
  }

  /**
   * Generate input schema for REST nodes based on HTTP method
   */
  generateRestInputSchema(method: string): JSONSchema {
    if (method.toUpperCase() === 'GET') {
      return {
        type: 'object',
        properties: {
          params: { type: 'object' },
          headers: { type: 'object' }
        }
      };
    }
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      return {
        type: 'object',
        properties: {
          data: { type: 'object' },
          headers: { type: 'object' }
        }
      };
    }
    return {
      type: 'object',
      properties: {
        headers: { type: 'object' }
      }
    };
  }
}

// Global instance
export const schemaGenerator = new SchemaGenerator();