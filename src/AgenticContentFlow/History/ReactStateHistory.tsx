/**
 * React Flow Integration Example
 *
 * This example demonstrates how to use the StateHistory library
 * with React Flow to add undo/redo capabilities to node operations.
 *
 * Key concepts demonstrated:
 * - Using StateHistory with a third-party library (React Flow)
 * - Creating custom commands for complex operations
 * - Managing external state with useTrackableState
 */
// import { ControlButton } from "@xyflow/react";
import {
  StateHistoryProvider,
  useHistoryStateContext,
} from "@jalez/react-state-history";

import "@xyflow/react/dist/style.css";
import { Redo2, Save, Undo2 } from "lucide-react";
import { useEffect } from "react";
import { registerShortcut, DEFAULT_SHORTCUT_CATEGORIES } from "../ShortCuts/registry/shortcutsRegistry";
import { CONTROL_TYPES } from "../constants";
import { registerControl, unregisterControl } from "../Controls";
import ControlButton from "../Controls/Components/ControlButton";

// Internal flow component that handles the actual React Flow functionality
function ReactStateHistoryControls() {
  // Get the latest persisted states if available, otherwise use initialNodes/initialEdges

  const {
    canUndo,
    canRedo,
    undo,
    redo,
    
    isPersistent,
    togglePersistence,
  } = useHistoryStateContext();

  return (
    <>
      <ControlButton
        onClick={() => {
          if (canUndo) {
            undo();
          }
        }}
        disabled={!canUndo}
        icon={<Undo2 className="size-4" />}
        tooltip="Undo"
      />
      <ControlButton
        onClick={togglePersistence}
        tooltip="Toggle Persistence"
        disabled={false}
        icon={<Save className="size-4" />}
        active={isPersistent}
      />
      <ControlButton
        onClick={() => {
          if (canRedo) {
            redo();
          }
        }}
        disabled={!canRedo}
        icon={<Redo2 className="size-4" />}
        tooltip="Redo"
      />
    </>
  );
}

// Register undo/redo shortcuts inside the provider
function HistoryShortcutsRegistration() {
  const { canUndo, canRedo, undo, redo } = useHistoryStateContext();
  useEffect(() => {
    // Register the history controls in the controls panel
    registerControl(
      "history",
      CONTROL_TYPES.MINDMAP,
      "REACT_STATE_HISTORY_CONTROLS",
      ReactStateHistoryControls,
      {},
      10
    );

    // Register Undo (Ctrl+Z / Cmd+Z)
    registerShortcut(
      DEFAULT_SHORTCUT_CATEGORIES.EDITING,
      "undo",
      "ctrl+z",
      () => { if (canUndo) undo(); },
      "Undo last action"
    );
    registerShortcut(
      DEFAULT_SHORTCUT_CATEGORIES.EDITING,
      "undo-mac",
      "meta+z",
      () => { if (canUndo) undo(); },
      "Undo last action (Mac)"
    );
    // Register Redo (Ctrl+Y / Cmd+Shift+Z)
    registerShortcut(
      DEFAULT_SHORTCUT_CATEGORIES.EDITING,
      "redo",
      "ctrl+y",
      () => { if (canRedo) redo(); },
      "Redo last action"
    );
    registerShortcut(
      DEFAULT_SHORTCUT_CATEGORIES.EDITING,
      "redo-mac",
      "meta+shift+z",
      () => { if (canRedo) redo(); },
      "Redo last action (Mac)"
    );

    // Cleanup when unmounted
    return () => {
      unregisterControl(
        "history",
        CONTROL_TYPES.MINDMAP,
        "REACT_STATE_HISTORY_CONTROLS"
      );
      // No need to unregister shortcuts, registry handles duplicates
    };
  }, [canUndo, canRedo, undo, redo]);
  return null;
}

// Wrapper component that provides StateHistory context
export default function ReactStateHistory({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <StateHistoryProvider
      storageKey="react-flow-example"
      defaultPersistent={true}
    >
      <HistoryShortcutsRegistration />
      {children}
    </StateHistoryProvider>
  );
}
