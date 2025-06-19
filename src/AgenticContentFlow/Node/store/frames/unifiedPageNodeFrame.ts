/** @format */

import { UnifiedFrameJSON } from '../../factory//types/UnifiedFrameJSON';

/**
 * Unified Page Node Frame
 * Represents web pages and content with standard appearance
 */
export const unifiedPageNodeFrame: UnifiedFrameJSON = {
  nodeType: "pagenode",
  defaultLabel: "Page",
  category: "page",
  group: "container",
  description: "Container for web pages and content with standard appearance",
  
  visual: {
    icon: { type: "builtin", value: "FileText" },
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
    category: "page",
    definitions: [
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
        dataFlow: "data",
        connectsTo: [],
        acceptsFrom: ["data"],
        icon: "arrow-right",
        edgeType: "package"
      },
      {
        position: "right",
        type: "source",
        dataFlow: "analytics",
        connectsTo: ["statistics"],
        acceptsFrom: [],
        icon: "arrow-right",
        edgeType: "default"
      }
    ]
  },
  
  process: {
    code: "// Example: Handles page content and structure management",
    templateCode: "async function process(incomingData, nodeData, params, targetMap, sourceMap) { /* TEMPLATE: Replace with instance-specific page processing code */ const { pageType } = nodeData; console.log('📄 Page processing:', { pageType, contentLength: incomingData?.content?.length || 0 }); // Placeholder for actual page processing return { data: incomingData, metadata: { pageType, processedAt: new Date().toISOString() } }; }",
    metadata: {
      generatedBy: "manual",
      version: "1.0.0",
      lastUpdated: "2025-06-15T10:30:00Z",
      executionContext: "frontend",
      signature: "async function process(incomingData, nodeData, params, targetMap, sourceMap)"
    },
    expectedInput: "page content and data",
    expectedOutput: "processed page data",
    parameters: {
      pageType: {
        type: "string",
        description: "Type of page content",
        required: false,
        default: "html",
        ui: { 
          component: "select",
          options: [
            { value: "html", label: "HTML" },
            { value: "markdown", label: "Markdown" },
            { value: "react", label: "React Component" },
            { value: "vue", label: "Vue Component" }
          ]
        }
      },
      htmlContent: {
        type: "string",
        description: "HTML content for the page",
        required: false,
        default: "",
        ui: { component: "textarea", placeholder: "Enter HTML content..." }
      },
      cssStyles: {
        type: "string",
        description: "CSS styles for the page",
        required: false,
        default: "",
        ui: { component: "textarea", placeholder: "Enter CSS styles..." }
      },
      jsScripts: {
        type: "string",
        description: "JavaScript scripts for the page",
        required: false,
        default: "",
        ui: { component: "textarea", placeholder: "Enter JavaScript code..." }
      }
    }
  }
}; 