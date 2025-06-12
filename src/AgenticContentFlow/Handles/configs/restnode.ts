/** @format */
import { NodeHandleConfiguration } from '../../types/handleTypes';

export const restNodeConfig: NodeHandleConfiguration = {
  nodeType: 'restnode',
  category: 'integration',
  handles: [
    {
      position: 'right',
      type: 'source',
      dataFlow: 'data',
      connectsTo: ['logic', 'view'],
      icon: 'arrow-right',
      edgeType: 'package'
    },
    {
      position: 'left',
      type: 'target',
      dataFlow: 'control',
      acceptsFrom: ['data', 'logic'],
      icon: 'arrow-left',
      edgeType: 'default'
    }
  ]
};