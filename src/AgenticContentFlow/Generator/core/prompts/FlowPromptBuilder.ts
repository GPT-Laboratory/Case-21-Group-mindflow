/**
 * Flow Prompt Builder Module
 * 
 * Specialized prompt builder for flow generation requests.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-16
 */

import { 
  FlowGenerationRequest,
  GeneratorConfig
} from '../../generatortypes';

/**
 * Flow Prompt Builder
 * 
 * Builds intelligent prompts for flow generation
 */
export class FlowPromptBuilder {
  private config: Partial<GeneratorConfig> = {};

  /**
   * Configure the prompt builder
   */
  configure(config: Partial<GeneratorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Build flow generation prompt
   */
  async buildFlowPrompt(request: FlowGenerationRequest): Promise<string> {
    const validNodeTypes = ['datanode', 'logicnode', 'restnode', 'contentnode', 'conditionalnode', 'pagenode', 'statisticsnode', 'invisiblenode', 'coursenode', 'modulenode'];
    const validHandles = ['top', 'bottom', 'left', 'right'];
    
    const contextSection = request.selectedNodesContext ? `

**EXISTING FLOW CONTEXT**:
You are adding to an existing flow. Here's the context from currently selected nodes:

${request.selectedNodesContext}

Consider this existing context when generating the new flow. You may:
- Extend or complement the existing nodes
- Create workflows that integrate with the existing structure
- Build upon the data and processing patterns already established

` : '';

    const basePrompt = `You are a flow generation AI that creates complete Agentic Content Flow configurations. Generate a UNIQUE and CREATIVE flow based on this description:

**User Request**: "${request.description}"
${contextSection}
**CRITICAL SYSTEM CONSTRAINTS**:
1. VALID NODE TYPES ONLY: ${validNodeTypes.join(', ')}
2. VALID HANDLE POSITIONS ONLY: ${validHandles.join(', ')}
3. Output ONLY valid JSON - no code blocks, no markdown, no explanations
4. Use position-based handles (top, bottom, left, right) - NOT generic identifiers

**NODE TYPE USAGE GUIDE**:
- restnode: REST API calls, HTTP requests, external service integration
- contentnode: Display content, UI components, data visualization
- logicnode: Data processing, filtering, transformation, calculations
- conditionalnode: Decision making, routing, if/then logic
- datanode: Data storage, caching, state management
- pagenode: Page containers, layout structures
- statisticsnode: Analytics, metrics, reporting
- invisiblenode: Layout containers, grouping (use sparingly)
- coursenode: Educational content containers
- modulenode: Modular components, reusable sections

**HANDLE CONNECTION RULES**:
- Use "right" for source handles (data flows OUT)
- Use "left" for target handles (data flows IN) 
- Use "top"/"bottom" for vertical layouts
- NEVER use: "input", "output", "in", "out" or generic names

**Flow Requirements for "${request.description}"**:
- Create 2-5 nodes for simple flows, 3-8 nodes for complex flows
- Each node MUST have proper instanceCode for processing
- Use realistic API endpoints (jsonplaceholder.typicode.com is good)
- Include proper error handling in instanceCode
- Connect nodes logically with appropriate edge types

**Required JSON Structure**:
{
  "nodes": [
    {
      "id": "unique-node-id",
      "type": "restnode",
      "position": { "x": 100, "y": 100 },
      "data": {
        "expanded": true,
        "depth": 0,
        "isParent": false,
        "instanceData": {
          "label": "Descriptive Label",
          "details": "What this node does"
        },
        "templateData": {
          "method": "GET",
          "url": "https://jsonplaceholder.typicode.com/users",
          "headers": { "Content-Type": "application/json" },
          "authentication": "none"
        },
        "instanceCode": "async function process(incomingData, nodeData, params, targetMap, sourceMap) { try { const response = await fetch(nodeData.url, { method: nodeData.method, headers: nodeData.headers }); const data = await response.json(); return { data, metadata: { processedAt: new Date().toISOString(), nodeType: 'restnode' } }; } catch (error) { console.error('Error:', error); throw error; } }"
      }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "source-node-id", 
      "target": "target-node-id",
      "type": "package",
      "sourceHandle": "right",
      "targetHandle": "left"
    }
  ],
  "description": "Brief description of the flow",
  "flowType": "user-management",
  "complexity": "simple",
  "features": ["Feature 1", "Feature 2"]
}

**IMPORTANT VALIDATION RULES**:
- ONLY use node types from the valid list above
- ONLY use handle positions: top, bottom, left, right
- Every node MUST have a unique ID
- Every edge MUST reference existing node IDs
- Include working instanceCode for all processing nodes
- Use proper error handling and logging

Return ONLY the JSON object above (customized for the request) - NO markdown, NO explanations, NO additional text.`;

    return basePrompt;
  }

  /**
   * Build self-correction prompt for fixing validation errors
   */
  buildSelfCorrectionPrompt(
    invalidFlow: any,
    errors: Array<{ message: string; suggestedFix?: string }>,
    originalRequest: FlowGenerationRequest
  ): string {
    const validNodeTypes = ['datanode', 'logicnode', 'restnode', 'contentnode', 'conditionalnode', 'pagenode', 'statisticsnode', 'invisiblenode', 'coursenode', 'modulenode'];
    const validHandles = ['top', 'bottom', 'left', 'right'];
    
    const errorsList = errors.map(e => 
      `- ${e.message}${e.suggestedFix ? ` (Fix: ${e.suggestedFix})` : ''}`
    ).join('\n');
    
    return `Fix the following validation errors in this flow:

**Original Request**: "${originalRequest.description}"

**Validation Errors**:
${errorsList}

**CRITICAL FIXES NEEDED**:
1. Replace invalid node types with: ${validNodeTypes.join(', ')}
2. Use only these handle positions: ${validHandles.join(', ')}
3. Ensure all node IDs and edge references are correct

**Invalid Flow to Fix**:
${JSON.stringify(invalidFlow, null, 2)}

Return ONLY the corrected JSON flow - no explanations, no markdown, just valid JSON that fixes all the errors above.`;
  }
}