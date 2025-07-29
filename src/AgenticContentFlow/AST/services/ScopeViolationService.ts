import { ScopeViolation, ScopeCorrection, FunctionMetadata, FunctionCall, ParsedFileStructure } from '../types/ASTTypes';
import { useNotifications } from '../../Notifications/hooks/useNotifications';

export class ScopeViolationService {
  private static instance: ScopeViolationService;

  static getInstance(): ScopeViolationService {
    if (!ScopeViolationService.instance) {
      ScopeViolationService.instance = new ScopeViolationService();
    }
    return ScopeViolationService.instance;
  }

  /**
   * Analyze parsed file structure for scope violations
   */
  analyzeScopeViolations(structure: ParsedFileStructure): ScopeViolation[] {
    const violations: ScopeViolation[] = [];

    // Check for missing parent function violations
    violations.push(...this.detectMissingParentViolations(structure.functions));

    // Check for circular dependency violations
    violations.push(...this.detectCircularDependencies(structure.functions, structure.calls));

    // Check for invalid scope access violations
    violations.push(...this.detectInvalidScopeAccess(structure.functions, structure.calls));

    // Check for variable scope violations
    violations.push(...this.detectVariableScopeViolations(structure.functions, structure.variables));

    return violations;
  }

  /**
   * Detect functions that claim to have a parent but the parent doesn't exist
   */
  private detectMissingParentViolations(functions: FunctionMetadata[]): ScopeViolation[] {
    const violations: ScopeViolation[] = [];
    const functionNames = new Set(functions.map(f => f.name));

    functions.forEach(func => {
      if (func.parentFunction && !functionNames.has(func.parentFunction)) {
        violations.push(this.createScopeViolation(
          'missing_parent',
          func.id,
          `Function "${func.name}" references parent function "${func.parentFunction}" which doesn't exist in the current file`,
          'error',
          func.name,
          func.parentFunction
        ));
      }
    });

    return violations;
  }

  /**
   * Detect circular dependencies in function calls
   */
  private detectCircularDependencies(functions: FunctionMetadata[], calls: FunctionCall[]): ScopeViolation[] {
    const violations: ScopeViolation[] = [];
    const functionMap = new Map(functions.map(f => [f.name, f]));

    // Build adjacency list for function calls
    const callGraph = new Map<string, Set<string>>();
    calls.forEach(call => {
      if (!callGraph.has(call.callerFunction)) {
        callGraph.set(call.callerFunction, new Set());
      }
      callGraph.get(call.callerFunction)!.add(call.calledFunction);
    });

    // Detect cycles using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const detectCycle = (functionName: string, path: string[]): boolean => {
      if (recursionStack.has(functionName)) {
        // Found a cycle
        const cycleStart = path.indexOf(functionName);
        const cyclePath = path.slice(cycleStart).concat([functionName]);
        
        const func = functionMap.get(functionName);
        if (func) {
          violations.push(this.createScopeViolation(
            'circular_dependency',
            func.id,
            `Circular dependency detected: ${cyclePath.join(' → ')}`,
            'warning',
            functionName
          ));
        }
        return true;
      }

      if (visited.has(functionName)) {
        return false;
      }

      visited.add(functionName);
      recursionStack.add(functionName);

      const callees = callGraph.get(functionName) || new Set();
      for (const callee of callees) {
        if (detectCycle(callee, [...path, functionName])) {
          return true;
        }
      }

      recursionStack.delete(functionName);
      return false;
    };

    // Check each function for cycles
    functions.forEach(func => {
      if (!visited.has(func.name)) {
        detectCycle(func.name, []);
      }
    });

    return violations;
  }

  /**
   * Detect invalid scope access (e.g., nested function calling parent's sibling)
   */
  private detectInvalidScopeAccess(functions: FunctionMetadata[], calls: FunctionCall[]): ScopeViolation[] {
    const violations: ScopeViolation[] = [];
    const functionMap = new Map(functions.map(f => [f.name, f]));

    calls.forEach(call => {
      const caller = functionMap.get(call.callerFunction);
      const callee = functionMap.get(call.calledFunction);

      if (!caller || !callee) return;

      // Check if nested function is trying to call a sibling function
      if (caller.isNested && callee.isNested && 
          caller.parentFunction === callee.parentFunction &&
          caller.name !== callee.name) {
        violations.push(this.createScopeViolation(
          'invalid_scope',
          caller.id,
          `Nested function "${caller.name}" is calling sibling function "${callee.name}". Consider moving the call to the parent function or restructuring the code.`,
          'warning',
          caller.name,
          caller.parentFunction
        ));
      }

      // Check if function is trying to call a nested function from outside its parent
      if (!caller.isNested && callee.isNested && 
          caller.name !== callee.parentFunction) {
        violations.push(this.createScopeViolation(
          'invalid_scope',
          caller.id,
          `Function "${caller.name}" is calling nested function "${callee.name}" which is scoped to "${callee.parentFunction}". This may cause runtime errors.`,
          'error',
          caller.name
        ));
      }
    });

    return violations;
  }

  /**
   * Detect variable scope violations
   */
  private detectVariableScopeViolations(functions: FunctionMetadata[], variables: any[]): ScopeViolation[] {
    const violations: ScopeViolation[] = [];

    // Check for global variables that should be function-scoped
    const globalVariables = variables.filter(v => v.scope === 'global');
    globalVariables.forEach(variable => {
      // If a global variable is only used in one function, suggest moving it
      const usageCount = this.countVariableUsage(variable.name, functions);
      if (usageCount.totalFunctions === 1) {
        const func = functions.find(f => f.id === usageCount.functionIds[0]);
        if (func) {
          violations.push(this.createScopeViolation(
            'invalid_scope',
            func.id,
            `Global variable "${variable.name}" is only used in function "${func.name}". Consider moving it inside the function for better encapsulation.`,
            'info',
            func.name
          ));
        }
      }
    });

    return violations;
  }

  /**
   * Count how many functions use a specific variable
   */
  private countVariableUsage(variableName: string, functions: FunctionMetadata[]): { totalFunctions: number; functionIds: string[] } {
    const functionIds: string[] = [];
    
    functions.forEach(func => {
      if (func.code && func.code.includes(variableName)) {
        functionIds.push(func.id);
      }
    });

    return {
      totalFunctions: functionIds.length,
      functionIds
    };
  }

  /**
   * Create a scope violation with unique ID
   */
  private createScopeViolation(
    type: ScopeViolation['type'],
    nodeId: string,
    message: string,
    severity: ScopeViolation['severity'],
    functionName?: string,
    parentFunction?: string
  ): ScopeViolation {
    return {
      type,
      nodeId,
      functionName,
      parentFunction,
      message,
      severity
    };
  }

  /**
   * Generate correction suggestions for scope violations
   */
  generateCorrections(violations: ScopeViolation[]): ScopeCorrection[] {
    const corrections: ScopeCorrection[] = [];

    violations.forEach((violation, index) => {
      switch (violation.type) {
        case 'missing_parent':
          corrections.push({
            violationId: `violation-${index}`,
            type: 'fix_scope',
            description: `Remove parent function reference or create the missing parent function "${violation.parentFunction}"`,
            action: () => {
              console.log(`Fixing missing parent for ${violation.functionName}`);
              // Implementation would modify the AST or code
            }
          });
          break;

        case 'circular_dependency':
          corrections.push({
            violationId: `violation-${index}`,
            type: 'break_cycle',
            description: `Break the circular dependency by restructuring function calls or introducing an intermediary function`,
            action: () => {
              console.log(`Breaking circular dependency involving ${violation.functionName}`);
              // Implementation would suggest code restructuring
            }
          });
          break;

        case 'invalid_scope':
          if (violation.message.includes('Global variable')) {
            corrections.push({
              violationId: `violation-${index}`,
              type: 'move_to_global',
              description: `Move the variable inside the function that uses it`,
              action: () => {
                console.log(`Moving variable to function scope for ${violation.functionName}`);
                // Implementation would move variable declaration
              }
            });
          } else {
            corrections.push({
              violationId: `violation-${index}`,
              type: 'fix_scope',
              description: `Restructure the code to respect function scoping rules`,
              action: () => {
                console.log(`Fixing scope access for ${violation.functionName}`);
                // Implementation would suggest code restructuring
              }
            });
          }
          break;
      }
    });

    return corrections;
  }

  /**
   * Notify user about scope violations using the notification system
   */
  notifyUser(violations: ScopeViolation[], notificationHook?: ReturnType<typeof useNotifications>) {
    if (!notificationHook || violations.length === 0) return;

    const errors = violations.filter(v => v.severity === 'error');
    const warnings = violations.filter(v => v.severity === 'warning');
    const infos = violations.filter(v => v.severity === 'info');

    // Show errors as error toasts
    if (errors.length > 0) {
      const errorMessage = errors.length === 1
        ? errors[0].message
        : `${errors.length} scope errors found. Check the console for details.`;

      notificationHook.showErrorToast(
        'Scope Violation Error',
        errorMessage
      );
    }

    // Show warnings as warning toasts (limited to avoid spam)
    if (warnings.length > 0 && warnings.length <= 2) {
      warnings.forEach(warning => {
        notificationHook.showWarningToast(
          'Scope Warning',
          warning.message
        );
      });
    } else if (warnings.length > 2) {
      notificationHook.showWarningToast(
        'Scope Warnings',
        `${warnings.length} scope warnings found. Check the console for details.`
      );
    }

    // Show info messages as info toasts (limited to avoid spam)
    if (infos.length > 0 && infos.length <= 3) {
      infos.forEach(info => {
        notificationHook.showInfoToast(
          'Scope Suggestion',
          info.message
        );
      });
    } else if (infos.length > 3) {
      notificationHook.showInfoToast(
        'Scope Suggestions',
        `${infos.length} scope improvement suggestions available. Check the console for details.`
      );
    }
  }

  /**
   * Log scope violations to console with detailed formatting
   */
  logViolations(violations: ScopeViolation[]) {
    if (violations.length === 0) return;

    const errors = violations.filter(v => v.severity === 'error');
    const warnings = violations.filter(v => v.severity === 'warning');
    const infos = violations.filter(v => v.severity === 'info');

    if (errors.length > 0) {
      console.group('🚨 Scope Violation Errors');
      errors.forEach(error => {
        console.error(this.formatViolationForConsole(error));
      });
      console.groupEnd();
    }

    if (warnings.length > 0) {
      console.group('⚠️ Scope Violation Warnings');
      warnings.forEach(warning => {
        console.warn(this.formatViolationForConsole(warning));
      });
      console.groupEnd();
    }

    if (infos.length > 0) {
      console.group('💡 Scope Improvement Suggestions');
      infos.forEach(info => {
        console.info(this.formatViolationForConsole(info));
      });
      console.groupEnd();
    }
  }

  /**
   * Format scope violation for console logging
   */
  private formatViolationForConsole(violation: ScopeViolation): string {
    let formatted = `[${violation.severity.toUpperCase()}] ${violation.type}: ${violation.message}`;
    
    if (violation.functionName) {
      formatted += `\n  Function: ${violation.functionName}`;
    }
    
    if (violation.parentFunction) {
      formatted += `\n  Parent Function: ${violation.parentFunction}`;
    }
    
    formatted += `\n  Node ID: ${violation.nodeId}`;
    
    return formatted;
  }

  /**
   * Create visual indicators for scope violations (for UI integration)
   */
  createVisualIndicators(violations: ScopeViolation[]): Map<string, { type: string; severity: string; message: string }[]> {
    const indicators = new Map<string, { type: string; severity: string; message: string }[]>();

    violations.forEach(violation => {
      if (!indicators.has(violation.nodeId)) {
        indicators.set(violation.nodeId, []);
      }

      indicators.get(violation.nodeId)!.push({
        type: violation.type,
        severity: violation.severity,
        message: violation.message
      });
    });

    return indicators;
  }
}

export const scopeViolationService = ScopeViolationService.getInstance();