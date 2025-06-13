// Node type groupings for better organization
export type ProcessNodeType = 'restnode' | 'logicalnode';
export type PreviewNodeType = 'contentnode';
export type ContainerNodeType = 'customnode'; // Add more container types as needed

export type NodeGroup = 'process' | 'preview' | 'container';

export function getNodeGroup(nodeType: string): NodeGroup {
  const processNodes: ProcessNodeType[] = ['restnode', 'logicalnode'];
  const previewNodes: PreviewNodeType[] = ['contentnode'];
  const containerNodes: ContainerNodeType[] = ['customnode'];

  if (processNodes.includes(nodeType as ProcessNodeType)) {
    return 'process';
  }
  if (previewNodes.includes(nodeType as PreviewNodeType)) {
    return 'preview';
  }
  if (containerNodes.includes(nodeType as ContainerNodeType)) {
    return 'container';
  }
  
  // Default fallback
  return 'process';
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