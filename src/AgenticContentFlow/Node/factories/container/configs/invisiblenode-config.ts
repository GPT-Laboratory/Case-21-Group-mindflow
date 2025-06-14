/** @format */

import { ContainerNodeJSON } from '../types';

/**
 * InvisibleNode Configuration
 * Invisible container that becomes transparent when expanded
 */
export const invisibleNodeConfig: ContainerNodeJSON = {
  nodeType: "invisiblenode",
  defaultLabel: "Container",
  category: "container",
  group: "container",
  description: "Invisible container that becomes transparent when expanded",
  
  visual: {
    icon: { 
      type: "builtin", 
      value: "Grid3x3",
      className: "stroke-slate"
    },
    headerIcon: { 
      type: "builtin", 
      value: "Grid3x3", 
      className: "w-6 h-6" 
    },
    depthColorScheme: "purple",
    containerStyle: {
      borderStyle: "dashed",
      shadowStyle: "none",
      customStyles: { 
        borderRadius: "0.375rem",
        border: "2px dashed #c4b5fd",
        backgroundColor: "transparent"
      }
    },
    expandedAppearance: {
      showIcon: "none",
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
    defaultExpanded: true,
    autoExpandOnChildAdd: true,
    deleteOnEmpty: true
  },
  
  dimensions: {
    collapsed: { width: 300, height: 200 },
    expanded: { width: 300, height: 200 },
    minDimensions: { width: 200, height: 150 },
    maxDimensions: { width: 1000, height: 800 }
  },
  
  handles: {
    category: "container",
    definitions: [
    ]
  },
  
  menu: {
    items: [
      { 
        key: "toggle", 
        label: "Toggle Container Visibility", 
        action: "toggle_visibility",
        requiresExpanded: false 
      }
    ],
    containerSpecificItems: [
      {
        key: "layout_direction",
        label: "Change Layout Direction",
        action: "change_layout",
        requiresExpanded: true
      }
    ]
  },
  
  content: {
    expandedContent: "containerContent",
    collapsedContent: undefined,
    customContentFunction: "generateContainerNodeContent"
  },
  
  template: {
    defaultData: {
      label: "Container",
      layoutDirection: "LR",
      isContainer: true,
      expanded: true,
      isParent: true,
      nodeLevel: "basic",
      details: "Container for organizing content",
      deleteOnEmpty: true
    },
    defaultParameters: {
      childNodes: [],
      layoutSettings: {
        direction: "LR",
        spacing: 50
      }
    }
  }
};