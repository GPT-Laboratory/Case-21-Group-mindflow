import { GenerationResult, GenerationType, FlowGenerationResult } from "../../generatortypes";
import { GenerationPanel } from "./GenerationPanel";
import { useSelect } from "../../../Select/contexts/SelectContext";
import { useNodeContext } from "../../../Node/context/useNodeContext";
import { useEdgeContext } from "../../../Edge/store/useEdgeContext";
import { Node } from "@xyflow/react";
import { NodeData } from "../../../types";
import { useCallback } from "react";
import { handleContainerization } from "../../../Node/hooks/utils/nodeUtils";
import { isHorizontalConnection } from "../../../Node/hooks/utils/dragUtils";

export interface GenerationControlProps {
  type?: GenerationType;
  onGenerated?: (result: GenerationResult) => void;
}

/**
 * Generation Control Button
 * 
 * Unified control for all generation types - replaces the separate Flow generation control
 * and can handle process, flow, and hybrid generation.
 */
const GenerationControl: React.FC<GenerationControlProps> = ({
  type = 'flow',
  onGenerated
}) => {
  const { selectedNodes } = useSelect();
  const { setNodes } = useNodeContext();
  const { setEdges } = useEdgeContext();

  // Apply containerization logic to generated flow for horizontal connections
  const applyContainerizationToGeneratedFlow = useCallback((generatedNodes: Node<NodeData>[], generatedEdges: any[]) => {
    console.log('🔧 Applying containerization to generated flow');
    
    // Deduplicate generated nodes by ID before processing
    const nodeIdMap = new Map<string, Node<NodeData>>();
    const duplicateIds = new Set<string>();
    
    generatedNodes.forEach(node => {
      if (nodeIdMap.has(node.id)) {
        duplicateIds.add(node.id);
        console.warn(`[Containerization] Duplicate node ID found in generated flow: ${node.id}. Keeping the last occurrence.`);
      }
      nodeIdMap.set(node.id, node);
    });
    
    // Log if we found duplicates
    if (duplicateIds.size > 0) {
      console.warn(`[Containerization] Removed ${duplicateIds.size} duplicate nodes from generated flow`);
    }
    
    const deduplicatedNodes = Array.from(nodeIdMap.values());
    
    // Create maps for efficient lookups
    const nodeMap = new Map(deduplicatedNodes.map(n => [n.id, n]));
    const nodeParentIdMapWithChildIdSet = new Map<string, Set<string>>();
    
    // Build parent-child relationship map
    deduplicatedNodes.forEach(node => {
      if (node.parentId) {
        if (!nodeParentIdMapWithChildIdSet.has(node.parentId)) {
          nodeParentIdMapWithChildIdSet.set(node.parentId, new Set());
        }
        nodeParentIdMapWithChildIdSet.get(node.parentId)!.add(node.id);
      }
    });
    
    // Find horizontal connections
    const horizontalEdges = generatedEdges.filter(edge =>
      isHorizontalConnection(edge.sourceHandle, edge.targetHandle)
    );
    
    if (horizontalEdges.length === 0) {
      console.log('🔧 No horizontal connections found, no containerization needed');
      return { nodes: deduplicatedNodes, edges: generatedEdges };
    }
    
    console.log(`🔧 Found ${horizontalEdges.length} horizontal connection(s), applying containerization`);
    
    const nodesToUpdate: Node<NodeData>[] = [...deduplicatedNodes];
    const containersToAdd: Node<NodeData>[] = [];
    const processedEdges = new Set<string>();
    
    // Process each horizontal edge
    horizontalEdges.forEach(edge => {
      if (processedEdges.has(edge.id)) return;
      
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);
      
      if (sourceNode && targetNode) {
        const containerizationResult = handleContainerization(
          targetNode,
          sourceNode,
          edge,
          nodeMap,
          nodeParentIdMapWithChildIdSet
        );
        
        // Update nodes based on containerization result
        if (containerizationResult.containerToAdd) {
          containersToAdd.push(containerizationResult.containerToAdd);
          // Update the nodeMap with the new container
          nodeMap.set(containerizationResult.containerToAdd.id, containerizationResult.containerToAdd);
        }
        
        if (containerizationResult.updatedFromNode) {
          const index = nodesToUpdate.findIndex(n => n.id === containerizationResult.updatedFromNode!.id);
          if (index >= 0) {
            nodesToUpdate[index] = containerizationResult.updatedFromNode;
            nodeMap.set(containerizationResult.updatedFromNode.id, containerizationResult.updatedFromNode);
          }
        }
        
        if (containerizationResult.updatedToNode) {
          const index = nodesToUpdate.findIndex(n => n.id === containerizationResult.updatedToNode!.id);
          if (index >= 0) {
            nodesToUpdate[index] = containerizationResult.updatedToNode;
            nodeMap.set(containerizationResult.updatedToNode.id, containerizationResult.updatedToNode);
          }
        }
        
        if (containerizationResult.updatedToNodeSiblings) {
          containerizationResult.updatedToNodeSiblings.forEach(sibling => {
            const index = nodesToUpdate.findIndex(n => n.id === sibling.id);
            if (index >= 0) {
              nodesToUpdate[index] = sibling;
              nodeMap.set(sibling.id, sibling);
            }
          });
        }
        
        processedEdges.add(edge.id);
      }
    });
    
    // Combine original nodes with new containers
    const finalNodes = [...nodesToUpdate, ...containersToAdd];
    
    console.log(`🔧 Containerization complete: ${containersToAdd.length} containers added`);
    
    return { nodes: finalNodes, edges: generatedEdges };
  }, []);

  // Handle flow generation with the new unified system
  const handleFlowGenerated = useCallback((result: GenerationResult) => {
    // Type guard to ensure we have a flow result
    if (result.type === 'flow') {
      const flowResult = result as FlowGenerationResult;
      console.log('🎯 Flow generated:', { nodeCount: flowResult.nodes.length, edgeCount: flowResult.edges.length });
      
      // Type-cast the generated nodes to our NodeData interface since they come from our flow generation service
      const typedNodes = flowResult.nodes as Node<NodeData>[];
      
      // Apply containerization logic for horizontal connections
      const processedResult = applyContainerizationToGeneratedFlow(typedNodes, flowResult.edges);
      
      // Final deduplication check before setting nodes
      const finalNodeIdMap = new Map<string, Node<NodeData>>();
      const finalDuplicateIds = new Set<string>();
      
      processedResult.nodes.forEach(node => {
        if (finalNodeIdMap.has(node.id)) {
          finalDuplicateIds.add(node.id);
          console.warn(`[Final] Duplicate node ID found before setting flow: ${node.id}. Keeping the last occurrence.`);
        }
        finalNodeIdMap.set(node.id, node);
      });
      
      // Log if we found duplicates
      if (finalDuplicateIds.size > 0) {
        console.warn(`[Final] Removed ${finalDuplicateIds.size} duplicate nodes before setting flow`);
      }
      
      const finalDeduplicatedNodes = Array.from(finalNodeIdMap.values());
      
      // Replace current flow with processed flow (includes containerization)
      setNodes(finalDeduplicatedNodes);
      setEdges(processedResult.edges);
      
      console.log('✅ Flow generation complete with containerization applied');
    } else {
      console.warn('Expected flow generation result, got:', result.type);
    }
  }, [setNodes, setEdges, applyContainerizationToGeneratedFlow]);

  const handleGenerated = (result: GenerationResult) => {
    if (onGenerated) {
      onGenerated(result);
    } else {
      // Handle internally if no external handler provided
      handleFlowGenerated(result);
    }
  };

  return (
    <div className="w-full p-0 m-0 border-none shadow-none">
      <GenerationPanel
        type={type}
        selectedNodes={selectedNodes}
        onGenerated={handleGenerated}
      />
    </div>
  );
};

export default GenerationControl;