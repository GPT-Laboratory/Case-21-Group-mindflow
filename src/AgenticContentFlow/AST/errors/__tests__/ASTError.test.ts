import { ASTError } from '../ASTError';
import { SourceLocation } from '../../types/ASTTypes';
import { describe, expect, it } from 'vitest';

describe('ASTError', () => {
  const mockSourceLocation: SourceLocation = {
    start: { line: 10, column: 5 },
    end: { line: 10, column: 15 }
  };

  describe('constructor', () => {
    it('should create error with message and component', () => {
      const error = new ASTError('Test error', 'TestComponent');

      expect(error.message).toBe('Test error');
      expect(error.component).toBe('TestComponent');
      expect(error.name).toBe('ASTError');
      expect(error.sourceLocation).toBeUndefined();
      expect(error.cause).toBeUndefined();
    });

    it('should create error with source location', () => {
      const error = new ASTError('Test error', 'TestComponent', mockSourceLocation);

      expect(error.message).toBe('Test error');
      expect(error.component).toBe('TestComponent');
      expect(error.sourceLocation).toEqual(mockSourceLocation);
    });

    it('should create error with cause', () => {
      const originalError = new Error('Original error');
      const error = new ASTError('Test error', 'TestComponent', undefined, originalError);

      expect(error.message).toBe('Test error');
      expect(error.component).toBe('TestComponent');
      expect(error.cause).toBe(originalError);
    });

    it('should create error with all parameters', () => {
      const originalError = new Error('Original error');
      const error = new ASTError('Test error', 'TestComponent', mockSourceLocation, originalError);

      expect(error.message).toBe('Test error');
      expect(error.component).toBe('TestComponent');
      expect(error.sourceLocation).toEqual(mockSourceLocation);
      expect(error.cause).toBe(originalError);
    });

    it('should be instance of Error', () => {
      const error = new ASTError('Test error', 'TestComponent');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ASTError);
    });
  });

  describe('getFormattedMessage', () => {
    it('should format message with component only', () => {
      const error = new ASTError('Test error', 'TestComponent');
      const formatted = error.getFormattedMessage();

      expect(formatted).toBe('[TestComponent] Test error');
    });

    it('should format message with component and source location', () => {
      const error = new ASTError('Test error', 'TestComponent', mockSourceLocation);
      const formatted = error.getFormattedMessage();

      expect(formatted).toBe('[TestComponent] Test error at line 10, column 5');
    });

    it('should format message with component and cause', () => {
      const originalError = new Error('Original error');
      const error = new ASTError('Test error', 'TestComponent', undefined, originalError);
      const formatted = error.getFormattedMessage();

      expect(formatted).toBe('[TestComponent] Test error (caused by: Original error)');
    });

    it('should format message with all information', () => {
      const originalError = new Error('Original error');
      const error = new ASTError('Test error', 'TestComponent', mockSourceLocation, originalError);
      const formatted = error.getFormattedMessage();

      expect(formatted).toBe('[TestComponent] Test error at line 10, column 5 (caused by: Original error)');
    });
  });

  describe('toJSON', () => {
    it('should serialize error to JSON', () => {
      const error = new ASTError('Test error', 'TestComponent', mockSourceLocation);
      const json = error.toJSON();

      expect(json).toEqual({
        name: 'ASTError',
        message: 'Test error',
        component: 'TestComponent',
        sourceLocation: mockSourceLocation,
        cause: undefined,
        stack: error.stack
      });
    });

    it('should serialize error with cause to JSON', () => {
      const originalError = new Error('Original error');
      const error = new ASTError('Test error', 'TestComponent', mockSourceLocation, originalError);
      const json = error.toJSON();

      expect(json).toEqual({
        name: 'ASTError',
        message: 'Test error',
        component: 'TestComponent',
        sourceLocation: mockSourceLocation,
        cause: 'Original error',
        stack: error.stack
      });
    });
  });

  describe('static factory methods', () => {
    describe('fromError', () => {
      it('should create ASTError from generic error', () => {
        const originalError = new Error('Original error');
        const astError = ASTError.fromError(originalError, 'TestComponent');

        expect(astError.message).toBe('Original error');
        expect(astError.component).toBe('TestComponent');
        expect(astError.cause).toBe(originalError);
        expect(astError.sourceLocation).toBeUndefined();
      });

      it('should create ASTError from generic error with source location', () => {
        const originalError = new Error('Original error');
        const astError = ASTError.fromError(originalError, 'TestComponent', mockSourceLocation);

        expect(astError.message).toBe('Original error');
        expect(astError.component).toBe('TestComponent');
        expect(astError.cause).toBe(originalError);
        expect(astError.sourceLocation).toEqual(mockSourceLocation);
      });
    });

    describe('validationError', () => {
      it('should create validation error', () => {
        const error = ASTError.validationError('Invalid node type', 'Validator');

        expect(error.message).toBe('Validation failed: Invalid node type');
        expect(error.component).toBe('Validator');
        expect(error.sourceLocation).toBeUndefined();
      });

      it('should create validation error with source location', () => {
        const error = ASTError.validationError('Invalid node type', 'Validator', mockSourceLocation);

        expect(error.message).toBe('Validation failed: Invalid node type');
        expect(error.component).toBe('Validator');
        expect(error.sourceLocation).toEqual(mockSourceLocation);
      });
    });

    describe('parsingError', () => {
      it('should create parsing error', () => {
        const error = ASTError.parsingError('Syntax error', 'Parser');

        expect(error.message).toBe('Parsing failed: Syntax error');
        expect(error.component).toBe('Parser');
        expect(error.sourceLocation).toBeUndefined();
      });

      it('should create parsing error with source location', () => {
        const error = ASTError.parsingError('Syntax error', 'Parser', mockSourceLocation);

        expect(error.message).toBe('Parsing failed: Syntax error');
        expect(error.component).toBe('Parser');
        expect(error.sourceLocation).toEqual(mockSourceLocation);
      });
    });

    describe('traversalError', () => {
      it('should create traversal error', () => {
        const error = ASTError.traversalError('Invalid node structure', 'Traverser');

        expect(error.message).toBe('Traversal failed: Invalid node structure');
        expect(error.component).toBe('Traverser');
        expect(error.sourceLocation).toBeUndefined();
      });

      it('should create traversal error with source location', () => {
        const error = ASTError.traversalError('Invalid node structure', 'Traverser', mockSourceLocation);

        expect(error.message).toBe('Traversal failed: Invalid node structure');
        expect(error.component).toBe('Traverser');
        expect(error.sourceLocation).toEqual(mockSourceLocation);
      });
    });
  });

  describe('error handling patterns', () => {
    it('should provide consistent error handling across components', () => {
      // Simulate different components using consistent error patterns
      const parserError = ASTError.parsingError('Unexpected token', 'BabelParser', mockSourceLocation);
      const extractorError = ASTError.validationError('Invalid function node', 'FunctionExtractor', mockSourceLocation);
      const traverserError = ASTError.traversalError('Circular reference', 'ASTTraverser', mockSourceLocation);

      // All errors should have consistent structure
      [parserError, extractorError, traverserError].forEach(error => {
        expect(error).toBeInstanceOf(ASTError);
        expect(error.component).toBeDefined();
        expect(error.sourceLocation).toEqual(mockSourceLocation);
        expect(error.getFormattedMessage()).toContain(error.component);
        expect(error.getFormattedMessage()).toContain('line 10, column 5');
      });
    });

    it('should support error chaining for debugging', () => {
      const rootCause = new Error('File not found');
      const parseError = ASTError.fromError(rootCause, 'FileParser');
      const extractError = ASTError.fromError(parseError, 'FunctionExtractor');

      expect(extractError.cause).toBe(parseError);
      expect(parseError.cause).toBe(rootCause);
      expect(extractError.getFormattedMessage()).toContain('caused by:');
    });

    it('should maintain stack trace for debugging', () => {
      const error = new ASTError('Test error', 'TestComponent');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ASTError');
      expect(error.stack).toContain('Test error');
    });
  });

  describe('integration with error handling requirements', () => {
    it('should support requirement 8.1 - detailed error information with context', () => {
      const error = new ASTError('Parsing failed', 'BabelParser', mockSourceLocation);
      const formatted = error.getFormattedMessage();

      expect(formatted).toContain('BabelParser'); // Component context
      expect(formatted).toContain('line 10, column 5'); // Location context
      expect(formatted).toContain('Parsing failed'); // Detailed message
    });

    it('should support requirement 8.2 - graceful error handling', () => {
      // Error should be catchable and provide useful information
      try {
        throw new ASTError('Test error', 'TestComponent', mockSourceLocation);
      } catch (error) {
        expect(error).toBeInstanceOf(ASTError);
        expect((error as ASTError).component).toBe('TestComponent');
        expect((error as ASTError).sourceLocation).toEqual(mockSourceLocation);
      }
    });

    it('should support requirement 8.5 - consistent error usage', () => {
      // All factory methods should produce consistent ASTError instances
      const errors = [
        ASTError.validationError('test', 'component'),
        ASTError.parsingError('test', 'component'),
        ASTError.traversalError('test', 'component'),
        ASTError.fromError(new Error('test'), 'component')
      ];

      errors.forEach(error => {
        expect(error).toBeInstanceOf(ASTError);
        expect(error.component).toBe('component');
        expect(error.name).toBe('ASTError');
      });
    });
  });
});