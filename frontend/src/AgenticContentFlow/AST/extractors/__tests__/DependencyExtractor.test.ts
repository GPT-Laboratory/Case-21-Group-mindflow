import * as t from '@babel/types';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DependencyExtractor } from '../DependencyExtractor';
import { ASTTraverser, NodeVisitor } from '../../interfaces/CoreInterfaces';
import { ExternalDependency } from '../../types/ASTTypes';
import { ASTError } from '../../utils/ValidationUtils';

describe('DependencyExtractor', () => {
  let extractor: DependencyExtractor;
  let mockTraverser: ASTTraverser;

  beforeEach(() => {
    mockTraverser = {
      traverse: vi.fn()
    };
    extractor = new DependencyExtractor(mockTraverser);
  });

  describe('constructor', () => {
    it('should create instance with valid traverser', () => {
      expect(extractor).toBeInstanceOf(DependencyExtractor);
    });

    it('should throw ASTError when traverser is null', () => {
      expect(() => new DependencyExtractor(null as any)).toThrow(ASTError);
    });

    it('should throw ASTError when traverser is undefined', () => {
      expect(() => new DependencyExtractor(undefined as any)).toThrow(ASTError);
    });
  });

  describe('extract', () => {
    const mockAST: t.Program = {
      type: 'Program',
      body: [],
      directives: [],
      sourceType: 'module'
    };

    it('should extract import dependencies correctly', () => {
      const importNode: t.ImportDeclaration = {
        type: 'ImportDeclaration',
        specifiers: [],
        source: t.stringLiteral('react')
      };

      vi.mocked(mockTraverser.traverse).mockImplementation((node, visitor) => {
        visitor.visit(importNode);
      });

      const result = extractor.extract(mockAST);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'react',
        type: 'import',
        source: 'react'
      });
      expect(mockTraverser.traverse).toHaveBeenCalledWith(mockAST, expect.any(Object));
    });

    it('should extract require dependencies correctly', () => {
      const requireNode: t.CallExpression = {
        type: 'CallExpression',
        callee: t.identifier('require'),
        arguments: [t.stringLiteral('lodash')]
      };

      vi.mocked(mockTraverser.traverse).mockImplementation((node, visitor) => {
        visitor.visit(requireNode);
      });

      const result = extractor.extract(mockAST);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'lodash',
        type: 'require',
        source: 'lodash'
      });
    });

    it('should extract both import and require dependencies', () => {
      const importNode: t.ImportDeclaration = {
        type: 'ImportDeclaration',
        specifiers: [],
        source: t.stringLiteral('react')
      };

      const requireNode: t.CallExpression = {
        type: 'CallExpression',
        callee: t.identifier('require'),
        arguments: [t.stringLiteral('lodash')]
      };

      vi.mocked(mockTraverser.traverse).mockImplementation((node, visitor) => {
        visitor.visit(importNode);
        visitor.visit(requireNode);
      });

      const result = extractor.extract(mockAST);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'react',
        type: 'import',
        source: 'react'
      });
      expect(result[1]).toEqual({
        name: 'lodash',
        type: 'require',
        source: 'lodash'
      });
    });

    it('should ignore non-dependency nodes', () => {
      const functionNode: t.FunctionDeclaration = {
        type: 'FunctionDeclaration',
        id: t.identifier('test'),
        params: [],
        body: t.blockStatement([])
      };

      vi.mocked(mockTraverser.traverse).mockImplementation((node, visitor) => {
        visitor.visit(functionNode);
      });

      const result = extractor.extract(mockAST);

      expect(result).toHaveLength(0);
    });

    it('should handle empty AST', () => {
      vi.mocked(mockTraverser.traverse).mockImplementation((node, visitor) => {
        // No nodes to visit
      });

      const result = extractor.extract(mockAST);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should throw ASTError for invalid AST node', () => {
      expect(() => extractor.extract(null as any)).toThrow(ASTError);
      expect(() => extractor.extract(undefined as any)).toThrow(ASTError);
      expect(() => extractor.extract({} as any)).toThrow(ASTError);
    });

    it('should handle traversal errors gracefully', () => {
      vi.mocked(mockTraverser.traverse).mockImplementation(() => {
        throw new Error('Traversal failed');
      });

      expect(() => extractor.extract(mockAST)).toThrow(ASTError);
    });

    it('should remove duplicate dependencies', () => {
      const importNode1: t.ImportDeclaration = {
        type: 'ImportDeclaration',
        specifiers: [],
        source: t.stringLiteral('react')
      };

      const importNode2: t.ImportDeclaration = {
        type: 'ImportDeclaration',
        specifiers: [],
        source: t.stringLiteral('react')
      };

      vi.mocked(mockTraverser.traverse).mockImplementation((node, visitor) => {
        visitor.visit(importNode1);
        visitor.visit(importNode2);
      });

      const result = extractor.extract(mockAST);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'react',
        type: 'import',
        source: 'react'
      });
    });

    it('should sort dependencies by type then by name', () => {
      const requireNode: t.CallExpression = {
        type: 'CallExpression',
        callee: t.identifier('require'),
        arguments: [t.stringLiteral('zlib')]
      };

      const importNode: t.ImportDeclaration = {
        type: 'ImportDeclaration',
        specifiers: [],
        source: t.stringLiteral('axios')
      };

      vi.mocked(mockTraverser.traverse).mockImplementation((node, visitor) => {
        visitor.visit(requireNode); // Add require first
        visitor.visit(importNode);  // Add import second
      });

      const result = extractor.extract(mockAST);

      expect(result).toHaveLength(2);
      // Import should come before require due to sorting
      expect(result[0]).toEqual({
        name: 'axios',
        type: 'import',
        source: 'axios'
      });
      expect(result[1]).toEqual({
        name: 'zlib',
        type: 'require',
        source: 'zlib'
      });
    });
  });

  describe('import dependency extraction', () => {
    const mockAST: t.Program = {
      type: 'Program',
      body: [],
      directives: [],
      sourceType: 'module'
    };

    it('should handle import with non-string source gracefully', () => {
      const invalidImportNode = {
        type: 'ImportDeclaration',
        specifiers: [],
        source: { type: 'Identifier', name: 'dynamicImport' } // Invalid: should be string literal
      };

      vi.mocked(mockTraverser.traverse).mockImplementation((node, visitor) => {
        visitor.visit(invalidImportNode as any);
      });

      const result = extractor.extract(mockAST);

      // Should handle error gracefully and return empty array
      expect(result).toHaveLength(0);
    });

    it('should handle import with empty source string', () => {
      const importNode: t.ImportDeclaration = {
        type: 'ImportDeclaration',
        specifiers: [],
        source: t.stringLiteral('')
      };

      vi.mocked(mockTraverser.traverse).mockImplementation((node, visitor) => {
        visitor.visit(importNode);
      });

      const result = extractor.extract(mockAST);

      // Should handle validation error gracefully
      expect(result).toHaveLength(0);
    });

    it('should extract scoped package imports', () => {
      const importNode: t.ImportDeclaration = {
        type: 'ImportDeclaration',
        specifiers: [],
        source: t.stringLiteral('@babel/types')
      };

      vi.mocked(mockTraverser.traverse).mockImplementation((node, visitor) => {
        visitor.visit(importNode);
      });

      const result = extractor.extract(mockAST);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: '@babel/types',
        type: 'import',
        source: '@babel/types'
      });
    });

    it('should extract relative path imports', () => {
      const importNode: t.ImportDeclaration = {
        type: 'ImportDeclaration',
        specifiers: [],
        source: t.stringLiteral('./utils/helper')
      };

      vi.mocked(mockTraverser.traverse).mockImplementation((node, visitor) => {
        visitor.visit(importNode);
      });

      const result = extractor.extract(mockAST);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: './utils/helper',
        type: 'import',
        source: './utils/helper'
      });
    });
  });

  describe('require dependency extraction', () => {
    const mockAST: t.Program = {
      type: 'Program',
      body: [],
      directives: [],
      sourceType: 'module'
    };

    it('should handle require with no arguments gracefully', () => {
      const requireNode: t.CallExpression = {
        type: 'CallExpression',
        callee: t.identifier('require'),
        arguments: []
      };

      vi.mocked(mockTraverser.traverse).mockImplementation((node, visitor) => {
        visitor.visit(requireNode);
      });

      const result = extractor.extract(mockAST);

      // Should handle error gracefully and return empty array
      expect(result).toHaveLength(0);
    });

    it('should handle require with non-string argument gracefully', () => {
      const requireNode: t.CallExpression = {
        type: 'CallExpression',
        callee: t.identifier('require'),
        arguments: [t.identifier('dynamicModule')] // Invalid: should be string literal
      };

      vi.mocked(mockTraverser.traverse).mockImplementation((node, visitor) => {
        visitor.visit(requireNode);
      });

      const result = extractor.extract(mockAST);

      // Should handle error gracefully and return empty array
      expect(result).toHaveLength(0);
    });

    it('should handle require with empty string argument', () => {
      const requireNode: t.CallExpression = {
        type: 'CallExpression',
        callee: t.identifier('require'),
        arguments: [t.stringLiteral('')]
      };

      vi.mocked(mockTraverser.traverse).mockImplementation((node, visitor) => {
        visitor.visit(requireNode);
      });

      const result = extractor.extract(mockAST);

      // Should handle validation error gracefully
      expect(result).toHaveLength(0);
    });

    it('should ignore non-require call expressions', () => {
      const callNode: t.CallExpression = {
        type: 'CallExpression',
        callee: t.identifier('someOtherFunction'),
        arguments: [t.stringLiteral('argument')]
      };

      vi.mocked(mockTraverser.traverse).mockImplementation((node, visitor) => {
        visitor.visit(callNode);
      });

      const result = extractor.extract(mockAST);

      expect(result).toHaveLength(0);
    });

    it('should ignore member expression calls', () => {
      const memberCallNode: t.CallExpression = {
        type: 'CallExpression',
        callee: t.memberExpression(t.identifier('obj'), t.identifier('require')),
        arguments: [t.stringLiteral('module')]
      };

      vi.mocked(mockTraverser.traverse).mockImplementation((node, visitor) => {
        visitor.visit(memberCallNode);
      });

      const result = extractor.extract(mockAST);

      expect(result).toHaveLength(0);
    });

    it('should extract built-in module requires', () => {
      const requireNode: t.CallExpression = {
        type: 'CallExpression',
        callee: t.identifier('require'),
        arguments: [t.stringLiteral('fs')]
      };

      vi.mocked(mockTraverser.traverse).mockImplementation((node, visitor) => {
        visitor.visit(requireNode);
      });

      const result = extractor.extract(mockAST);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'fs',
        type: 'require',
        source: 'fs'
      });
    });
  });

  describe('error handling', () => {
    const mockAST: t.Program = {
      type: 'Program',
      body: [],
      directives: [],
      sourceType: 'module'
    };

    it('should handle individual node extraction errors gracefully', () => {
      const validImportNode: t.ImportDeclaration = {
        type: 'ImportDeclaration',
        specifiers: [],
        source: t.stringLiteral('valid-module')
      };

      const invalidNode = {
        type: 'ImportDeclaration',
        specifiers: [],
        source: null // Invalid source
      };

      vi.mocked(mockTraverser.traverse).mockImplementation((node, visitor) => {
        visitor.visit(validImportNode);
        visitor.visit(invalidNode as any);
      });

      const result = extractor.extract(mockAST);

      // Should extract the valid dependency and skip the invalid one
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'valid-module',
        type: 'import',
        source: 'valid-module'
      });
    });

    it('should provide meaningful error messages', () => {
      vi.mocked(mockTraverser.traverse).mockImplementation(() => {
        throw new Error('Mock traversal error');
      });

      expect(() => extractor.extract(mockAST)).toThrow(ASTError);
      expect(() => extractor.extract(mockAST)).toThrow(/Failed to extract dependencies from AST/);
    });
  });

  describe('canHandle', () => {
    it('should return true for import declarations', () => {
      const importNode: t.ImportDeclaration = {
        type: 'ImportDeclaration',
        specifiers: [],
        source: t.stringLiteral('module')
      };

      expect((extractor as any).canHandle(importNode)).toBe(true);
    });

    it('should return true for require calls', () => {
      const requireNode: t.CallExpression = {
        type: 'CallExpression',
        callee: t.identifier('require'),
        arguments: [t.stringLiteral('module')]
      };

      expect((extractor as any).canHandle(requireNode)).toBe(true);
    });

    it('should return false for other node types', () => {
      const functionNode: t.FunctionDeclaration = {
        type: 'FunctionDeclaration',
        id: t.identifier('test'),
        params: [],
        body: t.blockStatement([])
      };

      expect((extractor as any).canHandle(functionNode)).toBe(false);
    });

    it('should return false for non-require call expressions', () => {
      const callNode: t.CallExpression = {
        type: 'CallExpression',
        callee: t.identifier('otherFunction'),
        arguments: [t.stringLiteral('arg')]
      };

      expect((extractor as any).canHandle(callNode)).toBe(false);
    });
  });

  describe('validation', () => {
    it('should validate dependency objects correctly', () => {
      const validDependency: ExternalDependency = {
        name: 'test-module',
        type: 'import',
        source: 'test-module'
      };

      expect(() => (extractor as any).validateDependency(validDependency)).not.toThrow();
    });

    it('should reject invalid dependency objects', () => {
      const invalidDependencies = [
        null,
        undefined,
        {},
        { name: '', type: 'import' },
        { name: 'test', type: 'invalid' },
        { name: 'test', type: 'import', source: 123 }
      ];

      invalidDependencies.forEach(dep => {
        expect(() => (extractor as any).validateDependency(dep)).toThrow(ASTError);
      });
    });

    it('should validate dependency sources correctly', () => {
      expect(() => (extractor as any).validateDependencySource('valid-source')).not.toThrow();
      expect(() => (extractor as any).validateDependencySource('')).toThrow(ASTError);
      expect(() => (extractor as any).validateDependencySource(null)).toThrow(ASTError);
      expect(() => (extractor as any).validateDependencySource(123)).toThrow(ASTError);
    });
  });

  describe('integration with BaseExtractor', () => {
    it('should use extractWithTemplate method', () => {
      const mockAST: t.Program = {
        type: 'Program',
        body: [],
        directives: [],
        sourceType: 'module'
      };

      vi.mocked(mockTraverser.traverse).mockImplementation((node, visitor) => {
        // No dependencies to extract
      });

      const result = extractor.extractWithTemplate(mockAST);

      expect(result).toEqual([]);
      expect(mockTraverser.traverse).toHaveBeenCalled();
    });

    it('should handle pre-processing validation', () => {
      expect(() => extractor.extractWithTemplate(null as any)).toThrow(ASTError);
    });
  });
});