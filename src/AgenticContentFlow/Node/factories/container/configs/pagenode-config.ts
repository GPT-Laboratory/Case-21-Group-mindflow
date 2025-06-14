/** @format */

import { ContainerNodeJSON } from '../types';

/**
 * PageNode Configuration
 * Represents web pages and content with standard appearance
 */
export const pageNodeConfig: ContainerNodeJSON = {
  nodeType: "pagenode",
  defaultLabel: "Page",
  category: "page",
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
    selectedColor: "green",
    depthColorScheme: "default",
    containerStyle: {
      borderStyle: "solid",
      shadowStyle: "5px -2px black",
      customStyles: { 
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
    category: "page",
    definitions: [
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
        dataFlow: "data",
        connectsTo: [],
        acceptsFrom: ["datanode"],
        icon: "arrow-right",
        edgeType: "package"
      },
      {
        position: "right",
        type: "source",
        dataFlow: "analytics",
        connectsTo: ["statisticsnode"],
        acceptsFrom: [],
        icon: "arrow-right",
        edgeType: "default"
      }
    ]
  },
  
  menu: {
    items: [
      { 
        key: "edit", 
        label: "Edit HTML", 
        action: "edit_content",
        requiresExpanded: false 
      },
      { 
        key: "preview", 
        label: "Preview Page", 
        action: "preview",
        requiresExpanded: false 
      }
    ],
    containerSpecificItems: [
      {
        key: "configure_page",
        label: "Configure Page Settings",
        action: "configure",
        requiresExpanded: true
      }
    ]
  },
  
  content: {
    expandedContent: "pageContent",
    collapsedContent: undefined,
    customContentFunction: "generatePageNodeContent"
  },
  
  template: {
    defaultData: {
      label: "Page",
      pageType: "html",
      expanded: false,
      isParent: true,
      nodeLevel: "basic",
      details: "Configure page content and structure"
    },
    defaultParameters: {
      htmlContent: "",
      cssStyles: "",
      jsScripts: ""
    }
  }
};