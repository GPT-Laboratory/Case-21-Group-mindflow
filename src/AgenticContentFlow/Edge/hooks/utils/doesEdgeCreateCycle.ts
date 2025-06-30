import { Connection, Edge } from "@xyflow/react";

/**
 * @function doesEdgeCreateCycle
 * Determines whether adding `edge` to the existing graph would introduce
 * a directed cycle—i.e. whether there is already a path from `edge.target`
 * back to `edge.source`.
 *
 * @param edge
 *   The candidate edge to test.
 * @param edgeSourceMap
 *   A Map from node ID → array of outgoing Edges for that node.
 * @returns
 *   `true` if adding `edge` creates a cycle, otherwise `false`.
 */
export function doesEdgeCreateCycle(
  edge: Edge | Connection,
  edgeSourceMap: Map<string, Edge[]>
): boolean {
  const { source, target } = edge;

  // Direct self-loop?
  if (source === target) {
    return true;
  }

  // DFS/BFS stack from `target` → look for `source`
  const visited = new Set<string>();
  const stack = [target];

  while (stack.length > 0) {
    const nodeId = stack.pop()!;

    if (nodeId === source) {
      // Found a path back to `source` → adding edge closes a cycle
      return true;
    }

    if (visited.has(nodeId)) {
      continue;
    }
    visited.add(nodeId);

    const outEdges = edgeSourceMap.get(nodeId);
    if (!outEdges) {
      continue;
    }

    for (const e of outEdges) {
      stack.push(e.target);
    }
  }

  // No path from target → source ⇒ no cycle created
  return false;
}
