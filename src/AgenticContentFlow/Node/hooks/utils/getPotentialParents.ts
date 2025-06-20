import { Node } from "@xyflow/react";
import { NodeData } from "../../../types";
import { calculateParentCandidate } from "./sharedDragUtils";



/**
 * Gets the most suitable potential parent ID from a list of candidates.
 * Only nodes that are already parents (exist in nodeParentIdMapWithChildIdSet) or are the current parent of the node
 * can be suggested as potential parents.
 * 
 * Selection criteria (in order):
 * 1. Excludes any nodes that are children/grandchildren of the given node to prevent cycles
 * 2. Must be either an existing parent (has children) or be the current parent of the node
 * 3. Prefers siblings that are parents over other relationships
 * 4. Prefers current parent if it's among valid candidates
 * 5. For other valid parent candidates:
 *    - Prefers nodes that overlap with the current node's position
 *    - If multiple nodes overlap, selects the one that contains more of the node's area
 *    - If no overlap, selects the closest node
 * 6. If all else is equal, prefers younger nodes (more recently created)
 * 7. Returns rootIndicator string if no valid candidates found, indicating node should become a root node
 * 
 * @param {Node<NodeData>} node - The node being dragged
 * @param {Node[]} potentialParentCandidates - List of nodes that intersect with the dragged node
 * @param {Map<string, Set<string>>} nodeParentIdMapWithChildIdSet - Map of parent IDs to their set of child IDs
 * @param {Map<string, Node<NodeData>>} poolOfAllNodes - Map of all nodes in the workspace for ancestry checks
 * @param {string} rootIndicator - String to return when node should become a root node (no parent)
 * @returns {string} The ID of the most suitable parent candidate, or rootIndicator if no valid candidates found
 */
export const getPotentialParentId = (
    node: Node<NodeData>, 
    potentialParentCandidates: Node[],
    nodeParentIdMapWithChildIdSet: Map<string, Set<string>>, 
    poolOfAllNodes: Map<string, Node<NodeData>>,
    rootIndicator: string
): string => {
    return calculateParentCandidate(
        node,
        potentialParentCandidates,
        nodeParentIdMapWithChildIdSet,
        poolOfAllNodes,
        rootIndicator
    );
};