# Flows System Setup Guide

## Quick Setup

The flows system requires both the frontend and backend to be running. Follow these steps:

### 1. Start the Test Server

```bash
cd test-server
npm start
```

You should see output like:
```
🚀 Agentic Content Flow Test Server Started
📡 Server running on http://localhost:3001
✅ Connected to SQLite database
✅ Flows table created/verified
✅ Seeded 1 flows from testFlows.json
```

### 2. Restart the Frontend Development Server

Since we added a proxy configuration, you need to restart the Vite dev server:

```bash
# Stop the current dev server (Ctrl+C)
# Then restart it
npm run dev
```

### 3. Verify the Setup

1. Open your browser to the application
2. Check the left FlowsPanel - you should see the "Default Flow" loaded from the database
3. Try the "Save Flow" button in the top controls panel

## Troubleshooting

### "API request failed" Error

If you see this error, it means the frontend can't connect to the test server:

1. **Check if the test server is running**:
   ```bash
   curl http://localhost:3001/api/flows
   ```
   Should return JSON data.

2. **Restart the frontend dev server** after starting the test server.

3. **Check the browser console** for more detailed error messages.

### "No saved flows" Message

If you see "Server connection issue" in the FlowsPanel:
- Ensure the test server is running on port 3001
- Restart the frontend dev server
- Check that the proxy configuration in `vite.config.ts` is correct

### Database Issues

If the database isn't created properly:
1. Delete `test-server/flows.db` (if it exists)
2. Restart the test server - it will recreate the database and seed initial data

## API Endpoints

Once running, you can test the API directly:

```bash
# Get all flows
curl http://localhost:3001/api/flows

# Create a new flow
curl -X POST http://localhost:3001/api/flows \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Flow","description":"Test","nodes":[],"edges":[]}'
```

## Development

- **Database file**: `test-server/flows.db`
- **Initial data**: `test-server/testFlows.json`
- **API endpoints**: `test-server/server.js`
- **Frontend store**: `src/AgenticContentFlow/stores/useFlowsStore.ts`
- **API service**: `src/AgenticContentFlow/services/FlowsService.ts` 