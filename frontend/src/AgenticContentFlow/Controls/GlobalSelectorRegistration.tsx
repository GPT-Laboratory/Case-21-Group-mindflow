import { useEffect } from "react";
import {
    registerControl,
    unregisterControl,
} from "./registry/controlsRegistry";
import { CONTROL_TYPES } from "../constants";
import GlobalSelector from "./Components/GlobalSelector";

const GlobalSelectorRegistration = () => {
    useEffect(() => {
        // Register in the TOOLS section or a custom section
        registerControl(
            "custom",
            CONTROL_TYPES.MINDMAP,
            "GLOBAL_SELECTOR",
            GlobalSelector,
            {},
            10 // Priority - make it appear first
        );

        return () => {
            unregisterControl("custom", CONTROL_TYPES.MINDMAP, "GLOBAL_SELECTOR");
        };
    }, []);

    return null;
};

export default GlobalSelectorRegistration;
