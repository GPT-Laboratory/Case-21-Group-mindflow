import React, { useCallback, useEffect } from "react";
import { Wand2 } from "lucide-react"; 
import { useLayoutContext } from "@jalez/react-flow-automated-layout";
import ControlButton from "../../../Controls/Components/ControlButton";
import { registerShortcut, DEFAULT_SHORTCUT_CATEGORIES } from "../../../ShortCuts/registry/shortcutsRegistry";

const ApplyLayout: React.FC = () => {
  const { layoutInProgress, applyLayout } = useLayoutContext();


  const handleApplyLayout = useCallback(() => {
    applyLayout();
  }, [applyLayout]);

  useEffect(() => {
    registerShortcut(
      DEFAULT_SHORTCUT_CATEGORIES.TOOLS,
      "apply-layout",
      "l",
      handleApplyLayout,
      "Apply Layout"
    );
  }, [handleApplyLayout]);

  return (
    <ControlButton
      tooltip="Apply Layout"
      onClick={handleApplyLayout}
      icon={<Wand2 className="size-5" />} // Add size class for consistency
      disabled={layoutInProgress}
    />
  );
};

export default ApplyLayout;