// Node type groupings for better organization

import { factoryNodeRegistration } from "@/AgenticContentFlow/Node/factories/factory/FactoryNodeRegistration";

export type ProcessNodeType = 'restnode' | 'logicalnode';
export type PreviewNodeType = 'contentnode';
export type ContainerNodeType = 'customnode'; // Add more container types as needed

export type NodeGroup = 'process' | 'preview' | 'container';

export function getNodeGroup(nodeType: string): NodeGroup {
  // First try to get the group from factory configuration
  try {
    const configLoader = factoryNodeRegistration.getConfigurationLoader();
    const factoryConfig = configLoader.getConfiguration(nodeType);
    
    if (factoryConfig && factoryConfig.group) {
        console.log(`Node type ${nodeType} found in factory config with group: ${factoryConfig.group}`);
      return factoryConfig.group;

    }
  } catch (error) {
    console.warn(`Failed to get factory group for ${nodeType}:`, error);
  }
return 'process'; // Default to 'process' if no group found
}

export function isProcessNode(nodeType: string): boolean {
  return getNodeGroup(nodeType) === 'process';
}

export function isPreviewNode(nodeType: string): boolean {
  return getNodeGroup(nodeType) === 'preview';
}

export function isContainerNode(nodeType: string): boolean {
  return getNodeGroup(nodeType) === 'container';
}