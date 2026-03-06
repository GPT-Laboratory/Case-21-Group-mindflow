import * as t from '@babel/types';
import { SourceLocation } from '../types/ASTTypes';
import { NodeUtils } from './NodeUtils';
import { SourceLocationUtils } from './SourceLocationUtils';

/**
 * Custom error class for AST validation errors
 */
export class ASTError extends Error {
  constructor(
    message: string,
    public readonly component: string,
    public readonly sourceLocation?: SourceLocation
  ) {
    super(message);
    this.name = 'ASTError';
  }
}

/**
 * Shared utility class for consistent validation patterns
 * Eliminates code duplication and ensures consistent error handling
 */
export class ValidationUtils {
  /**
   * Validate that an object is a valid AST node
   */
  static validateNode(node: any, expectedType?: string): void {
    if (!NodeUtils.isValidNode(node)) {
      throw new ASTError('Invalid AST node: object is null, undefined, or missing type property', 'ValidationUtils');
    }
    
    if (expectedType && node.type !== expectedType) {
      throw new ASTError(
        `Expected node type ${expectedType}, got ${node.type}`,
        'ValidationUtils',
        SourceLocationUtils.extract(node)
      );
    }
  }

  /**
   * Validate function parameters array
   */
  static validateParameters(params: any[]): void {
    if (!Array.isArray(params)) {
      throw new ASTError('Parameters must be an array', 'ValidationUtils');
    }
    
    params.forEach((param, index) => {
      if (!NodeUtils.isValidNode(param)) {
        throw new ASTError(`Invalid parameter at index ${index}`, 'ValidationUtils');
      }
    });
    
    // Check that rest parameter is last if present
    const restIndex = params.findIndex(param => t.isRestElement(param));
    if (restIndex !== -1 && restIndex !== params.length - 1) {
      throw new ASTError('Rest parameter must be the last parameter', 'ValidationUtils');
    }
  }

  /**
   * Validate source code string
   */
  static validateSourceCode(code: string): void {
    if (typeof code !== 'string') {
      throw new ASTError('Source code must be a string', 'ValidationUtils');
    }
    
    if (code.trim().length === 0) {
      throw new ASTError('Source code cannot be empty', 'ValidationUtils');
    }
  }

  /**
   * Validate source location object
   */
  static validateSourceLocation(location: any): void {
    if (!location || typeof location !== 'object') {
      throw new ASTError('Source location must be an object', 'ValidationUtils');
    }
    
    if (!location.start || !location.end) {
      throw new ASTError('Source location must have start and end properties', 'ValidationUtils');
    }
    
    if (typeof location.start.line !== 'number' || typeof location.start.column !== 'number') {
      throw new ASTError('Source location start must have numeric line and column', 'ValidationUtils');
    }
    
    if (typeof location.end.line !== 'number' || typeof location.end.column !== 'number') {
      throw new ASTError('Source location end must have numeric line and column', 'ValidationUtils');
    }
    
    if (location.start.line < 0 || location.start.column < 0) {
      throw new ASTError('Source location start line and column must be non-negative', 'ValidationUtils');
    }
    
    if (location.end.line < 0 || location.end.column < 0) {
      throw new ASTError('Source location end line and column must be non-negative', 'ValidationUtils');
    }
  }

  /**
   * Validate function metadata object
   */
  static validateFunctionMetadata(metadata: any): void {
    if (!metadata || typeof metadata !== 'object') {
      throw new ASTError('Function metadata must be an object', 'ValidationUtils');
    }
    
    if (typeof metadata.id !== 'string' || metadata.id.trim().length === 0) {
      throw new ASTError('Function metadata must have a non-empty id string', 'ValidationUtils');
    }
    
    if (typeof metadata.name !== 'string') {
      throw new ASTError('Function metadata must have a name string', 'ValidationUtils');
    }
    
    if (metadata.parameters && !Array.isArray(metadata.parameters)) {
      throw new ASTError('Function metadata parameters must be an array', 'ValidationUtils');
    }
    
    if (metadata.sourceLocation) {
      this.validateSourceLocation(metadata.sourceLocation);
    }
  }

  /**
   * Validate parameter metadata object
   */
  static validateParameterMetadata(parameter: any): void {
    if (!parameter || typeof parameter !== 'object') {
      throw new ASTError('Parameter metadata must be an object', 'ValidationUtils');
    }
    
    if (typeof parameter.name !== 'string' || parameter.name.trim().length === 0) {
      throw new ASTError('Parameter metadata must have a non-empty name string', 'ValidationUtils');
    }
    
    if (parameter.type !== undefined && typeof parameter.type !== 'string') {
      throw new ASTError('Parameter metadata type must be a string or undefined', 'ValidationUtils');
    }
    
    if (parameter.defaultValue !== undefined && typeof parameter.defaultValue !== 'string') {
      throw new ASTError('Parameter metadata defaultValue must be a string or undefined', 'ValidationUtils');
    }
  }

  /**
   * Validate comment metadata object
   */
  static validateCommentMetadata(comment: any): void {
    if (!comment || typeof comment !== 'object') {
      throw new ASTError('Comment metadata must be an object', 'ValidationUtils');
    }
    
    if (comment.type !== 'block' && comment.type !== 'line') {
      throw new ASTError('Comment metadata type must be "block" or "line"', 'ValidationUtils');
    }
    
    if (typeof comment.value !== 'string') {
      throw new ASTError('Comment metadata must have a value string', 'ValidationUtils');
    }
    
    if (comment.sourceLocation) {
      this.validateSourceLocation(comment.sourceLocation);
    }
  }

  /**
   * Validate variable declaration metadata
   */
  static validateVariableDeclaration(variable: any): void {
    if (!variable || typeof variable !== 'object') {
      throw new ASTError('Variable declaration must be an object', 'ValidationUtils');
    }
    
    if (typeof variable.name !== 'string' || variable.name.trim().length === 0) {
      throw new ASTError('Variable declaration must have a non-empty name string', 'ValidationUtils');
    }
    
    if (!['var', 'let', 'const'].includes(variable.type)) {
      throw new ASTError('Variable declaration type must be "var", "let", or "const"', 'ValidationUtils');
    }
    
    if (!['global', 'function', 'block'].includes(variable.scope)) {
      throw new ASTError('Variable declaration scope must be "global", "function", or "block"', 'ValidationUtils');
    }
    
    if (variable.sourceLocation) {
      this.validateSourceLocation(variable.sourceLocation);
    }
  }

  /**
   * Validate function call metadata
   */
  static validateFunctionCall(call: any): void {
    if (!call || typeof call !== 'object') {
      throw new ASTError('Function call must be an object', 'ValidationUtils');
    }
    
    if (typeof call.id !== 'string' || call.id.trim().length === 0) {
      throw new ASTError('Function call must have a non-empty id string', 'ValidationUtils');
    }
    
    if (typeof call.callerFunction !== 'string') {
      throw new ASTError('Function call must have a callerFunction string', 'ValidationUtils');
    }
    
    if (typeof call.calledFunction !== 'string') {
      throw new ASTError('Function call must have a calledFunction string', 'ValidationUtils');
    }
    
    if (typeof call.isExternal !== 'boolean') {
      throw new ASTError('Function call must have an isExternal boolean', 'ValidationUtils');
    }
    
    if (call.sourceLocation) {
      this.validateSourceLocation(call.sourceLocation);
    }
  }

  /**
   * Validate AST parsing result
   */
  static validateParseResult(result: any): void {
    if (!result || typeof result !== 'object') {
      throw new ASTError('Parse result must be an object', 'ValidationUtils');
    }
    
    if (result.functions && !Array.isArray(result.functions)) {
      throw new ASTError('Parse result functions must be an array', 'ValidationUtils');
    }
    
    if (result.calls && !Array.isArray(result.calls)) {
      throw new ASTError('Parse result calls must be an array', 'ValidationUtils');
    }
    
    if (result.variables && !Array.isArray(result.variables)) {
      throw new ASTError('Parse result variables must be an array', 'ValidationUtils');
    }
    
    if (result.comments && !Array.isArray(result.comments)) {
      throw new ASTError('Parse result comments must be an array', 'ValidationUtils');
    }
    
    if (result.dependencies && !Array.isArray(result.dependencies)) {
      throw new ASTError('Parse result dependencies must be an array', 'ValidationUtils');
    }
  }

  /**
   * Validate that a string is a valid identifier
   */
  static validateIdentifier(identifier: string): void {
    if (typeof identifier !== 'string') {
      throw new ASTError('Identifier must be a string', 'ValidationUtils');
    }
    
    if (identifier.trim().length === 0) {
      throw new ASTError('Identifier cannot be empty', 'ValidationUtils');
    }
    
    // Basic JavaScript identifier validation
    const identifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
    if (!identifierRegex.test(identifier)) {
      throw new ASTError(`Invalid identifier: ${identifier}`, 'ValidationUtils');
    }
  }

  /**
   * Validate array of items with a validator function
   */
  static validateArray<T>(
    items: any[], 
    itemValidator: (item: any) => void, 
    arrayName: string
  ): void {
    if (!Array.isArray(items)) {
      throw new ASTError(`${arrayName} must be an array`, 'ValidationUtils');
    }
    
    items.forEach((item, index) => {
      try {
        itemValidator(item);
      } catch (error) {
        if (error instanceof ASTError) {
          throw new ASTError(
            `${arrayName}[${index}]: ${error.message}`,
            'ValidationUtils',
            error.sourceLocation
          );
        }
        throw error;
      }
    });
  }

  /**
   * Create a validation error with context
   */
  static createValidationError(
    message: string, 
    component: string, 
    sourceLocation?: SourceLocation
  ): ASTError {
    return new ASTError(message, component, sourceLocation);
  }

  /**
   * Check if an error is an AST validation error
   */
  static isASTError(error: any): error is ASTError {
    return error instanceof ASTError;
  }
}