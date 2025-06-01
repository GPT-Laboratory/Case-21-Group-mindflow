import { NodeHandleConfiguration } from "../../types/handleTypes";

export const logicalNodeConfig: NodeHandleConfiguration = {
  nodeType: 'logicalnode',
  category: 'logic',
  handles: [
    {
      position: 'left',
      type: 'target',
      dataFlow: 'data',
      acceptsFrom: ['data', 'integration', 'logic'],
      edgeType: "package",
      icon: 'arrow-right',
    },
    {
      position: 'right',
      type: 'source',
      dataFlow: 'data',
      connectsTo: ['data', 'logic', 'view'],
      edgeType: 'default',
        icon: 'arrow-right',
    }
  ]
};