import { NodeFactoryJSON } from "../types";

export const restNodeConfig: NodeFactoryJSON = {
      nodeType: "restnode",
      defaultLabel: "REST API",
      category: "integration",
      description: "Fetches data from REST API endpoints with configurable HTTP methods and authentication",
      visual: {
        icon: { "type": "component", "value": "DomainIcon" },
        "headerIcon": { "type": "builtin", "value": "Globe2", "className": "w-6 h-6" },
        "headerGradient": "bg-gradient-to-r from-blue-50 to-blue-200",
        "selectedColor": "blue",
        "variants": {
          "fieldName": "method",
          "options": {
            "GET": { "badgeText": "GET", "badgeColor": "bg-green-100 text-green-800" },
            "POST": { "badgeText": "POST", "badgeColor": "bg-blue-100 text-blue-800" },
            "PUT": { "badgeText": "PUT", "badgeColor": "bg-yellow-100 text-yellow-800" },
            "DELETE": { "badgeText": "DELETE", "badgeColor": "bg-red-100 text-red-800" }
          },
          "default": { "badgeText": "API", "badgeColor": "bg-gray-100 text-gray-800" }
        },
        "additionalContentFunction": ".url"
      },
      handles: {
        category: "integration",
        definitions: [
          {
            position: 'right',
            type: 'source',
            dataFlow: 'data',
            connectsTo: ['logic', 'view'],
            icon: 'arrow-right',
            edgeType: 'package'
          },
          {
            position: 'left',
            type: 'target',
            dataFlow: 'control',
            acceptsFrom: ['data', 'logic'],
            icon: 'arrow-right',
            edgeType: 'default'
          }
        ]
      },
      "process": {
        "code": `async function process(incomingData, nodeData, params) {
  const { url, method, headers } = nodeData;
        
  if (!url) {
    throw new Error('URL is required');
  }

  const response = await fetch(url, {
    method: method || 'GET',
    headers: {
      'Accept': 'application/json',
      ...headers
    },
    body: method !== 'GET' && nodeData.body ? JSON.stringify(nodeData.body) : undefined,
  });
        
  if (!response.ok) {
    throw new Error('HTTP ' + response.status + ': ' + response.statusText);
  }
        
  const data = await response.json();
  
  return {
    data,
    metadata: {
      status: response.status,
      headers: Object.fromEntries(response.headers),
      timestamp: new Date().toISOString()
    }
  };
}`,
        "metadata": {
          "generatedBy": "manual",
          "version": "1.0.0",
          "lastUpdated": "2025-06-12T10:30:00Z",
          "executionContext": "frontend",
          "signature": "async function process(incomingData, nodeData, params)"
        },
        "expectedInput": "trigger signal or data to send",
        "expectedOutput": "api response data",
        "parameters": {
          "includeResponseHeaders": {
            "type": "boolean",
            "description": "Include response headers in output",
            "required": false,
            "default": true,
            "ui": { "component": "checkbox" }
          }
        },
        "constraints": {
          "timeout": 30000,
          "maxRetries": 10,
          "requiresAuth": false
        }
      },
      "menu": {
        "items": [
          { "key": "test", "label": "Test Connection", "action": "execute" },
          { "key": "configure", "label": "Configure API", "action": "configure" },
          { "key": "debug", "label": "View Code", "action": "debug" },
          { "key": "analyze", "label": "Analyze Performance", "action": "analyze" }
        ]
      },
      "template": {
        "defaultData": {
          "method": "GET",
          "url": "",
          "headers": { "Content-Type": "application/json" },
          "authentication": "none",
          "timeout": 30
        },
        "defaultDimensions": { "width": 200, "height": 200 },
        "defaultParameters": {
          "retryAttempts": 3,
          "retryDelay": 1000,
          "includeResponseHeaders": true
        }
      }
    };