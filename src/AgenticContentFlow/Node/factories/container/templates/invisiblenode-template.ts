/** @format */

import { NodeFactoryJSON } from '../../cell/types';

/**
 * InvisibleNode Configuration
 * Invisible container that becomes transparent when expanded
 */
export const invisibleNodeConfig: NodeFactoryJSON = {
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
    headerGradient: "bg-gradient-to-r from-purple-50 to-purple-100",
    selectedColor: "purple"
  },
  
  handles: {
    category: "container",
    definitions: []
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
      layoutDirection: {
        type: "string",
        description: "Layout direction for child nodes",
        required: false,
        default: "LR",
        ui: { component: "select", options: [
          { value: "LR", label: "Left to Right" },
          { value: "TB", label: "Top to Bottom" },
          { value: "RL", label: "Right to Left" },
          { value: "BT", label: "Bottom to Top" }
        ]}
      },
      spacing: {
        type: "number",
        description: "Spacing between child nodes",
        required: false,
        default: 50,
        ui: { component: "number" }
      },
      deleteOnEmpty: {
        type: "boolean",
        description: "Delete container when empty",
        required: false,
        default: true,
        ui: { component: "checkbox" }
      }
    }
  },
  
  menu: {
    items: [
      { key: "toggle", label: "Toggle Container Visibility", action: "execute" },
      { key: "layout", label: "Change Layout Direction", action: "configure" }
    ]
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
      deleteOnEmpty: true,
      spacing: 50
    },
    defaultDimensions: { width: 300, height: 200 },
    defaultParameters: {
      layoutDirection: "LR",
      spacing: 50,
      deleteOnEmpty: true
    }
  }
};