/** @format */

import { UnifiedFrameJSON } from '../../factory//types/UnifiedFrameJSON';

/**
 * Unified Content Node Frame
 * Represents content display nodes with configurable display types
 */
export const unifiedContentNodeFrame: UnifiedFrameJSON = {
  nodeType: "contentnode",
  defaultLabel: "Content Display",
  category: "view",
  group: "cell",
  description: "Displays and renders data in various formats",
  
  visual: {
    icon: { type: "builtin", value: "Eye", className: "w-4 h-4 stroke-blue-700" },
    headerGradient: "bg-gradient-to-r from-green-50 to-green-100",
    selectedColor: "green",
    variants: {
      fieldName: "displayType",
      options: {
        "text": { badgeText: "TEXT", badgeColor: "bg-green-100 text-green-800" },
        "image": { badgeText: "IMG", badgeColor: "bg-purple-100 text-purple-800" },
        "video": { badgeText: "VID", badgeColor: "bg-red-100 text-red-800" },
        "chart": { badgeText: "CHART", badgeColor: "bg-blue-100 text-blue-800" }
      },
      default: { badgeText: "VIEW", badgeColor: "bg-green-100 text-green-800" }
    },
    additionalContentFunction: ".content"
  },
  
  
  defaultDimensions: {
    width: 200,
    height: 200
  },
  handles: {
    category: "view",
    definitions: [
      {
        position: "left",
        type: "target",
        dataFlow: "data",
        acceptsFrom: ["logic", "integration", "data"],
        icon: "arrow-right",
        edgeType: "package"
      },
      {
        position: "right",
        type: "source",
        dataFlow: "data",
        connectsTo: ["integration", "data"],
        icon: "arrow-right",
        edgeType: "package"
      }
    ]
  },
  
  process: {
    code: "// Example: Displays and renders data in various formats based on selected variant",
    templateCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('👁️ Content Node processing:', { incomingData, nodeData });
  
  try {
    const { displayType = 'text' } = nodeData;
    
    let result = incomingData;
    
    switch (displayType) {
      case 'text':
        // Format as text
        result = {
          ...result,
          displayFormat: 'text',
          content: Array.isArray(result?.data) 
            ? result.data.map(item => item.title || item.name || JSON.stringify(item)).join('\\n')
            : JSON.stringify(result?.data || result, null, 2)
        };
        break;
        
      case 'image':
        // Format for image display
        result = {
          ...result,
          displayFormat: 'image',
          images: Array.isArray(result?.data) 
            ? result.data.filter(item => item.url || item.image)
            : []
        };
        break;
        
      case 'video':
        // Format for video display
        result = {
          ...result,
          displayFormat: 'video',
          videos: Array.isArray(result?.data) 
            ? result.data.filter(item => item.videoUrl || item.video)
            : []
        };
        break;
        
      case 'chart':
        // Format for chart display
        result = {
          ...result,
          displayFormat: 'chart',
          chartData: Array.isArray(result?.data) 
            ? result.data.map(item => ({ 
                label: item.title || item.name, 
                value: item.id || 0 
              }))
            : []
        };
        break;
        
      default:
        // Default display
        result = {
          ...result,
          displayFormat: displayType,
          rendered: true,
          renderedAt: new Date().toISOString()
        };
    }
    
    console.log('✅ Content processing completed:', { displayType, resultLength: Array.isArray(result?.data) ? result.data.length : 1 });
    
    return result;
    
  } catch (error) {
    console.error('❌ Content processing failed:', error);
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
    expectedInput: "data to display",
    expectedOutput: "formatted display data",
    parameters: {
      maxItems: {
        type: "number",
        description: "Maximum number of items to display",
        required: false,
        default: 10,
        ui: { component: "number" }
      },
      enableFormatting: {
        type: "boolean",
        description: "Apply display formatting",
        required: false,
        default: true,
        ui: { component: "checkbox" }
      },
      showHeaders: {
        type: "boolean",
        description: "Show column headers in table view",
        required: false,
        default: true,
        ui: { component: "checkbox" }
      }
    }
  }
}; 