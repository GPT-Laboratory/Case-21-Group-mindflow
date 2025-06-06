import { JSONSchema } from '../../../Process/DataSchemaManager';

export interface ListConfig {
  itemTemplate?: {
    title?: string;
    subtitle?: string;
    metadata?: string;
  };
}

export type ApprovalStatus = 'pending' | 'approved' | 'declined';
export type DataSource = 'realtime' | 'test' | 'none';
export type DisplayType = 'list' | 'table' | 'cards' | 'custom';

export interface ContentPreviewData {
  data: any;
  source: DataSource;
  isValid: boolean;
}

export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const parseListConfig = (listConfig: any): ListConfig => {
  try {
    if (!listConfig) return {};
    
    // If it's already an object, return it
    if (typeof listConfig === 'object') {
      return listConfig;
    }
    
    // If it's a string, try to parse it
    if (typeof listConfig === 'string') {
      // Handle empty string or just whitespace
      const trimmed = listConfig.trim();
      if (!trimmed || trimmed === '{}') return {};
      
      return JSON.parse(trimmed);
    }
    
    return {};
  } catch (error) {
    console.warn('Failed to parse listConfig:', error, listConfig);
    return {};
  }
};

export const isValidRealTimeData = (dataFlow: any): boolean => {
  // Handle EdgeDataFlow objects from the process context
  if (dataFlow && typeof dataFlow === 'object' && 'data' in dataFlow) {
    const actualData = dataFlow.data;
    
    // Quick array check with early return
    if (Array.isArray(actualData) && actualData.length > 0) {
      const firstItem = actualData[0];
      if (firstItem && typeof firstItem === 'object') {
        // Optimized validation - check most common properties first
        return Boolean(
          // REST API data patterns
          (firstItem.id && typeof firstItem.id === 'number' && firstItem.id !== 42) ||
          (firstItem.title && typeof firstItem.title === 'string' && !firstItem.title.startsWith('Sample')) ||
          (firstItem.body && typeof firstItem.body === 'string' && firstItem.body !== 'Sample text') ||
          (firstItem.userId && typeof firstItem.userId === 'number') ||
          // Other common data patterns
          (firstItem.name && typeof firstItem.name === 'string') ||
          (firstItem.email && typeof firstItem.email === 'string') ||
          // LogicalNode processed data
          (firstItem.aggregated === true)
        );
      }
    }
    
    // Handle single object case
    if (actualData && typeof actualData === 'object' && !Array.isArray(actualData)) {
      return Boolean(
        (actualData.id && typeof actualData.id === 'number' && actualData.id !== 42) ||
        (actualData.title && typeof actualData.title === 'string' && !actualData.title.startsWith('Sample')) ||
        (actualData.body && typeof actualData.body === 'string' && actualData.body !== 'Sample text') ||
        (actualData.aggregated === true) ||
        (actualData.userId && typeof actualData.userId === 'number')
      );
    }
  }
  
  // Handle direct array data (fallback for other cases)
  if (Array.isArray(dataFlow) && dataFlow.length > 0) {
    const firstItem = dataFlow[0];
    if (firstItem && typeof firstItem === 'object') {
      return Boolean(
        (firstItem.id && typeof firstItem.id === 'number' && firstItem.id !== 42) ||
        (firstItem.title && typeof firstItem.title === 'string' && !firstItem.title.startsWith('Sample')) ||
        (firstItem.body && typeof firstItem.body === 'string' && firstItem.body !== 'Sample text') ||
        (firstItem.aggregated === true) ||
        (firstItem.userId && typeof firstItem.userId === 'number')
      );
    }
  }
  
  return false;
};

export const generateTestDataSafely = (
  schema: JSONSchema | undefined,
  generateTestData: (schema: JSONSchema) => any
): any => {
  if (!schema) {
    console.warn('No schema provided for test data generation');
    return null;
  }
  
  try {
    return generateTestData(schema);
  } catch (error) {
    console.error('Failed to generate test data:', error);
    return null;
  }
};

export const replaceTemplateVariables = (template: string, data: Record<string, any>): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => 
    data[key] !== undefined ? String(data[key]) : match
  );
};