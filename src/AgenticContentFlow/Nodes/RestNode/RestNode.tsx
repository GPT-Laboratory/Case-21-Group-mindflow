import React, { useState, useRef, useEffect } from 'react';
import { NodeProps } from '@xyflow/react';
import { useNodeProcess } from '../../Process/useNodeProcess';
import { Globe2 } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

// DataSchemaManager integration
import { dataSchemaManager, JSONSchema } from '../../Process/DataSchemaManager';

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
        autoAcknowledge: true,
        acknowledgeDelay: 300 
    });

    // Loop state management
    const [isLooping, setIsLooping] = useState(false);
    const [loopInterval, setLoopInterval] = useState(5);
    const loopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Type-safe data extraction
    const nodeLabel = typeof data?.label === 'string' ? data.label : 'REST API';
    const method = typeof data?.method === 'string' ? data.method : 'GET';
    const url = typeof data?.url === 'string' ? data.url : '';

    // Extract URL parts and load favicon
    const { domain, pathWithQuery } = getUrlParts(url);
    const favicon = useFavicon(domain);

    // Enhanced API analysis with schema propagation
    const handleAnalyzeEndpoint = async () => {
        try {
            startProcess({ method, url, action: 'analyzing' });
            
            // Simulate API analysis
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Generate schema based on the endpoint
            const outputSchema = generateSchemaFromEndpoint(url, method);
            
            const result = {
                method,
                url,
                status: 200,
                response: outputSchema.example,
                duration: Math.floor(Math.random() * 500) + 100,
                schema: outputSchema
            };
            
            // Update the node's output schema in DataSchemaManager
            dataSchemaManager.updateNodeSchema(id, {
                nodeId: id,
                outputSchema: outputSchema.schema,
                lastUpdated: Date.now()
            });
            
            // Propagate schema to connected downstream nodes
            dataSchemaManager.propagateSchemaToDownstream(id);
            
            completeProcess(result);
        } catch (error) {
            setError(`Failed to analyze endpoint: ${error}`);
        }
    };

    // Simulate API call
    const handleTestConnection = async () => {
        try {
            startProcess({ method, url, action: 'testing' });
            
            // Simulate API call time
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const result = {
                method,
                url,
                status: 200,
                response: { success: true, timestamp: new Date().toISOString() },
                duration: Math.floor(Math.random() * 500) + 100
            };
            
            completeProcess(result);
        } catch (error) {
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
        />
    );
};

// Helper function to generate schema from endpoint URL
const generateSchemaFromEndpoint = (url: string, _method: string) => {
    // Simple schema generation based on common API patterns
    if (url.includes('/posts')) {
        return {
            schema: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        id: { type: "number" },
                        userId: { type: "number" },
                        title: { type: "string" },
                        body: { type: "string" }
                    }
                }
            } as JSONSchema,
            example: [
                { id: 1, userId: 1, title: "Sample Post", body: "This is a sample post body" },
                { id: 2, userId: 1, title: "Another Post", body: "Another post body" }
            ]
        };
    } else if (url.includes('/users')) {
        return {
            schema: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        id: { type: "number" },
                        name: { type: "string" },
                        email: { type: "string" },
                        username: { type: "string" }
                    }
                }
            } as JSONSchema,
            example: [
                { id: 1, name: "John Doe", email: "john@example.com", username: "johndoe" }
            ]
        };
    } else if (url.includes('/comments')) {
        return {
            schema: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        id: { type: "number" },
                        postId: { type: "number" },
                        name: { type: "string" },
                        email: { type: "string" },
                        body: { type: "string" }
                    }
                }
            } as JSONSchema,
            example: [
                { id: 1, postId: 1, name: "Comment Author", email: "author@example.com", body: "Sample comment" }
            ]
        };
    }
    
    // Default generic schema
    return {
        schema: {
            type: "object",
            properties: {
                data: { type: "string" }
            }
        } as JSONSchema,
        example: { data: "Sample response data" }
    };
};

export default RestNode;