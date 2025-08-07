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
    
    // Register ast-flownode (container for JavaScript modules)
    const astFlownodeConfig: FrameJSON = {
      nodeType: 'ast-flownode',
      defaultLabel: 'JavaScript Module',
      category: 'ast',
      group: 'container',
      description: 'Container node representing a JavaScript module or file',
      visual: {
        icon: {
          type: 'builtin',
          value: 'FileCode',
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
        category: 'container',
        definitions: [
          {
            position: 'top',
            type: 'source',
            dataFlow: 'dependency'
          },
          {
            position: 'bottom',
            type: 'target',
            dataFlow: 'dependency'
          }
        ]
      },
      defaultDimensions: {
        width: 300,
        height: 200
      }
    };
    
    // Register ast-functionnode (individual JavaScript functions)
    const astFunctionnodeConfig: FrameJSON = {
      nodeType: 'ast-functionnode',
      defaultLabel: 'JavaScript Function',
      category: 'ast',
      group: 'cell',
      description: 'Node representing a JavaScript function parsed from code',
      visual: {
        icon: {
          type: 'builtin',
          value: 'Code',
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
        category: 'logic',
        definitions: [
          {
            position: 'left',
            type: 'target',
            dataFlow: 'data'
          },
          {
            position: 'right',
            type: 'source',
            dataFlow: 'data'
          },
          {
            position: 'top',
            type: 'target',
            dataFlow: 'control'
          },
          {
            position: 'bottom',
            type: 'source',
            dataFlow: 'control'
          }
        ]
      },
      defaultDimensions: {
        width: 200,
        height: 150
      }
    };
    
    // Register ast-childnode (external dependencies and child functions)
    const astChildnodeConfig: FrameJSON = {
      nodeType: 'ast-childnode',
      defaultLabel: 'Child Function',
      category: 'ast',
      group: 'cell',
      description: 'Node representing a child function or external dependency',
      visual: {
        icon: {
          type: 'builtin',
          value: 'GitBranch',
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
        category: 'logic',
        definitions: [
          {
            position: 'left',
            type: 'target',
            dataFlow: 'data'
          },
          {
            position: 'right',
            type: 'source',
            dataFlow: 'data'
          }
        ]
      },
      defaultDimensions: {
        width: 180,
        height: 120
      }
    };
    
    // Add all configurations to the store
    store.addNodeType('ast-flownode', astFlownodeConfig);
    store.addNodeType('ast-functionnode', astFunctionnodeConfig);
    store.addNodeType('ast-childnode', astChildnodeConfig);
    
    console.log('✅ Registered AST node types: ast-flownode, ast-functionnode, ast-childnode');
  }
  
  /**
   * Check if AST node types are registered
   */
  static areASTNodeTypesRegistered(): boolean {
    const store = useUnifiedNodeTypeStore.getState();
    return store.hasNodeType('ast-flownode') && 
           store.hasNodeType('ast-functionnode') && 
           store.hasNodeType('ast-childnode');
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