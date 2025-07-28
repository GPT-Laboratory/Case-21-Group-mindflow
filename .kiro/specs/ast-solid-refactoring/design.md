# Design Document

## Overview

This design refactors the existing AST parsing system to follow SOLID principles, eliminate code duplication (DRY), and improve maintainability. The current system has several architectural issues that violate software engineering best practices:

**Current Issues:**
- **SRP Violations**: ASTParserService handles both coordination and extraction logic
- **OCP Violations**: Adding new node types requires modifying existing extractors
- **LSP Violations**: No common interfaces for substitutable implementations
- **ISP Violations**: Components depend on large, unfocused interfaces
- **DIP Violations**: High-level modules depend directly on concrete implementations
- **DRY Violations**: Duplicate traversal logic across all extractors
- **Tight Coupling**: Hard-coded dependencies between services (FlowCodeSynchronizer → ASTParserService)
- **No Abstraction**: Direct instantiation of concrete classes
- **Inconsistent Patterns**: Different error handling and validation approaches
- **Poor Testability**: Difficult to mock dependencies for unit testing

**Design Goals:**
- Apply all five SOLID principles systematically
- Eliminate code duplication through shared utilities and base classes
- Create clean, minimal abstractions without over-engineering (KISS)
- Implement only necessary functionality (YAGNI)
- Enable comprehensive unit testing through dependency injection
- Establish consistent patterns across all components
- Provide robust error handling and validation

## Architecture

### Core Abstractions

The refactored system introduces minimal, focused abstractions that follow Interface Segregation Principle:

```typescript
// Focused interfaces following ISP - each interface has a single, cohesive responsibility
interface ASTExtractor<T> {
  extract(ast: Node): T[];
}

interface ASTParser {
  parse(code: string): Node;
}

interface SyntaxValidator {
  validateSyntax(code: string): boolean;
}

interface ASTTraverser {
  traverse(node: Node, visitor: NodeVisitor): void;
}

interface NodeVisitor {
  visit(node: Node): void;
}

// Specialized interfaces for specific extraction needs
interface ParameterExtractor {
  extractParameters(params: any[]): ParameterMetadata[];
}

interface CommentProcessor {
  processComments(node: Node): CommentMetadata[];
}
```

**Design Rationale**: By separating parsing from validation and creating focused interfaces for specific operations, we ensure that classes only depend on the methods they actually use (ISP). This makes the system more modular and easier to test.

### Component Structure

```
AST/
├── core/
│   ├── ASTParserService.ts          # Orchestration only
│   ├── BaseExtractor.ts             # Shared traversal logic
│   └── ASTTraverser.ts              # Common traversal implementation
├── extractors/
│   ├── FunctionExtractor.ts         # Focused on functions only
│   ├── CallExtractor.ts             # Focused on calls only
│   ├── VariableExtractor.ts         # Focused on variables only
│   ├── CommentExtractor.ts          # Focused on comments only
│   └── DependencyExtractor.ts       # Focused on dependencies only
├── parsers/
│   ├── BabelParser.ts               # Babel implementation
│   └── ParserFactory.ts             # Parser creation
├── services/
│   └── FlowCodeSynchronizer.ts      # Synchronization only
├── utils/
│   ├── NodeUtils.ts                 # Shared node operations
│   ├── SourceLocationUtils.ts       # Shared location extraction
│   └── ValidationUtils.ts           # Shared validation logic
└── types/
    └── ASTTypes.ts                  # Type definitions
```

## Components and Interfaces

### 1. Core Components

#### ASTParserService (Orchestrator)
**Responsibility**: Coordinate parsing and extraction operations only

```typescript
export class ASTParserService {
  constructor(
    private parser: ASTParser,
    private extractors: Map<string, ASTExtractor<any>>
  ) {}

  parseFile(code: string): ParsedFileStructure {
    const ast = this.parser.parse(code);
    
    return {
      functions: this.extractors.get('function')?.extract(ast) || [],
      calls: this.extractors.get('call')?.extract(ast) || [],
      variables: this.extractors.get('variable')?.extract(ast) || [],
      comments: this.extractors.get('comment')?.extract(ast) || [],
      dependencies: this.extractors.get('dependency')?.extract(ast) || []
    };
  }
}
```

#### BaseExtractor (Shared Logic)
**Responsibility**: Provide common traversal and utility methods

```typescript
export abstract class BaseExtractor<T> implements ASTExtractor<T> {
  constructor(protected traverser: ASTTraverser) {}

  abstract extract(ast: Node): T[];
  
  protected extractSourceLocation(node: Node): SourceLocation {
    return SourceLocationUtils.extract(node);
  }
  
  protected isTargetNode(node: Node): boolean {
    // Implemented by subclasses
    return false;
  }
}
```

#### ASTTraverser (Shared Traversal)
**Responsibility**: Provide consistent AST traversal logic

```typescript
export class ASTTraverser implements ASTTraverser {
  traverse(node: Node, visitor: NodeVisitor): void {
    visitor.visit(node);
    
    for (const key in node) {
      if (this.shouldSkipProperty(key)) continue;
      
      const child = (node as any)[key];
      if (Array.isArray(child)) {
        child.forEach(item => {
          if (NodeUtils.isValidNode(item)) {
            this.traverse(item, visitor);
          }
        });
      } else if (NodeUtils.isValidNode(child)) {
        this.traverse(child, visitor);
      }
    }
  }
  
  private shouldSkipProperty(key: string): boolean {
    return ['parent', 'leadingComments', 'trailingComments'].includes(key);
  }
}
```

### 2. Refactored Extractors

Each extractor now has a single responsibility and uses shared utilities:

#### FunctionExtractor
```typescript
export class FunctionExtractor extends BaseExtractor<FunctionMetadata> {
  extract(ast: Node): FunctionMetadata[] {
    const functions: FunctionMetadata[] = [];
    
    this.traverser.traverse(ast, {
      visit: (node: Node) => {
        if (this.isFunctionNode(node)) {
          functions.push(this.extractFunction(node));
        }
      }
    });
    
    return functions;
  }
  
  private isFunctionNode(node: Node): boolean {
    return NodeUtils.isFunctionNode(node);
  }
  
  private extractFunction(node: any): FunctionMetadata {
    return {
      id: this.generateId(node),
      name: NodeUtils.getFunctionName(node),
      parameters: this.extractParameters(node.params),
      returnType: this.inferReturnType(node),
      sourceLocation: this.extractSourceLocation(node),
      description: this.extractDescription(node),
      isNested: this.isNestedFunction(node),
      parentFunction: this.getParentFunction(node),
      scope: this.determineScope(node),
      code: this.extractFunctionCode(node)
    };
  }
}
```

### 3. Shared Utilities

#### NodeUtils (DRY Compliance)
```typescript
export class NodeUtils {
  static isValidNode(obj: any): obj is Node {
    return obj && typeof obj === 'object' && typeof obj.type === 'string';
  }
  
  static isFunctionNode(node: Node): boolean {
    return [
      'FunctionDeclaration',
      'FunctionExpression', 
      'ArrowFunctionExpression',
      'MethodDefinition'
    ].includes(node.type);
  }
  
  static getFunctionName(node: any): string {
    if (node.type === 'FunctionDeclaration' && node.id?.name) {
      return node.id.name;
    }
    if (node.type === 'MethodDefinition' && node.key?.name) {
      return node.key.name;
    }
    return 'anonymous';
  }
}
```

#### SourceLocationUtils (DRY Compliance)
```typescript
export class SourceLocationUtils {
  static extract(node: any): SourceLocation {
    return {
      start: {
        line: node.loc?.start?.line || 0,
        column: node.loc?.start?.column || 0
      },
      end: {
        line: node.loc?.end?.line || 0,
        column: node.loc?.end?.column || 0
      }
    };
  }
}
```

#### ParameterUtils (DRY Compliance)
```typescript
export class ParameterUtils {
  static extractParameters(params: any[]): ParameterMetadata[] {
    return params.map(param => ({
      name: this.getParameterName(param),
      type: this.inferParameterType(param),
      defaultValue: this.getDefaultValue(param),
      isOptional: this.isOptionalParameter(param),
      sourceLocation: SourceLocationUtils.extract(param)
    }));
  }
  
  private static getParameterName(param: any): string {
    if (param.type === 'Identifier') return param.name;
    if (param.type === 'AssignmentPattern') return this.getParameterName(param.left);
    if (param.type === 'RestElement') return `...${this.getParameterName(param.argument)}`;
    return 'unknown';
  }
  
  private static getDefaultValue(param: any): string | undefined {
    if (param.type === 'AssignmentPattern' && param.right) {
      return param.right.raw || param.right.value?.toString();
    }
    return undefined;
  }
}
```

#### CommentUtils (DRY Compliance)
```typescript
export class CommentUtils {
  static processComments(node: Node): CommentMetadata[] {
    const comments: CommentMetadata[] = [];
    
    if (node.leadingComments) {
      comments.push(...node.leadingComments.map(comment => this.processComment(comment, 'leading')));
    }
    
    if (node.trailingComments) {
      comments.push(...node.trailingComments.map(comment => this.processComment(comment, 'trailing')));
    }
    
    return comments;
  }
  
  private static processComment(comment: any, position: 'leading' | 'trailing'): CommentMetadata {
    return {
      text: comment.value.trim(),
      type: comment.type === 'Block' ? 'block' : 'line',
      position,
      sourceLocation: SourceLocationUtils.extract(comment)
    };
  }
}

#### ValidationUtils (Consistent Validation)
```typescript
export class ValidationUtils {
  static validateNode(node: any, expectedType?: string): void {
    if (!NodeUtils.isValidNode(node)) {
      throw new ASTError('Invalid AST node', 'ValidationUtils');
    }
    
    if (expectedType && node.type !== expectedType) {
      throw new ASTError(
        `Expected node type ${expectedType}, got ${node.type}`,
        'ValidationUtils',
        SourceLocationUtils.extract(node)
      );
    }
  }
  
  static validateParameters(params: any[]): void {
    if (!Array.isArray(params)) {
      throw new ASTError('Parameters must be an array', 'ValidationUtils');
    }
    
    params.forEach((param, index) => {
      if (!NodeUtils.isValidNode(param)) {
        throw new ASTError(`Invalid parameter at index ${index}`, 'ValidationUtils');
      }
    });
  }
  
  static validateSourceCode(code: string): void {
    if (typeof code !== 'string') {
      throw new ASTError('Source code must be a string', 'ValidationUtils');
    }
    
    if (code.trim().length === 0) {
      throw new ASTError('Source code cannot be empty', 'ValidationUtils');
    }
  }
}
```

### 4. Factory Pattern (DIP Compliance)

#### ParserFactory
```typescript
export class ParserFactory {
  static createParser(type: 'babel' = 'babel'): ASTParser {
    switch (type) {
      case 'babel':
        return new BabelParser();
      default:
        throw new Error(`Unknown parser type: ${type}`);
    }
  }
}
```

#### ExtractorFactory
```typescript
export class ExtractorFactory {
  static createExtractors(traverser: ASTTraverser): Map<string, ASTExtractor<any>> {
    const extractors = new Map();
    
    extractors.set('function', new FunctionExtractor(traverser));
    extractors.set('call', new CallExtractor(traverser));
    extractors.set('variable', new VariableExtractor(traverser));
    extractors.set('comment', new CommentExtractor(traverser));
    extractors.set('dependency', new DependencyExtractor(traverser));
    
    return extractors;
  }
}
```

## Data Models

The existing type definitions remain largely unchanged, with minor additions for the new abstractions:

```typescript
// New interfaces for SOLID compliance
export interface NodeVisitor {
  visit(node: Node): void;
}

export interface ASTExtractor<T> {
  extract(ast: Node): T[];
}

export interface ASTParser {
  parse(code: string): Node;
}

export interface SyntaxValidator {
  validateSyntax(code: string): boolean;
}

export interface ASTTraverser {
  traverse(node: Node, visitor: NodeVisitor): void;
}

// Specialized interfaces following ISP
export interface ParameterExtractor {
  extractParameters(params: any[]): ParameterMetadata[];
}

export interface CommentProcessor {
  processComments(node: Node): CommentMetadata[];
}

// Enhanced metadata types
export interface ParameterMetadata {
  name: string;
  type: string;
  defaultValue?: string;
  isOptional: boolean;
  sourceLocation: SourceLocation;
}

export interface CommentMetadata {
  text: string;
  type: 'block' | 'line';
  position: 'leading' | 'trailing';
  sourceLocation: SourceLocation;
}
```

**Design Rationale**: The interfaces are kept minimal and focused (ISP compliance). Parser and validation are separated to allow different implementations without forcing unnecessary dependencies.

## Error Handling

Consistent error handling across all components:

```typescript
export class ASTError extends Error {
  constructor(
    message: string,
    public readonly component: string,
    public readonly sourceLocation?: SourceLocation
  ) {
    super(message);
    this.name = 'ASTError';
  }
}

export class ValidationUtils {
  static validateNode(node: any, expectedType?: string): void {
    if (!NodeUtils.isValidNode(node)) {
      throw new ASTError('Invalid AST node', 'ValidationUtils');
    }
    
    if (expectedType && node.type !== expectedType) {
      throw new ASTError(
        `Expected node type ${expectedType}, got ${node.type}`,
        'ValidationUtils',
        SourceLocationUtils.extract(node)
      );
    }
  }
}
```

## Testing Strategy

The new architecture enables comprehensive testing through dependency injection and clear separation of concerns:

### Unit Testing Approach

**Extractor Testing**: Each extractor can be tested in isolation without requiring real AST parsing infrastructure:

```typescript
describe('FunctionExtractor', () => {
  let extractor: FunctionExtractor;
  let mockTraverser: jest.Mocked<ASTTraverser>;
  
  beforeEach(() => {
    mockTraverser = {
      traverse: jest.fn()
    };
    extractor = new FunctionExtractor(mockTraverser);
  });
  
  it('should extract functions correctly', () => {
    const mockAST = { type: 'Program', body: [] };
    mockTraverser.traverse.mockImplementation((node, visitor) => {
      visitor.visit({ type: 'FunctionDeclaration', id: { name: 'testFunc' } });
    });
    
    const result = extractor.extract(mockAST);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('testFunc');
  });
});
```

**Parser Service Testing**: The orchestrator can be tested with mocked extractors:

```typescript
describe('ASTParserService', () => {
  let service: ASTParserService;
  let mockParser: jest.Mocked<ASTParser>;
  let mockExtractors: Map<string, jest.Mocked<ASTExtractor<any>>>;
  
  beforeEach(() => {
    mockParser = { parse: jest.fn() };
    mockExtractors = new Map([
      ['function', { extract: jest.fn().mockReturnValue([]) }],
      ['call', { extract: jest.fn().mockReturnValue([]) }]
    ]);
    service = new ASTParserService(mockParser, mockExtractors);
  });
  
  it('should coordinate parsing and extraction', () => {
    const code = 'function test() {}';
    const mockAST = { type: 'Program' };
    mockParser.parse.mockReturnValue(mockAST);
    
    service.parseFile(code);
    
    expect(mockParser.parse).toHaveBeenCalledWith(code);
    expect(mockExtractors.get('function')?.extract).toHaveBeenCalledWith(mockAST);
  });
});
```

**Synchronization Testing**: FlowCodeSynchronizer can be tested without file system operations:

```typescript
describe('FlowCodeSynchronizer', () => {
  let synchronizer: FlowCodeSynchronizer;
  let mockParserService: jest.Mocked<ASTParserService>;
  
  beforeEach(() => {
    mockParserService = { parseFile: jest.fn() };
    synchronizer = new FlowCodeSynchronizer(mockParserService);
  });
  
  it('should synchronize without parsing implementation details', () => {
    const mockParsedStructure = { functions: [], calls: [] };
    mockParserService.parseFile.mockReturnValue(mockParsedStructure);
    
    const result = synchronizer.synchronize('test code');
    expect(result).toBeDefined();
  });
});
```

### Integration Testing

**End-to-End Functionality**: Integration tests verify the complete system works with real JavaScript code:

```typescript
describe('AST System Integration', () => {
  let parserService: ASTParserService;
  
  beforeEach(() => {
    const parser = ParserFactory.createParser('babel');
    const traverser = new ASTTraverser();
    const extractors = ExtractorFactory.createExtractors(traverser);
    parserService = new ASTParserService(parser, extractors);
  });
  
  it('should parse and extract from real JavaScript code', () => {
    const code = `
      function calculateSum(a, b) {
        return a + b;
      }
      calculateSum(1, 2);
    `;
    
    const result = parserService.parseFile(code);
    expect(result.functions).toHaveLength(1);
    expect(result.functions[0].name).toBe('calculateSum');
    expect(result.calls).toHaveLength(1);
  });
});
```

### Error Handling Testing

**Graceful Error Recovery**: Tests ensure the system handles invalid input gracefully:

```typescript
describe('Error Handling', () => {
  it('should handle parsing failures gracefully', () => {
    const invalidCode = 'function {';
    expect(() => parserService.parseFile(invalidCode))
      .toThrow(ASTError);
  });
  
  it('should provide detailed error context', () => {
    try {
      ValidationUtils.validateNode(null, 'FunctionDeclaration');
    } catch (error) {
      expect(error).toBeInstanceOf(ASTError);
      expect(error.component).toBe('ValidationUtils');
    }
  });
});
```

## Migration Strategy

The refactoring will be done incrementally:

1. **Phase 1**: Create shared utilities and base classes
2. **Phase 2**: Refactor extractors to use shared utilities
3. **Phase 3**: Introduce dependency injection to ASTParserService
4. **Phase 4**: Update FlowCodeSynchronizer to use new interfaces
5. **Phase 5**: Add comprehensive error handling and validation

## Benefits

**SOLID Compliance:**
- **SRP**: Each class has one clear responsibility
- **OCP**: New extractors can be added without modifying existing code
- **LSP**: All extractors are interchangeable through common interfaces
- **ISP**: Interfaces are focused and minimal
- **DIP**: High-level modules depend on abstractions

**DRY Compliance:**
- Shared traversal logic eliminates duplication
- Common utilities for source location, validation, etc.
- Consistent patterns across all extractors

**Maintainability:**
- Clear separation of concerns
- Easy to test with dependency injection
- Consistent error handling and validation
- Simple, focused abstractions (KISS)
- Only necessary abstractions added (YAGNI)