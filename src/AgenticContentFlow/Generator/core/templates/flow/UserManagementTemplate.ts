import { FlowTemplate } from "@/AgenticContentFlow/Generator/generatortypes";

export const userManagementTemplate: FlowTemplate = {
  id: 'user-management',
  name: 'User Management',
  description: 'Simple user fetching and display flow',
  tags: ['api', 'users', 'display', 'simple'],
  type: 'flow', // Add the required type property
  generate: () => ({
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
    features: ['User API fetching', 'User display', 'Simple two-node flow']
  })
};