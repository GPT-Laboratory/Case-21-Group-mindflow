/** @format */

import { registerControl } from "../Controls/registry/controlsRegistry";
import NodeCreationControl from "../Node/controls/NodeCreationControl";

// Import factory systems
import { containerNodeRegistration } from "../Node/factories/container/ContainerNodeRegistration";
import { factoryNodeRegistration } from "../Node/factories/cell/FactoryNodeRegistration";

// Import handle type registration
import { ensureHandleTypesRegistered } from "../Handles/registerBasicHandleTypes";

// Track initialization state
let registered = false;

/**
 * Call this function to ensure node types are registered
 */
export async function ensureNodeTypesRegistered(): Promise<void> {
  if (registered) return;
  registered = true;

  // Initialize cell factory system for process nodes (RestNode, LogicalNode, ContentNode, ConditionalNode)
  try {
    await factoryNodeRegistration.initializeFactoryNodes();
    console.log("✅ Cell factory nodes (RestNode, LogicalNode, ContentNode, ConditionalNode) registered successfully");
  } catch (error) {
    console.error("❌ Failed to register cell factory nodes:", error);
    // Factory system is the primary method now - if it fails, we have a real issue
    throw new Error(`Cell factory system failed to initialize: ${error}`);
  }

  // Initialize container factory system for container nodes (DataNode, PageNode, StatisticsNode, InvisibleNode)
  try {
    await containerNodeRegistration.initializeContainerNodes();
    console.log("✅ Container factory nodes (DataNode, PageNode, StatisticsNode, InvisibleNode) registered successfully");
  } catch (error) {
    console.error("❌ Failed to register container factory nodes:", error);
    // Factory system is the primary method now - if it fails, we have a real issue
    throw new Error(`Container factory system failed to initialize: ${error}`);
  }

  // Register handle type configurations
  ensureHandleTypesRegistered();

  // Register the node creation control with all available node types
  registerControl(
    "viewSettings",
    "mindmap",
    "node-creation",
    NodeCreationControl,
    { 
      availableNodeTypes: [
        "cellnode", 
        "coursenode", 
        "modulenode", 
        "datanode", 
        "pagenode", 
        "contentnode", 
        "conditionalnode",
        "invisiblenode",
        "statisticsnode",
        "restnode",
        "logicalnode"
      ] 
    }
  );
}
