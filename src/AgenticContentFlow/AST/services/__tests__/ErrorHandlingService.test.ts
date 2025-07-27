import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { errorHandlingService } from '../ErrorHandlingService';
import { ParseError } from '../../types/ASTTypes';

// Mock the notifications hook
const mockNotifications = {
  showErrorToast: vi.fn(),
  showWarningToast: vi.fn(),
  showInfoToast: vi.fn(),
  showSuccessToast: vi.fn(),
  showToast: vi.fn(),
  showBlockingNotification: vi.fn(),
  updateBlockingNotification: vi.fn(),
  completeBlockingNotification: vi.fn(),
  failBlockingNotification: vi.fn(),
  removeNotification: vi.fn(),
  clearAllNotifications: vi.fn(),
  clearToasts: vi.fn(),
  hasBlockingNotifications: false,
  blockingNotifications: [],
  toastNotifications: []
};

describe('ErrorHandlingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createParseError', () => {
    it('should create a parse error with unique ID', () => {
      const error1 = errorHandlingService.createParseError('syntax', 'Test error 1');
      const error2 = errorHandlingService.createParseError('syntax', 'Test error 2');

      expect(error1.id).toBeDefined();
      expect(error2.id).toBeDefined();
      expect(error1.id).not.toBe(error2.id);
      expect(error1.type).toBe('syntax');
      expect(error1.message).toBe('Test error 1');
      expect(error1.severity).toBe('error'); // default
      expect(error1.recoverable).toBe(false); // default
    });

    it('should create error with custom options', () => {
      const sourceLocation = {
        start: { line: 5, column: 10 },
        end: { line: 5, column: 20 }
      };

      const error = errorHandlingService.createParseError('semantic', 'Custom error', {
        sourceLocation,
        severity: 'warning',
        suggestion: 'Try this fix',
        code: 'function test()',
        functionName: 'testFunction',
        recoverable: true
      });

      expect(error.sourceLocation).toEqual(sourceLocation);
      expect(error.severity).toBe('warning');
      expect(error.suggestion).toBe('Try this fix');
      expect(error.code).toBe('function test()');
      expect(error.functionName).toBe('testFunction');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('handleBabelError', () => {
    it('should handle Babel error with location information', () => {
      const babelError = {
        message: 'Unexpected token',
        loc: { line: 2, column: 10 }
      };

      const code = 'function test() {\n  const x = ;\n  return x;\n}';
      const parseError = errorHandlingService.handleBabelError(babelError, code);

      expect(parseError.type).toBe('syntax');
      expect(parseError.message).toBe('Unexpected token');
      expect(parseError.sourceLocation).toEqual({
        start: { line: 2, column: 10 },
        end: { line: 2, column: 11 }
      });
      expect(parseError.suggestion).toContain('semicolons, brackets, or quotes');
      expect(parseError.code).toBe('const x = ;');
    });

    it('should provide appropriate suggestions for different error types', () => {
      const testCases = [
        {
          message: 'Unexpected token',
          expectedSuggestion: 'Check for missing semicolons, brackets, or quotes around this location.'
        },
        {
          message: 'Unterminated string literal',
          expectedSuggestion: 'Check for unclosed strings, comments, or brackets.'
        },
        {
          message: 'Invalid left-hand side in assignment',
          expectedSuggestion: 'Check assignment syntax - you may be trying to assign to a non-variable.'
        },
        {
          message: 'Duplicate parameter name',
          expectedSuggestion: 'Remove duplicate parameter names in function declaration.'
        }
      ];

      testCases.forEach(({ message, expectedSuggestion }) => {
        const error = errorHandlingService.handleBabelError({ message }, '');
        expect(error.suggestion).toBe(expectedSuggestion);
      });
    });

    it('should determine recoverability correctly', () => {
      const recoverableErrors = [
        'Unexpected token',
        'Missing semicolon',
        'Unterminated string',
        'Invalid or unexpected token'
      ];

      const nonRecoverableErrors = [
        'Critical parsing failure',
        'Memory allocation error'
      ];

      recoverableErrors.forEach(message => {
        const error = errorHandlingService.handleBabelError({ message }, '');
        expect(error.recoverable).toBe(true);
      });

      nonRecoverableErrors.forEach(message => {
        const error = errorHandlingService.handleBabelError({ message }, '');
        expect(error.recoverable).toBe(false);
      });
    });
  });

  describe('createRecoveryStrategies', () => {
    it('should create recovery strategies for syntax errors', () => {
      const syntaxError: ParseError = {
        id: 'test-1',
        type: 'syntax',
        message: 'Unexpected token',
        severity: 'error',
        recoverable: true
      };

      const strategies = errorHandlingService.createRecoveryStrategies(syntaxError, {
        code: 'function test() { const x = ; }',
        functionName: 'test'
      });

      expect(strategies).toHaveLength(2);
      expect(strategies[0].type).toBe('skip_function');
      expect(strategies[0].description).toContain('Skip parsing the problematic function');
      expect(strategies[1].type).toBe('use_fallback');
      expect(strategies[1].description).toContain('Use basic function detection');
    });

    it('should create recovery strategies for semantic errors', () => {
      const semanticError: ParseError = {
        id: 'test-2',
        type: 'semantic',
        message: 'Invalid scope reference',
        severity: 'error',
        recoverable: true
      };

      const strategies = errorHandlingService.createRecoveryStrategies(semanticError, {
        code: 'function test() { return undefinedVar; }'
      });

      expect(strategies).toHaveLength(1);
      expect(strategies[0].type).toBe('continue_parsing');
      expect(strategies[0].description).toContain('Continue parsing and mark function with semantic issues');
    });

    it('should create recovery strategies for dependency errors', () => {
      const dependencyError: ParseError = {
        id: 'test-3',
        type: 'dependency',
        message: 'Cannot resolve external dependency',
        severity: 'warning',
        recoverable: true
      };

      const strategies = errorHandlingService.createRecoveryStrategies(dependencyError, {
        code: 'import { unknown } from "missing-package";'
      });

      expect(strategies).toHaveLength(1);
      expect(strategies[0].type).toBe('continue_parsing');
      expect(strategies[0].description).toContain('Continue parsing and mark external dependencies as unresolved');
    });
  });

  describe('notifyUser', () => {
    it('should show error toast for critical errors', () => {
      const errors: ParseError[] = [{
        id: 'error-1',
        type: 'syntax',
        message: 'Critical syntax error',
        severity: 'error',
        recoverable: false
      }];

      errorHandlingService.notifyUser(errors, [], mockNotifications);

      expect(mockNotifications.showErrorToast).toHaveBeenCalledWith(
        'Code Parsing Error',
        'Critical syntax error'
      );
    });

    it('should show warning toast for recoverable errors', () => {
      const errors: ParseError[] = [{
        id: 'error-1',
        type: 'syntax',
        message: 'Recoverable syntax error',
        severity: 'error',
        suggestion: 'Try adding semicolon',
        recoverable: true
      }];

      errorHandlingService.notifyUser(errors, [], mockNotifications);

      expect(mockNotifications.showWarningToast).toHaveBeenCalledWith(
        'Code Parsing Warning',
        'Recoverable syntax error Suggestion: Try adding semicolon'
      );
    });

    it('should show info toasts for warnings (limited)', () => {
      const warnings: ParseError[] = [
        {
          id: 'warn-1',
          type: 'semantic',
          message: 'Warning 1',
          severity: 'warning',
          recoverable: true
        },
        {
          id: 'warn-2',
          type: 'semantic',
          message: 'Warning 2',
          severity: 'warning',
          recoverable: true
        }
      ];

      errorHandlingService.notifyUser([], warnings, mockNotifications);

      expect(mockNotifications.showInfoToast).toHaveBeenCalledTimes(2);
    });

    it('should limit warning notifications to avoid spam', () => {
      const warnings: ParseError[] = Array.from({ length: 5 }, (_, i) => ({
        id: `warn-${i}`,
        type: 'semantic',
        message: `Warning ${i}`,
        severity: 'warning' as const,
        recoverable: true
      }));

      errorHandlingService.notifyUser([], warnings, mockNotifications);

      expect(mockNotifications.showInfoToast).toHaveBeenCalledTimes(1);
      expect(mockNotifications.showInfoToast).toHaveBeenCalledWith(
        'Code Analysis Info',
        '5 analysis warnings found. Check the console for details.'
      );
    });

    it('should handle multiple error types correctly', () => {
      const errors: ParseError[] = [{
        id: 'error-1',
        type: 'syntax',
        message: 'Critical error',
        severity: 'error',
        recoverable: false
      }];

      const warnings: ParseError[] = [{
        id: 'warn-1',
        type: 'semantic',
        message: 'Minor warning',
        severity: 'warning',
        recoverable: true
      }];

      errorHandlingService.notifyUser(errors, warnings, mockNotifications);

      expect(mockNotifications.showErrorToast).toHaveBeenCalledTimes(1);
      expect(mockNotifications.showInfoToast).toHaveBeenCalledTimes(1);
    });
  });

  describe('formatErrorForConsole', () => {
    it('should format error with all available information', () => {
      const error: ParseError = {
        id: 'test-1',
        type: 'syntax',
        message: 'Unexpected token',
        severity: 'error',
        sourceLocation: {
          start: { line: 2, column: 10 },
          end: { line: 2, column: 11 }
        },
        suggestion: 'Add semicolon',
        code: 'const x =',
        functionName: 'testFunction',
        recoverable: true
      };

      const code = 'function testFunction() {\n  const x =\n  return x;\n}';
      const formatted = errorHandlingService.formatErrorForConsole(error, code);

      expect(formatted).toContain('[ERROR] syntax: Unexpected token');
      expect(formatted).toContain('Function: testFunction');
      expect(formatted).toContain('Location: Line 2, Column 10');
      expect(formatted).toContain('Code: const x =');
      expect(formatted).toContain('Suggestion: Add semicolon');
      expect(formatted).toContain('Context:');
      expect(formatted).toContain('> 2:   const x =');
      expect(formatted).toContain('^'); // Error pointer
    });

    it('should format error without optional fields', () => {
      const error: ParseError = {
        id: 'test-2',
        type: 'semantic',
        message: 'Simple error',
        severity: 'warning',
        recoverable: false
      };

      const formatted = errorHandlingService.formatErrorForConsole(error);

      expect(formatted).toBe('[WARNING] semantic: Simple error');
    });
  });

  describe('logErrors', () => {
    it('should log errors and warnings to console with proper grouping', () => {
      const errors: ParseError[] = [{
        id: 'error-1',
        type: 'syntax',
        message: 'Error message',
        severity: 'error',
        recoverable: false
      }];

      const warnings: ParseError[] = [{
        id: 'warn-1',
        type: 'semantic',
        message: 'Warning message',
        severity: 'warning',
        recoverable: true
      }];

      errorHandlingService.logErrors(errors, warnings, 'test code');

      expect(console.group).toHaveBeenCalledWith('🚨 AST Parsing Errors');
      expect(console.group).toHaveBeenCalledWith('⚠️ AST Parsing Warnings');
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.groupEnd).toHaveBeenCalledTimes(2);
    });

    it('should not log if no errors or warnings', () => {
      errorHandlingService.logErrors([], [], 'test code');

      expect(console.group).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });
  });
});