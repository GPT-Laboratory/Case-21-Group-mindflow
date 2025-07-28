import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExtractorFactory } from '../ExtractorFactory';
import { ASTTraverser } from '../../interfaces/CoreInterfaces';
import { FunctionExtractor } from '../../extractors/FunctionExtractor';
import { CallExtractor } from '../../extractors/CallExtractor';
import { VariableExtractor } from '../../extractors/VariableExtractor';
import { CommentExtractor } from '../../extractors/CommentExtractor';
import { DependencyExtractor } from '../../extractors/DependencyExtractor';
import { ASTTraverser as ASTTraverserClass } from '../../core/ASTTraverser';
import { ASTError } from '../../utils/ValidationUtils';

// Mock all extractor classes
vi.mock('../../extractors/FunctionExtractor');
vi.mock('../../extractors/CallExtractor');
vi.mock('../../extractors/VariableExtractor');
vi.mock('../../extractors/CommentExtractor');
vi.mock('../../extractors/DependencyExtractor');
vi.mock('../../core/ASTTraverser');

describe('ExtractorFactory', () => {
  let mockTraverser: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock traverser
    mockTraverser = {
      traverse: vi.fn()
    };

    // Mock all extractor constructors to return objects with extract method
    (FunctionExtractor as any).mockImplementation(() => ({
      extract: vi.fn()
    } as any));

    (CallExtractor as any).mockImplementation(() => ({
      extract: vi.fn()
    } as any));

    (VariableExtractor as any).mockImplementation(() => ({
      extract: vi.fn()
    } as any));

    (CommentExtractor as any).mockImplementation(() => ({
      extract: vi.fn()
    } as any));

    (DependencyExtractor as any).mockImplementation(() => ({
      extract: vi.fn()
    } as any));

    // Mock ASTTraverser constructor
    (ASTTraverserClass as any).mockImplementation(() => mockTraverser as any);
  });

  describe('createExtractors', () => {
    it('should create all extractors with proper dependency injection', () => {
      const extractors = ExtractorFactory.createExtractors(mockTraverser);

      expect(extractors).toBeInstanceOf(Map);
      expect(extractors.size).toBe(5);
      
      // Check all expected extractors are present
      expect(extractors.has('function')).toBe(true);
      expect(extractors.has('call')).toBe(true);
      expect(extractors.has('variable')).toBe(true);
      expect(extractors.has('comment')).toBe(true);
      expect(extractors.has('dependency')).toBe(true);

      // Verify each extractor was created with the traverser
      expect(FunctionExtractor).toHaveBeenCalledWith(mockTraverser);
      expect(CallExtractor).toHaveBeenCalledWith(mockTraverser);
      expect(VariableExtractor).toHaveBeenCalledWith(mockTraverser);
      expect(CommentExtractor).toHaveBeenCalledWith(mockTraverser);
      expect(DependencyExtractor).toHaveBeenCalledWith(mockTraverser);
    });

    it('should throw ASTError for null traverser', () => {
      expect(() => {
        ExtractorFactory.createExtractors(null as any);
      }).toThrow(ASTError);

      expect(() => {
        ExtractorFactory.createExtractors(null as any);
      }).toThrow('ASTTraverser instance is required');
    });

    it('should throw ASTError for invalid traverser', () => {
      const invalidTraverser = { notTraverse: vi.fn() };

      expect(() => {
        ExtractorFactory.createExtractors(invalidTraverser as any);
      }).toThrow(ASTError);

      expect(() => {
        ExtractorFactory.createExtractors(invalidTraverser as any);
      }).toThrow('ASTTraverser must implement the traverse method');
    });

    it('should handle extractor creation failure', () => {
      (FunctionExtractor as any).mockImplementation(() => {
        throw new Error('Creation failed');
      });

      expect(() => {
        ExtractorFactory.createExtractors(mockTraverser);
      }).toThrow(ASTError);

      expect(() => {
        ExtractorFactory.createExtractors(mockTraverser);
      }).toThrow('Failed to create FunctionExtractor');
    });
  });

  describe('createExtractor', () => {
    it('should create function extractor', () => {
      const extractor = ExtractorFactory.createExtractor('function', mockTraverser);

      expect(extractor).toBeDefined();
      expect(FunctionExtractor).toHaveBeenCalledWith(mockTraverser);
      expect(typeof extractor.extract).toBe('function');
    });

    it('should create call extractor', () => {
      const extractor = ExtractorFactory.createExtractor('call', mockTraverser);

      expect(extractor).toBeDefined();
      expect(CallExtractor).toHaveBeenCalledWith(mockTraverser);
      expect(typeof extractor.extract).toBe('function');
    });

    it('should create variable extractor', () => {
      const extractor = ExtractorFactory.createExtractor('variable', mockTraverser);

      expect(extractor).toBeDefined();
      expect(VariableExtractor).toHaveBeenCalledWith(mockTraverser);
      expect(typeof extractor.extract).toBe('function');
    });

    it('should create comment extractor', () => {
      const extractor = ExtractorFactory.createExtractor('comment', mockTraverser);

      expect(extractor).toBeDefined();
      expect(CommentExtractor).toHaveBeenCalledWith(mockTraverser);
      expect(typeof extractor.extract).toBe('function');
    });

    it('should create dependency extractor', () => {
      const extractor = ExtractorFactory.createExtractor('dependency', mockTraverser);

      expect(extractor).toBeDefined();
      expect(DependencyExtractor).toHaveBeenCalledWith(mockTraverser);
      expect(typeof extractor.extract).toBe('function');
    });

    it('should throw ASTError for unsupported extractor type', () => {
      expect(() => {
        ExtractorFactory.createExtractor('unsupported' as any, mockTraverser);
      }).toThrow(ASTError);

      expect(() => {
        ExtractorFactory.createExtractor('unsupported' as any, mockTraverser);
      }).toThrow('Unsupported extractor type: \'unsupported\'');
    });

    it('should throw ASTError for empty extractor type', () => {
      expect(() => {
        ExtractorFactory.createExtractor('' as any, mockTraverser);
      }).toThrow(ASTError);

      expect(() => {
        ExtractorFactory.createExtractor('' as any, mockTraverser);
      }).toThrow('Extractor type must be a non-empty string');
    });

    it('should validate extractor interface after creation', () => {
      (FunctionExtractor as any).mockImplementation(() => ({
        // Missing extract method
      } as any));

      expect(() => {
        ExtractorFactory.createExtractor('function', mockTraverser);
      }).toThrow(ASTError);

      expect(() => {
        ExtractorFactory.createExtractor('function', mockTraverser);
      }).toThrow('FunctionExtractor must implement the extract method');
    });
  });

  describe('createExtractorsWithDefaultTraverser', () => {
    it('should create extractors with default traverser', () => {
      const extractors = ExtractorFactory.createExtractorsWithDefaultTraverser();

      expect(extractors).toBeInstanceOf(Map);
      expect(extractors.size).toBe(5);
      expect(ASTTraverserClass).toHaveBeenCalledTimes(1);
    });

    it('should handle default traverser creation failure', () => {
      (ASTTraverserClass as any).mockImplementation(() => {
        throw new Error('Traverser creation failed');
      });

      expect(() => {
        ExtractorFactory.createExtractorsWithDefaultTraverser();
      }).toThrow(ASTError);

      expect(() => {
        ExtractorFactory.createExtractorsWithDefaultTraverser();
      }).toThrow('Failed to create extractors with default traverser');
    });
  });

  describe('createSelectedExtractors', () => {
    it('should create only selected extractors', () => {
      const selectedTypes = ['function', 'call'] as const;
      const extractors = ExtractorFactory.createSelectedExtractors(selectedTypes, mockTraverser);

      expect(extractors).toBeInstanceOf(Map);
      expect(extractors.size).toBe(2);
      expect(extractors.has('function')).toBe(true);
      expect(extractors.has('call')).toBe(true);
      expect(extractors.has('variable')).toBe(false);
      expect(extractors.has('comment')).toBe(false);
      expect(extractors.has('dependency')).toBe(false);
    });

    it('should throw ASTError for empty types array', () => {
      expect(() => {
        ExtractorFactory.createSelectedExtractors([], mockTraverser);
      }).toThrow(ASTError);

      expect(() => {
        ExtractorFactory.createSelectedExtractors([], mockTraverser);
      }).toThrow('At least one extractor type must be specified');
    });

    it('should throw ASTError for non-array types', () => {
      expect(() => {
        ExtractorFactory.createSelectedExtractors('function' as any, mockTraverser);
      }).toThrow(ASTError);

      expect(() => {
        ExtractorFactory.createSelectedExtractors('function' as any, mockTraverser);
      }).toThrow('Extractor types must be an array');
    });

    it('should validate each type in the array', () => {
      expect(() => {
        ExtractorFactory.createSelectedExtractors(['function', 'invalid'] as any, mockTraverser);
      }).toThrow(ASTError);

      expect(() => {
        ExtractorFactory.createSelectedExtractors(['function', 'invalid'] as any, mockTraverser);
      }).toThrow('Unsupported extractor type: \'invalid\'');
    });
  });

  describe('getSupportedExtractorTypes', () => {
    it('should return array of supported extractor types', () => {
      const supportedTypes = ExtractorFactory.getSupportedExtractorTypes();

      expect(Array.isArray(supportedTypes)).toBe(true);
      expect(supportedTypes).toContain('function');
      expect(supportedTypes).toContain('call');
      expect(supportedTypes).toContain('variable');
      expect(supportedTypes).toContain('comment');
      expect(supportedTypes).toContain('dependency');
      expect(supportedTypes.length).toBe(5);
    });

    it('should return readonly array', () => {
      const supportedTypes = ExtractorFactory.getSupportedExtractorTypes();

      // The array should be a copy, not the original
      expect(supportedTypes).toEqual(['function', 'call', 'variable', 'comment', 'dependency']);
      expect(supportedTypes.length).toBe(5);
    });
  });

  describe('isExtractorTypeSupported', () => {
    it('should return true for supported extractor types', () => {
      expect(ExtractorFactory.isExtractorTypeSupported('function')).toBe(true);
      expect(ExtractorFactory.isExtractorTypeSupported('call')).toBe(true);
      expect(ExtractorFactory.isExtractorTypeSupported('variable')).toBe(true);
      expect(ExtractorFactory.isExtractorTypeSupported('comment')).toBe(true);
      expect(ExtractorFactory.isExtractorTypeSupported('dependency')).toBe(true);
    });

    it('should return false for unsupported extractor types', () => {
      expect(ExtractorFactory.isExtractorTypeSupported('unsupported')).toBe(false);
      expect(ExtractorFactory.isExtractorTypeSupported('')).toBe(false);
      expect(ExtractorFactory.isExtractorTypeSupported(null as any)).toBe(false);
      expect(ExtractorFactory.isExtractorTypeSupported(undefined as any)).toBe(false);
    });
  });

  describe('createExtractorsWithCustomTraverser', () => {
    it('should create extractors with custom traverser options', () => {
      const extractors = ExtractorFactory.createExtractorsWithCustomTraverser({ maxDepth: 50 });

      expect(extractors).toBeInstanceOf(Map);
      expect(extractors.size).toBe(5);
      expect(ASTTraverserClass).toHaveBeenCalledWith(50);
    });

    it('should use default maxDepth when no options provided', () => {
      const extractors = ExtractorFactory.createExtractorsWithCustomTraverser();

      expect(extractors).toBeInstanceOf(Map);
      expect(ASTTraverserClass).toHaveBeenCalledWith(100);
    });

    it('should handle custom traverser creation failure', () => {
      (ASTTraverserClass as any).mockImplementation(() => {
        throw new Error('Custom traverser failed');
      });

      expect(() => {
        ExtractorFactory.createExtractorsWithCustomTraverser({ maxDepth: 50 });
      }).toThrow(ASTError);

      expect(() => {
        ExtractorFactory.createExtractorsWithCustomTraverser({ maxDepth: 50 });
      }).toThrow('Failed to create extractors with custom traverser');
    });
  });

  describe('error handling', () => {
    it('should preserve ASTError instances', () => {
      const originalError = new ASTError('Original error', 'TestComponent');
      (FunctionExtractor as any).mockImplementation(() => {
        throw originalError;
      });

      expect(() => {
        ExtractorFactory.createExtractor('function', mockTraverser);
      }).toThrow(ASTError);
      
      expect(() => {
        ExtractorFactory.createExtractor('function', mockTraverser);
      }).toThrow('Failed to create FunctionExtractor: Original error');
    });

    it('should wrap non-ASTError exceptions', () => {
      const originalError = new Error('Generic error');
      (FunctionExtractor as any).mockImplementation(() => {
        throw originalError;
      });

      expect(() => {
        ExtractorFactory.createExtractor('function', mockTraverser);
      }).toThrow(ASTError);

      expect(() => {
        ExtractorFactory.createExtractor('function', mockTraverser);
      }).toThrow('Failed to create FunctionExtractor: Generic error');
    });

    it('should handle unknown error types', () => {
      (FunctionExtractor as any).mockImplementation(() => {
        throw 'String error';
      });

      expect(() => {
        ExtractorFactory.createExtractor('function', mockTraverser);
      }).toThrow(ASTError);

      expect(() => {
        ExtractorFactory.createExtractor('function', mockTraverser);
      }).toThrow('Failed to create FunctionExtractor: Unknown error');
    });
  });

  describe('SOLID principles compliance', () => {
    it('should follow Dependency Inversion Principle by injecting dependencies', () => {
      const extractors = ExtractorFactory.createExtractors(mockTraverser);

      // All extractors should have been created with the injected traverser
      expect(FunctionExtractor).toHaveBeenCalledWith(mockTraverser);
      expect(CallExtractor).toHaveBeenCalledWith(mockTraverser);
      expect(VariableExtractor).toHaveBeenCalledWith(mockTraverser);
      expect(CommentExtractor).toHaveBeenCalledWith(mockTraverser);
      expect(DependencyExtractor).toHaveBeenCalledWith(mockTraverser);
    });

    it('should follow Open/Closed Principle by supporting extension', () => {
      // The factory should be extensible for new extractor types
      const supportedTypes = ExtractorFactory.getSupportedExtractorTypes();
      expect(supportedTypes).toBeDefined();
      expect(Array.isArray(supportedTypes)).toBe(true);
    });

    it('should follow Single Responsibility Principle', () => {
      // Factory should only be responsible for creating extractors
      expect(typeof ExtractorFactory.createExtractor).toBe('function');
      expect(typeof ExtractorFactory.createExtractors).toBe('function');
      expect(typeof ExtractorFactory.createSelectedExtractors).toBe('function');
      expect(typeof ExtractorFactory.getSupportedExtractorTypes).toBe('function');
    });

    it('should follow Interface Segregation Principle by returning focused interfaces', () => {
      const extractors = ExtractorFactory.createExtractors(mockTraverser);
      
      // Each extractor should only have the extract method (ASTExtractor interface)
      for (const [type, extractor] of extractors) {
        expect(extractor).toHaveProperty('extract');
        expect(typeof extractor.extract).toBe('function');
      }
    });
  });

  describe('validation', () => {
    it('should validate extractor map completeness', () => {
      // Mock one extractor to throw an error during validation
      (FunctionExtractor as any).mockImplementation(() => {
        throw new ASTError('FunctionExtractor instance cannot be null or undefined', 'ExtractorFactory');
      });

      expect(() => {
        ExtractorFactory.createExtractors(mockTraverser);
      }).toThrow(ASTError);

      expect(() => {
        ExtractorFactory.createExtractors(mockTraverser);
      }).toThrow('FunctionExtractor instance cannot be null or undefined');
    });

    it('should validate traverser interface', () => {
      const invalidTraverser = { someMethod: vi.fn() };

      expect(() => {
        ExtractorFactory.createExtractor('function', invalidTraverser as any);
      }).toThrow('ASTTraverser must implement the traverse method');
    });

    it('should validate extractor interface after creation', () => {
      const invalidExtractor = { notExtract: vi.fn() };
      (FunctionExtractor as any).mockImplementation(() => invalidExtractor as any);

      expect(() => {
        ExtractorFactory.createExtractor('function', mockTraverser);
      }).toThrow('FunctionExtractor must implement the extract method');
    });
  });
});