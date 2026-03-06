import { useCallback } from 'react';
import { useNodeContext } from '../../Node/context/useNodeContext';
import { useEdgeContext } from '../../Edge/store/useEdgeContext';
import { useTransaction } from '@jalez/react-state-history';
import { useCodeStore } from '../../../stores/codeStore';

/**
 * Custom hook that provides the core deletion logic with proper transaction handling
 * This preserves the important deletion logic from Flow.tsx
 */
export const useDeletionService = () => {
  const { removeNodes } = useNodeContext();
  const { onEdgeRemove, visibleEdges } = useEdgeContext();
  const { withTransaction } = useTransaction();
  const { removeFlowNodeCode } = useCodeStore();

  const performDeletion = useCallback((selectedNodes: any[], selectedEdges: any[]) => {
    const hasSelectedNodes = selectedNodes.length > 0;
    const hasSelectedEdges = selectedEdges.length > 0;

    if (hasSelectedNodes || hasSelectedEdges) {
      withTransaction(() => {
        // The edges connected to the selected nodes should also be deleted
        const connectedEdges = visibleEdges.filter(edge =>
          selectedNodes.some(node => node.id === edge.source || node.id === edge.target)
        );
        
        if (hasSelectedNodes) {
          // Clean up code store before removing nodes
          selectedNodes.forEach(node => {
            if (node.type === 'flownode' && node.data?.filePath) {
              // Container node - remove the entire file's code
              removeFlowNodeCode(node.id, node.data.filePath);
            } else if (node.type === 'functionnode') {
              // Function node - remove just the function location
              removeFlowNodeCode(node.id);
            } else if (node.type === 'childnode') {
              // Child nodes don't have associated code, skip cleanup
            }
          });
          
          removeNodes(selectedNodes);
        }
        
        if (hasSelectedEdges || connectedEdges.length > 0) {
          const allEdgesToDelete = [...selectedEdges, ...connectedEdges];
          onEdgeRemove(allEdgesToDelete);
        }
      }, "Delete selection");
    }
  }, [removeNodes, onEdgeRemove, visibleEdges, withTransaction]);

  return { performDeletion };
};