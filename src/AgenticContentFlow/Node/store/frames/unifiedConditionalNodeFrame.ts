/** @format */

import { UnifiedFrameJSON } from '../../factory//types/UnifiedFrameJSON';

/**
 * Unified Conditional Node Frame
 * Represents conditional logic nodes with routing capabilities
 */
export const unifiedConditionalNodeFrame: UnifiedFrameJSON = {
  nodeType: "conditionalnode",
  defaultLabel: "Condition Check",
  category: "logic",
  group: "cell",
  description: "Routes data based on conditional logic with multiple output paths",
  
  visual: {
    icon: { type: "builtin", value: "GitFork" },
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
  
  defaultDimensions: {
    width: 200,
    height: 200
  },
  
  handles: {
    category: "logic",
    definitions: [
      {
        position: "top",
        type: "target",
        dataFlow: "control",
        acceptsFrom: ["view", "logic", "integration"],
        icon: "arrow-down",
        edgeType: "package"
      },
      {
        position: "left",
        type: "target",
        dataFlow: "control",
        acceptsFrom: ["view", "logic", "integration"],
        icon: "arrow-right",
        edgeType: "package"
      },
      {
        position: "bottom",
        type: "source",
        dataFlow: "control", 
        connectsTo: ["logic", "container", "page", "view"],
        icon: "arrow-down",
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
    code: "// Example: Routes data based on conditional logic",
    templateCode: `async function process(incomingData, nodeData, params, targetMap, sourceMap) {
  console.log('🔀 ConditionalNode processing:', { incomingData, nodeData, availableTargets: Array.from(targetMap.keys()) });
  
  const { condition, conditionType, leftValue, rightValue } = nodeData;
  
  if (!condition && !leftValue) {
    console.warn('⚠️ No condition specified, defaulting to true path');
    return { data: incomingData, target: 'bottom', metadata: { condition: 'default', result: true } };
  }
  
  let result = false;
  
  try {
    // Evaluate condition based on type
    switch (conditionType) {
      case 'equals':
        result = leftValue == rightValue;
        break;
      case 'greater':
        result = Number(leftValue) > Number(rightValue);
        break;
      case 'less':
        result = Number(leftValue) < Number(rightValue);
        break;
      case 'contains':
        result = String(leftValue).includes(String(rightValue));
        break;
      default:
        // Use custom condition if provided
        if (condition) {
          // Create a safe evaluation context
          const context = { data: incomingData, leftValue, rightValue };
          result = new Function('data', 'leftValue', 'rightValue', \`return \${condition}\`)(incomingData, leftValue, rightValue);
        }
    }
    
    console.log('✅ Condition evaluation:', { conditionType, leftValue, rightValue, result });
    
    return {
      data: incomingData,
      target: result ? 'bottom' : 'right', // Route based on result
      metadata: {
        condition: conditionType,
        leftValue,
        rightValue,
        result,
        evaluatedAt: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('❌ Condition evaluation failed:', error);
    throw error;
  }
}`,
    metadata: {
      generatedBy: "manual",
      version: "1.0.0",
      lastUpdated: "2025-06-15T10:30:00Z",
      executionContext: "frontend",
      signature: "async function process(incomingData, nodeData, params, targetMap, sourceMap)"
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
    }
  }
}; 