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
  filePath?: string; // Path to the source file
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
  astVersion?: string;
}

export interface VariableDeclaration {
  name: string;
  type: 'var' | 'let' | 'const';
  sourceLocation: SourceLocation;
  scope: ScopeLevel;
  defaultValue?: any;
  description?: string;
}

export type ScopeLevel = 'global' | 'function' | 'block';

// Flow synchronization types
export interface FlowStructure {
  id: string;
  fileName: string;
  description: string;
  variables: FlowVariable[];
  nodes: any[]; // Using any[] to avoid circular dependency with React Flow types
  edges: any[]; // Using any[] to avoid circular dependency with React Flow types
  metadata: FlowMetadata;
}

export interface FlowVariable {
  id: string;
  name: string;
  type: string;
  defaultValue?: any;
  description: string;
  isConfigurable: boolean;
  scope: 'flow' | 'global' | 'local';
}

export interface FlowMetadata {
  createdAt: string;
  lastModified: string;
  version: string;
  astVersion: string;
}

export interface SyncValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Flow change tracking types
export interface FlowChange {
  type: 'node_added' | 'node_removed' | 'node_modified' | 'edge_added' | 'edge_removed' | 'variable_changed';
  nodeId?: string;
  edgeId?: string;
  variableId?: string;
  oldValue?: any;
  newValue?: any;
  timestamp: string;
}

// Error handling types
export interface ParseError {
  id: string;
  type: 'syntax' | 'semantic' | 'dependency' | 'scope';
  message: string;
  sourceLocation?: SourceLocation;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
  code?: string;
  functionName?: string;
  recoverable: boolean;
}

export interface ParseResult {
  success: boolean;
  structure?: ParsedFileStructure;
  errors: ParseError[];
  warnings: ParseError[];
  partiallyParsed: boolean;
}

export interface ErrorRecoveryStrategy {
  type: 'skip_function' | 'use_fallback' | 'continue_parsing' | 'abort';
  description: string;
  apply: () => void;
}

// Scope violation detection types
export interface ScopeViolation {
  type: 'missing_parent' | 'circular_dependency' | 'invalid_scope';
  nodeId: string;
  functionName?: string;
  parentFunction?: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ScopeCorrection {
  violationId: string;
  type: 'move_to_global' | 'break_cycle' | 'fix_scope';
  description: string;
  action: () => void;
}