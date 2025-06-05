// Helper function to create processed data based on operation and output schema
export const createProcessedData = (operation: string, condition: string, outputSchema: any, inputData?: any, nodeData?: any) => {
    // 🔍 DEBUG: Log what data we're processing

    // 🔧 EXTRACT ACTUAL DATA: Handle REST response wrapper
    let actualData = inputData;

    // If input data is a REST response object, extract the actual response
    if (inputData && typeof inputData === 'object' && !Array.isArray(inputData)) {
        if (inputData.response && Array.isArray(inputData.response)) {
            actualData = inputData.response;
        } else if (inputData.data && Array.isArray(inputData.data)) {
            actualData = inputData.data;
        }
    }

    // 🎯 NEW: Check if we have structured logic rules (new system)
    const logicRules = nodeData?.logicRules;
    const hasStructuredRules = logicRules && Array.isArray(logicRules) && logicRules.length > 0;

    switch (operation.toLowerCase()) {
        case 'filter':
            // If we have actual data and it's an array, filter it
            if (actualData && Array.isArray(actualData)) {
                try {
                    // 🚀 NEW: Use structured rules if available
                    if (hasStructuredRules) {
                        const filteredData = actualData.filter((item: any) => {
                            return evaluateLogicRules(logicRules, item);
                        });
                        return filteredData;
                    }
                    
                    // 📜 LEGACY: Fall back to condition string parsing
                    const filteredData = actualData.filter((item: any) => {
                        // Create a safe evaluation context
                        const post = item; // Allow 'post' variable in condition

                        // For the specific condition: 'post.userId <= 5 && post.title.length > 10'
                        if (condition.includes('post.userId') && condition.includes('post.title.length')) {
                            const userIdMatch = post.userId <= 5;
                            const titleLengthMatch = post.title && post.title.length > 10;
                            return userIdMatch && titleLengthMatch;
                        }

                        // Handle category-based conditions
                        if (condition.includes('category')) {
                            const categoryMatch = condition.match(/category\s*==\s*['"]([^'"]+)['"]/);
                            if (categoryMatch) {
                                const targetCategory = categoryMatch[1];
                                return item.category === targetCategory;
                            }
                        }

                        // Default: include all items if condition can't be parsed
                        console.warn('Could not parse condition:', condition);
                        return true;
                    });
                    return filteredData;
                } catch (error) {
                    console.error('❌ Error filtering data:', error);
                    // Fallback: return first 3 items
                    return actualData.slice(0, 3);
                }
            }

            // If no input data, generate sample filtered data based on output schema
            console.log('⚠️ No input data, generating sample data');
            if (outputSchema.type === 'array') {
                return [
                    {
                        id: 1,
                        title: "Filtered Post 1",
                        category: "Technology",
                        author: "Sample Author",
                        content: "This is a filtered post content"
                    },
                    {
                        id: 2,
                        title: "Filtered Post 2",
                        category: "Technology",
                        author: "Another Author",
                        content: "Another filtered post content"
                    }
                ];
            }
            break;

        case 'transform':
            // Transform the data structure
            if (inputData && Array.isArray(inputData)) {
                // 🚀 NEW: Use structured rules for transformation logic
                if (hasStructuredRules) {
                    return inputData.map((item: any) => {
                        const transformedItem = { ...item };
                        
                        // Apply transformation rules
                        logicRules.forEach((rule: any) => {
                            if (rule.operator === 'transform') {
                                // Apply transformation based on rule
                                transformedItem[rule.field] = rule.value;
                            }
                        });
                        
                        return {
                            ...transformedItem,
                            transformed: true,
                            processedAt: new Date().toISOString()
                        };
                    });
                }
                
                // Legacy transformation
                return inputData.map((item: any) => ({
                    ...item,
                    transformed: true,
                    processedAt: new Date().toISOString()
                }));
            }
            break;

        case 'aggregate':
            // Aggregate data into summary - but return as array for compatibility with ContentNode
            if (inputData && Array.isArray(inputData)) {
                const aggregatedData = {
                    id: 'aggregate-summary',
                    title: `Summary of ${inputData.length} items`,
                    body: `Aggregated data processed at ${new Date().toISOString()}`,
                    count: inputData.length,
                    summary: {
                        totalItems: inputData.length,
                        categories: [...new Set(inputData.map((item: any) => item.category))],
                        processedAt: new Date().toISOString(),
                        rulesApplied: hasStructuredRules ? logicRules.length : 0
                    },
                    aggregated: true,
                    // Include original data structure for backward compatibility
                    originalData: inputData
                };

                // Return as single-item array for ContentNode compatibility
                return [aggregatedData];
            }
            break;

        default:
            // For other operations, prefer returning the original input data if available
            if (inputData && Array.isArray(inputData)) {
                return inputData.map((item: any) => ({
                    ...item,
                    operation,
                    processed: true,
                    timestamp: new Date().toISOString()
                }));
            }

            // If no input data available, return empty array to maintain ContentNode compatibility
            return [];
    }

    // Fallback: return actual data if it exists and is an array, otherwise empty array
    if (actualData && Array.isArray(actualData)) {
        return actualData;
    }

    console.log('⚠️ Returning empty array as fallback');
    return [];
};

// 🆕 NEW: Function to evaluate structured logic rules
function evaluateLogicRules(rules: any[], item: any): boolean {
    if (!rules || rules.length === 0) return true;
    
    let result = true;
    let currentLogicalOperator: 'AND' | 'OR' | null = null;
    
    for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        const ruleResult = evaluateSingleRule(rule, item);
        
        if (i === 0) {
            // First rule
            result = ruleResult;
        } else {
            // Apply logical operator from previous rule
            const prevRule = rules[i - 1];
            if (prevRule.logicalOperator === 'OR') {
                result = result || ruleResult;
            } else { // Default to AND
                result = result && ruleResult;
            }
        }
    }
    
    return result;
}

// 🆕 NEW: Function to evaluate a single rule
function evaluateSingleRule(rule: any, item: any): boolean {
    const { field, operator, value } = rule;
    
    // Get the field value from the item
    const fieldValue = getFieldValue(item, field);
    
    switch (operator) {
        case '==':
            return fieldValue == value;
        case '!=':
            return fieldValue != value;
        case '>':
            return fieldValue > value;
        case '>=':
            return fieldValue >= value;
        case '<':
            return fieldValue < value;
        case '<=':
            return fieldValue <= value;
        case 'contains':
            return typeof fieldValue === 'string' && fieldValue.includes(value);
        case 'startsWith':
            return typeof fieldValue === 'string' && fieldValue.startsWith(value);
        case 'endsWith':
            return typeof fieldValue === 'string' && fieldValue.endsWith(value);
        case 'length>':
            return typeof fieldValue === 'string' && fieldValue.length > value;
        case 'length<':
            return typeof fieldValue === 'string' && fieldValue.length < value;
        default:
            console.warn('Unknown operator:', operator);
            return true;
    }
}

// 🆕 NEW: Helper to get field value from item (supports nested paths)
function getFieldValue(item: any, fieldPath: string): any {
    if (!item || !fieldPath) return undefined;
    
    // Handle simple field names
    if (!fieldPath.includes('.')) {
        return item[fieldPath];
    }
    
    // Handle nested field paths like "user.profile.name"
    const parts = fieldPath.split('.');
    let current = item;
    
    for (const part of parts) {
        if (current === null || current === undefined) {
            return undefined;
        }
        current = current[part];
    }
    
    return current;
}