import { Node } from "@xyflow/react";
import { NodeData } from "../../types";

/**
 * Creates a template for a new logical node
 *
 * @param params Object containing node creation parameters
 * @returns A new logical node configuration
 */
export const createLogicalNodeTemplate = (
  params: {
    id: string;
    position: { x: number; y: number };
    eventNode?: Node<NodeData>;
  } & Record<string, any>
): Node<NodeData> => {
  const { id, position, eventNode } = params;

  // Get parent level if available
  const level = eventNode?.data.level;
  const eventDepth = typeof eventNode?.data.depth === 'number' ? eventNode.data.depth : 0;

  return {
    id,
    type: "logicalnode",
    data: {
      label: params.label || "Logic Processor",
      level,
      parent: eventNode?.id,
      subject: eventNode?.data.subject || "logic",
      nodeLevel: params.nodeLevel || "intermediate",
      details: params.details || "Configure logical operations",
      isParent: false,
      expanded: false,
      depth: eventDepth + 1,
      operation: params.operation || "filter",
      condition: params.condition || "",
      inputSchema: params.inputSchema || {},
      outputSchema: params.outputSchema || {},
      rules: params.rules || []
    },
    style: {
      width: 200,
      height: 200,
    },
    position,
    parentId: eventNode?.parentId,
    extent: eventNode?.parentId ? "parent" : undefined,
  };
};