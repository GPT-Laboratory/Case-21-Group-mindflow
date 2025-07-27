import { ParseError, ParseResult, ErrorRecoveryStrategy, SourceLocation } from '../types/ASTTypes';
import { useNotifications } from '../../Notifications/hooks/useNotifications';

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errorCount = 0;

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Create a parse error with unique ID
   */
  createParseError(
    type: ParseError['type'],
    message: string,
    options: {
      sourceLocation?: SourceLocation;
      severity?: ParseError['severity'];
      suggestion?: string;
      code?: string;
      functionName?: string;
      recoverable?: boolean;
    } = {}
  ): ParseError {
    return {
      id: `parse-error-${++this.errorCount}`,
      type,
      message,
      sourceLocation: options.sourceLocation,
      severity: options.severity || 'error',
      suggestion: options.suggestion,
      code: options.code,
      functionName: options.functionName,
      recoverable: options.recoverable || false
    };
  }

  /**
   * Handle Babel parsing errors with detailed location information
   */
  handleBabelError(error: any, code: string): ParseError {
    const message = error.message || 'Unknown parsing error';
    let sourceLocation: SourceLocation | undefined;
    let suggestion: string | undefined;

    // Extract location information from Babel error
    if (error.loc) {
      sourceLocation = {
        start: { line: error.loc.line, column: error.loc.column },
        end: { line: error.loc.line, column: error.loc.column + 1 }
      };
    }

    // Generate helpful suggestions based on error type
    if (message.includes('Unexpected token')) {
      suggestion = 'Check for missing semicolons, brackets, or quotes around this location.';
    } else if (message.includes('Unterminated')) {
      suggestion = 'Check for unclosed strings, comments, or brackets.';
    } else if (message.includes('Invalid left-hand side')) {
      suggestion = 'Check assignment syntax - you may be trying to assign to a non-variable.';
    } else if (message.includes('Duplicate parameter')) {
      suggestion = 'Remove duplicate parameter names in function declaration.';
    }

    // Extract problematic code snippet
    let codeSnippet: string | undefined;
    if (sourceLocation && code) {
      const lines = code.split('\n');
      const lineIndex = sourceLocation.start.line - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        codeSnippet = lines[lineIndex].trim();
      }
    }

    return this.createParseError('syntax', message, {
      sourceLocation,
      suggestion,
      code: codeSnippet,
      recoverable: this.isSyntaxErrorRecoverable(message)
    });
  }

  /**
   * Determine if a syntax error is recoverable
   */
  private isSyntaxErrorRecoverable(message: string): boolean {
    const recoverablePatterns = [
      'Unexpected token',
      'Missing semicolon',
      'Unterminated string',
      'Invalid or unexpected token'
    ];
    
    return recoverablePatterns.some(pattern => message.includes(pattern));
  }

  /**
   * Create recovery strategies for different error types
   */
  createRecoveryStrategies(error: ParseError, context: { code: string; functionName?: string }): ErrorRecoveryStrategy[] {
    const strategies: ErrorRecoveryStrategy[] = [];

    switch (error.type) {
      case 'syntax':
        if (error.recoverable) {
          strategies.push({
            type: 'skip_function',
            description: `Skip parsing the problematic function${error.functionName ? ` "${error.functionName}"` : ''} and continue with others`,
            apply: () => {
              // Implementation would skip the problematic function
              console.log(`Skipping function due to syntax error: ${error.message}`);
            }
          });

          strategies.push({
            type: 'use_fallback',
            description: 'Use basic function detection without full AST parsing',
            apply: () => {
              // Implementation would use regex-based function detection
              console.log('Using fallback parsing method');
            }
          });
        }
        break;

      case 'semantic':
        strategies.push({
          type: 'continue_parsing',
          description: 'Continue parsing and mark function with semantic issues',
          apply: () => {
            console.log('Continuing with semantic warnings');
          }
        });
        break;

      case 'dependency':
        strategies.push({
          type: 'continue_parsing',
          description: 'Continue parsing and mark external dependencies as unresolved',
          apply: () => {
            console.log('Marking dependencies as unresolved');
          }
        });
        break;
    }

    return strategies;
  }

  /**
   * Notify user about parsing errors using the notification system
   */
  notifyUser(errors: ParseError[], warnings: ParseError[], notificationHook?: ReturnType<typeof useNotifications>) {
    if (!notificationHook) return;

    // Group errors by severity and recoverability
    const criticalErrors = errors.filter(e => e.severity === 'error' && !e.recoverable);
    const recoverableErrors = errors.filter(e => e.severity === 'error' && e.recoverable);
    const allWarnings = [...warnings, ...errors.filter(e => e.severity === 'warning')];

    // Show critical errors as error toasts
    if (criticalErrors.length > 0) {
      const errorMessage = criticalErrors.length === 1 
        ? `${criticalErrors[0].message}${criticalErrors[0].suggestion ? ` Suggestion: ${criticalErrors[0].suggestion}` : ''}`
        : `${criticalErrors.length} parsing errors found. Check the console for details.`;

      notificationHook.showErrorToast(
        'Code Parsing Error',
        errorMessage
      );
    }

    // Show recoverable errors as warning toasts (only if no critical errors)
    if (recoverableErrors.length > 0 && criticalErrors.length === 0) {
      const warningMessage = recoverableErrors.length === 1
        ? `${recoverableErrors[0].message}${recoverableErrors[0].suggestion ? ` Suggestion: ${recoverableErrors[0].suggestion}` : ''}`
        : `${recoverableErrors.length} recoverable parsing issues found. Some functions may be skipped.`;

      notificationHook.showWarningToast(
        'Code Parsing Warning',
        warningMessage
      );
    }

    // Show warnings as info toasts (but limit to avoid spam)
    if (allWarnings.length > 0 && allWarnings.length <= 3) {
      allWarnings.forEach(warning => {
        notificationHook.showInfoToast(
          'Code Analysis Info',
          `${warning.message}${warning.suggestion ? ` Suggestion: ${warning.suggestion}` : ''}`
        );
      });
    } else if (allWarnings.length > 3) {
      notificationHook.showInfoToast(
        'Code Analysis Info',
        `${allWarnings.length} analysis warnings found. Check the console for details.`
      );
    }
  }

  /**
   * Format error for console logging with detailed information
   */
  formatErrorForConsole(error: ParseError, code?: string): string {
    let formatted = `[${error.severity.toUpperCase()}] ${error.type}: ${error.message}`;
    
    if (error.functionName) {
      formatted += `\n  Function: ${error.functionName}`;
    }
    
    if (error.sourceLocation) {
      formatted += `\n  Location: Line ${error.sourceLocation.start.line}, Column ${error.sourceLocation.start.column}`;
    }
    
    if (error.code) {
      formatted += `\n  Code: ${error.code}`;
    }
    
    if (error.suggestion) {
      formatted += `\n  Suggestion: ${error.suggestion}`;
    }

    // Add context lines if available
    if (error.sourceLocation && code) {
      const lines = code.split('\n');
      const lineIndex = error.sourceLocation.start.line - 1;
      const contextStart = Math.max(0, lineIndex - 2);
      const contextEnd = Math.min(lines.length, lineIndex + 3);
      
      formatted += '\n  Context:';
      for (let i = contextStart; i < contextEnd; i++) {
        const lineNum = i + 1;
        const isErrorLine = i === lineIndex;
        const prefix = isErrorLine ? '  > ' : '    ';
        formatted += `\n${prefix}${lineNum}: ${lines[i]}`;
        
        if (isErrorLine && error.sourceLocation.start.column > 0) {
          const pointer = ' '.repeat(error.sourceLocation.start.column + prefix.length + lineNum.toString().length + 2) + '^';
          formatted += `\n${pointer}`;
        }
      }
    }
    
    return formatted;
  }

  /**
   * Log all errors and warnings to console with detailed formatting
   */
  logErrors(errors: ParseError[], warnings: ParseError[], code?: string) {
    if (errors.length > 0) {
      console.group('🚨 AST Parsing Errors');
      errors.forEach(error => {
        console.error(this.formatErrorForConsole(error, code));
      });
      console.groupEnd();
    }

    if (warnings.length > 0) {
      console.group('⚠️ AST Parsing Warnings');
      warnings.forEach(warning => {
        console.warn(this.formatErrorForConsole(warning, code));
      });
      console.groupEnd();
    }
  }
}

export const errorHandlingService = ErrorHandlingService.getInstance();