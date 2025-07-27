import * as Babel from '@babel/standalone';
import * as t from '@babel/types';
import { ParseError, ParseResult } from '../types/ASTTypes';
import { errorHandlingService } from '../services/ErrorHandlingService';

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
   * Parse JavaScript code with enhanced error handling and recovery
   */
  parseWithErrorHandling(code: string): ParseResult {
    const errors: ParseError[] = [];
    const warnings: ParseError[] = [];
    
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
      
      return {
        success: true,
        structure: undefined, // Will be filled by ASTParserService
        errors,
        warnings,
        partiallyParsed: false
      };
    } catch (error) {
      const parseError = errorHandlingService.handleBabelError(error, code);
      errors.push(parseError);

      // Try fallback parsing strategies
      const fallbackResult = this.attemptFallbackParsing(code, error);
      
      return {
        success: fallbackResult.success,
        structure: undefined, // Will be filled by ASTParserService if fallback succeeds
        errors,
        warnings,
        partiallyParsed: fallbackResult.success
      };
    }
  }

  /**
   * Attempt fallback parsing strategies when main parsing fails
   */
  private attemptFallbackParsing(code: string, originalError: any): { success: boolean; ast?: any } {
    // Strategy 1: Try parsing as script instead of module
    try {
      const result = Babel.transform(code, {
        sourceType: 'script',
        parserOpts: {
          allowReturnOutsideFunction: true,
          plugins: ['jsx', 'typescript'],
          attachComments: true,
          errorRecovery: true
        },
        ast: true,
        code: false
      });
      
      return { success: true, ast: result.ast };
    } catch (scriptError) {
      // Strategy 2: Try with minimal plugins
      try {
        const result = Babel.transform(code, {
          sourceType: 'module',
          parserOpts: {
            allowImportExportEverywhere: true,
            attachComments: true,
            errorRecovery: true
          },
          ast: true,
          code: false
        });
        
        return { success: true, ast: result.ast };
      } catch (minimalError) {
        // Strategy 3: Try to extract individual functions using regex
        return this.extractFunctionsWithRegex(code);
      }
    }
  }

  /**
   * Fallback function extraction using regex when AST parsing fails
   */
  private extractFunctionsWithRegex(code: string): { success: boolean; ast?: any } {
    try {
      // This is a very basic fallback - in a real implementation,
      // you might want to create a minimal AST-like structure
      const functionMatches = code.match(/function\s+(\w+)\s*\([^)]*\)\s*\{/g);
      const arrowFunctionMatches = code.match(/(?:const|let|var)\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g);
      
      if (functionMatches || arrowFunctionMatches) {
        // Create a minimal AST-like structure for the functions found
        // This would need to be expanded for full functionality
        return { 
          success: true, 
          ast: {
            type: 'Program',
            body: [],
            comments: [],
            // Mark as fallback parsed
            _fallbackParsed: true
          }
        };
      }
      
      return { success: false };
    } catch (regexError) {
      return { success: false };
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