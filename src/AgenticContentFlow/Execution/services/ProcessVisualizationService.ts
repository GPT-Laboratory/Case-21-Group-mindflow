/**
 * Process Visualization Service
 * 
 * This service creates visual transition systems that pause execution,
 * implements edge animation and node highlighting during calls,
 * and adds execution sequencing for nested function calls.
 */

import { ExecutionContext, FunctionCall } from '../types/ExecutionTypes';
import { NodeExecutionController } from './NodeExecutionController';

export interface VisualizationConfig {
  /** Duration for edge animations in milliseconds */
  edgeAnimationDuration: number;
  /** Duration for node highlighting in milliseconds */
  nodeHighlightDuration: number;
  /** Delay between sequential animations in milliseconds */
  sequenceDelay: number;
  /** Enable debug logging */
  debug: boolean;
}

export interface VisualizationState {
  /** Currently active visualizations */
  activeVisualizations: Map<string, VisualizationExecution>;
  /** Queue of pending visualizations */
  visualizationQueue: VisualizationExecution[];
  /** Whether visualization is currently paused */
  isPaused: boolean;
  /** Current visualization sequence ID */
  currentSequenceId?: string;
}

export interface VisualizationExecution {
  id: string;
  functionCall: FunctionCall;
  sourceNodeId: string;
  targetNodeId: string;
  edgeId: string;
  sequenceId: string;
  startTime: number;
  expectedDuration: number;
  status: 'pending' | 'animating' | 'completed' | 'error';
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface VisualizationSequence {
  id: string;
  functionCalls: FunctionCall[];
  currentIndex: number;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime: number;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export class ProcessVisualizationService {
  private config: VisualizationConfig;
  private state: VisualizationState;
  private sequences: Map<string, VisualizationSequence> = new Map();
  private executionController: NodeExecutionController;
  private processContext: any; // Will be injected
  
  // Event listeners for visualization events
  private eventListeners: Map<string, ((event: any) => void)[]> = new Map();

  constructor(
    executionController: NodeExecutionController,
    config: Partial<VisualizationConfig> = {}
  ) {
    this.executionController = executionController;
    this.config = {
      edgeAnimationDuration: 1000,
      nodeHighlightDuration: 500,
      sequenceDelay: 200,
      debug: false,
      ...config
    };
    
    this.state = {
      activeVisualizations: new Map(),
      visualizationQueue: [],
      isPaused: false
    };
  }

  /**
   * Set the process context (injected from React context)
   */
  public setProcessContext(processContext: any): void {
    this.processContext = processContext;
  }

  /**
   * Create visual transition system that pauses execution
   */
  public async createVisualTransition(
    functionCall: FunctionCall,
    sourceNodeId: string,
    targetNodeId: string,
    edgeId: string,
    context: ExecutionContext
  ): Promise<void> {
    const sequenceId = this.generateSequenceId(context);
    
    const visualization: VisualizationExecution = {
      id: this.generateVisualizationId(),
      functionCall,
      sourceNodeId,
      targetNodeId,
      edgeId,
      sequenceId,
      startTime: Date.now(),
      expectedDuration: this.config.edgeAnimationDuration + this.config.nodeHighlightDuration,
      status: 'pending'
    };

    if (this.config.debug) {
      console.log(`[ProcessVisualization] Creating visual transition: ${sourceNodeId} → ${targetNodeId}`);
    }

    // Add to queue and process
    this.state.visualizationQueue.push(visualization);
    await this.processVisualizationQueue();
  }

  /**
   * Implement edge animation and node highlighting during calls
   */
  public async animateEdgeAndHighlightNodes(
    visualization: VisualizationExecution
  ): Promise<void> {
    try {
      visualization.status = 'animating';
      this.state.activeVisualizations.set(visualization.id, visualization);

      if (this.config.debug) {
        console.log(`[ProcessVisualization] Starting animation for ${visualization.sourceNodeId} → ${visualization.targetNodeId}`);
      }

      // Emit visualization start event
      this.emitEvent('visualizationStart', {
        visualization,
        sourceNodeId: visualization.sourceNodeId,
        targetNodeId: visualization.targetNodeId,
        edgeId: visualization.edgeId
      });

      // Start source node processing state
      if (this.processContext) {
        this.processContext.startNodeProcess(visualization.sourceNodeId, visualization.functionCall.arguments);
      }

      // Highlight source node
      await this.highlightNode(visualization.sourceNodeId, 'source');

      // Animate edge
      await this.animateEdge(visualization.edgeId, visualization.functionCall);

      // Highlight target node
      await this.highlightNode(visualization.targetNodeId, 'target');

      // Complete source node processing
      if (this.processContext) {
        this.processContext.completeNodeProcess(visualization.sourceNodeId, {
          functionCall: visualization.functionCall,
          targetNode: visualization.targetNodeId
        });
      }

      visualization.status = 'completed';
      
      // Emit visualization complete event
      this.emitEvent('visualizationComplete', {
        visualization,
        duration: Date.now() - visualization.startTime
      });

      if (visualization.onComplete) {
        visualization.onComplete();
      }

      if (this.config.debug) {
        console.log(`[ProcessVisualization] Animation completed for ${visualization.sourceNodeId} → ${visualization.targetNodeId}`);
      }

    } catch (error) {
      visualization.status = 'error';
      
      if (this.processContext) {
        this.processContext.setNodeError(visualization.sourceNodeId, error.message);
      }

      this.emitEvent('visualizationError', {
        visualization,
        error
      });

      if (visualization.onError) {
        visualization.onError(error as Error);
      }

      if (this.config.debug) {
        console.error(`[ProcessVisualization] Animation error for ${visualization.sourceNodeId} → ${visualization.targetNodeId}:`, error);
      }

      throw error;
    } finally {
      this.state.activeVisualizations.delete(visualization.id);
    }
  }

  /**
   * Add execution sequencing for nested function calls
   */
  public async executeSequencedVisualization(
    functionCalls: FunctionCall[],
    context: ExecutionContext
  ): Promise<void> {
    const sequenceId = this.generateSequenceId(context);
    
    const sequence: VisualizationSequence = {
      id: sequenceId,
      functionCalls,
      currentIndex: 0,
      status: 'pending',
      startTime: Date.now()
    };

    this.sequences.set(sequenceId, sequence);
    this.state.currentSequenceId = sequenceId;

    if (this.config.debug) {
      console.log(`[ProcessVisualization] Starting sequenced visualization with ${functionCalls.length} calls`);
    }

    try {
      sequence.status = 'running';

      for (let i = 0; i < functionCalls.length; i++) {
        sequence.currentIndex = i;
        const functionCall = functionCalls[i];

        // Create visualization for this function call
        const sourceNodeId = this.getNodeIdFromFunction(functionCall.sourceFunction);
        const targetNodeId = this.getNodeIdFromFunction(functionCall.targetFunction);
        const edgeId = this.generateEdgeId(sourceNodeId, targetNodeId);

        await this.createVisualTransition(
          functionCall,
          sourceNodeId,
          targetNodeId,
          edgeId,
          context
        );

        // Add delay between sequential calls
        if (i < functionCalls.length - 1) {
          await this.delay(this.config.sequenceDelay);
        }
      }

      sequence.status = 'completed';
      
      if (sequence.onComplete) {
        sequence.onComplete();
      }

      if (this.config.debug) {
        console.log(`[ProcessVisualization] Sequenced visualization completed`);
      }

    } catch (error) {
      sequence.status = 'error';
      
      if (sequence.onError) {
        sequence.onError(error as Error);
      }

      if (this.config.debug) {
        console.error(`[ProcessVisualization] Sequenced visualization error:`, error);
      }

      throw error;
    } finally {
      this.sequences.delete(sequenceId);
      if (this.state.currentSequenceId === sequenceId) {
        this.state.currentSequenceId = undefined;
      }
    }
  }

  /**
   * Pause execution for visualization
   */
  public async pauseExecution(duration: number): Promise<void> {
    this.state.isPaused = true;
    
    if (this.config.debug) {
      console.log(`[ProcessVisualization] Pausing execution for ${duration}ms`);
    }

    await this.delay(duration);
    
    this.state.isPaused = false;
    
    if (this.config.debug) {
      console.log(`[ProcessVisualization] Resuming execution`);
    }
  }

  /**
   * Check if visualization should be enabled for a function call
   */
  public shouldVisualize(
    sourceNodeId: string,
    targetNodeId: string,
    context: ExecutionContext
  ): boolean {
    // Check if visualization is enabled in context
    if (!context.visualizationMode) {
      return false;
    }

    // Check if nodes allow visualization
    const sourceCheck = this.executionController.canExecuteNode(sourceNodeId, context);
    const targetCheck = this.executionController.canExecuteNode(targetNodeId, context);

    if (!sourceCheck.canExecute || !targetCheck.canExecute) {
      return false;
    }

    // Check if we're already in a visualization sequence to avoid infinite loops
    if (this.state.isPaused) {
      return false;
    }

    return true;
  }

  /**
   * Get current visualization state
   */
  public getVisualizationState(): VisualizationState {
    return { ...this.state };
  }

  /**
   * Get current sequence information
   */
  public getCurrentSequence(): VisualizationSequence | undefined {
    if (!this.state.currentSequenceId) {
      return undefined;
    }
    return this.sequences.get(this.state.currentSequenceId);
  }

  /**
   * Update visualization configuration
   */
  public updateConfig(config: Partial<VisualizationConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.debug) {
      console.log(`[ProcessVisualization] Configuration updated:`, this.config);
    }
  }

  /**
   * Clear all active visualizations
   */
  public clearVisualizations(): void {
    this.state.activeVisualizations.clear();
    this.state.visualizationQueue = [];
    this.sequences.clear();
    this.state.isPaused = false;
    this.state.currentSequenceId = undefined;
    
    if (this.config.debug) {
      console.log(`[ProcessVisualization] All visualizations cleared`);
    }
  }

  /**
   * Add event listener for visualization events
   */
  public addEventListener(event: string, listener: (event: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(event: string, listener: (event: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Process the visualization queue
   */
  private async processVisualizationQueue(): Promise<void> {
    while (this.state.visualizationQueue.length > 0) {
      const visualization = this.state.visualizationQueue.shift()!;
      await this.animateEdgeAndHighlightNodes(visualization);
    }
  }

  /**
   * Highlight a node during visualization
   */
  private async highlightNode(nodeId: string, type: 'source' | 'target'): Promise<void> {
    this.emitEvent('nodeHighlight', {
      nodeId,
      type,
      duration: this.config.nodeHighlightDuration
    });

    await this.delay(this.config.nodeHighlightDuration);
  }

  /**
   * Animate an edge during visualization
   */
  private async animateEdge(edgeId: string, functionCall: FunctionCall): Promise<void> {
    this.emitEvent('edgeAnimate', {
      edgeId,
      functionCall,
      duration: this.config.edgeAnimationDuration
    });

    await this.delay(this.config.edgeAnimationDuration);
  }

  /**
   * Emit an event to listeners
   */
  private emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`[ProcessVisualization] Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Generate a unique visualization ID
   */
  private generateVisualizationId(): string {
    return `viz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a sequence ID based on execution context
   */
  private generateSequenceId(context: ExecutionContext): string {
    const callStackHash = context.callStack.join('->');
    return `seq_${Date.now()}_${btoa(callStackHash).substr(0, 8)}`;
  }

  /**
   * Generate edge ID from source and target nodes
   */
  private generateEdgeId(sourceNodeId: string, targetNodeId: string): string {
    return `edge_${sourceNodeId}_${targetNodeId}`;
  }

  /**
   * Get node ID from function name (simplified mapping)
   */
  private getNodeIdFromFunction(functionName: string): string {
    // In a real implementation, this would map function names to node IDs
    // For now, we'll use the function name as the node ID
    return functionName;
  }

  /**
   * Utility method to create a delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}