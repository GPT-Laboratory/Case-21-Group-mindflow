import * as t from '@babel/types';
import { NodeUtils } from '../NodeUtils';
import { describe, expect, it } from 'vitest';


describe('NodeUtils', () => {
  describe('isValidNode', () => {
    it('should return true for valid AST nodes', () => {
      const validNode = { type: 'Identifier', name: 'test' };
      expect(NodeUtils.isValidNode(validNode)).toBe(true);
    });

    it('should return false for null or undefined', () => {
      expect(NodeUtils.isValidNode(null)).toBe(false);
      expect(NodeUtils.isValidNode(undefined)).toBe(false);
    });

    it('should return false for objects without type property', () => {
      expect(NodeUtils.isValidNode({ name: 'test' })).toBe(false);
      expect(NodeUtils.isValidNode({})).toBe(false);
    });

    it('should return false for primitive values', () => {
      expect(NodeUtils.isValidNode('string')).toBe(false);
      expect(NodeUtils.isValidNode(123)).toBe(false);
      expect(NodeUtils.isValidNode(true)).toBe(false);
    });
  });

  describe('isFunctionNode', () => {
    it('should return true for function declarations', () => {
      const node = t.functionDeclaration(
        t.identifier('test'),
        [],
        t.blockStatement([])
      );
      expect(NodeUtils.isFunctionNode(node)).toBe(true);
    });

    it('should return true for function expressions', () => {
      const node = t.functionExpression(
        t.identifier('test'),
        [],
        t.blockStatement([])
      );
      expect(NodeUtils.isFunctionNode(node)).toBe(true);
    });

    it('should return true for arrow functions', () => {
      const node = t.arrowFunctionExpression(
        [],
        t.blockStatement([])
      );
      expect(NodeUtils.isFunctionNode(node)).toBe(true);
    });

    it('should return false for non-function nodes', () => {
      const node = t.identifier('test');
      expect(NodeUtils.isFunctionNode(node)).toBe(false);
    });
  });

  describe('isMethodDefinition', () => {
    it('should return true for class methods', () => {
      const node = t.classMethod(
        'method',
        t.identifier('test'),
        [],
        t.blockStatement([])
      );
      expect(NodeUtils.isMethodDefinition(node)).toBe(true);
    });

    it('should return true for object methods', () => {
      const node = t.objectMethod(
        'method',
        t.identifier('test'),
        [],
        t.blockStatement([])
      );
      expect(NodeUtils.isMethodDefinition(node)).toBe(true);
    });

    it('should return false for non-method nodes', () => {
      const node = t.identifier('test');
      expect(NodeUtils.isMethodDefinition(node)).toBe(false);
    });
  });

  describe('isVariableDeclaration', () => {
    it('should return true for variable declarations', () => {
      const node = t.variableDeclaration('const', [
        t.variableDeclarator(t.identifier('test'))
      ]);
      expect(NodeUtils.isVariableDeclaration(node)).toBe(true);
    });

    it('should return false for non-variable nodes', () => {
      const node = t.identifier('test');
      expect(NodeUtils.isVariableDeclaration(node)).toBe(false);
    });
  });

  describe('isCallExpression', () => {
    it('should return true for call expressions', () => {
      const node = t.callExpression(t.identifier('test'), []);
      expect(NodeUtils.isCallExpression(node)).toBe(true);
    });

    it('should return false for non-call nodes', () => {
      const node = t.identifier('test');
      expect(NodeUtils.isCallExpression(node)).toBe(false);
    });
  });

  describe('isImportDeclaration', () => {
    it('should return true for import declarations', () => {
      const node = t.importDeclaration([], t.stringLiteral('module'));
      expect(NodeUtils.isImportDeclaration(node)).toBe(true);
    });

    it('should return false for non-import nodes', () => {
      const node = t.identifier('test');
      expect(NodeUtils.isImportDeclaration(node)).toBe(false);
    });
  });

  describe('getFunctionName', () => {
    it('should return function name for function declarations', () => {
      const node = t.functionDeclaration(
        t.identifier('testFunction'),
        [],
        t.blockStatement([])
      );
      expect(NodeUtils.getFunctionName(node)).toBe('testFunction');
    });

    it('should return function name for function expressions', () => {
      const node = t.functionExpression(
        t.identifier('testFunction'),
        [],
        t.blockStatement([])
      );
      expect(NodeUtils.getFunctionName(node)).toBe('testFunction');
    });

    it('should return "anonymous" for arrow functions', () => {
      const node = t.arrowFunctionExpression([], t.blockStatement([]));
      expect(NodeUtils.getFunctionName(node)).toBe('anonymous');
    });

    it('should return "anonymous" for unnamed function expressions', () => {
      const node = t.functionExpression(null, [], t.blockStatement([]));
      expect(NodeUtils.getFunctionName(node)).toBe('anonymous');
    });
  });

  describe('getMethodName', () => {
    it('should return method name for identifier keys in class methods', () => {
      const node = t.classMethod(
        'method',
        t.identifier('testMethod'),
        [],
        t.blockStatement([])
      );
      expect(NodeUtils.getMethodName(node)).toBe('testMethod');
    });

    it('should return method name for string literal keys in object methods', () => {
      const node = t.objectMethod(
        'method',
        t.stringLiteral('testMethod'),
        [],
        t.blockStatement([])
      );
      expect(NodeUtils.getMethodName(node)).toBe('testMethod');
    });

    it('should return "unknown" for complex keys', () => {
      const node = t.classMethod(
        'method',
        t.numericLiteral(123),
        [],
        t.blockStatement([])
      );
      expect(NodeUtils.getMethodName(node)).toBe('unknown');
    });
  });

  describe('getCalledFunctionName', () => {
    it('should return function name for identifier callees', () => {
      const node = t.callExpression(t.identifier('testFunction'), []);
      expect(NodeUtils.getCalledFunctionName(node)).toBe('testFunction');
    });

    it('should return method name for member expressions', () => {
      const node = t.callExpression(
        t.memberExpression(t.identifier('obj'), t.identifier('method')),
        []
      );
      expect(NodeUtils.getCalledFunctionName(node)).toBe('method');
    });

    it('should return null for complex callees', () => {
      const node = t.callExpression(
        t.functionExpression(null, [], t.blockStatement([])),
        []
      );
      expect(NodeUtils.getCalledFunctionName(node)).toBeNull();
    });
  });

  describe('getVariableName', () => {
    it('should return variable name for identifier patterns', () => {
      const declarator = t.variableDeclarator(t.identifier('testVar'));
      expect(NodeUtils.getVariableName(declarator)).toBe('testVar');
    });

    it('should return "unknown" for complex patterns', () => {
      const declarator = t.variableDeclarator(t.objectPattern([]));
      expect(NodeUtils.getVariableName(declarator)).toBe('unknown');
    });
  });

  describe('shouldTraverseProperty', () => {
    it('should return true for traversable properties', () => {
      expect(NodeUtils.shouldTraverseProperty('body')).toBe(true);
      expect(NodeUtils.shouldTraverseProperty('params')).toBe(true);
      expect(NodeUtils.shouldTraverseProperty('declarations')).toBe(true);
    });

    it('should return false for non-traversable properties', () => {
      expect(NodeUtils.shouldTraverseProperty('parent')).toBe(false);
      expect(NodeUtils.shouldTraverseProperty('leadingComments')).toBe(false);
      expect(NodeUtils.shouldTraverseProperty('trailingComments')).toBe(false);
      expect(NodeUtils.shouldTraverseProperty('loc')).toBe(false);
      expect(NodeUtils.shouldTraverseProperty('start')).toBe(false);
      expect(NodeUtils.shouldTraverseProperty('end')).toBe(false);
      expect(NodeUtils.shouldTraverseProperty('range')).toBe(false);
      expect(NodeUtils.shouldTraverseProperty('raw')).toBe(false);
      expect(NodeUtils.shouldTraverseProperty('value')).toBe(false);
    });
  });

  describe('getChildNodes', () => {
    it('should return child nodes from a parent node', () => {
      const child1 = t.identifier('child1');
      const child2 = t.identifier('child2');
      const parent = t.blockStatement([
        t.expressionStatement(child1),
        t.expressionStatement(child2)
      ]);
      
      const children = NodeUtils.getChildNodes(parent);
      expect(children.length).toBeGreaterThan(0);
      expect(children.some(child => child.type === 'ExpressionStatement')).toBe(true);
    });

    it('should handle nodes with no children', () => {
      const node = t.identifier('test');
      const children = NodeUtils.getChildNodes(node);
      expect(children).toEqual([]);
    });

    it('should filter out invalid children', () => {
      const node = {
        type: 'TestNode',
        validChild: t.identifier('valid'),
        invalidChild: 'string',
        nullChild: null,
        loc: { start: { line: 1, column: 0 } }
      } as any;
      
      const children = NodeUtils.getChildNodes(node);
      expect(children.length).toBe(1);
      expect(children[0].type).toBe('Identifier');
    });
  });

  describe('isInFunctionScope', () => {
    it('should return true when function stack is not empty', () => {
      expect(NodeUtils.isInFunctionScope(t.identifier('test'), ['func1'])).toBe(true);
      expect(NodeUtils.isInFunctionScope(t.identifier('test'), ['func1', 'func2'])).toBe(true);
    });

    it('should return false when function stack is empty', () => {
      expect(NodeUtils.isInFunctionScope(t.identifier('test'), [])).toBe(false);
    });
  });

  describe('generateNodeId', () => {
    it('should generate unique identifiers', () => {
      const node = t.identifier('test');
      const id1 = NodeUtils.generateNodeId(node, 'prefix', 1);
      const id2 = NodeUtils.generateNodeId(node, 'prefix', 2);
      
      expect(id1).toBe('prefix_identifier_1');
      expect(id2).toBe('prefix_identifier_2');
      expect(id1).not.toBe(id2);
    });
  });

  describe('isExternalDependency', () => {
    it('should return true for import declarations', () => {
      const node = t.importDeclaration([], t.stringLiteral('module'));
      expect(NodeUtils.isExternalDependency(node)).toBe(true);
    });

    it('should return true for require calls', () => {
      const node = t.callExpression(
        t.identifier('require'),
        [t.stringLiteral('module')]
      );
      expect(NodeUtils.isExternalDependency(node)).toBe(true);
    });

    it('should return false for other nodes', () => {
      const node = t.identifier('test');
      expect(NodeUtils.isExternalDependency(node)).toBe(false);
    });
  });

  describe('getScopeLevel', () => {
    it('should return "function" when in function scope', () => {
      const node = t.identifier('test');
      expect(NodeUtils.getScopeLevel(node, ['func1'])).toBe('function');
    });

    it('should return "block" for block statements', () => {
      const node = t.blockStatement([]);
      expect(NodeUtils.getScopeLevel(node, [])).toBe('block');
    });

    it('should return "global" for top-level nodes', () => {
      const node = t.identifier('test');
      expect(NodeUtils.getScopeLevel(node, [])).toBe('global');
    });
  });
});