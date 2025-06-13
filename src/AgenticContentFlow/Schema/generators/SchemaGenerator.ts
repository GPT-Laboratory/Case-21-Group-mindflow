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

}

// Global instance
export const schemaGenerator = new SchemaGenerator();