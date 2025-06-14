/** @format */

import { registerControl } from "../Controls/registry/controlsRegistry";
import { registerNodeType } from "../Node/registry/nodeTypeRegistry";
import NodeCreationControl from "../Node/controls/NodeCreationControl";

// Import existing node components
import { CellNode } from "./CellNode/CellNode";
import { createCellNodeTemplate } from "./CellNode/createCellNodeTemplate";
import ContainerNode from "./ContainerNode/ContainerNode";
import { createContainerNodeTemplate } from "./ContainerNode/createContainerNodeTemplate";

// Import legacy conditional node (not yet factory-based)
import ConditionalNode from "./ConditionalNode/ConditionalNode";
import { createConditionalNodeTemplate } from "./ConditionalNode/createConditionalNodeTemplate";

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

  // Register basic node types
  registerNodeType("cellnode", CellNode, createCellNodeTemplate);
  
  // Register container nodes with isParent=true (legacy)
  registerNodeType("coursenode", ContainerNode, createContainerNodeTemplate, true);
  registerNodeType("modulenode", ContainerNode, createContainerNodeTemplate, true);
  
  // Register legacy conditional node (not yet factory-based)
  registerNodeType("conditionalnode", ConditionalNode, createConditionalNodeTemplate);
  
  // Initialize cell factory system for process nodes (RestNode, LogicalNode, ContentNode)
  try {
    await factoryNodeRegistration.initializeFactoryNodes();
    console.log("✅ Cell factory nodes (RestNode, LogicalNode, ContentNode) registered successfully");
  } catch (error) {
    console.error("❌ Failed to register cell factory nodes:", error);
    // Fall back to registering empty nodes if factory fails
    registerNodeType("restnode", CellNode, createCellNodeTemplate);
    registerNodeType("logicalnode", CellNode, createCellNodeTemplate);
    registerNodeType("contentnode", CellNode, createCellNodeTemplate);
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
