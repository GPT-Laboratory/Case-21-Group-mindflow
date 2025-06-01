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
        acceptsFrom: ['data'],
        icon: 'arrow-right',
        edgeType: 'package'
      },
      {
        position: 'right',
        type: 'source',
        dataFlow: 'analytics',
        connectsTo: ['statistics'],
        icon: 'arrow-right',
        edgeType: 'default'
      }
  ]
};