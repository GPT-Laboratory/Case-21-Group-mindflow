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
    parentId: 'invisible-lr-rest', // Set the parentId to the container
    extent: 'parent',
    position: { x: 100, y: 100 },
    data: {
      label: 'Get Posts',
      details: 'Fetch posts from JSONPlaceholder API',
      subject: 'integration',
      nodeLevel: 'intermediate',
      expanded: true,
      depth: 0,
      isParent: false,
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts',
      authentication: 'none',
      timeout: 30000, // Fix: 30 seconds instead of 30ms
      retryAttempts: 3,
      headers: {
        'Content-Type': 'application/json'
      }
    },
  },
  {
    id: 'logic-processor',
    type: 'logicalnode',
    position: { x: 400, y: 100 },
    parentId: 'invisible-lr-rest', // Set the parentId to the container
    extent: 'parent',
    data: {
      label: 'Filter Active Posts',
      details: 'Filter posts based on criteria and transform data',
      subject: 'logic',
      nodeLevel: 'intermediate',
      expanded: true,
      depth: 0,
      isParent: false,
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
    },
  },
  {
    id: 'content-display',
    type: 'contentnode',
    parentId: 'invisible-lr-rest',
    extent: 'parent',
    position: { x: 700, y: 100 },
    data: {
      label: 'Post List',
      details: 'Display filtered posts as a list component',
      subject: 'visualization',
      nodeLevel: 'basic',
      expanded: true,
      depth: 0,
      isParent: false,
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
      },
      // Enable manual approval mode
      requiresUserApproval: true,
      autoApprove: false
    }
  },
  {
    id: 'post-submission',
    type: 'restnode',
    parentId: 'invisible-lr-rest',
    extent: 'parent',
    position: { x: 1000, y: 100 },
    data: {
      label: 'Submit New Post',
      details: 'Create a new post via JSONPlaceholder API',
      subject: 'integration',
      nodeLevel: 'intermediate',
      expanded: true,
      depth: 0,
      isParent: false,
      method: 'POST',
      url: 'https://jsonplaceholder.typicode.com/posts',
      authentication: 'none',
      timeout: 30000, // Fix: 30 seconds instead of 30ms
      retryAttempts: 3,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        title: 'New Post Title',
        body: 'New post content',
        userId: 1
      }
    },
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
  // Add edge connecting logic to content
  {
    id: 'edge-logic-content',
    source: 'logic-processor',
    target: 'content-display',
    type: 'package',
    sourceHandle: 'right',
    targetHandle: 'left'
  },
  // Add edge connecting content to post submission
  {
    id: 'edge-content-post',
    source: 'content-display',
    target: 'post-submission',
    type: 'package',
    sourceHandle: 'right',
    targetHandle: 'left'
  }
];