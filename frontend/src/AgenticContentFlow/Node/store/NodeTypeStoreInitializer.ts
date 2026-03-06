/** @format */

import { useUnifiedNodeTypeStore } from './useNodeTypeStore';
import { FrameJSON } from '../factory/types/FrameJSON';


// Track initialization state
let isInitialized = false;

/**
 * Initialize the unified node type store with API data
 * This function loads all node types from the API into the store
 */
export async function initializeUnifiedNodeTypeStore(): Promise<void> {
  if (isInitialized) {
    return;
  }

  const {
    fetchNodeTypes,
    getAllNodeTypeNames,
    addMultipleNodeTypes
  } = useUnifiedNodeTypeStore.getState();

  try {
    // Step 1: Register AST node types first to ensure they're preserved
    const { ASTNodeTypeRegistration } = await import('../../AST/services/ASTNodeTypeRegistration');
    ASTNodeTypeRegistration.initializeASTNodeTypes();
    console.log('✅ AST node types registered');

    // Step 2: Fetch node types from API (will merge with existing AST types)
    await fetchNodeTypes();
    
    // Check if we have node types loaded
    const nodeTypeNames = getAllNodeTypeNames();
    
    if (nodeTypeNames.length > 0) {
      console.log(`✅ Loaded ${nodeTypeNames.length} node types from API and local registrations`);
      isInitialized = true;
    } else {
      console.log('⚠️ No node types loaded from API, using fallback templates');
    }
  } catch (error) {
    console.error('❌ Failed to load node types from API:', error);
    console.log('🔄 Falling back to built-in templates');
  }
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
export function getNodeType(nodeType: string): FrameJSON | undefined {
  return useUnifiedNodeTypeStore.getState().getNodeType(nodeType);
}

/**
 * Get node types by category
 */
export function getNodeTypesByCategory(category: string): FrameJSON[] {
  return useUnifiedNodeTypeStore.getState().getNodeTypesByCategory(category);
}

/**
 * Get node types by group
 */
export function getNodeTypesByGroup(group: string): FrameJSON[] {
  return useUnifiedNodeTypeStore.getState().getNodeTypesByGroup(group);
}

/**
 * Get cell-like nodes (non-expandable with process functionality)
 */
export function getCellLikeNodes(): FrameJSON[] {
  return useUnifiedNodeTypeStore.getState().getCellLikeNodes();
}

/**
 * Get container-like nodes (expandable with content areas)
 */
export function getContainerLikeNodes(): FrameJSON[] {
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
export function addCustomNodeType(nodeType: string, config: FrameJSON): void {
  useUnifiedNodeTypeStore.getState().addNodeType(nodeType, config);
}

/**
 * Remove a node type from the store
 */
export function removeNodeType(nodeType: string): void {
  useUnifiedNodeTypeStore.getState().removeNodeType(nodeType);
} 