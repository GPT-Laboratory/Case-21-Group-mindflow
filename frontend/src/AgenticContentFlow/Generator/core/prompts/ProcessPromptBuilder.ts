/**
 * Process Prompt Builder Module
 * 
 * Simplified prompt builder for process generation requests.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-17
 */

import { PromptBuildRequest } from "../../generatortypes";
import { GeneratorConfig } from "../../generatortypes";

/**
 * Process Prompt Builder
 * 
 * Builds intelligent prompts for process function generation
 */
export class ProcessPromptBuilder {
  private config: Partial<GeneratorConfig> = {};

  /**
   * Configure the prompt builder
   */
  configure(config: Partial<GeneratorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Build a comprehensive prompt for LLM code generation
   */
  buildPrompt(request: PromptBuildRequest): string {
    const {
      nodeType,
      templateDescription,
      instanceData,
      templateData,
      inputSchema,
      outputSchema,
      sourceNodes,
      targetNodes
    } = request;

    const contextSection = this.buildContextSection(sourceNodes, targetNodes);
    const configSection = this.buildConfigurationSection(instanceData, templateData);
    const schemaSection = this.buildSchemaSection(inputSchema, outputSchema);
    const requirementsSection = this.buildRequirementsSection(nodeType, templateData);
    const currentCodeSection = this.buildCurrentCodeSection(instanceData);
    const userRequestSection = this.buildUserRequestSection(instanceData);

    const basePrompt = `Generate a JavaScript async function for a ${nodeType} node in an Agentic Content Flow system.

**USER REQUEST**: ${instanceData?.userRequest || 'No specific request provided'}

**Template Description**: ${templateDescription}

**Purpose**: Create a process function that handles data flow between nodes in a visual workflow system.

${currentCodeSection}${userRequestSection}${configSection}${schemaSection}${contextSection}${requirementsSection}

**Function Signature**:
\`\`\`javascript
async function process(incomingData, nodeData, params, targetMap, sourceMap)
\`\`\`

**Parameters**:
- \`incomingData\`: Data received from upstream nodes (null if first node)
- \`nodeData\`: Node configuration and template data
- \`params\`: Runtime parameters and settings
- \`targetMap\`: Map of target nodes for routing (Map<string, Node>)
- \`sourceMap\`: Map of source nodes for context (Map<string, Node>)

**Critical Implementation Rules**:
- USE NODEDATA PARAMETERS - Always use nodeData.url, nodeData.method, etc. instead of hard-coded values
- BE DYNAMIC - The function should work with any URL/method/headers passed in nodeData
- IMPLEMENT THE ACTUAL REQUIREMENT - Don't create abstract helper functions
- USE THE INSTANCE DATA - The "details" field contains the specific requirement
- ACCESS INPUT DATA CORRECTLY - Use incomingData.data if it exists, otherwise use incomingData directly
- ONE FUNCTION ONLY - Generate only the main process function
- BE SPECIFIC - If asked to filter by "title starts with J", write code that actually checks if title starts with "J"
- NO PARAMETER VALIDATION - Don't validate incomingData unless your specific logic requires it
- MUST include comprehensive error handling with try-catch
- MUST include console.log statements for debugging
- MUST return a result object with data and metadata

**IMPORTANT**: The user request "${instanceData?.userRequest || 'No request'}" should be implemented in the code. If they ask to change the URL, change the URL in the code to point to the comments endpoint.

**CRITICAL**: Use nodeData parameters, not hard-coded values. For example:
- Use \`nodeData.url\` instead of hard-coding "https://jsonplaceholder.typicode.com/users"
- Use \`nodeData.method\` instead of hard-coding "GET"
- Use \`nodeData.headers\` instead of hard-coding headers

**TEMPLATE DATA UPDATES**: When the user requests changes, you should update the templateData in the function. For example:
- If user says "get comments", use \`nodeData.url\` which should be set to the comments endpoint
- If user says "use POST method", use \`nodeData.method\` which should be set to "POST"
- Always use the parameters from nodeData, never hard-code values

**FUNCTION STRUCTURE**:
\`\`\`javascript
async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  try {
    console.log('Processing:', { incomingData, nodeData });
    
    // Use nodeData parameters, not hard-coded values
    const { url, method = 'GET', headers = {} } = nodeData;
    
    // Make the API call using the parameters
    const response = await fetch(url, { method, headers });
    const data = await response.json();
    
    return { data, metadata: { status: response.status } };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
\`\`\`

${this.buildConditionalRoutingSection(templateData)}

**IMPORTANT**: Return ONLY the JavaScript function - no explanations, no markdown, just the function code.

**Example**: If the user says "Change this to get comments instead", update the URL in the code to point to the comments endpoint.`;

    return basePrompt;
  }

  private buildContextSection(sourceNodes?: Array<{ id: string; type: string; data: any }>, targetNodes?: Array<{ id: string; type: string; data: any }>): string {
    if (!sourceNodes?.length && !targetNodes?.length) {
      return '';
    }

    let section = '\n**Flow Context**:\n';
    
    if (sourceNodes?.length) {
      section += `Receives data from ${sourceNodes.length} upstream node(s):\n`;
      sourceNodes.forEach(node => {
        section += `- ${node.type} (${node.id}): ${node.data?.label || 'Unnamed'}\n`;
      });
    } else {
      section += 'This is the first node in the flow (no upstream nodes)\n';
    }
    
    if (targetNodes?.length) {
      section += `\nSends data to ${targetNodes.length} downstream node(s):\n`;
      targetNodes.forEach(node => {
        section += `- ${node.type} (${node.id}): ${node.data?.label || 'Unnamed'}\n`;
      });
      
      section += '\n**Target Node IDs for Conditional Routing**:\n';
      targetNodes.forEach(node => {
        section += `- "${node.id}" (${node.data?.label || 'Unnamed'})\n`;
      });
    }
    
    return section + '\n';
  }

  private buildConfigurationSection(instanceData: Record<string, any>, templateData: Record<string, any>): string {
    let section = '';

    if (instanceData && Object.keys(instanceData).length > 0) {
      section += '**Instance Configuration**:\n';
      
      if (instanceData.label) {
        section += `- Label: "${instanceData.label}"\n`;
      }
      
      if (instanceData.details) {
        section += `- Specific Purpose: ${instanceData.details}\n`;
      }
      
      // Add other relevant instance data
      Object.entries(instanceData).forEach(([key, value]) => {
        if (!['label', 'details', 'expanded', 'depth', 'isParent'].includes(key)) {
          section += `- ${key}: ${JSON.stringify(value)}\n`;
        }
      });
      
      section += '\n';
    }

    if (templateData && Object.keys(templateData).length > 0) {
      section += '**Template Configuration**:\n';
      section += '```json\n';
      section += JSON.stringify(templateData, null, 2);
      section += '\n```\n\n';
    }

    return section;
  }

  private buildSchemaSection(inputSchema?: any, outputSchema?: any): string {
    if (!inputSchema && !outputSchema) {
      return '';
    }

    let section = '**Data Schemas**:\n';
    
    if (inputSchema) {
      section += 'Input Schema:\n```json\n';
      section += JSON.stringify(inputSchema, null, 2);
      section += '\n```\n\n';
    } else {
      section += 'Input: No upstream nodes connected (this is likely the first node in the flow)\n\n';
    }
    
    if (outputSchema) {
      section += 'Expected Output Schema:\n```json\n';
      section += JSON.stringify(outputSchema, null, 2);
      section += '\n```\n\n';
    }
    
    return section;
  }

  private buildRequirementsSection(nodeType: string, templateData: Record<string, any>): string {
    console.log(`Building requirements for node type: ${nodeType}`);
    let requirements = '**Configuration-Based Requirements**:\n';
    
    const configEntries = Object.entries(templateData || {});
    
    if (configEntries.length === 0) {
      requirements += '- Implement functionality based on the template description and instance configuration\n';
      requirements += '- Use the provided nodeData to guide your implementation\n';
    } else {
      requirements += '- Implement functionality based on the provided configuration:\n';
      configEntries.forEach(([key, value]) => {
        if (key === 'url') {
          requirements += `  - Use configured endpoint: ${value}\n`;
        } else if (key === 'method') {
          requirements += `  - Use HTTP method: ${value}\n`;
        } else if (key === 'operation') {
          requirements += `  - Perform operation: ${value}\n`;
        } else if (key === 'condition') {
          requirements += `  - Evaluate condition: ${value}\n`;
          requirements += `  - IMPORTANT: For conditional nodes, return { data, targets: [...], conditionResult: boolean } for selective routing\n`;
        } else if (key === 'displayType') {
          requirements += `  - Format for display type: ${value}\n`;
        } else if (typeof value === 'object' && value !== null) {
          requirements += `  - Apply ${key} configuration as needed\n`;
        } else {
          requirements += `  - Use ${key}: ${value}\n`;
        }
      });
    }
    
    requirements += '- Follow the template description for overall behavior\n';
    requirements += '- Adapt implementation to the specific instance requirements\n';
    
    return requirements + '\n';
  }

  private buildConditionalRoutingSection(templateData: Record<string, any>): string {
    if (!templateData.condition && !templateData.conditionType) {
      return '';
    }

    return `
**Conditional Routing Requirements**:
- MUST return { data, targets: [array_of_target_node_ids], conditionResult: boolean }
- The targets array specifies which connected nodes should receive the data
- Only nodes in the targets array will receive data (selective routing)
- Include conditionResult in return object for debugging
- Use target node IDs from targetMap keys in your targets array
- Example: Array.from(targetMap.keys()) gives you all possible target node IDs

**Conditional Routing Example**:
\`\`\`javascript
// Get target node IDs from targetMap
const availableTargets = Array.from(targetMap.keys());
const trueTargets = ['content-display']; // When condition is true
const falseTargets = ['post-submission']; // When condition is false

// Return with targets array for selective routing
return {
  data: incomingData,
  targets: result ? trueTargets : falseTargets,
  conditionResult: result,
  metadata: { /* ... */ }
};
\`\`\``;
  }

  private buildCurrentCodeSection(instanceData: Record<string, any>): string {
    const currentCode = instanceData.currentInstanceCode;
    const lastGenerated = instanceData.lastGenerated;
    
    if (!currentCode) {
      return '';
    }
    
    let section = '**Current Implementation**:\n';
    section += 'The node currently has this process function:\n\n';
    section += '```javascript\n';
    section += currentCode;
    section += '\n```\n\n';
    
    if (lastGenerated) {
      section += `*Last generated: ${lastGenerated}*\n\n`;
    }
    
    return section;
  }

  private buildUserRequestSection(instanceData: Record<string, any>): string {
    const userRequest = instanceData.userRequest;
    
    if (!userRequest) {
      return '';
    }
    
    let section = '**User Request**:\n';
    section += `The user wants to modify this node: "${userRequest}"\n\n`;
    section += '**Instructions**:\n';
    section += '- Update the process function to implement the requested changes\n';
    section += '- Keep the same function signature and error handling structure\n';
    section += '- Maintain compatibility with the existing node configuration\n';
    section += '- If the request is about changing API endpoints, URLs, or methods, update those in the code\n';
    section += '- If the request is about changing data processing logic, modify the processing part\n';
    section += '- If the request is about changing conditions or routing, update the conditional logic\n\n';
    
    return section;
  }
}