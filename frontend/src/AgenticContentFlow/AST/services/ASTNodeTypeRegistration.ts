/** @format */

import { FrameJSON } from '../../Node/factory/types/FrameJSON';
import { useUnifiedNodeTypeStore } from '../../Node/store/useNodeTypeStore';

/**
 * Mindmap Node Type Registration Service
 *
 * Registers the two core node types for mindmap exercises:
 * - Topic Node (cell): A child node representing a topic with content
 * - Group Node (container): A container that can hold other nodes
 */
export class ASTNodeTypeRegistration {

  /**
   * Register mindmap-specific node types
   */
  static registerASTNodeTypes(): void {
    const store = useUnifiedNodeTypeStore.getState();

    // Clear any stale node types from localStorage
    store.clearAllNodeTypes();

    // Register Topic Node (mindmap child node)
    const topicNodeConfig: FrameJSON = {
      nodeType: 'topicnode',
      defaultLabel: 'Topic',
      category: 'mindmap',
      group: 'cell',
      description: 'A mindmap topic node showing a subject and its details',
      visual: {
        style: {
          borderStyle: 'solid',
          shadowStyle: '0 2px 4px -1px rgba(0, 0, 0, 0.1)'
        },
        selectedColor: '#6366f1',
        headerGradient: 'bg-gradient-to-r from-indigo-50 to-purple-50'
      },
      handles: {
        category: 'data',
        definitions: [
          {
            position: 'top',
            type: 'target',
            dataFlow: 'data'
          },
          {
            position: 'bottom',
            type: 'source',
            dataFlow: 'data'
          }
        ]
      },
      defaultDimensions: {
        width: 200,
        height: 60
      }
    };

    // Register Group Node (container for grouping topics)
    const groupNodeConfig: FrameJSON = {
      nodeType: 'groupnode',
      defaultLabel: 'Group',
      category: 'mindmap',
      group: 'container',
      description: 'A container node that groups related topics together',
      visual: {
        icon: {
          type: 'builtin',
          value: 'FolderOpen',
          className: 'w-6 h-6'
        },
        style: {
          borderStyle: 'dashed',
          shadowStyle: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        },
        selectedColor: '#f59e0b',
        headerGradient: 'bg-gradient-to-r from-amber-50 to-yellow-50'
      },
      handles: {
        category: 'container',
        definitions: [
          {
            position: 'top',
            type: 'target',
            dataFlow: 'data'
          },
          {
            position: 'bottom',
            type: 'source',
            dataFlow: 'data'
          }
        ]
      },
      defaultDimensions: {
        width: 300,
        height: 200
      }
    };

    store.addNodeType('topicnode', topicNodeConfig);
    store.addNodeType('groupnode', groupNodeConfig);

    console.log('✅ Mindmap node types registered: topicnode, groupnode');
  }

  static initializeASTNodeTypes(): void {
    ASTNodeTypeRegistration.registerASTNodeTypes();
  }
}

export default ASTNodeTypeRegistration;
