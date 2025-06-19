import { UnifiedFrameJSON } from '../../factory//types/UnifiedFrameJSON';

export const unifiedCourseNodeFrame: UnifiedFrameJSON = {
  nodeType: "coursenode",
  defaultLabel: "Course",
  category: "container",
  group: "container",
  description: "A course container that can hold multiple modules",
  
  visual: {
    icon: { type: "builtin", value: "BookOpen" },
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
    templateCode: "async function process(incomingData, nodeData, params, targetMap, sourceMap) { console.log('📚 CourseNode processing:', { incomingData, nodeData }); return { data: incomingData, metadata: { type: 'course', title: nodeData.label, description: nodeData.details } }; }",
    metadata: {
      generatedBy: "manual",
      version: "1.0.0",
      lastUpdated: "2025-01-15T10:30:00Z",
      executionContext: "frontend",
      signature: "async function process(incomingData, nodeData, params, targetMap, sourceMap)"
    },
    expectedInput: "any data",
    expectedOutput: "course metadata with data",
    parameters: {
      courseCode: {
        type: "string",
        description: "Course code identifier",
        required: false,
        default: "",
        ui: { component: "input" }
      },
      instructor: {
        type: "string", 
        description: "Course instructor name",
        required: false,
        default: "",
        ui: { component: "input" }
      }
    }
  },
  
  
  defaultDimensions: {
    width: 200,
    height: 200
  },
}; 