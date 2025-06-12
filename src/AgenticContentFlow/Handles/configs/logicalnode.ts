/** @format */
import { NodeHandleConfiguration } from '../../types/handleTypes';

export const logicalNodeConfig: NodeHandleConfiguration = {
  nodeType: 'logicalnode',
  category: 'logic',
  handles: [
    {
      position: 'left',
      type: 'target',
      dataFlow: 'data',
      acceptsFrom: ['integration', 'data'],
      icon: 'arrow-left',
      edgeType: 'package'
    },
    {
      position: 'right',
      type: 'source',
      dataFlow: 'data',
      connectsTo: ['view', 'logic'],
      icon: 'arrow-right',
      edgeType: 'package'
    },
  ]
};