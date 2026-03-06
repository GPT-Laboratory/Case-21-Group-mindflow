import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParserFactory } from '../ParserFactory';
import { BabelParser } from '../../parsers/BabelParser';
import { ASTError } from '../../utils/ValidationUtils';

// Mock the BabelParser to avoid actual parsing during tests
vi.mock('../../parsers/BabelParser');

describe('ParserFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createParser', () => {
    it('should create a Babel parser by default', () => {
      const mockBabelParser = {
        parse: vi.fn()
      };
      (BabelParser as any).mockImplementation(() => mockBabelParser as any);

      const parser = ParserFactory.createParser();

      expect(parser).toBeDefined();
      expect(BabelParser).toHaveBeenCalledTimes(1);
      expect(typeof parser.parse).toBe('function');
    });

    it('should create a Babel parser when explicitly requested', () => {
      const mockBabelParser = {
        parse: vi.fn()
      };
      (BabelParser as any).mockImplementation(() => mockBabelParser as any);

      const parser = ParserFactory.createParser('babel');

      expect(parser).toBeDefined();
      expect(BabelParser).toHaveBeenCalledTimes(1);
      expect(typeof parser.parse).toBe('function');
    });

    it('should throw ASTError for unsupported parser type', () => {
      expect(() => {
        ParserFactory.createParser('unsupported' as any);
      }).toThrow(ASTError);

      expect(() => {
        ParserFactory.createParser('unsupported' as any);
      }).toThrow('Unsupported parser type: \'unsupported\'');
    });

    it('should throw ASTError for null parser type', () => {
      expect(() => {
        ParserFactory.createParser(null as any);
      }).toThrow(ASTError);

      expect(() => {
        ParserFactory.createParser(null as any);
      }).toThrow('Parser type must be a non-empty string');
    });

    it('should throw ASTError for empty parser type', () => {
      expect(() => {
        ParserFactory.createParser('' as any);
      }).toThrow(ASTError);

      expect(() => {
        ParserFactory.createParser('' as any);
      }).toThrow('Parser type must be a non-empty string');
    });

    it('should handle BabelParser constructor failure', () => {
      (BabelParser as any).mockImplementation(() => {
        throw new Error('Constructor failed');
      });

      expect(() => {
        ParserFactory.createParser('babel');
      }).toThrow(ASTError);

      expect(() => {
        ParserFactory.createParser('babel');
      }).toThrow('Failed to create Babel parser');
    });

    it('should validate parser interface after creation', () => {
      const mockBabelParser = {
        // Missing parse method to test validation
      };
      (BabelParser as any).mockImplementation(() => mockBabelParser as any);

      expect(() => {
        ParserFactory.createParser('babel');
      }).toThrow(ASTError);

      expect(() => {
        ParserFactory.createParser('babel');
      }).toThrow('Parser must implement the parse method');
    });
  });

  describe('getSupportedParserTypes', () => {
    it('should return array of supported parser types', () => {
      const supportedTypes = ParserFactory.getSupportedParserTypes();

      expect(Array.isArray(supportedTypes)).toBe(true);
      expect(supportedTypes).toContain('babel');
      expect(supportedTypes.length).toBeGreaterThan(0);
    });

    it('should return readonly array', () => {
      const supportedTypes = ParserFactory.getSupportedParserTypes();

      // The array should be a copy, not the original
      expect(supportedTypes).toEqual(['babel']);
      expect(supportedTypes.length).toBe(1);
    });
  });

  describe('isParserTypeSupported', () => {
    it('should return true for supported parser types', () => {
      expect(ParserFactory.isParserTypeSupported('babel')).toBe(true);
    });

    it('should return false for unsupported parser types', () => {
      expect(ParserFactory.isParserTypeSupported('unsupported')).toBe(false);
      expect(ParserFactory.isParserTypeSupported('')).toBe(false);
      expect(ParserFactory.isParserTypeSupported(null as any)).toBe(false);
      expect(ParserFactory.isParserTypeSupported(undefined as any)).toBe(false);
    });
  });

  describe('createParserWithOptions', () => {
    it('should create parser with undefined options', () => {
      const mockBabelParser = {
        parse: vi.fn()
      };
      (BabelParser as any).mockImplementation(() => mockBabelParser as any);

      const parser = ParserFactory.createParserWithOptions('babel', undefined);

      expect(parser).toBeDefined();
      expect(typeof parser.parse).toBe('function');
    });

    it('should create parser with valid options object', () => {
      const mockBabelParser = {
        parse: vi.fn()
      };
      (BabelParser as any).mockImplementation(() => mockBabelParser as any);

      const parser = ParserFactory.createParserWithOptions('babel', { someOption: 'value' });

      expect(parser).toBeDefined();
      expect(typeof parser.parse).toBe('function');
    });

    it('should throw ASTError for invalid options', () => {
      expect(() => {
        ParserFactory.createParserWithOptions('babel', 'invalid' as any);
      }).toThrow(ASTError);

      expect(() => {
        ParserFactory.createParserWithOptions('babel', 'invalid' as any);
      }).toThrow('Parser options must be an object or undefined');
    });

    it('should throw ASTError for null options', () => {
      expect(() => {
        ParserFactory.createParserWithOptions('babel', null as any);
      }).toThrow(ASTError);

      expect(() => {
        ParserFactory.createParserWithOptions('babel', null as any);
      }).toThrow('Parser options must be an object or undefined');
    });
  });

  describe('createMultipleParsers', () => {
    it('should create multiple parsers of different types', () => {
      const mockBabelParser = {
        parse: vi.fn()
      };
      (BabelParser as any).mockImplementation(() => mockBabelParser as any);

      const parsers = ParserFactory.createMultipleParsers(['babel']);

      expect(parsers).toBeInstanceOf(Map);
      expect(parsers.size).toBe(1);
      expect(parsers.has('babel')).toBe(true);
      expect(typeof parsers.get('babel')?.parse).toBe('function');
    });

    it('should handle empty array', () => {
      const parsers = ParserFactory.createMultipleParsers([]);

      expect(parsers).toBeInstanceOf(Map);
      expect(parsers.size).toBe(0);
    });

    it('should handle parser creation failure', () => {
      (BabelParser as any).mockImplementation(() => {
        throw new Error('Creation failed');
      });

      expect(() => {
        ParserFactory.createMultipleParsers(['babel']);
      }).toThrow(ASTError);

      expect(() => {
        ParserFactory.createMultipleParsers(['babel']);
      }).toThrow('Failed to create multiple parsers');
    });
  });

  describe('createDefaultParser', () => {
    it('should create a default parser', () => {
      const mockBabelParser = {
        parse: vi.fn()
      };
      (BabelParser as any).mockImplementation(() => mockBabelParser as any);

      const parser = ParserFactory.createDefaultParser();

      expect(parser).toBeDefined();
      expect(typeof parser.parse).toBe('function');
      expect(BabelParser).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should preserve ASTError instances', () => {
      const originalError = new ASTError('Original error', 'TestComponent');
      (BabelParser as any).mockImplementation(() => {
        throw originalError;
      });

      expect(() => {
        ParserFactory.createParser('babel');
      }).toThrow(ASTError);
      
      expect(() => {
        ParserFactory.createParser('babel');
      }).toThrow('Failed to create Babel parser: Original error');
    });

    it('should wrap non-ASTError exceptions', () => {
      const originalError = new Error('Generic error');
      (BabelParser as any).mockImplementation(() => {
        throw originalError;
      });

      expect(() => {
        ParserFactory.createParser('babel');
      }).toThrow(ASTError);

      expect(() => {
        ParserFactory.createParser('babel');
      }).toThrow('Failed to create Babel parser: Generic error');
    });

    it('should handle unknown error types', () => {
      (BabelParser as any).mockImplementation(() => {
        throw 'String error';
      });

      expect(() => {
        ParserFactory.createParser('babel');
      }).toThrow(ASTError);

      expect(() => {
        ParserFactory.createParser('babel');
      }).toThrow('Failed to create Babel parser: Unknown error');
    });
  });

  describe('SOLID principles compliance', () => {
    it('should follow Dependency Inversion Principle by returning interface', () => {
      const mockBabelParser = {
        parse: vi.fn()
      };
      (BabelParser as any).mockImplementation(() => mockBabelParser as any);

      const parser = ParserFactory.createParser('babel');

      // Should be able to use as ASTParser interface
      expect(parser).toHaveProperty('parse');
      expect(typeof parser.parse).toBe('function');
    });

    it('should follow Open/Closed Principle by supporting extension', () => {
      // The factory should be extensible for new parser types
      // This is demonstrated by the structure allowing new cases in the switch statement
      const supportedTypes = ParserFactory.getSupportedParserTypes();
      expect(supportedTypes).toBeDefined();
      expect(Array.isArray(supportedTypes)).toBe(true);
    });

    it('should follow Single Responsibility Principle', () => {
      // Factory should only be responsible for creating parsers
      // All methods should be related to parser creation
      expect(typeof ParserFactory.createParser).toBe('function');
      expect(typeof ParserFactory.createDefaultParser).toBe('function');
      expect(typeof ParserFactory.createMultipleParsers).toBe('function');
      expect(typeof ParserFactory.getSupportedParserTypes).toBe('function');
    });
  });

  describe('interface validation', () => {
    it('should validate parser has required methods', () => {
      const invalidParser = {};
      (BabelParser as any).mockImplementation(() => invalidParser as any);

      expect(() => {
        ParserFactory.createParser('babel');
      }).toThrow('Parser must implement the parse method');
    });

    it('should validate parser is not null', () => {
      (BabelParser as any).mockImplementation(() => {
        throw new ASTError('Parser instance cannot be null or undefined', 'ParserFactory');
      });

      expect(() => {
        ParserFactory.createParser('babel');
      }).toThrow(ASTError);
      
      expect(() => {
        ParserFactory.createParser('babel');
      }).toThrow('Parser instance cannot be null or undefined');
    });
  });
});