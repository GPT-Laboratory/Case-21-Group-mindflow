# Agentic Content Flow Test Server

A simple Express.js server to receive and log data from RestNode POST requests in the Agentic Content Flow application.

## Features

- **Multiple endpoints** to receive different types of data
- **Request logging** with detailed console output
- **Data storage** in memory for inspection
- **CORS enabled** for cross-origin requests
- **JSON and URL-encoded** body parsing
- **Error handling** and 404 responses

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

3. **Server will be running at:** `http://localhost:3001`

## Available Endpoints

### POST Endpoints (for receiving data)
- `POST /api/data` - Generic data endpoint
- `POST /api/posts` - Receive posts data
- `POST /api/users` - Receive users data  
- `POST /api/comments` - Receive comments data

### GET Endpoints (for inspection)
- `GET /` - Server info and status
- `GET /api/received` - View all received data
- `GET /api/received/:id` - View specific data entry

### DELETE Endpoints
- `DELETE /api/received` - Clear all received data

## Usage with RestNode

1. **Start this test server** on port 3001
2. **Configure your RestNode** with:
   - Method: `POST`
   - URL: `http://localhost:3001/api/data` (or any specific endpoint)
3. **Connect data flow** from upstream nodes to your RestNode
4. **Monitor the server console** to see received data
5. **Check received data** via `GET http://localhost:3001/api/received`

## Testing the Data Flow

### Example Flow Setup:
1. **DataNode** → **ContentNode** → **RestNode** → **Test Server**
2. The RestNode should be configured with:
   - Method: `POST`
   - URL: `http://localhost:3001/api/posts`
   - Enable `requiresUserApproval` if you want to test approval workflow

### What to Expect:
- When data flows through the RestNode, you'll see detailed logs in the server console
- The server stores all received data for later inspection
- Each request gets a unique ID and timestamp

## Server Output Example

```
📝 Received posts data:
⏰ Timestamp: 2025-06-03T10:30:45.123Z
📄 Body: {
  "inputData": [...],
  "autoTriggered": true,
  "method": "POST",
  "url": "http://localhost:3001/api/posts"
}
---
```

## Environment Variables

- `PORT` - Server port (default: 3001)

## Development

The server includes:
- **morgan** for HTTP request logging
- **cors** for cross-origin support
- **express** with JSON parsing
- **nodemon** for development auto-restart