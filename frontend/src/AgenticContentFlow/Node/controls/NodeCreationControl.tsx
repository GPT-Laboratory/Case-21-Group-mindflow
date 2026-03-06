import React, { useState, useEffect, useRef } from "react";
import { PlusCircle } from "lucide-react";
import ControlDropdown from "../../Controls/Components/ControlDropdown";
import NodeTypeList from "./components/NodeTypeList";
import NodePlacementOverlay from "./components/NodePlacementOverlay";
import PlacementIndicator from "./components/PlacementIndicator";
import { useNodePlacement } from "./hooks/useNodePlacement";
import { useNodeTypeData } from "./hooks/useNodeTypeData";
import { registerShortcut, DEFAULT_SHORTCUT_CATEGORIES } from "@jalez/react-shortcuts-provider";

interface NodeCreationControlProps {
  availableNodeTypes?: string[]; // Keep for backward compatibility
}

const NodeCreationControl: React.FC<NodeCreationControlProps> = () => {
  const [open, setOpen] = useState(false);
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { nodeTypes, getNodeTypeConfig } = useNodeTypeData();
  const {
    isPlacingNode,
    mousePosition,
    isOverFlow,
    startPlacement,
    cancelPlacement
  } = useNodePlacement();

  // Register keyboard shortcut for opening the dropdown
  useEffect(() => {
    registerShortcut(
      DEFAULT_SHORTCUT_CATEGORIES.TOOLS,
      "open-node-creation",
      "n",
      () => {
        if (!isPlacingNode) {
          setOpen(true);
          // Focus will be handled by handleOpenChange
        }
      },
      "Open Node Creation Dropdown"
    );
  }, [isPlacingNode]);

  const handleNodeTypeSelect = (nodeType: string) => {
    setSelectedNodeType(nodeType);
    setOpen(false);
    startPlacement(nodeType);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset focus when closing
      setSelectedNodeType(null);
    } else {
      // Focus the dropdown content when opening
      setTimeout(() => {
        const container = dropdownRef.current;
        if (container) {
          container.focus();
        }
      }, 50);
    }
  };

  // Create a custom dropdown content with the NodeTypeList
  const dropdownContent = (
    <div 
      ref={dropdownRef}
      className="w-80 max-h-96 overflow-y-auto p-2"
      tabIndex={0}
      onFocus={() => {
        // Ensure the NodeTypeList gets focus when the container is focused
        const nodeTypeList = dropdownRef.current?.querySelector('[role="listbox"]') as HTMLElement;
        if (nodeTypeList) {
          nodeTypeList.focus();
        }
      }}
    >
      <NodeTypeList
        nodeTypes={nodeTypes}
        onNodeTypeSelect={handleNodeTypeSelect}
        isOpen={open}
      />
    </div>
  );

  const selectedNodeTypeConfig = selectedNodeType ? getNodeTypeConfig(selectedNodeType) : null;
  const nodeTypeName = selectedNodeTypeConfig?.defaultLabel || selectedNodeType || '';

  return (
    <>
      <ControlDropdown
        tooltip={isPlacingNode ? "Click on the flow to place node" : "Create New Node (N)"}
        icon={<PlusCircle className="size-4" />}
        items={[]} // Empty items array since we're using custom content
        open={open}
        onOpenChange={handleOpenChange}
        customContent={dropdownContent}
        disabled={isPlacingNode}
      />
      
      <PlacementIndicator
        isVisible={isPlacingNode}
        nodeTypeName={nodeTypeName}
        onCancel={cancelPlacement}
      />

      {selectedNodeTypeConfig && (
        <NodePlacementOverlay
          isVisible={isPlacingNode && isOverFlow}
          mousePosition={mousePosition}
          nodeType={selectedNodeTypeConfig}
        />
      )}
    </>
  );
};

export default NodeCreationControl;
