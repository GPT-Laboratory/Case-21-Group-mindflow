import { describe, it, expect, beforeEach } from 'vitest';
import { ASTParserService } from '../ASTParserService';
import { ParserFactory } from '../factories/ParserFactory';
import { ExtractorFactory } from '../factories/ExtractorFactory';
import { ASTTraverser } from '../core/ASTTraverser';
import { FlowCodeSynchronizer } from '../services/FlowCodeSynchronizer';

describe('AST System Integration Tests', () => {
  let parserService: ASTParserService;
  let synchronizer: FlowCodeSynchronizer;

  beforeEach(() => {
    const parser = ParserFactory.createParser('babel');
    const traverser = new ASTTraverser();
    const extractors = ExtractorFactory.createExtractors(traverser);
    parserService = new ASTParserService(parser, extractors);
    synchronizer = new FlowCodeSynchronizer(parserService);
  });

  describe('end-to-end functionality', () => {
    it('should parse and extract from real JavaScript code', () => {
      const code = `
        /**
         * Calculates the sum of two numbers
         * @param {number} a - First number
         * @param {number} b - Second number
         * @returns {number} The sum
         */
        function calculateSum(a, b) {
          const result = a + b;
          console.log('Sum calculated:', result);
          return result;
        }

        // Test the function
        const x = 5;
        const y = 10;
        const sum = calculateSum(x, y);
      `;

      const result = parserService.parseFile(code);

      // Verify functions are extracted correctly
      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].name).toBe('calculateSum');
      expect(result.functions[0].parameters).toHaveLength(2);
      expect(result.functions[0].parameters[0].name).toBe('a');
      expect(result.functions[0].parameters[1].name).toBe('b');
      expect(result.functions[0].description).toContain('Calculates the sum');

      // Verify variables are extracted correctly
      expect(result.variables).toHaveLength(3);
      const variableNames = result.variables.map(v => v.name);
      expect(variableNames).toContain('result');
      expect(variableNames).toContain('x');
      expect(variableNames).toContain('y');

      // Verify function calls are extracted correctly
      expect(result.calls).toHaveLength(2); // console.log and calculateSum
      const callNames = result.calls.map(c => c.calledFunction);
      expect(callNames).toContain('log');
      expect(callNames).toContain('calculateSum');
    });

    it('should handle nested functions correctly', () => {
      const code = `
        function outerFunction(data) {
          const processed = data.map(item => item * 2);
          
          function innerFunction(value) {
            const doubled = value * 2;
            
            function deeplyNested() {
              return 'deep';
            }
            
            return doubled + deeplyNested().length;
          }
          
          return processed.map(innerFunction);
        }
      `;

      const result = parserService.parseFile(code);

      // Verify all functions are extracted
      expect(result.functions).toHaveLength(3);
      const functionNames = result.functions.map(f => f.name);
      expect(functionNames).toContain('outerFunction');
      expect(functionNames).toContain('innerFunction');
      expect(functionNames).toContain('deeplyNested');

      // Verify nesting relationships
      const outerFunc = result.functions.find(f => f.name === 'outerFunction');
      const innerFunc = result.functions.find(f => f.name === 'innerFunction');
      const deepFunc = result.functions.find(f => f.name === 'deeplyNested');

      expect(outerFunc?.isNested).toBe(false);
      expect(innerFunc?.isNested).toBe(true);
      expect(deepFunc?.isNested).toBe(true);
      expect(innerFunc?.parentFunction).toBe(outerFunc?.id);
      expect(deepFunc?.parentFunction).toBe(innerFunc?.id);
    });

    it('should handle complex modern JavaScript features', () => {
      const code = `
        // ES6+ features
        const arrow = (x, y = 10) => x + y;
        
        class Calculator {
          constructor(name) {
            this.name = name;
          }
          
          add(a, b) {
            return a + b;
          }
          
          static multiply(a, b) {
            return a * b;
          }
        }
        
        // Destructuring
        const { add } = new Calculator('test');
        const [first, ...rest] = [1, 2, 3, 4, 5];
        
        // Template literals and async/await
        async function fetchData(url) {
          try {
            const response = await fetch(url);
            const data = await response.json();
            console.log(\`Fetched data from \${url}\`);
            return data;
          } catch (error) {
            console.error('Fetch failed:', error);
            throw error;
          }
        }
      `;

      const result = parserService.parseFile(code);

      // Should extract all function types
      expect(result.functions.length).toBeGreaterThan(0);
      const functionNames = result.functions.map(f => f.name);
      expect(functionNames).toContain('arrow');
      expect(functionNames).toContain('fetchData');

      // Should handle variables with complex patterns
      expect(result.variables.length).toBeGreaterThan(0);
      const variableNames = result.variables.map(v => v.name);
      expect(variableNames).toContain('arrow');
      expect(variableNames).toContain('first');

      // Should extract function calls
      expect(result.calls.length).toBeGreaterThan(0);
    });
  });

  describe('SOLID principles compliance', () => {
    it('should demonstrate Single Responsibility Principle', () => {
      // Each extractor should handle only one type of extraction
      const traverser = new ASTTraverser();
      const extractors = ExtractorFactory.createExtractors(traverser);

      expect(extractors.has('function')).toBe(true);
      expect(extractors.has('call')).toBe(true);
      expect(extractors.has('variable')).toBe(true);
      expect(extractors.has('comment')).toBe(true);
      expect(extractors.has('dependency')).toBe(true);

      // Each extractor should be focused on its specific responsibility
      const functionExtractor = extractors.get('function');
      const callExtractor = extractors.get('call');

      expect(functionExtractor).toBeDefined();
      expect(callExtractor).toBeDefined();
      expect(functionExtractor).not.toBe(callExtractor);
    });

    it('should demonstrate Open/Closed Principle', () => {
      // Should be able to create different parser types without modifying existing code
      const babelParser = ParserFactory.createParser('babel');
      expect(babelParser).toBeDefined();

      // Should be able to create different extractor combinations
      const traverser = new ASTTraverser();
      const selectedExtractors = ExtractorFactory.createSelectedExtractors(
        ['function', 'variable'],
        traverser
      );

      expect(selectedExtractors.size).toBe(2);
      expect(selectedExtractors.has('function')).toBe(true);
      expect(selectedExtractors.has('variable')).toBe(true);
      expect(selectedExtractors.has('call')).toBe(false);
    });

    it('should demonstrate Liskov Substitution Principle', () => {
      // Different parser implementations should be substitutable
      const parser1 = ParserFactory.createParser('babel');
      const parser2 = ParserFactory.createParser('babel'); // Same type, but different instance

      const traverser = new ASTTraverser();
      const extractors = ExtractorFactory.createExtractors(traverser);

      const service1 = new ASTParserService(parser1, extractors);
      const service2 = new ASTParserService(parser2, extractors);

      const code = 'function test() { return 1; }';
      const result1 = service1.parseFile(code);
      const result2 = service2.parseFile(code);

      // Results should be equivalent
      expect(result1.functions).toHaveLength(1);
      expect(result2.functions).toHaveLength(1);
      expect(result1.functions[0].name).toBe(result2.functions[0].name);
    });

    it('should demonstrate Interface Segregation Principle', () => {
      // Extractors should only depend on the methods they need
      const traverser = new ASTTraverser();
      const extractors = ExtractorFactory.createExtractors(traverser);

      // Each extractor should implement only the ASTExtractor interface
      for (const [_type, extractor] of extractors) {
        expect(extractor).toHaveProperty('extract');
        expect(typeof extractor.extract).toBe('function');

        // Should not have unnecessary methods from other interfaces
        expect(extractor).not.toHaveProperty('parse'); // Parser method
        expect(extractor).not.toHaveProperty('traverse'); // Traverser method
      }
    });

    it('should demonstrate Dependency Inversion Principle', () => {
      // High-level modules should depend on abstractions
      const parser = ParserFactory.createParser('babel');
      const traverser = new ASTTraverser();
      const extractors = ExtractorFactory.createExtractors(traverser);

      // ASTParserService depends on interfaces, not concrete implementations
      const service = new ASTParserService(parser, extractors);
      expect(service).toBeDefined();

      // Should work with any implementation that satisfies the interface
      const code = 'function test() {}';
      const result = service.parseFile(code);
      expect(result).toBeDefined();
    });
  });

  describe('error handling and recovery', () => {
    it('should handle syntax errors gracefully', () => {
      const invalidCode = `
        function test() {
          const x = 1
          return x // missing semicolon and closing brace
      `;

      expect(() => {
        parserService.parseFile(invalidCode);
      }).toThrow();

      // Service should still be usable after error
      const validCode = 'function test() { return 1; }';
      const result = parserService.parseFile(validCode);
      expect(result.functions).toHaveLength(1);
    });

    it('should handle partial extraction failures', () => {
      const code = `
        function validFunction() {
          return 'valid';
        }
        
        // This might cause issues in some extractors but shouldn't break everything
        const complexDestructuring = { a: { b: { c: 1 } } };
        const { a: { b: { c } } } = complexDestructuring;
      `;

      const result = parserService.parseFileWithErrorHandling(code);

      // Should extract what it can
      expect(result.success).toBe(true);
      expect(result.structure?.functions).toHaveLength(1);
      expect(result.structure?.functions[0].name).toBe('validFunction');
    });
  });

  describe('performance and scalability', () => {
    it('should handle large codebases efficiently', () => {
      // Generate a moderately large codebase
      let largeCode = '';
      for (let i = 0; i < 50; i++) {
        largeCode += `
          function func${i}(param1, param2) {
            const local${i} = param1 + param2;
            const result${i} = local${i} * 2;
            
            function nested${i}() {
              return result${i} + 1;
            }
            
            return nested${i}();
          }
          
          const var${i} = func${i}(${i}, ${i + 1});
        `;
      }

      const startTime = performance.now();
      const result = parserService.parseFile(largeCode);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
      expect(result.functions).toHaveLength(100); // 50 main + 50 nested
      expect(result.variables).toHaveLength(150); // 50 * 3 variables per function
    });
  });

  describe('backward compatibility', () => {
    it('should maintain existing functionality after refactoring', () => {
      const legacyCode = `
        // Legacy JavaScript patterns that should still work
        function oldStyleFunction() {
          var x = 1;
          var y = 2;
          return x + y;
        }
        
        // Function expressions
        var funcExpression = function() {
          return 'expression';
        };
        
        // Immediately invoked function expressions
        (function() {
          var iife = 'immediate';
          return iife;
        })();
      `;

      const result = parserService.parseFile(legacyCode);

      expect(result.functions.length).toBeGreaterThan(0);
      expect(result.variables.length).toBeGreaterThan(0);

      // Should handle old-style var declarations
      const varDeclarations = result.variables.filter(v => v.type === 'var');
      expect(varDeclarations.length).toBeGreaterThan(0);
    });
  });

  describe('synchronization integration', () => {
    it('should integrate with FlowCodeSynchronizer', () => {
      const code = `
        function testFunction(param) {
          const result = param * 2;
          return result;
        }
      `;

      // This should work without throwing errors
      const flowStructure = synchronizer.syncCodeToFlow(code);
      expect(flowStructure).toBeDefined();
    });
  });
});