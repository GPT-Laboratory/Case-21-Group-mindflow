/**
 * Types for the Direct Execution Engine
 */

export interface ExecutionContext {
  currentNode: string;
  callStack: string[];
  visualizationMode: boolean;
  pauseDuration: number;
  errorHandling: ErrorHandlingMode;
  nodePermissions: Map<string, NodePermissions>;
  executionModes: Map<string, ExecutionMode>;
}

export interface FunctionCall {
  id: string;
  sourceFunction: string;
  targetFunction: string;
  arguments: any[];
  timestamp: number;
  callType: 'direct' | 'external' | 'nested';
}

export interface ExecutionOptions {
  visualizationEnabled: boolean;
  pauseDuration: number;
  errorHandling: ErrorHandlingMode;
  permissions: NodePermissions[];
}

export interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: Error;
  callStack: string[];
  executionTime: number;
}

export interface NodePermissions {
  nodeId: string;
  canExecute: boolean;
  requiredRoles: string[];
  userId?: string;
}

export interface ExecutionCheckResult {
  canExecute: boolean;
  reason?: string;
  suggestedAction?: string;
}

export interface ExecutionDecision {
  shouldExecute: boolean;
  shouldVisualize: boolean;
  reason?: string;
}

export type ExecutionMode = 'normal' | 'visualization' | 'blocked';
export type ErrorHandlingMode = 'strict' | 'graceful' | 'silent';

export interface InterceptedFunction {
  originalFunction: Function;
  functionName: string;
  nodeId: string;
  interceptor: FunctionInterceptor;
}

export interface FunctionInterceptor {
  beforeCall: (args: any[], context: ExecutionContext) => Promise<ExecutionDecision>;
  afterCall: (result: any, context: ExecutionContext) => Promise<any>;
  onError: (error: Error, context: ExecutionContext) => Promise<Error>;
}

export interface CallStackFrame {
  functionName: string;
  nodeId: string;
  timestamp: number;
  arguments: any[];
  sourceLocation?: string;
}