import { describe, it, expect, beforeEach } from 'vitest';
import { ASTParserService } from '../ASTParserService';

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
});