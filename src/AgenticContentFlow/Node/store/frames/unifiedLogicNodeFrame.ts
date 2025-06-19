/** @format */

import { UnifiedFrameJSON } from '../../factory//types/UnifiedFrameJSON';

/**
 * Unified Logic Node Frame
 * Represents logic processing nodes with configurable operations
 */
export const unifiedLogicNodeFrame: UnifiedFrameJSON = {
  nodeType: "logicnode",
  defaultLabel: "Logic Processor",
  category: "logic",
  group: "cell",
  description: "Processes data with logical operations like filtering, transforming, aggregating, or conditional routing",
  
  visual: {
    icon: { type: "builtin", value: "Settings", className: "w-4 h-4 stroke-purple-700" },
    headerGradient: "bg-gradient-to-r from-purple-50 to-purple-100",
    selectedColor: "purple",
    variants: {
      fieldName: "operation",
      options: {
        "filter": { badgeText: "FILTER", badgeColor: "bg-blue-100 text-blue-800" },
        "sort": { badgeText: "SORT", badgeColor: "bg-green-100 text-green-800" },
        "transform": { badgeText: "TRANSFORM", badgeColor: "bg-purple-100 text-purple-800" },
        "aggregate": { badgeText: "AGGREGATE", badgeColor: "bg-orange-100 text-orange-800" }
      },
      default: { badgeText: "LOGIC", badgeColor: "bg-purple-100 text-purple-800" }
    },
    additionalContentFunction: ".operation"
  },
  
  defaultDimensions: {
    width: 200,
    height: 200
  },
  
  handles: {
    category: "logic",
    definitions: [
      {
        position: "left",
        type: "target",
        dataFlow: "data",
        acceptsFrom: ["integration", "data"],
        icon: "arrow-right",
        edgeType: "package"
      },
      {
        position: "right",
        type: "source",
        dataFlow: "data",
        connectsTo: ["view", "logic"],
        icon: "arrow-right",
        edgeType: "package"
      }
    ]
  },
  
  process: {
    code: "// Example: Processes data with logical operations based on selected variant",
    templateCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🧠 Logic Node processing:', { incomingData, nodeData });
  
  try {
    const { operation = 'transform' } = nodeData;
    
    let result = incomingData;
    
    switch (operation) {
      case 'filter':
        // Filter data based on condition
        if (Array.isArray(result?.data)) {
          result = {
            ...result,
            data: result.data.filter(item => {
              // Simple filter: items with title starting with 'J'
              return item.title && item.title.startsWith('J');
            })
          };
        }
        break;
        
      case 'sort':
        // Sort data
        if (Array.isArray(result?.data)) {
          result = {
            ...result,
            data: result.data.sort((a, b) => {
              return (a.title || '').localeCompare(b.title || '');
            })
          };
        }
        break;
        
      case 'transform':
        // Transform data
        result = {
          ...result,
          transformed: true,
          processedAt: new Date().toISOString()
        };
        break;
        
      case 'aggregate':
        // Aggregate data
        if (Array.isArray(result?.data)) {
          result = {
            ...result,
            aggregated: {
              count: result.data.length,
              total: result.data.reduce((sum, item) => sum + (item.id || 0), 0)
            }
          };
        }
        break;
        
      default:
        // Default processing
        result = {
          ...result,
          processed: true,
          operation,
          processedAt: new Date().toISOString()
        };
    }
    
    console.log('✅ Logic processing completed:', { operation, resultLength: Array.isArray(result?.data) ? result.data.length : 1 });
    
    return result;
    
  } catch (error) {
    console.error('❌ Logic processing failed:', error);
    throw error;
  }
}`,
    metadata: {
      generatedBy: "manual",
      version: "1.0.0",
      lastUpdated: "2025-06-15T10:30:00Z",
      executionContext: "frontend",
      signature: "async function process(incomingData, nodeData, params, targetMap, sourceMap)"
    },
    expectedInput: "data to process",
    expectedOutput: "processed data",
    parameters: {
      condition: {
        type: "string",
        description: "Processing condition or criteria",
        required: false,
        default: "",
        ui: { component: "textarea", placeholder: "Enter processing condition..." }
      },
      enableLogging: {
        type: "boolean",
        description: "Enable detailed logging",
        required: false,
        default: true,
        ui: { component: "checkbox" }
      },
      caseSensitive: {
        type: "boolean",
        description: "Case sensitive processing",
        required: false,
        default: false,
        ui: { component: "checkbox" }
      }
    }
  }
}; 