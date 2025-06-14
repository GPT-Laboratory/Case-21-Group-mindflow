/** @format */

import { useConnectionOperations } from "@/AgenticContentFlow/Node/hooks/useConnectionOperations";
import { useSelect } from "@/AgenticContentFlow/Select/contexts/SelectContext";
import { NodeData } from "@/AgenticContentFlow/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

import { Node } from "@xyflow/react";

interface CellNodeMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  node: Node<NodeData>;
}

/**
 * Context menu for cell nodes with operations like add source/target and delete
 * This preserves the important menu functionality from the legacy CellNode folder
 */
export const CellNodeMenu = ({
  anchorEl,
  onClose,
  node,
}: CellNodeMenuProps) => {
  const { addSourceNode, addTargetNode } = useConnectionOperations();
  const { deleteSelected } = useSelect();

  const handleAddSource = () => {
    addSourceNode(node);
    onClose();
  };

  const handleAddTarget = () => {
    addTargetNode(node);
    onClose();
  };

  const handleDelete = () => {
    deleteSelected();
    onClose();
  };

  return (
    <DropdownMenu open={Boolean(anchorEl)} onOpenChange={() => onClose()}>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={handleAddSource}>
          Add source
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleAddTarget}>
          Add target
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
          Delete Node
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};