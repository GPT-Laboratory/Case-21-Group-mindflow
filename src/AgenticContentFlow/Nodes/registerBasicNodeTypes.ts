/** @format */

import { registerControl } from "../Controls/registry/controlsRegistry";
import { registerNodeType } from "../Node/registry/nodeTypeRegistry";
import NodeCreationControl from "../Node/controls/NodeCreationControl";

// Import existing node components
import { CellNode } from "./CellNode/CellNode";
import { createCellNodeTemplate } from "./CellNode/createCellNodeTemplate";
import ContainerNode from "./ContainerNode/ContainerNode";
import { createContainerNodeTemplate } from "./ContainerNode/createContainerNodeTemplate";

// Import new node components
import DataNode from "./DataNode/DataNode";
import { createDataNodeTemplate } from "./DataNode/createDataNodeTemplate";
import PageNode from "./PageNode/PageNode";
import { createPageNodeTemplate } from "./PageNode/createPageNodeTemplate";
import ConditionalNode from "./ConditionalNode/ConditionalNode";
import { createConditionalNodeTemplate } from "./ConditionalNode/createConditionalNodeTemplate";
import { InvisibleNode } from './InvisibleNode/InvisibleNode';
import { createInvisibleNodeTemplate } from './InvisibleNode/createInvisibleNodeTemplate';
import { StatisticsNode } from './StatisticsNode/StatisticsNode';
import { createStatisticsNodeTemplate } from "./StatisticsNode/createStatisticsNodeTemplate";

// Import factory system for RestNode, LogicalNode, and ContentNode
import { factoryNodeRegistration } from "../Node/factory/FactoryNodeRegistration";

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
  
  // Register container nodes with isParent=true
  registerNodeType("coursenode", ContainerNode, createContainerNodeTemplate, true);
  registerNodeType("modulenode", ContainerNode, createContainerNodeTemplate, true);
  
  // Register new node types
  registerNodeType("datanode", DataNode, createDataNodeTemplate, true);
  registerNodeType("pagenode", PageNode, createPageNodeTemplate, true);
  registerNodeType("conditionalnode", ConditionalNode, createConditionalNodeTemplate);
  registerNodeType("invisiblenode", InvisibleNode, createInvisibleNodeTemplate, true);
  registerNodeType("statisticsnode", StatisticsNode, createStatisticsNodeTemplate, true);
  
  // Initialize factory system and register RestNode, LogicalNode, and ContentNode
  try {
    await factoryNodeRegistration.initializeFactoryNodes();
    console.log("✅ Factory-based nodes (RestNode, LogicalNode, ContentNode) registered successfully");
  } catch (error) {
    console.error("❌ Failed to register factory-based nodes:", error);
    // Fall back to registering empty nodes if factory fails
    registerNodeType("restnode", CellNode, createCellNodeTemplate);
    registerNodeType("logicalnode", CellNode, createCellNodeTemplate);
    registerNodeType("contentnode", CellNode, createCellNodeTemplate);
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
