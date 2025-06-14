/** @format */
import { NodeHandleConfiguration } from '../../types/handleTypes';

export const conditionalNodeConfig: NodeHandleConfiguration = {
  nodeType: 'conditionalnode',
  category: 'logic',
  handles: [
    {
      position: 'top',
      type: 'target',
      dataFlow: 'control',
      acceptsFrom: ['view', 'logic', 'container', 'integration'],
      icon: 'arrow-down',
      edgeType: 'default'
    },
    {
      position: 'bottom',
      type: 'source',
      dataFlow: 'control',
      connectsTo: ['logic', 'container', 'page', 'view'],
      icon: 'arrow-down',
      edgeType: 'default'
      // Note: Handle labels will be added in future UI enhancement
    },
    {
      position: 'right',
      type: 'source',
      dataFlow: 'control',
      connectsTo: ['logic', 'container', 'page', 'view'],
      icon: 'arrow-right',
      edgeType: 'default'
      // Note: Handle labels will be added in future UI enhancement
    }
  ]
};