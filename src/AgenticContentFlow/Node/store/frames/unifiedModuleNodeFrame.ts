import { UnifiedFrameJSON } from '../../factory//types/UnifiedFrameJSON';

export const unifiedModuleNodeFrame: UnifiedFrameJSON = {
  nodeType: "modulenode",
  defaultLabel: "Module",
  category: "container",
  group: "container",
  description: "A module container that can hold multiple topics",
  
  visual: {
    icon: { type: "builtin", value: "FolderOpen" },
    style: {
      borderStyle: "solid",
      shadowStyle: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      customStyles: {}
    }
  },
  
  handles: {
    category: "container",
    definitions: [
      {
        position: "bottom",
        type: "source",
        dataFlow: "control",
        connectsTo: ["container"],
        icon: "arrow-down",
        edgeType: "package"
      }
    ]
  },
  
  process: {
    templateCode: "async function process(incomingData, nodeData, params, targetMap, sourceMap) { console.log('📁 ModuleNode processing:', { incomingData, nodeData }); return { data: incomingData, metadata: { type: 'module', title: nodeData.label, description: nodeData.details } }; }",
    metadata: {
      generatedBy: "manual",
      version: "1.0.0",
      lastUpdated: "2025-01-15T10:30:00Z",
      executionContext: "frontend",
      signature: "async function process(incomingData, nodeData, params, targetMap, sourceMap)"
    },
    expectedInput: "any data",
    expectedOutput: "module metadata with data",
    parameters: {
      moduleCode: {
        type: "string",
        description: "Module code identifier",
        required: false,
        default: "",
        ui: { component: "input" }
      },
      duration: {
        type: "string", 
        description: "Module duration",
        required: false,
        default: "",
        ui: { component: "input" }
      }
    }
  },
  
  
  defaultDimensions: {
    width: 200,
    height: 200
  },}; 