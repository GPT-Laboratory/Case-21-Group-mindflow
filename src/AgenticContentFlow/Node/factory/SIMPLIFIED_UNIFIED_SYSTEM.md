# Unified Node System

## Overview

The unified node system provides a single, simplified framework for all node types. It eliminates the distinction between cell and container frames while maintaining essential functionality through group-based behavior and runtime-determined styling. The `UnifiedFrameJSON` is completely group-agnostic - the same frame structure works for all node types.

## Key Principles

### **Single Source of Truth**
- One frame type: `UnifiedFrameJSON`
- One factory: `UnifiedNodeFactory`
- One wrapper: `NodeWrapper`
- One store: `useUnifiedNodeTypeStore`

### **Group-Agnostic Design**
- **Same frame structure**: Works for both `"cell"` and `"container"` groups
- **Group determines behavior**: `group` field is the only behavior differentiator
- **Generic styling**: `style` field works for all node types
- **Universal components**: Same visual configuration for all nodes

### **Group-Based Behavior**
- **Cell nodes**: `group: "cell"` → Non-expandable, process functionality
- **Container nodes**: `group: "container"` → Expandable, can contain children

### **Runtime-Determined Styling**
- **Depth colors**: Calculated at runtime based on node hierarchy position
- **Parent inheritance**: Child nodes inherit color scheme from parent
- **Root assignment**: Root nodes can be assigned specific color schemes

### **Simplified Configuration**
- Removed redundant fields (`headerIcon`, `appearance`, `colorScheme`, `menu`, `behavior`, `content`)
- Group determines all behavior automatically
- Process support for all node types
- Single icon instead of multiple icon configurations
- Single parameters source (no defaultParameters)
- Generic styling for all node types

## Architecture

### **Core Components**

1. **`UnifiedFrameJSON`** - Single frame type for all nodes (group-agnostic)
2. **`UnifiedNodeFactory`** - Creates nodes from frame configurations
3. **`NodeWrapper`** - Universal renderer (orchestration only)
4. **`NodeRenderer`** - Unified rendering logic
5. **`useUnifiedNodeState`** - State management hook
6. **`useUnifiedNodeTypeStore`** - Centralized node type store

### **File Structure**
```
shared/
├── types/
│   └── UnifiedFrameJSON.ts          # Single frame type (group-agnostic)
├── components/
│   ├── NodeWrapper.tsx              # Main orchestrator
│   ├── NodeRenderer.tsx             # Unified renderer
│   ├── NodeHeader.tsx               # Header component
│   ├── NodeResizer.tsx              # Resize functionality
│   ├── NodeHandles.tsx              # Connection handles
│   └── ScrollingText.tsx            # Text display
├── hooks/
│   └── useUnifiedNodeState.ts       # State management
├── utils/
│   └── UnifiedStyleManager.ts       # Styling utilities
└── UnifiedNodeFactory.ts            # Node creation factory

store/
├── frames/
│   ├── unifiedRestNodeFrame.ts      # REST API node
│   ├── unifiedDataNodeFrame.ts      # Data processing node
│   ├── unifiedContentNodeFrame.ts   # Content node
│   ├── unifiedLogicNodeFrame.ts     # Logic node
│   ├── unifiedPageNodeFrame.ts      # Page node
│   ├── unifiedStatisticsNodeFrame.ts # Statistics node
│   └── unifiedInvisibleNodeFrame.ts # Invisible container
├── useUnifiedNodeTypeStore.ts       # Centralized store
└── unifiedNodeTypeStoreInitializer.ts
```

## Frame Structure

### **UnifiedFrameJSON Interface**
See: `src/AgenticContentFlow/Node/factories/shared/types/UnifiedFrameJSON.ts`

### **Key Simplifications**
- **No behavior field**: Group determines behavior (`"cell"` vs `"container"`)
- **No menu field**: All nodes use the same menu system
- **No content field**: Container content is always a flow (determined by structure)
- **No colorScheme field**: Depth colors calculated at runtime based on hierarchy
- **No defaultParameters**: Only `parameters` in process configuration
- **No container-specific styling**: Generic `style` field for all node types
- **No template field**: Default data consolidated into process parameters
- **No aiContext/constraints**: Simplified process configuration
- **No variant parameters**: Variant selections stored in node instance data

## Color System

### **Runtime-Determined Depth Colors**
Depth-based background colors are calculated at runtime, not defined in frames:

```typescript
// Node instance determines color scheme
const getNodeColorScheme = (nodeInstance) => {
  if (nodeInstance.parent) {
    return nodeInstance.parent.colorScheme; // Inherit from parent
  }
  return nodeInstance.colorScheme || 'default'; // Root node assignment
};

// Depth-based color calculation
const getDepthColor = (colorScheme, depth) => {
  const schemes = {
    default: ['#f0d1a0', '#e1a382', '#dd6e6e', '#c34949', '#9f3d3d'],
    blue: ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6'],
    purple: ['#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7'],
    green: ['#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e'],
    amber: ['#fef3c7', '#fde68a', '#fcd34d', '#f59e0b', '#d97706'],
    red: ['#fee2e2', '#fecaca', '#fca5a5', '#ef4444', '#dc2626']
  };
  return schemes[colorScheme][depth] || schemes[colorScheme][0];
};
```

### **Frame-Level Colors**
Frames only define:
- **`selectedColor`**: Color for selection state
- **`variants`**: Badge colors for variant-based nodes (e.g., HTTP methods)

### **Generic Styling**
All node types can use the same styling configuration:
- **`style.borderStyle`**: Border style for any node type
- **`style.shadowStyle`**: Shadow style for any node type
- **`style.customStyles`**: Custom CSS styles for any node type

## Usage Examples

### **Creating a Cell Node**
See: `src/AgenticContentFlow/Node/store/frames/unifiedRestNodeFrame.ts`

### **Creating a Container Node**
See: `src/AgenticContentFlow/Node/store/frames/unifiedDataNodeFrame.ts`

### **Using the Factory**
```typescript
import { createUnifiedNode } from '../factories/shared/UnifiedNodeFactory';

const node = createUnifiedNode('restnode', 'node-1', { x: 100, y: 100 });
```

### **Using the Store**
```typescript
import { useUnifiedNodeTypeStore } from '../store/useUnifiedNodeTypeStore';

const { getNodeType, getAllNodeTypes } = useUnifiedNodeTypeStore();
const config = getNodeType('restnode');
```

## Benefits

### **For Developers**
- **Single Frame Type**: No more `CellFrameJSON` vs `ContainerFrameJSON`
- **Unified Factory**: One factory handles all node types
- **Simplified Configuration**: Fewer fields, clearer relationships
- **Better Type Safety**: Single type definition reduces errors
- **Group-Based Logic**: Behavior determined by group, not separate fields
- **Runtime Styling**: Colors adapt to actual hierarchy structure
- **Group-Agnostic Design**: Same frame structure works for all node types
- **Clean Component Names**: Simplified, descriptive component names
- **Variant Support**: Variant selections stored in node instance data

### **For Users**
- **Consistent Experience**: All nodes follow the same patterns
- **Process Support**: Both cell and container nodes can have process functionality
- **AI-Friendly**: `processExample` provides clear guidance for AI generation
- **Unified Menu System**: Same menu for all node types
- **Visual Hierarchy**: Depth colors help understand node relationships
- **Flexible Styling**: Same styling options available for all node types
- **Variant Selection**: Easy selection of node variants (e.g., HTTP methods)

## Migration from Old System

### **Key Changes**
1. Remove `headerIcon` - use only `icon`
2. Remove `appearance` configuration
3. Remove `colorScheme` - depth colors calculated at runtime
4. Remove `menu` configuration
5. Remove `behavior` field - group determines behavior
6. Remove `content` field - container content is always a flow
7. Remove `defaultParameters` - use only `parameters`
8. Remove `template` field - default data in process parameters
9. Remove `aiContext` and `constraints` - simplified process config
10. Change group to `"cell"` or `"container"`
11. Change `containerStyle` to `style` - generic styling for all nodes
12. Store variant selections in `selectedVariant` node instance data

### **Behavior Logic**
```typescript
// Old logic
const isCellLike = !config.behavior.canContainChildren && config.process;
const isContainerLike = config.behavior.canContainChildren;

// New logic
const isCellLike = config.group === "cell";
const isContainerLike = config.group === "container";
```

### **Color Logic**
```typescript
// Old logic
const depthColor = config.visual.colorScheme.depthColors;

// New logic
const depthColor = getDepthColor(nodeInstance.colorScheme, nodeInstance.depth);
```

### **Styling Logic**
```typescript
// Old logic
const containerStyle = config.visual.containerStyle;

// New logic
const style = config.visual.style; // Works for all node types
```

### **Variant Logic**
```typescript
// Old logic
const method = config.process.parameters.method;

// New logic
const selectedVariant = nodeInstance.selectedVariant; // Stored in instance data
```

### **Component Names**
```typescript
// Old names
import { UnifiedNodeWrapper } from './components/UnifiedNodeWrapper';
import { BaseNodeRenderer } from './components/BaseNodeRenderer';
import { CornerResizer } from './components/CornerResizer';
import { ConnectionHandles } from './components/ConnectionHandles';

// New names
import { UnifiedNodeWrapper } from './components/NodeWrapper';
import { BaseNodeRenderer } from './components/NodeRenderer';
import { CornerResizer } from './components/NodeResizer';
import { ConnectionHandles } from './components/NodeHandles';
```

## Current Status

✅ **Complete**: Simplified unified system  
✅ **Complete**: Unified factory and store  
✅ **Complete**: Frame-agnostic rendering  
✅ **Complete**: Process support for all node types  
✅ **Complete**: Group-based behavior determination  
✅ **Complete**: Runtime-determined color system  
✅ **Complete**: Group-agnostic frame design  
✅ **Complete**: Single source of truth documentation  
✅ **Complete**: Component name simplification  
✅ **Complete**: Variant selection in instance data  
✅ **Complete**: All old cell and container frames converted  

The unified system is now the single source of truth for all node creation and rendering, providing a clean, maintainable, and extensible architecture with runtime-adaptive styling and completely group-agnostic frame design. All legacy frames have been successfully converted to the new unified format. 