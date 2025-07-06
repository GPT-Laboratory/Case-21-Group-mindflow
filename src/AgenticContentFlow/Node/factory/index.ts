/** @format */

// Export unified components
export { UnifiedNodeWrapper } from './components/NodeWrapper';
export { BaseNodeRenderer } from './components/NodeRenderer';
export { default as ProcessControls } from './components/ProcessControls';
export { ExpandCollapseHandler, useExpandCollapseState } from './components/ExpandCollapseHandler';

// Export unified types
export type { FrameJSON, UnifiedNodeInstanceData, UnifiedStyleConfig, ExpandCollapseState } from './types/FrameJSON';

// Export unified utilities
export { UnifiedStyleManager } from './utils/UnifiedStyleManager';
export { updateNodeHierarchyVisibility } from './utils/nodeHierarchyUtils';

// Export shared components
export { IconResolver } from './IconResolver';
export { NodeHeader } from './components/NodeHeader';
export { default as CornerResizer } from './components/NodeResizer';
export { default as ConnectionHandles } from './components/NodeHandles';
export { BaseNodeContainer } from './components/NodeStyles';
export { default as ScrollingText } from './components/ScrollingText';

// Export unified factory
export { UnifiedNodeFactory, createUnifiedNode, createCustomUnifiedNode } from './NodeFactory';

// Export unified registration
export { UnifiedNodeRegistration } from './NodeRegistration';

// Export unified hooks
export { useUnifiedNodeState } from './hooks/useUnifiedNodeState';

