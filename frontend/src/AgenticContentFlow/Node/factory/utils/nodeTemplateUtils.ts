/** @format */

import { NodeData } from "@/AgenticContentFlow/types";
import { Node } from "@xyflow/react";

/**
 * Shared utilities for creating node templates across both cell and container factories
 */

/**
 * Base template data that all nodes should have
 */
export interface BaseNodeTemplateData {
  label: string;
  nodeLevel: 'basic' | 'intermediate' | 'advanced';
  details: string;
  parent?: string;
  subject?: string;
}

/**
 * Common parameters for creating any node template
 */
export interface NodeTemplateParams {
  id: string;
  position: { x: number; y: number };
  eventNode?: Node<NodeData>;
  [key: string]: any;
}

/**
 * Creates base node data structure that both factories can extend
 */
export const createBaseNodeData = (
  params: NodeTemplateParams,
  defaults: Partial<BaseNodeTemplateData> = {}
): BaseNodeTemplateData => {
  const { eventNode } = params;
  
  return {
    label: params.label || defaults.label || "New Node",
    nodeLevel: params.nodeLevel || defaults.nodeLevel || 'basic',
    details: params.details || defaults.details || "Node description",
    parent: eventNode?.id,
    subject: eventNode?.data.subject || defaults.subject || "general",
    ...params
  };
};

/**
 * Creates base node structure that both factories can extend
 */
export const createBaseNodeTemplate = (
  params: NodeTemplateParams,
  nodeType: string,
  additionalData: Record<string, any> = {}
): Node<NodeData> => {
  const { id, position, eventNode } = params;
  
  const baseData = createBaseNodeData(params);
  
  return {
    id,
    type: nodeType,
    data: {
      ...baseData,
      ...additionalData
    },
    position,
    parentId: eventNode?.parentId,
    extent: eventNode?.parentId ? "parent" : undefined,
    origin: [0.0, 0.5],
  };
};