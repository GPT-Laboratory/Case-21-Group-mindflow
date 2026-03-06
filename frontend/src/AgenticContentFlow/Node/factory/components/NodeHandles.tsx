import { ReactNode } from "react";
import { TypedHandle } from "../../../Handle/components/TypedHandle";
import { ExcalidrawTypedHandle } from "../../../Handle/components/ExcalidrawTypedHandle";
import { handleRegistry } from "../../../Handle/registry/handleTypeRegistry";

interface ConnectionHandlesProps {
    nodeType: string;
    color?: string; // Keep for backward compatibility - now used to set handle background
    icons?: {
        left?: ReactNode;
        right?: ReactNode;
        top?: ReactNode;
        bottom?: ReactNode;
    }; // Keep for backward compatibility
}

const ConnectionHandles = ({ nodeType, color }: ConnectionHandlesProps) => {
    // List of node types that are intentionally designed without handles
    const noHandleNodeTypes = ['flownode'];
    
    // If this is a node type that shouldn't have handles, render nothing silently
    if (noHandleNodeTypes.includes(nodeType)) {
        return null;
    }
    
    // Get handle definitions from the unified handle registry
    // This now checks cell factory, container factory, and legacy configurations
    const handleDefinitions = handleRegistry.getNodeHandles(nodeType);
    
    // If no handle definitions found, render nothing
    if (!handleDefinitions || handleDefinitions.length === 0) {
        console.warn(`No handle definitions found for node type: ${nodeType}`);
        return null;
    }

    // Determine if this is a function node (cell-like node)
    const isFunctionNode = nodeType.includes('function') || nodeType.includes('cell') || nodeType.includes('process');
    
    // Debug logging
    console.log('NodeHandles render:', {
        nodeType,
        isFunctionNode,
        handleDefinitions: handleDefinitions.length,
        color
    });

    return (
        <>
            {handleDefinitions.map((handleDef, index) => {
                // Use ExcalidrawTypedHandle for function nodes, regular TypedHandle for others
                if (isFunctionNode) {
                    console.log('Rendering ExcalidrawTypedHandle for:', handleDef);
                    return (
                        <ExcalidrawTypedHandle
                            key={`${handleDef.position}-${index}`}
                            nodeType={nodeType}
                            handleDefinition={handleDef}
                            nodeBackgroundColor={color}
                        />
                    );
                } else {
                    return (
                        <TypedHandle
                            key={`${handleDef.position}-${index}`}
                            nodeType={nodeType}
                            handleDefinition={handleDef}
                            nodeBackgroundColor={color}
                        />
                    );
                }
            })}
        </>
    );
}

export default ConnectionHandles;