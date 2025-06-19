/** @format */

import { useUnifiedNodeTypeStore } from './useUnifiedNodeTypeStore';
import { UnifiedFrameJSON } from '../factory//types/UnifiedFrameJSON';

// Import unified frame templates
import { unifiedRestNodeFrame } from './frames/unifiedRestNodeFrame';
import { unifiedDataNodeFrame } from './frames/unifiedDataNodeFrame';
import { unifiedContentNodeFrame } from './frames/unifiedContentNodeFrame';
import { unifiedLogicNodeFrame } from './frames/unifiedLogicNodeFrame';
import { unifiedConditionalNodeFrame } from './frames/unifiedConditionalNodeFrame';
import { unifiedPageNodeFrame } from './frames/unifiedPageNodeFrame';
import { unifiedStatisticsNodeFrame } from './frames/unifiedStatisticsNodeFrame';
import { unifiedInvisibleNodeFrame } from './frames/unifiedInvisibleNodeFrame';
import { unifiedCourseNodeFrame } from './frames/unifiedCourseNodeFrame';
import { unifiedModuleNodeFrame } from './frames/unifiedModuleNodeFrame';
import { unifiedCellNodeFrame } from './frames/unifiedCellNodeFrame';

// Track initialization state
let isInitialized = false;

/**
 * Initialize the unified node type store with built-in templates
 * This function loads all unified node templates into the store
 */
export function initializeUnifiedNodeTypeStore(): void {
  if (isInitialized) {
    return;
  }

  const {
    addMultipleNodeTypes,
    hasNodeType
  } = useUnifiedNodeTypeStore.getState();

  // Define unified node templates
  const unifiedNodeTemplates: Record<string, UnifiedFrameJSON> = {
    // Cell-like nodes (non-expandable with process functionality)
    'restnode': unifiedRestNodeFrame,
    'contentnode': unifiedContentNodeFrame,
    'logicnode': unifiedLogicNodeFrame,
    'conditionalnode': unifiedConditionalNodeFrame,
    'statisticsnode': unifiedStatisticsNodeFrame,
    
    // Container-like nodes (expandable with content areas)
    'datanode': unifiedDataNodeFrame,
    'pagenode': unifiedPageNodeFrame,
    'invisiblenode': unifiedInvisibleNodeFrame,
    
    // Legacy node types (converted to unified format)
    'coursenode': unifiedCourseNodeFrame,
    'modulenode': unifiedModuleNodeFrame,
    'cellnode': unifiedCellNodeFrame,
  };

  // Check if templates already exist in store (from persistence)
  const existingNodes = Object.keys(unifiedNodeTemplates).filter(nodeType => hasNodeType(nodeType));

  if (existingNodes.length === Object.keys(unifiedNodeTemplates).length) {
    isInitialized = true;
    return;
  }

  // Add all templates to the store
  addMultipleNodeTypes(unifiedNodeTemplates);

  isInitialized = true;
}

/**
 * Get all available node types from the store
 */
export function getAvailableNodeTypes(): string[] {
  return useUnifiedNodeTypeStore.getState().getAllNodeTypeNames();
}

/**
 * Check if a node type exists in the store
 */
export function hasNodeType(nodeType: string): boolean {
  return useUnifiedNodeTypeStore.getState().hasNodeType(nodeType);
}

/**
 * Get a node type configuration from the store
 */
export function getNodeType(nodeType: string): UnifiedFrameJSON | undefined {
  return useUnifiedNodeTypeStore.getState().getNodeType(nodeType);
}

/**
 * Get node types by category
 */
export function getNodeTypesByCategory(category: string): UnifiedFrameJSON[] {
  return useUnifiedNodeTypeStore.getState().getNodeTypesByCategory(category);
}

/**
 * Get node types by group
 */
export function getNodeTypesByGroup(group: string): UnifiedFrameJSON[] {
  return useUnifiedNodeTypeStore.getState().getNodeTypesByGroup(group);
}

/**
 * Get cell-like nodes (non-expandable with process functionality)
 */
export function getCellLikeNodes(): UnifiedFrameJSON[] {
  return useUnifiedNodeTypeStore.getState().getCellLikeNodes();
}

/**
 * Get container-like nodes (expandable with content areas)
 */
export function getContainerLikeNodes(): UnifiedFrameJSON[] {
  return useUnifiedNodeTypeStore.getState().getContainerLikeNodes();
}

/**
 * Check if the store has been initialized
 */
export function isUnifiedNodeTypeStoreInitialized(): boolean {
  return isInitialized;
}

/**
 * Add a custom node type to the store
 */
export function addCustomNodeType(nodeType: string, config: UnifiedFrameJSON): void {
  useUnifiedNodeTypeStore.getState().addNodeType(nodeType, config);
}

/**
 * Remove a node type from the store
 */
export function removeNodeType(nodeType: string): void {
  useUnifiedNodeTypeStore.getState().removeNodeType(nodeType);
} 