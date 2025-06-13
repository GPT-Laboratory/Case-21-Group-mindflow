import { NodeFactoryJSON } from "../types";

export const contentNodeConfig: NodeFactoryJSON = {
    "nodeType": "contentnode",
    "defaultLabel": "Content Display",
    "category": "view",
    "description": "Displays and renders data in various formats",
    "visual": {
      "icon": { "type": "builtin", "value": "Eye" },
      "headerIcon": { "type": "builtin", "value": "Eye", "className": "w-4 h-4 stroke-blue-700" },
      "headerGradient": "bg-gradient-to-r from-blue-50 to-blue-100",
      "selectedColor": "blue",
      "variants": {
        "fieldName": "displayType",
        "options": {
          "list": { "badgeText": "LIST", "badgeColor": "bg-blue-100 text-blue-800" },
          "table": { "badgeText": "TABLE", "badgeColor": "bg-green-100 text-green-800" }
        },
        "default": { "badgeText": "VIEW", "badgeColor": "bg-gray-100 text-gray-800" }
      }
    },
    "handles": {
      "category": "view",
      "definitions": [
        {
          "position": "left",
          "type": "target",
          "dataFlow": "data",
          "acceptsFrom": ["logic", "integration", "data"],
          "icon": "arrow-right",
          "edgeType": "package"
        },
        {
          "position": "right",
          "type": "source",
          "dataFlow": "data",
          "connectsTo": ["integration", "data"],
          "icon": "arrow-right",
          "edgeType": "package"
        }
      ]
    },
    "process": {
      "code": "async function process(incomingData, nodeData, params) { /* display formatting code */ return incomingData; }",
      "metadata": {
        "generatedBy": "manual",
        "version": "1.0.0",
        "lastUpdated": "2025-06-12T10:30:00Z",
        "executionContext": "frontend",
        "signature": "async function process(incomingData, nodeData, params)"
      },
      "parameters": {
        "enableFormatting": {
          "type": "boolean",
          "description": "Apply display formatting",
          "required": false,
          "default": true,
          "ui": { "component": "checkbox" }
        }
      }
    },
    "menu": {
      "items": [
        { "key": "preview", "label": "Preview Display", "action": "execute" }
      ]
    },
    "template": {
      "defaultData": { "displayType": "list", "maxItems": 10 },
      "defaultDimensions": { "width": 300, "height": 200 },
      "defaultParameters": { "enableFormatting": true }
    }
  };