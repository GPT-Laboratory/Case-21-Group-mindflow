# Flows System

The Flows System provides a complete solution for managing flows in the Agentic Content Flow application. It includes both client-side state management and server-side persistence with SQLite.

## Architecture

### Client-Side Components

1. **useFlowsStore** (`stores/useFlowsStore.ts`)
   - Zustand store for managing flows state
   - Handles CRUD operations with API integration
   - Provides caching and persistence
   - Manages loading states and error handling

2. **FlowsService** (`services/FlowsService.ts`)
   - API service layer for flows operations
   - Handles HTTP requests and response formatting
   - Provides data transformation utilities

3. **useSaveFlow** (`hooks/useSaveFlow.ts`)
   - Hook for saving current flow state
   - Integrates with node and edge contexts
   - Provides save and save-as functionality

4. **FlowsPanel** (`FlowsPanel/FlowsPanel.tsx`)
   - UI component for displaying and managing flows
   - Integrates with flows store for data management
   - Provides flow loading and deletion functionality

5. **SaveFlowControl** (`Controls/Components/SaveFlowControl.tsx`)
   - Control component for saving flows
   - Provides dialog-based save interface
   - Integrates with save flow hook

### Server-Side Components

1. **DatabaseService** (`test-server/database.js`)
   - SQLite database management
   - Handles table creation and data seeding
   - Provides CRUD operations for flows

2. **Flows API Endpoints** (`test-server/server.js`)
   - RESTful API for flows management
   - Supports GET, POST, PUT, DELETE operations
   - Handles data validation and error responses

## API Endpoints

### GET /api/flows
Retrieve all flows from the database.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Flow Name",
      "description": "Flow description",
      "lastModified": "2024-01-01T00:00:00.000Z",
      "nodeCount": 5,
      "edgeCount": 3,
      "type": "saved",
      "nodes": [...],
      "edges": [...],
      "metadata": {},
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "Retrieved 1 flows"
}
```

### POST /api/flows
Create a new flow.

**Request Body:**
```json
{
  "name": "Flow Name",
  "description": "Flow description",
  "nodes": [...],
  "edges": [...],
  "type": "saved",
  "metadata": {}
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Flow Name",
    "description": "Flow description",
    "lastModified": "2024-01-01T00:00:00.000Z",
    "nodeCount": 5,
    "edgeCount": 3,
    "type": "saved",
    "nodes": [...],
    "edges": [...],
    "metadata": {},
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Flow created successfully"
}
```

### GET /api/flows/:id
Retrieve a specific flow by ID.

### PUT /api/flows/:id
Update an existing flow.

### DELETE /api/flows/:id
Delete a flow.

## Usage Examples

### Loading Flows
```tsx
import { useFlowsStore } from '../stores/useFlowsStore';

const { flows, loading, fetchFlows } = useFlowsStore();

useEffect(() => {
  fetchFlows();
}, [fetchFlows]);
```

### Saving a Flow
```tsx
import { useSaveFlow } from '../hooks/useSaveFlow';

const { saveCurrentFlow, isSaving } = useSaveFlow();

const handleSave = async () => {
  const success = await saveCurrentFlow('My Flow', 'Description');
  if (success) {
    console.log('Flow saved successfully');
  }
};
```

### Using the Save Control
```tsx
import { SaveFlowControl } from '../Controls/Components/SaveFlowControl';

<SaveFlowControl variant="outline" size="sm" />
```

## Database Schema

The flows are stored in a SQLite database with the following schema:

```sql
CREATE TABLE flows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  lastModified TEXT NOT NULL,
  nodeCount INTEGER DEFAULT 0,
  edgeCount INTEGER DEFAULT 0,
  type TEXT DEFAULT 'saved',
  nodes TEXT NOT NULL,
  edges TEXT NOT NULL,
  metadata TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## Initial Data

The system automatically seeds initial data from `test-server/testFlows.json` when the database is first created. This provides template flows for users to get started.

## Error Handling

The system includes comprehensive error handling:

- API errors are caught and displayed via notifications
- Database errors are logged and handled gracefully
- Network errors are handled with retry logic
- Validation errors are shown to users with helpful messages

## Future Enhancements

1. **Flow Templates**: Pre-built flow templates for common use cases
2. **Flow Versioning**: Version control for flows with diff visualization
3. **Flow Sharing**: Share flows between users
4. **Flow Import/Export**: Import/export flows in various formats
5. **Flow Analytics**: Track flow usage and performance metrics
6. **Collaborative Editing**: Real-time collaborative flow editing 