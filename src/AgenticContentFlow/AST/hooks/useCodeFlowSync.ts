import { useCallback, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import { flowSyncService } from '../services/FlowSyncService';
import { useEdgeContext } from '../../Edge/store/useEdgeContext';

/**
 * Hook for synchronizing code changes with the visual flow
 */
export const useCodeFlowSync = () => {
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const { setEdges: setEdgeContextEdges, edges: edgeContextEdges } = useEdgeContext();

  // Register for flow updates
  useEffect(() => {
    const unsubscribe = flowSyncService.onFlowUpdate((updatedNodes, updatedEdges) => {
      console.log('🔄 useCodeFlowSync: Replacing nodes and edges', {
        nodesCount: updatedNodes.length,
        edgesCount: updatedEdges.length,
        nodeIds: updatedNodes.map(n => n.id)
      });
      
      console.log('🔄 useCodeFlowSync: Edges being set:', updatedEdges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target
      })));
      
      console.log('🔄 useCodeFlowSync: Current EdgeContext edges:', edgeContextEdges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target
      })));
      
      // Update both React Flow and EdgeContext
      // Use callback form to ensure complete replacement, not merging
      setNodes(() => updatedNodes);
      setEdges(() => updatedEdges);
      
      // Also update the EdgeContext store
      setEdgeContextEdges(updatedEdges, false); // false = not a user click
      
      console.log('🔄 useCodeFlowSync: Both React Flow and EdgeContext have been updated');
    });

    return unsubscribe;
  }, [setNodes, setEdges, setEdgeContextEdges, edgeContextEdges]);

  /**
   * Update function code and synchronize the flow
   */
  const updateFunctionCodeAndSync = useCallback(async (
    functionId: string, 
    newFunctionCode: string,
    filePath: string
  ): Promise<boolean> => {
    const currentNodes = getNodes();
    const currentEdges = getEdges();
    
    return flowSyncService.updateFunctionCodeAndSync(
      functionId,
      newFunctionCode,
      filePath,
      currentNodes,
      currentEdges
    );
  }, [getNodes, getEdges]);

  /**
   * Update entire file code and synchronize the flow
   */
  const updateFileCodeAndSync = useCallback(async (
    filePath: string,
    newSourceCode: string
  ): Promise<boolean> => {
    const currentNodes = getNodes();
    const currentEdges = getEdges();
    
    return flowSyncService.updateFileCodeAndSync(
      filePath,
      newSourceCode,
      currentNodes,
      currentEdges
    );
  }, [getNodes, getEdges]);

  return {
    updateFunctionCodeAndSync,
    updateFileCodeAndSync
  };
};