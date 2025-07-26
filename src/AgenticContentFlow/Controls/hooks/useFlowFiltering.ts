import { Node } from '@xyflow/react';
import { useNodeContext } from '../../Node/context/useNodeContext';

/**
 * Simple hook for searching nodes in a flow
 * Used to find specific functions when there are many in a code file
 */
export const useFlowFiltering = () => {
  const { nodes } = useNodeContext();

  // Search nodes by function name, description, or label
  const searchNodes = (searchTerm: string): Node[] => {
    if (!searchTerm.trim()) return nodes;
    
    const searchLower = searchTerm.toLowerCase();
    return nodes.filter(node => {
      const functionName = node.data?.functionName?.toLowerCase() || '';
      const functionDescription = node.data?.functionDescription?.toLowerCase() || '';
      const label = node.data?.label?.toLowerCase() || '';
      
      return functionName.includes(searchLower) ||
             functionDescription.includes(searchLower) ||
             label.includes(searchLower);
    });
  };

  // Calculate node complexity based on connections (for details display)
  const getNodeComplexity = (node: Node): 'simple' | 'complex' => {
    const connectionCount = (node.data?.connections?.length || 0) + 
                           (node.data?.dependencies?.length || 0) +
                           (node.data?.childNodes?.length || 0);
    return connectionCount <= 3 ? 'simple' : 'complex';
  };

  return {
    searchNodes,
    getNodeComplexity,
    totalNodes: nodes.length
  };
};