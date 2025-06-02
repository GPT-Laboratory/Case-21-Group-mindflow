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

/**
 * LogicalNode Component
 * 
 * A node for processing data with logical operations like filtering, transforming, 
 * aggregating, or conditional routing. It's a more general version of conditional nodes.
 */
export const LogicalNode: React.FC<NodeProps> = (props) => {
    const { id, data } = props;
    // Use the process system
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
        autoAcknowledge: true,
        acknowledgeDelay: 200,
        autoStartOnData: true,
        autoStartDelay: 2200  // Wait for edge animation to complete (2s) + small buffer
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
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Generate output schema based on operation
            const outputSchema = generateOutputSchema(operation, inputSchema);
            
            const result = {
                operation,
                condition,
                processed: true,
                timestamp: new Date().toISOString(),
                result: `Processed ${operation} with condition: ${condition}`,
                inputSchema,
                outputSchema
            };
            
            // Update this node's output schema
            dataSchemaManager.updateNodeSchema(id, {
                nodeId: id,
                outputSchema,
                lastUpdated: Date.now()
            });
            
            // Propagate schema to downstream nodes
            dataSchemaManager.propagateSchemaToDownstream(id);
            
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

    // Automatic processing logic - triggered when auto-start begins processing
    useEffect(() => {
        if (isProcessing && processState.startTime) {
            // Check if this was triggered by automatic processing (has received data)
            const hasReceivedData = processState.data !== undefined;
            
            if (hasReceivedData) {
                // Auto-execute the processing logic when triggered by incoming data
                const executeAutoProcessing = async () => {
                    try {
                        // Get input schema and data from the process state
                        const inputData = processState.data;
                        const inputSchema = dataSchemaManager.getInputSchema(id);
                        
                        // Simulate the actual processing logic
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        
                        // Generate output schema based on operation
                        const outputSchema = generateOutputSchema(operation, inputSchema);
                        
                        const result = {
                            operation,
                            condition,
                            processed: true,
                            timestamp: new Date().toISOString(),
                            result: `Auto-processed ${operation} with condition: ${condition}`,
                            inputData,
                            inputSchema,
                            outputSchema,
                            autoTriggered: true
                        };
                        
                        // Update this node's output schema
                        dataSchemaManager.updateNodeSchema(id, {
                            nodeId: id,
                            outputSchema,
                            lastUpdated: Date.now()
                        });
                        
                        // Propagate schema to downstream nodes
                        dataSchemaManager.propagateSchemaToDownstream(id);
                        
                        completeProcess(result);
                    } catch (error) {
                        setError(`Failed to auto-process logic: ${error}`);
                    }
                };
                
                executeAutoProcessing();
            }
        }
    }, [isProcessing, processState.startTime, processState.data, operation, condition, id, completeProcess, setError]);

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

// Helper function to generate output schema based on operation and input schema
const generateOutputSchema = (operation: string, inputSchema: any) => {
    if (!inputSchema) {
        return {
            type: "object",
            properties: {
                processed: { type: "boolean" },
                result: { type: "any" }
            }
        };
    }

    switch (operation.toLowerCase()) {
        case 'filter':
            // Filter maintains the same structure but potentially fewer items
            return inputSchema;
        
        case 'transform':
            // Transform might change the structure - for now, keep the same
            // In a real implementation, this would be based on transformation rules
            return inputSchema;
        
        case 'aggregate':
            // Aggregate typically produces a single object with summary data
            if (inputSchema.type === 'array') {
                return {
                    type: "object",
                    properties: {
                        count: { type: "number" },
                        summary: { type: "object" },
                        aggregated: { type: "boolean" }
                    }
                };
            }
            return inputSchema;
        
        case 'conditional':
            // Conditional routing might split data but maintain structure
            return inputSchema;
        
        case 'validate':
            // Validation adds validation metadata
            return {
                type: "object",
                properties: {
                    valid: { type: "boolean" },
                    errors: { type: "array", items: { type: "string" } },
                    data: inputSchema
                }
            };
        
        default:
            return inputSchema;
    }
};

// Helper function to get operation color
const getOperationColor = (operation: string): string => {
    switch (operation.toLowerCase()) {
        case 'filter':
            return 'text-blue-600 bg-blue-50 border-blue-200';
        case 'transform':
            return 'text-green-600 bg-green-50 border-green-200';
        case 'aggregate':
            return 'text-orange-600 bg-orange-50 border-orange-200';
        case 'conditional':
            return 'text-purple-600 bg-purple-50 border-purple-200';
        case 'validate':
            return 'text-red-600 bg-red-50 border-red-200';
        default:
            return 'text-gray-600 bg-gray-50 border-gray-200';
    }
};

export default LogicalNode;