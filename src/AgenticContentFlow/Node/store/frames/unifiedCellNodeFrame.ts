import { UnifiedFrameJSON } from '../../factory//types/UnifiedFrameJSON';

export const unifiedCellNodeFrame: UnifiedFrameJSON = {
  nodeType: "cellnode",
  defaultLabel: "Topic",
  category: "view",
  group: "cell",
  description: "A topic cell that can contain content",
  
  visual: {
    icon: { type: "builtin", value: "FileText" },
    style: {
      borderStyle: "solid",
      shadowStyle: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      customStyles: {}
    }
  },
  
  handles: {
    category: "view",
    definitions: [
      {
        position: "bottom",
        type: "source",
        dataFlow: "control",
        connectsTo: ["view", "container"],
        icon: "arrow-down",
        edgeType: "package"
      },
      {
        position: "top",
        type: "target",
        dataFlow: "control",
        acceptsFrom: ["container", "view"],
        icon: "arrow-down",
        edgeType: "package"
      }
    ]
  },
  
  process: {
    templateCode: "async function process(incomingData, nodeData, params, targetMap, sourceMap) { console.log('📄 CellNode processing:', { incomingData, nodeData }); return { data: incomingData, metadata: { type: 'topic', title: nodeData.label, description: nodeData.details } }; }",
    metadata: {
      generatedBy: "manual",
      version: "1.0.0",
      lastUpdated: "2025-01-15T10:30:00Z",
      executionContext: "frontend",
      signature: "async function process(incomingData, nodeData, params, targetMap, sourceMap)"
    },
    expectedInput: "any data",
    expectedOutput: "topic metadata with data",
    parameters: {
      topicCode: {
        type: "string",
        description: "Topic code identifier",
        required: false,
        default: "",
        ui: { component: "input" }
      },
      difficulty: {
        type: "string", 
        description: "Topic difficulty level",
        required: false,
        default: "beginner",
        ui: { component: "select" }
      }
    }
  },
  
  defaultDimensions: { width: 200, height: 150 }
}; 