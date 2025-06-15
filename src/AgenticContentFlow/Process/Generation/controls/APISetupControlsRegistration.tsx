/** @format */
import { useEffect } from "react";
import {
  registerControl,
  unregisterControl,
} from "../../../Controls/registry/controlsRegistry";
import { CONTROL_TYPES } from "../../../constants";
import APISetupControl from "./APISetupControl";

/**
 * API Setup Controls Registration
 * 
 * This component handles the registration and unregistration of the API setup control
 * for the mindmap. It's a non-rendering component that only manages the
 * control registration lifecycle.
 */
const APISetupControlsRegistration = () => {
  useEffect(() => {
    // Register the API setup control in the tools section
    registerControl(
      "tools", // Use the tools section for utility controls
      CONTROL_TYPES.MINDMAP,
      "API_SETUP_CONTROL",
      APISetupControl,
      {}, // No props needed
      5 // Priority (lower numbers appear first) - make it appear early since it's important
    );

    // Cleanup when unmounted
    return () => {
      unregisterControl("tools", CONTROL_TYPES.MINDMAP, "API_SETUP_CONTROL");
    };
  }, []); // Empty dependency array ensures this runs only once

  // This component doesn't render anything
  return null;
};

export default APISetupControlsRegistration;