import { describe, it, expect } from 'vitest';
import { ASTParserService } from '../ASTParserService';
import { ParserFactory } from '../factories/ParserFactory';
import { ExtractorFactory } from '../factories/ExtractorFactory';
import { ASTTraverser } from '../core/ASTTraverser';

describe('ASTParserService Integration', () => {
  it('should work with real dependencies from factories', () => {
    // Create real dependencies using factories
    const parser = ParserFactory.createParser('babel');
    const traverser = new ASTTraverser();
    const extractors = ExtractorFactory.createExtractors(traverser);
    
    // Create service with real dependencies
    const service = new ASTParserService(parser, extractors);
    
    // Test with simple JavaScript code
    const code = `
      function testFunction(param1, param2) {
        return param1 + param2;
      }
      
      testFunction(1, 2);
    `;
    
    const result = service.parseFile(code);
    
    // Verify the structure is parsed correctly
    expect(result).toBeDefined();
    expect(result.functions).toBeDefined();
    expect(result.calls).toBeDefined();
    expect(result.dependencies).toBeDefined();
    expect(result.variables).toBeDefined();
    expect(result.comments).toBeDefined();
    
    // Verify functions are extracted
    expect(result.functions.length).toBeGreaterThan(0);
    expect(result.functions[0].name).toBe('testFunction');
    
    // Verify calls are extracted
    expect(result.calls.length).toBeGreaterThan(0);
    expect(result.calls[0].calledFunction).toBe('testFunction');
  });

  it('should handle error scenarios with real dependencies', () => {
    // Create real dependencies
    const parser = ParserFactory.createParser('babel');
    const traverser = new ASTTraverser();
    const extractors = ExtractorFactory.createExtractors(traverser);
    
    const service = new ASTParserService(parser, extractors);
    
    // Test with invalid JavaScript code
    const invalidCode = 'function invalid( {';
    
    expect(() => service.parseFile(invalidCode)).toThrow();
  });

  it('should work with parseFileWithErrorHandling', () => {
    // Create real dependencies
    const parser = ParserFactory.createParser('babel');
    const traverser = new ASTTraverser();
    const extractors = ExtractorFactory.createExtractors(traverser);
    
    const service = new ASTParserService(parser, extractors);
    
    // Test with valid code
    const validCode = 'function test() { return "hello"; }';
    const result = service.parseFileWithErrorHandling(validCode);
    
    expect(result.success).toBe(true);
    expect(result.structure).toBeDefined();
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });
});