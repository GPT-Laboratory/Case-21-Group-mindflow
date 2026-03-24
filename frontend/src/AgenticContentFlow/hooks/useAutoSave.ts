/** @format */

import { useEffect, useRef } from 'react';
import { useNodeContext } from '../Node/context/useNodeContext';
import { useEdgeContext } from '../Edge/store/useEdgeContext';
import { useFlowsStore } from '../stores/useFlowsStore';

const AUTO_SAVE_DELAY = 3000; // 3 seconds debounce

/**
 * Auto-saves the current flow when nodes or edges change.
 * Only saves if a flow is currently selected (has been created/loaded).
 */
export const useAutoSave = () => {
  const { nodes } = useNodeContext();
  const { edges } = useEdgeContext();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  useEffect(() => {
    const { selectedFlowId, flows, saveFlow } = useFlowsStore.getState();
    if (!selectedFlowId) return;

    const flow = flows[selectedFlowId];
    if (!flow) return;

    // Create a fingerprint to avoid saving identical states
    const fingerprint = JSON.stringify({
      nodes: nodes.map(n => ({ id: n.id, position: n.position, data: n.data, parentId: n.parentId })),
      edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
    });

    if (fingerprint === lastSavedRef.current) return;

    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      // Re-check selected flow (may have changed during debounce)
      const currentState = useFlowsStore.getState();
      if (currentState.selectedFlowId !== selectedFlowId) return;

      try {
        await saveFlow(selectedFlowId, {
          name: flow.name,
          description: flow.description,
          nodes,
          edges,
        });
        lastSavedRef.current = fingerprint;
      } catch (err) {
        console.warn('Auto-save failed:', err);
      }
    }, AUTO_SAVE_DELAY);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [nodes, edges]);
};
