/**
 * Execution Resumption Service
 * 
 * This service resumes function execution after visual transitions complete,
 * maintains proper call stack and execution context, and handles error 
 * propagation after visualization sequences.
 */

import { ExecutionContext, FunctionCall, CallStackFrame } from '../types/ExecutionTypes';
import { ProcessVisualizationService } from './ProcessVisualizationService';
import { FunctionInterceptionService } from './FunctionInterceptionService';

export interface ExecutionResumption {
  id: string;
  functionCall: FunctionCall;
  originalFunction: Function;
  args: any[];
  context: ExecutionContext;
  callStackFrame: CallStackFrame;
  status: 'pending' | 'visualizing' | 'resuming' | 'completed' | 'error';
  startTime: number;
  visualizationStartTime?: number;
  resumptionTime?: number;
  completionTime?: number;
  result?: any;
  error?: Error;
  onComplete?: (result: any) => void;
  onError?: (error: Error) => void;
}

export interface ResumptionQueue {
  pending: ExecutionResumption[];
  visualizing: ExecutionResumption[];
  resuming: ExecutionResumption[];
}

export interface ResumptionConfig {
  /** Maximum time to wait for visualization completion before timeout */
  visualizationTimeout: number;
  /** Enable debug logging */
  debug: boolean;
  /** Maximum concurrent resumptions */
  maxConcurrentResumptions: number;
}

export class ExecutionResumptionService {
  private config: ResumptionConfig;
  private resumptions: Map<string, ExecutionResumption> = new Map();
  private queue: ResumptionQueue = {
    pending: [],
    visualizing: [],
    resuming: []
  };
  
  private visualizationService: ProcessVisualizationService;
  private interceptionService: FunctionInterceptionService;
  
  // Timeout tracking
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    visualizationService: ProcessVisualizationService,
    interceptionService: FunctionInterceptionService,
    config: Partial<ResumptionConfig> = {}
  ) {
    this.visualizationService = visualizationService;
    this.interceptionService = interceptionService;
    
    this.config = {
      visualizationTimeout: 10000, // 10 seconds
      debug: false,
      maxConcurrentResumptions: 5,
      ...config
    };

    // Listen to visualization events
    this.setupVisualizationListeners();
  }

  /**
   * Resume function execution after visual transitions complete
   */
  public async resumeAfterVisualization(
    functionCall: FunctionCall,
    originalFunction: Function,
    args: any[],
    context: ExecutionContext
  ): Promise<any> {
    const resumption: ExecutionResumption = {
      id: this.generateResumptionId(),
      functionCall,
      originalFunction,
      args,
      context: { ...context },
      callStackFrame: {
        functionName: functionCall.targetFunction,
        nodeId: this.getNodeIdFromFunction(functionCall.targetFunction),
        timestamp: Date.now(),
        arguments: args
      },
      status: 'pending',
      startTime: Date.now()
    };

    this.resumptions.set(resumption.id, resumption);
    this.queue.pending.push(resumption);

    if (this.config.debug) {
      console.log(`[ExecutionResumption] Created resumption for ${functionCall.sourceFunction} → ${functionCall.targetFunction}`);
    }

    try {
      // Check if visualization should occur
      const sourceNodeId = this.getNodeIdFromFunction(functionCall.sourceFunction);
      const targetNodeId = this.getNodeIdFromFunction(functionCall.targetFunction);
      
      if (this.visualizationService.shouldVisualize(sourceNodeId, targetNodeId, context)) {
        return await this.executeWithVisualization(resumption, sourceNodeId, targetNodeId);
      } else {
        return await this.executeDirectly(resumption);
      }
    } catch (error) {
      resumption.status = 'error';
      resumption.error = error as Error;
      resumption.completionTime = Date.now();
      
      if (resumption.onError) {
        resumption.onError(error as Error);
      }
      
      this.cleanupResumption(resumption.id);
      throw error;
    }
  }

  /**
   * Execute with visualization and then resume
   */
  private async executeWithVisualization(
    resumption: ExecutionResumption,
    sourceNodeId: string,
    targetNodeId: string
  ): Promise<any> {
    resumption.status = 'visualizing';
    resumption.visualizationStartTime = Date.now();
    
    this.moveToQueue(resumption, 'pending', 'visualizing');

    if (this.config.debug) {
      console.log(`[ExecutionResumption] Starting visualization for ${resumption.functionCall.sourceFunction} → ${resumption.functionCall.targetFunction}`);
    }

    // Set timeout for visualization
    const timeoutId = setTimeout(() => {
      this.handleVisualizationTimeout(resumption.id);
    }, this.config.visualizationTimeout);
    
    this.timeouts.set(resumption.id, timeoutId);

    try {
      // Create visual transition
      const edgeId = this.generateEdgeId(sourceNodeId, targetNodeId);
      await this.visualizationService.createVisualTransition(
        resumption.functionCall,
        sourceNodeId,
        targetNodeId,
        edgeId,
        resumption.context
      );

      // Clear timeout since visualization completed
      this.clearTimeout(resumption.id);

      // Now resume execution
      return await this.resumeExecution(resumption);

    } catch (error) {
      this.clearTimeout(resumption.id);
      throw error;
    }
  }

  /**
   * Execute directly without visualization
   */
  private async executeDirectly(resumption: ExecutionResumption): Promise<any> {
    if (this.config.debug) {
      console.log(`[ExecutionResumption] Executing directly without visualization: ${resumption.functionCall.targetFunction}`);
    }

    resumption.status = 'resuming';
    resumption.resumptionTime = Date.now();
    
    this.moveToQueue(resumption, 'pending', 'resuming');

    try {
      const result = await resumption.originalFunction.apply(null, resumption.args);
      
      resumption.status = 'completed';
      resumption.result = result;
      resumption.completionTime = Date.now();
      
      if (resumption.onComplete) {
        resumption.onComplete(result);
      }
      
      this.cleanupResumption(resumption.id);
      return result;

    } catch (error) {
      resumption.status = 'error';
      resumption.error = error as Error;
      resumption.completionTime = Date.now();
      
      this.cleanupResumption(resumption.id);
      throw error;
    }
  }

  /**
   * Resume execution after visualization completes
   */
  private async resumeExecution(resumption: ExecutionResumption): Promise<any> {
    resumption.status = 'resuming';
    resumption.resumptionTime = Date.now();
    
    this.moveToQueue(resumption, 'visualizing', 'resuming');

    if (this.config.debug) {
      console.log(`[ExecutionResumption] Resuming execution for ${resumption.functionCall.targetFunction}`);
    }

    try {
      // Restore execution context
      this.interceptionService.updateExecutionContext(resumption.context);

      // Execute the original function
      const result = await resumption.originalFunction.apply(null, resumption.args);
      
      resumption.status = 'completed';
      resumption.result = result;
      resumption.completionTime = Date.now();
      
      if (resumption.onComplete) {
        resumption.onComplete(result);
      }
      
      if (this.config.debug) {
        console.log(`[ExecutionResumption] Execution completed for ${resumption.functionCall.targetFunction}`);
      }
      
      this.cleanupResumption(resumption.id);
      return result;

    } catch (error) {
      resumption.status = 'error';
      resumption.error = error as Error;
      resumption.completionTime = Date.now();
      
      if (this.config.debug) {
        console.error(`[ExecutionResumption] Execution error for ${resumption.functionCall.targetFunction}:`, error);
      }
      
      this.cleanupResumption(resumption.id);
      
      // Handle error propagation after visualization sequences
      throw this.propagateError(error as Error, resumption.context);
    }
  }

  /**
   * Handle error propagation after visualization sequences
   */
  private propagateError(error: Error, context: ExecutionContext): Error {
    // Preserve original stack trace and context information
    const enhancedError = new Error(error.message);
    enhancedError.stack = error.stack;
    enhancedError.name = error.name;
    
    // Add execution context information
    (enhancedError as any).executionContext = {
      currentNode: context.currentNode,
      callStack: [...context.callStack],
      visualizationMode: context.visualizationMode
    };

    if (this.config.debug) {
      console.error(`[ExecutionResumption] Error propagated with context:`, {
        error: error.message,
        context: context.currentNode,
        callStack: context.callStack
      });
    }

    return enhancedError;
  }

  /**
   * Get current resumption statistics
   */
  public getResumptionStats(): {
    total: number;
    pending: number;
    visualizing: number;
    resuming: number;
    completed: number;
    errors: number;
    averageVisualizationTime: number;
    averageExecutionTime: number;
  } {
    const all = Array.from(this.resumptions.values());
    const completed = all.filter(r => r.status === 'completed');
    const errors = all.filter(r => r.status === 'error');
    
    const avgVisualizationTime = completed.reduce((sum, r) => {
      if (r.visualizationStartTime && r.resumptionTime) {
        return sum + (r.resumptionTime - r.visualizationStartTime);
      }
      return sum;
    }, 0) / Math.max(completed.length, 1);

    const avgExecutionTime = completed.reduce((sum, r) => {
      if (r.resumptionTime && r.completionTime) {
        return sum + (r.completionTime - r.resumptionTime);
      }
      return sum;
    }, 0) / Math.max(completed.length, 1);

    return {
      total: all.length,
      pending: this.queue.pending.length,
      visualizing: this.queue.visualizing.length,
      resuming: this.queue.resuming.length,
      completed: completed.length,
      errors: errors.length,
      averageVisualizationTime: avgVisualizationTime,
      averageExecutionTime: avgExecutionTime
    };
  }

  /**
   * Get current queue state
   */
  public getQueueState(): ResumptionQueue {
    return {
      pending: [...this.queue.pending],
      visualizing: [...this.queue.visualizing],
      resuming: [...this.queue.resuming]
    };
  }

  /**
   * Clear all resumptions
   */
  public clearAllResumptions(): void {
    // Clear all timeouts
    for (const timeoutId of this.timeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.timeouts.clear();

    // Clear all resumptions
    this.resumptions.clear();
    this.queue = {
      pending: [],
      visualizing: [],
      resuming: []
    };

    if (this.config.debug) {
      console.log(`[ExecutionResumption] All resumptions cleared`);
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<ResumptionConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.debug) {
      console.log(`[ExecutionResumption] Configuration updated:`, this.config);
    }
  }

  /**
   * Setup listeners for visualization events
   */
  private setupVisualizationListeners(): void {
    this.visualizationService.addEventListener('visualizationComplete', (event) => {
      // Find resumptions waiting for this visualization
      const waitingResumptions = this.queue.visualizing.filter(r => 
        this.getNodeIdFromFunction(r.functionCall.sourceFunction) === event.sourceNodeId &&
        this.getNodeIdFromFunction(r.functionCall.targetFunction) === event.targetNodeId
      );

      // These will be handled by the visualization promise resolution
      if (this.config.debug && waitingResumptions.length > 0) {
        console.log(`[ExecutionResumption] Visualization completed for ${waitingResumptions.length} resumptions`);
      }
    });

    this.visualizationService.addEventListener('visualizationError', (event) => {
      // Handle visualization errors
      const waitingResumptions = this.queue.visualizing.filter(r => 
        this.getNodeIdFromFunction(r.functionCall.sourceFunction) === event.sourceNodeId &&
        this.getNodeIdFromFunction(r.functionCall.targetFunction) === event.targetNodeId
      );

      for (const resumption of waitingResumptions) {
        resumption.status = 'error';
        resumption.error = event.error;
        resumption.completionTime = Date.now();
        
        if (resumption.onError) {
          resumption.onError(event.error);
        }
        
        this.cleanupResumption(resumption.id);
      }
    });
  }

  /**
   * Handle visualization timeout
   */
  private handleVisualizationTimeout(resumptionId: string): void {
    const resumption = this.resumptions.get(resumptionId);
    if (!resumption) return;

    const timeoutError = new Error(`Visualization timeout after ${this.config.visualizationTimeout}ms`);
    
    resumption.status = 'error';
    resumption.error = timeoutError;
    resumption.completionTime = Date.now();
    
    if (resumption.onError) {
      resumption.onError(timeoutError);
    }
    
    if (this.config.debug) {
      console.error(`[ExecutionResumption] Visualization timeout for ${resumption.functionCall.targetFunction}`);
    }
    
    this.cleanupResumption(resumptionId);
  }

  /**
   * Move resumption between queues
   */
  private moveToQueue(
    resumption: ExecutionResumption,
    from: keyof ResumptionQueue,
    to: keyof ResumptionQueue
  ): void {
    const fromQueue = this.queue[from];
    const toQueue = this.queue[to];
    
    const index = fromQueue.indexOf(resumption);
    if (index > -1) {
      fromQueue.splice(index, 1);
    }
    
    toQueue.push(resumption);
  }

  /**
   * Clear timeout for a resumption
   */
  private clearTimeout(resumptionId: string): void {
    const timeoutId = this.timeouts.get(resumptionId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(resumptionId);
    }
  }

  /**
   * Cleanup resumption resources
   */
  private cleanupResumption(resumptionId: string): void {
    this.clearTimeout(resumptionId);
    
    const resumption = this.resumptions.get(resumptionId);
    if (resumption) {
      // Remove from all queues
      this.queue.pending = this.queue.pending.filter(r => r.id !== resumptionId);
      this.queue.visualizing = this.queue.visualizing.filter(r => r.id !== resumptionId);
      this.queue.resuming = this.queue.resuming.filter(r => r.id !== resumptionId);
    }
    
    // Keep completed/error resumptions for stats, but remove after delay
    setTimeout(() => {
      this.resumptions.delete(resumptionId);
    }, 5000);
  }

  /**
   * Generate unique resumption ID
   */
  private generateResumptionId(): string {
    return `resumption_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate edge ID from source and target functions
   */
  private generateEdgeId(sourceNodeId: string, targetNodeId: string): string {
    return `edge_${sourceNodeId}_${targetNodeId}`;
  }

  /**
   * Get node ID from function name (simplified mapping)
   */
  private getNodeIdFromFunction(functionName: string): string {
    return functionName;
  }
}