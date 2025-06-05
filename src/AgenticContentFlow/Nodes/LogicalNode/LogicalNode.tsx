import React, { useEffect, useState, useRef } from 'react';
import { NodeProps } from '@xyflow/react';
import { Settings } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useNodeProcess } from '../../Process/useNodeProcess';

// DataSchemaManager integration
import { dataSchemaManager } from '../../Process/DataSchemaManager';

// Local utilities
import { getConditionParts } from './utils/conditionUtils';

// Shared CellNode component
import { CellNode, CellNodeConfig } from '../common/CellNode';
import { generateOutputSchema } from './utils/generateOutputSchema';
import { createProcessedData } from './utils/createProcessedData';
import { getOperationColor } from './utils/getOperationColor';

/**
 * LogicalNode Component
 * 
 * A node for processing data with logical operations like filtering, transforming, 
 * aggregating, or conditional routing. It's a more general version of conditional nodes.
 */
export const LogicalNode: React.FC<NodeProps> = (props) => {
    const { id, data } = props;
    // Use the process system with FlowData approach
    const { 
        processState, 
        isProcessing, 
        isCompleted, 
        hasError,
        startProcess, 
        completeProcess, 
        setError 
    } = useNodeProcess({ 
        nodeId: id,
        autoStartOnData: true,
    });

    // Loop state management
    const [isLooping, setIsLooping] = useState(false);
    const [loopInterval, setLoopInterval] = useState(5);
    const loopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Type-safe data extraction
    const nodeLabel = typeof data?.label === 'string' ? data.label : 'Logic';
    const operation = typeof data?.operation === 'string' ? data.operation : 'filter';
    const condition = typeof data?.condition === 'string' ? data.condition : '';

    // Enhanced processing with schema propagation
    const handleTestLogic = async () => {
        try {
            startProcess({ operation, condition });
            
            // Get input schema from upstream nodes
            const inputSchema = dataSchemaManager.getInputSchema(id);
            
            // Simulate some processing time
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Generate output schema based on operation
            const outputSchema = generateOutputSchema(operation, inputSchema, data);
            
            // Create actual processed data based on the operation and output schema
            const result = createProcessedData(operation, condition, outputSchema, null, data);
            
            // Update this node's output schema
            dataSchemaManager.updateSchema(id, undefined, outputSchema);
            
            completeProcess(result);
        } catch (error) {
            setError(`Failed to process logic: ${error}`);
        }
    };

    // Handle stop functionality
    const handleStop = () => {
        // Clear any ongoing processes
        if (loopTimeoutRef.current) {
            clearTimeout(loopTimeoutRef.current);
            loopTimeoutRef.current = null;
        }
        setIsLooping(false);
    };

    // Handle loop toggle
    const handleLoopToggle = () => {
        setIsLooping(!isLooping);
    };

    // Handle loop interval change
    const handleLoopIntervalChange = (interval: number) => {
        setLoopInterval(interval);
    };

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (loopTimeoutRef.current) {
                clearTimeout(loopTimeoutRef.current);
            }
        };
    }, []);

    // Simplified automatic processing - only when data is actually received
    useEffect(() => {
        // Only process if we have a processing state with data and we're currently processing
        if (isProcessing && processState.data && processState.startTime) {
            const executeAutoProcessing = async () => {
                try {
                    // Get input schema and data from the process state
                    const inputData = processState.data;
                    const inputSchema = dataSchemaManager.getInputSchema(id);
                    console.log("into inputSchema", inputSchema);
                    
                    // Generate output schema based on operation
                    const outputSchema = generateOutputSchema(operation, inputSchema, data);
                    
                    // Create actual processed data based on the operation and output schema
                    const result = createProcessedData(operation, condition, outputSchema, inputData, data);
                    
                    // Update this node's output schema
                    dataSchemaManager.updateSchema(id, undefined, outputSchema);
                    
                    completeProcess(result);
                } catch (error) {
                    setError(`Failed to auto-process logic: ${error}`);
                }
            };
            
            // Only execute if we haven't already started processing this data
            executeAutoProcessing();
        }
    }, [isProcessing, processState.startTime]); // Removed processState.data dependency to prevent loops

    // Custom menu items for logical operations
    const logicalNodeMenuItems = [
        <DropdownMenuItem key="test" onClick={handleTestLogic}>
            Test Logic
        </DropdownMenuItem>,
        <DropdownMenuItem key="configure" onClick={() => console.log('Configure Logic')}>
            Configure Logic
        </DropdownMenuItem>,
        <DropdownMenuItem key="debug" onClick={() => console.log('Debug Logic')}>
            Debug Logic
        </DropdownMenuItem>
    ];

    const operationColor = getOperationColor(operation);

    // Configuration for the CellNode
    const cellNodeConfig: CellNodeConfig = {
        nodeType: "logicalnode",
        icon: <Settings />,
        headerIcon: <Settings className="w-4 h-4 stroke-purple-700" />,
        headerGradient: "bg-gradient-to-r from-purple-50 to-purple-100",
        selectedColor: "purple",
        badge: {
            text: operation.toUpperCase(),
            colorClasses: operationColor
        },
        additionalContent: (() => {
            const { simplified } = getConditionParts(condition);
            return simplified || 'No logic configured';
        })(),
        menuItems: logicalNodeMenuItems
    };

    return (
        <CellNode
            {...props}
            config={cellNodeConfig}
            label={nodeLabel}
            isProcessing={isProcessing}
            isCompleted={isCompleted}
            hasError={hasError}
            onPlay={handleTestLogic}
            onStop={handleStop}
            isLooping={isLooping}
            loopInterval={loopInterval}
            onLoopToggle={handleLoopToggle}
            onLoopIntervalChange={handleLoopIntervalChange}
        />
    );
};







export default LogicalNode;