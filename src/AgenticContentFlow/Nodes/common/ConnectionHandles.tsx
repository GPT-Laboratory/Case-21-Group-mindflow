import { ReactNode } from "react";
import { TypedHandle } from "../../Handle/components/TypedHandle";
import { nodeFactory } from "../../Node/factory/NodeFactory";

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
    // Get handle definitions from the node factory configuration
    const nodeConfig = nodeFactory.getNodeConfig(nodeType);
    
    // If no node configuration found, render nothing
    if (!nodeConfig || !nodeConfig.handles?.definitions) {
        console.warn(`No handle definitions found for node type: ${nodeType}`);
        return null;
    }

    const handleDefinitions = nodeConfig.handles.definitions;

    return (
        <>
            {handleDefinitions.map((handleDef, index) => (
                <TypedHandle
                    key={`${handleDef.position}-${index}`}
                    nodeType={nodeType}
                    handleDefinition={handleDef}
                    nodeBackgroundColor={color} // Pass the node's background color
                />
            ))}
        </>
    );
}

export default ConnectionHandles;