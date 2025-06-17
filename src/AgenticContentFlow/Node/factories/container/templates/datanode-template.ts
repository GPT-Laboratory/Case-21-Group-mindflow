/** @format */

import { NodeFactoryJSON } from '../../cell/types';

/**
 * DataNode Configuration
 * Represents data sources and repositories with file/folder appearance
 */
export const dataNodeConfig: NodeFactoryJSON = {
  nodeType: "datanode",
  defaultLabel: "Data Source",
  category: "data",
  group: "container",
  description: "Container for data sources and repositories with file/folder appearance",
  
  visual: {
    icon: { 
      type: "component", 
      value: "CircleStackIcon",
      className: "stroke-slate transition-all"
    },
    headerIcon: { 
      type: "component", 
      value: "CircleStackIcon", 
      className: "w-6 h-6" 
    },
    headerGradient: "bg-gradient-to-r from-blue-50 to-blue-100",
    selectedColor: "blue"
  },
  
  handles: {
    category: "data",
    definitions: [
      {
        position: "right",
        type: "source",
        dataFlow: "data",
        connectsTo: ["view", "logic", "integration"],
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
        connectsTo: ["logic", "container", "view"],
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
    templateCode: "async function process(incomingData, nodeData, params, targetMap, sourceMap) { /* TEMPLATE: Container node - no process execution */ return incomingData; }",
    metadata: {
      generatedBy: "manual",
      version: "1.0.0",
      lastUpdated: "2025-06-15T10:30:00Z",
      executionContext: "frontend",
      signature: "async function process(incomingData, nodeData, params, targetMap, sourceMap)"
    },
    parameters: {
      dataFormat: {
        type: "string",
        description: "Format of the data source",
        required: false,
        default: "json",
        ui: { component: "select", options: [
          { value: "json", label: "JSON" },
          { value: "csv", label: "CSV" },
          { value: "xml", label: "XML" },
          { value: "database", label: "Database" }
        ]}
      },
      autoRefresh: {
        type: "boolean",
        description: "Automatically refresh data",
        required: false,
        default: false,
        ui: { component: "checkbox" }
      },
      refreshInterval: {
        type: "number",
        description: "Refresh interval in seconds",
        required: false,
        default: 300,
        ui: { component: "number" }
      }
    }
  },
  
  menu: {
    items: [
      { key: "load", label: "Load Data", action: "execute" },
      { key: "configure", label: "Configure Data Source", action: "configure" },
      { key: "download", label: "Download", action: "execute" },
      { key: "share", label: "Share", action: "execute" }
    ]
  },
  
  template: {
    defaultData: {
      label: "Data Source",
      dataFormat: "json",
      autoRefresh: false,
      expanded: false,
      isParent: true,
      nodeLevel: "basic",
      details: "Define data source configuration",
      records: 0,
      lastUpdated: null,
      source: "unknown"
    },
    defaultDimensions: { width: 300, height: 200 },
    defaultParameters: {
      dataFormat: "json",
      autoRefresh: false,
      refreshInterval: 300
    }
  }
};