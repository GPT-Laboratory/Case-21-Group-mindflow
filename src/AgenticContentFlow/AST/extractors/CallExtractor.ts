import * as t from '@babel/types';
import { FunctionCall } from '../types/ASTTypes';
import { BabelParser } from '../parsers/BabelParser';

export class CallExtractor {
  private babelParser: BabelParser;

  constructor(babelParser: BabelParser) {
    this.babelParser = babelParser;
  }

  /**
   * Identify function calls within the AST
   */
  identifyFunctionCalls(ast: t.Node): FunctionCall[] {
    const calls: FunctionCall[] = [];
    let currentFunction = '';

    const traverse = (node: t.Node) => {
      // Track current function context
      if (t.isFunctionDeclaration(node) || t.isFunctionExpression(node) || t.isArrowFunctionExpression(node)) {
        const previousFunction = currentFunction;
        currentFunction = this.getFunctionName(node);
        
        // Traverse function body
        this.traverseChildren(node, traverse);
        
        currentFunction = previousFunction;
        return;
      }

      // Identify function calls
      if (t.isCallExpression(node)) {
        const calledFunction = this.getCalledFunctionName(node);
        if (calledFunction && currentFunction) {
          calls.push({
            id: `${currentFunction}_calls_${calledFunction}_${calls.length}`,
            callerFunction: currentFunction,
            calledFunction,
            sourceLocation: this.babelParser.getSourceLocation(node),
            isExternal: false // Will be determined later based on available functions
          });
        }
      }

      // Continue traversing
      this.traverseChildren(node, traverse);
    };

    // Start traversal from the program body
    if (ast && (ast as any).program && (ast as any).program.body) {
      (ast as any).program.body.forEach((node: t.Node) => traverse(node));
    }

    return calls;
  }

  /**
   * Get function name from different function types
   */
  private getFunctionName(node: t.Function): string {
    if (t.isFunctionDeclaration(node) && node.id) {
      return node.id.name;
    }
    if (t.isFunctionExpression(node) && node.id) {
      return node.id.name;
    }
    return 'anonymous';
  }

  /**
   * Get called function name from call expression
   */
  private getCalledFunctionName(node: t.CallExpression): string | null {
    if (t.isIdentifier(node.callee)) {
      return node.callee.name;
    }
    if (t.isMemberExpression(node.callee) && t.isIdentifier(node.callee.property)) {
      return node.callee.property.name;
    }
    return null;
  }

  /**
   * Traverse child nodes of an AST node
   */
  private traverseChildren(node: t.Node, callback: (node: t.Node) => void) {
    for (const key in node) {
      const child = (node as any)[key];
      if (Array.isArray(child)) {
        child.forEach(item => {
          if (item && typeof item === 'object' && item.type) {
            callback(item);
          }
        });
      } else if (child && typeof child === 'object' && child.type) {
        callback(child);
      }
    }
  }
}