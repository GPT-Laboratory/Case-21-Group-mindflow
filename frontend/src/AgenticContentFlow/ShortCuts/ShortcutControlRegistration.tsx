import { useEffect } from "react";
import { CONTROL_TYPES } from "../constants";
import { registerControl } from "../Controls";
import ShortcutsToggleButton from "./ShortcutsToggleButton";
import { DEFAULT_SHORTCUT_CATEGORIES, registerShortcut, useKeyboardShortcutHandler, useShortcuts } from "@jalez/react-shortcuts-provider";

/**
 * Internal component that registers the shortcuts toggle button and manages shortcuts
 * This component has access to the ShortcutsProvider context
 */
export const ShortcutsRegistration: React.FC = () => {
    const { toggleShortcuts } = useShortcuts();
  
    useEffect(() => {
      // Register the shortcuts toggle control in the controls registry
      registerControl(
        CONTROL_TYPES.NAVIGATION,
        CONTROL_TYPES.MINDMAP,
        "SHORTCUTS_TOGGLE",
        ShortcutsToggleButton,
        {},
        1 // High priority to appear early
      );
  
      // Register the shortcut for toggling shortcuts display
      registerShortcut(
        DEFAULT_SHORTCUT_CATEGORIES.VIEW_SETTINGS,
        "toggle-shortcuts",
        "k",
        toggleShortcuts,
        "Toggle shortcuts display",
        true,
        1
      );
  
      // No cleanup needed - components handle their own lifecycle
    }, [toggleShortcuts]);
  
    // Enable keyboard shortcut handling at this level
    useKeyboardShortcutHandler();
  
    return null; // This component doesn't render anything
  };
  