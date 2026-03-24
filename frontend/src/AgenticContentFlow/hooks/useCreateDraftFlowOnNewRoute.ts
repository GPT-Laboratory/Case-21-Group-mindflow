/** @format */

import { useEffect } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { useFlowsStore } from '../stores/useFlowsStore';
import { useNotifications } from '../Notifications/hooks/useNotifications';

/** Dedupes React Strict Mode double-mount and concurrent navigations to /flows/new */
let newFlowCreationPromise: Promise<string | null> | null = null;

/**
 * When the editor opens at `/flows/new`, persist an empty draft in the API and
 * replace the URL with `/flows/{id}` so autosave and the flows list stay in sync.
 */
export function useCreateDraftFlowOnNewRoute(
  flowId: string | undefined,
  navigate: NavigateFunction
) {
  const { showErrorToast } = useNotifications();

  useEffect(() => {
    if (flowId !== 'new') return;

    if (!newFlowCreationPromise) {
      newFlowCreationPromise = (async () => {
        try {
          const { createFlow, setSelectedFlow } = useFlowsStore.getState();
          const newFlow = await createFlow({
            name: 'Untitled flow',
            description: '',
            nodes: [],
            edges: [],
            type: 'saved',
          });
          if (!newFlow) {
            const msg = useFlowsStore.getState().error ?? 'Could not create flow';
            showErrorToast('Create flow failed', msg);
            return null;
          }
          setSelectedFlow(newFlow.id);
          return newFlow.id;
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Could not create flow';
          showErrorToast('Create flow failed', message);
          return null;
        } finally {
          newFlowCreationPromise = null;
        }
      })();
    }

    let cancelled = false;
    const p = newFlowCreationPromise;
    p.then((id) => {
      if (cancelled) return;
      if (id) {
        navigate(`/flows/${id}`, { replace: true });
      } else {
        navigate('/flows', { replace: true });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [flowId, navigate, showErrorToast]);
}
