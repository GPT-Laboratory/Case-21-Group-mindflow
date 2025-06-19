/** @format */

// Export unified components
export { UnifiedNodeWrapper } from './components/NodeWrapper';
export { BaseNodeRenderer } from './components/NodeRenderer';
export { default as ProcessControls } from './components/ProcessControls';
export { ExpandCollapseHandler, useExpandCollapseState } from './components/ExpandCollapseHandler';

// Export unified types
export type { UnifiedFrameJSON, UnifiedNodeInstanceData, UnifiedStyleConfig, ExpandCollapseState } from './types/UnifiedFrameJSON';

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
export { UnifiedNodeFactory, createUnifiedNode, createCustomUnifiedNode } from './UnifiedNodeFactory';

// Export unified registration
export { UnifiedNodeRegistration } from './UnifiedNodeRegistration';

// Export unified hooks
export { useUnifiedNodeState } from './hooks/useUnifiedNodeState';

// Export example frames
export { unifiedRestNodeFrame } from '../store/frames/unifiedRestNodeFrame';
export { unifiedDataNodeFrame } from '../store/frames/unifiedDataNodeFrame';
export { unifiedContentNodeFrame } from '../store/frames/unifiedContentNodeFrame';
export { unifiedLogicNodeFrame } from '../store/frames/unifiedLogicNodeFrame';
export { unifiedPageNodeFrame } from '../store/frames/unifiedPageNodeFrame';
export { unifiedStatisticsNodeFrame } from '../store/frames/unifiedStatisticsNodeFrame';
export { unifiedInvisibleNodeFrame } from '../store/frames/unifiedInvisibleNodeFrame';
