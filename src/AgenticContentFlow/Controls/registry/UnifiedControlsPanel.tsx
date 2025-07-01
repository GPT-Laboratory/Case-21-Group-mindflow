/** @format */
import { Fragment, useMemo, memo } from "react";
import { cn } from "@/lib/utils";

import RegisteredControls from "./RegisteredControls";
import { CONTROL_TYPES } from "../../constants";
import { useControlsRegistry } from "./controlsRegistry";

interface UnifiedControlsPanelProps {
  context?: string;
  position?: "top" | "bottom" | "left" | "right";
}

/**
 * UnifiedControlsPanel Component
 *
 * @version 3.0.0
 *
 * A controls panel component that displays registered controls of different types.
 * Uses the controls registry system to dynamically render controls.
 * Now positioned in the main layout for full width coverage.
 */
const UnifiedControlsPanel: React.FC<UnifiedControlsPanelProps> = memo(({
  position = "top",
  context = CONTROL_TYPES.MINDMAP,
}) => {
  const { getControlTypes } = useControlsRegistry();

  // Get all registered control types for this context
  const controlTypes = useMemo(() => getControlTypes(context), [getControlTypes, context]);

  // Generate position classes
  const positionClasses = useMemo(() => {
    switch (position) {
      case "top":
        return "top-0 left-0 right-0";
      case "bottom":
        return "bottom-0 left-0 right-0";
      case "left":
        return "left-0 top-0 bottom-0";
      case "right":
        return "right-0 top-0 bottom-0";
      default:
        return "top-0 left-0 right-0";
    }
  }, [position]);

  // Memoize the entire controls panel structure
  const controlsPanel = useMemo(() => (
    <div className={cn("w-full", positionClasses)}>
      <div className={cn(
        "flex p-1 bg-background/95 backdrop-blur-sm",
        "justify-center items-center"
      )}>
        {controlTypes.map((type, index) => (
          <Fragment key={`control-type-${type}`}>
            {index > 0 && (
              <div className={cn(
                "bg-border",
                position === "left" || position === "right" 
                  ? "h-px w-full my-1" 
                  : "w-px h-full mx-1"
              )} />
            )}
            <div className="flex items-center">
              <RegisteredControls
                type={type}
                context={context}
              />
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  ), [position, controlTypes, context, positionClasses]);

  return controlsPanel;
});

UnifiedControlsPanel.displayName = 'UnifiedControlsPanel';

export default UnifiedControlsPanel;
