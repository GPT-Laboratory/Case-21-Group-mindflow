/** @format */
import { NodeHandleConfiguration } from '../../types/handleTypes';

export const contentNodeConfig: NodeHandleConfiguration = {
  nodeType: 'contentnode',
  category: 'view',
  handles: [
    {
      position: 'left',
      type: 'target',
      dataFlow: 'data',
      acceptsFrom: ['logic', 'integration', 'data'],
      icon: 'arrow-left',
      edgeType: 'package'
    },
    {
      position: 'right',
      type: 'source',
      dataFlow: 'data',
      connectsTo: ['integration', 'data'],
      icon: 'arrow-right',
      edgeType: 'package'
    },
  ]
};