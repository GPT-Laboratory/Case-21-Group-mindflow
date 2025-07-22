import * as t from '@babel/types';
import { FunctionMetadata, Parameter, ScopeLevel } from '../types/ASTTypes';
import { BabelParser } from '../parsers/BabelParser';
import { CommentExtractor } from './CommentExtractor';

export class FunctionExtractor {
  private babelParser: BabelParser;
  private commentExtractor: CommentExtractor;

  constructor(babelParser: BabelParser, commentExtractor: CommentExtractor) {
    this.babelParser = babelParser;
    this.commentExtractor = commentExtractor;
  }

  /**
   * Extract function definitions from AST
   */
  extractFunctions(ast: t.Node, sourceCode: string, comments: any[]): FunctionMetadata[] {
    const functions: FunctionMetadata[] = [];
    const functionStack: string[] = []; // Track nested function context

    const traverse = (node: t.Node, parent?: t.Node) => {
      if (t.isFunctionDeclaration(node) || t.isFunctionExpression(node) || t.isArrowFunctionExpression(node)) {
        const functionName = this.getFunctionName(node);
        const functionId = `${functionName}_${functions.length}`;
        
        // Get function description from preceding block comment
        const sourceLocation = this.babelParser.getSourceLocation(node);
        const description = this.commentExtractor.findFunctionDescription(comments, sourceLocation, functionName);
        
        // Extract parameters
        const parameters = this.extractParameters(node);
        
        // Extract function code
        const functionCode = this.babelParser.extractFunctionCode(node, sourceCode);
        
        const functionMetadata: FunctionMetadata = {
          id: functionId,
          name: functionName,
          description,
          parameters,
          sourceLocation,
          isNested: functionStack.length > 0,
          parentFunction: functionStack[functionStack.length - 1],
          scope: functionStack.length > 0 ? 'function' : 'global',
          code: functionCode
        };

        functions.push(functionMetadata);
        
        // Add to function stack for nested function detection
        functionStack.push(functionId);
      }

      // Traverse child nodes
      this.traverseChildren(node, traverse);

      // Remove from function stack when exiting function scope
      if (t.isFunctionDeclaration(node) || t.isFunctionExpression(node) || t.isArrowFunctionExpression(node)) {
        functionStack.pop();
      }
    };

    // Start traversal from the program body
    if (ast && (ast as any).program && (ast as any).program.body) {
      (ast as any).program.body.forEach((node: t.Node) => traverse(node));
    }

    return functions;
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
   * Extract parameters from function node
   */
  private extractParameters(node: t.Function): Parameter[] {
    return node.params.map(param => {
      if (t.isIdentifier(param)) {
        return {
          name: param.name,
          type: undefined,
          defaultValue: undefined
        };
      }
      if (t.isAssignmentPattern(param) && t.isIdentifier(param.left)) {
        return {
          name: param.left.name,
          type: undefined,
          defaultValue: this.getDefaultValue(param.right)
        };
      }
      return {
        name: 'unknown',
        type: undefined,
        defaultValue: undefined
      };
    });
  }

  /**
   * Get default value as string
   */
  private getDefaultValue(node: t.Expression): string {
    if (t.isStringLiteral(node)) return `"${node.value}"`;
    if (t.isNumericLiteral(node)) return node.value.toString();
    if (t.isBooleanLiteral(node)) return node.value.toString();
    if (t.isNullLiteral(node)) return 'null';
    return 'undefined';
  }

  /**
   * Traverse child nodes of an AST node
   */
  private traverseChildren(node: t.Node, callback: (node: t.Node, parent?: t.Node) => void) {
    for (const key in node) {
      const child = (node as any)[key];
      if (Array.isArray(child)) {
        child.forEach(item => {
          if (item && typeof item === 'object' && item.type) {
            callback(item, node);
          }
        });
      } else if (child && typeof child === 'object' && child.type) {
        callback(child, node);
      }
    }
  }
}