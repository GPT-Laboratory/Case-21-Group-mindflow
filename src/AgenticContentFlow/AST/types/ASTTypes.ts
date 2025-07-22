export interface FunctionMetadata {
  id: string;
  name: string;
  description: string;
  parameters: Parameter[];
  returnType?: string;
  sourceLocation: SourceLocation;
  isNested: boolean;
  parentFunction?: string;
  scope: ScopeLevel;
  code: string;
}

export interface Parameter {
  name: string;
  type?: string;
  defaultValue?: string;
}

export interface SourceLocation {
  start: { line: number; column: number };
  end: { line: number; column: number };
}

export interface FunctionCall {
  id: string;
  callerFunction: string;
  calledFunction: string;
  sourceLocation: SourceLocation;
  isExternal: boolean;
}

export interface ExternalDependency {
  name: string;
  type: 'import' | 'require' | 'global';
  source?: string;
}

export interface CommentMetadata {
  type: 'block' | 'line';
  value: string;
  sourceLocation: SourceLocation;
  associatedFunction?: string;
}

export interface ParsedFileStructure {
  functions: FunctionMetadata[];
  calls: FunctionCall[];
  dependencies: ExternalDependency[];
  variables: VariableDeclaration[];
  comments: CommentMetadata[];
}

export interface VariableDeclaration {
  name: string;
  type: 'var' | 'let' | 'const';
  sourceLocation: SourceLocation;
  scope: ScopeLevel;
}

export type ScopeLevel = 'global' | 'function' | 'block';