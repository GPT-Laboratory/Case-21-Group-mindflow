import { Node } from '@babel/types';
import { vi } from 'vitest';
import {
  ASTExtractor,
  ASTParser,
  ASTTraverser,
  NodeVisitor,
  ParameterExtractor,
  CommentProcessor,
  SyntaxValidator,
  NodeValidator,
  CodeValidator,
  ParameterMetadata,
  EnhancedCommentMetadata
} from '../CoreInterfaces';
import { SourceLocation, CommentMetadata } from '../../types/ASTTypes';

describe('CoreInterfaces', () => {
  describe('ASTExtractor interface', () => {
    it('should define extract method with correct signature', () => {
      // Mock implementation to test interface contract
      class MockExtractor implements ASTExtractor<string> {
        extract(ast: Node): string[] {
          return ['test'];
        }
      }

      const extractor = new MockExtractor();
      const mockNode = { type: 'Program' } as Node;
      const result = extractor.extract(mockNode);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(['test']);
    });

    it('should support generic type parameter', () => {
      interface TestMetadata {
        name: string;
        value: number;
      }

      class TypedExtractor implements ASTExtractor<TestMetadata> {
        extract(ast: Node): TestMetadata[] {
          return [{ name: 'test', value: 42 }];
        }
      }

      const extractor = new TypedExtractor();
      const mockNode = { type: 'Program' } as Node;
      const result = extractor.extract(mockNode);

      expect(result[0]).toEqual({ name: 'test', value: 42 });
    });
  });

  describe('ASTParser interface', () => {
    it('should define parse method with correct signature', () => {
      class MockParser implements ASTParser {
        parse(code: string): Node {
          return { type: 'Program', body: [] } as Node;
        }
      }

      const parser = new MockParser();
      const result = parser.parse('function test() {}');

      expect(result).toBeDefined();
      expect(result.type).toBe('Program');
    });

    it('should be substitutable (LSP compliance)', () => {
      class BabelMockParser implements ASTParser {
        parse(code: string): Node {
          return { type: 'Program', body: [], sourceType: 'module' } as Node;
        }
      }

      class AcornMockParser implements ASTParser {
        parse(code: string): Node {
          return { type: 'Program', body: [], sourceType: 'script' } as Node;
        }
      }

      const parsers: ASTParser[] = [new BabelMockParser(), new AcornMockParser()];
      
      parsers.forEach(parser => {
        const result = parser.parse('const x = 1;');
        expect(result.type).toBe('Program');
      });
    });
  });

  describe('ASTTraverser interface', () => {
    it('should define traverse method with correct signature', () => {
      class MockTraverser implements ASTTraverser {
        traverse(node: Node, visitor: NodeVisitor): void {
          visitor.visit(node);
        }
      }

      const traverser = new MockTraverser();
      const mockNode = { type: 'Program' } as Node;
      const mockVisitor: NodeVisitor = {
        visit: vi.fn()
      };

      traverser.traverse(mockNode, mockVisitor);

      expect(mockVisitor.visit).toHaveBeenCalledWith(mockNode);
    });

    it('should work with visitor pattern', () => {
      class MockTraverser implements ASTTraverser {
        traverse(node: Node, visitor: NodeVisitor): void {
          visitor.visit(node);
          // Simulate traversing children
          if ((node as any).body) {
            (node as any).body.forEach((child: Node) => {
              visitor.visit(child);
            });
          }
        }
      }

      const traverser = new MockTraverser();
      const mockNode = {
        type: 'Program',
        body: [
          { type: 'FunctionDeclaration' },
          { type: 'VariableDeclaration' }
        ]
      } as Node;

      const visitedNodes: string[] = [];
      const visitor: NodeVisitor = {
        visit: (node: Node) => {
          visitedNodes.push(node.type);
        }
      };

      traverser.traverse(mockNode, visitor);

      expect(visitedNodes).toEqual(['Program', 'FunctionDeclaration', 'VariableDeclaration']);
    });
  });

  describe('NodeVisitor interface', () => {
    it('should define visit method with correct signature', () => {
      const visitor: NodeVisitor = {
        visit: vi.fn()
      };

      const mockNode = { type: 'FunctionDeclaration' } as Node;
      visitor.visit(mockNode);

      expect(visitor.visit).toHaveBeenCalledWith(mockNode);
    });

    it('should be implementable with different behaviors', () => {
      class CountingVisitor implements NodeVisitor {
        count = 0;
        visit(node: Node): void {
          this.count++;
        }
      }

      class TypeCollectingVisitor implements NodeVisitor {
        types: string[] = [];
        visit(node: Node): void {
          this.types.push(node.type);
        }
      }

      const countingVisitor = new CountingVisitor();
      const typeCollectingVisitor = new TypeCollectingVisitor();

      const mockNode = { type: 'Program' } as Node;

      countingVisitor.visit(mockNode);
      typeCollectingVisitor.visit(mockNode);

      expect(countingVisitor.count).toBe(1);
      expect(typeCollectingVisitor.types).toEqual(['Program']);
    });
  });

  describe('ParameterExtractor interface', () => {
    it('should define extractParameters method with correct signature', () => {
      class MockParameterExtractor implements ParameterExtractor {
        extractParameters(params: any[]): ParameterMetadata[] {
          return params.map(param => ({
            name: param.name || 'unknown',
            type: 'any',
            isOptional: false,
            sourceLocation: {
              start: { line: 1, column: 0 },
              end: { line: 1, column: 10 }
            }
          }));
        }
      }

      const extractor = new MockParameterExtractor();
      const mockParams = [{ name: 'param1' }, { name: 'param2' }];
      const result = extractor.extractParameters(mockParams);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('param1');
      expect(result[1].name).toBe('param2');
    });

    it('should follow ISP by only including parameter-specific methods', () => {
      // This test verifies that the interface is focused and minimal
      const extractor: ParameterExtractor = {
        extractParameters: vi.fn().mockReturnValue([])
      };

      // Should only have extractParameters method
      expect(typeof extractor.extractParameters).toBe('function');
      expect(Object.keys(extractor)).toEqual(['extractParameters']);
    });
  });

  describe('CommentProcessor interface', () => {
    it('should define processComments method with correct signature', () => {
      class MockCommentProcessor implements CommentProcessor {
        processComments(node: Node): CommentMetadata[] {
          return [{
            type: 'line',
            value: 'test comment',
            sourceLocation: {
              start: { line: 1, column: 0 },
              end: { line: 1, column: 15 }
            }
          }];
        }
      }

      const processor = new MockCommentProcessor();
      const mockNode = { type: 'FunctionDeclaration' } as Node;
      const result = processor.processComments(mockNode);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('test comment');
      expect(result[0].type).toBe('line');
    });

    it('should follow ISP by only including comment-specific methods', () => {
      // This test verifies that the interface is focused and minimal
      const processor: CommentProcessor = {
        processComments: vi.fn().mockReturnValue([])
      };

      // Should only have processComments method
      expect(typeof processor.processComments).toBe('function');
      expect(Object.keys(processor)).toEqual(['processComments']);
    });
  });

  describe('SyntaxValidator interface', () => {
    it('should define validateSyntax method with correct signature', () => {
      class MockSyntaxValidator implements SyntaxValidator {
        validateSyntax(code: string): boolean {
          return code.includes('function');
        }
      }

      const validator = new MockSyntaxValidator();
      
      expect(validator.validateSyntax('function test() {}')).toBe(true);
      expect(validator.validateSyntax('const x = 1;')).toBe(false);
    });

    it('should separate validation from parsing concerns', () => {
      // Mock implementations showing separation of concerns
      class SyntaxOnlyValidator implements SyntaxValidator {
        validateSyntax(code: string): boolean {
          // Only validates syntax, doesn't parse
          return !code.includes('syntax error');
        }
      }

      class ParsingOnlyParser implements ASTParser {
        parse(code: string): Node {
          // Only parses, doesn't validate
          return { type: 'Program', body: [] } as Node;
        }
      }

      const validator = new SyntaxOnlyValidator();
      const parser = new ParsingOnlyParser();

      // Each has a single responsibility
      expect(validator.validateSyntax('valid code')).toBe(true);
      expect(parser.parse('any code').type).toBe('Program');
    });
  });

  describe('NodeValidator interface', () => {
    it('should define validation methods with correct signatures', () => {
      class MockNodeValidator implements NodeValidator {
        validateNode(node: any, expectedType?: string): void {
          if (!node || typeof node.type !== 'string') {
            throw new Error('Invalid node');
          }
          if (expectedType && node.type !== expectedType) {
            throw new Error(`Expected ${expectedType}, got ${node.type}`);
          }
        }

        validateParameters(params: any[]): void {
          if (!Array.isArray(params)) {
            throw new Error('Parameters must be an array');
          }
        }
      }

      const validator = new MockNodeValidator();
      
      // Should not throw for valid node
      expect(() => validator.validateNode({ type: 'Program' })).not.toThrow();
      
      // Should throw for invalid node
      expect(() => validator.validateNode(null)).toThrow('Invalid node');
      
      // Should throw for wrong type
      expect(() => validator.validateNode({ type: 'Program' }, 'Function')).toThrow('Expected Function, got Program');
      
      // Should not throw for valid parameters
      expect(() => validator.validateParameters([])).not.toThrow();
      
      // Should throw for invalid parameters
      expect(() => validator.validateParameters('not an array' as any)).toThrow('Parameters must be an array');
    });
  });

  describe('CodeValidator interface', () => {
    it('should define validateSourceCode method with correct signature', () => {
      class MockCodeValidator implements CodeValidator {
        validateSourceCode(code: string): void {
          if (typeof code !== 'string') {
            throw new Error('Code must be a string');
          }
          if (code.trim().length === 0) {
            throw new Error('Code cannot be empty');
          }
        }
      }

      const validator = new MockCodeValidator();
      
      // Should not throw for valid code
      expect(() => validator.validateSourceCode('function test() {}')).not.toThrow();
      
      // Should throw for non-string
      expect(() => validator.validateSourceCode(null as any)).toThrow('Code must be a string');
      
      // Should throw for empty code
      expect(() => validator.validateSourceCode('')).toThrow('Code cannot be empty');
    });
  });

  describe('Enhanced metadata interfaces', () => {
    it('should define ParameterMetadata with required fields', () => {
      const param: ParameterMetadata = {
        name: 'testParam',
        type: 'string',
        isOptional: false,
        sourceLocation: {
          start: { line: 1, column: 0 },
          end: { line: 1, column: 10 }
        }
      };

      expect(param.name).toBe('testParam');
      expect(param.type).toBe('string');
      expect(param.isOptional).toBe(false);
      expect(param.sourceLocation).toBeDefined();
    });

    it('should define EnhancedCommentMetadata with enhanced fields', () => {
      const comment: EnhancedCommentMetadata = {
        text: 'This is a test comment',
        type: 'block',
        position: 'leading',
        sourceLocation: {
          start: { line: 1, column: 0 },
          end: { line: 1, column: 25 }
        },
        tags: ['@param', '@returns']
      };

      expect(comment.text).toBe('This is a test comment');
      expect(comment.type).toBe('block');
      expect(comment.position).toBe('leading');
      expect(comment.tags).toEqual(['@param', '@returns']);
    });
  });

  describe('SOLID principles compliance', () => {
    it('should support Single Responsibility Principle', () => {
      // Each interface has a single, well-defined responsibility
      const extractor: ASTExtractor<string> = { extract: vi.fn() };
      const parser: ASTParser = { parse: vi.fn() };
      const traverser: ASTTraverser = { traverse: vi.fn() };
      const visitor: NodeVisitor = { visit: vi.fn() };

      // Each interface focuses on one concern
      expect(Object.keys(extractor)).toEqual(['extract']);
      expect(Object.keys(parser)).toEqual(['parse']);
      expect(Object.keys(traverser)).toEqual(['traverse']);
      expect(Object.keys(visitor)).toEqual(['visit']);
    });

    it('should support Open/Closed Principle', () => {
      // New extractors can be added without modifying existing ones
      class FunctionExtractor implements ASTExtractor<any> {
        extract(ast: Node): any[] { return []; }
      }

      class VariableExtractor implements ASTExtractor<any> {
        extract(ast: Node): any[] { return []; }
      }

      // Both implement the same interface, can be used interchangeably
      const extractors: ASTExtractor<any>[] = [
        new FunctionExtractor(),
        new VariableExtractor()
      ];

      extractors.forEach(extractor => {
        expect(typeof extractor.extract).toBe('function');
      });
    });

    it('should support Liskov Substitution Principle', () => {
      // Different implementations should be substitutable
      class MockParser1 implements ASTParser {
        parse(code: string): Node {
          return { type: 'Program', body: [] } as Node;
        }
      }

      class MockParser2 implements ASTParser {
        parse(code: string): Node {
          return { type: 'Program', body: [], sourceType: 'module' } as Node;
        }
      }

      const testParser = (parser: ASTParser) => {
        const result = parser.parse('test code');
        expect(result.type).toBe('Program');
      };

      // Both implementations work with the same interface
      testParser(new MockParser1());
      testParser(new MockParser2());
    });

    it('should support Interface Segregation Principle', () => {
      // Interfaces are minimal and focused
      // ParameterExtractor only has parameter-related methods
      const paramExtractor: ParameterExtractor = {
        extractParameters: vi.fn()
      };

      // CommentProcessor only has comment-related methods
      const commentProcessor: CommentProcessor = {
        processComments: vi.fn()
      };

      // Each interface is focused on its specific concern
      expect(Object.keys(paramExtractor)).toEqual(['extractParameters']);
      expect(Object.keys(commentProcessor)).toEqual(['processComments']);
    });

    it('should support Dependency Inversion Principle', () => {
      // High-level modules depend on abstractions, not concretions
      class HighLevelService {
        constructor(
          private parser: ASTParser,
          private extractor: ASTExtractor<any>
        ) {}

        process(code: string): any[] {
          const ast = this.parser.parse(code);
          return this.extractor.extract(ast);
        }
      }

      // Service depends on interfaces, not concrete implementations
      const mockParser: ASTParser = { parse: vi.fn().mockReturnValue({ type: 'Program' }) };
      const mockExtractor: ASTExtractor<any> = { extract: vi.fn().mockReturnValue([]) };

      const service = new HighLevelService(mockParser, mockExtractor);
      service.process('test code');

      expect(mockParser.parse).toHaveBeenCalled();
      expect(mockExtractor.extract).toHaveBeenCalled();
    });
  });
});