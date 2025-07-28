import * as t from '@babel/types';
import { ParameterUtils } from '../ParameterUtils';

describe('ParameterUtils', () => {
  describe('extractParameters', () => {
    it('should extract simple identifier parameters', () => {
      const node = t.functionDeclaration(
        t.identifier('test'),
        [t.identifier('param1'), t.identifier('param2')],
        t.blockStatement([])
      );
      
      const parameters = ParameterUtils.extractParameters(node);
      expect(parameters).toHaveLength(2);
      expect(parameters[0]).toEqual({
        name: 'param1',
        type: undefined,
        defaultValue: undefined
      });
      expect(parameters[1]).toEqual({
        name: 'param2',
        type: undefined,
        defaultValue: undefined
      });
    });

    it('should extract parameters with default values', () => {
      const node = t.functionDeclaration(
        t.identifier('test'),
        [
          t.assignmentPattern(t.identifier('param1'), t.stringLiteral('default')),
          t.assignmentPattern(t.identifier('param2'), t.numericLiteral(42))
        ],
        t.blockStatement([])
      );
      
      const parameters = ParameterUtils.extractParameters(node);
      expect(parameters).toHaveLength(2);
      expect(parameters[0]).toEqual({
        name: 'param1',
        type: undefined,
        defaultValue: '"default"'
      });
      expect(parameters[1]).toEqual({
        name: 'param2',
        type: undefined,
        defaultValue: '42'
      });
    });

    it('should extract rest parameters', () => {
      const node = t.functionDeclaration(
        t.identifier('test'),
        [t.restElement(t.identifier('args'))],
        t.blockStatement([])
      );
      
      const parameters = ParameterUtils.extractParameters(node);
      expect(parameters).toHaveLength(1);
      expect(parameters[0]).toEqual({
        name: '...args',
        type: undefined,
        defaultValue: undefined
      });
    });

    it('should extract object destructuring parameters', () => {
      const node = t.functionDeclaration(
        t.identifier('test'),
        [t.objectPattern([
          t.objectProperty(t.identifier('prop1'), t.identifier('prop1')),
          t.objectProperty(t.identifier('prop2'), t.identifier('prop2'))
        ])],
        t.blockStatement([])
      );
      
      const parameters = ParameterUtils.extractParameters(node);
      expect(parameters).toHaveLength(1);
      expect(parameters[0]).toEqual({
        name: '{ prop1, prop2 }',
        type: 'object',
        defaultValue: undefined
      });
    });

    it('should extract array destructuring parameters', () => {
      const node = t.functionDeclaration(
        t.identifier('test'),
        [t.arrayPattern([t.identifier('first'), t.identifier('second')])],
        t.blockStatement([])
      );
      
      const parameters = ParameterUtils.extractParameters(node);
      expect(parameters).toHaveLength(1);
      expect(parameters[0]).toEqual({
        name: '[ first, second ]',
        type: 'array',
        defaultValue: undefined
      });
    });

    it('should return empty array for function with no parameters', () => {
      const node = t.functionDeclaration(
        t.identifier('test'),
        [],
        t.blockStatement([])
      );
      
      const parameters = ParameterUtils.extractParameters(node);
      expect(parameters).toEqual([]);
    });

    it('should handle function without params property', () => {
      const node = t.functionDeclaration(
        t.identifier('test'),
        [],
        t.blockStatement([])
      );
      delete (node as any).params;
      
      const parameters = ParameterUtils.extractParameters(node);
      expect(parameters).toEqual([]);
    });
  });

  describe('extractParameter', () => {
    it('should extract identifier parameter', () => {
      const param = t.identifier('test');
      const result = ParameterUtils.extractParameter(param);
      
      expect(result).toEqual({
        name: 'test',
        type: undefined,
        defaultValue: undefined
      });
    });

    it('should extract assignment pattern parameter', () => {
      const param = t.assignmentPattern(t.identifier('test'), t.stringLiteral('default'));
      const result = ParameterUtils.extractParameter(param);
      
      expect(result).toEqual({
        name: 'test',
        type: undefined,
        defaultValue: '"default"'
      });
    });

    it('should extract rest element parameter', () => {
      const param = t.restElement(t.identifier('args'));
      const result = ParameterUtils.extractParameter(param);
      
      expect(result).toEqual({
        name: '...args',
        type: undefined,
        defaultValue: undefined
      });
    });
  });

  describe('getParameterName', () => {
    it('should get name from identifier', () => {
      const param = t.identifier('test');
      expect(ParameterUtils.getParameterName(param)).toBe('test');
    });

    it('should get name from assignment pattern', () => {
      const param = t.assignmentPattern(t.identifier('test'), t.stringLiteral('default'));
      expect(ParameterUtils.getParameterName(param)).toBe('test');
    });

    it('should get name from rest element', () => {
      const param = t.restElement(t.identifier('args'));
      expect(ParameterUtils.getParameterName(param)).toBe('...args');
    });

    it('should return "unknown" for unsupported patterns', () => {
      const param = t.memberExpression(t.identifier('obj'), t.identifier('prop'));
      expect(ParameterUtils.getParameterName(param as any)).toBe('unknown');
    });
  });

  describe('getDefaultValue', () => {
    it('should get string literal default value', () => {
      const expr = t.stringLiteral('test');
      expect(ParameterUtils.getDefaultValue(expr)).toBe('"test"');
    });

    it('should get numeric literal default value', () => {
      const expr = t.numericLiteral(42);
      expect(ParameterUtils.getDefaultValue(expr)).toBe('42');
    });

    it('should get boolean literal default value', () => {
      const expr = t.booleanLiteral(true);
      expect(ParameterUtils.getDefaultValue(expr)).toBe('true');
    });

    it('should get null literal default value', () => {
      const expr = t.nullLiteral();
      expect(ParameterUtils.getDefaultValue(expr)).toBe('null');
    });

    it('should get identifier default value', () => {
      const expr = t.identifier('variable');
      expect(ParameterUtils.getDefaultValue(expr)).toBe('variable');
    });

    it('should get array expression default value', () => {
      const expr = t.arrayExpression([]);
      expect(ParameterUtils.getDefaultValue(expr)).toBe('[]');
    });

    it('should get object expression default value', () => {
      const expr = t.objectExpression([]);
      expect(ParameterUtils.getDefaultValue(expr)).toBe('{}');
    });

    it('should get function expression default value', () => {
      const expr = t.functionExpression(null, [], t.blockStatement([]));
      expect(ParameterUtils.getDefaultValue(expr)).toBe('function');
    });

    it('should get arrow function default value', () => {
      const expr = t.arrowFunctionExpression([], t.blockStatement([]));
      expect(ParameterUtils.getDefaultValue(expr)).toBe('function');
    });

    it('should return "undefined" for unknown expressions', () => {
      const expr = t.memberExpression(t.identifier('obj'), t.identifier('prop'));
      expect(ParameterUtils.getDefaultValue(expr)).toBe('undefined');
    });
  });

  describe('hasDefaultValue', () => {
    it('should return true for assignment patterns', () => {
      const param = t.assignmentPattern(t.identifier('test'), t.stringLiteral('default'));
      expect(ParameterUtils.hasDefaultValue(param)).toBe(true);
    });

    it('should return false for identifiers', () => {
      const param = t.identifier('test');
      expect(ParameterUtils.hasDefaultValue(param)).toBe(false);
    });

    it('should return false for rest elements', () => {
      const param = t.restElement(t.identifier('args'));
      expect(ParameterUtils.hasDefaultValue(param)).toBe(false);
    });
  });

  describe('isRestParameter', () => {
    it('should return true for rest elements', () => {
      const param = t.restElement(t.identifier('args'));
      expect(ParameterUtils.isRestParameter(param)).toBe(true);
    });

    it('should return false for identifiers', () => {
      const param = t.identifier('test');
      expect(ParameterUtils.isRestParameter(param)).toBe(false);
    });

    it('should return false for assignment patterns', () => {
      const param = t.assignmentPattern(t.identifier('test'), t.stringLiteral('default'));
      expect(ParameterUtils.isRestParameter(param)).toBe(false);
    });
  });

  describe('isDestructuringParameter', () => {
    it('should return true for object patterns', () => {
      const param = t.objectPattern([]);
      expect(ParameterUtils.isDestructuringParameter(param)).toBe(true);
    });

    it('should return true for array patterns', () => {
      const param = t.arrayPattern([]);
      expect(ParameterUtils.isDestructuringParameter(param)).toBe(true);
    });

    it('should return false for identifiers', () => {
      const param = t.identifier('test');
      expect(ParameterUtils.isDestructuringParameter(param)).toBe(false);
    });
  });

  describe('getParameterType', () => {
    it('should return "identifier" for identifiers', () => {
      const param = t.identifier('test');
      expect(ParameterUtils.getParameterType(param)).toBe('identifier');
    });

    it('should return "default" for assignment patterns', () => {
      const param = t.assignmentPattern(t.identifier('test'), t.stringLiteral('default'));
      expect(ParameterUtils.getParameterType(param)).toBe('default');
    });

    it('should return "rest" for rest elements', () => {
      const param = t.restElement(t.identifier('args'));
      expect(ParameterUtils.getParameterType(param)).toBe('rest');
    });

    it('should return "object_destructuring" for object patterns', () => {
      const param = t.objectPattern([]);
      expect(ParameterUtils.getParameterType(param)).toBe('object_destructuring');
    });

    it('should return "array_destructuring" for array patterns', () => {
      const param = t.arrayPattern([]);
      expect(ParameterUtils.getParameterType(param)).toBe('array_destructuring');
    });

    it('should return "unknown" for unsupported types', () => {
      const param = t.memberExpression(t.identifier('obj'), t.identifier('prop'));
      expect(ParameterUtils.getParameterType(param as any)).toBe('unknown');
    });
  });

  describe('countParameters', () => {
    it('should count regular parameters', () => {
      const params = [t.identifier('param1'), t.identifier('param2')];
      expect(ParameterUtils.countParameters(params)).toBe(2);
    });

    it('should exclude rest parameters from count', () => {
      const params = [t.identifier('param1'), t.restElement(t.identifier('args'))];
      expect(ParameterUtils.countParameters(params)).toBe(1);
    });

    it('should return 0 for empty parameters', () => {
      expect(ParameterUtils.countParameters([])).toBe(0);
    });
  });

  describe('validateParameters', () => {
    it('should return true for valid parameters', () => {
      const params = [t.identifier('param1'), t.identifier('param2')];
      expect(ParameterUtils.validateParameters(params)).toBe(true);
    });

    it('should return true for parameters with rest element at end', () => {
      const params = [t.identifier('param1'), t.restElement(t.identifier('args'))];
      expect(ParameterUtils.validateParameters(params)).toBe(true);
    });

    it('should return false for rest element not at end', () => {
      const params = [t.restElement(t.identifier('args')), t.identifier('param1')];
      expect(ParameterUtils.validateParameters(params)).toBe(false);
    });

    it('should return false for non-array input', () => {
      expect(ParameterUtils.validateParameters('not an array' as any)).toBe(false);
    });

    it('should return true for empty array', () => {
      expect(ParameterUtils.validateParameters([])).toBe(true);
    });
  });
});