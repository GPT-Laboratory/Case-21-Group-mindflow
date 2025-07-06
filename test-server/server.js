const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const DatabaseService = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;
const db = new DatabaseService();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Store received data for inspection
const receivedData = [];

// Initialize database
db.initialize().catch(console.error);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Agentic Content Flow Test Server',
    status: 'running',
    endpoints: {
      'GET /': 'This endpoint',
      'GET /api/flows': 'Get all flows',
      'POST /api/flows': 'Create new flow',
      'GET /api/flows/:id': 'Get flow by ID',
      'PUT /api/flows/:id': 'Update flow',
      'DELETE /api/flows/:id': 'Delete flow',
      'GET /api/nodeTypes': 'Get all node types',
      'POST /api/nodeTypes': 'Create new node type',
      'GET /api/nodeTypes/:nodeType': 'Get node type by ID',
      'PUT /api/nodeTypes/:nodeType': 'Update node type',
      'DELETE /api/nodeTypes/:nodeType': 'Delete node type',
      'POST /api/posts': 'Receive posts data',
      'POST /api/users': 'Receive users data',
      'POST /api/comments': 'Receive comments data',
      'POST /api/data': 'Generic data endpoint',
      'GET /api/received': 'View all received data',
      'DELETE /api/received': 'Clear received data'
    },
    receivedCount: receivedData.length
  });
});

// Flows API endpoints
app.get('/api/flows', async (req, res) => {
  try {
    const flows = await db.getAllFlows();
    res.json({
      success: true,
      data: flows,
      message: `Retrieved ${flows.length} flows`
    });
  } catch (error) {
    console.error('Error getting flows:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get flows',
      error: error.message
    });
  }
});

app.post('/api/flows', async (req, res) => {
  try {
    const { name, description, nodes, edges, type = 'saved', metadata = {} } = req.body;
    
    if (!name || !nodes || !edges) {
      return res.status(400).json({
        success: false,
        message: 'Name, nodes, and edges are required'
      });
    }
    
    const flow = {
      id: uuidv4(),
      name,
      description: description || '',
      lastModified: new Date().toISOString(),
      nodeCount: nodes.length,
      edgeCount: edges.length,
      type,
      nodes: JSON.stringify(nodes),
      edges: JSON.stringify(edges),
      metadata: JSON.stringify(metadata)
    };
    
    await db.insertFlow(flow);
    
    const createdFlow = await db.getFlowById(flow.id);
    
    res.status(201).json({
      success: true,
      data: createdFlow,
      message: 'Flow created successfully'
    });
  } catch (error) {
    console.error('Error creating flow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create flow',
      error: error.message
    });
  }
});

app.get('/api/flows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const flow = await db.getFlowById(id);
    
    if (!flow) {
      return res.status(404).json({
        success: false,
        message: 'Flow not found'
      });
    }
    
    res.json({
      success: true,
      data: flow,
      message: 'Flow retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting flow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get flow',
      error: error.message
    });
  }
});

app.put('/api/flows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, nodes, edges, type, metadata = {} } = req.body;
    
    const existingFlow = await db.getFlowById(id);
    if (!existingFlow) {
      return res.status(404).json({
        success: false,
        message: 'Flow not found'
      });
    }
    
    const updatedFlow = {
      name: name || existingFlow.name,
      description: description || existingFlow.description,
      lastModified: new Date().toISOString(),
      nodeCount: nodes ? nodes.length : existingFlow.nodeCount,
      edgeCount: edges ? edges.length : existingFlow.edgeCount,
      type: type || existingFlow.type,
      nodes: nodes ? JSON.stringify(nodes) : JSON.stringify(existingFlow.nodes),
      edges: edges ? JSON.stringify(edges) : JSON.stringify(existingFlow.edges),
      metadata: JSON.stringify(metadata)
    };
    
    const success = await db.updateFlow(id, updatedFlow);
    
    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update flow'
      });
    }
    
    const flow = await db.getFlowById(id);
    
    res.json({
      success: true,
      data: flow,
      message: 'Flow updated successfully'
    });
  } catch (error) {
    console.error('Error updating flow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update flow',
      error: error.message
    });
  }
});

app.delete('/api/flows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.deleteFlow(id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Flow not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Flow deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting flow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete flow',
      error: error.message
    });
  }
});

// Node Types API endpoints
app.get('/api/nodeTypes', async (req, res) => {
  try {
    const nodeTypes = await db.getAllNodeTypes();
    res.json({
      success: true,
      data: nodeTypes,
      message: `Retrieved ${nodeTypes.length} node types`
    });
  } catch (error) {
    console.error('Error getting node types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get node types',
      error: error.message
    });
  }
});

app.post('/api/nodeTypes', async (req, res) => {
  try {
    const { nodeType, defaultLabel, category, group, description, visual, handles, process, defaultDimensions } = req.body;
    
    if (!nodeType || !defaultLabel || !category || !group) {
      return res.status(400).json({
        success: false,
        message: 'nodeType, defaultLabel, category, and group are required'
      });
    }
    
    const nodeTypeData = {
      nodeType,
      defaultLabel,
      category,
      groupType: group,
      description: description || '',
      visual: JSON.stringify(visual || {}),
      handles: JSON.stringify(handles || {}),
      process: JSON.stringify(process || {}),
      defaultDimensions: JSON.stringify(defaultDimensions || {})
    };
    
    await db.insertNodeType(nodeTypeData);
    
    const createdNodeType = await db.getNodeTypeById(nodeType);
    
    res.status(201).json({
      success: true,
      data: createdNodeType,
      message: 'Node type created successfully'
    });
  } catch (error) {
    console.error('Error creating node type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create node type',
      error: error.message
    });
  }
});

app.get('/api/nodeTypes/:nodeType', async (req, res) => {
  try {
    const { nodeType } = req.params;
    const nodeTypeData = await db.getNodeTypeById(nodeType);
    
    if (!nodeTypeData) {
      return res.status(404).json({
        success: false,
        message: 'Node type not found'
      });
    }
    
    res.json({
      success: true,
      data: nodeTypeData,
      message: 'Node type retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting node type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get node type',
      error: error.message
    });
  }
});

app.put('/api/nodeTypes/:nodeType', async (req, res) => {
  try {
    const { nodeType } = req.params;
    const { defaultLabel, category, group, description, visual, handles, process, defaultDimensions } = req.body;
    
    const existingNodeType = await db.getNodeTypeById(nodeType);
    if (!existingNodeType) {
      return res.status(404).json({
        success: false,
        message: 'Node type not found'
      });
    }
    
    const updatedNodeType = {
      defaultLabel: defaultLabel || existingNodeType.defaultLabel,
      category: category || existingNodeType.category,
      group: group || existingNodeType.group,
      description: description || existingNodeType.description,
      visual: visual || existingNodeType.visual,
      handles: handles || existingNodeType.handles,
      process: process || existingNodeType.process,
      defaultDimensions: defaultDimensions || existingNodeType.defaultDimensions
    };
    
    const success = await db.updateNodeType(nodeType, updatedNodeType);
    
    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update node type'
      });
    }
    
    const nodeTypeData = await db.getNodeTypeById(nodeType);
    
    res.json({
      success: true,
      data: nodeTypeData,
      message: 'Node type updated successfully'
    });
  } catch (error) {
    console.error('Error updating node type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update node type',
      error: error.message
    });
  }
});

app.delete('/api/nodeTypes/:nodeType', async (req, res) => {
  try {
    const { nodeType } = req.params;
    const success = await db.deleteNodeType(nodeType);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Node type not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Node type deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting node type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete node type',
      error: error.message
    });
  }
});

// Generic data endpoint - receives any POST data
app.post('/api/data', (req, res) => {
  const timestamp = new Date().toISOString();
  const dataEntry = {
    id: Date.now(),
    timestamp,
    endpoint: '/api/data',
    method: 'POST',
    headers: req.headers,
    body: req.body,
    query: req.query
  };
  
  receivedData.push(dataEntry);
  
  console.log('📦 Received data at /api/data:');
  console.log('⏰ Timestamp:', timestamp);
  console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
  console.log('📄 Body:', JSON.stringify(req.body, null, 2));
  console.log('❓ Query:', JSON.stringify(req.query, null, 2));
  console.log('---');
  
  res.json({
    success: true,
    message: 'Data received successfully',
    timestamp,
    receivedData: req.body,
    dataId: dataEntry.id
  });
});

// Posts endpoint
app.post('/api/posts', (req, res) => {
    console.log('📬 Received posts data at /api/posts');
  const timestamp = new Date().toISOString();
  const dataEntry = {
    id: Date.now(),
    timestamp,
    endpoint: '/api/posts',
    method: 'POST',
    headers: req.headers,
    body: req.body,
    query: req.query
  };
  
  receivedData.push(dataEntry);
  
  console.log('📝 Received posts data:');
  console.log('⏰ Timestamp:', timestamp);
  console.log('📄 Body:', JSON.stringify(req.body, null, 2));
  console.log('---');
  
  res.json({
    success: true,
    message: 'Posts data received successfully',
    timestamp,
    postsReceived: Array.isArray(req.body) ? req.body.length : 1,
    dataId: dataEntry.id
  });
});

// Users endpoint
app.post('/api/users', (req, res) => {
  const timestamp = new Date().toISOString();
  const dataEntry = {
    id: Date.now(),
    timestamp,
    endpoint: '/api/users',
    method: 'POST',
    headers: req.headers,
    body: req.body,
    query: req.query
  };
  
  receivedData.push(dataEntry);
  
  console.log('👤 Received users data:');
  console.log('⏰ Timestamp:', timestamp);
  console.log('📄 Body:', JSON.stringify(req.body, null, 2));
  console.log('---');
  
  res.json({
    success: true,
    message: 'Users data received successfully',
    timestamp,
    usersReceived: Array.isArray(req.body) ? req.body.length : 1,
    dataId: dataEntry.id
  });
});

// Comments endpoint
app.post('/api/comments', (req, res) => {
  const timestamp = new Date().toISOString();
  const dataEntry = {
    id: Date.now(),
    timestamp,
    endpoint: '/api/comments',
    method: 'POST',
    headers: req.headers,
    body: req.body,
    query: req.query
  };
  
  receivedData.push(dataEntry);
  
  console.log('💬 Received comments data:');
  console.log('⏰ Timestamp:', timestamp);
  console.log('📄 Body:', JSON.stringify(req.body, null, 2));
  console.log('---');
  
  res.json({
    success: true,
    message: 'Comments data received successfully',
    timestamp,
    commentsReceived: Array.isArray(req.body) ? req.body.length : 1,
    dataId: dataEntry.id
  });
});

// Get all received data
app.get('/api/received', (req, res) => {
  res.json({
    success: true,
    totalReceived: receivedData.length,
    data: receivedData.map(entry => ({
      id: entry.id,
      timestamp: entry.timestamp,
      endpoint: entry.endpoint,
      method: entry.method,
      bodyPreview: typeof entry.body === 'object' ? 
        JSON.stringify(entry.body).substring(0, 100) + '...' : 
        String(entry.body).substring(0, 100)
    })),
    fullData: receivedData
  });
});

// Get specific received data entry
app.get('/api/received/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const entry = receivedData.find(d => d.id === id);
  
  if (!entry) {
    return res.status(404).json({
      success: false,
      message: 'Data entry not found'
    });
  }
  
  res.json({
    success: true,
    data: entry
  });
});

// Clear all received data
app.delete('/api/received', (req, res) => {
  const clearedCount = receivedData.length;
  receivedData.length = 0;
  
  console.log('🧹 Cleared all received data');
  
  res.json({
    success: true,
    message: `Cleared ${clearedCount} data entries`,
    clearedCount
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    availableEndpoints: [
      'GET /',
      'POST /api/posts',
      'POST /api/users', 
      'POST /api/comments',
      'POST /api/data',
      'GET /api/received',
      'DELETE /api/received'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Agentic Content Flow Test Server Started');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log('🎯 Ready to receive data from RestNode POST requests');
  console.log('');
  console.log('Available endpoints:');
  console.log(`  GET  http://localhost:${PORT}/`);
  console.log(`  GET  http://localhost:${PORT}/api/flows`);
  console.log(`  POST http://localhost:${PORT}/api/flows`);
  console.log(`  GET  http://localhost:${PORT}/api/flows/:id`);
  console.log(`  PUT  http://localhost:${PORT}/api/flows/:id`);
  console.log(`  DEL  http://localhost:${PORT}/api/flows/:id`);
  console.log(`  POST http://localhost:${PORT}/api/posts`);
  console.log(`  POST http://localhost:${PORT}/api/users`);
  console.log(`  POST http://localhost:${PORT}/api/comments`);
  console.log(`  POST http://localhost:${PORT}/api/data`);
  console.log(`  GET  http://localhost:${PORT}/api/received`);
  console.log(`  DEL  http://localhost:${PORT}/api/received`);
  console.log('');
});

module.exports = app;