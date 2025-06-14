/** @format */

import { ContainerNodeJSON } from '../types';

/**
 * DataNode Configuration
 * Represents data sources and repositories with file/folder appearance
 */
export const dataNodeConfig: ContainerNodeJSON = {
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
    depthColorScheme: "default",
    containerStyle: {
      borderStyle: "solid",
      shadowStyle: "5px -2px black",
      customStyles: { 
        marginTop: "1.25rem",
        borderRadius: "0.375rem",
        border: "2px solid black"
      }
    },
    expandedAppearance: {
      showIcon: "small",
      iconPosition: "header"
    },
    collapsedAppearance: {
      showIcon: "large",
      iconPosition: "center"
    }
  },
  
  behavior: {
    expandable: true,
    resizable: true,
    canContainChildren: true,
    defaultExpanded: false,
    autoExpandOnChildAdd: false,
    deleteOnEmpty: false
  },
  
  dimensions: {
    collapsed: { width: 300, height: 200 },
    expanded: { width: 300, height: 300 },
    minDimensions: { width: 200, height: 150 },
    maxDimensions: { width: 800, height: 600 }
  },
  
  handles: {
    category: "data",
    definitions: [
      {
        position: "right",
        type: "source",
        dataFlow: "data",
        connectsTo: ["pagenode", "logicnode", "contentnode"],
        acceptsFrom: [],
        icon: "arrow-right",
        edgeType: "package"
      },
      {
        position: "top",
        type: "target",
        dataFlow: "control",
        connectsTo: [],
        acceptsFrom: ["logicnode", "containernode"],
        icon: "arrow-down",
        edgeType: "default"
      },
      {
        position: "bottom",
        type: "source",
        dataFlow: "control",
        connectsTo: ["logicnode", "containernode", "pagenode"],
        acceptsFrom: [],
        icon: "arrow-down",
        edgeType: "default"
      },
      {
        position: "left",
        type: "target",
        dataFlow: "reference",
        connectsTo: [],
        acceptsFrom: ["datanode"],
        icon: "arrow-right",
        edgeType: "default"
      }
    ]
  },
  
  menu: {
    items: [
      { 
        key: "load", 
        label: "Load Data", 
        action: "load_data",
        requiresExpanded: false 
      },
      { 
        key: "open", 
        label: "Open File", 
        action: "open_file",
        requiresExpanded: false 
      },
      { 
        key: "download", 
        label: "Download", 
        action: "download",
        requiresExpanded: false 
      },
      { 
        key: "share", 
        label: "Share", 
        action: "share",
        requiresExpanded: false 
      }
    ],
    containerSpecificItems: [
      {
        key: "configure_source",
        label: "Configure Data Source",
        action: "configure",
        requiresExpanded: true
      }
    ]
  },
  
  content: {
    expandedContent: "dataContent",
    collapsedContent: undefined,
    customContentFunction: "generateDataNodeContent"
  },
  
  template: {
    defaultData: {
      label: "Data Source",
      dataFormat: "json",
      autoRefresh: false,
      expanded: false,
      isParent: true,
      nodeLevel: "basic",
      details: "Define data source configuration"
    },
    defaultParameters: {
      records: 0,
      lastUpdated: null,
      source: "unknown"
    }
  }
};