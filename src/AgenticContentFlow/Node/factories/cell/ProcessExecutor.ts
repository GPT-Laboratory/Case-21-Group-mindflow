/** @format */

import { NodeFactoryJSON, NodeInstanceData } from './types';
import { ParameterValidator } from './process/ParameterValidator';
import { RetryManager, RetryOptions } from './process/RetryManager';
import { ProcessContextManager, CodeValidator } from './process/ProcessContextManager';
import { Edge, Node } from '@xyflow/react';

interface ExecutionOptions {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  signal?: AbortSignal;
}

/**
 * ProcessExecutor handles execution of stored process functions with parameter management
 */
export class ProcessExecutor {
  private parameterValidator: ParameterValidator;
  private retryManager: RetryManager;
  private contextManager: ProcessContextManager;

  constructor() {
    this.parameterValidator = new ParameterValidator();
    this.retryManager = new RetryManager();
    const codeValidator = new CodeValidator();
    this.contextManager = new ProcessContextManager(codeValidator);
  }

  /**
   * Build target and source maps for a given node
   */
  private buildNodeMaps(
    nodeId: string,
    getEdges: () => Edge[],
    getNode: (id: string) => Node | undefined
  ): { targetMap: Map<string, Node>; sourceMap: Map<string, Node>; edgeMap: Map<string, Edge>; edgeMetadataMap: Map<string, any> } {
    const edges = getEdges();
    const targetMap = new Map<string, Node>();
    const sourceMap = new Map<string, Node>();
    const edgeMap = new Map<string, Edge>();
    const edgeMetadataMap = new Map<string, any>();
    
    // Build target map (outgoing edges) and store edge references with metadata
    edges
      .filter(edge => edge.source === nodeId)
      .forEach(edge => {
        const targetNode = getNode(edge.target);
        if (targetNode) {
          targetMap.set(edge.target, targetNode);
          edgeMap.set(edge.target, edge);
          // NEW: Store edge metadata for conditional routing
          if (edge.data) {
            edgeMetadataMap.set(edge.target, edge.data);
          }
        }
      });
    
    // Build source map (incoming edges)
    edges
      .filter(edge => edge.target === nodeId)
      .forEach(edge => {
        const sourceNode = getNode(edge.source);
        if (sourceNode) {
          sourceMap.set(edge.source, sourceNode);
        }
      });
    
    return { targetMap, sourceMap, edgeMap, edgeMetadataMap };
  }

  async executeProcess(
    config: NodeFactoryJSON,
    nodeData: NodeInstanceData,
    incomingData: any,
    nodeId?: string,
    getEdges?: () => Edge[],
    getNode?: (id: string) => Node | undefined,
    options: ExecutionOptions = {}
  ): Promise<any> {
    console.log(`🔍 ProcessExecutor.executeProcess called for ${config.nodeType}:`, {
      nodeData,
      incomingData,
      hasCode: !!config.process.code,
      hasNodeContext: !!(nodeId && getEdges && getNode)
    });
    
    // Get process code
    const processCode = nodeData.processOverrides?.customCode || config.process.code;
    
    console.log(`📜 Process code for ${config.nodeType}:`, processCode ? 'Found' : 'Missing');
    
    // Merge and validate parameters
    const parameters = this.mergeParameters(config, nodeData);
    this.parameterValidator.validateParameters(config.process.parameters, parameters);

    // Build node maps if context is available
    let targetMap = new Map<string, Node>();
    let sourceMap = new Map<string, Node>();
    let edgeMap = new Map<string, Edge>();
    let edgeMetadataMap = new Map<string, any>();
    
    if (nodeId && getEdges && getNode) {
      const maps = this.buildNodeMaps(nodeId, getEdges, getNode);
      targetMap = maps.targetMap;
      sourceMap = maps.sourceMap;
      edgeMap = maps.edgeMap;
      edgeMetadataMap = maps.edgeMetadataMap;
      
      console.log(`🗺️ Built node maps for ${nodeId}:`, {
        targets: targetMap.size,
        sources: sourceMap.size,
        targetIds: Array.from(targetMap.keys()),
        sourceIds: Array.from(sourceMap.keys()),
        hasMetadata: edgeMetadataMap.size > 0
      });
    }

    // Setup retry options
    const retryOptions: RetryOptions = {
      timeout: options.timeout || nodeData.processOverrides?.constraints?.timeout || config.process.constraints?.timeout || 30000,
      maxAttempts: options.retryAttempts || parameters.retryAttempts || config.process.constraints?.maxRetries || 3,
      delayMs: options.retryDelay || parameters.retryDelay || 1000,
      signal: options.signal
    };

    // Execute with retry
    return this.retryManager.executeWithRetry(
      async (attempt) => {
        if (attempt > 1) {
          console.log(`🔄 Retry attempt ${attempt} of ${retryOptions.maxAttempts}`);
        }
        
        return config.process.metadata.executionContext === 'frontend'
          ? await this.contextManager.executeFrontend(
              processCode, 
              incomingData, 
              nodeData, 
              parameters,
              targetMap,
              sourceMap,
              edgeMap,
              edgeMetadataMap
            )
          : await this.contextManager.executeBackend(
              processCode, 
              incomingData, 
              nodeData, 
              parameters,
              targetMap,
              sourceMap,
              edgeMap,
              edgeMetadataMap
            );
      },
      retryOptions
    );
  }

  private mergeParameters(config: NodeFactoryJSON, nodeData: NodeInstanceData): Record<string, any> {
    const merged = { ...config.template.defaultParameters };
    if (nodeData.processOverrides?.parameters) {
      Object.assign(merged, nodeData.processOverrides.parameters);
    }
    return merged;
  }
}