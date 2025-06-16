import { useEffect } from "react";
import {
  registerControl,
  unregisterControl,
} from "../../Controls/registry/controlsRegistry";
import { CONTROL_TYPES } from "../../constants";
import FlowGenerationControl from "./FlowGenerationControl";

/**
 * Component that registers the flow generation control in the controls registry
 * This is a non-rendering component that manages the control registration lifecycle
 */
const FlowGenerationControlsRegistration = ({ onFlowGenerated }: { onFlowGenerated: (nodes: any[], edges: any[]) => void }) => {
  useEffect(() => {
    // Register the flow generation control in the tools section
    registerControl(
      "tools", // Use tools section for AI-powered utilities
      CONTROL_TYPES.MINDMAP,
      "FLOW_GENERATION_CONTROL",
      () => <FlowGenerationControl onFlowGenerated={onFlowGenerated} />, 
      {}, // No props needed since we're using a wrapper function
      1 // Priority - make it appear first since it's a primary feature
    );

    // Cleanup when unmounted
    return () => {
      unregisterControl("tools", CONTROL_TYPES.MINDMAP, "FLOW_GENERATION_CONTROL");
    };
  }, [onFlowGenerated]); // Re-register when the callback changes

  // This component doesn't render anything
  return null;
};

export default FlowGenerationControlsRegistration;