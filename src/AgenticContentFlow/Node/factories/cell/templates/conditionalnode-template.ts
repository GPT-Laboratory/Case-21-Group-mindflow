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
    "templateCode": "async function process(incomingData, nodeData, params, targetMap, sourceMap) { console.log('🔀 ConditionalNode processing:', { incomingData, nodeData, availableTargets: Array.from(targetMap.keys()) }); const { condition, conditionType, leftValue, rightValue } = nodeData; if (!condition && !leftValue) { throw new Error('Condition or leftValue is required'); } let result = false; try { if (condition) { const data = incomingData.data || incomingData; if (condition.includes('data.length > 3')) { result = data.length > 3; } else if (condition.includes('data.length >')) { const threshold = parseInt(condition.match(/\\d+/)?.[0] || '0'); result = data.length > threshold; } else { result = Boolean(condition); } } else if (conditionType === 'greater') { result = Number(leftValue) > Number(rightValue); } else if (conditionType === 'less') { result = Number(leftValue) < Number(rightValue); } else if (conditionType === 'equals') { result = leftValue == rightValue; } } catch (error) { console.error('Condition evaluation error:', error); result = false; } console.log(`🎯 Condition evaluated to: ${result}`); const availableTargets = Array.from(targetMap.keys()); console.log('Available target node IDs:', availableTargets); const trueTargets = availableTargets.filter(id => id.includes('content') || id.includes('display') || id.includes('show')); const falseTargets = availableTargets.filter(id => id.includes('post') || id.includes('submit') || id.includes('create')); const selectedTargets = result ? (trueTargets.length > 0 ? trueTargets : [availableTargets[0]]) : (falseTargets.length > 0 ? falseTargets : [availableTargets[1] || availableTargets[0]]); console.log(`🎯 Routing to targets:`, selectedTargets); return { data: incomingData, targets: selectedTargets, conditionResult: result, metadata: { evaluatedCondition: condition || `${leftValue} ${conditionType} ${rightValue}`, availableTargets, selectedTargets, timestamp: new Date().toISOString() } }; }",
    "metadata": {
      "generatedBy": "manual",
      "version": "1.0.0",
      "lastUpdated": "2025-06-15T10:30:00Z",
      "executionContext": "frontend",
      "signature": "async function process(incomingData, nodeData, params, targetMap, sourceMap)"
    },
    "expectedInput": "any data to evaluate",
    "expectedOutput": "routing result with target specification",
    "parameters": {
      "strictMode": {
        "type": "boolean",
        "description": "Use strict equality (===) instead of loose (==)",
        "required": false,
        "default": false,
        "ui": { "component": "checkbox" }
      },
      "debugMode": {
        "type": "boolean",
        "description": "Enable detailed condition evaluation logging",
        "required": false,
        "default": true,
        "ui": { "component": "checkbox" }
      }
    },
    "constraints": {
      "timeout": 5000,
      "maxRetries": 2,
      "requiresAuth": false
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