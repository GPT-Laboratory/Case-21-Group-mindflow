import { Node, Edge } from '@xyflow/react';

export const apiFlowNodesData: Node[] = [
  {
    id: 'invisible-lr-rest', // ID for the container
    type: 'invisiblenode',
    position: { x: 0, y: 0 }, // Initial position doesn't matter, layout will set it
    data: {
      label: 'LR Container',
      // *** Set data property to tell getContainerLayoutDirection this should be LR ***
      layoutDirection: 'LR', // Your getContainerLayoutDirection helper should look for this
      isContainer: true, // Or use a type check in isContainer
      expanded: true

    },
    style: { width: 300, height: 100 }, // Container needs initial dimensions for rendering
  },
  {
    id: 'api-request',
    type: 'restnode',
    parentId: 'invisible-lr-rest',
    extent: 'parent',
    position: { x: 100, y: 100 },
    data: {
      expanded: true,
      depth: 0,
      isParent: false,
      instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
        // Instance-specific implementation for fetching posts
        const response = await fetch(nodeData.url, {
          method: nodeData.method,
          headers: nodeData.headers,
          signal: AbortSignal.timeout(nodeData.timeout || 30000)
        });
        
        if (!response.ok) {
          throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
        }
        
        const data = await response.json();
        console.log('Fetched posts:', data.length);
        return { data, metadata: { source: 'jsonplaceholder', timestamp: new Date().toISOString() } };
      }`,
      instanceData: {
        label: 'Get Posts',
        details: 'Fetch posts from JSONPlaceholder API',
        retryAttempts: 5,
        timeout: 45000, 
      },
      templateData: {
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts',
        headers: {
          'Content-Type': 'application/json'
        },
        authentication: 'none'
      }
    },
  },
  {
    id: 'logic-processor',
    type: 'logicalnode',
    position: { x: 400, y: 100 },
    parentId: 'invisible-lr-rest',
    extent: 'parent',
    data: {
      depth: 0,
      isParent: false,
      expanded: true,
      instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
        // Instance-specific implementation for filtering posts
        const posts = incomingData.data || incomingData;
        
        const filtered = posts.filter(post => {
          return post.userId <= 5 && post.title.length > 10;
        });
        
        console.log(\`Filtered \${posts.length} posts down to \${filtered.length}\`);
        
        return {
          data: filtered,
          metadata: {
            originalCount: posts.length,
            filteredCount: filtered.length,
            rules: nodeData.rules,
            timestamp: new Date().toISOString()
          }
        };
      }`,
      instanceData: {
        label: 'Filter Active Posts',
        details: 'Filter posts based on criteria and transform data',
      },
      templateData: {
        operation: 'filter',
        // Legacy condition for backward compatibility
        condition: 'userId <= 5 && title.length > 10',
        // New structured logic rules
        logicRules: [
          {
            id: 'rule-1',
            field: 'userId',
            operator: '<=',
            value: 5,
            logicalOperator: 'AND'
          },
          {
            id: 'rule-2',
            field: 'title',
            operator: 'length>',
            value: 10
          }
        ],
        inputSchema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              userId: { type: 'number' },
              title: { type: 'string' },
              body: { type: 'string' }
            }
          }
        },
        outputSchema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              userId: { type: 'number' },
              title: { type: 'string' },
              body: { type: 'string' }
            }
          }
        },
        rules: [
          {
            name: 'userFilter',
            expression: 'post.userId <= 5',
            description: 'Only include posts from users 1-5'
          },
          {
            name: 'titleLength',
            expression: 'post.title.length > 10',
            description: 'Only include posts with meaningful titles'
          }
        ]
      }
    },
  },
  {
    id: 'posts-filter-condition',
    type: 'conditionalnode',
    parentId: 'invisible-lr-rest',
    extent: 'parent',
    position: { x: 700, y: 100 },
    data: {
      depth: 0,
      isParent: false,
      expanded: true,
      instanceData: {
        label: 'Check Post Count',
        details: 'Route based on number of filtered posts',
        subject: 'logic',
        nodeLevel: 'intermediate',
      },
      templateData: {
        condition: 'data.data.length > 3',
        conditionType: 'greater',
        leftValue: 'data.data.length',
        rightValue: '3'
      }
    }
  },
  {
    id: 'content-display',
    type: 'contentnode',
    parentId: 'invisible-lr-rest',
    extent: 'parent',
    position: { x: 1000, y: 50 },
    data: {
      depth: 0,
      isParent: false,
      expanded: true,
      instanceData: {
        label: 'Post List',
        details: 'Display filtered posts as a list component',
        // Enable manual approval mode
        requiresUserApproval: true,
        autoApprove: false
      },
      templateData: {
        displayType: 'list',
        listConfig: {
          itemTemplate: {
            title: '{{title}}',
            subtitle: '{{body}}',
            metadata: 'User: {{userId}} | ID: {{id}}'
          },
          maxItems: 10,
          showSearch: true,
          sortBy: 'title'
        },
        // Expected input schema for UI component
        expectedSchema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', required: true },
              title: { type: 'string', required: true },
              body: { type: 'string', required: true },
              userId: { type: 'number', required: true }
            }
          }
        }
      }
    }
  },
  {
    id: 'post-submission',
    type: 'restnode',
    parentId: 'invisible-lr-rest',
    extent: 'parent',
    position: { x: 1000, y: 150 },
    data: {
      depth: 0,
      expanded: true,
      isParent: false,
      instanceData: {
        label: 'Submit New Post',
        details: 'Create a new post via JSONPlaceholder API',
        retryAttempts: 1, // Override from template default of 3
      },
      templateData: {
        method: 'POST',
        url: 'https://jsonplaceholder.typicode.com/posts',
        authentication: 'none',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          title: 'New Post Title',
          body: 'New post content',
          userId: 1
        }
      }
    },
  },
  {
    id: 'final-processor',
    type: 'logicalnode',
    parentId: 'invisible-lr-rest',
    extent: 'parent',
    position: { x: 1300, y: 100 },
    data: {
      expanded: true,
      depth: 0,
      isParent: false,
      instanceData: {
        label: 'Final Results',
        details: 'Process and finalize the results from both paths',
      },
      templateData: {
        operation: 'transform'
      }
    }
  }
];

export const apiFlowEdgesData: Edge[] = [
  {
    id: 'edge-api-logic',
    source: 'api-request',
    target: 'logic-processor',
    type: 'package',
    sourceHandle: 'right',
    targetHandle: 'left'
  },
  // Connect logic processor to conditional node
  {
    id: 'edge-logic-condition',
    source: 'logic-processor',
    target: 'posts-filter-condition',
    type: 'package',
    sourceHandle: 'right',
    targetHandle: 'left'
  },
  // True path: enough posts -> display content
  {
    id: 'edge-condition-content-true',
    source: 'posts-filter-condition',
    target: 'content-display',
    type: 'package',
    sourceHandle: 'right',
    targetHandle: 'left',
    // NEW: Add routing metadata for conditional logic
    data: {
      routingCondition: 'true',
      description: 'Route when condition evaluates to true (>3 posts)'
    }
  },
  // False path: not enough posts -> skip to submission
  {
    id: 'edge-condition-post-false',
    source: 'posts-filter-condition',
    target: 'post-submission',
    type: 'package',
    sourceHandle: 'right',
    targetHandle: 'left',
    // NEW: Add routing metadata for conditional logic
    data: {
      routingCondition: 'false',
      description: 'Route when condition evaluates to false (≤3 posts)'
    }
  },
  // Both paths converge at final processor
  {
    id: 'edge-content-final',
    source: 'content-display',
    target: 'final-processor',
    type: 'package',
    sourceHandle: 'right',
    targetHandle: 'left'
  },
  {
    id: 'edge-post-final',
    source: 'post-submission',
    target: 'final-processor',
    type: 'package',
    sourceHandle: 'right',
    targetHandle: 'left'
  }
];