import { getNodeType } from "@/AgenticContentFlow/Node/store/NodeTypeStoreInitializer";

// Node type groupings for better organization
// Only groups matter in the unified system: 'cell' and 'container'

export type NodeGroup = 'cell' | 'container';

export function getNodeGroup(nodeType: string): NodeGroup {
  const config = getNodeType(nodeType);
  if (config && config.group) {
    return config.group as NodeGroup;
  }
  return 'cell'; // Default to 'cell' if no group found
}

export function isCellNode(nodeType: string): boolean {
  return getNodeGroup(nodeType) === 'cell';
}

export function isContainerNode(nodeType: string): boolean {
  return getNodeGroup(nodeType) === 'container';
}