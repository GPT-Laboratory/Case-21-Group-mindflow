import { useCallback } from 'react';
import { useNodeContext } from '../../Node/store/useNodeContext';
import { useEdgeContext } from '../../Edge/store/useEdgeContext';
import { useTransaction } from '@jalez/react-state-history';

/**
 * Custom hook that provides the core deletion logic with proper transaction handling
 * This preserves the important deletion logic from Flow.tsx
 */
export const useDeletionService = () => {
  const { removeNodes } = useNodeContext();
  const { onEdgeRemove, visibleEdges } = useEdgeContext();
  const { withTransaction } = useTransaction();

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