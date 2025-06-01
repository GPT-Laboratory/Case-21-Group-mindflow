import React, { useEffect, useState, useRef } from 'react';
import { NodeProps, useReactFlow, useUpdateNodeInternals } from '@xyflow/react';
import { Eye } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ConnectionHandles from '../common/ConnectionHandles';
import { NodeHeader } from '../common/NodeHeader';
import CornerResizer from '../common/CornerResizer';
import { BaseNodeContainer } from '../common/NodeStyles';
import NodePlayControls from '../common/NodePlayControls';
import { useNodeProcess } from '../../Process/useNodeProcess';

/**
 * Content Node Component
 * 
 * A fixed-size square node for displaying and rendering data in various formats 
 * like lists, tables, cards. Features reactive data schema and bidirectional 
 * schema communication with upstream nodes.
 */
export const ContentNode: React.FC<NodeProps> = ({ id, data, selected }) => {
    const { getNode } = useReactFlow();
    const updateNodeInternals = useUpdateNodeInternals();
    const nodeInFlow = getNode(id);

    // Use the process system for data handling
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
        autoStartDelay: 2200  // Wait for edge animation to complete
    });

    // Loop state management
    const [isLooping, setIsLooping] = useState(false);
    const [loopInterval, setLoopInterval] = useState(5);
    const loopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const color = "white";

    // Type-safe data extraction
    const nodeLabel = typeof data?.label === 'string' ? data.label : 'Content Display';
    const displayType = typeof data?.displayType === 'string' ? data.displayType : 'list';
    const maxItems = typeof data?.maxItems === 'number' ? data.maxItems : 10;

    if (!nodeInFlow) {
        console.error(`Node with id ${id} not found in store.`);
        return null;
    }

    // Fixed square dimensions like LogicalNode
    const nodeDimensions = {
        width: 200,
        height: 200,
    };

    // Generate test data based on expected schema
    const generateTestData = () => {
        const expectedSchema = data?.expectedSchema as any;
        if (!expectedSchema) {
            return [
                { id: 1, title: 'Sample Content 1', body: 'Sample body text', userId: 1 },
                { id: 2, title: 'Sample Content 2', body: 'More sample text', userId: 2 }
            ];
        }

        if (expectedSchema.type === 'array') {
            return Array(3).fill(null).map((_, index) => ({
                id: index + 1,
                title: `Sample Post ${index + 1}`,
                body: `This is the body content for post ${index + 1}.`,
                userId: Math.floor(Math.random() * 5) + 1
            }));
        }
        return [];
    };

    // Handle processing/rendering content
    const handleProcessContent = async () => {
        try {
            startProcess({ action: 'rendering', displayType, maxItems });
            
            // Simulate content rendering time
            await new Promise(resolve => setTimeout(resolve, 1200));
            
            const testData = generateTestData();
            
            const result = {
                displayType,
                itemsRendered: testData.length,
                maxItems,
                processed: true,
                timestamp: new Date().toISOString()
            };
            
            completeProcess(result);
        } catch (error) {
            setError(`Failed to render content: ${error}`);
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
                        // Get input data from the process state
                        const inputData = processState.data;
                        
                        // Simulate content rendering time
                        await new Promise(resolve => setTimeout(resolve, 1200));
                        
                        const result = {
                            displayType,
                            itemsRendered: Array.isArray(inputData) ? inputData.length : 1,
                            maxItems,
                            processed: true,
                            timestamp: new Date().toISOString(),
                            inputData,
                            autoTriggered: true
                        };
                        
                        completeProcess(result);
                    } catch (error) {
                        setError(`Failed to auto-render content: ${error}`);
                    }
                };
                
                executeAutoProcessing();
            }
        }
    }, [isProcessing, processState.startTime, processState.data, displayType, maxItems, completeProcess, setError]);

    // Custom menu items for content operations
    const contentNodeMenuItems = [
        <DropdownMenuItem key="render" onClick={handleProcessContent}>
            Render Content
        </DropdownMenuItem>,
        <DropdownMenuItem key="refresh" onClick={() => console.log('Refresh display')}>
            Refresh Display
        </DropdownMenuItem>,
        <DropdownMenuItem key="export" onClick={() => console.log('Export data')}>
            Export Data
        </DropdownMenuItem>
    ];

    const displayTypeColor = getDisplayTypeColor(displayType);

    return (
        <>
            <CornerResizer
                minHeight={nodeDimensions.height}
                minWidth={nodeDimensions.width}
                nodeToResize={nodeInFlow}
                canResize={selected}
                color={color}
            />

            <BaseNodeContainer
                onTransitionEnd={() => updateNodeInternals(id)}
                selected={selected}
                color={selected ? "blue" : color}
                processing={isProcessing}
                processState={processState.status}
                className={cn(
                    "w-full h-full flex flex-col select-none transition-all duration-200 ease-in-out",
                    "rounded-lg shadow-lg bg-white",
                    // Override min dimensions to prevent size conflicts
                    "!min-w-0 !min-h-0"
                )}
                style={{
                    width: nodeInFlow?.width || nodeDimensions.width,
                    height: nodeInFlow?.height || nodeDimensions.height,
                }}
            >
                <ConnectionHandles 
                    nodeType="contentnode"
                    color={color}
                />

                <NodeHeader 
                    className={cn("dragHandle", "bg-gradient-to-r from-blue-50 to-blue-100")}
                    icon={<Eye className="w-4 h-4 stroke-blue-700" />}
                    label={nodeLabel}
                    isProcessing={isProcessing}
                    isCompleted={isCompleted}
                    hasError={hasError}
                    menuItems={contentNodeMenuItems}
                />

                <div className="flex-1 flex flex-col items-center justify-center p-4 gap-3">
                    <div className="flex items-center justify-center">
                        <div className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center transition-all",
                            isProcessing ? "bg-blue-100 animate-pulse" : "bg-blue-100",
                            hasError ? "bg-red-100" : "",
                            isCompleted ? "bg-green-100" : ""
                        )}>
                            <Eye className={cn(
                                "w-6 h-6 transition-all",
                                isProcessing ? "text-blue-600 animate-pulse" : "text-blue-600",
                                hasError ? "text-red-600" : "",
                                isCompleted ? "text-green-600" : ""
                            )} />
                        </div>
                    </div>
                    
                    <div className="text-center text-sm text-slate-700 leading-relaxed px-1">
                        <Badge variant="outline" className={cn("text-xs px-2 py-1 m-1 font-mono", displayTypeColor)}>
                            {displayType.toUpperCase()}
                        </Badge>
                    
                    </div>
                    
                    {/* Play Controls replacing the status display */}
                    <NodePlayControls
                        isProcessing={isProcessing}
                        isLooping={isLooping}
                        loopInterval={loopInterval}
                        onPlay={handleProcessContent}
                        onStop={handleStop}
                        onLoopToggle={handleLoopToggle}
                        onLoopIntervalChange={handleLoopIntervalChange}
                        className="mt-1"
                    />
                </div>
            </BaseNodeContainer>
        </>
    );
};

// Helper function to get display type color
const getDisplayTypeColor = (displayType: string): string => {
    switch (displayType.toLowerCase()) {
        case 'list':
            return 'text-blue-600 bg-blue-50 border-blue-200';
        case 'table':
            return 'text-green-600 bg-green-50 border-green-200';
        case 'cards':
            return 'text-purple-600 bg-purple-50 border-purple-200';
        case 'custom':
            return 'text-orange-600 bg-orange-50 border-orange-200';
        default:
            return 'text-gray-600 bg-gray-50 border-gray-200';
    }
};

export default ContentNode;