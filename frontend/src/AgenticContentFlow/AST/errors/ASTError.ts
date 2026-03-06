import { SourceLocation } from '../types/ASTTypes';

/**
 * Custom error class for AST-related operations.
 * Provides consistent error handling across all AST components.
 * Includes contextual information for better debugging and error reporting.
 */
export class ASTError extends Error {
  /**
   * Create a new AST error.
   * @param message The error message
   * @param component The component that generated the error
   * @param sourceLocation Optional source location where the error occurred
   * @param cause Optional underlying cause of the error
   */
  constructor(
    message: string,
    public readonly component: string,
    public readonly sourceLocation?: SourceLocation,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ASTError';
    
    // Maintain proper stack trace for V8 engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ASTError);
    }
  }

  /**
   * Get a formatted error message with context.
   * @returns Formatted error message including component and location info
   */
  getFormattedMessage(): string {
    let formatted = `[${this.component}] ${this.message}`;
    
    if (this.sourceLocation) {
      formatted += ` at line ${this.sourceLocation.start.line}, column ${this.sourceLocation.start.column}`;
    }
    
    if (this.cause) {
      formatted += ` (caused by: ${this.cause.message})`;
    }
    
    return formatted;
  }

  /**
   * Convert the error to a JSON representation.
   * Useful for serialization and logging.
   * @returns JSON representation of the error
   */
  toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      component: this.component,
      sourceLocation: this.sourceLocation,
      cause: this.cause?.message,
      stack: this.stack
    };
  }

  /**
   * Create an ASTError from a generic error.
   * @param error The original error
   * @param component The component that caught the error
   * @param sourceLocation Optional source location
   * @returns New ASTError instance
   */
  static fromError(error: Error, component: string, sourceLocation?: SourceLocation): ASTError {
    return new ASTError(error.message, component, sourceLocation, error);
  }

  /**
   * Create a validation error.
   * @param message The validation error message
   * @param component The component performing validation
   * @param sourceLocation Optional source location
   * @returns New ASTError instance for validation failures
   */
  static validationError(message: string, component: string, sourceLocation?: SourceLocation): ASTError {
    return new ASTError(`Validation failed: ${message}`, component, sourceLocation);
  }

  /**
   * Create a parsing error.
   * @param message The parsing error message
   * @param component The component performing parsing
   * @param sourceLocation Optional source location
   * @returns New ASTError instance for parsing failures
   */
  static parsingError(message: string, component: string, sourceLocation?: SourceLocation): ASTError {
    return new ASTError(`Parsing failed: ${message}`, component, sourceLocation);
  }

  /**
   * Create a traversal error.
   * @param message The traversal error message
   * @param component The component performing traversal
   * @param sourceLocation Optional source location
   * @returns New ASTError instance for traversal failures
   */
  static traversalError(message: string, component: string, sourceLocation?: SourceLocation): ASTError {
    return new ASTError(`Traversal failed: ${message}`, component, sourceLocation);
  }
}