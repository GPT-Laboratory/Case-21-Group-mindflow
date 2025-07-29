# Design Document

## Overview

This design addresses systematic test infrastructure failures in the Agentic Content Flow application by creating comprehensive mock implementations, test utilities, and improved testing patterns. The current test suite has 72 failing tests out of 1117 total tests, concentrated in five key areas that require different architectural solutions.

**Current Test Infrastructure Problems:**
- **FlowCodeSynchronizer Tests**: Mock ASTParserService returns empty arrays instead of realistic parsed data, causing synchronization tests to fail because they expect actual JavaScript parsing results
- **React Component Tests**: Missing or incorrectly configured mock implementations for React hooks and contexts, causing component rendering failures and Testing Library query failures
- **Handle Registry Tests**: Handle type registry not properly initialized in test environment, causing connection validation to return defaults instead of expected configurations
- **UI Component Tests**: Mock viewport and flow context not properly configured, causing position-dependent functionality to fail
- **Utility Function Tests**: Logic errors in algorithms like parent node selection, causing incorrect behavior in tests

**Design Goals:**
- Create realistic mock implementations that accurately simulate production behavior
- Establish reusable test infrastructure components and utilities
- Implement proper test isolation and cleanup mechanisms
- Provide comprehensive test coverage for edge cases and error conditions
- Ensure test maintainability and ease of adding new tests
- Optimize test performance while maintaining accuracy

## Architecture

### Core Test Infrastructure Components

The design introduces a layered test infrastructure architecture:

```
test-infrastructure/
├── mocks/
│   ├── ASTParserServiceMock.ts          # Realistic AST parsing simulation
│   ├── ReactFlowMocks.ts                # React Flow component mocks
│   ├── NodeContextMocks.ts              # Node context provider mocks
│   └── ViewportMocks.ts                 # Viewport operation mocks
├── factories/
│   ├── MockDataFactory.ts               # Test data generation
│   ├── FlowStructureFactory.ts          # Flow structure creation
│   └── ParsedStructureFactory.ts        # Parsed AST structure creation
├── utilities/
│   ├── TestSetupHelpers.ts              # Common test setup patterns
│   ├── MockRegistryInitializer.ts       # Handle registry initialization
│   └── TestCleanupHelpers.ts            # Test cleanup utilities
└── providers/
    ├── TestContextProviders.tsx         # React context providers for tests
    └── MockProviderWrapper.tsx          # Wrapper for component tests
```

## Components and Interfaces

### 1. Mock AST Parser Service

**Problem**: Current mock returns empty arrays, causing FlowCodeSynchronizer tests to fail because they expect realistic parsed data.

**Solution**: Create a comprehensive mock that simulates actual JavaScript parsing:

```typescript
export class MockASTParserService implements ASTParserServiceInterface {
  private mockResponses: Map<string, ParsedFileStructure> = new Map();
  private defaultResponse: ParsedFileStructure;

  constructor() {
    this.defaultResponse = {
      functions: [],
      calls: [],
      variables: [],
      comments: [],
      dependencies: []
    };
  }

  // Configure mock to return specific data for specific code
  configureMockResponse(code: string, response: ParsedFileStructure): void {
    this.mockResponses.set(this.normalizeCode(code), response);
  }

  // Configure mock to return realistic data based on code analysis
  configureRealisticResponse(code: string): void {
    const parsed = this.analyzeCodeForMocking(code);
    this.mockResponses.set(this.normalizeCode(code), parsed);
  }

  parseFile(code: string): ParsedFileStructure {
    const normalizedCode = this.normalizeCode(code);
    
    // Return configured response if available
    if (this.mockResponses.has(normalizedCode)) {
      return this.mockResponses.get(normalizedCode)!;
    }

    // Generate realistic response based on code content
    return this.generateRealisticResponse(code);
  }

  private generateRealisticResponse(code: string): ParsedFileStructure {
    // Simple pattern matching to create realistic mock data
    const functions = this.extractFunctionPatterns(code);
    const calls = this.extractCallPatterns(code, functions);
    const variables = this.extractVariablePatterns(code);
    const comments = this.extractCommentPatterns(code);

    return {
      functions,
      calls,
      variables,
      comments,
      dependencies: []
    };
  }

  private extractFunctionPatterns(code: string): FunctionMetadata[] {
    const functionRegex = /function\s+(\w+)\s*\(([^)]*)\)/g;
    const functions: FunctionMetadata[] = [];
    let match;
    let index = 0;

    while ((match = functionRegex.exec(code)) !== null) {
      const [fullMatch, name, params] = match;
      const paramList = params.split(',').map(p => p.trim()).filter(p => p);
      
      functions.push({
        id: `${name}_${index}`,
        name,
        parameters: paramList.map(param => ({
          name: param,
          type: 'unknown'
        })),
        returnType: 'unknown',
        sourceLocation: {
          start: { line: this.getLineNumber(code, match.index), column: 0 },
          end: { line: this.getLineNumber(code, match.index), column: fullMatch.length }
        },
        description: this.extractFunctionDescription(code, match.index),
        isNested: this.isNestedFunction(code, match.index),
        scope: 'global',
        code: this.extractFunctionCode(code, match.index, name)
      });
      index++;
    }

    return functions;
  }

  private extractCallPatterns(code: string, functions: FunctionMetadata[]): CallMetadata[] {
    const calls: CallMetadata[] = [];
    const functionNames = functions.map(f => f.name);
    
    functionNames.forEach(funcName => {
      const callRegex = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
      let match;
      
      while ((match = callRegex.exec(code)) !== null) {
        const callerFunction = this.findContainingFunction(code, match.index, functions);
        if (callerFunction && callerFunction !== funcName) {
          calls.push({
            id: `call_${calls.length}`,
            callerFunction,
            calledFunction: funcName,
            sourceLocation: {
              start: { line: this.getLineNumber(code, match.index), column: 0 },
              end: { line: this.getLineNumber(code, match.index), column: match[0].length }
            },
            isExternal: false
          });
        }
      }
    });

    return calls;
  }

  // Helper methods for realistic data generation
  private normalizeCode(code: string): string {
    return code.replace(/\s+/g, ' ').trim();
  }

  private getLineNumber(code: string, index: number): number {
    return code.substring(0, index).split('\n').length;
  }

  private extractFunctionDescription(code: string, functionIndex: number): string {
    // Look for JSDoc comments before the function
    const beforeFunction = code.substring(0, functionIndex);
    const commentMatch = beforeFunction.match(/\/\*\*[\s\S]*?\*\//g);
    if (commentMatch && commentMatch.length > 0) {
      const lastComment = commentMatch[commentMatch.length - 1];
      return lastComment.replace(/\/\*\*|\*\/|\*/g, '').trim();
    }
    return '';
  }

  private isNestedFunction(code: string, functionIndex: number): boolean {
    const beforeFunction = code.substring(0, functionIndex);
    const openBraces = (beforeFunction.match(/{/g) || []).length;
    const closeBraces = (beforeFunction.match(/}/g) || []).length;
    return openBraces > closeBraces;
  }

  private findContainingFunction(code: string, callIndex: number, functions: FunctionMetadata[]): string | null {
    for (const func of functions) {
      const funcStart = code.indexOf(`function ${func.name}`);
      const funcEnd = this.findFunctionEnd(code, funcStart);
      if (callIndex > funcStart && callIndex < funcEnd) {
        return func.name;
      }
    }
    return null;
  }

  private findFunctionEnd(code: string, startIndex: number): number {
    let braceCount = 0;
    let inFunction = false;
    
    for (let i = startIndex; i < code.length; i++) {
      if (code[i] === '{') {
        braceCount++;
        inFunction = true;
      } else if (code[i] === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
          return i;
        }
      }
    }
    return code.length;
  }

  private extractFunctionCode(code: string, functionIndex: number, functionName: string): string {
    const start = code.indexOf(`function ${functionName}`, functionIndex);
    const end = this.findFunctionEnd(code, start);
    return code.substring(start, end + 1);
  }

  private extractVariablePatterns(code: string): VariableMetadata[] {
    const variables: VariableMetadata[] = [];
    const patterns = [
      /(?:const|let|var)\s+(\w+)\s*=\s*([^;]+)/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const [fullMatch, name, value] = match;
        variables.push({
          name,
          type: fullMatch.startsWith('const') ? 'const' : 
                fullMatch.startsWith('let') ? 'let' : 'var',
          defaultValue: value.trim(),
          sourceLocation: {
            start: { line: this.getLineNumber(code, match.index), column: 0 },
            end: { line: this.getLineNumber(code, match.index), column: fullMatch.length }
          },
          scope: 'global',
          description: ''
        });
      }
    });

    return variables;
  }

  private extractCommentPatterns(code: string): CommentMetadata[] {
    const comments: CommentMetadata[] = [];
    const patterns = [
      /\/\*[\s\S]*?\*\//g,  // Block comments
      /\/\/.*$/gm           // Line comments
    ];

    patterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        comments.push({
          text: match[0].replace(/^\/\*|\*\/$|^\/\//g, '').trim(),
          type: index === 0 ? 'block' : 'line',
          position: 'leading',
          sourceLocation: {
            start: { line: this.getLineNumber(code, match.index), column: 0 },
            end: { line: this.getLineNumber(code, match.index), column: match[0].length }
          }
        });
      }
    });

    return comments;
  }
}
```

### 2. Test Data Factories

**Problem**: Tests need realistic, configurable test data but currently create it manually or use empty structures.

**Solution**: Create factory classes that generate consistent, realistic test data:

```typescript
export class MockDataFactory {
  static createFunctionMetadata(overrides: Partial<FunctionMetadata> = {}): FunctionMetadata {
    return {
      id: `func_${Math.random().toString(36).substr(2, 9)}`,
      name: 'testFunction',
      parameters: [
        { name: 'param1', type: 'string' },
        { name: 'param2', type: 'number' }
      ],
      returnType: 'string',
      sourceLocation: {
        start: { line: 1, column: 0 },
        end: { line: 3, column: 1 }
      },
      description: 'Test function description',
      isNested: false,
      scope: 'global',
      code: 'function testFunction(param1, param2) {\n  return param1 + param2;\n}',
      ...overrides
    };
  }

  static createCallMetadata(overrides: Partial<CallMetadata> = {}): CallMetadata {
    return {
      id: `call_${Math.random().toString(36).substr(2, 9)}`,
      callerFunction: 'caller',
      calledFunction: 'target',
      sourceLocation: {
        start: { line: 2, column: 2 },
        end: { line: 2, column: 10 }
      },
      isExternal: false,
      ...overrides
    };
  }

  static createFlowStructure(overrides: Partial<FlowStructure> = {}): FlowStructure {
    return {
      id: `flow_${Math.random().toString(36).substr(2, 9)}`,
      fileName: 'test.js',
      description: 'Test flow structure',
      variables: [],
      nodes: [
        {
          id: 'node-1',
          type: 'default',
          position: { x: 100, y: 100 },
          data: {
            functionName: 'testFunction',
            description: 'Test function',
            parameters: [{ name: 'param', type: 'string' }],
            returnType: 'string'
          }
        }
      ],
      edges: [],
      metadata: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: '1.0.0',
        astVersion: '1.0.0'
      },
      ...overrides
    };
  }

  static createParsedFileStructure(overrides: Partial<ParsedFileStructure> = {}): ParsedFileStructure {
    return {
      functions: [this.createFunctionMetadata()],
      calls: [this.createCallMetadata()],
      variables: [],
      comments: [],
      dependencies: [],
      ...overrides
    };
  }

  // Scenario-specific factory methods
  static createCalculatorScenario(): ParsedFileStructure {
    return {
      functions: [
        this.createFunctionMetadata({
          id: 'add_0',
          name: 'add',
          parameters: [
            { name: 'a', type: 'number' },
            { name: 'b', type: 'number' }
          ],
          description: 'Adds two numbers',
          code: 'function add(a, b) {\n  return a + b;\n}'
        }),
        this.createFunctionMetadata({
          id: 'multiply_1',
          name: 'multiply',
          parameters: [
            { name: 'x', type: 'number' },
            { name: 'y', type: 'number' }
          ],
          description: 'Multiplies two numbers',
          code: 'function multiply(x, y) {\n  return add(x * y, 0);\n}'
        })
      ],
      calls: [
        this.createCallMetadata({
          id: 'call_0',
          callerFunction: 'multiply',
          calledFunction: 'add'
        })
      ],
      variables: [],
      comments: [],
      dependencies: []
    };
  }

  static createNestedFunctionScenario(): ParsedFileStructure {
    return {
      functions: [
        this.createFunctionMetadata({
          id: 'outer_0',
          name: 'outerFunction',
          isNested: false,
          code: 'function outerFunction() {\n  function inner() { return "inner"; }\n  return inner();\n}'
        }),
        this.createFunctionMetadata({
          id: 'inner_1',
          name: 'innerFunction',
          isNested: true,
          parentFunction: 'outer_0',
          scope: 'function',
          code: 'function innerFunction() {\n  return "inner";\n}'
        })
      ],
      calls: [
        this.createCallMetadata({
          callerFunction: 'outerFunction',
          calledFunction: 'innerFunction'
        })
      ],
      variables: [],
      comments: [],
      dependencies: []
    };
  }
}
```

### 3. React Component Test Infrastructure

**Problem**: React component tests fail due to missing context providers and incorrectly configured hooks.

**Solution**: Create comprehensive mock providers and hook implementations:

```typescript
// TestContextProviders.tsx
export const TestNodeContextProvider: React.FC<{ 
  children: React.ReactNode;
  mockNodes?: any[];
  mockFunctions?: Partial<NodeContextType>;
}> = ({ children, mockNodes = [], mockFunctions = {} }) => {
  const defaultContext: NodeContextType = {
    nodes: mockNodes,
    updateNode: vi.fn(),
    nodeMap: new Map(mockNodes.map(node => [node.id, node])),
    addNode: vi.fn(),
    removeNodes: vi.fn(),
    onNodesChange: vi.fn(),
    onNodeDrag: vi.fn(),
    onNodeDragStop: vi.fn(),
    isDragging: false,
    setNodes: vi.fn(),
    localNodes: mockNodes,
    ...mockFunctions
  };

  return (
    <NodeContext.Provider value={defaultContext}>
      {children}
    </NodeContext.Provider>
  );
};

export const TestReactFlowProvider: React.FC<{
  children: React.ReactNode;
  mockFunctions?: Partial<ReactFlowInstance>;
}> = ({ children, mockFunctions = {} }) => {
  const mockSetCenter = vi.fn();
  const mockFitView = vi.fn();

  const defaultReactFlow: Partial<ReactFlowInstance> = {
    setCenter: mockSetCenter,
    fitView: mockFitView,
    getNodes: vi.fn().mockReturnValue([]),
    getEdges: vi.fn().mockReturnValue([]),
    setNodes: vi.fn(),
    setEdges: vi.fn(),
    addNodes: vi.fn(),
    addEdges: vi.fn(),
    toObject: vi.fn(),
    deleteElements: vi.fn(),
    getNode: vi.fn(),
    getEdge: vi.fn(),
    getIntersectingNodes: vi.fn(),
    isNodeIntersecting: vi.fn(),
    updateNode: vi.fn(),
    updateNodeData: vi.fn(),
    updateEdge: vi.fn(),
    updateEdgeData: vi.fn(),
    setViewport: vi.fn(),
    getViewport: vi.fn().mockReturnValue({ x: 0, y: 0, zoom: 1 }),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    zoomTo: vi.fn(),
    getZoom: vi.fn().mockReturnValue(1),
    screenToFlowPosition: vi.fn(),
    flowToScreenPosition: vi.fn(),
    ...mockFunctions
  };

  // Mock the useReactFlow hook
  vi.mocked(useReactFlow).mockReturnValue(defaultReactFlow as ReactFlowInstance);

  return <>{children}</>;
};

// Complete test wrapper
export const TestWrapper: React.FC<{
  children: React.ReactNode;
  mockNodes?: any[];
  mockNodeFunctions?: Partial<NodeContextType>;
  mockReactFlowFunctions?: Partial<ReactFlowInstance>;
}> = ({ 
  children, 
  mockNodes = [], 
  mockNodeFunctions = {},
  mockReactFlowFunctions = {}
}) => {
  return (
    <TestReactFlowProvider mockFunctions={mockReactFlowFunctions}>
      <TestNodeContextProvider mockNodes={mockNodes} mockFunctions={mockNodeFunctions}>
        {children}
      </TestNodeContextProvider>
    </TestReactFlowProvider>
  );
};
```

### 4. Handle Registry Test Infrastructure

**Problem**: Handle registry not properly initialized in tests, causing connection validation to fail.

**Solution**: Create registry initialization utilities and proper test configurations:

```typescript
export class MockRegistryInitializer {
  static initializeHandleRegistry(): HandleTypeRegistry {
    const registry = HandleTypeRegistry.getInstance();
    registry.clear();

    // Register common test configurations
    const testConfigurations = this.getTestHandleConfigurations();
    testConfigurations.forEach(config => {
      registry.registerNodeHandles(config);
    });

    return registry;
  }

  static getTestHandleConfigurations(): NodeHandleConfiguration[] {
    return [
      {
        nodeType: 'function',
        category: 'logic',
        handles: [
          {
            position: 'right',
            type: 'source',
            dataFlow: 'control',
            connectsTo: ['logic', 'data'],
            edgeType: 'default'
          },
          {
            position: 'left',
            type: 'target',
            dataFlow: 'control',
            acceptsFrom: ['logic'],
            edgeType: 'default'
          }
        ]
      },
      {
        nodeType: 'datanode',
        category: 'data',
        handles: [
          {
            position: 'right',
            type: 'source',
            dataFlow: 'data',
            connectsTo: ['view', 'logic'],
            edgeType: 'package'
          },
          {
            position: 'top',
            type: 'target',
            dataFlow: 'control',
            acceptsFrom: ['logic'],
            edgeType: 'default'
          }
        ]
      },
      {
        nodeType: 'contentnode',
        category: 'view',
        handles: [
          {
            position: 'left',
            type: 'target',
            dataFlow: 'data',
            acceptsFrom: ['data'],
            edgeType: 'package'
          }
        ]
      }
    ];
  }

  static createCustomConfiguration(
    nodeType: string,
    category: string,
    handles: HandleConfiguration[]
  ): NodeHandleConfiguration {
    return {
      nodeType,
      category,
      handles
    };
  }

  static registerCustomConfiguration(config: NodeHandleConfiguration): void {
    const registry = HandleTypeRegistry.getInstance();
    registry.registerNodeHandles(config);
  }
}
```

### 5. Utility Function Fixes

**Problem**: Logic errors in utility functions like `getPotentialParents` causing incorrect behavior.

**Solution**: Fix the algorithms and create comprehensive test coverage:

```typescript
// Fixed getPotentialParents algorithm
export function getPotentialParents(
  targetNode: Node,
  allNodes: Node[],
  options: {
    maxDistance?: number;
    prioritizeOverlap?: boolean;
    excludeTypes?: string[];
  } = {}
): string[] {
  const {
    maxDistance = 200,
    prioritizeOverlap = true,
    excludeTypes = []
  } = options;

  if (!targetNode.position) {
    return [];
  }

  const candidates = allNodes
    .filter(node => {
      // Exclude self
      if (node.id === targetNode.id) return false;
      
      // Exclude specified types
      if (excludeTypes.includes(node.type || '')) return false;
      
      // Must have position
      if (!node.position) return false;
      
      return true;
    })
    .map(node => {
      const distance = calculateDistance(targetNode.position!, node.position!);
      const overlapArea = calculateOverlapArea(targetNode, node);
      
      return {
        nodeId: node.id,
        distance,
        overlapArea,
        score: this.calculateParentScore(distance, overlapArea, prioritizeOverlap)
      };
    })
    .filter(candidate => candidate.distance <= maxDistance)
    .sort((a, b) => b.score - a.score); // Higher score = better parent

  return candidates.map(c => c.nodeId);
}

function calculateDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function calculateOverlapArea(node1: Node, node2: Node): number {
  if (!node1.position || !node2.position) return 0;

  // Assume standard node dimensions if not provided
  const node1Width = node1.width || 150;
  const node1Height = node1.height || 40;
  const node2Width = node2.width || 150;
  const node2Height = node2.height || 40;

  const left = Math.max(node1.position.x, node2.position.x);
  const right = Math.min(
    node1.position.x + node1Width,
    node2.position.x + node2Width
  );
  const top = Math.max(node1.position.y, node2.position.y);
  const bottom = Math.min(
    node1.position.y + node1Height,
    node2.position.y + node2Height
  );

  if (left < right && top < bottom) {
    return (right - left) * (bottom - top);
  }

  return 0;
}

function calculateParentScore(
  distance: number,
  overlapArea: number,
  prioritizeOverlap: boolean
): number {
  // Normalize distance (closer = higher score)
  const distanceScore = Math.max(0, 1 - distance / 500);
  
  // Normalize overlap area (more overlap = higher score)
  const overlapScore = Math.min(1, overlapArea / 6000); // 6000 = full node overlap
  
  if (prioritizeOverlap) {
    return overlapScore * 0.7 + distanceScore * 0.3;
  } else {
    return distanceScore * 0.7 + overlapScore * 0.3;
  }
}
```

## Data Models

### Test Configuration Types

```typescript
export interface TestScenario {
  name: string;
  description: string;
  code: string;
  expectedParsedStructure: ParsedFileStructure;
  expectedFlowStructure?: Partial<FlowStructure>;
}

export interface MockConfiguration {
  parserService?: Partial<ASTParserServiceInterface>;
  nodeContext?: Partial<NodeContextType>;
  reactFlow?: Partial<ReactFlowInstance>;
  handleRegistry?: NodeHandleConfiguration[];
}

export interface TestSetupOptions {
  scenario?: TestScenario;
  mockConfig?: MockConfiguration;
  cleanup?: boolean;
  isolation?: boolean;
}
```

## Error Handling

### Test Error Recovery

```typescript
export class TestErrorHandler {
  static handleMockFailure(error: Error, context: string): void {
    console.error(`Mock failure in ${context}:`, error);
    
    // Provide fallback mock data
    if (context.includes('parser')) {
      return MockDataFactory.createParsedFileStructure();
    }
    
    throw new Error(`Test infrastructure failure: ${error.message}`);
  }

  static validateTestSetup(setup: TestSetupOptions): void {
    if (setup.scenario && !setup.scenario.code) {
      throw new Error('Test scenario must include code');
    }
    
    if (setup.mockConfig?.parserService && !setup.mockConfig.parserService.parseFile) {
      console.warn('Parser service mock missing parseFile method');
    }
  }
}
```

## Testing Strategy

### Test Infrastructure Testing

The test infrastructure itself needs to be tested to ensure reliability:

```typescript
describe('Test Infrastructure', () => {
  describe('MockASTParserService', () => {
    it('should generate realistic function metadata from code', () => {
      const mockParser = new MockASTParserService();
      const code = 'function test(a, b) { return a + b; }';
      
      const result = mockParser.parseFile(code);
      
      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].name).toBe('test');
      expect(result.functions[0].parameters).toHaveLength(2);
    });

    it('should detect function calls correctly', () => {
      const mockParser = new MockASTParserService();
      const code = `
        function caller() { return target(); }
        function target() { return 'result'; }
      `;
      
      const result = mockParser.parseFile(code);
      
      expect(result.calls).toHaveLength(1);
      expect(result.calls[0].callerFunction).toBe('caller');
      expect(result.calls[0].calledFunction).toBe('target');
    });
  });

  describe('TestWrapper', () => {
    it('should provide proper context to components', () => {
      const TestComponent = () => {
        const { nodes } = useNodeContext();
        return <div data-testid="node-count">{nodes.length}</div>;
      };

      const mockNodes = [{ id: '1', type: 'test' }];
      
      render(
        <TestWrapper mockNodes={mockNodes}>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('node-count')).toHaveTextContent('1');
    });
  });
});
```

### Integration Testing Strategy

```typescript
describe('FlowCodeSynchronizer Integration', () => {
  let synchronizer: FlowCodeSynchronizer;
  let mockParser: MockASTParserService;

  beforeEach(() => {
    mockParser = new MockASTParserService();
    synchronizer = new FlowCodeSynchronizer(mockParser);
  });

  it('should handle complete code-to-flow-to-code cycle', () => {
    const originalCode = `
      function add(a, b) {
        return a + b;
      }
      
      function multiply(x, y) {
        return add(x * y, 0);
      }
    `;

    // Configure realistic mock response
    mockParser.configureRealisticResponse(originalCode);

    // Test code to flow conversion
    const flow = synchronizer.syncCodeToFlow(originalCode, 'test.js');
    expect(flow.nodes).toHaveLength(2);
    expect(flow.edges).toHaveLength(1);

    // Test flow to code conversion
    const generatedCode = synchronizer.syncFlowToCode(flow);
    expect(generatedCode).toContain('function add');
    expect(generatedCode).toContain('function multiply');
    expect(generatedCode).toContain('add(');
  });
});
```

## Migration Strategy

### Phase 1: Core Infrastructure (Week 1)
1. Create MockASTParserService with realistic data generation
2. Implement TestDataFactory with scenario-specific methods
3. Set up basic test cleanup and isolation utilities

### Phase 2: React Component Infrastructure (Week 2)
1. Create TestWrapper and context providers
2. Implement proper React Flow mocking
3. Fix NodeSearchControl and other component tests

### Phase 3: Registry and Utility Fixes (Week 3)
1. Implement MockRegistryInitializer for handle registry
2. Fix utility function algorithms (getPotentialParents, etc.)
3. Add comprehensive edge case testing

### Phase 4: Integration and Performance (Week 4)
1. Create integration test suites
2. Optimize test performance and cleanup
3. Add comprehensive error handling and recovery

## Benefits

**Immediate Benefits:**
- Reduce failed tests from 72 to 0
- Provide realistic test data that matches production behavior
- Enable proper component testing with correct context providers
- Fix utility function logic errors

**Long-term Benefits:**
- Maintainable test infrastructure that's easy to extend
- Comprehensive test coverage including edge cases
- Improved developer confidence in test results
- Better documentation of system behavior through tests
- Faster development cycles with reliable test feedback

**Quality Improvements:**
- Test isolation prevents interference between tests
- Realistic mock data improves test accuracy
- Comprehensive error handling ensures graceful test failures
- Performance optimizations reduce test execution time
- Clear patterns make adding new tests straightforward