import { Node, Edge } from '@xyflow/react';
import { completeFlowExample } from '../../test/generated/completeFlowExample';

export interface FlowGenerationRequest {
  description: string;
  complexity?: 'simple' | 'intermediate' | 'advanced';
  nodeTypes?: string[];
  features?: string[];
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
  /**
   * Generate a complete flow from a description
   */
  async generateFlow(request: FlowGenerationRequest): Promise<GeneratedFlow> {
    console.log('🎯 Generating flow from description:', request.description);

    try {
      // Build the prompt for AI generation
      const prompt = this.buildFlowGenerationPrompt(request);
      
      // Call AI service (placeholder - you can integrate with OpenAI, Claude, etc.)
      const generatedFlowData = await this.callAIService(prompt);
      
      // Parse and validate the generated flow
      const flow = this.parseGeneratedFlow(generatedFlowData, request);
      
      console.log('✅ Flow generated successfully:', {
        nodeCount: flow.nodes.length,
        edgeCount: flow.edges.length,
        complexity: flow.metadata.complexity
      });
      
      return flow;
      
    } catch (error) {
      console.error('❌ Flow generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to generate flow: ${errorMessage}`);
    }
  }

  private buildFlowGenerationPrompt(request: FlowGenerationRequest): string {
    return `Generate a UNIQUE and CREATIVE Agentic Content Flow based on this description:

**User Request**: "${request.description}"

**IMPORTANT - CREATIVITY REQUIREMENTS**:
- DO NOT copy the example structure exactly
- CREATE UNIQUE node arrangements and flow patterns  
- VARY the number of nodes (3-8 nodes depending on complexity)
- USE DIFFERENT positioning and layouts
- MIX different node types in creative ways
- CREATE ORIGINAL data flows and processing patterns

**Available Node Types**:
- **restnode**: API calls, data fetching, external integrations
- **logicalnode**: Data processing, filtering, transformation, aggregation
- **conditionalnode**: Decision making, routing, branching logic
- **contentnode**: Display formatting, UI rendering, data visualization
- **datanode**: Storage, caching, data persistence
- **pagenode**: Web page content, document generation

**Flow Pattern Variations** (pick ONE and make it unique):
1. **Linear Pipeline**: A→B→C→D (simple sequential processing)
2. **Branching Tree**: A→B splits to C&D, then merge to E
3. **Diamond Pattern**: A→B→(C|D)→E (conditional with merge)
4. **Parallel Processing**: A splits to B&C&D, then merge to E
5. **Feedback Loop**: A→B→C with C connecting back to A
6. **Hub & Spoke**: Central node connected to multiple endpoints
7. **Waterfall**: Multi-stage with validation gates between stages
8. **Pipeline with Sidechains**: Main flow with auxiliary processing branches

**Structural Diversity Requirements**:
- Position nodes in VARIED layouts (not just left-to-right)
- Use DIFFERENT container sizes (300-1500px width, 250-600px height)
- CREATE unique node spacing and arrangements
- RANDOMIZE which paths conditional nodes take
- VARY the complexity of instanceCode functions

**Data Theme Variations** (pick a DIFFERENT one from examples):
- Social media analytics and engagement tracking
- Financial data processing and risk analysis
- Healthcare patient data workflows
- Educational content management systems
- IoT sensor data collection and analysis
- Supply chain and inventory management
- Real estate property search and analysis
- Sports statistics and performance tracking
- Recipe and nutrition data processing
- Travel booking and itinerary management
- Event planning and coordination workflows
- Customer support ticket routing
- News aggregation and content curation
- Scientific data analysis pipelines
- Gaming leaderboards and achievement tracking

**Example Reference** (DO NOT COPY - USE FOR STRUCTURE ONLY):
${JSON.stringify(completeFlowExample, null, 2)}

**Key Implementation Rules**:
1. **REST Nodes**: Use REAL, working APIs (jsonplaceholder, public APIs)
2. **Logical Nodes**: Implement ACTUAL processing logic, not placeholders
3. **Conditional Nodes**: Use targets array for routing: {data, targets: ['node-id'], conditionResult: boolean}
4. **Content Nodes**: Format data for specific display types
5. **All instanceCode**: Must be complete, executable JavaScript functions

**Output Format**:
Return a JSON object with:
- nodes: Array with UNIQUE node arrangement
- edges: Array with CREATIVE connection patterns  
- description: What this SPECIFIC flow accomplishes
- flowType: Category that matches your theme
- complexity: simple/intermediate/advanced based on actual complexity
- features: Array of UNIQUE capabilities this flow provides

**CRITICAL**: Make this flow DIFFERENT from the examples. Be creative with the data flow, node positioning, and processing logic!`;
  }

  private async callAIService(prompt: string): Promise<any> {
    // For now, return a sample generated flow
    // In production, this would call OpenAI/Claude/etc.
    
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return a sample flow based on the prompt
    return this.generateSampleFlow(prompt);
  }

  private generateSampleFlow(prompt: string): any {
    // Enhanced pattern matching with randomization for more variety
    const description = prompt.toLowerCase();
    const randomVariation = Math.floor(Math.random() * 3); // 0, 1, or 2 for variation
    
    if (description.includes('todo') || description.includes('task')) {
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

  private generateTodoFlow(_: number): any {
    // Variations for todo flow
    const baseFlow = {
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

  private generateFinanceFlow(variation: number): any {
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

  private generateRecipeFlow(variation: number): any {
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

  private generateThemeBasedFlow(theme: string, variation: number, prompt: string): any {
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