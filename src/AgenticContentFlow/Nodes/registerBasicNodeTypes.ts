/** @format */

import { registerControl } from "../Controls/registry/controlsRegistry";
import NodeCreationControl from "../Node/controls/NodeCreationControl";

// Import unified factory system
import { 
  initializeUnifiedNodeTypeStore, 
  getAvailableNodeTypes,
  isUnifiedNodeTypeStoreInitialized 
} from "../Node/store/unifiedNodeTypeStoreInitializer";

// Import unified node registration
import { initializeUnifiedNodes } from "../Node/factory//UnifiedNodeRegistration";

// Track initialization state
let registered = false;

/**
 * Call this function to ensure node types are registered
 */
export async function ensureNodeTypesRegistered(): Promise<void> {
  if (registered) return;
  registered = true;

  // Step 1: Initialize the unified node type store with built-in templates
  try {
    initializeUnifiedNodeTypeStore();
    console.log("✅ Unified node type store initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize unified node type store:", error);
    throw new Error(`Unified node type store initialization failed: ${error}`);
  }

  // Step 2: Verify store initialization was successful
  if (!isUnifiedNodeTypeStoreInitialized()) {
    throw new Error("Unified node type store failed to initialize properly");
  }

  // Step 3: Initialize and register unified nodes with React Flow
  try {
    await initializeUnifiedNodes();
    console.log("✅ Unified nodes registered with React Flow successfully");
  } catch (error) {
    console.error("❌ Failed to register unified nodes with React Flow:", error);
    throw new Error(`Unified node registration failed: ${error}`);
  }

  // Step 4: Register the node creation control with all available node types from the store
  const availableNodeTypes = getAvailableNodeTypes();
  console.log(`✅ Registered ${availableNodeTypes.length} node types:`, availableNodeTypes);
  
  registerControl(
    "viewSettings",
    "mindmap",
    "node-creation",
    NodeCreationControl,
    { 
      availableNodeTypes
    }
  );
}
