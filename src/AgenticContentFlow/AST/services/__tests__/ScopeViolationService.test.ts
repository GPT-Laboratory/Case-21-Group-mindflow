import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { scopeViolationService } from '../ScopeViolationService';
import { ParsedFileStructure, FunctionMetadata, FunctionCall, VariableDeclaration } from '../../types/ASTTypes';

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

describe('ScopeViolationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('analyzeScopeViolations', () => {
    it('should detect missing parent function violations', () => {
      const functions: FunctionMetadata[] = [
        {
          id: 'func1',
          name: 'childFunction',
          description: 'Child function',
          parameters: [],
          sourceLocation: { start: { line: 1, column: 0 }, end: { line: 3, column: 0 } },
          isNested: true,
          parentFunction: 'nonExistentParent',
          scope: 'function',
          code: 'function childFunction() { return "child"; }'
        }
      ];

      const structure: ParsedFileStructure = {
        functions,
        calls: [],
        dependencies: [],
        variables: [],
        comments: []
      };

      const violations = scopeViolationService.analyzeScopeViolations(structure);

      expect(violations).toHaveLength(1);
      expect(violations[0].type).toBe('missing_parent');
      expect(violations[0].nodeId).toBe('func1');
      expect(violations[0].functionName).toBe('childFunction');
      expect(violations[0].parentFunction).toBe('nonExistentParent');
      expect(violations[0].severity).toBe('error');
      expect(violations[0].message).toContain('references parent function "nonExistentParent" which doesn\'t exist');
    });

    it('should detect circular dependency violations', () => {
      const functions: FunctionMetadata[] = [
        {
          id: 'func1',
          name: 'functionA',
          description: 'Function A',
          parameters: [],
          sourceLocation: { start: { line: 1, column: 0 }, end: { line: 3, column: 0 } },
          isNested: false,
          scope: 'function',
          code: 'function functionA() { return functionB(); }'
        },
        {
          id: 'func2',
          name: 'functionB',
          description: 'Function B',
          parameters: [],
          sourceLocation: { start: { line: 4, column: 0 }, end: { line: 6, column: 0 } },
          isNested: false,
          scope: 'function',
          code: 'function functionB() { return functionA(); }'
        }
      ];

      const calls: FunctionCall[] = [
        {
          id: 'call1',
          callerFunction: 'functionA',
          calledFunction: 'functionB',
          sourceLocation: { start: { line: 1, column: 20 }, end: { line: 1, column: 30 } },
          isExternal: false
        },
        {
          id: 'call2',
          callerFunction: 'functionB',
          calledFunction: 'functionA',
          sourceLocation: { start: { line: 4, column: 20 }, end: { line: 4, column: 30 } },
          isExternal: false
        }
      ];

      const structure: ParsedFileStructure = {
        functions,
        calls,
        dependencies: [],
        variables: [],
        comments: []
      };

      const violations = scopeViolationService.analyzeScopeViolations(structure);

      expect(violations.length).toBeGreaterThan(0);
      const circularViolation = violations.find(v => v.type === 'circular_dependency');
      expect(circularViolation).toBeDefined();
      expect(circularViolation?.severity).toBe('warning');
      expect(circularViolation?.message).toContain('Circular dependency detected');
    });

    it('should detect invalid scope access violations', () => {
      const functions: FunctionMetadata[] = [
        {
          id: 'parent',
          name: 'parentFunction',
          description: 'Parent function',
          parameters: [],
          sourceLocation: { start: { line: 1, column: 0 }, end: { line: 10, column: 0 } },
          isNested: false,
          scope: 'function',
          code: 'function parentFunction() { /* contains nested functions */ }'
        },
        {
          id: 'child1',
          name: 'childFunction1',
          description: 'Child function 1',
          parameters: [],
          sourceLocation: { start: { line: 2, column: 2 }, end: { line: 4, column: 2 } },
          isNested: true,
          parentFunction: 'parentFunction',
          scope: 'function',
          code: 'function childFunction1() { return childFunction2(); }'
        },
        {
          id: 'child2',
          name: 'childFunction2',
          description: 'Child function 2',
          parameters: [],
          sourceLocation: { start: { line: 5, column: 2 }, end: { line: 7, column: 2 } },
          isNested: true,
          parentFunction: 'parentFunction',
          scope: 'function',
          code: 'function childFunction2() { return "child2"; }'
        }
      ];

      const calls: FunctionCall[] = [
        {
          id: 'call1',
          callerFunction: 'childFunction1',
          calledFunction: 'childFunction2',
          sourceLocation: { start: { line: 2, column: 20 }, end: { line: 2, column: 35 } },
          isExternal: false
        }
      ];

      const structure: ParsedFileStructure = {
        functions,
        calls,
        dependencies: [],
        variables: [],
        comments: []
      };

      const violations = scopeViolationService.analyzeScopeViolations(structure);

      const scopeViolation = violations.find(v => v.type === 'invalid_scope');
      expect(scopeViolation).toBeDefined();
      expect(scopeViolation?.severity).toBe('warning');
      expect(scopeViolation?.message).toContain('calling sibling function');
    });

    it('should detect variable scope violations', () => {
      const functions: FunctionMetadata[] = [
        {
          id: 'func1',
          name: 'testFunction',
          description: 'Test function',
          parameters: [],
          sourceLocation: { start: { line: 3, column: 0 }, end: { line: 5, column: 0 } },
          isNested: false,
          scope: 'function',
          code: 'function testFunction() { return globalVar; }'
        }
      ];

      const variables: VariableDeclaration[] = [
        {
          name: 'globalVar',
          type: 'var',
          sourceLocation: { start: { line: 1, column: 0 }, end: { line: 1, column: 20 } },
          scope: 'global',
          defaultValue: '"test"'
        }
      ];

      const structure: ParsedFileStructure = {
        functions,
        calls: [],
        dependencies: [],
        variables,
        comments: []
      };

      const violations = scopeViolationService.analyzeScopeViolations(structure);

      const variableViolation = violations.find(v => v.type === 'invalid_scope' && v.message.includes('Global variable'));
      expect(variableViolation).toBeDefined();
      expect(variableViolation?.severity).toBe('info');
      expect(variableViolation?.message).toContain('only used in function');
    });

    it('should return empty array for valid code structure', () => {
      const functions: FunctionMetadata[] = [
        {
          id: 'func1',
          name: 'validFunction',
          description: 'Valid function',
          parameters: [],
          sourceLocation: { start: { line: 1, column: 0 }, end: { line: 3, column: 0 } },
          isNested: false,
          scope: 'function',
          code: 'function validFunction() { return "valid"; }'
        }
      ];

      const structure: ParsedFileStructure = {
        functions,
        calls: [],
        dependencies: [],
        variables: [],
        comments: []
      };

      const violations = scopeViolationService.analyzeScopeViolations(structure);

      expect(violations).toHaveLength(0);
    });
  });

  describe('generateCorrections', () => {
    it('should generate corrections for missing parent violations', () => {
      const violations = [
        {
          type: 'missing_parent' as const,
          nodeId: 'func1',
          functionName: 'childFunction',
          parentFunction: 'missingParent',
          message: 'Missing parent function',
          severity: 'error' as const
        }
      ];

      const corrections = scopeViolationService.generateCorrections(violations);

      expect(corrections).toHaveLength(1);
      expect(corrections[0].type).toBe('fix_scope');
      expect(corrections[0].description).toContain('Remove parent function reference or create the missing parent function');
    });

    it('should generate corrections for circular dependency violations', () => {
      const violations = [
        {
          type: 'circular_dependency' as const,
          nodeId: 'func1',
          functionName: 'functionA',
          message: 'Circular dependency detected',
          severity: 'warning' as const
        }
      ];

      const corrections = scopeViolationService.generateCorrections(violations);

      expect(corrections).toHaveLength(1);
      expect(corrections[0].type).toBe('break_cycle');
      expect(corrections[0].description).toContain('Break the circular dependency');
    });

    it('should generate corrections for invalid scope violations', () => {
      const violations = [
        {
          type: 'invalid_scope' as const,
          nodeId: 'func1',
          functionName: 'testFunction',
          message: 'Global variable "testVar" is only used in function "testFunction"',
          severity: 'info' as const
        }
      ];

      const corrections = scopeViolationService.generateCorrections(violations);

      expect(corrections).toHaveLength(1);
      expect(corrections[0].type).toBe('move_to_global');
      expect(corrections[0].description).toContain('Move the variable inside the function');
    });
  });

  describe('notifyUser', () => {
    it('should show error toast for error violations', () => {
      const violations = [
        {
          type: 'missing_parent' as const,
          nodeId: 'func1',
          functionName: 'childFunction',
          parentFunction: 'missingParent',
          message: 'Missing parent function error',
          severity: 'error' as const
        }
      ];

      scopeViolationService.notifyUser(violations, mockNotifications);

      expect(mockNotifications.showErrorToast).toHaveBeenCalledWith(
        'Scope Violation Error',
        'Missing parent function error'
      );
    });

    it('should show warning toast for warning violations', () => {
      const violations = [
        {
          type: 'circular_dependency' as const,
          nodeId: 'func1',
          functionName: 'functionA',
          message: 'Circular dependency warning',
          severity: 'warning' as const
        }
      ];

      scopeViolationService.notifyUser(violations, mockNotifications);

      expect(mockNotifications.showWarningToast).toHaveBeenCalledWith(
        'Scope Warning',
        'Circular dependency warning'
      );
    });

    it('should show info toast for info violations', () => {
      const violations = [
        {
          type: 'invalid_scope' as const,
          nodeId: 'func1',
          functionName: 'testFunction',
          message: 'Scope improvement suggestion',
          severity: 'info' as const
        }
      ];

      scopeViolationService.notifyUser(violations, mockNotifications);

      expect(mockNotifications.showInfoToast).toHaveBeenCalledWith(
        'Scope Suggestion',
        'Scope improvement suggestion'
      );
    });

    it('should limit notifications to avoid spam', () => {
      const violations = Array.from({ length: 5 }, (_, i) => ({
        type: 'invalid_scope' as const,
        nodeId: `func${i}`,
        functionName: `function${i}`,
        message: `Warning ${i}`,
        severity: 'warning' as const
      }));

      scopeViolationService.notifyUser(violations, mockNotifications);

      expect(mockNotifications.showWarningToast).toHaveBeenCalledTimes(1);
      expect(mockNotifications.showWarningToast).toHaveBeenCalledWith(
        'Scope Warnings',
        '5 scope warnings found. Check the console for details.'
      );
    });

    it('should not notify if no violations', () => {
      scopeViolationService.notifyUser([], mockNotifications);

      expect(mockNotifications.showErrorToast).not.toHaveBeenCalled();
      expect(mockNotifications.showWarningToast).not.toHaveBeenCalled();
      expect(mockNotifications.showInfoToast).not.toHaveBeenCalled();
    });

    it('should handle missing notification hook gracefully', () => {
      const violations = [
        {
          type: 'missing_parent' as const,
          nodeId: 'func1',
          functionName: 'childFunction',
          parentFunction: 'missingParent',
          message: 'Missing parent function error',
          severity: 'error' as const
        }
      ];

      expect(() => {
        scopeViolationService.notifyUser(violations);
      }).not.toThrow();
    });
  });

  describe('logViolations', () => {
    it('should log violations to console with proper grouping', () => {
      const violations = [
        {
          type: 'missing_parent' as const,
          nodeId: 'func1',
          functionName: 'childFunction',
          parentFunction: 'missingParent',
          message: 'Error message',
          severity: 'error' as const
        },
        {
          type: 'circular_dependency' as const,
          nodeId: 'func2',
          functionName: 'functionA',
          message: 'Warning message',
          severity: 'warning' as const
        },
        {
          type: 'invalid_scope' as const,
          nodeId: 'func3',
          functionName: 'testFunction',
          message: 'Info message',
          severity: 'info' as const
        }
      ];

      scopeViolationService.logViolations(violations);

      expect(console.group).toHaveBeenCalledWith('🚨 Scope Violation Errors');
      expect(console.group).toHaveBeenCalledWith('⚠️ Scope Violation Warnings');
      expect(console.group).toHaveBeenCalledWith('💡 Scope Improvement Suggestions');
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.groupEnd).toHaveBeenCalledTimes(3);
    });

    it('should not log if no violations', () => {
      scopeViolationService.logViolations([]);

      expect(console.group).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
    });
  });

  describe('createVisualIndicators', () => {
    it('should create visual indicators for violations', () => {
      const violations = [
        {
          type: 'missing_parent' as const,
          nodeId: 'func1',
          functionName: 'childFunction',
          parentFunction: 'missingParent',
          message: 'Error message',
          severity: 'error' as const
        },
        {
          type: 'circular_dependency' as const,
          nodeId: 'func1',
          functionName: 'childFunction',
          message: 'Warning message',
          severity: 'warning' as const
        }
      ];

      const indicators = scopeViolationService.createVisualIndicators(violations);

      expect(indicators.size).toBe(1);
      expect(indicators.has('func1')).toBe(true);
      
      const func1Indicators = indicators.get('func1');
      expect(func1Indicators).toHaveLength(2);
      expect(func1Indicators?.[0].type).toBe('missing_parent');
      expect(func1Indicators?.[0].severity).toBe('error');
      expect(func1Indicators?.[1].type).toBe('circular_dependency');
      expect(func1Indicators?.[1].severity).toBe('warning');
    });

    it('should return empty map for no violations', () => {
      const indicators = scopeViolationService.createVisualIndicators([]);

      expect(indicators.size).toBe(0);
    });
  });

  describe('formatViolationForConsole', () => {
    it('should format violation with all information', () => {
      const violation = {
        type: 'missing_parent' as const,
        nodeId: 'func1',
        functionName: 'childFunction',
        parentFunction: 'missingParent',
        message: 'Missing parent function',
        severity: 'error' as const
      };

      const formatted = scopeViolationService['formatViolationForConsole'](violation);

      expect(formatted).toContain('[ERROR] missing_parent: Missing parent function');
      expect(formatted).toContain('Function: childFunction');
      expect(formatted).toContain('Parent Function: missingParent');
      expect(formatted).toContain('Node ID: func1');
    });

    it('should format violation with minimal information', () => {
      const violation = {
        type: 'invalid_scope' as const,
        nodeId: 'func1',
        message: 'Simple violation',
        severity: 'info' as const
      };

      const formatted = scopeViolationService['formatViolationForConsole'](violation);

      expect(formatted).toBe('[INFO] invalid_scope: Simple violation\n  Node ID: func1');
    });
  });
});