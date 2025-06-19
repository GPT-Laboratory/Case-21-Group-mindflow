/** @format */

import { UnifiedFrameJSON } from '../../factory//types/UnifiedFrameJSON';

/**
 * Unified Data Node Frame
 * Represents data sources and repositories with file/folder appearance
 */
export const unifiedDataNodeFrame: UnifiedFrameJSON = {
  nodeType: "datanode",
  defaultLabel: "Data Source",
  category: "data",
  group: "container",
  description: "Container for a flow that in turn is made of cells and containers that will provide data to this data node",
  
  visual: {
    icon: { type: "builtin", value: "Database" },
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
    category: "data",
    definitions: [
      {
        position: "right",
        type: "source",
        dataFlow: "data",
        connectsTo: ["page", "logic", "view"],
        acceptsFrom: [],
        icon: "arrow-right",
        edgeType: "package"
      },
      {
        position: "top",
        type: "target",
        dataFlow: "control",
        connectsTo: [],
        acceptsFrom: ["logic", "container"],
        icon: "arrow-down",
        edgeType: "default"
      },
      {
        position: "bottom",
        type: "source",
        dataFlow: "control",
        connectsTo: ["logic", "container", "page"],
        acceptsFrom: [],
        icon: "arrow-down",
        edgeType: "default"
      },
      {
        position: "left",
        type: "target",
        dataFlow: "reference",
        connectsTo: [],
        acceptsFrom: ["data"],
        icon: "arrow-right",
        edgeType: "default"
      }
    ]
  },
  
  process: {
    code: "// Example: Starts the flow inside this data node and then produces its output",
    templateCode: "async function process(incomingData, nodeData, params, targetMap, sourceMap) { /* TEMPLATE: Replace with instance-specific data processing code */ const { dataSource, format } = nodeData; console.log('📊 Data processing:', { dataSource, format }); // Placeholder for actual data processing logic return { data: incomingData, metadata: { processedAt: new Date().toISOString() } }; }",
    metadata: {
      generatedBy: "manual",
      version: "1.0.0",
      lastUpdated: "2025-06-15T10:30:00Z",
      executionContext: "frontend",
      signature: "async function process(incomingData, nodeData, params, targetMap, sourceMap)"
    },
    expectedInput: "trigger signal or data to process",
    expectedOutput: "processed data",
    parameters: {
      dataFormat: {
        type: "string",
        description: "Data format for the source",
        required: false,
        default: "json",
        ui: { 
          component: "select",
          options: [
            { value: "json", label: "JSON" },
            { value: "csv", label: "CSV" },
            { value: "xml", label: "XML" },
            { value: "yaml", label: "YAML" }
          ]
        }
      },
      autoRefresh: {
        type: "boolean",
        description: "Enable automatic data refresh",
        required: false,
        default: false,
        ui: { component: "checkbox" }
      },
      validateData: {
        type: "boolean",
        description: "Enable data validation",
        required: false,
        default: true,
        ui: { component: "checkbox" }
      }
    }
  }
}; 