import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ASTParserService } from '../ASTParserService';
import { ASTParser } from '../interfaces/CoreInterfaces';
import { ASTError } from '../utils/ValidationUtils';
import { TestSetup } from './TestSetup';
import type { MockedFunction } from 'vitest';

describe('ASTParserService', () => {
  let parser: ASTParserService;
  let mockParser: {
    parse: MockedFunction<any>;
  };
  let mockExtractors: Map<string, {
    extract: MockedFunction<any>;
  }>;
  let mockNotifications: any;

  beforeEach(() => {
    // Clear all mocks
    TestSetup.resetAllMocks();

    // Create mock dependencies using TestSetup
    mockParser = TestSetup.createMockParser();
    mockExtractors = TestSetup.createMockExtractors();
    mockNotifications = TestSetup.createMockNotifications();

    // Create parser service with mocked dependencies
    parser = new ASTParserService(mockParser, mockExtractors);
  });

  describe('constructor', () => {
    it('should validate required dependencies', () => {
      expect(() => new ASTParserService(null as any, mockExtractors)).toThrow(ASTError);
      expect(() => new ASTParserService(mockParser, null as any)).toThrow(ASTError);
    });

    it('should validate that all required extractors are present', () => {
      const incompleteExtractors = new Map([
        ['function', { extract: vi.fn() }]
      ]);

      expect(() => new ASTParserService(mockParser, incompleteExtractors)).toThrow(ASTError);
    });

    it('should validate parser interface', () => {
      const invalidParser = {} as ASTParser;
      expect(() => new ASTParserService(invalidParser, mockExtractors)).toThrow(ASTError);
    });

    it('should validate extractor interfaces', () => {
      const invalidExtractors = new Map([
        ['function', {} as any],
        ['call', { extract: vi.fn() }],
        ['variable', { extract: vi.fn() }],
        ['comment', { extract: vi.fn() }],
        ['dependency', { extract: vi.fn() }]
      ]);

      expect(() => new ASTParserService(mockParser as any, invalidExtractors as any)).toThrow(ASTError);
    });
  });

  describe('parseFile', () => {
    it('should coordinate parsing and extraction using injected dependencies', () => {
      const code = 'function testFunction() { return "test"; }';
      const mockAST = { type: 'Program', body: [] };

      // Setup mock parser
      mockParser.parse.mockReturnValue(mockAST);

      // Setup mock extractors
      mockExtractors.get('function')!.extract.mockReturnValue([
        {
          id: '1',
          name: 'testFunction',
          parameters: [],
          description: '',
          sourceLocation: { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } },
          isNested: false,
          scope: 'global' as const,
          code: 'function testFunction() {}'
        }
      ]);
      mockExtractors.get('call')!.extract.mockReturnValue([]);
      mockExtractors.get('dependency')!.extract.mockReturnValue([]);
      mockExtractors.get('variable')!.extract.mockReturnValue([]);
      mockExtractors.get('comment')!.extract.mockReturnValue([]);

      const result = parser.parseFile(code);

      // Verify parser was called
      expect(mockParser.parse).toHaveBeenCalledWith(code);

      // Verify all extractors were called
      expect(mockExtractors.get('function')!.extract).toHaveBeenCalledWith(mockAST);
      expect(mockExtractors.get('call')!.extract).toHaveBeenCalledWith(mockAST);
      expect(mockExtractors.get('dependency')!.extract).toHaveBeenCalledWith(mockAST);
      expect(mockExtractors.get('variable')!.extract).toHaveBeenCalledWith(mockAST);
      expect(mockExtractors.get('comment')!.extract).toHaveBeenCalledWith(mockAST);

      // Verify result structure
      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].name).toBe('testFunction');
      expect(result.calls).toHaveLength(0);
      expect(result.dependencies).toHaveLength(0);
      expect(result.variables).toHaveLength(0);
      expect(result.comments).toHaveLength(0);
    });

    it('should handle parser errors and throw ASTError', () => {
      const code = 'invalid syntax {';
      const parseError = new Error('Syntax error');

      mockParser.parse.mockImplementation(() => {
        throw parseError;
      });

      expect(() => parser.parseFile(code)).toThrow(ASTError);
      expect(mockParser.parse).toHaveBeenCalledWith(code);
    });

    it('should handle extractor returning undefined gracefully', () => {
      const code = 'function test() {}';
      const mockAST = { type: 'Program', body: [] };

      mockParser.parse.mockReturnValue(mockAST);

      // Mock one extractor to return undefined
      mockExtractors.get('function')!.extract.mockReturnValue(undefined as any);
      mockExtractors.get('call')!.extract.mockReturnValue([]);
      mockExtractors.get('dependency')!.extract.mockReturnValue([]);
      mockExtractors.get('variable')!.extract.mockReturnValue([]);
      mockExtractors.get('comment')!.extract.mockReturnValue([]);

      const result = parser.parseFile(code);

      expect(result.functions).toEqual([]);
      expect(result.calls).toEqual([]);
    });
  });

  describe('parseFileWithErrorHandling', () => {
    beforeEach(() => {
      // Mock console methods to avoid noise in tests
      vi.spyOn(console, 'error').mockImplementation(() => { });
      vi.spyOn(console, 'warn').mockImplementation(() => { });
      vi.spyOn(console, 'group').mockImplementation(() => { });
      vi.spyOn(console, 'groupEnd').mockImplementation(() => { });
    });

    it('should successfully parse valid code with mocked extractors', () => {
      const code = 'function validFunction() { return "valid"; }';
      const mockAST = { type: 'Program', body: [] };

      mockParser.parse.mockReturnValue(mockAST);

      // Setup successful extraction
      mockExtractors.get('function')!.extract.mockReturnValue([
        {
          id: '1',
          name: 'validFunction',
          parameters: [],
          description: '',
          sourceLocation: { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } },
          isNested: false,
          scope: 'global' as const,
          code: 'function validFunction() {}'
        }
      ]);
      mockExtractors.get('call')!.extract.mockReturnValue([]);
      mockExtractors.get('dependency')!.extract.mockReturnValue([]);
      mockExtractors.get('variable')!.extract.mockReturnValue([]);
      mockExtractors.get('comment')!.extract.mockReturnValue([]);

      const result = parser.parseFileWithErrorHandling(code, mockNotifications);

      expect(result.success).toBe(true);
      expect(result.structure).toBeDefined();
      expect(result.structure?.functions).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.partiallyParsed).toBe(false);
    });

    it('should handle parser errors gracefully', () => {
      const code = 'invalid syntax {';
      const parseError = new Error('Syntax error');

      mockParser.parse.mockImplementation(() => {
        throw parseError;
      });

      const result = parser.parseFileWithErrorHandling(code, mockNotifications);

      expect(result.success).toBe(false);
      expect(result.structure).toBeUndefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('syntax');
      expect(result.partiallyParsed).toBe(false);
    });

    it('should handle extractor errors and continue processing', () => {
      const code = 'function test() {}';
      const mockAST = { type: 'Program', body: [] };

      mockParser.parse.mockReturnValue(mockAST);

      // Mock function extractor to throw error
      mockExtractors.get('function')!.extract.mockImplementation(() => {
        throw new Error('Function extraction failed');
      });

      // Other extractors work fine
      mockExtractors.get('call')!.extract.mockReturnValue([]);
      mockExtractors.get('dependency')!.extract.mockReturnValue([]);
      mockExtractors.get('variable')!.extract.mockReturnValue([]);
      mockExtractors.get('comment')!.extract.mockReturnValue([]);

      const result = parser.parseFileWithErrorHandling(code, mockNotifications);

      expect(result.success).toBe(true); // Should still succeed with partial data
      expect(result.structure).toBeDefined();
      expect(result.structure?.functions).toHaveLength(0); // Functions failed to extract
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.partiallyParsed).toBe(true);
    });

    it('should treat dependency and call extraction errors as warnings', () => {
      const code = 'function test() {}';
      const mockAST = { type: 'Program', body: [] };

      mockParser.parse.mockReturnValue(mockAST);

      // Mock dependency and call extractors to throw errors
      mockExtractors.get('dependency')!.extract.mockImplementation(() => {
        throw new Error('Dependency extraction failed');
      });
      mockExtractors.get('call')!.extract.mockImplementation(() => {
        throw new Error('Call extraction failed');
      });

      // Other extractors work fine
      mockExtractors.get('function')!.extract.mockReturnValue([]);
      mockExtractors.get('variable')!.extract.mockReturnValue([]);
      mockExtractors.get('comment')!.extract.mockReturnValue([]);

      const result = parser.parseFileWithErrorHandling(code, mockNotifications);

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBe(2); // Two warnings for dependency and call failures
      expect(result.warnings[0].type).toBe('semantic'); // call extractor fails first
      expect(result.warnings[1].type).toBe('dependency'); // dependency extractor fails second
    });

    it('should work without notification hook', () => {
      const code = 'invalid syntax {';

      mockParser.parse.mockImplementation(() => {
        throw new Error('Syntax error');
      });

      const result = parser.parseFileWithErrorHandling(code);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // Should not throw error when no notification hook provided
    });
  });

  describe('processExternalDependencies', () => {
    it('should use injected parser for external dependency processing', () => {
      const code = 'function test() { console.log("test"); }';
      const mockAST = { type: 'Program', body: [] };
      const parentNodeId = 'parent-123';

      mockParser.parse.mockReturnValue(mockAST);

      // We can't easily mock the external dependency processor, so we'll just verify the parser is called
      try {
        parser.processExternalDependencies(code, parentNodeId);
      } catch (error) {
        // Expected since we're not mocking the full external dependency processor
      }

      expect(mockParser.parse).toHaveBeenCalledWith(code);
    });

    it('should handle parser errors in external dependency processing', () => {
      const code = 'invalid syntax {';
      const parentNodeId = 'parent-123';

      mockParser.parse.mockImplementation(() => {
        throw new Error('Syntax error');
      });

      expect(() => parser.processExternalDependencies(code, parentNodeId)).toThrow(ASTError);
    });
  });

  describe('analyzeScopeViolations', () => {
    beforeEach(() => {
      // Mock console methods to avoid noise in tests
      vi.spyOn(console, 'warn').mockImplementation(() => { });
    });

    it('should analyze scope violations in parsed structure', () => {
      const mockStructure = {
        functions: [
          {
            id: '1',
            name: 'test',
            isNested: false,
            parentFunction: undefined,
            description: '',
            parameters: [],
            sourceLocation: { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } },
            scope: 'global' as const,
            code: 'function test() {}'
          }
        ],
        calls: [],
        dependencies: [],
        variables: [],
        comments: []
      };

      const violations = parser.analyzeScopeViolations(mockStructure, mockNotifications);

      // Should return empty array for valid structure or handle errors gracefully
      expect(Array.isArray(violations)).toBe(true);
    });

    it('should handle scope analysis errors gracefully', () => {
      const invalidStructure = {
        functions: null as any,
        calls: [],
        dependencies: [],
        variables: [],
        comments: []
      };

      const violations = parser.analyzeScopeViolations(invalidStructure, mockNotifications);

      expect(violations).toHaveLength(0);
      expect(console.warn).toHaveBeenCalledWith('Failed to analyze scope violations:', expect.any(Error));
    });
  });

  describe('getScopeViolationIndicators', () => {
    beforeEach(() => {
      // Mock console methods to avoid noise in tests
      vi.spyOn(console, 'warn').mockImplementation(() => { });
    });

    it('should create visual indicators for scope violations', () => {
      const mockStructure = {
        functions: [
          { 
            id: '1', 
            name: 'test', 
            isNested: false, 
            parentFunction: undefined,
            description: '',
            parameters: [],
            sourceLocation: { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } },
            scope: 'global' as const,
            code: 'function test() {}'
          }
        ],
        calls: [],
        dependencies: [],
        variables: [],
        comments: []
      };

      const indicators = parser.getScopeViolationIndicators(mockStructure);

      expect(indicators instanceof Map).toBe(true);
    });

    it('should handle indicator creation errors gracefully', () => {
      const invalidStructure = {
        functions: null as any,
        calls: [],
        dependencies: [],
        variables: [],
        comments: []
      };

      const indicators = parser.getScopeViolationIndicators(invalidStructure);

      expect(indicators.size).toBe(0);
      expect(console.warn).toHaveBeenCalledWith('Failed to create scope violation indicators:', expect.any(Error));
    });
  });
});