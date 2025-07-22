import * as t from '@babel/types';
import { ExternalDependency } from '../types/ASTTypes';

export class DependencyExtractor {
  /**
   * Extract dependencies (imports, requires)
   */
  extractDependencies(ast: t.Node): ExternalDependency[] {
    const dependencies: ExternalDependency[] = [];

    const traverse = (node: t.Node) => {
      // ES6 imports
      if (t.isImportDeclaration(node)) {
        dependencies.push({
          name: node.source.value,
          type: 'import',
          source: node.source.value
        });
      }
      
      // CommonJS requires
      if (t.isCallExpression(node) && t.isIdentifier(node.callee) && node.callee.name === 'require') {
        if (node.arguments.length > 0 && t.isStringLiteral(node.arguments[0])) {
          dependencies.push({
            name: node.arguments[0].value,
            type: 'require',
            source: node.arguments[0].value
          });
        }
      }

      // Traverse child nodes
      this.traverseChildren(node, traverse);
    };

    // Start traversal from the program body
    if (ast && (ast as any).program && (ast as any).program.body) {
      (ast as any).program.body.forEach((node: t.Node) => traverse(node));
    }

    return dependencies;
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