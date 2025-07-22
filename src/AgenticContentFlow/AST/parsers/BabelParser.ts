import * as Babel from '@babel/standalone';
import * as t from '@babel/types';

export class BabelParser {
  /**
   * Parse JavaScript code using Babel and return AST
   */
  parse(code: string): any {
    try {
      const result = Babel.transform(code, {
        sourceType: 'module',
        parserOpts: {
          allowImportExportEverywhere: true,
          allowReturnOutsideFunction: true,
          plugins: [
            'jsx',
            'typescript',
            'decorators-legacy',
            'classProperties',
            'objectRestSpread',
            'functionBind',
            'exportDefaultFrom',
            'exportNamespaceFrom',
            'dynamicImport',
            'nullishCoalescingOperator',
            'optionalChaining'
          ],
          attachComments: true
        },
        ast: true,
        code: false
      });
      
      return result.ast;
    } catch (error) {
      throw new Error(`Failed to parse JavaScript code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get source location from AST node
   */
  getSourceLocation(node: t.Node): { start: { line: number; column: number }; end: { line: number; column: number } } {
    return {
      start: { 
        line: node.loc?.start.line || 0, 
        column: node.loc?.start.column || 0 
      },
      end: { 
        line: node.loc?.end.line || 0, 
        column: node.loc?.end.column || 0 
      }
    };
  }

  /**
   * Extract function code from source
   */
  extractFunctionCode(node: t.Function, sourceCode: string): string {
    const location = this.getSourceLocation(node);
    const lines = sourceCode.split('\n');
    
    if (location.start.line === location.end.line) {
      // Single line function
      const line = lines[location.start.line - 1];
      return line.substring(location.start.column, location.end.column);
    } else {
      // Multi-line function
      const startLine = lines[location.start.line - 1].substring(location.start.column);
      const endLine = lines[location.end.line - 1].substring(0, location.end.column);
      const middleLines = lines.slice(location.start.line, location.end.line - 1);
      
      return [startLine, ...middleLines, endLine].join('\n');
    }
  }
}