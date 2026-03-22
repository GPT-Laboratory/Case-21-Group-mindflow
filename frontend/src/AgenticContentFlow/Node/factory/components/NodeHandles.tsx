import { ReactNode } from "react";
import { TypedHandle } from "../../../Handle/components/TypedHandle";
import { ExcalidrawTypedHandle } from "../../../Handle/components/ExcalidrawTypedHandle";
import { handleRegistry } from "../../../Handle/registry/handleTypeRegistry";
import { useLayoutContext } from "@jalez/react-flow-automated-layout";
import { HandleTypeDefinition, HandlePosition } from "../../../types/handleTypes";

interface ConnectionHandlesProps {
    nodeType: string;
    color?: string;
    icons?: {
        left?: ReactNode;
        right?: ReactNode;
        top?: ReactNode;
        bottom?: ReactNode;
    };
}

/**
 * Map a handle position to match the current layout direction.
 *
 * Handle definitions are authored for the default DOWN (top-to-bottom) layout:
 *   - target handles at "top" (incoming from parent above)
 *   - source handles at "bottom" (outgoing to children below)
 *
 * When the layout direction changes we rotate the positions so that
 * target handles always face the parent direction and source handles
 * always face the child direction.
 */
function remapHandlePosition(
    position: HandlePosition,
    type: 'source' | 'target' | 'both',
    direction: string | undefined
): HandlePosition {
    // Default / DOWN layout — no remapping needed
    if (!direction || direction === 'DOWN') return position;

    // Build a mapping: for each direction tell where target/source handles should go
    // relative to the default (target=top, source=bottom)
    const mapping: Record<string, Record<HandlePosition, HandlePosition>> = {
        UP: { top: 'bottom', bottom: 'top', left: 'right', right: 'left' },
        RIGHT: { top: 'left', bottom: 'right', left: 'top', right: 'bottom' },
        LEFT: { top: 'right', bottom: 'left', left: 'bottom', right: 'top' },
    };

    const map = mapping[direction];
    if (!map) return position;
    return map[position] ?? position;
}

const ConnectionHandles = ({ nodeType, color }: ConnectionHandlesProps) => {
    const noHandleNodeTypes = ['flownode'];

    if (noHandleNodeTypes.includes(nodeType)) {
        return null;
    }

    const handleDefinitions = handleRegistry.getNodeHandles(nodeType);

    if (!handleDefinitions || handleDefinitions.length === 0) {
        return null;
    }

    // Get current layout direction
    let direction: string | undefined;
    try {
        const layoutCtx = useLayoutContext();
        direction = layoutCtx?.direction;
    } catch {
        // LayoutProvider may not be available — fall back to default
    }

    const isFunctionNode = nodeType.includes('function') || nodeType.includes('cell') || nodeType.includes('process');

    return (
        <>
            {handleDefinitions.map((handleDef, index) => {
                // Remap the visual position but keep the original position as the handle ID
                // so edges referencing the original handle ID still work
                const remappedPosition = remapHandlePosition(handleDef.position, handleDef.type, direction);
                const remappedDef: HandleTypeDefinition = {
                    ...handleDef,
                    position: remappedPosition,
                };

                if (isFunctionNode) {
                    return (
                        <ExcalidrawTypedHandle
                            key={`${handleDef.position}-${index}`}
                            nodeType={nodeType}
                            handleDefinition={remappedDef}
                            originalHandleId={handleDef.position}
                            nodeBackgroundColor={color}
                        />
                    );
                } else {
                    return (
                        <TypedHandle
                            key={`${handleDef.position}-${index}`}
                            nodeType={nodeType}
                            handleDefinition={remappedDef}
                            originalHandleId={handleDef.position}
                            nodeBackgroundColor={color}
                        />
                    );
                }
            })}
        </>
    );
}

export default ConnectionHandles;
