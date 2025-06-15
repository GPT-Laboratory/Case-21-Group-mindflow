/** @format */
import { Database } from "lucide-react"; 
import ControlDropdown from "../Controls/Components/ControlDropdown";

// Import context hooks for managing nodes and edges
import { useEdgeContext } from "../Edge/store/useEdgeContext";
import { useNodeContext } from "../Node/store/useNodeContext";

// Import test data sets
import { childNodesData, parentNodesData } from "./default/nodesData";
import { edgesData } from "./default/edgeData";

// Import simple test data
import { initialSimpleNodes } from "./simpleBasic/nodesData";
import { initialSimpleEdges } from "./simpleBasic/edgeData";

// Import LMS example data
import { lmsNodesData } from "./lms/nodesData";
import { lmsEdgesData } from "./lms/edgeData";

// Import REST API example data
import { apiFlowNodesData, apiFlowEdgesData } from "./rest/apiFlowNodesEdges";

// Import generated flow example data
import { completeFlowExampleNodes, completeFlowExampleEdges } from "./generated/completeFlowExample";

/**
 * @description Switcher for loading different test data sets
 */
export const TestDataSwitcher = () => {
  const { setEdges } = useEdgeContext();
  const { setNodes } = useNodeContext();

  const switchToDataSet = (dataSet: string) => {
    switch (dataSet) {
      case "default":
        setNodes([...parentNodesData, ...childNodesData ]);
        setEdges(edgesData);
        break;
      case "simple":
        setNodes(initialSimpleNodes);
        setEdges(initialSimpleEdges);
        break;

      case "lms":
        setNodes(lmsNodesData.map((node) => ({
          ...node,
          style: {
            width: node.type === "conditionalnode" ? 100: 300,
            height: node.type === "conditionalnode" ? 100: 200,
          }
        })));
        setEdges([...lmsEdgesData])
        break;
      case "rest-api":
        setNodes(apiFlowNodesData.map((node) => ({
          ...node,
          style: {
            width: node.type === "restnode" ? 200 : 200,
            height: node.type === "restnode" ? 200 : 200,
          }
        })));
        setEdges(apiFlowEdgesData);
        break;
      case "generated-flow":
        setNodes(completeFlowExampleNodes);
        setEdges(completeFlowExampleEdges);
        break;
      case "empty":
        setNodes([]);
        setEdges([]);
        break;

      default:
        console.warn("Unknown test data set:", dataSet);
    }
  };

  const testDataItems = [
    {
      key: "empty",
      label: "Empty Flow (Test AI Generation)",
      onClick: () => switchToDataSet("empty")
    },
    {
      key: "simple",
      label: "Simple Example Data",
      onClick: () => switchToDataSet("simple")
    },
    {
      key: "default",
      label: "Default Example Data",
      onClick: () => switchToDataSet("default")
    },
    {
      key: "rest-api",
      label: "REST API Flow (Cell Process Example)",
      onClick: () => switchToDataSet("rest-api")
    },
    {
      key: "lms",
      label: "LMS Flow (Container Example)",
      onClick: () => switchToDataSet("lms")
    },
    {
      key: "generated-flow",
      label: "Generated Flow Example Data",
      onClick: () => switchToDataSet("generated-flow")
    },
  ];

  return (
    <ControlDropdown
      tooltip="Load Test Data"
      icon={<Database className="size-5" />}
      items={testDataItems}
    />
  );
};
