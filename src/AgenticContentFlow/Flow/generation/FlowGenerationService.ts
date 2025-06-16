import { Node, Edge } from '@xyflow/react';
import { completeFlowExample } from '../../test/generated/completeFlowExample';
import { GenerationOrchestrator } from '../../Process/Generation/GenerationOrchestrator';
import { 
  FlowValidationService, 
  ValidationResult, 
  VALID_NODE_TYPES, 
  VALID_HANDLE_POSITIONS 
} from './FlowValidationService';

export interface FlowGenerationRequest {
  description: string;
  complexity?: 'simple' | 'intermediate' | 'advanced';
  nodeTypes?: string[];
  features?: string[];
  selectedNodesContext?: string; // Add context from selected nodes
}

export interface GeneratedFlow {
  nodes: Node[];
  edges: Edge[];
  description: string;
  metadata: {
    generatedAt: string;
    complexity: string;
    nodeCount: number;
    edgeCount: number;
  };
}

/**
 * Flow Generation Service
 * 
 * Generates complete flows using AI based on user descriptions
 */
export class FlowGenerationService {
  private orchestrator: GenerationOrchestrator;

  constructor() {
    this.orchestrator = new GenerationOrchestrator();
  }

  /**
   * Generate a complete flow from a description
   */
  async generateFlow(request: FlowGenerationRequest): Promise<GeneratedFlow> {
    console.log('🎯 Generating flow from description:', request.description);

    try {
      // Build the enhanced prompt for AI generation
      const prompt = this.buildEnhancedFlowGenerationPrompt(request);
      
      // Call AI service using the actual LLM orchestrator
      const generatedFlowData = await this.callAIService(prompt);
      
      // Parse the generated flow
      let flow = this.parseGeneratedFlow(generatedFlowData, request);
      
      // Validate and auto-correct the generated flow
      console.log('🔍 Validating generated flow...');
      const validationResult = FlowValidationService.validateAndCorrect(flow, request);
      
      // Log validation report
      const report = FlowValidationService.generateValidationReport(validationResult);
      console.log(report);
      
      // Use corrected flow if available and valid
      if (validationResult.correctedFlow && validationResult.isValid) {
        flow = validationResult.correctedFlow;
        console.log('✅ Using auto-corrected flow');
      } else if (!validationResult.isValid) {
        console.warn('⚠️ Generated flow has validation errors, attempting AI self-correction...');
        
        // Attempt AI self-correction
        const correctedFlow = await this.attemptAISelfCorrection(flow, validationResult, request);
        if (correctedFlow) {
          flow = correctedFlow;
          console.log('✅ AI self-correction successful');
        } else {
          console.warn('❌ AI self-correction failed, using best available flow');
        }
      }
      
      console.log('✅ Flow generated successfully:', {
        nodeCount: flow.nodes.length,
        edgeCount: flow.edges.length,
        complexity: flow.metadata.complexity,
        validated: validationResult.isValid
      });
      
      return flow;
      
    } catch (error) {
      console.error('❌ Flow generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to generate flow: ${errorMessage}`);
    }
  }

  /**
   * Enhanced prompt with better context about valid node types and handles
   */
  private buildEnhancedFlowGenerationPrompt(request: FlowGenerationRequest): string {
    const validNodeTypesString = VALID_NODE_TYPES.join(', ');
    const validHandlesString = VALID_HANDLE_POSITIONS.join(', ');
    
    // Build context section if selected nodes context is provided
    const contextSection = request.selectedNodesContext ? `

**EXISTING FLOW CONTEXT**:
You are adding to an existing flow. Here's the context from currently selected nodes and their children:

${request.selectedNodesContext}

Consider this existing context when generating the new flow. You may:
- Extend or complement the existing nodes
- Create workflows that integrate with the existing structure
- Build upon the data and processing patterns already established
- Reference existing node types and patterns for consistency

` : '';
    
    return `You are a flow generation AI that creates complete Agentic Content Flow configurations. Generate a UNIQUE and CREATIVE flow based on this description:

**User Request**: "${request.description}"
${contextSection}
**CRITICAL SYSTEM CONSTRAINTS**:
1. VALID NODE TYPES ONLY: ${validNodeTypesString}
2. VALID HANDLE POSITIONS ONLY: ${validHandlesString}
3. Output ONLY valid JSON - no code blocks, no markdown, no explanations
4. Use position-based handles (top, bottom, left, right) - NOT generic identifiers

**NODE TYPE USAGE GUIDE**:
- restnode: REST API calls, HTTP requests, external service integration
- contentnode: Display content, UI components, data visualization
- logicalnode: Data processing, filtering, transformation, calculations
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
  }

  /**
   * Attempt AI self-correction of validation errors
   */
  private async attemptAISelfCorrection(
    invalidFlow: GeneratedFlow, 
    validationResult: ValidationResult, 
    request: FlowGenerationRequest
  ): Promise<GeneratedFlow | null> {
    try {
      console.log('🤖 Attempting AI self-correction...');
      
      // Build a self-correction prompt
      const correctionPrompt = this.buildSelfCorrectionPrompt(invalidFlow, validationResult, request);
      
      // Call AI service for correction
      const correctedFlowData = await this.callAIService(correctionPrompt);
      const correctedFlow = this.parseGeneratedFlow(correctedFlowData, request);
      
      // Validate the corrected flow
      const revalidation = FlowValidationService.validateAndCorrect(correctedFlow, request);
      
      if (revalidation.isValid || revalidation.correctedFlow) {
        return revalidation.correctedFlow || correctedFlow;
      }
      
    } catch (error) {
      console.error('AI self-correction failed:', error);
    }
    
    return null;
  }

  /**
   * Build a self-correction prompt
   */
  private buildSelfCorrectionPrompt(
    invalidFlow: GeneratedFlow, 
    validationResult: ValidationResult, 
    request: FlowGenerationRequest
  ): string {
    const errorsList = validationResult.errors.map(e => `- ${e.message}${e.suggestedFix ? ` (Fix: ${e.suggestedFix})` : ''}`).join('\n');
    
    return `Fix the following validation errors in this flow:

**Original Request**: "${request.description}"

**Validation Errors**:
${errorsList}

**CRITICAL FIXES NEEDED**:
1. Replace invalid node types with: ${VALID_NODE_TYPES.join(', ')}
2. Use only these handle positions: ${VALID_HANDLE_POSITIONS.join(', ')}
3. Ensure all node IDs and edge references are correct

**Invalid Flow to Fix**:
${JSON.stringify(invalidFlow, null, 2)}

Return ONLY the corrected JSON flow - no explanations, no markdown, just valid JSON that fixes all the errors above.`;
  }

  private async callAIService(prompt: string): Promise<any> {
    try {
      // Check if we have any configured LLM providers
      const availableProviders = this.orchestrator.getAvailableProviders();
      const configuredProvider = availableProviders.find(p => p.configured);
      
      if (!configuredProvider) {
        console.warn('No LLM providers configured, falling back to sample flows');
        return this.generateSampleFlow(prompt);
      }

      console.log('🤖 Calling LLM service for flow generation...');
      
      // BYPASS the orchestrator's prompt building system for flow generation
      // We need to call the LLM directly with our custom JSON prompt
      const { LLMProviderFactory } = await import('../../Process/Generation/LLMProviders');
      const { apiKeyManager } = await import('../../Process/Generation/APIKeyManager');
      
      const config = apiKeyManager.getConfig(configuredProvider.provider);
      if (!config) {
        throw new Error(`No valid configuration for ${configuredProvider.provider}`);
      }

      // Create LLM provider instance and call directly with our JSON prompt
      const llmProvider = LLMProviderFactory.createProvider(configuredProvider.provider);
      const result = await llmProvider.generateCode({
        prompt: prompt, // Our custom JSON prompt, not the JavaScript function prompt
        nodeType: 'flow',
        nodeId: 'flow-generation',
        config
      });

      console.log('🎯 LLM Response for flow generation:', {
        codeLength: result.code.length,
        provider: result.provider,
        confidence: result.confidence
      });

      if (result && result.code) {
        try {
          // Try to parse the generated code as JSON
          const flowData = JSON.parse(result.code);
          console.log('✅ Successfully parsed LLM response as JSON flow');
          return flowData;
        } catch (parseError) {
          console.warn('Failed to parse LLM response as JSON, response was:', result.code.substring(0, 200) + '...');
          console.warn('Parse error:', parseError);
          console.log('Falling back to sample flow generation');
          return this.generateSampleFlow(prompt);
        }
      } else {
        console.warn('LLM generation failed, falling back to sample flow');
        return this.generateSampleFlow(prompt);
      }
      
    } catch (error) {
      console.error('Error calling AI service:', error);
      console.log('Falling back to sample flow generation');
      return this.generateSampleFlow(prompt);
    }
  }

  private generateSampleFlow(prompt: string): any {
    // Enhanced pattern matching with randomization for more variety
    const description = prompt.toLowerCase();
    const randomVariation = Math.floor(Math.random() * 3); // 0, 1, or 2 for variation
    
    // Check for user-specific requests first
    if (description.includes('user') && description.includes('two nodes')) {
      return this.generateSimpleUserFlow();
    } else if (description.includes('todo') || description.includes('task')) {
      return this.generateTodoFlow(randomVariation);
    } else if (description.includes('weather') || description.includes('forecast')) {
      return this.generateWeatherFlow(randomVariation);
    } else if (description.includes('ecommerce') || description.includes('product') || description.includes('shop')) {
      return this.generateEcommerceFlow(randomVariation);
    } else if (description.includes('social') || description.includes('media') || description.includes('post')) {
      return this.generateSocialMediaFlow(randomVariation);
    } else if (description.includes('finance') || description.includes('money') || description.includes('payment')) {
      return this.generateFinanceFlow(randomVariation);
    } else if (description.includes('recipe') || description.includes('food') || description.includes('cooking')) {
      return this.generateRecipeFlow(randomVariation);
    } else {
      // Generate a random themed flow instead of always using the same example
      const themes = ['social', 'finance', 'recipe', 'weather', 'ecommerce'];
      const randomTheme = themes[Math.floor(Math.random() * themes.length)];
      return this.generateThemeBasedFlow(randomTheme, randomVariation, prompt);
    }
  }

  private generateSimpleUserFlow(): any {
    return {
      nodes: [
        {
          id: 'fetch-users',
          type: 'restnode',
          position: { x: 100, y: 100 },
          data: {
            expanded: true,
            depth: 0,
            isParent: false,
            instanceData: {
              label: 'Fetch Users',
              details: 'Get all users from API'
            },
            templateData: {
              method: 'GET',
              url: 'https://jsonplaceholder.typicode.com/users',
              headers: { 'Content-Type': 'application/json' },
              authentication: 'none'
            },
            instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 fetching users');
  try {
    const response = await fetch(nodeData.url, { 
      method: nodeData.method, 
      headers: nodeData.headers 
    });
    const users = await response.json();
    console.log(\`✅ Fetched \${users.length} users\`);
    return { 
      data: users, 
      metadata: { 
        count: users.length, 
        processedAt: new Date().toISOString(), 
        nodeType: 'restnode' 
      } 
    };
  } catch (error) {
    console.error('❌ Failed to fetch users:', error);
    throw error;
  }
}`
          }
        },
        {
          id: 'display-users',
          type: 'contentnode',
          position: { x: 500, y: 100 },
          data: {
            expanded: true,
            depth: 0,
            isParent: false,
            instanceData: {
              label: 'Display Users',
              details: 'Show users in a formatted list'
            },
            templateData: {
              displayType: 'list',
              listConfig: { 
                itemTemplate: { 
                  title: '{{name}}', 
                  subtitle: '{{email}} - {{website}}' 
                }, 
                maxItems: 50,
                showSearch: true
              }
            },
            instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 displaying users');
  try {
    const users = incomingData.data || incomingData;
    const formatted = users.map(user => ({ 
      id: user.id, 
      name: user.name, 
      email: user.email,
      website: user.website,
      company: user.company?.name
    }));
    console.log(\`📋 Formatted \${formatted.length} users for display\`);
    return { 
      data: formatted, 
      displayConfig: { 
        type: 'list', 
        title: 'All Users', 
        subtitle: \`\${formatted.length} users found\` 
      }, 
      metadata: { 
        userCount: formatted.length,
        processedAt: new Date().toISOString(), 
        nodeType: 'contentnode' 
      } 
    };
  } catch (error) {
    console.error('❌ User display failed:', error);
    throw error;
  }
}`
          }
        }
      ],
      edges: [
        { 
          id: 'e1', 
          source: 'fetch-users', 
          target: 'display-users', 
          type: 'package', 
          sourceHandle: 'right', 
          targetHandle: 'left' 
        }
      ],
      description: 'Simple user fetching and display flow',
      flowType: 'user-management',
      complexity: 'simple',
      features: ['User API fetching', 'User display', 'Simple two-node flow']
    };
  }

  private generateTodoFlow(_: number): any {
    // Variations for todo flow
    return {
      nodes: [
        {
          id: 'invisible-container',
          type: 'invisiblenode',
          position: { x: 0, y: 0 },
          data: { label: 'Todo Flow', layoutDirection: 'LR', isContainer: true, expanded: true },
          style: { width: 1200, height: 250 }
        },
        {
          id: 'fetch-todos',
          type: 'restnode',
          parentId: 'invisible-container',
          extent: 'parent',
          position: { x: 50, y: 100 },
          data: {
            expanded: true, depth: 0, isParent: false,
            instanceData: { label: 'Fetch Todos', details: 'Get all todo items from API' },
            templateData: {
              method: 'GET',
              url: 'https://jsonplaceholder.typicode.com/todos',
              headers: { 'Content-Type': 'application/json' },
              authentication: 'none'
            },
            instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 fetching todos');
  try {
    const response = await fetch(nodeData.url, { method: nodeData.method, headers: nodeData.headers });
    const todos = await response.json();
    console.log(\`✅ Fetched \${todos.length} todos\`);
    return { data: todos, metadata: { count: todos.length, processedAt: new Date().toISOString(), nodeType: 'restnode' } };
  } catch (error) {
    console.error('❌ Failed to fetch todos:', error);
    throw error;
  }
}`
          }
        },
        {
          id: 'filter-pending',
          type: 'logicalnode',
          parentId: 'invisible-container',
          extent: 'parent',
          position: { x: 350, y: 100 },
          data: {
            expanded: true, depth: 0, isParent: false,
            instanceData: { label: 'Filter Pending', details: 'Filter incomplete todo items' },
            templateData: { operation: 'filter' },
            instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 filtering pending todos');
  try {
    const todos = incomingData.data || incomingData;
    const pending = todos.filter(todo => !todo.completed);
    console.log(\`Filtered \${todos.length} todos down to \${pending.length} pending\`);
    return { data: pending, metadata: { originalCount: todos.length, filteredCount: pending.length, processedAt: new Date().toISOString(), nodeType: 'logicalnode' } };
  } catch (error) {
    console.error('❌ Filter failed:', error);
    throw error;
  }
}`
          }
        },
        {
          id: 'check-workload',
          type: 'conditionalnode',
          parentId: 'invisible-container',
          extent: 'parent',
          position: { x: 650, y: 100 },
          data: {
            expanded: true, depth: 0, isParent: false,
            instanceData: { label: 'Check Workload', details: 'Route based on number of pending tasks' },
            templateData: { condition: 'data.length > 10', conditionType: 'greater' },
            instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 checking workload');
  try {
    const todos = incomingData.data || incomingData;
    const result = todos.length > 10;
    const highWorkloadTargets = ['todo-dashboard'];
    const lowWorkloadTargets = ['add-todo'];
    console.log(\`Workload check: \${todos.length} todos, routing to \${result ? 'dashboard' : 'add todo'}\`);
    return { data: incomingData, targets: result ? highWorkloadTargets : lowWorkloadTargets, conditionResult: result, metadata: { todoCount: todos.length, processedAt: new Date().toISOString(), nodeType: 'conditionalnode' } };
  } catch (error) {
    console.error('❌ Workload check failed:', error);
    throw error;
  }
}`
          }
        },
        {
          id: 'todo-dashboard',
          type: 'contentnode',
          parentId: 'invisible-container',
          extent: 'parent',
          position: { x: 950, y: 50 },
          data: {
            expanded: true, depth: 0, isParent: false,
            instanceData: { label: 'Todo Dashboard', details: 'Display pending todos in organized view' },
            templateData: { displayType: 'list', listConfig: { itemTemplate: { title: '{{title}}', subtitle: 'User: {{userId}}' }, maxItems: 20, showSearch: true } },
            instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 displaying todo dashboard');
  try {
    const todos = incomingData.data || incomingData;
    const formatted = todos.map(todo => ({ id: todo.id, title: todo.title, userId: todo.userId, completed: todo.completed }));
    console.log(\`📊 Formatted \${formatted.length} todos for dashboard\`);
    return { data: formatted, displayConfig: { type: 'list', title: 'Pending Todos', subtitle: \`\${formatted.length} tasks remaining\` }, metadata: { todoCount: formatted.length, processedAt: new Date().toISOString(), nodeType: 'contentnode' } };
  } catch (error) {
    console.error('❌ Dashboard failed:', error);
    throw error;
  }
}`
          }
        },
        {
          id: 'add-todo',
          type: 'restnode',
          parentId: 'invisible-container',
          extent: 'parent',
          position: { x: 950, y: 150 },
          data: {
            expanded: true, depth: 0, isParent: false,
            instanceData: { label: 'Add Todo', details: 'Create a new todo item' },
            templateData: { method: 'POST', url: 'https://jsonplaceholder.typicode.com/todos', headers: { 'Content-Type': 'application/json' }, body: { title: 'New important task', userId: 1, completed: false } },
            instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 adding new todo');
  try {
    const existingTodos = incomingData.data || [];
    const newTodo = { ...nodeData.body, title: \`Task #\${existingTodos.length + 1}: Important work\` };
    const response = await fetch(nodeData.url, { method: nodeData.method, headers: nodeData.headers, body: JSON.stringify(newTodo) });
    const result = await response.json();
    console.log(\`✅ Added new todo with ID: \${result.id}\`);
    return { data: { newTodo: result, existingCount: existingTodos.length }, metadata: { action: 'todo_added', todoId: result.id, processedAt: new Date().toISOString(), nodeType: 'restnode' } };
  } catch (error) {
    console.error('❌ Add todo failed:', error);
    throw error;
  }
}`
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'fetch-todos', target: 'filter-pending', type: 'package', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'e2', source: 'filter-pending', target: 'check-workload', type: 'package', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'e3', source: 'check-workload', target: 'todo-dashboard', type: 'package', sourceHandle: 'right', targetHandle: 'left', data: { routingCondition: 'true' } },
        { id: 'e4', source: 'check-workload', target: 'add-todo', type: 'package', sourceHandle: 'right', targetHandle: 'left', data: { routingCondition: 'false' } }
      ],
      description: 'Todo management flow with workload-based routing',
      flowType: 'task-management',
      complexity: 'simple',
      features: ['API data fetching', 'Task filtering', 'Conditional routing', 'Dashboard display', 'Task creation']
    };
  }

  private generateWeatherFlow(_: number): any {
    // Similar structure for weather flow...
    return completeFlowExample; // Simplified for now
  }

  private generateEcommerceFlow(_: number): any {
    // Similar structure for ecommerce flow...
    return completeFlowExample; // Simplified for now
  }

  private generateSocialMediaFlow(_: number): any {
    // Themed flow for social media analytics
    return {
      nodes: [
        {
          id: 'invisible-container',
          type: 'invisiblenode',
          position: { x: 0, y: 0 },
          data: { label: 'Social Media Analytics', layoutDirection: 'LR', isContainer: true, expanded: true },
          style: { width: 1200, height: 300 }
        },
        {
          id: 'fetch-posts',
          type: 'restnode',
          parentId: 'invisible-container',
          extent: 'parent',
          position: { x: 50, y: 100 },
          data: {
            expanded: true, depth: 0, isParent: false,
            instanceData: { label: 'Fetch Posts', details: 'Get social media posts from API' },
            templateData: {
              method: 'GET',
              url: 'https://jsonplaceholder.typicode.com/posts',
              headers: { 'Content-Type': 'application/json' },
              authentication: 'none'
            },
            instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 fetching social media posts');
  try {
    const response = await fetch(nodeData.url, { method: nodeData.method, headers: nodeData.headers });
    const posts = await response.json();
    console.log(\`✅ Fetched \${posts.length} posts\`);
    return { data: posts, metadata: { count: posts.length, processedAt: new Date().toISOString(), nodeType: 'restnode' } };
  } catch (error) {
    console.error('❌ Failed to fetch posts:', error);
    throw error;
  }
}`
          }
        },
        {
          id: 'analyze-engagement',
          type: 'logicalnode',
          parentId: 'invisible-container',
          extent: 'parent',
          position: { x: 350, y: 100 },
          data: {
            expanded: true, depth: 0, isParent: false,
            instanceData: { label: 'Analyze Engagement', details: 'Analyze post engagement metrics' },
            templateData: { operation: 'aggregate' },
            instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 analyzing engagement metrics');
  try {
    const posts = incomingData.data || incomingData;
    const totalEngagement = posts.reduce((sum, post) => sum + (post.likes || 0) + (post.shares || 0), 0);
    console.log(\`Total engagement calculated: \${totalEngagement}\`);
    return { data: { totalEngagement }, metadata: { processedAt: new Date().toISOString(), nodeType: 'logicalnode' } };
  } catch (error) {
    console.error('❌ Engagement analysis failed:', error);
    throw error;
  }
}`
          }
        },
        {
          id: 'check-trending',
          type: 'conditionalnode',
          parentId: 'invisible-container',
          extent: 'parent',
          position: { x: 650, y: 100 },
          data: {
            expanded: true, depth: 0, isParent: false,
            instanceData: { label: 'Check Trending', details: 'Determine if posts are trending' },
            templateData: { condition: 'data.totalEngagement > 100', conditionType: 'greater' },
            instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 checking if posts are trending');
  try {
    const { totalEngagement } = incomingData.data || {};
    const isTrending = totalEngagement > 100;
    const trendingTargets = ['trending-dashboard'];
    const normalTargets = ['regular-dashboard'];
    console.log(\`Trending check: \${totalEngagement} engagement, routing to \${isTrending ? 'trending dashboard' : 'regular dashboard'}\`);
    return { data: incomingData, targets: isTrending ? trendingTargets : normalTargets, conditionResult: isTrending, metadata: { processedAt: new Date().toISOString(), nodeType: 'conditionalnode' } };
  } catch (error) {
    console.error('❌ Trending check failed:', error);
    throw error;
  }
}`
          }
        },
        {
          id: 'trending-dashboard',
          type: 'contentnode',
          parentId: 'invisible-container',
          extent: 'parent',
          position: { x: 950, y: 50 },
          data: {
            expanded: true, depth: 0, isParent: false,
            instanceData: { label: 'Trending Dashboard', details: 'Display trending posts' },
            templateData: { displayType: 'grid', gridConfig: { columnCount: 3, rowHeight: 200 } },
            instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 displaying trending dashboard');
  try {
    const posts = incomingData.data || incomingData;
    const formatted = posts.map(post => ({ id: post.id, title: post.title, engagement: post.likes + post.shares }));
    console.log(\`📊 Formatted \${formatted.length} trending posts for dashboard\`);
    return { data: formatted, displayConfig: { type: 'grid', title: 'Trending Posts', subtitle: \`\${formatted.length} posts trending\` }, metadata: { processedAt: new Date().toISOString(), nodeType: 'contentnode' } };
  } catch (error) {
    console.error('❌ Trending dashboard failed:', error);
    throw error;
  }
}`
          }
        },
        {
          id: 'regular-dashboard',
          type: 'contentnode',
          parentId: 'invisible-container',
          extent: 'parent',
          position: { x: 950, y: 150 },
          data: {
            expanded: true, depth: 0, isParent: false,
            instanceData: { label: 'Regular Dashboard', details: 'Display all posts' },
            templateData: { displayType: 'list', listConfig: { itemTemplate: { title: '{{title}}', subtitle: 'Engagement: {{engagement}}' }, maxItems: 50 } },
            instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 displaying regular dashboard');
  try {
    const posts = incomingData.data || incomingData;
    const formatted = posts.map(post => ({ id: post.id, title: post.title, engagement: post.likes + post.shares }));
    console.log(\`📋 Formatted \${formatted.length} posts for regular view\`);
    return { data: formatted, displayConfig: { type: 'list', title: 'All Posts', subtitle: \`\${formatted.length} posts available\` }, metadata: { processedAt: new Date().toISOString(), nodeType: 'contentnode' } };
  } catch (error) {
    console.error('❌ Regular dashboard failed:', error);
    throw error;
  }
}`
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'fetch-posts', target: 'analyze-engagement', type: 'package', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'e2', source: 'analyze-engagement', target: 'check-trending', type: 'package', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'e3', source: 'check-trending', target: 'trending-dashboard', type: 'package', sourceHandle: 'right', targetHandle: 'left', data: { routingCondition: 'true' } },
        { id: 'e4', source: 'check-trending', target: 'regular-dashboard', type: 'package', sourceHandle: 'right', targetHandle: 'left', data: { routingCondition: 'false' } }
      ],
      description: 'Social media analytics flow with engagement tracking',
      flowType: 'social-media',
      complexity: 'intermediate',
      features: ['API data fetching', 'Engagement analysis', 'Conditional routing', 'Dashboard display']
    };
  }

  private generateFinanceFlow(_: number): any {
    // Themed flow for financial data processing
    return {
      nodes: [
        {
          id: 'invisible-container',
          type: 'invisiblenode',
          position: { x: 0, y: 0 },
          data: { label: 'Finance Data Processing', layoutDirection: 'LR', isContainer: true, expanded: true },
          style: { width: 1200, height: 300 }
        },
        {
          id: 'fetch-transactions',
          type: 'restnode',
          parentId: 'invisible-container',
          extent: 'parent',
          position: { x: 50, y: 100 },
          data: {
            expanded: true, depth: 0, isParent: false,
            instanceData: { label: 'Fetch Transactions', details: 'Get financial transactions from API' },
            templateData: {
              method: 'GET',
              url: 'https://jsonplaceholder.typicode.com/posts', // Placeholder URL
              headers: { 'Content-Type': 'application/json' },
              authentication: 'none'
            },
            instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 fetching financial transactions');
  try {
    const response = await fetch(nodeData.url, { method: nodeData.method, headers: nodeData.headers });
    const transactions = await response.json();
    console.log(\`✅ Fetched \${transactions.length} transactions\`);
    return { data: transactions, metadata: { count: transactions.length, processedAt: new Date().toISOString(), nodeType: 'restnode' } };
  } catch (error) {
    console.error('❌ Failed to fetch transactions:', error);
    throw error;
  }
}`
          }
        },
        {
          id: 'calculate-risk',
          type: 'logicalnode',
          parentId: 'invisible-container',
          extent: 'parent',
          position: { x: 350, y: 100 },
          data: {
            expanded: true, depth: 0, isParent: false,
            instanceData: { label: 'Calculate Risk', details: 'Analyze transactions for risk assessment' },
            templateData: { operation: 'risk-analysis' },
            instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 calculating risk for transactions');
  try {
    const transactions = incomingData.data || incomingData;
    const highRisk = transactions.filter(tx => tx.amount > 1000); // Example condition
    console.log(\`Identified \${highRisk.length} high-risk transactions\`);
    return { data: highRisk, metadata: { processedAt: new Date().toISOString(), nodeType: 'logicalnode' } };
  } catch (error) {
    console.error('❌ Risk calculation failed:', error);
    throw error;
  }
}`
          }
        },
        {
          id: 'notify-user',
          type: 'conditionalnode',
          parentId: 'invisible-container',
          extent: 'parent',
          position: { x: 650, y: 100 },
          data: {
            expanded: true, depth: 0, isParent: false,
            instanceData: { label: 'Notify User', details: 'Send notification for high-risk transactions' },
            templateData: { condition: 'data.length > 0', conditionType: 'greater' },
            instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 notifying user of high-risk transactions');
  try {
    const transactions = incomingData.data || incomingData;
    const hasHighRisk = transactions.length > 0;
    const notifyTargets = ['send-notification'];
    console.log(\`Notification check: \${transactions.length} transactions, routing to \${hasHighRisk ? 'notification' : 'end'}\`);
    return { data: incomingData, targets: hasHighRisk ? notifyTargets : [], conditionResult: hasHighRisk, metadata: { processedAt: new Date().toISOString(), nodeType: 'conditionalnode' } };
  } catch (error) {
    console.error('❌ Notification check failed:', error);
    throw error;
  }
}`
          }
        },
        {
          id: 'send-notification',
          type: 'restnode',
          parentId: 'invisible-container',
          extent: 'parent',
          position: { x: 950, y: 100 },
          data: {
            expanded: true, depth: 0, isParent: false,
            instanceData: { label: 'Send Notification', details: 'Send alert for high-risk transaction' },
            templateData: {
              method: 'POST',
              url: 'https://jsonplaceholder.typicode.com/posts', // Placeholder URL
              headers: { 'Content-Type': 'application/json' },
              body: { title: 'High-risk transaction detected', body: 'A transaction exceeding the threshold has been detected.' }
            },
            instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 sending notification for high-risk transaction');
  try {
    const response = await fetch(nodeData.url, { method: nodeData.method, headers: nodeData.headers, body: JSON.stringify(nodeData.body) });
    const result = await response.json();
    console.log(\`✅ Notification sent: \${result.title}\`);
    return { data: result, metadata: { action: 'notification_sent', processedAt: new Date().toISOString(), nodeType: 'restnode' } };
  } catch (error) {
    console.error('❌ Send notification failed:', error);
    throw error;
  }
}`
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'fetch-transactions', target: 'calculate-risk', type: 'package', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'e2', source: 'calculate-risk', target: 'notify-user', type: 'package', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'e3', source: 'notify-user', target: 'send-notification', type: 'package', sourceHandle: 'right', targetHandle: 'left', data: { routingCondition: 'true' } }
      ],
      description: 'Financial data processing flow with risk analysis',
      flowType: 'finance',
      complexity: 'advanced',
      features: ['API data fetching', 'Risk analysis', 'Conditional notifications']
    };
  }

  private generateRecipeFlow(_: number): any {
    // Themed flow for recipe and nutrition data processing
    return {
      nodes: [
        {
          id: 'invisible-container',
          type: 'invisiblenode',
          position: { x: 0, y: 0 },
          data: { label: 'Recipe Data Processing', layoutDirection: 'LR', isContainer: true, expanded: true },
          style: { width: 1200, height: 300 }
        },
        {
          id: 'fetch-recipes',
          type: 'restnode',
          parentId: 'invisible-container',
          extent: 'parent',
          position: { x: 50, y: 100 },
          data: {
            expanded: true, depth: 0, isParent: false,
            instanceData: { label: 'Fetch Recipes', details: 'Get recipe data from API' },
            templateData: {
              method: 'GET',
              url: 'https://jsonplaceholder.typicode.com/posts', // Placeholder URL
              headers: { 'Content-Type': 'application/json' },
              authentication: 'none'
            },
            instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 fetching recipe data');
  try {
    const response = await fetch(nodeData.url, { method: nodeData.method, headers: nodeData.headers });
    const recipes = await response.json();
    console.log(\`✅ Fetched \${recipes.length} recipes\`);
    return { data: recipes, metadata: { count: recipes.length, processedAt: new Date().toISOString(), nodeType: 'restnode' } };
  } catch (error) {
    console.error('❌ Failed to fetch recipes:', error);
    throw error;
  }
}`
          }
        },
        {
          id: 'analyze-nutrition',
          type: 'logicalnode',
          parentId: 'invisible-container',
          extent: 'parent',
          position: { x: 350, y: 100 },
          data: {
            expanded: true, depth: 0, isParent: false,
            instanceData: { label: 'Analyze Nutrition', details: 'Analyze nutritional information of recipes' },
            templateData: { operation: 'nutrition-analysis' },
            instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 analyzing nutrition information');
  try {
    const recipes = incomingData.data || incomingData;
    const enrichedRecipes = recipes.map(recipe => ({ ...recipe, calories: recipe.ingredients.length * 50 })); // Example enrichment
    console.log(\`Enriched \${enrichedRecipes.length} recipes with calorie information\`);
    return { data: enrichedRecipes, metadata: { processedAt: new Date().toISOString(), nodeType: 'logicalnode' } };
  } catch (error) {
    console.error('❌ Nutrition analysis failed:', error);
    throw error;
  }
}`
          }
        },
        {
          id: 'filter-vegetarian',
          type: 'conditionalnode',
          parentId: 'invisible-container',
          extent: 'parent',
          position: { x: 650, y: 100 },
          data: {
            expanded: true, depth: 0, isParent: false,
            instanceData: { label: 'Filter Vegetarian', details: 'Filter recipes based on dietary preference' },
            templateData: { condition: 'data.dietary === "vegetarian"', conditionType: 'equals' },
            instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 filtering recipes by dietary preference');
  try {
    const recipes = incomingData.data || incomingData;
    const filtered = recipes.filter(recipe => recipe.dietary === 'vegetarian');
    console.log(\`Filtered \${recipes.length} recipes down to \${filtered.length} vegetarian recipes\`);
    return { data: filtered, metadata: { originalCount: recipes.length, filteredCount: filtered.length, processedAt: new Date().toISOString(), nodeType: 'logicalnode' } };
  } catch (error) {
    console.error('❌ Filter by dietary preference failed:', error);
    throw error;
  }
}`
          }
        },
        {
          id: 'recipe-dashboard',
          type: 'contentnode',
          parentId: 'invisible-container',
          extent: 'parent',
          position: { x: 950, y: 50 },
          data: {
            expanded: true, depth: 0, isParent: false,
            instanceData: { label: 'Recipe Dashboard', details: 'Display recipes in a dashboard' },
            templateData: { displayType: 'grid', gridConfig: { columnCount: 3, rowHeight: 200 } },
            instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 displaying recipe dashboard');
  try {
    const recipes = incomingData.data || incomingData;
    const formatted = recipes.map(recipe => ({ id: recipe.id, title: recipe.title, calories: recipe.calories }));
    console.log(\`📊 Formatted \${formatted.length} recipes for dashboard\`);
    return { data: formatted, displayConfig: { type: 'grid', title: 'Recipes', subtitle: \`\${formatted.length} recipes available\` }, metadata: { processedAt: new Date().toISOString(), nodeType: 'contentnode' } };
  } catch (error) {
    console.error('❌ Recipe dashboard failed:', error);
    throw error;
  }
}`
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'fetch-recipes', target: 'analyze-nutrition', type: 'package', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'e2', source: 'analyze-nutrition', target: 'filter-vegetarian', type: 'package', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'e3', source: 'filter-vegetarian', target: 'recipe-dashboard', type: 'package', sourceHandle: 'right', targetHandle: 'left', data: { routingCondition: 'true' } }
      ],
      description: 'Recipe data processing flow with nutrition analysis',
      flowType: 'recipe',
      complexity: 'intermediate',
      features: ['API data fetching', 'Nutrition analysis', 'Dietary filtering', 'Dashboard display']
    };
  }

  private generateThemeBasedFlow(theme: string, _variation: number, prompt: string): any {
    // Generate a flow based on a random theme with slight variations
    const baseDescription = `This flow is themed around ${theme}. It should include creative data processing and API integration based on the theme.`;
    const themedPrompt = `${baseDescription} ${prompt}`;
    
    // Use the existing flow generation logic with the new prompt
    return this.callAIService(themedPrompt);
  }

  private parseGeneratedFlow(generatedData: any, request: FlowGenerationRequest): GeneratedFlow {
    return {
      nodes: generatedData.nodes || [],
      edges: generatedData.edges || [],
      description: generatedData.description || request.description,
      metadata: {
        generatedAt: new Date().toISOString(),
        complexity: request.complexity || 'intermediate',
        nodeCount: generatedData.nodes?.length || 0,
        edgeCount: generatedData.edges?.length || 0
      }
    };
  }
}