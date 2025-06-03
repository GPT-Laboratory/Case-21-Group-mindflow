const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Store received data for inspection
const receivedData = [];

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Agentic Content Flow Test Server',
    status: 'running',
    endpoints: {
      'GET /': 'This endpoint',
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
  console.log(`  POST http://localhost:${PORT}/api/posts`);
  console.log(`  POST http://localhost:${PORT}/api/users`);
  console.log(`  POST http://localhost:${PORT}/api/comments`);
  console.log(`  POST http://localhost:${PORT}/api/data`);
  console.log(`  GET  http://localhost:${PORT}/api/received`);
  console.log(`  DEL  http://localhost:${PORT}/api/received`);
  console.log('');
});

module.exports = app;