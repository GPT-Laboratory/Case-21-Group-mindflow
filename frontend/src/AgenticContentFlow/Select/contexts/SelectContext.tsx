import {
  createContext,
  useContext,
  useCallback,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { Edge, Node, useOnSelectionChange, useReactFlow } from "@xyflow/react";
import { useInputFocus } from "../../Panel/contexts/InputFocusContext";
import { DeleteConfirmationDialog } from "../../../components/DeleteConfirmationDialog";
import { useDeletionService } from "../../Panel/hooks/useDeletionService";

//Create a context for the selected nodes and edges

interface SelectContextType {
  selectedNodes: Node[];
  selectedEdges: Edge[];
  hasSelection: boolean;
  handleCenterOnSelected: () => void;
  deleteSelected: () => void;
  clearSelection: () => void;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

export const SelectProvider = ({ children }: { children: ReactNode }) => {
  const reactFlowInstance = useReactFlow();
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { isInputFocused } = useInputFocus();
  const { performDeletion } = useDeletionService();

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent deletion when input is focused
      if (isInputFocused) {
        return;
      }

      // macOS behavior: only Cmd+Backspace should trigger delete confirmation.
      const isMacDeleteShortcut = event.metaKey && event.key === "Backspace";
      if (isMacDeleteShortcut) {
        // Show confirmation dialog instead of directly deleting
        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          event.preventDefault();
          setShowDeleteDialog(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodes, selectedEdges, isInputFocused]);

  const onChange = useCallback(
    ({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) => {
      setSelectedNodes(nodes);
      setSelectedEdges(edges);
    },
    []
  );

  useOnSelectionChange({
    onChange,
  });

  const handleConfirmedDeletion = useCallback(() => {
    // Additional check to prevent deletion when input is focused
    if (isInputFocused) {
      return;
    }
    
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return;

    // Use the deletion service that preserves transaction handling
    performDeletion(selectedNodes, selectedEdges);
    clearSelection();
  }, [selectedNodes, selectedEdges, isInputFocused, performDeletion]);

  const deleteSelected = useCallback(() => {
    // Show confirmation dialog instead of directly deleting
    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      setShowDeleteDialog(true);
    }
  }, [selectedNodes, selectedEdges]);

  const handleCenterOnSelected = useCallback(() => {
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return;

    reactFlowInstance.fitView({
      nodes: selectedNodes,
      duration: 1000,
      padding: 0.1,
    });
  }, [selectedNodes, selectedEdges, reactFlowInstance]);

  const clearSelection = useCallback(() => {
    for (const node of selectedNodes) {
     reactFlowInstance.updateNode(node.id, {
        selected: false,
      });
    }
    for (const edge of selectedEdges) {
      reactFlowInstance.updateEdge(edge.id, {
        selected: false,
      });
    }
    setSelectedNodes([]);
    setSelectedEdges([]);
  }, [ setSelectedNodes, setSelectedEdges]);

  const hasSelection = selectedNodes.length > 0 || selectedEdges.length > 0;

  // Calculate total items and predominant type for dialog
  const totalItems = selectedNodes.length + selectedEdges.length;
  const getItemType = () => {
    if (selectedNodes.length > 0 && selectedEdges.length > 0) {
      return "item";
    } else if (selectedNodes.length > 0) {
      return "node";
    } else if (selectedEdges.length > 0) {
      return "connection";
    }
    return "item";
  };

  const value = {
    selectedNodes,
    selectedEdges,
    hasSelection,
    deleteSelected,
    handleCenterOnSelected,
    clearSelection,
  };

  return (
    <SelectContext.Provider value={value}>
      {children}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleConfirmedDeletion}
        itemType={getItemType()}
        itemCount={totalItems}
      />
    </SelectContext.Provider>
  );
};

export const useSelect = () => {
  const context = useContext(SelectContext);
  if (context === undefined) {
    throw new Error("useSelect must be used within a SelectProvider");
  }
  return context;
};

export default SelectContext;
