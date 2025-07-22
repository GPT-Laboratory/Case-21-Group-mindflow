import * as t from '@babel/types';
import { VariableDeclaration, ScopeLevel } from '../types/ASTTypes';
import { BabelParser } from '../parsers/BabelParser';

export class VariableExtractor {
  private babelParser: BabelParser;

  constructor(babelParser: BabelParser) {
    this.babelParser = babelParser;
  }

  /**
   * Extract variable declarations
   */
  extractVariables(ast: t.Node): VariableDeclaration[] {
    const variables: VariableDeclaration[] = [];

    const traverse = (node: t.Node, scope: ScopeLevel = 'global') => {
      if (t.isVariableDeclaration(node)) {
        node.declarations.forEach(declarator => {
          if (t.isIdentifier(declarator.id)) {
            variables.push({
              name: declarator.id.name,
              type: node.kind as 'var' | 'let' | 'const',
              sourceLocation: this.babelParser.getSourceLocation(node),
              scope
            });
          }
        });
      }

      // Update scope for function contexts
      const newScope = (t.isFunctionDeclaration(node) || t.isFunctionExpression(node) || t.isArrowFunctionExpression(node)) 
        ? 'function' as ScopeLevel 
        : scope;

      // Traverse child nodes
      this.traverseChildren(node, (child) => traverse(child, newScope));
    };

    // Start traversal from the program body
    if (ast && (ast as any).program && (ast as any).program.body) {
      (ast as any).program.body.forEach((node: t.Node) => traverse(node));
    }

    return variables;
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