/** @format */

import { NodeFactoryJSON } from './types';

/**
 * Configuration loader for JSON-driven node factory
 */
export class NodeConfigurationLoader {
  private configurations: Map<string, NodeFactoryJSON> = new Map();
  
  /**
   * Load a configuration from JSON
   */
  async loadConfiguration(nodeType: string, config: NodeFactoryJSON): Promise<void> {
    // Validate the configuration
    this.validateConfiguration(config);
    
    // Store the configuration
    this.configurations.set(nodeType, config);
  }
  
  /**
   * Load configuration from a JSON file (for future use)
   */
  async loadConfigurationFromFile(filePath: string): Promise<NodeFactoryJSON> {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load configuration: ${response.statusText}`);
      }
      
      const config = await response.json() as NodeFactoryJSON;
      this.validateConfiguration(config);
      this.configurations.set(config.nodeType, config);
      
      return config;
    } catch (error) {
      throw new Error(`Failed to load configuration from ${filePath}: ${error}`);
    }
  }
  
  /**
   * Get a configuration by node type
   */
  getConfiguration(nodeType: string): NodeFactoryJSON | undefined {
    return this.configurations.get(nodeType);
  }
  
  /**
   * Get all loaded configurations
   */
  getAllConfigurations(): Map<string, NodeFactoryJSON> {
    return new Map(this.configurations);
  }
  
  /**
   * Check if a configuration exists for a node type
   */
  hasConfiguration(nodeType: string): boolean {
    return this.configurations.has(nodeType);
  }
  
  /**
   * Load all built-in configurations
   */
  async loadBuiltInConfigurations(): Promise<void> {
    // Load the three main configurations
    const configs = [
      await this.loadRestNodeConfig(),
      await this.loadLogicalNodeConfig(),
      await this.loadContentNodeConfig()
    ];
    
    configs.forEach(config => {
      this.configurations.set(config.nodeType, config);
    });
  }
  
  /**
   * Validate a configuration object
   */
  private validateConfiguration(config: NodeFactoryJSON): void {
    const errors: string[] = [];
    
    // Required fields
    if (!config.nodeType) errors.push('nodeType is required');
    if (!config.defaultLabel) errors.push('defaultLabel is required');
    if (!config.category) errors.push('category is required');
    if (!config.description) errors.push('description is required');
    
    // Visual configuration
    if (!config.visual) {
      errors.push('visual configuration is required');
    } else {
      if (!config.visual.icon) errors.push('visual.icon is required');
      if (!config.visual.headerIcon) errors.push('visual.headerIcon is required');
      if (!config.visual.headerGradient) errors.push('visual.headerGradient is required');
      if (!config.visual.selectedColor) errors.push('visual.selectedColor is required');
    }
    
    // Process configuration
    if (!config.process) {
      errors.push('process configuration is required');
    } else {
      if (!config.process.code) errors.push('process.code is required');
      if (!config.process.metadata) errors.push('process.metadata is required');
      if (!config.process.parameters) errors.push('process.parameters is required');
    }
    
    // Menu configuration
    if (!config.menu || !config.menu.items || !Array.isArray(config.menu.items)) {
      errors.push('menu.items array is required');
    }
    
    // Template configuration
    if (!config.template) {
      errors.push('template configuration is required');
    } else {
      if (!config.template.defaultData) errors.push('template.defaultData is required');
      if (!config.template.defaultDimensions) errors.push('template.defaultDimensions is required');
      if (!config.template.defaultParameters) errors.push('template.defaultParameters is required');
    }
    
    if (errors.length > 0) {
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }
  }
  
  /**
   * Load REST node configuration
   */
  private async loadRestNodeConfig(): Promise<NodeFactoryJSON> {
    return {
      "nodeType": "restnode",
      "defaultLabel": "REST API",
      "category": "integration",
      "description": "Fetches data from REST API endpoints with configurable HTTP methods and authentication",
      "visual": {
        "icon": { "type": "component", "value": "DomainIcon" },
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
      "process": {
        "code": `async function process(incomingData, nodeData, params) {
  console.log('🚀 REST process function started with:', { nodeData, params });
  
  try {
    const { url, method, headers, timeout } = nodeData;
    const { retryAttempts = 3, retryDelay = 1000 } = params;
    
    console.log('📋 Extracted variables:', { url, method, headers, timeout, retryAttempts, retryDelay });
    
    if (!url) {
      console.error('❌ URL is missing!');
      throw new Error('URL is required');
    }
    
    console.log('✅ URL validation passed, starting fetch attempts...');
    let lastError;
    
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        console.log('🔄 Attempt ' + attempt + ' of ' + retryAttempts + ' for URL: ' + url);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('⏰ Request timeout triggered');
          controller.abort();
        }, timeout || 30000);
        
        console.log('🌐 Making fetch request...');
        const response = await fetch(url, {
          method: method || 'GET',
          headers: {
            'Accept': 'application/json',
            ...headers
          },
          body: method !== 'GET' && nodeData.body ? JSON.stringify(nodeData.body) : undefined,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('📡 Fetch response received:', { status: response.status, ok: response.ok });
        
        if (!response.ok) {
          const errorMsg = 'HTTP ' + response.status + ': ' + response.statusText;
          console.error('❌ HTTP error:', errorMsg);
          throw new Error(errorMsg);
        }
        
        console.log('📥 Parsing JSON response...');
        const data = await response.json();
        console.log('✅ JSON parsed successfully, data length:', Array.isArray(data) ? data.length : 'not an array');
        
        const result = {
          success: true,
          data,
          metadata: {
            status: response.status,
            headers: Object.fromEntries(response.headers),
            timestamp: new Date().toISOString(),
            attempt
          }
        };
        
        console.log('🎯 Returning successful result:', result);
        return result;
      } catch (error) {
        console.error('💥 Attempt ' + attempt + ' failed:', error.message);
        lastError = error;
        if (attempt < retryAttempts) {
          console.log('⏳ Retrying in ' + retryDelay + 'ms...');
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    console.error('😞 All retry attempts failed, throwing last error');
    throw lastError;
  } catch (error) {
    console.error('🔥 Process function caught error:', error.message);
    const errorResult = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
    console.log('❌ Returning error result:', errorResult);
    return errorResult;
  }
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
          "retryAttempts": {
            "type": "number",
            "description": "Number of retry attempts on failure",
            "required": false,
            "default": 3,
            "validation": { "min": 1, "max": 10 },
            "ui": { "component": "number", "placeholder": "3" }
          },
          "retryDelay": {
            "type": "number",
            "description": "Delay between retries in milliseconds",
            "required": false,
            "default": 1000,
            "validation": { "min": 100, "max": 10000 },
            "ui": { "component": "number", "placeholder": "1000" }
          },
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
  }
  
  /**
   * Load logical node configuration
   */
  private async loadLogicalNodeConfig(): Promise<NodeFactoryJSON> {
    // Return the logical node configuration (shortened for brevity)
    return {
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
  }
  
  /**
   * Load content node configuration
   */
  private async loadContentNodeConfig(): Promise<NodeFactoryJSON> {
    // Return the content node configuration (shortened for brevity)
    return {
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
  }
}