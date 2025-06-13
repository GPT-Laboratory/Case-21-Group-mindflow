import { NodeFactoryJSON } from "../types";

export const logicNodeConfig: NodeFactoryJSON = {
      "nodeType": "logicalnode",
      "defaultLabel": "Logic Processor",
      "category": "logic",
      "description": "Processes data with logical operations like filtering, transforming, aggregating, or conditional routing",
      "visual": {
        "icon": { "type": "builtin", "value": "Settings" },
        "headerIcon": { "type": "builtin", "value": "Settings", "className": "w-4 h-4 stroke-purple-700" },
        "headerGradient": "bg-gradient-to-r from-purple-50 to-purple-100",
        "selectedColor": "purple",
        "variants": {
          "fieldName": "operation",
          "options": {
            "filter": { "badgeText": "FILTER", "badgeColor": "bg-purple-100 text-purple-800" },
            "transform": { "badgeText": "TRANSFORM", "badgeColor": "bg-blue-100 text-blue-800" },
            "aggregate": { "badgeText": "AGGREGATE", "badgeColor": "bg-green-100 text-green-800" }
          },
          "default": { "badgeText": "LOGIC", "badgeColor": "bg-gray-100 text-gray-800" }
        },
        "additionalContentFunction": ".condition"
      },
      "handles": {
        "category": "logic",
        "definitions": [
          {
            "position": "left",
            "type": "target",
            "dataFlow": "data",
            "acceptsFrom": ["integration", "data"],
            "icon": "arrow-right",
            "edgeType": "package"
          },
          {
            "position": "right",
            "type": "source",
            "dataFlow": "data",
            "connectsTo": ["view", "logic"],
            "icon": "arrow-right",
            "edgeType": "package"
          }
        ]
      },
      "process": {
        "code": "async function process(incomingData, nodeData, params) { /* logic processing code */ return incomingData; }",
        "metadata": {
          "generatedBy": "manual",
          "version": "1.0.0",
          "lastUpdated": "2025-06-12T10:30:00Z",
          "executionContext": "frontend",
          "signature": "async function process(incomingData, nodeData, params)"
        },
        "parameters": {
          "enableLogging": {
            "type": "boolean",
            "description": "Enable detailed logging",
            "required": false,
            "default": true,
            "ui": { "component": "checkbox" }
          }
        }
      },
      "menu": {
        "items": [
          { "key": "test", "label": "Test Logic", "action": "execute" }
        ]
      },
      "template": {
        "defaultData": { "operation": "filter", "condition": "" },
        "defaultDimensions": { "width": 200, "height": 200 },
        "defaultParameters": { "enableLogging": true }
      }
    };