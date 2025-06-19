/** @format */

import { UnifiedFrameJSON } from '../../factory//types/UnifiedFrameJSON';

/**
 * Unified REST Node Frame
 * Represents REST API integration nodes with configurable HTTP methods
 */
export const unifiedRestNodeFrame: UnifiedFrameJSON = {
  nodeType: "restnode",
  defaultLabel: "REST API",
  category: "integration",
  group: "cell",
  description: "Fetches data from REST API endpoints with configurable HTTP methods and authentication",
  
  visual: {
    icon: { type: "builtin", value: "Globe2" },
    headerGradient: "bg-gradient-to-r from-blue-50 to-blue-100",
    selectedColor: "blue",
    variants: {
      fieldName: "method",
      options: {
        "GET": { badgeText: "GET", badgeColor: "bg-green-100 text-green-800" },
        "POST": { badgeText: "POST", badgeColor: "bg-blue-100 text-blue-800" },
        "PUT": { badgeText: "PUT", badgeColor: "bg-orange-100 text-orange-800" },
        "DELETE": { badgeText: "DEL", badgeColor: "bg-red-100 text-red-800" }
      },
      default: { badgeText: "API", badgeColor: "bg-blue-100 text-blue-800" }
    },
    additionalContentFunction: ".url"
  },
  
  defaultDimensions: {
    width: 200,
    height: 200
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
  
  process: {
    code: "// Example REST API call with configurable method and authentication",
    templateCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🌐 REST Node processing:', { incomingData, nodeData });
  
  try {
    const { url, method = 'GET', headers = {} } = nodeData;
    
    if (!url) {
      throw new Error('URL is required for REST API call');
    }
    
    console.log('🌐 Making REST API call:', { method, url, headers });
    
    // Prepare request options
    const options = {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    // Add body for non-GET requests
    if (method !== 'GET' && nodeData.body) {
      options.body = JSON.stringify(nodeData.body);
    }
    
    // Make API request
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ': ' + response.statusText);
    }
    
    const data = await response.json();
    
    console.log('✅ REST API call completed:', { status: response.status, dataLength: Array.isArray(data) ? data.length : 1 });
    
    return {
      data,
      metadata: {
        status: response.status,
        headers: Object.fromEntries(response.headers),
        timestamp: new Date().toISOString(),
        url,
        method
      }
    };
    
  } catch (error) {
    console.error('❌ REST API call failed:', error);
    throw error;
  }
}`,
    metadata: {
      generatedBy: "manual",
      version: "1.0.0",
      lastUpdated: "2025-06-15T10:30:00Z",
      executionContext: "frontend",
      signature: "async function process(incomingData, nodeData, params, targetMap, sourceMap)"
    },
    expectedInput: "trigger signal or data to send",
    expectedOutput: "api response data",
    parameters: {
      url: {
        type: "string",
        description: "API endpoint URL",
        required: true,
        default: "",
        ui: { component: "input", placeholder: "https://api.example.com/data" }
      },
      headers: {
        type: "object",
        description: "Request headers",
        required: false,
        default: { "Content-Type": "application/json" },
        ui: { component: "textarea" }
      },
      authentication: {
        type: "string",
        description: "Authentication type",
        required: false,
        default: "none",
        ui: { 
          component: "select",
          options: [
            { value: "none", label: "None" },
            { value: "basic", label: "Basic Auth" },
            { value: "bearer", label: "Bearer Token" },
            { value: "api_key", label: "API Key" }
          ]
        }
      },
      timeout: {
        type: "number",
        description: "Request timeout in seconds",
        required: false,
        default: 30,
        ui: { component: "number" }
      },
      includeResponseHeaders: {
        type: "boolean",
        description: "Include response headers in output",
        required: false,
        default: true,
        ui: { component: "checkbox" }
      }
    }
  }
}; 