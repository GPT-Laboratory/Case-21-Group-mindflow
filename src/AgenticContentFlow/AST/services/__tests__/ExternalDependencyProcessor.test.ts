/** @format */

import { describe, it, expect, beforeEach } from 'vitest';
import { externalDependencyProcessor, ExternalDependency } from '../ExternalDependencyProcessor';
import { BabelParser } from '../../parsers/BabelParser';
import { ScopeContext } from '../../../Node/interfaces/ContainerNodeInterfaces';

describe('ExternalDependencyProcessor', () => {
  let parser: BabelParser;

  beforeEach(() => {
    parser = new BabelParser();
  });

  describe('Function Call Detection', () => {
    it('should detect console.log calls', () => {
      const code = `
        function testFunction() {
          console.log('Hello, world!');
          console.error('Error message');
        }
      `;

      const ast = parser.parse(code);
      const result = externalDependencyProcessor.processExternalDependencies(ast, 'test-parent');

      expect(result.dependencies).toHaveLength(2);
      expect(result.dependencies[0].name).toBe('console.log');
      expect(result.dependencies[0].type).toBe('function_call');
      expect(result.dependencies[0].isBuiltIn).toBe(true);
      expect(result.dependencies[0].arguments).toEqual(['Hello, world!']);

      expect(result.dependencies[1].name).toBe('console.error');
      expect(result.dependencies[1].type).toBe('function_call');
      expect(result.dependencies[1].isBuiltIn).toBe(true);
      expect(result.dependencies[1].arguments).toEqual(['Error message']);
    });

    it('should detect setTimeout calls', () => {
      const code = `
        function delayedFunction() {
          setTimeout(() => {
            console.log('Delayed');
          }, 1000);
        }
      `;

      const ast = parser.parse(code);
      const result = externalDependencyProcessor.processExternalDependencies(ast, 'test-parent');

      const setTimeoutDep = result.dependencies.find(dep => dep.name === 'setTimeout');
      expect(setTimeoutDep).toBeDefined();
      expect(setTimeoutDep?.type).toBe('function_call');
      expect(setTimeoutDep?.isBuiltIn).toBe(true);
    });

    it('should detect Math object calls', () => {
      const code = `
        function mathFunction() {
          const result = Math.max(1, 2, 3);
          const random = Math.random();
          return result + random;
        }
      `;

      const ast = parser.parse(code);
      const result = externalDependencyProcessor.processExternalDependencies(ast, 'test-parent');

      const mathMaxDep = result.dependencies.find(dep => dep.name === 'Math.max');
      const mathRandomDep = result.dependencies.find(dep => dep.name === 'Math.random');

      expect(mathMaxDep).toBeDefined();
      expect(mathMaxDep?.type).toBe('function_call');
      expect(mathMaxDep?.isBuiltIn).toBe(true);

      expect(mathRandomDep).toBeDefined();
      expect(mathRandomDep?.type).toBe('function_call');
      expect(mathRandomDep?.isBuiltIn).toBe(true);
    });
  });

  describe('Import Detection', () => {
    it('should detect ES6 import statements', () => {
      const code = `
        import React from 'react';
        import { useState, useEffect } from 'react';
        import * as utils from './utils';
      `;

      const ast = parser.parse(code);
      const result = externalDependencyProcessor.processExternalDependencies(ast, 'test-parent');

      expect(result.dependencies).toHaveLength(4);

      const reactImport = result.dependencies.find(dep => dep.name === 'React');
      expect(reactImport).toBeDefined();
      expect(reactImport?.type).toBe('import');
      expect(reactImport?.modulePath).toBe('react');
      expect(reactImport?.isBuiltIn).toBe(true);

      const useStateImport = result.dependencies.find(dep => dep.name === 'useState');
      expect(useStateImport).toBeDefined();
      expect(useStateImport?.type).toBe('import');

      const utilsImport = result.dependencies.find(dep => dep.name === 'utils');
      expect(utilsImport).toBeDefined();
      expect(utilsImport?.type).toBe('import');
      expect(utilsImport?.modulePath).toBe('./utils');
      expect(utilsImport?.isBuiltIn).toBe(false);
    });
  });

  describe('Require Detection', () => {
    it('should detect CommonJS require statements', () => {
      const code = `
        const fs = require('fs');
        const path = require('path');
        const customModule = require('./custom');
      `;

      const ast = parser.parse(code);
      const result = externalDependencyProcessor.processExternalDependencies(ast, 'test-parent');

      expect(result.dependencies).toHaveLength(3);

      const fsRequire = result.dependencies.find(dep => dep.name === 'fs');
      expect(fsRequire).toBeDefined();
      expect(fsRequire?.type).toBe('require');
      expect(fsRequire?.modulePath).toBe('fs');
      expect(fsRequire?.isBuiltIn).toBe(true);

      const customRequire = result.dependencies.find(dep => dep.name === 'customModule');
      expect(customRequire).toBeDefined();
      expect(customRequire?.type).toBe('require');
      expect(customRequire?.modulePath).toBe('./custom');
      expect(customRequire?.isBuiltIn).toBe(false);
    });
  });

  describe('Child Node Creation', () => {
    it('should create child nodes for external dependencies', () => {
      const code = `
        function testFunction() {
          console.log('test');
          setTimeout(() => {}, 1000);
        }
      `;

      const ast = parser.parse(code);
      const result = externalDependencyProcessor.processExternalDependencies(ast, 'test-parent');

      expect(result.childNodes).toHaveLength(2);
      expect(result.relationships).toHaveLength(2);

      const consoleNode = result.childNodes.find(node => node.data.functionName === 'console.log');
      expect(consoleNode).toBeDefined();
      expect(consoleNode?.type).toBe('external-function');
      expect(consoleNode?.parentId).toBe('test-parent');
      expect(consoleNode?.canContainChildren).toBe(false);
      expect(consoleNode?.data.dependencyType).toBe('function_call');
      expect(consoleNode?.data.isBuiltIn).toBe(true);

      const timeoutNode = result.childNodes.find(node => node.data.functionName === 'setTimeout');
      expect(timeoutNode).toBeDefined();
      expect(timeoutNode?.type).toBe('external-function');
      expect(timeoutNode?.parentId).toBe('test-parent');
    });

    it('should create proper scope context for child nodes', () => {
      const parentScope: ScopeContext = {
        level: 0,
        variables: ['parentVar'],
        functionName: 'parentFunction'
      };

      const code = `
        function testFunction() {
          console.log('test', parentVar);
        }
      `;

      const ast = parser.parse(code);
      const result = externalDependencyProcessor.processExternalDependencies(ast, 'test-parent', parentScope);

      expect(result.childNodes).toHaveLength(1);
      const childNode = result.childNodes[0];

      expect(childNode.scope).toBeDefined();
      expect(childNode.scope?.level).toBe(1);
      expect(childNode.scope?.parentScope).toBe(parentScope);
      expect(childNode.scope?.functionName).toBe('console.log');
      expect(childNode.scope?.variables).toEqual(['test', 'parentVar']);
    });
  });

  describe('Relationship Management', () => {
    it('should create proper parent-child relationships', () => {
      const code = `
        function testFunction() {
          console.log('test');
        }
      `;

      const ast = parser.parse(code);
      const result = externalDependencyProcessor.processExternalDependencies(ast, 'test-parent');

      expect(result.relationships).toHaveLength(1);
      const relationship = result.relationships[0];

      expect(relationship.parentId).toBe('test-parent');
      expect(relationship.childId).toBe('test-parent-ext-dep-0');
      expect(relationship.relationshipType).toBe('external_dependency');
      expect(relationship.scope).toBeDefined();
    });
  });

  describe('Complex Code Analysis', () => {
    it('should handle nested function calls and mixed dependencies', () => {
      const code = `
        import React from 'react';
        const fs = require('fs');
        
        function complexFunction() {
          console.log('Starting process');
          
          const data = fs.readFileSync('./data.txt', 'utf8');
          const parsed = JSON.parse(data);
          
          setTimeout(() => {
            console.log('Process completed');
            Math.random();
          }, 1000);
          
          return parsed;
        }
      `;

      const ast = parser.parse(code);
      const result = externalDependencyProcessor.processExternalDependencies(ast, 'complex-parent');

      // Should detect: React import, fs require, console.log calls, fs.readFileSync, JSON.parse, setTimeout, Math.random
      expect(result.dependencies.length).toBeGreaterThan(5);

      const importDeps = result.dependencies.filter(dep => dep.type === 'import');
      const requireDeps = result.dependencies.filter(dep => dep.type === 'require');
      const functionCallDeps = result.dependencies.filter(dep => dep.type === 'function_call');

      expect(importDeps).toHaveLength(1);
      expect(requireDeps).toHaveLength(1);
      expect(functionCallDeps.length).toBeGreaterThan(3);

      // Check specific dependencies
      expect(result.dependencies.some(dep => dep.name === 'React')).toBe(true);
      expect(result.dependencies.some(dep => dep.name === 'fs')).toBe(true);
      expect(result.dependencies.some(dep => dep.name === 'console.log')).toBe(true);
      expect(result.dependencies.some(dep => dep.name === 'JSON.parse')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty code', () => {
      const code = '';
      const ast = parser.parse(code);
      const result = externalDependencyProcessor.processExternalDependencies(ast, 'empty-parent');

      expect(result.dependencies).toHaveLength(0);
      expect(result.childNodes).toHaveLength(0);
      expect(result.relationships).toHaveLength(0);
    });

    it('should handle code with only local variables and functions', () => {
      const code = `
        function localFunction() {
          const localVar = 'test';
          return localVar;
        }
        
        const anotherLocal = localFunction();
      `;

      const ast = parser.parse(code);
      const result = externalDependencyProcessor.processExternalDependencies(ast, 'local-parent');

      // Should not detect any external dependencies
      expect(result.dependencies).toHaveLength(0);
    });

    it('should handle complex member expressions', () => {
      const code = `
        function complexMember() {
          window.document.getElementById('test').addEventListener('click', () => {});
          process.env.NODE_ENV;
        }
      `;

      const ast = parser.parse(code);
      const result = externalDependencyProcessor.processExternalDependencies(ast, 'complex-member-parent');

      expect(result.dependencies.length).toBeGreaterThan(0);
      
      // Should detect window.document.getElementById and process.env.NODE_ENV
      const windowDep = result.dependencies.find(dep => dep.name.includes('window'));
      const processDep = result.dependencies.find(dep => dep.name.includes('process'));

      expect(windowDep || processDep).toBeDefined();
    });
  });
});