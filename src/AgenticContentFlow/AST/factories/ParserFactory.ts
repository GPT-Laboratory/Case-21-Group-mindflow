import { ASTParser } from '../interfaces/CoreInterfaces';
import { BabelParser } from '../parsers/BabelParser';
import { ASTError } from '../utils/ValidationUtils';

/**
 * Factory for creating parser instances with proper dependency injection.
 * Follows SOLID principles, especially Dependency Inversion Principle (DIP).
 * Provides abstraction layer between high-level modules and concrete parser implementations.
 * Supports Open/Closed Principle - new parsers can be added without modifying existing code.
 * 
 * Requirements addressed:
 * - 2.4: Open/Closed Principle - extensible without modification
 * - 5.1: Dependency Inversion Principle - depends on abstractions
 * - 5.5: Dependencies injected rather than hard-coded
 * - 9.5: Factory methods for dependency injection
 * - 11.1: Simple, straightforward design (KISS)
 */
export class ParserFactory {
  private static readonly SUPPORTED_PARSERS = ['babel'] as const;

  /**
   * Create a parser instance of the specified type.
   * Follows Factory Method pattern for object creation.
   * 
   * @param type The type of parser to create (default: 'babel')
   * @returns An ASTParser instance
   * @throws ASTError if the parser type is unknown or creation fails
   */
  static createParser(type: 'babel' = 'babel'): ASTParser {
    try {
      // Validate parser type
      this.validateParserType(type);

      // Create parser based on type
      switch (type) {
        case 'babel':
          return this.createBabelParser();

        default:
          // This should never be reached due to validation, but provides safety
          throw new ASTError(
            `Unsupported parser type: ${type}. Supported types: ${this.SUPPORTED_PARSERS.join(', ')}`,
            'ParserFactory'
          );
      }
    } catch (error) {
      if (error instanceof ASTError) {
        throw error;
      }

      throw new ASTError(
        `Failed to create parser of type '${type}': ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ParserFactory'
      );
    }
  }

  /**
   * Create a Babel parser instance with proper configuration.
   * Encapsulates the creation logic for Babel parser.
   * 
   * @returns A configured BabelParser instance
   * @throws ASTError if creation fails
   */
  private static createBabelParser(): ASTParser {
    try {
      const parser = new BabelParser();

      // Validate that the parser implements the required interface
      this.validateParserInterface(parser);

      return parser;
    } catch (error) {
      throw new ASTError(
        `Failed to create Babel parser: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ParserFactory'
      );
    }
  }

  /**
   * Validate that a parser type is supported.
   * Provides clear error messages for unsupported types.
   * 
   * @param type The parser type to validate
   * @throws ASTError if the type is not supported
   */
  private static validateParserType(type: string): void {
    if (!type || typeof type !== 'string') {
      throw new ASTError(
        'Parser type must be a non-empty string',
        'ParserFactory'
      );
    }

    if (!this.SUPPORTED_PARSERS.includes(type as any)) {
      throw new ASTError(
        `Unsupported parser type: '${type}'. Supported types: ${this.SUPPORTED_PARSERS.join(', ')}`,
        'ParserFactory'
      );
    }
  }

  /**
   * Validate that a parser instance implements the required interface.
   * Ensures created parsers conform to the ASTParser contract.
   * 
   * @param parser The parser instance to validate
   * @throws ASTError if the parser doesn't implement the required interface
   */
  private static validateParserInterface(parser: any): void {
    if (!parser) {
      throw new ASTError(
        'Parser instance cannot be null or undefined',
        'ParserFactory'
      );
    }

    if (typeof parser.parse !== 'function') {
      throw new ASTError(
        'Parser must implement the parse method',
        'ParserFactory'
      );
    }
  }

  /**
   * Get the list of supported parser types.
   * Useful for validation and documentation purposes.
   * 
   * @returns Array of supported parser type strings
   */
  static getSupportedParserTypes(): readonly string[] {
    return [...this.SUPPORTED_PARSERS];
  }

  /**
   * Check if a parser type is supported.
   * Provides a non-throwing way to validate parser types.
   * 
   * @param type The parser type to check
   * @returns true if the type is supported, false otherwise
   */
  static isParserTypeSupported(type: string): boolean {
    try {
      this.validateParserType(type);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a parser with custom configuration.
   * Allows for future extensibility with parser-specific options.
   * 
   * @param type The parser type to create
   * @param options Optional configuration options (reserved for future use)
   * @returns An ASTParser instance
   * @throws ASTError if creation fails
   */
  static createParserWithOptions(
    type: 'babel' = 'babel',
    options?: Record<string, any>
  ): ASTParser {
    // For now, ignore options but validate the structure for future use
    if (options !== undefined && (typeof options !== 'object' || options === null)) {
      throw new ASTError(
        'Parser options must be an object or undefined',
        'ParserFactory'
      );
    }

    // Create parser using the standard method
    // In the future, options could be passed to parser constructors
    return this.createParser(type);
  }

  /**
   * Create multiple parser instances of different types.
   * Useful for systems that need to support multiple parser types.
   * 
   * @param types Array of parser types to create
   * @returns Map of parser type to parser instance
   * @throws ASTError if any parser creation fails
   */
  static createMultipleParsers(types: ('babel')[]): Map<string, ASTParser> {
    const parsers = new Map<string, ASTParser>();

    try {
      for (const type of types) {
        const parser = this.createParser(type);
        parsers.set(type, parser);
      }

      return parsers;
    } catch (error) {
      throw new ASTError(
        `Failed to create multiple parsers: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ParserFactory'
      );
    }
  }

  /**
   * Create a default parser instance.
   * Provides a convenient method for getting a parser with default settings.
   * 
   * @returns A default ASTParser instance (Babel parser)
   */
  static createDefaultParser(): ASTParser {
    return this.createParser('babel');
  }
}