/**
 * Prompt Builder
 * 
 * Constructs intelligent prompts for LLM code generation by combining
 * template descriptions, instance data, input schemas, and context information.
 * 
 * @author Agentic Content Flow Team
 * @version 1.0.0
 * @since 2025-06-15
 */

import { PromptBuildRequest } from './types';

export class PromptBuilder {
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

    let prompt = this.buildBasePrompt(nodeType, templateDescription);
    
    // Add instance-specific details
    prompt += this.buildInstanceSection(instanceData);
    
    // Add template configuration
    prompt += this.buildTemplateSection(templateData);
    
    // Add schema information
    if (inputSchema || outputSchema) {
      prompt += this.buildSchemaSection(inputSchema, outputSchema);
    }
    
    // Add flow context
    if (sourceNodes?.length || targetNodes?.length) {
      prompt += this.buildFlowContextSection(sourceNodes, targetNodes);
    }
    
    // Add specific requirements based on node type
    prompt += this.buildNodeSpecificRequirements(nodeType, templateData);
    
    // Add function signature and constraints
    prompt += this.buildFunctionRequirements();
    
    // Add examples if relevant
    prompt += this.buildExamplesSection(nodeType);
    
    return prompt.trim();
  }

  private buildBasePrompt(nodeType: string, templateDescription: string): string {
    return `
Generate a JavaScript async function for a ${nodeType} node in an Agentic Content Flow system.

**Template Description**: ${templateDescription}

**Purpose**: Create a process function that handles data flow between nodes in a visual workflow system.

`;
  }

  private buildInstanceSection(instanceData: Record<string, any>): string {
    if (!instanceData || Object.keys(instanceData).length === 0) {
      return '';
    }

    let section = '**Instance Configuration**:\n';
    
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
    
    return section + '\n';
  }

  private buildTemplateSection(templateData: Record<string, any>): string {
    if (!templateData || Object.keys(templateData).length === 0) {
      return '';
    }

    let section = '**Template Configuration**:\n';
    section += '```json\n';
    section += JSON.stringify(templateData, null, 2);
    section += '\n```\n\n';
    
    return section;
  }

  private buildSchemaSection(inputSchema?: any, outputSchema?: any): string {
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

  private buildFlowContextSection(sourceNodes?: Array<{ id: string; type: string; data: any }>, targetNodes?: Array<{ id: string; type: string; data: any }>): string {
    let section = '**Flow Context**:\n';
    
    if (sourceNodes?.length) {
      section += `Receives data from ${sourceNodes.length} upstream node(s):\n`;
      sourceNodes.forEach(node => {
        section += `- ${node.type} (${node.id}): ${node.data?.label || 'Unnamed'}\n`;
      });
      section += '\n';
    } else {
      section += 'This is the first node in the flow (no upstream nodes)\n\n';
    }
    
    if (targetNodes?.length) {
      section += `Sends data to ${targetNodes.length} downstream node(s):\n`;
      targetNodes.forEach(node => {
        section += `- ${node.type} (${node.id}): ${node.data?.label || 'Unnamed'}\n`;
      });
      section += '\n';
      
      // Add target node IDs for conditional routing
      section += '**Target Node IDs for Conditional Routing**:\n';
      targetNodes.forEach(node => {
        section += `- "${node.id}" (${node.data?.label || 'Unnamed'})\n`;
      });
      section += '\n';
    }
    
    return section;
  }

  private buildNodeSpecificRequirements(nodeType: string, templateData: Record<string, any>): string {
    console.log(`Building requirements for node type: ${nodeType}`);
    let requirements = '**Configuration-Based Requirements**:\n';
    
    // Build requirements based on actual configuration data, not node type assumptions
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
    
    // Add conditional routing guidance
    if (templateData.condition || templateData.conditionType) {
      requirements += '\n**Conditional Routing Requirements**:\n';
      requirements += '- MUST return { data, targets: [array_of_target_node_ids], conditionResult: boolean }\n';
      requirements += '- The targets array specifies which connected nodes should receive the data\n';
      requirements += '- Only nodes in the targets array will receive data (selective routing)\n';
      requirements += '- Include conditionResult in return object for debugging\n';
    }
    
    return requirements + '\n';
  }

  private buildFunctionRequirements(): string {
    return `**Function Signature**:
\`\`\`javascript
async function process(incomingData, nodeData, params, targetMap, sourceMap)
\`\`\`

**Parameters**:
- \`incomingData\`: Data received from upstream nodes (null if first node)
- \`nodeData\`: Node configuration and template data
- \`params\`: Runtime parameters and settings
- \`targetMap\`: Map of target nodes for routing (Map<string, Node> - keys are node IDs, values are Node objects)
- \`sourceMap\`: Map of source nodes for context (Map<string, Node> - keys are node IDs, values are Node objects)

**Understanding targetMap and sourceMap**:
- \`targetMap\` contains all nodes that this node can send data to
- \`sourceMap\` contains all nodes that send data to this node
- **Keys** are node IDs (strings like "content-display", "post-submission")
- **Values** are full Node objects with .id, .type, .data properties
- **For conditional routing**: Use the target node IDs from targetMap keys in your targets array
- **Example**: \`Array.from(targetMap.keys())\` gives you all possible target node IDs

**Conditional Routing Pattern**:
- **MUST return**: \`{ data: yourData, targets: ["target-node-id-1"], conditionResult: boolean }\`
- **targets array**: Contains node IDs (strings) from targetMap keys
- **Only specified targets receive data** - others are skipped
- **Legacy nodes**: Can still return just data without targets array

**Parameter Usage Guidelines**:
- **ALWAYS keep all 5 parameters in the function signature** - removing them breaks the system
- **Only use parameters you actually need** - don't validate parameters unless required for your logic
- **incomingData can be null/undefined** - this is normal for first nodes in the flow, don't validate unless you need the data
- **nodeData contains your configuration** - this is where your URL, method, headers, etc. are stored
- **params, targetMap, sourceMap are optional** - only use if your specific logic requires them

**Critical Implementation Rules**:
- **IMPLEMENT THE ACTUAL REQUIREMENT** - Don't create abstract helper functions, write the real logic
- **USE THE INSTANCE DATA** - The "details" field contains the specific requirement you must implement
- **ACCESS THE INPUT DATA CORRECTLY** - Use incomingData.data if it exists, otherwise use incomingData directly
- **ONE FUNCTION ONLY** - Generate only the main process function, no helper functions unless absolutely necessary
- **BE SPECIFIC** - If asked to filter by "title starts with J", write code that actually checks if title starts with "J"
- **NO RECURSION** - Don't create functions that call themselves infinitely
- **NO EVAL() OR DYNAMIC CODE** - Never use eval(), new Function(), or similar dynamic code execution
- **IGNORE COMPLEX TEST DATA** - Focus on the simple instance requirements, not complex test configurations
- **NO PARAMETER VALIDATION** - Don't validate incomingData unless your specific logic requires it

**Data Access Patterns**:
- For filtering: \`const items = incomingData.data || incomingData; const filtered = items.filter(item => /* your condition */);\`
- For transformation: \`const items = incomingData.data || incomingData; const transformed = items.map(item => /* your transform */);\`
- For aggregation: \`const items = incomingData.data || incomingData; const result = items.reduce(/* your reducer */);\`

**Requirements**:
- MUST be an async function
- MUST return a result object
- MUST include comprehensive error handling with try-catch
- MUST include console.log statements for debugging
- DO NOT validate incomingData unless your logic specifically requires it
- DO NOT validate params unless your logic specifically requires them
- MUST use nodeData for configuration values
- Should include processing metadata in the result
- Focus on the node's primary purpose, not parameter validation

`;
  }

  private buildExamplesSection(nodeType: string): string {
    let examples = '**Example Code Structure**:\n';
    
    // Add conditional routing example for conditional nodes
    if (nodeType === 'conditionalnode') {
      examples += '```javascript\n';
      examples += 'async function process(incomingData, nodeData, params, targetMap, sourceMap) {\n';
      examples += '  console.log(\'🔄 conditionalnode processing:\', { incomingData, nodeData });\n\n';
      examples += '  try {\n';
      examples += '    // Extract data and condition from configuration\n';
      examples += '    const data = incomingData.data || incomingData;\n';
      examples += '    const condition = nodeData.condition; // e.g., "data.length > 3"\n\n';
      examples += '    // Evaluate the condition (implement actual logic, don\'t use eval)\n';
      examples += '    const result = data.length > 3; // Example for data.length > 3\n';
      examples += '    console.log(`🎯 Condition "${condition}" evaluated to: ${result}`);\n\n';
      examples += '    // Get target node IDs from targetMap\n';
      examples += '    const availableTargets = Array.from(targetMap.keys());\n';
      examples += '    console.log(\'Available targets:\', availableTargets);\n\n';
      examples += '    // Define specific target nodes for each path\n';
      examples += '    const trueTargets = [\'content-display\']; // When condition is true\n';
      examples += '    const falseTargets = [\'post-submission\']; // When condition is false\n\n';
      examples += '    // CRITICAL: Return with targets array for selective routing\n';
      examples += '    return {\n';
      examples += '      data: incomingData,\n';
      examples += '      targets: result ? trueTargets : falseTargets, // ← SELECTIVE ROUTING\n';
      examples += '      conditionResult: result,\n';
      examples += '      metadata: {\n';
      examples += '        condition,\n';
      examples += '        evaluatedTo: result,\n';
      examples += '        selectedTargets: result ? trueTargets : falseTargets,\n';
      examples += '        processedAt: new Date().toISOString(),\n';
      examples += '        nodeType: "conditionalnode"\n';
      examples += '      }\n';
      examples += '    };\n\n';
      examples += '  } catch (error) {\n';
      examples += '    console.error(\'❌ conditionalnode failed:\', error);\n';
      examples += '    throw error;\n';
      examples += '  }\n';
      examples += '}\n';
      examples += '```\n\n';
    } else {
      // Regular node example
      examples += '```javascript\n';
      examples += 'async function process(incomingData, nodeData, params, targetMap, sourceMap) {\n';
      examples += `  console.log('🔄 ${nodeType} processing:', { incomingData, nodeData });\n\n`;
      examples += '  try {\n';
      examples += '    // Implementation based on nodeData configuration\n';
      examples += '    // Extract configuration values from nodeData\n';
      examples += '    const config = nodeData;\n\n';
      examples += '    // Process according to your specific requirements\n';
      examples += '    // Use incomingData if your logic requires it\n';
      examples += '    // Apply configuration-driven logic here\n\n';
      examples += '    const result = {\n';
      examples += '      data: /* your processed data */,\n';
      examples += '      metadata: {\n';
      examples += '        processedAt: new Date().toISOString(),\n';
      examples += '        nodeType: "' + nodeType + '"\n';
      examples += '      }\n';
      examples += '    };\n\n';
      examples += `    console.log('✅ ${nodeType} completed:', result);\n`;
      examples += '    return result;\n\n';
      examples += '  } catch (error) {\n';
      examples += `    console.error('❌ ${nodeType} failed:', error);\n`;
      examples += '    throw error;\n';
      examples += '  }\n';
      examples += '}\n';
      examples += '```\n\n';
    }
    
    return examples;
  }
}