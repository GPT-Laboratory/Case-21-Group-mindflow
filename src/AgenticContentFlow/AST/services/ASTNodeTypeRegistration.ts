/** @format */

import { FrameJSON } from '../../Node/factory/types/FrameJSON';
import { useUnifiedNodeTypeStore } from '../../Node/store/useNodeTypeStore';

/**
 * AST Node Type Registration Service
 * 
 * Registers node types specific to AST parsing and JavaScript file imports.
 * These node types are used when importing JavaScript files and creating flows from code.
 */
export class ASTNodeTypeRegistration {
  
  /**
   * Register all AST-specific node types
   */
  static registerASTNodeTypes(): void {
    const store = useUnifiedNodeTypeStore.getState();
    
    // Register flownode (container for JavaScript modules)
    const flownodeConfig: FrameJSON = {
      nodeType: 'flownode',
      defaultLabel: 'JavaScript Module',
      category: 'ast',
      group: 'container',
      description: 'Container node representing a JavaScript module or file',
      visual: {
        icon: {
          type: 'lucide',
          name: 'FileCode',
          className: 'w-6 h-6'
        },
        style: {
          borderStyle: 'solid',
          shadowStyle: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        },
        selectedColor: '#3b82f6',
        headerGradient: 'bg-gradient-to-r from-blue-50 to-indigo-50'
      },
      handles: {
        definitions: [
          {
            id: 'top',
            position: 'top',
            type: 'source'
          },
          {
            id: 'bottom',
            position: 'bottom',
            type: 'target'
          }
        ]
      },
      defaultDimensions: {
        width: 300,
        height: 400
      }
    };
    
    // Register functionnode (individual JavaScript functions)
    const functionnodeConfig: FrameJSON = {
      nodeType: 'functionnode',
      defaultLabel: 'JavaScript Function',
      category: 'ast',
      group: 'cell',
      description: 'Node representing a JavaScript function parsed from code',
      visual: {
        icon: {
          type: 'lucide',
          name: 'Code',
          className: 'w-6 h-6'
        },
        style: {
          borderStyle: 'solid',
          shadowStyle: '0 2px 4px -1px rgba(0, 0, 0, 0.1)'
        },
        selectedColor: '#10b981',
        headerGradient: 'bg-gradient-to-r from-green-50 to-emerald-50'
      },
      handles: {
        definitions: [
          {
            id: 'left',
            position: 'left',
            type: 'target'
          },
          {
            id: 'right',
            position: 'right',
            type: 'source'
          },
          {
            id: 'top',
            position: 'top',
            type: 'target'
          },
          {
            id: 'bottom',
            position: 'bottom',
            type: 'source'
          }
        ]
      },
      defaultDimensions: {
        width: 200,
        height: 150
      }
    };
    
    // Register childnode (external dependencies and child functions)
    const childnodeConfig: FrameJSON = {
      nodeType: 'childnode',
      defaultLabel: 'Child Function',
      category: 'ast',
      group: 'cell',
      description: 'Node representing a child function or external dependency',
      visual: {
        icon: {
          type: 'lucide',
          name: 'GitBranch',
          className: 'w-6 h-6'
        },
        style: {
          borderStyle: 'dashed',
          shadowStyle: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        },
        selectedColor: '#8b5cf6',
        headerGradient: 'bg-gradient-to-r from-purple-50 to-violet-50'
      },
      handles: {
        definitions: [
          {
            id: 'left',
            position: 'left',
            type: 'target'
          },
          {
            id: 'right',
            position: 'right',
            type: 'source'
          }
        ]
      },
      defaultDimensions: {
        width: 180,
        height: 120
      }
    };
    
    // Add all configurations to the store
    store.addNodeType('flownode', flownodeConfig);
    store.addNodeType('functionnode', functionnodeConfig);
    store.addNodeType('childnode', childnodeConfig);
    
    console.log('✅ Registered AST node types: flownode, functionnode, childnode');
  }
  
  /**
   * Check if AST node types are registered
   */
  static areASTNodeTypesRegistered(): boolean {
    const store = useUnifiedNodeTypeStore.getState();
    return store.hasNodeType('flownode') && 
           store.hasNodeType('functionnode') && 
           store.hasNodeType('childnode');
  }
  
  /**
   * Initialize AST node types if not already registered
   */
  static initializeASTNodeTypes(): void {
    if (!this.areASTNodeTypesRegistered()) {
      this.registerASTNodeTypes();
    }
  }
}

// Auto-register AST node types when this module is imported
ASTNodeTypeRegistration.initializeASTNodeTypes();

export default ASTNodeTypeRegistration;