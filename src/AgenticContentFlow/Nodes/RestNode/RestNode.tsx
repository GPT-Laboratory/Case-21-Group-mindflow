import React, { useState, useRef, useEffect } from 'react';
import { NodeProps } from '@xyflow/react';
import { useNodeProcess } from '../../Process/useNodeProcess';
import { useProcessContext } from '../../Process/ProcessContext';
import { Globe2 } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

// DataSchemaManager integration
import { dataSchemaManager } from '../../Process/DataSchemaManager';

// Local utilities and components
import { getUrlParts } from './utils/urlUtils';
import { getMethodColor } from './utils/methodUtils';
import { useFavicon } from './hooks/useFavicon';
import { DomainIcon } from './components/DomainIcon';

// Shared CellNode component
import { CellNode, CellNodeConfig } from '../common/CellNode';

/**
 * REST Node Component
 * 
 * Represents a REST API endpoint configuration and execution.
 * Non-collapsible node that shows HTTP method prominently.
 */
export const RestNode: React.FC<NodeProps> = (props) => {
    const { id, data } = props;
    
    // Use the process system
    const { 
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

    // Approval state management
    const [waitingForApproval, setWaitingForApproval] = useState(false);
    const [autoApprove, setAutoApprove] = useState(
        typeof data?.autoApprove === 'boolean' ? data.autoApprove : false
    );
    const [pendingData, setPendingData] = useState<any>(null);

    // Type-safe data extraction
    const nodeLabel = typeof data?.label === 'string' ? data.label : 'REST API';
    const method = typeof data?.method === 'string' ? data.method : 'GET';
    const url = typeof data?.url === 'string' ? data.url : '';
    const requiresUserApproval = typeof data?.requiresUserApproval === 'boolean' ? data.requiresUserApproval : false;

    // Extract URL parts and load favicon
    const { domain, pathWithQuery } = getUrlParts(url);
    const favicon = useFavicon(domain);

    // Get process context for FlowData access
    const processContext = useProcessContext();

    // Function to handle incoming data processing
    const processIncomingData = async (inputData: any) => {
        try {
            startProcess({ method, url, action: 'api_call', data: inputData });
            
            // Make actual API call with the input data
            const apiResult = await makeApiCall(inputData);
            
            // Generate schema using DataSchemaManager for consistency
            const outputSchema = await dataSchemaManager.analyzeRestEndpoint(url, method);
            
            // Update the node's output schema in DataSchemaManager
            dataSchemaManager.updateSchema(id, undefined, outputSchema);
            
            // Complete with just the response data, not the full metadata object
            completeProcess(apiResult.response);
        } catch (error) {
            console.error('❌ Failed to process incoming data:', error);
            setError(`Failed to process incoming data: ${error}`);
        }
    };

    // Make actual API call
    const makeApiCall = async (requestData?: any) => {
        if (!url) {
            throw new Error('No URL configured');
        }

        const requestOptions: RequestInit = {
            method: method.toUpperCase(),
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'AgenticContentFlow/1.0'
            }
        };

        // Add body for POST, PUT, PATCH requests
        if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && requestData) {
            requestOptions.body = JSON.stringify(requestData);
        }


        try {
            const startTime = Date.now();
            const response = await fetch(url, requestOptions);
            const duration = Date.now() - startTime;
            
            let responseData;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }


            return {
                status: response.status,
                statusText: response.statusText,
                response: responseData,
                duration,
                headers: Object.fromEntries(response.headers.entries())
            };
        } catch (error) {
            console.error('❌ API call failed:', error);
            console.groupEnd();
            throw error;
        }
    };

    // Enhanced API analysis with schema propagation
    const handleAnalyzeEndpoint = async () => {
        try {
            startProcess({ method, url, action: 'analyzing' });
            
            // Make actual API call for analysis
            const apiResult = await makeApiCall();
            
            // Generate schema using DataSchemaManager for consistency
            const outputSchema = await dataSchemaManager.analyzeRestEndpoint(url, method);
            
            const result = {
                method,
                url,
                ...apiResult,
                schema: { schema: outputSchema },
                action: 'analyzing'
            };
            
            // Update the node's output schema in DataSchemaManager
            dataSchemaManager.updateSchema(id, undefined, outputSchema);
            
            completeProcess(result);
        } catch (error) {
            console.error('❌ API analysis failed:', error);
            setError(`Failed to analyze endpoint: ${error}`);
        }
    };

    // Make actual API call
    const handleTestConnection = async () => {
        try {
            startProcess({ method, url, action: 'testing' });
            
            // Make actual API call
            const apiResult = await makeApiCall({ 
                test: true, 
                timestamp: new Date().toISOString(),
                source: 'RestNode-Test'
            });
            
            completeProcess(apiResult.response);
        } catch (error) {
            console.error('❌ API call failed:', error);
            setError(`API call failed: ${error}`);
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
        // Note: We can't really stop an ongoing process, but we can prevent future loops
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

    // Handle user approval
    const handleApprove = async () => {
        if (pendingData) {
            await processIncomingData(pendingData);
            setPendingData(null);
            setWaitingForApproval(false);
        }
    };

    // Handle auto-approve toggle
    const handleAutoApproveToggle = () => {
        setAutoApprove(!autoApprove);
    };

    // Automatic processing logic - handles incoming data from upstream nodes
    useEffect(() => {
        const checkForFlowData = () => {
            const flowData = processContext.getFlowData(id);
            if (flowData && !isProcessing) {
                console.log(`🔄 RestNode ${id} received flow data:`, flowData);
                
                // Process the incoming flow data
                if (requiresUserApproval && !autoApprove) {
                    setPendingData(flowData);
                    setWaitingForApproval(true);
                } else {
                    // Auto-execute with flow data
                    processIncomingData(flowData);
                }
                
                // Clear the data after consuming it
                processContext.clearFlowData(id);
            }
        };

        checkForFlowData();
    }, [processContext.flowData, id, isProcessing, requiresUserApproval, autoApprove, processContext]);

    // Custom menu items for REST operations
    const restNodeMenuItems = [
        <DropdownMenuItem key="analyze" onClick={handleAnalyzeEndpoint}>
            Analyze Endpoint
        </DropdownMenuItem>,
        <DropdownMenuItem key="test" onClick={handleTestConnection}>
            Test Connection
        </DropdownMenuItem>,
        <DropdownMenuItem key="configure" onClick={() => console.log('Configure API')}>
            Configure API
        </DropdownMenuItem>,
        <DropdownMenuItem key="history" onClick={() => console.log('View history')}>
            View History
        </DropdownMenuItem>
    ];

    const methodColor = getMethodColor(method);

    // Configuration for the CellNode
    const cellNodeConfig: CellNodeConfig = {
        nodeType: "restnode",
        icon: <DomainIcon domain={domain} favicon={favicon} />,
        headerIcon: <Globe2 className="w-6 h-6" />,
        headerGradient: "bg-gradient-to-r from-blue-50 to-blue-200",
        selectedColor: "blue",
        badge: {
            text: method,
            colorClasses: methodColor
        },
        additionalContent: pathWithQuery || 'No endpoint configured',
        menuItems: restNodeMenuItems
    };

    return (
        <CellNode
            {...props}
            config={cellNodeConfig}
            label={nodeLabel}
            isProcessing={isProcessing}
            isCompleted={isCompleted}
            hasError={hasError}
            onPlay={handleTestConnection}
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

export default RestNode;