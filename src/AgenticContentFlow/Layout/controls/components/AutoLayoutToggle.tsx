import React, { useCallback, useEffect } from "react";
import { RefreshCcw } from "lucide-react";
import { useLayoutContext } from "@jalez/react-flow-automated-layout";
import ControlButton from "../../../Controls/Components/ControlButton";
import { registerShortcut, DEFAULT_SHORTCUT_CATEGORIES } from "@jalez/react-shortcuts-provider";

const AutoLayoutToggle: React.FC = () => {
  const { autoLayout, setAutoLayout } = useLayoutContext();
  

  const handleAutoLayoutToggle = useCallback(() => {
    setAutoLayout(!autoLayout);
  }, [autoLayout, setAutoLayout]);

  useEffect(() => {
    registerShortcut(
      DEFAULT_SHORTCUT_CATEGORIES.TOOLS,
      "toggle-auto-layout",
      "a",
      handleAutoLayoutToggle,
      "Toggle Auto Layout"
    );
  }, [handleAutoLayoutToggle]);

  return (
    <ControlButton
      tooltip={autoLayout ? "Disable Auto Layout" : "Enable Auto Layout"}
      onClick={handleAutoLayoutToggle}
      icon={<RefreshCcw className="size-4" />}
      active={autoLayout}
    />
  );
};

export default AutoLayoutToggle;
