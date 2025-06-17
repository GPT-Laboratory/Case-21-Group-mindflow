/** @format */

import { NodeFactoryJSON } from '../../cell/types';

/**
 * PageNode Configuration
 * Represents web pages and content with standard appearance
 */
export const pageNodeConfig: NodeFactoryJSON = {
  nodeType: "pagenode",
  defaultLabel: "Page",
  category: "view",
  group: "container",
  description: "Container for web pages and content with standard appearance",
  
  visual: {
    icon: { 
      type: "builtin", 
      value: "Globe",
      className: "stroke-slate"
    },
    headerIcon: { 
      type: "builtin", 
      value: "Globe", 
      className: "w-6 h-6" 
    },
    headerGradient: "bg-gradient-to-r from-green-50 to-green-100",
    selectedColor: "green"
  },
  
  handles: {
    category: "view",
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
        connectsTo: ["logic", "container", "view"],
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
        connectsTo: ["view"],
        acceptsFrom: [],
        icon: "arrow-right",
        edgeType: "default"
      }
    ]
  },
  
  process: {
    templateCode: "async function process(incomingData, nodeData, params, targetMap, sourceMap) { /* TEMPLATE: Container node - no process execution */ return incomingData; }",
    metadata: {
      generatedBy: "manual",
      version: "1.0.0",
      lastUpdated: "2025-06-15T10:30:00Z",
      executionContext: "frontend",
      signature: "async function process(incomingData, nodeData, params, targetMap, sourceMap)"
    },
    parameters: {
      pageType: {
        type: "string",
        description: "Type of page content",
        required: false,
        default: "html",
        ui: { component: "select", options: [
          { value: "html", label: "HTML Page" },
          { value: "markdown", label: "Markdown" },
          { value: "react", label: "React Component" }
        ]}
      },
      autoSave: {
        type: "boolean",
        description: "Automatically save changes",
        required: false,
        default: true,
        ui: { component: "checkbox" }
      }
    }
  },
  
  menu: {
    items: [
      { key: "edit", label: "Edit HTML", action: "configure" },
      { key: "preview", label: "Preview Page", action: "execute" }
    ]
  },
  
  template: {
    defaultData: {
      label: "Page",
      pageType: "html",
      expanded: false,
      isParent: true,
      nodeLevel: "basic",
      details: "Configure page content and structure",
      htmlContent: "",
      cssStyles: "",
      jsScripts: ""
    },
    defaultDimensions: { width: 300, height: 200 },
    defaultParameters: {
      pageType: "html",
      autoSave: true
    }
  }
};