import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ASTParserService } from '../ASTParserService';

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

describe('ASTParserService', () => {
  let parser: ASTParserService;

  beforeEach(() => {
    parser = new ASTParserService();
  });

  describe('parseFile', () => {
    it('should parse a simple function declaration', () => {
      const code = `
        /**
         * This is a test function
         */
        function testFunction(param1, param2) {
          return param1 + param2;
        }
      `;

      const result = parser.parseFile(code);

      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].name).toBe('testFunction');
      expect(result.functions[0].description).toBe('This is a test function');
      expect(result.functions[0].parameters).toHaveLength(2);
      expect(result.functions[0].parameters[0].name).toBe('param1');
      expect(result.functions[0].parameters[1].name).toBe('param2');
      expect(result.functions[0].isNested).toBe(false);
    });

    it('should parse arrow functions', () => {
      const code = `
        /**
         * Arrow function example
         */
        const arrowFunc = (x, y) => {
          return x * y;
        };
      `;

      const result = parser.parseFile(code);

      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].name).toBe('anonymous');
      expect(result.functions[0].description).toBe('Arrow function example');
      expect(result.functions[0].parameters).toHaveLength(2);
    });

    it('should parse function expressions', () => {
      const code = `
        /**
         * Function expression
         */
        const myFunc = function namedFunc(a, b) {
          return a - b;
        };
      `;

      const result = parser.parseFile(code);

      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].name).toBe('namedFunc');
      expect(result.functions[0].description).toBe('Function expression');
    });

    it('should handle nested functions', () => {
      const code = `
        /**
         * Outer function
         */
        function outerFunction() {
          /**
           * Inner function
           */
          function innerFunction() {
            return 'inner';
          }
          return innerFunction();
        }
      `;

      const result = parser.parseFile(code);

      expect(result.functions).toHaveLength(2);
      
      const outerFunc = result.functions.find(f => f.name === 'outerFunction');
      const innerFunc = result.functions.find(f => f.name === 'innerFunction');
      
      expect(outerFunc).toBeDefined();
      expect(innerFunc).toBeDefined();
      expect(outerFunc!.isNested).toBe(false);
      expect(innerFunc!.isNested).toBe(true);
      expect(innerFunc!.parentFunction).toBe(outerFunc!.id);
    });

    it('should parse function parameters with default values', () => {
      const code = `
        function funcWithDefaults(a, b = 10, c = "hello") {
          return a + b + c;
        }
      `;

      const result = parser.parseFile(code);

      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].parameters).toHaveLength(3);
      expect(result.functions[0].parameters[0].name).toBe('a');
      expect(result.functions[0].parameters[0].defaultValue).toBeUndefined();
      expect(result.functions[0].parameters[1].name).toBe('b');
      expect(result.functions[0].parameters[1].defaultValue).toBe('10');
      expect(result.functions[0].parameters[2].name).toBe('c');
      expect(result.functions[0].parameters[2].defaultValue).toBe('"hello"');
    });
  });

  describe('identifyFunctionCalls', () => {
    it('should identify function calls within functions', () => {
      const code = `
        function caller() {
          calledFunction();
          anotherFunction(1, 2);
        }
        
        function calledFunction() {
          return 'called';
        }
        
        function anotherFunction(a, b) {
          return a + b;
        }
      `;

      const result = parser.parseFile(code);

      expect(result.calls).toHaveLength(2);
      expect(result.calls[0].callerFunction).toBe('caller');
      expect(result.calls[0].calledFunction).toBe('calledFunction');
      expect(result.calls[1].callerFunction).toBe('caller');
      expect(result.calls[1].calledFunction).toBe('anotherFunction');
    });

    it('should identify method calls', () => {
      const code = `
        function testMethod() {
          obj.method();
          this.anotherMethod();
        }
      `;

      const result = parser.parseFile(code);

      expect(result.calls).toHaveLength(2);
      expect(result.calls[0].calledFunction).toBe('method');
      expect(result.calls[1].calledFunction).toBe('anotherMethod');
    });
  });

  describe('extractFunctions', () => {
    it('should extract function source code', () => {
      const code = `function simple() {
  return 42;
}`;

      const result = parser.parseFile(code);

      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].code).toContain('function simple()');
      expect(result.functions[0].code).toContain('return 42;');
    });

    it('should preserve source location information', () => {
      const code = `
function first() {
  return 1;
}

function second() {
  return 2;
}`;

      const result = parser.parseFile(code);

      expect(result.functions).toHaveLength(2);
      expect(result.functions[0].sourceLocation.start.line).toBe(2);
      expect(result.functions[1].sourceLocation.start.line).toBe(6);
    });
  });

  describe('comment preservation', () => {
    it('should preserve block comments', () => {
      const code = `
        /**
         * This is a block comment
         * with multiple lines
         */
        function commented() {}
        
        /* Single line block comment */
        function another() {}
      `;

      const result = parser.parseFile(code);

      expect(result.comments).toHaveLength(2);
      expect(result.comments[0].type).toBe('block');
      expect(result.comments[0].value).toContain('This is a block comment');
      expect(result.comments[1].type).toBe('block');
      expect(result.comments[1].value).toBe('Single line block comment');
    });

    it('should preserve line comments', () => {
      const code = `
        // This is a line comment
        function withLineComment() {
          // Another line comment
          return true;
        }
      `;

      const result = parser.parseFile(code);

      expect(result.comments).toHaveLength(2);
      expect(result.comments[0].type).toBe('line');
      expect(result.comments[0].value).toBe('This is a line comment');
      expect(result.comments[1].type).toBe('line');
      expect(result.comments[1].value).toBe('Another line comment');
    });

    it('should associate comments with functions', () => {
      const code = `
        /**
         * Function description
         */
        function described() {
          return 'described';
        }
      `;

      const result = parser.parseFile(code);

      expect(result.functions[0].description).toBe('Function description');
      expect(result.comments[0].associatedFunction).toBe('described');
    });
  });

  describe('dependency extraction', () => {
    it('should extract ES6 imports', () => {
      const code = `
        import React from 'react';
        import { useState, useEffect } from 'react';
        import * as utils from './utils';
        
        function component() {}
      `;

      const result = parser.parseFile(code);

      expect(result.dependencies).toHaveLength(3);
      expect(result.dependencies[0].name).toBe('react');
      expect(result.dependencies[0].type).toBe('import');
      expect(result.dependencies[1].name).toBe('react');
      expect(result.dependencies[2].name).toBe('./utils');
    });

    it('should extract CommonJS requires', () => {
      const code = `
        const fs = require('fs');
        const path = require('path');
        
        function readFile() {
          return fs.readFileSync('test.txt');
        }
      `;

      const result = parser.parseFile(code);

      expect(result.dependencies).toHaveLength(2);
      expect(result.dependencies[0].name).toBe('fs');
      expect(result.dependencies[0].type).toBe('require');
      expect(result.dependencies[1].name).toBe('path');
      expect(result.dependencies[1].type).toBe('require');
    });
  });

  describe('variable extraction', () => {
    it('should extract variable declarations', () => {
      const code = `
        const globalConst = 'global';
        let globalLet = 42;
        var globalVar = true;
        
        function testFunc() {
          const localConst = 'local';
          let localLet = 10;
        }
      `;

      const result = parser.parseFile(code);

      expect(result.variables).toHaveLength(5);
      
      const globalVars = result.variables.filter(v => v.scope === 'global');
      const functionVars = result.variables.filter(v => v.scope === 'function');
      
      expect(globalVars).toHaveLength(3);
      expect(functionVars).toHaveLength(2);
      
      expect(globalVars.find(v => v.name === 'globalConst')?.type).toBe('const');
      expect(globalVars.find(v => v.name === 'globalLet')?.type).toBe('let');
      expect(globalVars.find(v => v.name === 'globalVar')?.type).toBe('var');
    });
  });

  describe('external dependency processing', () => {
    it('should process external dependencies for a function', () => {
      const code = `
        function testFunction() {
          console.log('Hello, world!');
          setTimeout(() => {}, 1000);
        }
      `;

      const result = parser.processExternalDependencies(code, 'test-parent');

      expect(result.dependencies).toHaveLength(2);
      expect(result.childNodes).toHaveLength(2);
      expect(result.relationships).toHaveLength(2);

      const consoleLogDep = result.dependencies.find(dep => dep.name === 'console.log');
      expect(consoleLogDep).toBeDefined();
      expect(consoleLogDep?.type).toBe('function_call');
      expect(consoleLogDep?.isBuiltIn).toBe(true);

      const consoleLogNode = result.childNodes.find(node => node.data.functionName === 'console.log');
      expect(consoleLogNode).toBeDefined();
      expect(consoleLogNode?.type).toBe('external-function');
      expect(consoleLogNode?.parentId).toBe('test-parent');
    });

    it('should parse file with child nodes for external dependencies', () => {
      const code = `
        /**
         * Main function
         */
        function mainFunction() {
          console.log('Starting');
          Math.random();
        }

        /**
         * Helper function
         */
        function helperFunction() {
          JSON.parse('{}');
        }
      `;

      const result = parser.parseFileWithChildNodes(code);

      expect(result.functions).toHaveLength(2);
      expect(result.externalDependencyResults.size).toBe(2);

      const mainFuncId = result.functions.find(f => f.name === 'mainFunction')?.id;
      const helperFuncId = result.functions.find(f => f.name === 'helperFunction')?.id;

      expect(mainFuncId).toBeDefined();
      expect(helperFuncId).toBeDefined();

      const mainDeps = result.externalDependencyResults.get(mainFuncId!);
      const helperDeps = result.externalDependencyResults.get(helperFuncId!);

      expect(mainDeps?.dependencies).toHaveLength(2);
      expect(helperDeps?.dependencies).toHaveLength(1);

      expect(mainDeps?.dependencies.some(dep => dep.name === 'console.log')).toBe(true);
      expect(mainDeps?.dependencies.some(dep => dep.name === 'Math.random')).toBe(true);
      expect(helperDeps?.dependencies.some(dep => dep.name === 'JSON.parse')).toBe(true);
    });

    it('should handle functions with no external dependencies', () => {
      const code = `
        function pureFunction(a, b) {
          const result = a + b;
          return result;
        }
      `;

      const result = parser.processExternalDependencies(code, 'pure-parent');

      expect(result.dependencies).toHaveLength(0);
      expect(result.childNodes).toHaveLength(0);
      expect(result.relationships).toHaveLength(0);
    });

    it('should create proper scope context for child nodes', () => {
      const code = `
        function parentFunction(param1, param2) {
          console.log('test', param1);
        }
      `;

      const parentScope = {
        level: 0,
        variables: ['param1', 'param2'],
        functionName: 'parentFunction'
      };

      const result = parser.processExternalDependencies(code, 'parent-id', parentScope);

      expect(result.childNodes).toHaveLength(1);
      const childNode = result.childNodes[0];

      expect(childNode.scope).toBeDefined();
      expect(childNode.scope?.level).toBe(1);
      expect(childNode.scope?.parentScope).toBe(parentScope);
      expect(childNode.scope?.functionName).toBe('console.log');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      // Mock console methods to avoid noise in tests
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'group').mockImplementation(() => {});
      vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    });

    it('should throw error for invalid JavaScript', () => {
      const invalidCode = `
        function invalid( {
          return 'missing closing parenthesis';
        }
      `;

      expect(() => parser.parseFile(invalidCode)).toThrow();
    });

    it('should handle empty code', () => {
      const result = parser.parseFile('');

      expect(result.functions).toHaveLength(0);
      expect(result.calls).toHaveLength(0);
      expect(result.dependencies).toHaveLength(0);
      expect(result.variables).toHaveLength(0);
      expect(result.comments).toHaveLength(0);
    });

    it('should handle code with only comments', () => {
      const code = `
        /**
         * Just a comment
         */
        // Another comment
      `;

      const result = parser.parseFile(code);

      expect(result.functions).toHaveLength(0);
      expect(result.comments).toHaveLength(2);
    });

    it('should handle external dependency processing errors gracefully', () => {
      const invalidCode = `
        function invalid( {
          console.log('test');
        }
      `;

      expect(() => parser.processExternalDependencies(invalidCode, 'test-parent')).toThrow();
    });
  });

  describe('parseFileWithErrorHandling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      // Mock console methods to avoid noise in tests
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'group').mockImplementation(() => {});
      vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    });

    it('should successfully parse valid code', () => {
      const code = `
        /**
         * Valid function
         */
        function validFunction() {
          return 'valid';
        }
      `;

      const result = parser.parseFileWithErrorHandling(code, mockNotifications);

      expect(result.success).toBe(true);
      expect(result.structure).toBeDefined();
      expect(result.structure?.functions).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.partiallyParsed).toBe(false);
      expect(mockNotifications.showErrorToast).not.toHaveBeenCalled();
    });

    it('should handle syntax errors gracefully with user notifications', () => {
      const code = `
        function invalidFunction() {
          const x = ;
          return x;
        }
      `;

      const result = parser.parseFileWithErrorHandling(code, mockNotifications);

      expect(result.success).toBe(false);
      expect(result.structure).toBeUndefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('syntax');
      expect(result.partiallyParsed).toBe(false);
      
      // Check if any notification method was called (could be error or warning depending on error type)
      const notificationCalled = mockNotifications.showErrorToast.mock.calls.length > 0 ||
                                 mockNotifications.showWarningToast.mock.calls.length > 0 ||
                                 mockNotifications.showInfoToast.mock.calls.length > 0;
      expect(notificationCalled).toBe(true);
    });

    it('should continue parsing when individual extractors fail', () => {
      // Mock one of the extractors to throw an error
      const originalExtractFunctions = parser['functionExtractor'].extractFunctions;
      parser['functionExtractor'].extractFunctions = vi.fn().mockImplementation(() => {
        throw new Error('Function extraction failed');
      });

      const code = `
        function testFunction() {
          return 'test';
        }
      `;

      const result = parser.parseFileWithErrorHandling(code, mockNotifications);

      expect(result.success).toBe(true); // Should still succeed with partial data
      expect(result.structure).toBeDefined();
      expect(result.structure?.functions).toHaveLength(0); // Functions failed to extract
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.partiallyParsed).toBe(true);
      
      // Check if any notification method was called (could be error or warning depending on error type)
      const notificationCalled = mockNotifications.showErrorToast.mock.calls.length > 0 ||
                                 mockNotifications.showWarningToast.mock.calls.length > 0 ||
                                 mockNotifications.showInfoToast.mock.calls.length > 0;
      expect(notificationCalled).toBe(true);

      // Restore original method
      parser['functionExtractor'].extractFunctions = originalExtractFunctions;
    });

    it('should handle warnings from extractors', () => {
      // Mock call extractor to throw an error (should be treated as warning)
      const originalIdentifyFunctionCalls = parser['callExtractor'].identifyFunctionCalls;
      parser['callExtractor'].identifyFunctionCalls = vi.fn().mockImplementation(() => {
        throw new Error('Call extraction failed');
      });

      const code = `
        function testFunction() {
          return 'test';
        }
      `;

      const result = parser.parseFileWithErrorHandling(code, mockNotifications);

      expect(result.success).toBe(true);
      expect(result.structure).toBeDefined();
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].type).toBe('semantic');
      expect(mockNotifications.showInfoToast).toHaveBeenCalled();

      // Restore original method
      parser['callExtractor'].identifyFunctionCalls = originalIdentifyFunctionCalls;
    });

    it('should log errors to console with detailed formatting', () => {
      const code = `
        function invalidFunction() {
          const x = ;
        }
      `;

      parser.parseFileWithErrorHandling(code, mockNotifications);

      expect(console.group).toHaveBeenCalledWith('🚨 AST Parsing Errors');
      expect(console.error).toHaveBeenCalled();
      expect(console.groupEnd).toHaveBeenCalled();
    });

    it('should handle critical parsing failures', () => {
      // Mock Babel parser to throw a critical error
      const originalParse = parser['babelParser'].parse;
      parser['babelParser'].parse = vi.fn().mockImplementation(() => {
        throw new Error('Critical parsing failure');
      });

      const code = `function test() { return 'test'; }`;

      const result = parser.parseFileWithErrorHandling(code, mockNotifications);

      expect(result.success).toBe(false);
      expect(result.structure).toBeUndefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Critical parsing failure');
      expect(result.partiallyParsed).toBe(false);
      
      // Check if any notification method was called (could be error or warning depending on error type)
      const notificationCalled = mockNotifications.showErrorToast.mock.calls.length > 0 ||
                                 mockNotifications.showWarningToast.mock.calls.length > 0 ||
                                 mockNotifications.showInfoToast.mock.calls.length > 0;
      expect(notificationCalled).toBe(true);

      // Restore original method
      parser['babelParser'].parse = originalParse;
    });

    it('should work without notification hook', () => {
      const code = `
        function invalidFunction() {
          const x = ;
        }
      `;

      const result = parser.parseFileWithErrorHandling(code);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // Should not throw error when no notification hook provided
    });

    it('should handle dependency extraction errors as warnings', () => {
      // Mock dependency extractor to throw an error
      const originalExtractDependencies = parser['dependencyExtractor'].extractDependencies;
      parser['dependencyExtractor'].extractDependencies = vi.fn().mockImplementation(() => {
        throw new Error('Dependency extraction failed');
      });

      const code = `
        function testFunction() {
          return 'test';
        }
      `;

      const result = parser.parseFileWithErrorHandling(code, mockNotifications);

      expect(result.success).toBe(true);
      expect(result.structure).toBeDefined();
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].type).toBe('dependency');
      expect(result.warnings[0].suggestion).toContain('External dependencies may not be displayed correctly');

      // Restore original method
      parser['dependencyExtractor'].extractDependencies = originalExtractDependencies;
    });

    it('should handle variable extraction errors as warnings', () => {
      // Mock variable extractor to throw an error
      const originalExtractVariables = parser['variableExtractor'].extractVariables;
      parser['variableExtractor'].extractVariables = vi.fn().mockImplementation(() => {
        throw new Error('Variable extraction failed');
      });

      const code = `
        function testFunction() {
          const x = 'test';
          return x;
        }
      `;

      const result = parser.parseFileWithErrorHandling(code, mockNotifications);

      expect(result.success).toBe(true);
      expect(result.structure).toBeDefined();
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].type).toBe('semantic');
      expect(result.warnings[0].suggestion).toContain('Variable configuration may not be available');

      // Restore original method
      parser['variableExtractor'].extractVariables = originalExtractVariables;
    });

    it('should provide appropriate error suggestions', () => {
      const code = `
        function testFunction() {
          const x = ;
        }
      `;

      const result = parser.parseFileWithErrorHandling(code, mockNotifications);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].suggestion).toBeDefined();
      expect(result.errors[0].suggestion).toContain('semicolons, brackets, or quotes');
    });

    it('should handle multiple error types correctly', () => {
      // Create a scenario with both syntax errors and extractor failures
      const originalExtractFunctions = parser['functionExtractor'].extractFunctions;
      parser['functionExtractor'].extractFunctions = vi.fn().mockImplementation(() => {
        throw new Error('Function extraction failed');
      });

      const code = `
        function invalidFunction() {
          const x = ;
        }
      `;

      const result = parser.parseFileWithErrorHandling(code, mockNotifications);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.partiallyParsed).toBe(false);

      // Check if any notification method was called (could be error or warning depending on error type)
      const notificationCalled = mockNotifications.showErrorToast.mock.calls.length > 0 ||
                                 mockNotifications.showWarningToast.mock.calls.length > 0 ||
                                 mockNotifications.showInfoToast.mock.calls.length > 0;
      expect(notificationCalled).toBe(true);

      // Restore original method
      parser['functionExtractor'].extractFunctions = originalExtractFunctions;
    });
  });

  describe('analyzeScopeViolations', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      // Mock console methods to avoid noise in tests
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'info').mockImplementation(() => {});
      vi.spyOn(console, 'group').mockImplementation(() => {});
      vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    });

    it('should analyze scope violations in parsed structure', () => {
      const code = `
        function parentFunction() {
          function childFunction() {
            return siblingFunction(); // This should trigger a scope violation
          }
          
          function siblingFunction() {
            return "sibling";
          }
          
          return childFunction();
        }
      `;

      const result = parser.parseFile(code);
      const violations = parser.analyzeScopeViolations(result, mockNotifications);

      expect(violations.length).toBeGreaterThan(0);
      const scopeViolation = violations.find(v => v.type === 'invalid_scope');
      expect(scopeViolation).toBeDefined();
      expect(mockNotifications.showWarningToast).toHaveBeenCalled();
    });

    it('should handle scope analysis errors gracefully', () => {
      const invalidStructure = {
        functions: null as any,
        calls: [],
        dependencies: [],
        variables: [],
        comments: []
      };

      const violations = parser.analyzeScopeViolations(invalidStructure, mockNotifications);

      expect(violations).toHaveLength(0);
      expect(console.warn).toHaveBeenCalledWith('Failed to analyze scope violations:', expect.any(Error));
    });

    it('should work without notification hook', () => {
      const code = `
        function validFunction() {
          return "valid";
        }
      `;

      const result = parser.parseFile(code);
      const violations = parser.analyzeScopeViolations(result);

      expect(violations).toHaveLength(0);
      // Should not throw error when no notification hook provided
    });
  });

  describe('getScopeViolationIndicators', () => {
    it('should create visual indicators for scope violations', () => {
      const code = `
        function childFunction() {
          return "child";
        }
      `;

      // Manually create a structure with a scope violation
      const result = parser.parseFile(code);
      result.functions[0].isNested = true;
      result.functions[0].parentFunction = 'nonExistentParent';

      const indicators = parser.getScopeViolationIndicators(result);

      expect(indicators.size).toBeGreaterThan(0);
      const functionIndicators = indicators.get(result.functions[0].id);
      expect(functionIndicators).toBeDefined();
      expect(functionIndicators?.[0].type).toBe('missing_parent');
      expect(functionIndicators?.[0].severity).toBe('error');
    });

    it('should handle indicator creation errors gracefully', () => {
      const invalidStructure = {
        functions: null as any,
        calls: [],
        dependencies: [],
        variables: [],
        comments: []
      };

      const indicators = parser.getScopeViolationIndicators(invalidStructure);

      expect(indicators.size).toBe(0);
      expect(console.warn).toHaveBeenCalledWith('Failed to create scope violation indicators:', expect.any(Error));
    });
  });
});