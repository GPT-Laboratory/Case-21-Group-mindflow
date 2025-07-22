import { Node, Edge } from '@xyflow/react';

export const apiFlowNodesData: Node[] = [
  {
    id: 'invisible-lr-rest',
    type: 'flownode',
    position: { x: 0, y: 0 },
    data: {
      label: 'LR Container',
      layoutDirection: 'LR',
      isContainer: true,
      expanded: true
    },
    style: { width: 200, height: 100 },
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
      },
      instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🌐 REST Node processing:', { incomingData, nodeData });
  
  try {
    const { url, method = 'GET', headers = {} } = nodeData;
    
    if (!url) {
      throw new Error('URL is required for REST API call');
    }
    
    console.log('🌐 Making REST API call:', { method, url, headers });
    
    // Prepare request options
    const options = {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    // Add body for non-GET requests
    if (method !== 'GET' && nodeData.body) {
      options.body = JSON.stringify(nodeData.body);
    }
    
    // Make API request
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ': ' + response.statusText);
    }
    
    const data = await response.json();
    
    console.log('✅ REST API call completed:', { status: response.status, dataLength: Array.isArray(data) ? data.length : 1 });
    
    return {
      data,
      metadata: {
        status: response.status,
        headers: Object.fromEntries(response.headers),
        timestamp: new Date().toISOString(),
        url,
        method
      }
    };
    
  } catch (error) {
    console.error('❌ REST API call failed:', error);
    throw error;
  }
}`
    },
  },
  {
    id: 'logic-processor',
    type: 'logicnode',
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
      },
      instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🧠 Logic Node processing:', { incomingData, nodeData });
  
  try {
    const { operation = 'filter' } = nodeData;
    
    let result = incomingData;
    
    if (operation === 'filter') {
      // Filter data based on condition - titles starting with 'J'
      if (Array.isArray(result?.data)) {
        result = {
          ...result,
          data: result.data.filter(item => {
            return item.title && item.title.startsWith('J');
          })
        };
        console.log('✅ Filtered data:', { originalCount: incomingData?.data?.length, filteredCount: result.data.length });
      }
    }
    
    console.log('✅ Logic processing completed:', { operation, resultLength: Array.isArray(result?.data) ? result.data.length : 1 });
    
    return result;
    
  } catch (error) {
    console.error('❌ Logic processing failed:', error);
    throw error;
  }
}`
    },
  },
  {
    id: 'posts-filter-condition',
    type: 'logicnode',
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
        operation: 'conditional'
      },
      instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔀 Conditional Node processing:', { incomingData, nodeData });
  
  try {
    const data = incomingData?.data || incomingData;
    const postCount = Array.isArray(data) ? data.length : 0;
    
    // Route based on post count: >3 posts = true path, ≤3 posts = false path
    const conditionResult = postCount > 3;
    
    console.log('🎯 Condition evaluated:', { postCount, conditionResult });
    
    // Get available targets
    const availableTargets = Array.from(targetMap.keys());
    console.log('Available target node IDs:', availableTargets);
    
    // Route to appropriate targets based on condition
    const trueTargets = availableTargets.filter(id => id.includes('content') || id.includes('display'));
    const falseTargets = availableTargets.filter(id => id.includes('post') || id.includes('submit'));
    
    const selectedTargets = conditionResult ? 
      (trueTargets.length > 0 ? trueTargets : [availableTargets[0]]) : 
      (falseTargets.length > 0 ? falseTargets : [availableTargets[1] || availableTargets[0]]);
    
    console.log('🎯 Routing to targets:', selectedTargets);
    
    return {
      data: incomingData,
      targets: selectedTargets,
      conditionResult,
      metadata: {
        evaluatedCondition: \`postCount > 3 (actual: \${postCount})\`,
        availableTargets,
        selectedTargets,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('❌ Conditional processing failed:', error);
    throw error;
  }
}`
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
      },
      instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('👁️ Content Node processing:', { incomingData, nodeData });
  
  try {
    const { displayType = 'list' } = nodeData;
    
    let result = incomingData;
    
    if (displayType === 'list') {
      // Format data for list display
      const posts = Array.isArray(result?.data) ? result.data : [];
      
      result = {
        ...result,
        displayFormat: 'list',
        content: posts.map(post => ({
          title: post.title || 'No Title',
          subtitle: post.body || 'No Content',
          metadata: \`User: \${post.userId} | ID: \${post.id}\`,
          id: post.id,
          userId: post.userId
        })),
        displayConfig: {
          type: 'list',
          itemCount: posts.length,
          maxItems: 10,
          showSearch: true,
          sortBy: 'title'
        }
      };
    }
    
    console.log('✅ Content processing completed:', { displayType, itemCount: result.content?.length || 0 });
    
    return result;
    
  } catch (error) {
    console.error('❌ Content processing failed:', error);
    throw error;
  }
}`
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
      },
      instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🌐 POST REST Node processing:', { incomingData, nodeData });
  
  try {
    const { url, method = 'POST', headers = {}, body } = nodeData;
    
    if (!url) {
      throw new Error('URL is required for REST API call');
    }
    
    console.log('🌐 Making POST REST API call:', { method, url, headers, body });
    
    // Prepare request options
    const options = {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(body)
    };
    
    // Make API request
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ': ' + response.statusText);
    }
    
    const data = await response.json();
    
    console.log('✅ POST REST API call completed:', { status: response.status, createdPost: data });
    
    return {
      data,
      metadata: {
        status: response.status,
        headers: Object.fromEntries(response.headers),
        timestamp: new Date().toISOString(),
        url,
        method,
        createdPostId: data.id
      }
    };
    
  } catch (error) {
    console.error('❌ POST REST API call failed:', error);
    throw error;
  }
}`
    },
  },
  {
    id: 'final-processor',
    type: 'logicnode',
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
      },
      instanceCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🏁 Final Processor processing:', { incomingData, nodeData });
  
  try {
    const { operation = 'transform' } = nodeData;
    
    let result = incomingData;
    
    if (operation === 'transform') {
      // Finalize and summarize the results
      const data = result?.data || result;
      const metadata = result?.metadata || {};
      
      result = {
        data,
        metadata: {
          ...metadata,
          finalized: true,
          finalizedAt: new Date().toISOString(),
          operation: 'final_transform',
          summary: {
            dataType: Array.isArray(data) ? 'array' : typeof data,
            dataLength: Array.isArray(data) ? data.length : 1,
            hasContent: !!data,
            sourceOperation: metadata.operation || 'unknown'
          }
        }
      };
    }
    
    console.log('✅ Final processing completed:', { operation, resultSummary: result.metadata?.summary });
    
    return result;
    
  } catch (error) {
    console.error('❌ Final processing failed:', error);
    throw error;
  }
}`
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
  {
    id: 'edge-logic-condition',
    source: 'logic-processor',
    target: 'posts-filter-condition',
    type: 'package',
    sourceHandle: 'right',
    targetHandle: 'left'
  },
  {
    id: 'edge-condition-content-true',
    source: 'posts-filter-condition',
    target: 'content-display',
    type: 'package',
    sourceHandle: 'right',
    targetHandle: 'left',
    data: {
      routingCondition: 'true',
      description: 'Route when condition evaluates to true (>3 posts)'
    }
  },
  {
    id: 'edge-condition-post-false',
    source: 'posts-filter-condition',
    target: 'post-submission',
    type: 'package',
    sourceHandle: 'right',
    targetHandle: 'left',
    data: {
      routingCondition: 'false',
      description: 'Route when condition evaluates to false (≤3 posts)'
    }
  },
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