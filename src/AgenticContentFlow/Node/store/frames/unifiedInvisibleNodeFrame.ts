/** @format */

import { UnifiedFrameJSON } from '../../factory//types/UnifiedFrameJSON';

/**
 * Unified Invisible Node Frame
 * Invisible container that becomes transparent when expanded
 */
export const unifiedInvisibleNodeFrame: UnifiedFrameJSON = {
  nodeType: "invisiblenode",
  defaultLabel: "Container",
  category: "container",
  group: "container",
  description: "Invisible container that becomes transparent when expanded",
  
  visual: {
    icon: { type: "builtin", value: "Minus" },
    style: {
      borderStyle: "dashed",
      shadowStyle: "none",
      customStyles: {
        backgroundColor: "transparent",
        border: "2px dashed #c4b5fd",
      }
    }
  },
  
  defaultDimensions: {
    width: 200,
    height: 200
  },
  
  handles: {
    category: "container",
    definitions: []
  },
  
  process: {
    code: "// Example: Handles invisible container behavior and layout management",
    templateCode: "async function process(incomingData, nodeData, params, targetMap, sourceMap) { /* TEMPLATE: Replace with instance-specific container processing code */ const { layoutDirection } = nodeData; console.log('👻 Invisible container processing:', { layoutDirection, childCount: incomingData?.children?.length || 0 }); // Placeholder for actual container processing return { data: incomingData, metadata: { layoutDirection, processedAt: new Date().toISOString() } }; }",
    metadata: {
      generatedBy: "manual",
      version: "1.0.0",
      lastUpdated: "2025-06-15T10:30:00Z",
      executionContext: "frontend",
      signature: "async function process(incomingData, nodeData, params, targetMap, sourceMap)"
    },
    expectedInput: "container content and layout data",
    expectedOutput: "processed container data",
    parameters: {
      layoutDirection: {
        type: "string",
        description: "Layout direction for child nodes",
        required: false,
        default: "LR",
        ui: { 
          component: "select",
          options: [
            { value: "LR", label: "Left to Right" },
            { value: "TB", label: "Top to Bottom" },
            { value: "RL", label: "Right to Left" },
            { value: "BT", label: "Bottom to Top" }
          ]
        }
      },
    }
  }
}; 