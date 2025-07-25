/**
 * Function Call Interception Service
 * 
 * This service provides function call interception capabilities for visualization
 * and execution control. It maintains execution context and call stack management.
 */

import {
  ExecutionContext,
  FunctionCall,
  ExecutionDecision,
  InterceptedFunction,
  FunctionInterceptor,
  CallStackFrame,
  ErrorHandlingMode,
  NodePermissions,
  ExecutionMode
} from '../types/ExecutionTypes';

export class FunctionInterceptionService {
  private interceptedFunctions: Map<string, InterceptedFunction> = new Map();
  private executionContext: ExecutionContext;
  private callStack: CallStackFrame[] = [];
  private isInterceptionEnabled: boolean = true;

  constructor(
    initialContext?: Partial<ExecutionContext>
  ) {
    this.executionContext = {
      currentNode: '',
      callStack: [],
      visualizationMode: false,
      pauseDuration: 1000,
      errorHandling: 'graceful' as ErrorHandlingMode,
      nodePermissions: new Map<string, NodePermissions>(),
      executionModes: new Map<string, ExecutionMode>(),
      ...initialContext
    };
  }

  /**
   * Register a function for interception
   */
  public registerFunction(
    functionName: string,
    nodeId: string,
    originalFunction: Function,
    interceptor: FunctionInterceptor
  ): void {
    const interceptedFunction: InterceptedFunction = {
      originalFunction,
      functionName,
      nodeId,
      interceptor
    };

    this.interceptedFunctions.set(functionName, interceptedFunction);
  }

  /**
   * Unregister a function from interception
   */
  public unregisterFunction(functionName: string): void {
    this.interceptedFunctions.delete(functionName);
  }

  /**
   * Create an intercepted version of a function
   */
  public createInterceptedFunction(
    functionName: string,
    nodeId: string,
    originalFunction: Function,
    interceptor: FunctionInterceptor
  ): Function {
    this.registerFunction(functionName, nodeId, originalFunction, interceptor);

    return async (...args: any[]) => {
      if (!this.isInterceptionEnabled) {
        return originalFunction.apply(this, args);
      }

      return this.executeWithInterception(functionName, args);
    };
  }

  /**
   * Execute a function with full interception lifecycle
   */
  private async executeWithInterception(
    functionName: string,
    args: any[]
  ): Promise<any> {
    const interceptedFunction = this.interceptedFunctions.get(functionName);
    if (!interceptedFunction) {
      throw new Error(`Function ${functionName} is not registered for interception`);
    }

    const { originalFunction, nodeId, interceptor } = interceptedFunction;

    // Create call stack frame
    const callFrame: CallStackFrame = {
      functionName,
      nodeId,
      timestamp: Date.now(),
      arguments: args
    };

    // Update execution context
    const previousNode = this.executionContext.currentNode;
    this.executionContext.currentNode = nodeId;
    this.executionContext.callStack.push(functionName);
    this.callStack.push(callFrame);

    try {
      // Before call interception - pass current context with updated call stack
      const contextForBeforeCall = { 
        ...this.executionContext,
        callStack: [...this.executionContext.callStack] // Ensure we have the updated call stack
      };
      const decision = await interceptor.beforeCall(args, contextForBeforeCall);
      
      if (!decision.shouldExecute) {
        this.restoreExecutionContext(previousNode);
        return { 
          intercepted: true, 
          reason: decision.reason,
          executed: false 
        };
      }

      // Execute the original function
      let result: any;
      try {
        result = await originalFunction.apply(this, args);
      } catch (error) {
        // Handle execution error through interceptor - pass current context
        const contextForError = { ...this.executionContext };
        const handledError = await interceptor.onError(error as Error, contextForError);
        this.restoreExecutionContext(previousNode);
        throw handledError;
      }

      // After call interception - pass current context
      const contextForAfterCall = { ...this.executionContext };
      const processedResult = await interceptor.afterCall(result, contextForAfterCall);
      
      this.restoreExecutionContext(previousNode);
      return processedResult;

    } catch (error) {
      this.restoreExecutionContext(previousNode);
      throw error;
    }
  }

  /**
   * Restore execution context after function call
   */
  private restoreExecutionContext(previousNode: string): void {
    this.executionContext.currentNode = previousNode;
    this.executionContext.callStack.pop();
    this.callStack.pop();
  }

  /**
   * Get current execution context
   */
  public getExecutionContext(): ExecutionContext {
    return { ...this.executionContext };
  }

  /**
   * Get current call stack
   */
  public getCallStack(): CallStackFrame[] {
    return [...this.callStack];
  }

  /**
   * Update execution context
   */
  public updateExecutionContext(updates: Partial<ExecutionContext>): void {
    this.executionContext = { ...this.executionContext, ...updates };
  }

  /**
   * Enable or disable interception
   */
  public setInterceptionEnabled(enabled: boolean): void {
    this.isInterceptionEnabled = enabled;
  }

  /**
   * Check if interception is enabled
   */
  public isInterceptionActive(): boolean {
    return this.isInterceptionEnabled;
  }

  /**
   * Clear all intercepted functions
   */
  public clearAllInterceptions(): void {
    this.interceptedFunctions.clear();
    this.callStack = [];
    this.executionContext.callStack = [];
    this.executionContext.currentNode = '';
  }

  /**
   * Get all registered function names
   */
  public getRegisteredFunctions(): string[] {
    return Array.from(this.interceptedFunctions.keys());
  }

  /**
   * Check if a function is registered for interception
   */
  public isFunctionRegistered(functionName: string): boolean {
    return this.interceptedFunctions.has(functionName);
  }

  /**
   * Create a function call record
   */
  public createFunctionCall(
    sourceFunction: string,
    targetFunction: string,
    args: any[],
    callType: 'direct' | 'external' | 'nested' = 'direct'
  ): FunctionCall {
    return {
      id: `${sourceFunction}-${targetFunction}-${Date.now()}`,
      sourceFunction,
      targetFunction,
      arguments: args,
      timestamp: Date.now(),
      callType
    };
  }

  /**
   * Get execution statistics
   */
  public getExecutionStats(): {
    registeredFunctions: number;
    currentCallStackDepth: number;
    interceptionEnabled: boolean;
    currentNode: string;
  } {
    return {
      registeredFunctions: this.interceptedFunctions.size,
      currentCallStackDepth: this.callStack.length,
      interceptionEnabled: this.isInterceptionEnabled,
      currentNode: this.executionContext.currentNode
    };
  }
}