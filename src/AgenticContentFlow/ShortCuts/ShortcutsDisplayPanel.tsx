import { ShortcutsDisplay, useShortcuts } from "@jalez/react-shortcuts-provider";
import { Panel } from "@xyflow/react";

/**
 * Display component that shows shortcuts when enabled
 */
export const ShortcutsDisplayPanel: React.FC = () => {
  const { showShortcuts } = useShortcuts();

  return showShortcuts ? <Panel
 
  ><ShortcutsDisplay    className="h-50 overflow-y-auto" /></Panel> : null;
};