import { GenerationRequest } from '../types';
import { BaseProcessTemplate } from './base';

/**
 * Universal Process Template
 * 
 * A single, node-agnostic template that works with any node type.
 * All node-specific behavior is driven by the node configuration data.
 */
export class UniversalProcessTemplate extends BaseProcessTemplate {
  constructor() {
    super('universal');
  }

  generate(_request: GenerationRequest): string {
    const logging = this.generateLogging('universal', 'Processing');
    
    return `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  ${logging.start}
  
  try {
    // Universal processing logic - behavior driven by nodeData configuration
    let result = incomingData;
    
    // Apply any transformations based on node configuration
    if (nodeData.transform) {
      result = applyTransformations(result, nodeData.transform);
    }
    
    // Add processing metadata
    result = {
      ...result,
      metadata: {
        ...result.metadata,
        processedBy: nodeData.nodeType || 'unknown',
        processedAt: new Date().toISOString(),
        nodeId: params?.nodeId,
        configuration: nodeData
      }
    };
    
    ${logging.success}
    return result;
  } catch (error) {
    ${logging.error}
    throw error;
  }
}

function applyTransformations(data, transformConfig) {
  // Generic transformation logic based on configuration
  if (!transformConfig) return data;
  
  let transformed = data;
  
  // Apply filters if configured
  if (transformConfig.filter && Array.isArray(data.data)) {
    transformed = {
      ...transformed,
      data: data.data.filter(item => evaluateFilter(item, transformConfig.filter))
    };
  }
  
  // Apply mappings if configured
  if (transformConfig.map && Array.isArray(transformed.data)) {
    transformed = {
      ...transformed,
      data: transformed.data.map(item => applyMapping(item, transformConfig.map))
    };
  }
  
  return transformed;
}

function evaluateFilter(item, filterConfig) {
  // Generic filter evaluation
  if (!filterConfig) return true;
  
  try {
    // Simple property-based filtering
    if (filterConfig.property && filterConfig.value !== undefined) {
      const itemValue = getNestedProperty(item, filterConfig.property);
      switch (filterConfig.operator || 'equals') {
        case 'equals': return itemValue === filterConfig.value;
        case 'greater': return Number(itemValue) > Number(filterConfig.value);
        case 'less': return Number(itemValue) < Number(filterConfig.value);
        case 'contains': return String(itemValue).includes(String(filterConfig.value));
        default: return true;
      }
    }
    return true;
  } catch {
    return true;
  }
}

function applyMapping(item, mapConfig) {
  // Generic property mapping
  if (!mapConfig) return item;
  
  const mapped = { ...item };
  Object.entries(mapConfig).forEach(([targetProp, sourceProp]) => {
    if (typeof sourceProp === 'string') {
      mapped[targetProp] = getNestedProperty(item, sourceProp);
    }
  });
  
  return mapped;
}

function getNestedProperty(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}`;
  }
  
  getFeatures(): string[] {
    return ['Universal processing', 'Configuration-driven behavior', 'Generic transformations', 'Error handling', 'Metadata preservation'];
  }
  
  getImplementationNotes(): string[] {
    return ['Node-agnostic implementation', 'Behavior driven by configuration', 'Extensible transformation system'];
  }
  
  getUsageInstructions(): string[] {
    return ['Configure behavior via nodeData', 'Use transform property for data manipulation', 'All node types supported'];
  }
}