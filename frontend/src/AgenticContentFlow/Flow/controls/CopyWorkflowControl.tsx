import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import ControlButton from "../../Controls/Components/ControlButton";

const CopyWorkflowControl: React.FC = () => {
  const { getNodes, getEdges } = useReactFlow();
  const [copied, setCopied] = useState(false);

  const handleCopyWorkflow = async () => {
    try {
      // Get current workflow data
      const nodes = getNodes();
      const edges = getEdges();
      
      // Create a clean workflow object
      const workflow = {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
          width: node.width,
          height: node.height,
          selected: node.selected,
          dragging: node.dragging,
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          type: edge.type,
          data: edge.data,
        })),
        metadata: {
          exportedAt: new Date().toISOString(),
          nodeCount: nodes.length,
          edgeCount: edges.length,
          version: "1.0.0"
        }
      };

      // Copy to clipboard as formatted JSON
      await navigator.clipboard.writeText(JSON.stringify(workflow, null, 2));
      
      // Show success feedback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      console.log('✅ Workflow copied to clipboard:', workflow);
    } catch (error) {
      console.error('❌ Failed to copy workflow:', error);
    }
  };

  return (
    <ControlButton
      tooltip={copied ? "Copied!" : "Copy Workflow JSON"}
      onClick={handleCopyWorkflow}
      icon={copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      active={copied}
    />
  );
};

export default CopyWorkflowControl;