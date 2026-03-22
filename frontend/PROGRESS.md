# Agentic Content Flow - Implementation Progress

## Completed

### LTI 1.0 Integration (Backend)
- **LTI launch routes**: `POST /api/lti/launch` (general) and `POST /api/lti/exercise/{exercise_id}` (exercise-specific)
- **OAuth 1.0 signature verification** using `oauthlib`
- **LTI session management**: Cookie-based sessions with DB backing, 24h expiry
- **Grade passback**: `POST /api/lti/submit-grade` via LTI Basic Outcomes (HMAC-SHA1 signed XML)
- **Credential management**: CRUD endpoints for LTI consumer key/secret pairs
- **Models**: `LTICredential`, `LTISession` SQLAlchemy models

### Flow Configuration (Backend)
- **Flow config endpoints**: `GET/PATCH /api/flows/{id}/config`, `POST /api/flows/{id}/config/regenerate-key`
- **Collaborator management**: `GET/POST/DELETE /api/flows/{id}/collaborators`
- **Flow model extended**: Added `owner_id`, `is_published`, `access_key_required`, `access_key`, `course_id`, `module_id`, `exercise_id`
- **FlowCollaborator model**: Tracks who has config access to a flow

### Flow Settings Page (Frontend)
- **`/flows/:flowId/settings`** route with full settings UI
- Cards for: Flow Name, Description, Visibility toggle, Course Context, LTI Exercise URL (copyable), RAG Content upload/delete, Access Key (toggle/generate/copy), Creator Access (add/remove collaborators)
- Adapted from css_artist's game settings page

### Node Type Simplification (Frontend)
- Replaced old AST node types with two mindmap-specific types:
  - **Topic Node** (`topicnode`, group: cell) — for individual topics
  - **Group Node** (`groupnode`, group: container) — for grouping related topics
- Tab labels updated: "Topic Nodes" / "Group Nodes"

### Layout-Aware Handle Positioning (Frontend)
- Handles remap their visual position based on layout direction (DOWN, UP, LEFT, RIGHT)
- **Handle IDs remain stable** (use original position like "bottom") so edges don't break when layout direction changes
- `originalHandleId` prop passed through `TypedHandle` and `ExcalidrawTypedHandle`

### Handle Colors Match Node (Frontend)
- `UnifiedStyleManager.calculateHandleColor()` returns `styleConfig.backgroundColor` directly
- Removed hardcoded `bg-slate-100` from `BaseHandle` so inline color takes effect

### Color Picker in Node Menu (Frontend)
- **`NodeColorPicker`** component using `DropdownMenuSub` (no Popover dependency)
- 27 preset colors + custom color input
- Integrated into the node "..." dropdown menu via `useUnifiedNodeState`
- Sets `node.data.nodeColor` which flows through `UnifiedStyleManager`

### Homepage & Routing Restructure (Frontend)
- **New Homepage** (`/`) with hero section, flow grid, create/delete flows
- **Flow editor** moved to `/flows/:flowId` and `/flows/new`
- Flow auto-loads from URL param via `FlowsService.getFlow(flowId)`
- Navbar updated: Home + Documents links, logo links to homepage

### Auto-Save (Frontend)
- **`useAutoSave` hook**: Debounced (3s) auto-save when nodes/edges change
- Only saves when a flow is selected and state has actually changed (fingerprint comparison)
- Save dialog pre-fills name/description when updating existing flows

### Create Flow Dialog (Frontend)
- "Create New Flow" opens a dialog with name/description fields
- Creates flow in backend, selects it, shows success toast

### Infrastructure
- Docker Compose: db port 5434, backend port 8001, FRONTEND_URL env var
- Added `oauthlib` to backend requirements

### Remaining Frontend Polish Fixed (March 2026)
- **Node background now follows color picker**
  - Node wrapper gradients are conditionally disabled when a custom `nodeColor` is set
  - Prevents static header gradient classes from visually overriding custom background colors
- **Edge color now matches source node**
  - `getEdgeColors()` accepts optional source node color input
  - Both `CycleEdge` and `AnimatedPackageEdge` resolve source node visual color (explicit `nodeColor` or computed fallback via `UnifiedStyleManager`) and apply it to line + package icon
- **Navbar now includes Flows link**
  - Added dedicated `/flows` route pointing to the flows list page
  - Added **Flows** nav item and route-aware active matching for `/flows`, `/flows/new`, and `/flows/:flowId`
- **Grid settings icon alignment fixed**
  - Dropdown trigger wrapper uses `inline-flex` for consistent toolbar alignment
  - Removed conflicting button sizing declarations in `ControlButton`

---

## Unfinished / Known Issues
- No open issues in this section from the previous checkpoint.
