import { Node, Edge } from '@xyflow/react';

export const apiFlowNodesData: Node[] = [
  {
    id: 'invisible-lr-rest',
    type: 'invisiblenode',
    position: { x: 0, y: 0 },
    data: {
      label: 'LR Container',
      layoutDirection: 'LR',
      isContainer: true,
      expanded: true
    },
    style: { width: 300, height: 100 },
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
      instanceData: {
        label: 'Get Posts',
        details: 'Fetch posts from JSONPlaceholder API',
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
      instanceData: {
        label: 'Filter J',
        details: 'We only want data where title starts with "J"',
      },
      templateData: {
        operation: 'filter'
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
      },
      templateData: {
        operation: 'conditional',
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
      },
      templateData: {
        method: 'POST',
        url: 'https://jsonplaceholder.typicode.com/posts',
        authentication: 'none',
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