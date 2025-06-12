# JSON-Driven Node Factory System

This system provides a JSON-driven approach to creating and configuring nodes (RestNode, LogicalNode, and ContentNode) with stored process functions and configurable parameters.

## Overview

The JSON-driven node factory system allows you to:

1. **Define nodes in JSON** with visual configuration, process functions, and parameters
2. **Store process code** directly in JSON configurations for frontend execution and admin access
3. **Configure parameters** that can be customized per node instance
4. **Override behavior** at the instance level with custom parameters or process code
5. **Maintain consistency** across node types while allowing flexibility

## Architecture

```
factory/
├── types.ts                    # TypeScript interfaces
├── JSONNodeFactory.tsx         # Main factory class
├── ProcessExecutor.ts          # Code execution and validation
├── IconResolver.ts             # Icon resolution system
├── NodeConfigurationLoader.ts  # Configuration loading and validation
├── FactoryNodeRegistration.ts  # Integration with existing system
└── configs/                    # JSON configurations
    ├── restnode-config.json
    ├── logicalnode-config.json
    └── contentnode-config.json
```

## Quick Start

### 1. Initialize the Factory System

```typescript
import { initializeFactoryNodes } from './Node/factory/FactoryNodeRegistration';

// During application startup
await initializeFactoryNodes();
```

### 2. Use Factory-Generated Nodes

Once initialized, the factory automatically registers RestNode, LogicalNode, and ContentNode components that are driven by their JSON configurations.

### 3. Create Node Instances

```typescript
// Example node instance data (what goes in flows like apiFlowNodesEdges.ts)
const restNodeInstance = {
  id: "api-request",
  type: "restnode",
  data: {
    label: "Get Posts",
    details: "Fetch posts from JSONPlaceholder API",
    nodeLevel: "intermediate",
    
    // Node-specific configuration
    method: "GET",
    url: "https://jsonplaceholder.typicode.com/posts",
    headers: { "Content-Type": "application/json" },
    timeout: 30,
    
    // Process customization for this instance
    processOverrides: {
      parameters: {
        retryAttempts: 5,
        retryDelay: 2000,
        includeResponseHeaders: false
      },
      constraints: {
        timeout: 45000
      }
    }
  },
  position: { x: 100, y: 100 }
};
```

## JSON Configuration Structure

Each node type is defined by a JSON configuration with these main sections:

### Basic Identity
```json
{
  "nodeType": "restnode",
  "defaultLabel": "REST API",
  "category": "integration",
  "description": "Fetches data from REST API endpoints..."
}
```

### Visual Configuration
```json
{
  "visual": {
    "icon": { "type": "component", "value": "DomainIcon" },
    "headerIcon": { "type": "builtin", "value": "Globe2" },
    "headerGradient": "bg-gradient-to-r from-blue-50 to-blue-200",
    "selectedColor": "blue",
    "variants": {
      "fieldName": "method",
      "options": {
        "GET": { "badgeText": "GET", "badgeColor": "bg-green-100 text-green-800" },
        "POST": { "badgeText": "POST", "badgeColor": "bg-blue-100 text-blue-800" }
      },
      "default": { "badgeText": "API", "badgeColor": "bg-gray-100 text-gray-800" }
    },
    "additionalContentFunction": ".url"
  }
}
```

### Process Function (Stored Code)
```json
{
  "process": {
    "code": "async function process(incomingData, nodeData, params) { /* function code */ }",
    "metadata": {
      "generatedBy": "manual",
      "version": "1.0.0",
      "executionContext": "frontend"
    },
    "parameters": {
      "retryAttempts": {
        "type": "number",
        "description": "Number of retry attempts on failure",
        "required": false,
        "default": 3,
        "validation": { "min": 1, "max": 10 },
        "ui": { "component": "number", "placeholder": "3" }
      }
    }
  }
}
```

## Key Features

### 1. Stored Process Functions

Process functions are stored as strings in the JSON configuration and executed at runtime:

```javascript
// Function signature: async function process(incomingData, nodeData, params)
// - incomingData: Data from upstream nodes
// - nodeData: Static configuration for this node instance  
// - params: Dynamic parameters that can be configured per instance
```

### 2. Configurable Parameters

Each node type defines parameters that can be customized per instance:

```json
{
  "parameters": {
    "retryAttempts": {
      "type": "number",
      "description": "Number of retry attempts on failure",
      "required": false,
      "default": 3,
      "validation": { "min": 1, "max": 10 },
      "ui": { "component": "number", "placeholder": "3" }
    }
  }
}
```

### 3. Instance-Level Overrides

Node instances can override parameters or even the entire process function:

```json
{
  "processOverrides": {
    "parameters": {
      "retryAttempts": 5,
      "retryDelay": 2000
    },
    "customCode": "async function process(incomingData, nodeData, params) { /* custom logic */ }",
    "constraints": {
      "timeout": 45000
    }
  }
}
```

### 4. Visual Variants

Nodes can change appearance based on their data:

```json
{
  "variants": {
    "fieldName": "method",
    "options": {
      "GET": { "badgeText": "GET", "badgeColor": "bg-green-100 text-green-800" },
      "POST": { "badgeText": "POST", "badgeColor": "bg-blue-100 text-blue-800" }
    }
  }
}
```

## Node Types

### RestNode
- **Purpose**: Fetches data from REST API endpoints
- **Process Function**: Handles HTTP requests with retry logic and error handling
- **Parameters**: `retryAttempts`, `retryDelay`, `includeResponseHeaders`
- **Variants**: HTTP method badges (GET, POST, PUT, DELETE)

### LogicalNode  
- **Purpose**: Processes data with logical operations (filter, transform, aggregate)
- **Process Function**: Handles data manipulation based on operation type
- **Parameters**: `enableLogging`, `strictMode`, `maxItems`
- **Variants**: Operation type badges (FILTER, TRANSFORM, AGGREGATE)

### ContentNode
- **Purpose**: Displays data in various formats without altering it
- **Process Function**: Formats data for display (list, table, cards, JSON)
- **Parameters**: `enableFormatting`, `showMetadata`, `enableLogging`
- **Variants**: Display type badges (LIST, TABLE, CARDS, JSON)

## Advanced Usage

### Testing Node Configurations

```typescript
import { factoryNodeRegistration } from './factory/FactoryNodeRegistration';

// Test a specific node configuration
const result = await factoryNodeRegistration.testNodeConfiguration(
  'restnode',
  {
    method: 'GET',
    url: 'https://api.example.com/data',
    headers: { 'Content-Type': 'application/json' }
  },
  null // incoming data
);

console.log('Test result:', result);
```

### Adding Custom Configurations

```typescript
import { factoryNodeRegistration } from './factory/FactoryNodeRegistration';

const customConfig = {
  nodeType: "customnode",
  defaultLabel: "Custom Node",
  category: "custom",
  description: "A custom node type",
  // ... rest of configuration
};

await factoryNodeRegistration.addCustomConfiguration(customConfig);
```

### Accessing the Factory Directly

```typescript
import { factoryNodeRegistration } from './factory/FactoryNodeRegistration';

const factory = factoryNodeRegistration.getFactory();
const configLoader = factoryNodeRegistration.getConfigurationLoader();

// Execute a process function directly
const result = await factory.executeProcessFunction(config, nodeData, incomingData);
```

## Integration with Existing System

The factory system integrates seamlessly with your existing node registration:

1. **Replaces manual node creation** with JSON-driven generation
2. **Uses existing CellNode component** for consistent appearance
3. **Integrates with useNodeProcess hook** for process management
4. **Compatible with existing handle configurations**
5. **Works with current edge and connection systems**

## Benefits

1. **Stored Process Code**: Functions are accessible for frontend execution and admin viewing
2. **Configurable Parameters**: Each node type defines parameters that can be customized per instance
3. **Instance Overrides**: Individual nodes can override parameters or even the entire process function
4. **Admin Access**: Process code and parameters are always accessible for debugging and modification
5. **Version Control**: Process functions include metadata for tracking changes and regeneration
6. **Flexible Execution**: Support for both frontend and backend execution contexts
7. **Parameter Validation**: Built-in validation for type safety and constraints
8. **UI Integration**: Parameter definitions include UI hints for the node panel

## Future Enhancements

- **AI Code Generation**: Integrate with AI services to generate process functions
- **Process Function Regeneration**: Allow regenerating functions based on node description
- **Version Control**: Track and manage different versions of process functions
- **Backend Execution**: Secure execution environment for sensitive operations
- **Parameter UI**: Automatic generation of parameter configuration panels
- **Performance Monitoring**: Track and analyze node execution performance