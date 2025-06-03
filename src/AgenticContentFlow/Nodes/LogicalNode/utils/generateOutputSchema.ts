// Helper function to generate output schema based on operation and input schema
export const generateOutputSchema = (operation: string, inputSchema: any, nodeData?: any) => {
    // If the node has a pre-configured outputSchema, use it
    if (nodeData?.outputSchema && Object.keys(nodeData.outputSchema).length > 0) {
        return nodeData.outputSchema;
    }

    // Fallback to default schema generation based on operation type
    switch (operation.toLowerCase()) {
        case 'filter':
            // Filter operations always return arrays, even without input schema
            if (inputSchema?.type === 'array') {
                return {
                    type: "array",
                    items: inputSchema.items || { type: "object" }
                };
            } else {
                // Default array schema for filter operations
                return {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "number" },
                            title: { type: "string" },
                            body: { type: "string" },
                            userId: { type: "number" }
                        }
                    }
                };
            }
        
        case 'transform':
            // Transform might change the structure - for now, keep the same
            // In a real implementation, this would be based on transformation rules
            return inputSchema || {
                type: "array",
                items: { type: "object" }
            };
        
        case 'aggregate':
            // Aggregate produces an array with a single summary object for ContentNode compatibility
            return {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        title: { type: "string" },
                        body: { type: "string" },
                        count: { type: "number" },
                        summary: { type: "object" },
                        aggregated: { type: "boolean" },
                        originalData: { type: "array" }
                    }
                }
            };
        
        case 'conditional':
            // Conditional routing might split data but maintain structure
            return inputSchema || {
                type: "array",
                items: { type: "object" }
            };
        
        case 'validate':
            // Validation adds validation metadata but returns as array for ContentNode compatibility
            return {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        valid: { type: "boolean" },
                        errors: { type: "array", items: { type: "string" } },
                        data: inputSchema || { type: "object" },
                        // Include original data properties for display
                        id: { type: "number" },
                        title: { type: "string" },
                        body: { type: "string" },
                        validatedAt: { type: "string" }
                    }
                }
            };
        
        default:
            // For unknown operations, default to input schema or array
            return inputSchema || {
                type: "array",
                items: { type: "object" }
            };
    }
};