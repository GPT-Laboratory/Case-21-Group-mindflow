/** @format */

import type { Node, Edge } from '@xyflow/react';
import type { Flow, FlowPayload } from '../../stores/useFlowsStore';
import { FlowsService } from '../../services/FlowsService';

/** Key used in flow.metadata for linked RAG document ids (ordered). */
export const FLOW_DOCUMENT_IDS_KEY = 'document_ids' as const;

/**
 * Normalized list of document ids for the flow (from metadata; legacy merged on API).
 */
export function getDocumentIdsFromFlow(flow: Flow | undefined): number[] {
  if (!flow?.metadata) return [];
  const raw = flow.metadata[FLOW_DOCUMENT_IDS_KEY];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n) && n > 0);
}

/**
 * Build a save payload for the flow with updated metadata (e.g. document_ids).
 * Pass live canvas nodes/edges when saving from the editor.
 */
export function buildFlowPayloadWithMetadata(
  flow: Flow,
  metadata: Record<string, unknown>,
  options?: { nodes?: Node[]; edges?: Edge[] }
): FlowPayload {
  return FlowsService.toPayload({
    ...flow,
    nodes: options?.nodes ?? flow.nodes,
    edges: options?.edges ?? flow.edges,
    metadata: {
      ...(flow.metadata ?? {}),
      ...metadata,
    },
  });
}

/**
 * Append a document id to metadata.document_ids (deduped, preserves order).
 */
export function appendDocumentIdToMetadata(
  flow: Flow,
  newId: number,
  options?: { nodes?: Node[]; edges?: Edge[] }
): FlowPayload {
  const existing = getDocumentIdsFromFlow(flow);
  const next = existing.includes(newId) ? existing : [...existing, newId];
  return buildFlowPayloadWithMetadata(
    flow,
    { [FLOW_DOCUMENT_IDS_KEY]: next },
    options
  );
}
