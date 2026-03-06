/**
 * Code Validation Module
 * 
 * Provides syntax checking, security validation, and code quality analysis
 * for generated process functions.
 * 
 * @author Agentic Content Flow Team
 * @version 1.0.0
 * @since 2025-06-15
 */

export interface ValidationResult {
  /** Whether the code passes all validation checks */
  isValid: boolean;
  
  /** Syntax and runtime errors found */
  errors: string[];
  
  /** Non-critical warnings */
  warnings: string[];
  
  /** Security issues detected */
  securityIssues: SecurityIssue[];
  
  /** Performance recommendations */
  performanceWarnings: string[];
  
  /** Suggestions for improvement */
  suggestions: string[];
}

export interface SecurityIssue {
  /** Severity level of the security issue */
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  /** Type of security issue */
  type: SecurityIssueType;
  
  /** Human-readable description */
  description: string;
  
  /** Line number where issue was found (if applicable) */
  line?: number;
  
  /** Code snippet that caused the issue */
  snippet?: string;
  
  /** Suggested fix */
  suggestion?: string;
}

export type SecurityIssueType = 
  | 'code-injection'
  | 'xss-vulnerability'
  | 'unsafe-eval'
  | 'dangerous-function'
  | 'prototype-pollution'
  | 'resource-exhaustion'
  | 'data-exposure'
  | 'unsafe-html'
  | 'network-security';

/**
 * Process Code Validator
 * 
 * Validates generated JavaScript code for syntax, security, and best practices.
 * Used by the GenerationOrchestrator to ensure generated code quality.
 * 
 * @author Agentic Content Flow Team
 * @version 1.0.0
 * @since 2025-06-15
 */
export class ProcessCodeValidator {
  private dangerousPatterns: Array<{
    pattern: RegExp;
    type: SecurityIssueType;
    severity: SecurityIssue['severity'];
    description: string;
    suggestion: string;
  }> = [
    {
      pattern: /eval\s*\(/gi,
      type: 'unsafe-eval',
      severity: 'critical',
      description: 'Use of eval() function detected',
      suggestion: 'Replace eval() with safer alternatives like JSON.parse() or specific parsing logic'
    },
    {
      pattern: /Function\s*\(/gi,
      type: 'code-injection',
      severity: 'high',
      description: 'Dynamic function creation detected',
      suggestion: 'Avoid creating functions from strings. Use predefined function references instead'
    },
    {
      pattern: /setTimeout\s*\(\s*["'].*["']/gi,
      type: 'code-injection',
      severity: 'medium',
      description: 'setTimeout with string argument detected',
      suggestion: 'Use setTimeout with function references instead of string code'
    },
    {
      pattern: /setInterval\s*\(\s*["'].*["']/gi,
      type: 'code-injection',
      severity: 'medium',
      description: 'setInterval with string argument detected',
      suggestion: 'Use setInterval with function references instead of string code'
    },
    {
      pattern: /innerHTML\s*=\s*[^;]*\+/gi,
      type: 'xss-vulnerability',
      severity: 'high',
      description: 'Potential XSS vulnerability in innerHTML assignment',
      suggestion: 'Use textContent or properly sanitize HTML content'
    },
    {
      pattern: /__proto__/gi,
      type: 'prototype-pollution',
      severity: 'medium',
      description: 'Direct prototype manipulation detected',
      suggestion: 'Avoid direct prototype manipulation. Use Object.create() or classes instead'
    },
    {
      pattern: /while\s*\(\s*true\s*\)/gi,
      type: 'resource-exhaustion',
      severity: 'medium',
      description: 'Infinite loop detected',
      suggestion: 'Add proper exit conditions to prevent infinite loops'
    }
  ];

  private performancePatterns: Array<{
    pattern: RegExp;
    description: string;
    suggestion: string;
  }> = [
    {
      pattern: /for\s*\([^)]*\)\s*{\s*for\s*\([^)]*\)/gi,
      description: 'Nested loops detected',
      suggestion: 'Consider optimizing nested loops for better performance'
    },
    {
      pattern: /\.forEach\s*\([^)]*\)\s*{\s*.*\.forEach/gi,
      description: 'Nested forEach loops detected',
      suggestion: 'Consider using more efficient iteration methods'
    },
    {
      pattern: /JSON\.parse\s*\(\s*JSON\.stringify/gi,
      description: 'Deep cloning via JSON detected',
      suggestion: 'Use structuredClone() or a dedicated cloning library for better performance'
    }
  ];

  /**
   * Validate process function code
   */
  validateCode(code: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      securityIssues: [],
      performanceWarnings: [],
      suggestions: []
    };

    // Syntax validation
    this.validateSyntax(code, result);
    
    // Security validation
    this.validateSecurity(code, result);
    
    // Performance validation
    this.validatePerformance(code, result);
    
    // Structure validation
    this.validateStructure(code, result);
    
    // Determine overall validity
    result.isValid = result.errors.length === 0 && 
                     result.securityIssues.filter(issue => issue.severity === 'critical').length === 0;

    return result;
  }

  private validateSyntax(code: string, result: ValidationResult): void {
    try {
      // Basic syntax check using Function constructor
      new Function(code);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Syntax error: ${errorMessage}`);
    }

    // Check for common syntax issues
    const lines = code.split('\n');
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Check for missing semicolons (simplified check)
      if (line.trim().endsWith('return') || 
          (line.includes('=') && !line.trim().endsWith(';') && 
           !line.trim().endsWith('{') && !line.trim().endsWith('}'))) {
        result.warnings.push(`Line ${lineNumber}: Consider adding semicolon`);
      }
    });

    // Check for required async function structure
    if (!code.includes('async function process')) {
      result.errors.push('Missing required "async function process" declaration');
      result.isValid = false;
    }

    // Check for proper parameter structure
    const functionMatch = code.match(/async\s+function\s+process\s*\(\s*([^)]*)\s*\)/);
    if (functionMatch) {
      const params = functionMatch[1].split(',').map(p => p.trim()).filter(p => p);
      const expectedParams = ['incomingData', 'nodeData', 'params', 'targetMap', 'sourceMap'];
      
      if (params.length !== expectedParams.length) {
        result.warnings.push(`Function should have ${expectedParams.length} parameters: ${expectedParams.join(', ')}`);
      }
    }
  }

  private validateSecurity(code: string, result: ValidationResult): void {
    this.dangerousPatterns.forEach(pattern => {
      const matches = code.matchAll(pattern.pattern);
      for (const match of matches) {
        const lineNumber = this.getLineNumber(code, match.index || 0);
        
        result.securityIssues.push({
          severity: pattern.severity,
          type: pattern.type,
          description: pattern.description,
          line: lineNumber,
          snippet: match[0],
          suggestion: pattern.suggestion
        });
      }
    });

    // Check for potential data exposure
    if (code.includes('console.log') && code.includes('password')) {
      result.securityIssues.push({
        severity: 'medium',
        type: 'data-exposure',
        description: 'Potential password logging detected',
        suggestion: 'Avoid logging sensitive data like passwords'
      });
    }

    // Check for dangerous functions
    const dangerousFunctions = ['eval', 'Function', 'setTimeout', 'setInterval'];
    dangerousFunctions.forEach(func => {
      if (code.includes(func + '(')) {
        result.securityIssues.push({
          type: 'dangerous-function',
          description: `Usage of potentially dangerous function: ${func}`,
          severity: func === 'eval' ? 'critical' : 'medium'
        });
      }
    });

    // Check for innerHTML usage
    if (code.includes('innerHTML')) {
      result.securityIssues.push({
        type: 'unsafe-html',
        description: 'Direct innerHTML usage can lead to XSS vulnerabilities',
        severity: 'medium'
      });
    }

    // Check for unvalidated network requests
    if (code.includes('fetch(') && !code.includes('try')) {
      result.securityIssues.push({
        type: 'network-security',
        description: 'Network requests should be wrapped in try-catch blocks',
        severity: 'low'
      });
    }
  }

  private validatePerformance(code: string, result: ValidationResult): void {
    this.performancePatterns.forEach(pattern => {
      if (pattern.pattern.test(code)) {
        result.performanceWarnings.push(pattern.description);
        result.suggestions.push(pattern.suggestion);
      }
    });

    // Check for large string concatenations
    if (code.includes('+=') && code.includes('string')) {
      result.performanceWarnings.push('String concatenation in loops detected');
      result.suggestions.push('Consider using array.join() for better performance');
    }
  }

  private validateStructure(code: string, result: ValidationResult): void {
    // Check for async function declaration
    if (!code.includes('async function')) {
      result.warnings.push('Function should be declared as async');
    }

    // Check for proper error handling
    if (!code.includes('try') && !code.includes('catch')) {
      result.suggestions.push('Consider adding try-catch blocks for error handling');
    }

    // Check for proper parameter usage
    const funcMatch = code.match(/function\s+\w*\s*\(([^)]*)\)/);
    if (funcMatch) {
      const params = funcMatch[1].split(',').map(p => p.trim()).filter(p => p);
      const expectedParams = ['incomingData', 'nodeData', 'params'];
      
      expectedParams.forEach(expectedParam => {
        if (!params.some(p => p.includes(expectedParam))) {
          result.warnings.push(`Parameter '${expectedParam}' not found in function signature`);
        }
      });
    }

    // Check for return statement
    if (!code.includes('return')) {
      result.warnings.push('Function should return a value');
    }
  }

  private getLineNumber(code: string, index: number): number {
    return code.substring(0, index).split('\n').length;
  }

  /**
   * Quick validation for real-time feedback
   */
  quickValidate(code: string): { isValid: boolean; errors: string[] } {
    try {
      new Function(code);
      
      if (!code.includes('async function process')) {
        return { isValid: false, errors: ['Missing async function process declaration'] };
      }
      
      return { isValid: true, errors: [] };
    } catch (error) {
      return { 
        isValid: false, 
        errors: [error instanceof Error ? error.message : 'Syntax error'] 
      };
    }
  }
}

/**
 * Validation utility functions
 */
export class ValidationUtils {
  /**
   * Check if code contains only allowed patterns
   */
  static isCodeSafe(code: string): boolean {
    const validator = new ProcessCodeValidator();
    const result = validator.validateCode(code);
    
    return result.isValid && 
           result.securityIssues.filter(issue => 
             issue.severity === 'critical' || issue.severity === 'high'
           ).length === 0;
  }

  /**
   * Get a quick security score (0-100)
   */
  static getSecurityScore(code: string): number {
    const validator = new ProcessCodeValidator();
    const result = validator.validateCode(code);
    
    let score = 100;
    
    result.securityIssues.forEach(issue => {
      switch (issue.severity) {
        case 'critical': score -= 30; break;
        case 'high': score -= 20; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    });
    
    return Math.max(0, score);
  }

  /**
   * Sanitize code by removing dangerous patterns
   */
  static sanitizeCode(code: string): string {
    let sanitized = code;
    
    // Remove eval calls
    sanitized = sanitized.replace(/eval\s*\([^)]*\)/gi, '/* eval removed for security */');
    
    // Remove Function constructor calls
    sanitized = sanitized.replace(/new\s+Function\s*\([^)]*\)/gi, '/* Function constructor removed */');
    
    // Remove setTimeout/setInterval with string arguments
    sanitized = sanitized.replace(/setTimeout\s*\(\s*["'][^"']*["']/gi, 'setTimeout(function() { /* string code removed */ }');
    sanitized = sanitized.replace(/setInterval\s*\(\s*["'][^"']*["']/gi, 'setInterval(function() { /* string code removed */ }');
    
    return sanitized;
  }
}