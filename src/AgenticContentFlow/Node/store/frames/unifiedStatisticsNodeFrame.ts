/** @format */

import { UnifiedFrameJSON } from '../../factory//types/UnifiedFrameJSON';

/**
 * Unified Statistics Node Frame
 * Represents analytics and metrics visualization
 */
export const unifiedStatisticsNodeFrame: UnifiedFrameJSON = {
  nodeType: "statisticsnode",
  defaultLabel: "Statistics",
  category: "statistics",
  group: "container",
  description: "Container for analytics and metrics visualization",
  
  visual: {
    icon: { type: "builtin", value: "BarChart3" },
    style: {
      borderStyle: "solid",
      shadowStyle: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      customStyles: {}
    }
  },
  
  
  defaultDimensions: {
    width: 200,
    height: 200
  },
  
  handles: {
    category: "statistics",
    definitions: [
      {
        position: "left",
        type: "target",
        dataFlow: "analytics",
        connectsTo: [],
        acceptsFrom: ["page"],
        icon: "ArrowLeft",
        edgeType: "default"
      }
    ]
  },
  
  process: {
    code: "// Example: Handles analytics and metrics visualization",
    templateCode: "async function process(incomingData, nodeData, params, targetMap, sourceMap) { /* TEMPLATE: Replace with instance-specific statistics processing code */ const { chartType } = nodeData; console.log('📊 Statistics processing:', { chartType, dataPoints: incomingData?.data?.length || 0 }); // Placeholder for actual statistics processing return { data: incomingData, metadata: { chartType, processedAt: new Date().toISOString() } }; }",
    metadata: {
      generatedBy: "manual",
      version: "1.0.0",
      lastUpdated: "2025-06-15T10:30:00Z",
      executionContext: "frontend",
      signature: "async function process(incomingData, nodeData, params, targetMap, sourceMap)"
    },
    expectedInput: "analytics data",
    expectedOutput: "processed statistics data",
    parameters: {
      chartType: {
        type: "string",
        description: "Type of chart to display",
        required: false,
        default: "bar",
        ui: { 
          component: "select",
          options: [
            { value: "bar", label: "Bar Chart" },
            { value: "line", label: "Line Chart" },
            { value: "pie", label: "Pie Chart" },
            { value: "scatter", label: "Scatter Plot" }
          ]
        }
      },
      refreshInterval: {
        type: "number",
        description: "Data refresh interval in milliseconds",
        required: false,
        default: 60000,
        ui: { component: "number" }
      },
      enableExport: {
        type: "boolean",
        description: "Enable data export functionality",
        required: false,
        default: true,
        ui: { component: "checkbox" }
      }
    }
  }
}; 