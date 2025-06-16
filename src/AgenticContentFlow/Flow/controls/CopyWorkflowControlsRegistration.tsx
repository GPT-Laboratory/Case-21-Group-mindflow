import { useEffect } from "react";
import {
  registerControl,
  unregisterControl,
} from "../../Controls/registry/controlsRegistry";
import { CONTROL_TYPES } from "../../constants";
import CopyWorkflowControl from "./CopyWorkflowControl";

/**
 * Component that registers the copy workflow control in the controls registry
 * This is a non-rendering component that manages the control registration lifecycle
 */
const CopyWorkflowControlsRegistration = () => {
  useEffect(() => {
    // Register the copy workflow control in the tools section
    registerControl(
      "tools", // Use tools section for workflow utilities
      CONTROL_TYPES.MINDMAP,
      "COPY_WORKFLOW_CONTROL",
      CopyWorkflowControl, 
      {}, // No props needed
      15 // Priority - between API setup (5) and layout controls (20)
    );

    // Cleanup when unmounted
    return () => {
      unregisterControl("tools", CONTROL_TYPES.MINDMAP, "COPY_WORKFLOW_CONTROL");
    };
  }, []); // Empty dependency array ensures this runs only once

  // This component doesn't render anything
  return null;
};

export default CopyWorkflowControlsRegistration;