import * as t from '@babel/types';
import { ValidationUtils, ASTError } from '../ValidationUtils';
import { SourceLocation } from '../../types/ASTTypes';

describe('ValidationUtils', () => {
  const createSourceLocation = (startLine: number, startColumn: number, endLine: number, endColumn: number): SourceLocation => ({
    start: { line: startLine, column: startColumn },
    end: { line: endLine, column: endColumn }
  });

  describe('ASTError', () => {
    it('should create error with message and component', () => {
      const error = new ASTError('Test error', 'TestComponent');
      
      expect(error.message).toBe('Test error');
      expect(error.component).toBe('TestComponent');
      expect(error.name).toBe('ASTError');
      expect(error.sourceLocation).toBeUndefined();
    });

    it('should create error with source location', () => {
      const location = createSourceLocation(1, 0, 1, 4);
      const error = new ASTError('Test error', 'TestComponent', location);
      
      expect(error.sourceLocation).toEqual(location);
    });
  });

  describe('validateNode', () => {
    it('should pass for valid AST node', () => {
      const node = t.identifier('test');
      expect(() => ValidationUtils.validateNode(node)).not.toThrow();
    });

    it('should pass for valid AST node with expected type', () => {
      const node = t.identifier('test');
      expect(() => ValidationUtils.validateNode(node, 'Identifier')).not.toThrow();
    });

    it('should throw for null node', () => {
      expect(() => ValidationUtils.validateNode(null)).toThrow(ASTError);
      expect(() => ValidationUtils.validateNode(null)).toThrow('Invalid AST node');
    });

    it('should throw for undefined node', () => {
      expect(() => ValidationUtils.validateNode(undefined)).toThrow(ASTError);
    });

    it('should throw for object without type', () => {
      expect(() => ValidationUtils.validateNode({ name: 'test' })).toThrow(ASTError);
    });

    it('should throw for wrong node type', () => {
      const node = t.identifier('test');
      expect(() => ValidationUtils.validateNode(node, 'FunctionDeclaration')).toThrow(ASTError);
      expect(() => ValidationUtils.validateNode(node, 'FunctionDeclaration')).toThrow('Expected node type FunctionDeclaration, got Identifier');
    });
  });

  describe('validateParameters', () => {
    it('should pass for valid parameters array', () => {
      const params = [t.identifier('param1'), t.identifier('param2')];
      expect(() => ValidationUtils.validateParameters(params)).not.toThrow();
    });

    it('should pass for empty parameters array', () => {
      expect(() => ValidationUtils.validateParameters([])).not.toThrow();
    });

    it('should pass for parameters with rest element at end', () => {
      const params = [t.identifier('param1'), t.restElement(t.identifier('args'))];
      expect(() => ValidationUtils.validateParameters(params)).not.toThrow();
    });

    it('should throw for non-array parameters', () => {
      expect(() => ValidationUtils.validateParameters('not array' as any)).toThrow(ASTError);
      expect(() => ValidationUtils.validateParameters('not array' as any)).toThrow('Parameters must be an array');
    });

    it('should throw for invalid parameter in array', () => {
      const params = [t.identifier('param1'), null];
      expect(() => ValidationUtils.validateParameters(params as any)).toThrow(ASTError);
      expect(() => ValidationUtils.validateParameters(params as any)).toThrow('Invalid parameter at index 1');
    });

    it('should throw for rest element not at end', () => {
      const params = [t.restElement(t.identifier('args')), t.identifier('param1')];
      expect(() => ValidationUtils.validateParameters(params)).toThrow(ASTError);
      expect(() => ValidationUtils.validateParameters(params)).toThrow('Rest parameter must be the last parameter');
    });
  });

  describe('validateSourceCode', () => {
    it('should pass for valid source code', () => {
      expect(() => ValidationUtils.validateSourceCode('function test() {}')).not.toThrow();
    });

    it('should throw for non-string source code', () => {
      expect(() => ValidationUtils.validateSourceCode(123 as any)).toThrow(ASTError);
      expect(() => ValidationUtils.validateSourceCode(123 as any)).toThrow('Source code must be a string');
    });

    it('should throw for empty source code', () => {
      expect(() => ValidationUtils.validateSourceCode('')).toThrow(ASTError);
      expect(() => ValidationUtils.validateSourceCode('   ')).toThrow(ASTError);
      expect(() => ValidationUtils.validateSourceCode('')).toThrow('Source code cannot be empty');
    });
  });

  describe('validateSourceLocation', () => {
    it('should pass for valid source location', () => {
      const location = createSourceLocation(1, 0, 1, 4);
      expect(() => ValidationUtils.validateSourceLocation(location)).not.toThrow();
    });

    it('should throw for null location', () => {
      expect(() => ValidationUtils.validateSourceLocation(null)).toThrow(ASTError);
      expect(() => ValidationUtils.validateSourceLocation(null)).toThrow('Source location must be an object');
    });

    it('should throw for location without start', () => {
      const location = { end: { line: 1, column: 4 } };
      expect(() => ValidationUtils.validateSourceLocation(location)).toThrow(ASTError);
      expect(() => ValidationUtils.validateSourceLocation(location)).toThrow('Source location must have start and end properties');
    });

    it('should throw for location without end', () => {
      const location = { start: { line: 1, column: 0 } };
      expect(() => ValidationUtils.validateSourceLocation(location)).toThrow(ASTError);
    });

    it('should throw for non-numeric line/column', () => {
      const location = { start: { line: '1', column: 0 }, end: { line: 1, column: 4 } };
      expect(() => ValidationUtils.validateSourceLocation(location)).toThrow(ASTError);
      expect(() => ValidationUtils.validateSourceLocation(location)).toThrow('Source location start must have numeric line and column');
    });

    it('should throw for negative line/column', () => {
      const location = { start: { line: -1, column: 0 }, end: { line: 1, column: 4 } };
      expect(() => ValidationUtils.validateSourceLocation(location)).toThrow(ASTError);
      expect(() => ValidationUtils.validateSourceLocation(location)).toThrow('Source location start line and column must be non-negative');
    });
  });

  describe('validateFunctionMetadata', () => {
    it('should pass for valid function metadata', () => {
      const metadata = {
        id: 'test_function_1',
        name: 'testFunction',
        parameters: [],
        sourceLocation: createSourceLocation(1, 0, 3, 1)
      };
      expect(() => ValidationUtils.validateFunctionMetadata(metadata)).not.toThrow();
    });

    it('should throw for null metadata', () => {
      expect(() => ValidationUtils.validateFunctionMetadata(null)).toThrow(ASTError);
      expect(() => ValidationUtils.validateFunctionMetadata(null)).toThrow('Function metadata must be an object');
    });

    it('should throw for metadata without id', () => {
      const metadata = { name: 'testFunction' };
      expect(() => ValidationUtils.validateFunctionMetadata(metadata)).toThrow(ASTError);
      expect(() => ValidationUtils.validateFunctionMetadata(metadata)).toThrow('Function metadata must have a non-empty id string');
    });

    it('should throw for metadata with empty id', () => {
      const metadata = { id: '   ', name: 'testFunction' };
      expect(() => ValidationUtils.validateFunctionMetadata(metadata)).toThrow(ASTError);
    });

    it('should throw for metadata without name', () => {
      const metadata = { id: 'test_1' };
      expect(() => ValidationUtils.validateFunctionMetadata(metadata)).toThrow(ASTError);
      expect(() => ValidationUtils.validateFunctionMetadata(metadata)).toThrow('Function metadata must have a name string');
    });

    it('should throw for metadata with non-array parameters', () => {
      const metadata = { id: 'test_1', name: 'test', parameters: 'not array' };
      expect(() => ValidationUtils.validateFunctionMetadata(metadata)).toThrow(ASTError);
      expect(() => ValidationUtils.validateFunctionMetadata(metadata)).toThrow('Function metadata parameters must be an array');
    });
  });

  describe('validateParameterMetadata', () => {
    it('should pass for valid parameter metadata', () => {
      const parameter = {
        name: 'param1',
        type: 'string',
        defaultValue: 'default'
      };
      expect(() => ValidationUtils.validateParameterMetadata(parameter)).not.toThrow();
    });

    it('should throw for null parameter', () => {
      expect(() => ValidationUtils.validateParameterMetadata(null)).toThrow(ASTError);
      expect(() => ValidationUtils.validateParameterMetadata(null)).toThrow('Parameter metadata must be an object');
    });

    it('should throw for parameter without name', () => {
      const parameter = { type: 'string' };
      expect(() => ValidationUtils.validateParameterMetadata(parameter)).toThrow(ASTError);
      expect(() => ValidationUtils.validateParameterMetadata(parameter)).toThrow('Parameter metadata must have a non-empty name string');
    });

    it('should throw for parameter with non-string type', () => {
      const parameter = { name: 'param1', type: 123 };
      expect(() => ValidationUtils.validateParameterMetadata(parameter)).toThrow(ASTError);
      expect(() => ValidationUtils.validateParameterMetadata(parameter)).toThrow('Parameter metadata type must be a string or undefined');
    });
  });

  describe('validateCommentMetadata', () => {
    it('should pass for valid comment metadata', () => {
      const comment = {
        type: 'block' as const,
        value: 'Test comment',
        sourceLocation: createSourceLocation(1, 0, 1, 13)
      };
      expect(() => ValidationUtils.validateCommentMetadata(comment)).not.toThrow();
    });

    it('should throw for null comment', () => {
      expect(() => ValidationUtils.validateCommentMetadata(null)).toThrow(ASTError);
      expect(() => ValidationUtils.validateCommentMetadata(null)).toThrow('Comment metadata must be an object');
    });

    it('should throw for invalid comment type', () => {
      const comment = { type: 'invalid', value: 'Test' };
      expect(() => ValidationUtils.validateCommentMetadata(comment)).toThrow(ASTError);
      expect(() => ValidationUtils.validateCommentMetadata(comment)).toThrow('Comment metadata type must be "block" or "line"');
    });

    it('should throw for comment without value', () => {
      const comment = { type: 'block' };
      expect(() => ValidationUtils.validateCommentMetadata(comment)).toThrow(ASTError);
      expect(() => ValidationUtils.validateCommentMetadata(comment)).toThrow('Comment metadata must have a value string');
    });
  });

  describe('validateVariableDeclaration', () => {
    it('should pass for valid variable declaration', () => {
      const variable = {
        name: 'testVar',
        type: 'const' as const,
        scope: 'global' as const,
        sourceLocation: createSourceLocation(1, 0, 1, 15)
      };
      expect(() => ValidationUtils.validateVariableDeclaration(variable)).not.toThrow();
    });

    it('should throw for invalid variable type', () => {
      const variable = { name: 'testVar', type: 'invalid', scope: 'global' };
      expect(() => ValidationUtils.validateVariableDeclaration(variable)).toThrow(ASTError);
      expect(() => ValidationUtils.validateVariableDeclaration(variable)).toThrow('Variable declaration type must be "var", "let", or "const"');
    });

    it('should throw for invalid scope', () => {
      const variable = { name: 'testVar', type: 'const', scope: 'invalid' };
      expect(() => ValidationUtils.validateVariableDeclaration(variable)).toThrow(ASTError);
      expect(() => ValidationUtils.validateVariableDeclaration(variable)).toThrow('Variable declaration scope must be "global", "function", or "block"');
    });
  });

  describe('validateFunctionCall', () => {
    it('should pass for valid function call', () => {
      const call = {
        id: 'call_1',
        callerFunction: 'caller',
        calledFunction: 'called',
        isExternal: false,
        sourceLocation: createSourceLocation(1, 0, 1, 10)
      };
      expect(() => ValidationUtils.validateFunctionCall(call)).not.toThrow();
    });

    it('should throw for call without id', () => {
      const call = { callerFunction: 'caller', calledFunction: 'called', isExternal: false };
      expect(() => ValidationUtils.validateFunctionCall(call)).toThrow(ASTError);
      expect(() => ValidationUtils.validateFunctionCall(call)).toThrow('Function call must have a non-empty id string');
    });

    it('should throw for call with non-boolean isExternal', () => {
      const call = { id: 'call_1', callerFunction: 'caller', calledFunction: 'called', isExternal: 'false' };
      expect(() => ValidationUtils.validateFunctionCall(call)).toThrow(ASTError);
      expect(() => ValidationUtils.validateFunctionCall(call)).toThrow('Function call must have an isExternal boolean');
    });
  });

  describe('validateParseResult', () => {
    it('should pass for valid parse result', () => {
      const result = {
        functions: [],
        calls: [],
        variables: [],
        comments: [],
        dependencies: []
      };
      expect(() => ValidationUtils.validateParseResult(result)).not.toThrow();
    });

    it('should throw for null result', () => {
      expect(() => ValidationUtils.validateParseResult(null)).toThrow(ASTError);
      expect(() => ValidationUtils.validateParseResult(null)).toThrow('Parse result must be an object');
    });

    it('should throw for result with non-array functions', () => {
      const result = { functions: 'not array' };
      expect(() => ValidationUtils.validateParseResult(result)).toThrow(ASTError);
      expect(() => ValidationUtils.validateParseResult(result)).toThrow('Parse result functions must be an array');
    });
  });

  describe('validateIdentifier', () => {
    it('should pass for valid identifiers', () => {
      expect(() => ValidationUtils.validateIdentifier('validName')).not.toThrow();
      expect(() => ValidationUtils.validateIdentifier('_private')).not.toThrow();
      expect(() => ValidationUtils.validateIdentifier('$jquery')).not.toThrow();
      expect(() => ValidationUtils.validateIdentifier('name123')).not.toThrow();
    });

    it('should throw for non-string identifier', () => {
      expect(() => ValidationUtils.validateIdentifier(123 as any)).toThrow(ASTError);
      expect(() => ValidationUtils.validateIdentifier(123 as any)).toThrow('Identifier must be a string');
    });

    it('should throw for empty identifier', () => {
      expect(() => ValidationUtils.validateIdentifier('')).toThrow(ASTError);
      expect(() => ValidationUtils.validateIdentifier('   ')).toThrow(ASTError);
      expect(() => ValidationUtils.validateIdentifier('')).toThrow('Identifier cannot be empty');
    });

    it('should throw for invalid identifiers', () => {
      expect(() => ValidationUtils.validateIdentifier('123invalid')).toThrow(ASTError);
      expect(() => ValidationUtils.validateIdentifier('invalid-name')).toThrow(ASTError);
      expect(() => ValidationUtils.validateIdentifier('invalid name')).toThrow(ASTError);
      expect(() => ValidationUtils.validateIdentifier('123invalid')).toThrow('Invalid identifier: 123invalid');
    });
  });

  describe('validateArray', () => {
    it('should pass for valid array with valid items', () => {
      const items = ['item1', 'item2'];
      const validator = (item: any) => {
        if (typeof item !== 'string') throw new ASTError('Item must be string', 'test');
      };
      
      expect(() => ValidationUtils.validateArray(items, validator, 'testArray')).not.toThrow();
    });

    it('should throw for non-array input', () => {
      const validator = () => {};
      expect(() => ValidationUtils.validateArray('not array' as any, validator, 'testArray')).toThrow(ASTError);
      expect(() => ValidationUtils.validateArray('not array' as any, validator, 'testArray')).toThrow('testArray must be an array');
    });

    it('should throw for invalid item in array', () => {
      const items = ['valid', 123];
      const validator = (item: any) => {
        if (typeof item !== 'string') throw new ASTError('Item must be string', 'test');
      };
      
      expect(() => ValidationUtils.validateArray(items, validator, 'testArray')).toThrow(ASTError);
      expect(() => ValidationUtils.validateArray(items, validator, 'testArray')).toThrow('testArray[1]: Item must be string');
    });
  });

  describe('createValidationError', () => {
    it('should create ASTError with provided parameters', () => {
      const location = createSourceLocation(1, 0, 1, 4);
      const error = ValidationUtils.createValidationError('Test message', 'TestComponent', location);
      
      expect(error).toBeInstanceOf(ASTError);
      expect(error.message).toBe('Test message');
      expect(error.component).toBe('TestComponent');
      expect(error.sourceLocation).toEqual(location);
    });
  });

  describe('isASTError', () => {
    it('should return true for ASTError instances', () => {
      const error = new ASTError('Test', 'Component');
      expect(ValidationUtils.isASTError(error)).toBe(true);
    });

    it('should return false for regular errors', () => {
      const error = new Error('Test');
      expect(ValidationUtils.isASTError(error)).toBe(false);
    });

    it('should return false for non-error objects', () => {
      expect(ValidationUtils.isASTError('string')).toBe(false);
      expect(ValidationUtils.isASTError({})).toBe(false);
      expect(ValidationUtils.isASTError(null)).toBe(false);
    });
  });
});