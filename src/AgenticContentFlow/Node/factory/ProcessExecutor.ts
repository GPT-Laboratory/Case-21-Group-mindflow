/** @format */

import { NodeFactoryJSON, NodeInstanceData } from './types';
import { ParameterValidator } from './process/ParameterValidator';
import { RetryManager, RetryOptions } from './process/RetryManager';
import { ProcessContextManager, CodeValidator } from './process/ProcessContextManager';

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

  async executeProcess(
    config: NodeFactoryJSON,
    nodeData: NodeInstanceData,
    incomingData: any,
    options: ExecutionOptions = {}
  ): Promise<any> {
    console.log(`🔍 ProcessExecutor.executeProcess called for ${config.nodeType}:`, {
      nodeData,
      incomingData,
      hasCode: !!config.process.code
    });
    
    // Get process code
    const processCode = nodeData.processOverrides?.customCode || config.process.code;
    
    console.log(`📜 Process code for ${config.nodeType}:`, processCode ? 'Found' : 'Missing');
    
    // Merge and validate parameters
    const parameters = this.mergeParameters(config, nodeData);
    this.parameterValidator.validateParameters(config.process.parameters, parameters);

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
          ? await this.contextManager.executeFrontend(processCode, incomingData, nodeData, parameters)
          : await this.contextManager.executeBackend(processCode, incomingData, nodeData, parameters);
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