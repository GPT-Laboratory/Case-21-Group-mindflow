import { NodeFactoryJSON } from "../types";

export const conditionalNodeConfig: NodeFactoryJSON = {
  nodeType: "conditionalnode",
  defaultLabel: "Condition Check ✨", // Force refresh marker
  category: "logic",
  group: "process",
  description: "Routes data based on conditional logic with multiple output paths",
  
  visual: {
    icon: { type: "builtin", value: "GitFork" },
    headerIcon: { type: "builtin", value: "GitFork", className: "w-6 h-6 rotate-90" },
    headerGradient: "bg-gradient-to-r from-amber-50 to-amber-100",
    selectedColor: "amber",
    variants: {
      fieldName: "conditionType",
      options: {
        "equals": { badgeText: "==", badgeColor: "bg-blue-100 text-blue-800" },
        "greater": { badgeText: ">", badgeColor: "bg-green-100 text-green-800" },
        "less": { badgeText: "<", badgeColor: "bg-orange-100 text-orange-800" },
        "contains": { badgeText: "IN", badgeColor: "bg-purple-100 text-purple-800" }
      },
      default: { badgeText: "IF", badgeColor: "bg-amber-100 text-amber-800" }
    },
    additionalContentFunction: ".condition"
  },
  
  handles: {
    category: "logic",
    definitions: [
      {
        position: "left",
        type: "target",
        dataFlow: "control",
        acceptsFrom: ["view", "logic", "integration"],
        icon: "arrow-right",
        edgeType: "package"
      },
      {
        position: "right",
        type: "source",
        dataFlow: "control", 
        connectsTo: ["logic", "container", "page", "view"],
        icon: "arrow-right",
        edgeType: "package"
      }
    ]
  },
  
  process: {
    code: `async function process(incomingData, nodeData, params, targetMap, sourceMap, edgeMap, edgeMetadataMap) {
  const { condition, conditionType, leftValue, rightValue } = nodeData;
  
  console.log('🔀 ConditionalNode evaluating (v2.0):', { 
    condition, 
    conditionType, 
    leftValue, 
    rightValue, 
    incomingData,
    targetCount: targetMap ? targetMap.size : 0,
    hasEdgeMetadata: edgeMetadataMap ? edgeMetadataMap.size : 0
  });
  
  // DEBUG: Log the edge metadata map
  if (edgeMetadataMap) {
    console.log('🗺️ EdgeMetadataMap contents:', Object.fromEntries(edgeMetadataMap));
  }
  
  // Extract condition value from incoming data if using data path
  let leftVal = leftValue;
  if (typeof leftValue === 'string' && leftValue.startsWith('data.')) {
    const path = leftValue.substring(5); // Remove 'data.' prefix
    leftVal = getNestedValue(incomingData, path);
    console.log(\`🔍 Extracted from path "data.\${path}": \${leftVal} (from incomingData)\`);
  } else if (typeof leftValue === 'string' && leftValue.startsWith('incomingData.')) {
    const path = leftValue.substring(13); // Remove 'incomingData.' prefix
    leftVal = getNestedValue(incomingData, path);
    console.log(\`🔍 Extracted from path "incomingData.\${path}": \${leftVal}\`);
  } else {
    console.log(\`🔍 Using literal value: \${leftVal}\`);
  }
  
  // DEBUG: Log the actual incoming data structure
  console.log('🔍 Incoming data structure:', {
    type: typeof incomingData,
    isArray: Array.isArray(incomingData),
    keys: typeof incomingData === 'object' ? Object.keys(incomingData) : 'not an object',
    dataProperty: incomingData?.data ? {
      type: typeof incomingData.data,
      isArray: Array.isArray(incomingData.data),
      length: Array.isArray(incomingData.data) ? incomingData.data.length : 'not an array'
    } : 'no data property'
  });
  
  // Helper function to get nested values
  function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }
  
  // Evaluate condition based on type
  let result = false;
  try {
    switch (conditionType) {
      case 'equals':
        result = leftVal == rightValue;
        break;
      case 'greater':
        result = Number(leftVal) > Number(rightValue);
        break;
      case 'less':
        result = Number(leftVal) < Number(rightValue);
        break;
      case 'contains':
        if (Array.isArray(leftVal)) {
          result = leftVal.includes(rightValue);
        } else {
          result = String(leftVal).includes(String(rightValue));
        }
        break;
      default:
        // Legacy: evaluate condition as expression
        if (condition && typeof condition === 'string') {
          // Safe evaluation using a controlled approach
          try {
            // Create a simple evaluation context with limited scope
            const evaluationContext = {
              data: incomingData,
              incomingData: incomingData,
              Array: Array,
              Number: Number,
              String: String,
              Math: Math
            };
            
            // Create a safe evaluation function using a whitelist approach
            const safeEval = (expr, context) => {
              // Basic safety check - only allow simple expressions
              // Fixed regex: move hyphen to end or escape it properly
              if (/[{}();=]/.test(expr) && !/^[a-zA-Z0-9._\s><=!&|+*/()-]+$/.test(expr)) {
                console.warn('Complex expression not allowed:', expr);
                return false;
              }
              
              // Replace data references with context access
              const processedExpr = expr
                .replace(/data\./g, 'context.data.')
                .replace(/incomingData\./g, 'context.incomingData.');
              
              // Use a simple evaluation approach
              try {
                // For basic comparisons, handle directly
                if (processedExpr.includes('>')) {
                  const [left, right] = processedExpr.split('>').map(s => s.trim());
                  const leftVal = getValueFromPath(left, context);
                  const rightVal = isNaN(right) ? right.replace(/['"]/g, '') : Number(right);
                  return Number(leftVal) > Number(rightVal);
                } else if (processedExpr.includes('<')) {
                  const [left, right] = processedExpr.split('<').map(s => s.trim());
                  const leftVal = getValueFromPath(left, context);
                  const rightVal = isNaN(right) ? right.replace(/['"]/g, '') : Number(right);
                  return Number(leftVal) < Number(rightVal);
                } else if (processedExpr.includes('==')) {
                  const [left, right] = processedExpr.split('==').map(s => s.trim());
                  const leftVal = getValueFromPath(left, context);
                  const rightVal = isNaN(right) ? right.replace(/['"]/g, '') : Number(right);
                  return leftVal == rightVal;
                }
                
                return false;
              } catch (error) {
                console.error('Expression evaluation error:', error);
                return false;
              }
            };
            
            // Helper to get value from path like 'context.data.length'
            const getValueFromPath = (path, context) => {
              try {
                const cleanPath = path.replace('context.', '');
                return cleanPath.split('.').reduce((obj, key) => obj && obj[key], context);
              } catch {
                return undefined;
              }
            };
            
            result = safeEval(condition, evaluationContext);
          } catch (error) {
            console.error('Condition evaluation error:', error);
            result = false;
          }
        } else {
          result = false;
        }
    }
  } catch (error) {
    console.error('ConditionalNode evaluation error:', error);
    result = false;
  }
  
  console.log(\`🎯 Condition evaluated to: \${result}\`);
  console.log(\`   Left value: \${leftVal} (\${typeof leftVal})\`);
  console.log(\`   Right value: \${rightValue} (\${typeof rightValue})\`);
  console.log(\`   Operation: \${conditionType || 'expression'}\`);
  
  // Determine target routing based on edge metadata instead of handle positions
  const trueTargets = [];
  const falseTargets = [];
  
  if (targetMap && edgeMetadataMap) {
    // NEW: Use edge metadata for routing instead of handle positions
    for (const [targetId, targetNode] of targetMap) {
      const edgeMetadata = edgeMetadataMap.get(targetId);
      
      if (edgeMetadata && edgeMetadata.routingCondition) {
        console.log(\`🔗 Edge to \${targetId}: routingCondition=\${edgeMetadata.routingCondition}\`);
        
        // Route based on edge metadata
        if (edgeMetadata.routingCondition === 'true') {
          trueTargets.push(targetId);
        } else if (edgeMetadata.routingCondition === 'false') {
          falseTargets.push(targetId);
        } else {
          // Unknown routing condition, default to true path
          console.warn(\`Unknown routing condition: \${edgeMetadata.routingCondition}, defaulting to true path\`);
          trueTargets.push(targetId);
        }
      } else {
        // FALLBACK: No metadata, use legacy handle-based routing
        const edge = edgeMap.get(targetId);
        if (edge) {
          console.log(\`🔗 Edge to \${targetId}: sourceHandle=\${edge.sourceHandle} (legacy routing)\`);
          
          // Bottom handle = true path, Right handle = false path
          if (edge.sourceHandle === 'bottom') {
            trueTargets.push(targetId);
          } else if (edge.sourceHandle === 'right') {
            falseTargets.push(targetId);
          } else {
            // Default: treat as true path for backward compatibility
            trueTargets.push(targetId);
          }
        } else {
          // If no edge info available, default to true path
          console.warn(\`No edge or metadata found for \${targetId}, defaulting to true path\`);
          trueTargets.push(targetId);
        }
      }
    }
  }
  
  console.log(\`🎯 Route targets - True: [\${trueTargets.join(', ')}], False: [\${falseTargets.join(', ')}]\`);
  
  // Return data with target specification for selective routing
  const selectedTargets = result ? trueTargets : falseTargets;
  
  return {
    data: incomingData,  // Pass through the incoming data
    targets: selectedTargets,
    conditionResult: result,
    evaluationDetails: {
      leftValue: leftVal,
      rightValue: rightValue,
      operation: conditionType || 'expression',
      expression: condition
    }
  };
}`,
    metadata: {
      generatedBy: "manual",
      version: "1.0.0", 
      lastUpdated: "2025-06-15T10:00:00Z",
      executionContext: "frontend",
      signature: "async function process(incomingData, nodeData, params, targetMap, sourceMap, edgeMap)"
    },
    expectedInput: "any data to evaluate",
    expectedOutput: "routing result with target specification",
    parameters: {
      strictMode: {
        type: "boolean",
        description: "Use strict equality (===) instead of loose (==)",
        required: false,
        default: false,
        ui: { component: "checkbox" }
      },
      debugMode: {
        type: "boolean", 
        description: "Enable detailed condition evaluation logging",
        required: false,
        default: true,
        ui: { component: "checkbox" }
      }
    },
    constraints: {
      timeout: 5000,
      maxRetries: 2,
      requiresAuth: false
    }
  },
  
  menu: {
    items: [
      { key: "test", label: "Test Condition", action: "execute" },
      { key: "configure", label: "Configure Logic", action: "configure" },
      { key: "debug", label: "View Code", action: "debug" }
    ]
  },
  
  template: {
    defaultData: {
      condition: "data.data.length > 3",
      conditionType: "greater",
      leftValue: "data.data.length", 
      rightValue: "3"
    },
    defaultDimensions: { width: 200, height: 200 },
    defaultParameters: {
      strictMode: false,
      debugMode: true
    }
  }
};