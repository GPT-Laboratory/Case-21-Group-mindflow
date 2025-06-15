import { Node, Edge } from '@xyflow/react';

export const completeFlowExampleNodes: Node[] = [
  {
    id: 'invisible-lr-container',
    type: 'invisiblenode',
    position: { x: 0, y: 0 },
    data: {
      label: 'Generated Flow Container',
      layoutDirection: 'LR',
      isContainer: true,
      expanded: true
    },
    style: { width: 1400, height: 300 },
  },
  {
    id: 'data-source',
    type: 'restnode',
    parentId: 'invisible-lr-container',
    extent: 'parent',
    position: { x: 50, y: 100 },
    data: {
      expanded: true,
      depth: 0,
      isParent: false,
      instanceData: {
        label: 'Fetch User Data',
        details: 'Retrieve user profiles from API endpoint',
      },
      templateData: {
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/users',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        authentication: 'none'
      },
      instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 restnode processing:', { nodeData });

  try {
    const { method, url, headers } = nodeData;
    
    console.log(\`📡 Making \${method} request to \${url}\`);
    
    const response = await fetch(url, {
      method,
      headers,
    });
    
    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
    }
    
    const data = await response.json();
    console.log(\`✅ Received \${data.length} users from API\`);
    
    return {
      data,
      metadata: {
        source: 'jsonplaceholder-users',
        count: data.length,
        processedAt: new Date().toISOString(),
        nodeType: 'restnode'
      }
    };

  } catch (error) {
    console.error('❌ restnode failed:', error);
    throw error;
  }
}`
    },
  },
  {
    id: 'data-filter',
    type: 'logicalnode',
    position: { x: 350, y: 100 },
    parentId: 'invisible-lr-container',
    extent: 'parent',
    data: {
      depth: 0,
      isParent: false,
      expanded: true,
      instanceData: {
        label: 'Filter Active Users',
        details: 'Filter users with valid email addresses and website',
      },
      templateData: {
        operation: 'filter'
      },
      instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 logicalnode processing:', { incomingData, nodeData });

  try {
    const users = incomingData.data || incomingData;
    
    // Filter users with valid email and website
    const activeUsers = users.filter(user => 
      user.email && 
      user.email.includes('@') && 
      user.website && 
      user.website.length > 0
    );
    
    console.log(\`Filtered \${users.length} users down to \${activeUsers.length} active users\`);
    
    return {
      data: activeUsers,
      metadata: {
        originalCount: users.length,
        filteredCount: activeUsers.length,
        filterCriteria: 'email and website required',
        processedAt: new Date().toISOString(),
        nodeType: 'logicalnode'
      }
    };

  } catch (error) {
    console.error('❌ logicalnode failed:', error);
    throw error;
  }
}`
    },
  },
  {
    id: 'user-count-check',
    type: 'conditionalnode',
    parentId: 'invisible-lr-container',
    extent: 'parent',
    position: { x: 650, y: 100 },
    data: {
      depth: 0,
      isParent: false,
      expanded: true,
      instanceData: {
        label: 'Check User Count',
        details: 'Route based on number of active users found',
      },
      templateData: {
        condition: 'data.length > 5',
        conditionType: 'greater'
      },
      instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 conditionalnode processing:', { incomingData, nodeData });

  try {
    const users = incomingData.data || incomingData;
    const condition = nodeData.condition;
    
    // Evaluate condition: more than 5 users?
    const result = users.length > 5;
    console.log(\`🎯 Condition "\${condition}" evaluated to: \${result}\`);
    
    // Get available targets
    const availableTargets = Array.from(targetMap.keys());
    console.log('Available targets:', availableTargets);
    
    // Define routing targets
    const manyUsersTargets = ['user-dashboard'];
    const fewUsersTargets = ['user-recruitment'];
    
    return {
      data: incomingData,
      targets: result ? manyUsersTargets : fewUsersTargets,
      conditionResult: result,
      metadata: {
        condition,
        userCount: users.length,
        evaluatedTo: result,
        selectedTargets: result ? manyUsersTargets : fewUsersTargets,
        processedAt: new Date().toISOString(),
        nodeType: 'conditionalnode'
      }
    };

  } catch (error) {
    console.error('❌ conditionalnode failed:', error);
    throw error;
  }
}`
    }
  },
  {
    id: 'user-dashboard',
    type: 'contentnode',
    parentId: 'invisible-lr-container',
    extent: 'parent',
    position: { x: 950, y: 50 },
    data: {
      depth: 0,
      isParent: false,
      expanded: true,
      instanceData: {
        label: 'User Dashboard',
        details: 'Display active users in a dashboard format',
      },
      templateData: {
        displayType: 'list',
        listConfig: {
          itemTemplate: {
            title: '{{name}}',
            subtitle: '{{email}}',
            metadata: 'Website: {{website}} | Company: {{company.name}}'
          },
          maxItems: 20,
          showSearch: true,
          sortBy: 'name'
        }
      },
      instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 contentnode processing:', { incomingData, nodeData });

  try {
    const users = incomingData.data || incomingData;
    const { displayType, listConfig } = nodeData;
    
    // Format users for dashboard display
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      website: user.website,
      company: user.company,
      address: user.address,
      phone: user.phone
    }));
    
    console.log(\`📊 Formatted \${formattedUsers.length} users for dashboard display\`);
    
    return {
      data: formattedUsers,
      displayConfig: {
        type: displayType,
        listConfig: listConfig,
        title: 'Active User Dashboard',
        subtitle: \`\${formattedUsers.length} active users found\`
      },
      metadata: {
        displayType,
        userCount: formattedUsers.length,
        processedAt: new Date().toISOString(),
        nodeType: 'contentnode'
      }
    };

  } catch (error) {
    console.error('❌ contentnode failed:', error);
    throw error;
  }
}`
    }
  },
  {
    id: 'user-recruitment',
    type: 'restnode',
    parentId: 'invisible-lr-container',
    extent: 'parent',
    position: { x: 950, y: 150 },
    data: {
      depth: 0,
      expanded: true,
      isParent: false,
      instanceData: {
        label: 'Create Recruitment Post',
        details: 'Create a new post to recruit more users',
      },
      templateData: {
        method: 'POST',
        url: 'https://jsonplaceholder.typicode.com/posts',
        authentication: 'none',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          title: 'User Recruitment Drive',
          body: 'We need more active users! Join our platform today.',
          userId: 1
        }
      },
      instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 restnode processing:', { incomingData, nodeData });

  try {
    const { method, url, headers, body } = nodeData;
    const users = incomingData.data || [];
    
    // Customize recruitment message based on current user count
    const recruitmentPost = {
      ...body,
      title: \`User Recruitment - Currently \${users.length} Active Users\`,
      body: \`We currently have \${users.length} active users. Join us to grow our community!\`
    };
    
    console.log(\`📝 Creating recruitment post: \${recruitmentPost.title}\`);
    
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(recruitmentPost)
    });
    
    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
    }
    
    const result = await response.json();
    console.log(\`✅ Recruitment post created with ID: \${result.id}\`);
    
    return {
      data: {
        post: result,
        currentUsers: users,
        recruitmentMessage: recruitmentPost
      },
      metadata: {
        action: 'recruitment_post_created',
        postId: result.id,
        currentUserCount: users.length,
        processedAt: new Date().toISOString(),
        nodeType: 'restnode'
      }
    };

  } catch (error) {
    console.error('❌ restnode failed:', error);
    throw error;
  }
}`
    },
  },
  {
    id: 'final-summary',
    type: 'logicalnode',
    parentId: 'invisible-lr-container',
    extent: 'parent',
    position: { x: 1250, y: 100 },
    data: {
      expanded: true,
      depth: 0,
      isParent: false,
      instanceData: {
        label: 'Flow Summary',
        details: 'Combine and summarize results from both paths',
      },
      templateData: {
        operation: 'transform'
      },
      instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔄 logicalnode processing:', { incomingData, nodeData });

  try {
    const data = incomingData.data || incomingData;
    
    // Determine what type of data we received
    let summary;
    if (data.post) {
      // Came from recruitment path
      summary = {
        path: 'recruitment',
        action: 'Created recruitment post',
        details: \`Post ID: \${data.post.id}, Current users: \${data.currentUsers.length}\`,
        userCount: data.currentUsers.length,
        outcome: 'recruitment_initiated'
      };
    } else if (Array.isArray(data)) {
      // Came from dashboard path
      summary = {
        path: 'dashboard',
        action: 'Displayed user dashboard',
        details: \`Showing \${data.length} active users\`,
        userCount: data.length,
        outcome: 'dashboard_displayed'
      };
    } else {
      summary = {
        path: 'unknown',
        action: 'Processed data',
        details: 'Data processed successfully',
        outcome: 'completed'
      };
    }
    
    console.log(\`📊 Flow completed via \${summary.path} path\`);
    
    return {
      data: {
        summary,
        originalData: data,
        flowCompleted: true
      },
      metadata: {
        flowPath: summary.path,
        finalOutcome: summary.outcome,
        processedAt: new Date().toISOString(),
        nodeType: 'logicalnode'
      }
    };

  } catch (error) {
    console.error('❌ logicalnode failed:', error);
    throw error;
  }
}`
    }
  }
];

export const completeFlowExampleEdges: Edge[] = [
  {
    id: 'edge-source-filter',
    source: 'data-source',
    target: 'data-filter',
    type: 'package',
    sourceHandle: 'right',
    targetHandle: 'left'
  },
  {
    id: 'edge-filter-condition',
    source: 'data-filter',
    target: 'user-count-check',
    type: 'package',
    sourceHandle: 'right',
    targetHandle: 'left'
  },
  {
    id: 'edge-condition-dashboard-true',
    source: 'user-count-check',
    target: 'user-dashboard',
    type: 'package',
    sourceHandle: 'right',
    targetHandle: 'left',
    data: {
      routingCondition: 'true',
      description: 'Route when many users found (>5)'
    }
  },
  {
    id: 'edge-condition-recruitment-false',
    source: 'user-count-check',
    target: 'user-recruitment',
    type: 'package',
    sourceHandle: 'right',
    targetHandle: 'left',
    data: {
      routingCondition: 'false',
      description: 'Route when few users found (≤5)'
    }
  },
  {
    id: 'edge-dashboard-summary',
    source: 'user-dashboard',
    target: 'final-summary',
    type: 'package',
    sourceHandle: 'right',
    targetHandle: 'left'
  },
  {
    id: 'edge-recruitment-summary',
    source: 'user-recruitment',
    target: 'final-summary',
    type: 'package',
    sourceHandle: 'right',
    targetHandle: 'left'
  }
];

// Export a complete flow example for AI training
export const completeFlowExample = {
  nodes: completeFlowExampleNodes,
  edges: completeFlowExampleEdges,
  description: 'Complete user management flow with data fetching, filtering, conditional routing, content display, API posting, and result summarization',
  flowType: 'user-management',
  complexity: 'intermediate',
  nodeTypes: ['restnode', 'logicalnode', 'conditionalnode', 'contentnode'],
  features: [
    'API data fetching',
    'Data filtering and transformation', 
    'Conditional routing based on data',
    'Content display formatting',
    'API posting with dynamic content',
    'Result summarization and flow completion'
  ]
};