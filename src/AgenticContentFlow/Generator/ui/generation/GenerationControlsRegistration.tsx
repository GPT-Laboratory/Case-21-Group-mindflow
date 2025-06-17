import { useEffect } from "react";
import {
  registerControl,
  unregisterControl,
} from "../../../Controls/registry/controlsRegistry";
import { CONTROL_TYPES } from "../../../constants";
import { GenerationResult, GenerationType } from "../../generatortypes";
import GenerationControl from "./GenerationControl";

export interface GenerationControlsRegistrationProps {
  type?: GenerationType;
  onGenerated: (result: GenerationResult) => void;
}

/**
 * Component that registers the unified generation control in the controls registry
 * This replaces the separate FlowGenerationControlsRegistration with a unified approach
 * that can handle all generation types (process, flow, hybrid).
 */
const GenerationControlsRegistration: React.FC<GenerationControlsRegistrationProps> = ({ 
  type = 'flow', 
  onGenerated 
}) => {
  useEffect(() => {
    // Register the generation control in the tools section
    registerControl(
      "tools", // Use tools section for AI-powered utilities
      CONTROL_TYPES.MINDMAP,
      `GENERATION_CONTROL_${type.toUpperCase()}`,
      () => <GenerationControl type={type} onGenerated={onGenerated} />, 
      {}, // No props needed since we're using a wrapper function
      1 // Priority - make it appear first since it's a primary feature
    );

    // Cleanup when unmounted
    return () => {
      unregisterControl("tools", CONTROL_TYPES.MINDMAP, `GENERATION_CONTROL_${type.toUpperCase()}`);
    };
  }, [type, onGenerated]); // Re-register when type or callback changes

  // This component doesn't render anything
  return null;
};

export default GenerationControlsRegistration;