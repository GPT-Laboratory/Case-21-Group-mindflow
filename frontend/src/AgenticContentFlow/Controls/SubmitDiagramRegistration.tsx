/** @format */
import { useEffect } from "react";
import {
    registerControl,
    unregisterControl,
} from "./registry/controlsRegistry";
import { CONTROL_TYPES } from "../constants";
import SubmitDiagramControl from "./SubmitDiagramControl";

/**
 * Component that registers the submit diagram control in the controls registry
 */
const SubmitDiagramRegistration = () => {
    useEffect(() => {
        // Register the submit diagram control in the flow section
        registerControl(
            "flow",
            CONTROL_TYPES.MINDMAP,
            "SUBMIT_DIAGRAM_CONTROL",
            SubmitDiagramControl,
            {},
            20 // Priority - after the selector
        );

        // Cleanup when unmounted
        return () => {
            unregisterControl("flow", CONTROL_TYPES.MINDMAP, "SUBMIT_DIAGRAM_CONTROL");
        };
    }, []);

    return null;
};

export default SubmitDiagramRegistration;
