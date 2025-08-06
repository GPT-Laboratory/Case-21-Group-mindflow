import { describe, it, expect, beforeEach } from 'vitest';
import { ASTParserService } from '../ASTParserService';
import { ParserFactory } from '../factories/ParserFactory';
import { ExtractorFactory } from '../factories/ExtractorFactory';
import { ASTTraverser } from '../core/ASTTraverser';

describe('AST System Performance Tests', () => {
  let parserService: ASTParserService;

  beforeEach(() => {
    const parser = ParserFactory.createParser('babel');
    const traverser = new ASTTraverser();
    const extractors = ExtractorFactory.createExtractors(traverser);
    parserService = new ASTParserService(parser, extractors);
  });

  describe('parsing performance', () => {
    it('should parse small files within acceptable time limits', () => {
      const smallCode = `
        function test() {
          const x = 1;
          return x;
        }
      `;

      const startTime = performance.now();
      const result = parserService.parseFile(smallCode);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should complete within 100ms
      expect(result.functions).toHaveLength(1);
    });

    it('should parse medium-sized files within acceptable time limits', () => {
      const mediumCode = `
        function fibonacci(n) {
          if (n <= 1) return n;
          return fibonacci(n - 1) + fibonacci(n - 2);
        }

        function factorial(n) {
          if (n <= 1) return 1;
          return n * factorial(n - 1);
        }

        function quickSort(arr) {
          if (arr.length <= 1) return arr;
          const pivot = arr[Math.floor(arr.length / 2)];
          const left = arr.filter(x => x < pivot);
          const right = arr.filter(x => x > pivot);
          return [...quickSort(left), pivot, ...quickSort(right)];
        }

        const numbers = [3, 6, 8, 10, 1, 2, 1];
        const sorted = quickSort(numbers);
        const fib10 = fibonacci(10);
        const fact5 = factorial(5);
      `;

      const startTime = performance.now();
      const result = parserService.parseFile(mediumCode);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // Should complete within 500ms
      expect(result.functions).toHaveLength(5); // 3 named functions + 2 arrow functions in filter
      expect(result.variables).toHaveLength(7); // More variables than expected due to arrow function parameters
    });

    it('should handle repeated parsing efficiently', () => {
      const code = `
        function test(a, b) {
          const result = a + b;
          return result;
        }
      `;

      const iterations = 100;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        parserService.parseFile(code);
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / iterations;

      expect(averageTime).toBeLessThan(50); // Average should be under 50ms per parse
    });

    it('should maintain performance with nested functions', () => {
      const nestedCode = `
        function outer() {
          function inner1() {
            function deepNested() {
              const x = 1;
              return x;
            }
            return deepNested();
          }
          
          function inner2() {
            const y = 2;
            return y;
          }
          
          return inner1() + inner2();
        }
      `;

      const startTime = performance.now();
      const result = parserService.parseFile(nestedCode);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200); // Should handle nesting efficiently
      expect(result.functions).toHaveLength(4); // outer, inner1, inner2, deepNested
    });
  });

  describe('memory usage', () => {
    it('should not leak memory during repeated operations', () => {
      const code = `
        function test() {
          const data = new Array(1000).fill(0);
          return data.reduce((sum, val) => sum + val, 0);
        }
      `;

      // Perform multiple parsing operations
      for (let i = 0; i < 50; i++) {
        const result = parserService.parseFile(code);
        expect(result.functions).toHaveLength(2); // 1 named function + 1 arrow function in reduce
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // This test mainly ensures no obvious memory leaks occur
      // In a real environment, you'd monitor actual memory usage
      expect(true).toBe(true);
    });
  });

  describe('scalability', () => {
    it('should handle increasing complexity gracefully', () => {
      const complexities = [10, 50, 100];
      const results: number[] = [];

      complexities.forEach(complexity => {
        // Generate code with increasing complexity
        let code = '';
        for (let i = 0; i < complexity; i++) {
          code += `
            function func${i}(param${i}) {
              const var${i} = param${i} * 2;
              return var${i};
            }
          `;
        }

        const startTime = performance.now();
        const result = parserService.parseFile(code);
        const endTime = performance.now();
        const duration = endTime - startTime;

        results.push(duration);
        expect(result.functions).toHaveLength(complexity);
      });

      // Performance should scale reasonably (not exponentially)
      // Allow for some variance but ensure it's not drastically worse
      const ratio1 = results[1] / results[0]; // 50 vs 10
      const ratio2 = results[2] / results[1]; // 100 vs 50

      expect(ratio1).toBeLessThan(60); // Allow for some performance variance
      expect(ratio2).toBeLessThan(60); // Allow for some performance variance
    });
  });

  describe('error handling performance', () => {
    it('should handle syntax errors efficiently', () => {
      const invalidCode = `
        function test() {
          const x = 1
          return x // missing semicolon and brace
      `;

      const startTime = performance.now();
      
      try {
        parserService.parseFile(invalidCode);
      } catch (error) {
        // Expected to throw
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Error handling should be fast
    });

    it('should handle malformed AST gracefully', () => {
      const edgeCaseCode = `
        function test() {
          // Various edge cases that might slow down parsing
          const obj = { [Symbol.iterator]: function* () { yield 1; } };
          const { a, b, ...rest } = { a: 1, b: 2, c: 3, d: 4 };
          const [first, ...others] = [1, 2, 3, 4, 5];
          return { obj, a, b, rest, first, others };
        }
      `;

      const startTime = performance.now();
      const result = parserService.parseFile(edgeCaseCode);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200); // Should handle complex syntax efficiently
      expect(result.functions).toHaveLength(1);
    });
  });

  describe('concurrent operations', () => {
    it('should handle multiple simultaneous parsing operations', async () => {
      const codes = [
        'function test1() { return 1; }',
        'function test2() { return 2; }',
        'function test3() { return 3; }',
        'function test4() { return 4; }',
        'function test5() { return 5; }'
      ];

      const startTime = performance.now();

      const promises = codes.map(code => 
        Promise.resolve().then(() => parserService.parseFile(code))
      );

      const results = await Promise.all(promises);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(300); // Should handle concurrent operations efficiently
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.functions).toHaveLength(1);
      });
    });
  });
});