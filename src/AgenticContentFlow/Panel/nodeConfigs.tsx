import { NodeConfig } from './types';
import { 
  Database, 
  Globe, 
  FileText, 
  Workflow,
  Settings
} from 'lucide-react';

// Mock configurations - in a real app, these would be loaded from the actual config files
export const mockConfigurations: Record<string, NodeConfig> = {
  restnode: {
    nodeType: 'restnode',
    metadata: {
      title: 'REST API Node',
      description: 'Specialized node for making HTTP requests to REST APIs',
      icon: 'globe',
      category: 'integration'
    },
    configFields: {
      label: {
        fieldType: 'text',
        label: 'Node Label',
        defaultValue: 'REST API',
        required: true
      },
      method: {
        fieldType: 'select',
        label: 'HTTP Method',
        defaultValue: 'GET',
        required: true,
        options: [
          { value: 'GET', label: 'GET' },
          { value: 'POST', label: 'POST' },
          { value: 'PUT', label: 'PUT' },
          { value: 'DELETE', label: 'DELETE' },
          { value: 'PATCH', label: 'PATCH' },
          { value: 'HEAD', label: 'HEAD' },
          { value: 'OPTIONS', label: 'OPTIONS' }
        ]
      },
      url: {
        fieldType: 'text',
        label: 'API Endpoint',
        required: true,
        placeholder: 'https://api.example.com/endpoint'
      },
      headers: {
        fieldType: 'textarea',
        label: 'Request Headers',
        placeholder: '{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer token"\n}',
        description: 'JSON object containing request headers'
      },
      timeout: {
        fieldType: 'number',
        label: 'Timeout (seconds)',
        defaultValue: 30,
        validation: { min: 1, max: 300 }
      }
    },
    variants: {
      POST: {
        body: {
          fieldType: 'textarea',
          label: 'Request Body',
          placeholder: '{\n  "key": "value"\n}',
          description: 'JSON payload for request'
        }
      },
      PUT: {
        body: {
          fieldType: 'textarea',
          label: 'Request Body',
          placeholder: '{\n  "key": "value"\n}',
          description: 'JSON payload for request'
        }
      },
      PATCH: {
        body: {
          fieldType: 'textarea',
          label: 'Request Body',
          placeholder: '{\n  "key": "value"\n}',
          description: 'JSON payload for request'
        }
      }
    }
  },
  logicalnode: {
    nodeType: 'logicalnode',
    metadata: {
      title: 'Logical Node',
      description: 'Process data with logical operations like filtering, transforming, and conditional routing',
      icon: 'settings',
      category: 'logic'
    },
    configFields: {
      label: {
        fieldType: 'text',
        label: 'Node Label',
        defaultValue: 'Logic Processor',
        required: true
      },
      operation: {
        fieldType: 'select',
        label: 'Operation Type',
        defaultValue: 'filter',
        required: true,
        options: [
          { value: 'filter', label: 'Filter Data' },
          { value: 'transform', label: 'Transform Data' },
          { value: 'aggregate', label: 'Aggregate Data' },
          { value: 'conditional', label: 'Conditional Routing' },
          { value: 'validate', label: 'Validate Data' }
        ]
      },
      inputSchema: {
        fieldType: 'textarea',
        label: 'Input Schema',
        placeholder: '{\n  "type": "object",\n  "properties": {\n    "data": {"type": "array"}\n  }\n}',
        description: 'JSON schema for expected input data'
      },
      outputSchema: {
        fieldType: 'textarea',
        label: 'Output Schema',
        placeholder: '{\n  "type": "object",\n  "properties": {\n    "filtered": {"type": "array"}\n  }\n}',
        description: 'JSON schema for output data structure'
      }
    },
    variants: {
      filter: {
        filterExpression: {
          fieldType: 'text',
          label: 'Filter Expression',
          placeholder: 'e.g., item.status === "active"',
          description: 'JavaScript expression for filtering'
        }
      },
      transform: {
        transformMapping: {
          fieldType: 'textarea',
          label: 'Transform Mapping',
          placeholder: '{\n  "newField": "oldField",\n  "computed": "field1 + field2"\n}',
          description: 'Define how to transform data fields'
        }
      },
      conditional: {
        truePath: {
          fieldType: 'text',
          label: 'True Path Action',
          placeholder: 'Action when condition is true'
        },
        falsePath: {
          fieldType: 'text',
          label: 'False Path Action',
          placeholder: 'Action when condition is false'
        }
      }
    }
  },
  datanode: {
    nodeType: 'datanode',
    metadata: {
      title: 'Data Node',
      description: 'Node for handling and storing data',
      icon: 'database',
      category: 'data'
    },
    configFields: {
      label: {
        fieldType: 'text',
        label: 'Node Label',
        defaultValue: 'Data Node',
        required: true
      },
      dataFormat: {
        fieldType: 'select',
        label: 'Data Format',
        defaultValue: 'json',
        options: [
          { value: 'json', label: 'JSON' },
          { value: 'csv', label: 'CSV' },
          { value: 'xml', label: 'XML' },
          { value: 'yaml', label: 'YAML' }
        ]
      },
      autoRefresh: {
        fieldType: 'boolean',
        label: 'Auto Refresh',
        defaultValue: false
      }
    }
  },
  pagenode: {
    nodeType: 'pagenode',
    metadata: {
      title: 'Page Node',
      description: 'Node for web pages and content',
      icon: 'filetext',
      category: 'content'
    },
    configFields: {
      label: {
        fieldType: 'text',
        label: 'Page Title',
        defaultValue: 'New Page',
        required: true
      },
      description: {
        fieldType: 'textarea',
        label: 'Page Description',
        placeholder: 'Describe what this page contains...'
      },
      publishStatus: {
        fieldType: 'select',
        label: 'Publish Status',
        defaultValue: 'draft',
        options: [
          { value: 'draft', label: 'Draft' },
          { value: 'published', label: 'Published' },
          { value: 'archived', label: 'Archived' }
        ]
      }
    }
  },
  contentnode: {
    nodeType: 'contentnode',
    metadata: {
      title: 'Content Display Node',
      description: 'Display and render data in various formats like lists, tables, cards',
      icon: 'eye',
      category: 'view'
    },
    configFields: {
      label: { 
        fieldType: 'text', 
        label: 'Node Label', 
        defaultValue: 'Content Display', 
        required: true 
      },
      displayType: {
        fieldType: 'select',
        label: 'Display Type',
        defaultValue: 'list',
        options: [
          { value: 'list', label: 'List' },
          { value: 'table', label: 'Table' },
          { value: 'cards', label: 'Cards' },
          { value: 'custom', label: 'Custom' }
        ]
      },
      listConfig: {
        fieldType: 'textarea',
        label: 'List Configuration',
        placeholder: '{\n  "itemTemplate": {\n    "title": "{{title}}",\n    "subtitle": "{{body}}"\n  }\n}',
        description: 'JSON configuration for list display'
      },
      maxItems: {
        fieldType: 'number',
        label: 'Max Items to Display',
        defaultValue: 10,
        validation: { min: 1, max: 100 }
      },
      showSearch: {
        fieldType: 'boolean',
        label: 'Show Search',
        defaultValue: true
      },
      sortBy: {
        fieldType: 'select',
        label: 'Sort By',
        defaultValue: 'title',
        options: [
          { value: 'title', label: 'Title' },
          { value: 'date', label: 'Date' },
          { value: 'id', label: 'ID' },
          { value: 'userId', label: 'User ID' }
        ]
      }
    }
  }
};

// Icon mapping for node types
export const getNodeIcon = (nodeType: string) => {
  switch (nodeType) {
    case 'restnode': return <Globe className="w-4 h-4" />;
    case 'datanode': return <Database className="w-4 h-4" />;
    case 'pagenode': return <FileText className="w-4 h-4" />;
    case 'contentnode': return <FileText className="w-4 h-4" />;
    case 'conditionalnode': return <Workflow className="w-4 h-4" />;
    default: return <Settings className="w-4 h-4" />;
  }
};

// Utility function to get node configuration
export const getNodeConfig = (nodeType: string, nodeData: any): NodeConfig => {
  return mockConfigurations[nodeType] || {
    nodeType,
    metadata: {
      title: `${nodeType} Configuration`,
      description: `Configure ${nodeType} properties`,
      icon: 'settings',
      category: 'general'
    },
    configFields: {
      label: {
        fieldType: 'text',
        label: 'Label',
        defaultValue: nodeData?.label || 'Node',
        required: true
      }
    }
  };
};

// Utility function to get variant-specific fields
export const getVariantFields = (nodeConfig: NodeConfig, formData: Record<string, any>, nodeData: any) => {
  if (!nodeConfig.variants) return {};
  
  let variantFields = {};
  Object.entries(nodeConfig.variants).forEach(([variantKey, fields]) => {
    if (formData[variantKey] || nodeData?.[variantKey]) {
      variantFields = { ...variantFields, ...fields };
    }
  });
  
  return variantFields;
};