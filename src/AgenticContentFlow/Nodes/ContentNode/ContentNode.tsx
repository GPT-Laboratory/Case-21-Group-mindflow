import React, { useEffect, useState, useRef } from 'react';
import { NodeProps } from '@xyflow/react';
import { Eye } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useNodeProcess } from '../../Process/useNodeProcess';
import { useProcessContext } from '../../Process/ProcessContext';
import { dataSchemaManager } from '../../Process/DataSchemaManager';

// Shared CellNode component
import { CellNode, CellNodeConfig } from '../common/CellNode';

/**
 * Content Node Component
 * 
 * A fixed-size square node for displaying and rendering data in various formats 
 * like lists, tables, cards. Features reactive data schema and bidirectional 
 * schema communication with upstream nodes.
 */
export const ContentNode: React.FC<NodeProps> = (props) => {
    const { id, data } = props;
    
    // Get the process context for persistent data storage
    const processContext = useProcessContext();
    
    // Use the process system for FlowData handling
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
        autoStartDelay: 2200  // Wait for edge animation to complete
    });

    // Loop state management
    const [isLooping, setIsLooping] = useState(false);
    const [loopInterval, setLoopInterval] = useState(5);
    const loopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Approval state management
    const [waitingForApproval, setWaitingForApproval] = useState(false);
    const [autoApprove, setAutoApprove] = useState(
        typeof data?.autoApprove === 'boolean' ? data.autoApprove : false
    );
    const [pendingData, setPendingData] = useState<any>(null);

    // Type-safe data extraction
    const nodeLabel = typeof data?.label === 'string' ? data.label : 'Content Display';
    const displayType = typeof data?.displayType === 'string' ? data.displayType : 'list';
    const maxItems = typeof data?.maxItems === 'number' ? data.maxItems : 10;
    const requiresUserApproval = typeof data?.requiresUserApproval === 'boolean' ? data.requiresUserApproval : false;

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

    // Handle user approval
    const handleApprove = () => {
        if (pendingData) {
            // Process the pending data
            processPendingData(pendingData);
            setPendingData(null);
        }
        setWaitingForApproval(false);
    };

    // Handle auto-approve toggle
    const handleAutoApproveToggle = () => {
        setAutoApprove(!autoApprove);
    };

    // Process data that was waiting for approval
    const processPendingData = async (inputData: any) => {
        try {
            startProcess({ action: 'rendering', displayType, maxItems, data: inputData });
            
            // Simulate content rendering time
            await new Promise(resolve => setTimeout(resolve, 1200));
            
            const result = {
                displayType,
                itemsRendered: Array.isArray(inputData) ? inputData.length : 1,
                maxItems,
                processed: true,
                timestamp: new Date().toISOString(),
                inputData,
                userApproved: true
            };
            
            completeProcess(result);
        } catch (error) {
            setError(`Failed to process approved data: ${error}`);
        }
    };

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (loopTimeoutRef.current) {
                clearTimeout(loopTimeoutRef.current);
            }
        };
    }, []);

    // Automatic processing logic - modified to handle approval
    useEffect(() => {
        if (isProcessing && processState.startTime) {
            // Check if this was triggered by automatic processing (has received data)
            const hasReceivedData = processState.data !== undefined;
            
            if (hasReceivedData) {
                const inputData = processState.data;
                
                // 🔍 CONSOLE LOGGING: Show what data the ContentNode received
                console.group(`📦 ContentNode (${id}) received data:`);
                console.log('Raw data:', inputData);
                console.log('Data type:', typeof inputData);
                console.log('Is array:', Array.isArray(inputData));
                console.log('Data length/size:', Array.isArray(inputData) ? inputData.length : Object.keys(inputData || {}).length);
                console.log('Data structure:', JSON.stringify(inputData, null, 2));
                console.log('Expected schema:', data?.expectedSchema);
                console.groupEnd();
                
                // If requires approval and auto-approve is disabled, wait for approval
                if (requiresUserApproval && !autoApprove) {
                    console.log(`⏳ ContentNode (${id}) waiting for user approval`);
                    setPendingData(inputData);
                    setWaitingForApproval(true);
                    return;
                }
                
                // Auto-execute the processing logic when triggered by incoming data
                const executeAutoProcessing = async () => {
                    try {
                        // Get input schema and data from the process state
                        const inputData = processState.data;
                        const inputSchema = dataSchemaManager.getInputSchema(id);
                        
                        // Simulate the actual processing logic
                        await new Promise(resolve => setTimeout(resolve, 1200));
                        
                        const result = {
                            displayType,
                            itemsRendered: Array.isArray(inputData) ? inputData.length : 1,
                            maxItems,
                            processed: true,
                            timestamp: new Date().toISOString(),
                            inputData,
                            autoTriggered: true,
                            autoApproved: autoApprove
                        };
                        
                        console.log(`✅ ContentNode (${id}) processing completed:`, result);
                        
                        // Store the actual input data for Preview tab access
                        processContext.setNodeLastData(id, inputData);
                        
                        completeProcess(result);
                    } catch (error) {
                        console.error(`❌ ContentNode (${id}) processing failed:`, error);
                        setError(`Failed to auto-render content: ${error}`);
                    }
                };
                
                executeAutoProcessing();
            }
        }
    }, [isProcessing, processState.startTime, processState.data, displayType, maxItems, requiresUserApproval, autoApprove, completeProcess, setError, id, data?.expectedSchema]);

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

    // Configuration for the CellNode
    const cellNodeConfig: CellNodeConfig = {
        nodeType: "contentnode",
        icon: <Eye />,
        headerIcon: <Eye className="w-4 h-4 stroke-blue-700" />,
        headerGradient: "bg-gradient-to-r from-blue-50 to-blue-100",
        selectedColor: "blue",
        badge: {
            text: displayType.toUpperCase(),
            colorClasses: displayTypeColor
        },
        menuItems: contentNodeMenuItems
    };

    return (
        <CellNode
            {...props}
            config={cellNodeConfig}
            label={nodeLabel}
            isProcessing={isProcessing}
            isCompleted={isCompleted}
            hasError={hasError}
            onPlay={handleProcessContent}
            onStop={handleStop}
            isLooping={isLooping}
            loopInterval={loopInterval}
            onLoopToggle={handleLoopToggle}
            onLoopIntervalChange={handleLoopIntervalChange}
            requiresUserApproval={requiresUserApproval}
            autoApprove={autoApprove}
            waitingForApproval={waitingForApproval}
            onApprove={handleApprove}
            onAutoApproveToggle={handleAutoApproveToggle}
        />
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