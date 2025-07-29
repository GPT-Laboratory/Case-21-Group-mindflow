import * as t from '@babel/types';

/**
 * Shared utility class for common node operations and type checking
 * Eliminates code duplication across extractors
 */
export class NodeUtils {
  /**
   * Check if an object is a valid AST node
   */
  static isValidNode(obj: any): obj is t.Node {
    return !!(obj && typeof obj === 'object' && typeof obj.type === 'string');
  }

  /**
   * Check if a node is any type of function
   */
  static isFunctionNode(node: t.Node): boolean {
    return t.isFunctionDeclaration(node) || 
           t.isFunctionExpression(node) || 
           t.isArrowFunctionExpression(node);
  }

  /**
   * Check if a node is a method definition
   */
  static isMethodDefinition(node: t.Node): boolean {
    return t.isClassMethod(node) || t.isObjectMethod(node);
  }

  /**
   * Check if a node is a variable declaration
   */
  static isVariableDeclaration(node: t.Node): boolean {
    return t.isVariableDeclaration(node);
  }

  /**
   * Check if a node is a call expression
   */
  static isCallExpression(node: t.Node): boolean {
    return t.isCallExpression(node);
  }

  /**
   * Check if a node is an import declaration
   */
  static isImportDeclaration(node: t.Node): boolean {
    return t.isImportDeclaration(node);
  }

  /**
   * Get function name from different function types
   */
  static getFunctionName(node: t.Function): string {
    if (t.isFunctionDeclaration(node) && node.id) {
      return node.id.name;
    }
    if (t.isFunctionExpression(node) && node.id) {
      return node.id.name;
    }
    if (t.isArrowFunctionExpression(node)) {
      return 'anonymous';
    }
    return 'anonymous';
  }

  /**
   * Get method name from method definition
   */
  static getMethodName(node: t.ClassMethod | t.ObjectMethod): string {
    if (t.isIdentifier(node.key)) {
      return node.key.name;
    }
    if (t.isStringLiteral(node.key)) {
      return node.key.value;
    }
    return 'unknown';
  }

  /**
   * Get called function name from call expression
   */
  static getCalledFunctionName(node: t.CallExpression): string | null {
    if (t.isIdentifier(node.callee)) {
      return node.callee.name;
    }
    if (t.isMemberExpression(node.callee) && t.isIdentifier(node.callee.property)) {
      return node.callee.property.name;
    }
    return null;
  }

  /**
   * Get variable name from variable declarator
   */
  static getVariableName(declarator: t.VariableDeclarator): string {
    if (t.isIdentifier(declarator.id)) {
      return declarator.id.name;
    }
    return 'unknown';
  }

  /**
   * Check if a node has a specific property that should be traversed
   */
  static shouldTraverseProperty(key: string): boolean {
    // Skip properties that don't contain child nodes or are metadata
    const skipProperties = [
      'parent', 
      'leadingComments', 
      'trailingComments', 
      'innerComments',
      'loc', 
      'start', 
      'end',
      'range',
      'raw',
      'value' // Skip primitive values
    ];
    return !skipProperties.includes(key);
  }

  /**
   * Get all child nodes from a parent node
   */
  static getChildNodes(node: t.Node): t.Node[] {
    const children: t.Node[] = [];
    
    for (const key in node) {
      if (!this.shouldTraverseProperty(key)) continue;
      
      const child = (node as any)[key];
      if (Array.isArray(child)) {
        child.forEach(item => {
          if (this.isValidNode(item)) {
            children.push(item);
          }
        });
      } else if (this.isValidNode(child)) {
        children.push(child);
      }
    }
    
    return children;
  }

  /**
   * Check if a node is within a function scope
   */
  static isInFunctionScope(_node: t.Node, functionStack: string[]): boolean {
    return functionStack.length > 0;
  }

  /**
   * Generate a unique identifier for a node
   */
  static generateNodeId(node: t.Node, prefix: string, index: number): string {
    const nodeType = node.type.toLowerCase();
    return `${prefix}_${nodeType}_${index}`;
  }

  /**
   * Check if a node represents an external dependency
   */
  static isExternalDependency(node: t.Node): boolean {
    return t.isImportDeclaration(node) || 
           (t.isCallExpression(node) && 
            t.isIdentifier(node.callee) && 
            node.callee.name === 'require');
  }

  /**
   * Get the scope level based on node type and context
   */
  static getScopeLevel(node: t.Node, functionStack: string[]): 'global' | 'function' | 'block' {
    if (functionStack.length > 0) {
      return 'function';
    }
    if (t.isBlockStatement(node)) {
      return 'block';
    }
    return 'global';
  }
}