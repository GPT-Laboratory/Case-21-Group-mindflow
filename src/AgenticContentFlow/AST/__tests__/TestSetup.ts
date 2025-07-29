import { expect, vi } from 'vitest';
import type { MockedFunction } from 'vitest';
import { FunctionMetadata, VariableDeclaration, FunctionCall, CommentMetadata, ExternalDependency } from '../types/ASTTypes';

/**
 * Test utilities for creating mocked dependencies with proper typing
 */
export class TestSetup {
  /**
   * Creates a mock ASTParser with proper typing
   */
  static createMockParser(): {
    parse: MockedFunction<any>;
  } {
    return {
      parse: vi.fn()
    };
  }

  /**
   * Creates a mock ASTTraverser with proper typing
   */
  static createMockTraverser(): {
    traverse: MockedFunction<any>;
    getCurrentDepth: MockedFunction<any>;
    getMaxDepth: MockedFunction<any>;
    getVisitedNodeCount: MockedFunction<any>;
    reset: MockedFunction<any>;
    clone: MockedFunction<any>;
  } {
    return {
      traverse: vi.fn(),
      getCurrentDepth: vi.fn().mockReturnValue(0),
      getMaxDepth: vi.fn().mockReturnValue(100),
      getVisitedNodeCount: vi.fn().mockReturnValue(0),
      reset: vi.fn(),
      clone: vi.fn()
    };
  }

  /**
   * Creates a mock extractor with proper typing
   */
  static createMockExtractor<_T>(): {
    extract: MockedFunction<any>;
  } {
    return {
      extract: vi.fn().mockReturnValue([])
    };
  }

  /**
   * Creates a complete set of mock extractors for ASTParserService
   */
  static createMockExtractors(): Map<string, { extract: MockedFunction<any> }> {
    return new Map([
      ['function', this.createMockExtractor<FunctionMetadata>()],
      ['call', this.createMockExtractor<FunctionCall>()],
      ['variable', this.createMockExtractor<VariableDeclaration>()],
      ['comment', this.createMockExtractor<CommentMetadata>()],
      ['dependency', this.createMockExtractor<ExternalDependency>()]
    ]);
  }

  /**
   * Creates a complete FunctionMetadata object for testing
   */
  static createMockFunctionMetadata(overrides: Partial<FunctionMetadata> = {}): FunctionMetadata {
    return {
      id: 'test_function_1',
      name: 'testFunction',
      description: 'Test function description',
      parameters: [],
      sourceLocation: {
        start: { line: 1, column: 0 },
        end: { line: 3, column: 1 }
      },
      isNested: false,
      parentFunction: undefined,
      scope: 'global' as const,
      code: 'function testFunction() {}',
      ...overrides
    };
  }

  /**
   * Creates a complete VariableDeclaration object for testing
   */
  static createMockVariableDeclaration(overrides: Partial<VariableDeclaration> = {}): VariableDeclaration {
    return {
      name: 'testVar',
      type: 'const' as const,
      sourceLocation: {
        start: { line: 1, column: 0 },
        end: { line: 1, column: 15 }
      },
      scope: 'global' as const,
      defaultValue: undefined,
      description: '',
      ...overrides
    };
  }

  /**
   * Creates a complete FunctionCall object for testing
   */
  static createMockFunctionCall(overrides: Partial<FunctionCall> = {}): FunctionCall {
    return {
      id: 'call_1',
      callerFunction: 'caller',
      calledFunction: 'called',
      isExternal: false,
      sourceLocation: {
        start: { line: 1, column: 0 },
        end: { line: 1, column: 10 }
      },
      ...overrides
    };
  }

  /**
   * Creates a complete CommentMetadata object for testing
   */
  static createMockCommentMetadata(overrides: Partial<CommentMetadata> = {}): CommentMetadata {
    return {
      value: 'Test comment',
      type: 'block' as const,
      sourceLocation: {
        start: { line: 1, column: 0 },
        end: { line: 1, column: 15 }
      },
      associatedFunction: undefined,
      ...overrides
    };
  }

  /**
   * Creates a complete ExternalDependency object for testing
   */
  static createMockExternalDependency(overrides: Partial<ExternalDependency> = {}): ExternalDependency {
    return {
      name: 'testDependency',
      type: 'import' as const,
      source: './test-module',
      ...overrides
    };
  }

  /**
   * Sets up a mock traverser to simulate visiting specific nodes
   */
  static setupMockTraverserWithNodes(
    mockTraverser: { traverse: MockedFunction<any> },
    nodes: Array<{ node: any; shouldProcess: boolean }>
  ): void {
    mockTraverser.traverse.mockImplementation((_ast, visitor) => {
      nodes.forEach(({ node, shouldProcess }) => {
        if (shouldProcess && visitor && typeof (visitor as any).visit === 'function') {
          (visitor as any).visit(node);
        }
      });
    });
  }

  /**
   * Creates a mock notification system for testing
   */
  static createMockNotifications() {
    return {
      showErrorToast: vi.fn(),
      showWarningToast: vi.fn(),
      showInfoToast: vi.fn(),
      showSuccessToast: vi.fn(),
      showToast: vi.fn(),
      showBlockingNotification: vi.fn(),
      updateBlockingNotification: vi.fn(),
      completeBlockingNotification: vi.fn(),
      failBlockingNotification: vi.fn(),
      removeNotification: vi.fn(),
      clearAllNotifications: vi.fn(),
      clearToasts: vi.fn(),
      hasBlockingNotifications: false,
      blockingNotifications: [],
      toastNotifications: []
    };
  }

  /**
   * Creates a mock AST node for testing
   */
  static createMockASTNode(type: string, properties: Record<string, any> = {}): any {
    return {
      type,
      loc: {
        start: { line: 1, column: 0 },
        end: { line: 1, column: 10 }
      },
      ...properties
    };
  }

  /**
   * Creates a mock visitor for testing traversal
   */
  static createMockVisitor(): { visit: MockedFunction<any> } {
    return {
      visit: vi.fn()
    };
  }

  /**
   * Utility to wait for async operations in tests
   */
  static async waitForAsync(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  /**
   * Creates a performance measurement wrapper for testing
   */
  static measurePerformance<T>(fn: () => T): { result: T; duration: number } {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    return {
      result,
      duration: endTime - startTime
    };
  }

  /**
   * Creates a mock parsed file structure for testing
   */
  static createMockParsedFileStructure(overrides: any = {}) {
    return {
      functions: [],
      calls: [],
      variables: [],
      comments: [],
      dependencies: [],
      ...overrides
    };
  }

  /**
   * Resets all mocks in a test setup
   */
  static resetAllMocks(): void {
    vi.clearAllMocks();
  }

  /**
   * Creates a test code sample for consistent testing
   */
  static getTestCodeSample(type: 'simple' | 'complex' | 'nested' = 'simple'): string {
    switch (type) {
      case 'simple':
        return `
          function testFunction(param) {
            const result = param * 2;
            return result;
          }
        `;

      case 'complex':
        return `
          /**
           * Complex function with multiple features
           */
          function complexFunction(a, b = 10, ...rest) {
            const { x, y } = a;
            const [first, ...others] = rest;
            
            function innerFunction() {
              return x + y;
            }
            
            const result = innerFunction() + b;
            console.log('Result:', result);
            return result;
          }
          
          const data = { x: 1, y: 2 };
          const output = complexFunction(data, 5, 1, 2, 3);
        `;

      case 'nested':
        return `
          function outerFunction() {
            function middleFunction() {
              function innerFunction() {
                return 'deeply nested';
              }
              return innerFunction();
            }
            return middleFunction();
          }
        `;

      default:
        return this.getTestCodeSample('simple');
    }
  }
}

/**
 * Common test assertions for AST components
 */
export class TestAssertions {
  /**
   * Asserts that a function metadata object is valid
   */
  static assertValidFunctionMetadata(func: FunctionMetadata): void {
    expect(func).toHaveProperty('id');
    expect(func).toHaveProperty('name');
    expect(func).toHaveProperty('parameters');
    expect(func).toHaveProperty('sourceLocation');
    expect(func).toHaveProperty('isNested');
    expect(func).toHaveProperty('scope');
    expect(func).toHaveProperty('code');

    expect(typeof func.id).toBe('string');
    expect(typeof func.name).toBe('string');
    expect(Array.isArray(func.parameters)).toBe(true);
    expect(typeof func.isNested).toBe('boolean');
  }

  /**
   * Asserts that a variable declaration object is valid
   */
  static assertValidVariableDeclaration(variable: VariableDeclaration): void {
    expect(variable).toHaveProperty('name');
    expect(variable).toHaveProperty('type');
    expect(variable).toHaveProperty('sourceLocation');
    expect(variable).toHaveProperty('scope');

    expect(typeof variable.name).toBe('string');
    expect(['var', 'let', 'const'].includes(variable.type)).toBe(true);
    expect(['global', 'function', 'block'].includes(variable.scope)).toBe(true);
  }

  /**
   * Asserts that a function call object is valid
   */
  static assertValidFunctionCall(call: FunctionCall): void {
    expect(call).toHaveProperty('id');
    expect(call).toHaveProperty('callerFunction');
    expect(call).toHaveProperty('calledFunction');
    expect(call).toHaveProperty('isExternal');
    expect(call).toHaveProperty('sourceLocation');

    expect(typeof call.id).toBe('string');
    expect(typeof call.callerFunction).toBe('string');
    expect(typeof call.calledFunction).toBe('string');
    expect(typeof call.isExternal).toBe('boolean');
  }

  /**
   * Asserts that source location is valid
   */
  static assertValidSourceLocation(location: any): void {
    expect(location).toHaveProperty('start');
    expect(location).toHaveProperty('end');
    expect(location.start).toHaveProperty('line');
    expect(location.start).toHaveProperty('column');
    expect(location.end).toHaveProperty('line');
    expect(location.end).toHaveProperty('column');

    expect(typeof location.start.line).toBe('number');
    expect(typeof location.start.column).toBe('number');
    expect(typeof location.end.line).toBe('number');
    expect(typeof location.end.column).toBe('number');
  }
}