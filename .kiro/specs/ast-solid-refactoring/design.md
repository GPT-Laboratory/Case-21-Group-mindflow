# Design Document

## Overview

This design refactors the existing AST parsing system to follow SOLID principles, eliminate code duplication, and improve maintainability. The current system has several architectural issues:

**Current Issues:**
- **SRP Violations**: ASTParserService handles both coordination and extraction logic
- **DRY Violations**: Duplicate traversal logic across all extractors
- **Tight Coupling**: Hard-coded dependencies between services
- **No Abstraction**: Direct instantiation of concrete classes
- **Inconsistent Patterns**: Different error handling and validation approaches

**Design Goals:**
- Apply SOLID principles systematically
- Eliminate code duplication through shared utilities
- Create clean abstractions without over-engineering
- Maintain simplicity (KISS) while improving structure
- Only add abstractions that are immediately needed (YAGNI)

## Architecture

### Core Abstractions

The refactored system introduces minimal, focused abstractions:

```typescript
// Base interfaces for SOLID compliance
interface ASTExtractor<T> {
  extract(ast: Node): T[];
}

interface ASTParser {
  parse(code: string): Node;
  validateSyntax(code: string): boolean;
}

interface ASTTraverser {
  traverse(node: Node, visitor: NodeVisitor): void;
}
```

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
  validateSyntax(code: string): boolean;
}

export interface ASTTraverser {
  traverse(node: Node, visitor: NodeVisitor): void;
}
```

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

The new architecture enables better testing through dependency injection:

```typescript
// Example test setup
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
    // Test with mocked dependencies
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