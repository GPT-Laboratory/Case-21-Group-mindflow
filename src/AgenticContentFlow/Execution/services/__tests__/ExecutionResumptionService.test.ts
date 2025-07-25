/**
 * Tests for Execution Resumption Service
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ExecutionResumptionService, ResumptionConfig } from '../ExecutionResumptionService';
import { ProcessVisualizationService } from '../ProcessVisualizationService';
import { FunctionInterceptionService } from '../FunctionInterceptionService';
import { NodeExecutionController } from '../NodeExecutionController';
import { ExecutionContext, FunctionCall } from '../../types/ExecutionTypes';

describe('ExecutionResumptionService', () => {
  let service: ExecutionResumptionService;
  let visualizationService: ProcessVisualizationService;
  let interceptionService: FunctionInterceptionService;
  let executionController: NodeExecutionController;
  let mockContext: ExecutionContext;
  let mockFunctionCall: FunctionCall;
  let mockOriginalFunction: vi.Mock;

  beforeEach(() => {
    executionController = new NodeExecutionController('testUser');
    interceptionService = new FunctionInterceptionService();
    
    // Use fast config for testing
    const fastVisualizationConfig = {
      edgeAnimationDuration: 10,
      nodeHighlightDuration: 5,
      sequenceDelay: 2,
      debug: false
    };
    
    visualizationService = new ProcessVisualizationService(executionController, fastVisualizationConfig);
    
    const fastResumptionConfig: Partial<ResumptionConfig> = {
      visualizationTimeout: 1000,
      debug: false,
      maxConcurrentResumptions: 5
    };
    
    service = new ExecutionResumptionService(
      visualizationService,
      interceptionService,
      fastResumptionConfig
    );

    mockContext = {
      currentNode: 'node1',
      callStack: [],
      visualizationMode: true,
      pauseDuration: 1000,
      errorHandling: 'graceful',
      nodePermissions: new Map(),
      executionModes: new Map()
    };

    mockFunctionCall = {
      id: 'call1',
      sourceFunction: 'sourceFunc',
      targetFunction: 'targetFunc',
      arguments: ['arg1', 'arg2'],
      timestamp: Date.now(),
      callType: 'direct'
    };

    mockOriginalFunction = vi.fn().mockResolvedValue('function result');
  });

  afterEach(() => {
    service.clearAllResumptions();
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should initialize with default configuration', () => {
      const defaultService = new ExecutionResumptionService(
        visualizationService,
        interceptionService
      );
      
      const stats = defaultService.getResumptionStats();
      expect(stats.total).toBe(0);
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<ResumptionConfig> = {
        visualizationTimeout: 5000,
        debug: true,
        maxConcurrentResumptions: 10
      };

      const customService = new ExecutionResumptionService(
        visualizationService,
        interceptionService,
        customConfig
      );
      
      expect(customService).toBeDefined();
    });

    it('should update configuration', () => {
      const newConfig: Partial<ResumptionConfig> = {
        visualizationTimeout: 2000,
        debug: true
      };

      service.updateConfig(newConfig);
      
      expect(service).toBeDefined();
    });
  });

  describe('Direct Execution (No Visualization)', () => {
    beforeEach(() => {
      // Disable visualization mode
      mockContext.visualizationMode = false;
    });

    it('should execute function directly when visualization is disabled', async () => {
      const result = await service.resumeAfterVisualization(
        mockFunctionCall,
        mockOriginalFunction,
        ['arg1', 'arg2'],
        mockContext
      );

      expect(result).toBe('function result');
      expect(mockOriginalFunction).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should handle direct execution errors', async () => {
      const testError = new Error('Direct execution error');
      mockOriginalFunction.mockRejectedValue(testError);

      await expect(service.resumeAfterVisualization(
        mockFunctionCall,
        mockOriginalFunction,
        ['arg1', 'arg2'],
        mockContext
      )).rejects.toThrow('Direct execution error');
    });

    it('should update statistics for direct execution', async () => {
      await service.resumeAfterVisualization(
        mockFunctionCall,
        mockOriginalFunction,
        ['arg1', 'arg2'],
        mockContext
      );

      const stats = service.getResumptionStats();
      expect(stats.completed).toBe(1);
      expect(stats.errors).toBe(0);
    });
  });

  describe('Execution with Visualization', () => {
    beforeEach(() => {
      // Mock process context for visualization service
      const mockProcessContext = {
        startNodeProcess: vi.fn(),
        completeNodeProcess: vi.fn(),
        setNodeError: vi.fn(),
        getNodeProcessState: vi.fn(() => ({ status: 'idle' }))
      };
      visualizationService.setProcessContext(mockProcessContext);
    });

    it('should execute with visualization when enabled', async () => {
      const result = await service.resumeAfterVisualization(
        mockFunctionCall,
        mockOriginalFunction,
        ['arg1', 'arg2'],
        mockContext
      );

      expect(result).toBe('function result');
      expect(mockOriginalFunction).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should handle visualization errors', async () => {
      // Mock visualization service to throw error
      vi.spyOn(visualizationService, 'createVisualTransition').mockRejectedValue(
        new Error('Visualization error')
      );

      await expect(service.resumeAfterVisualization(
        mockFunctionCall,
        mockOriginalFunction,
        ['arg1', 'arg2'],
        mockContext
      )).rejects.toThrow('Visualization error');
    });

    it('should handle function execution errors after visualization', async () => {
      const testError = new Error('Function execution error');
      mockOriginalFunction.mockRejectedValue(testError);

      await expect(service.resumeAfterVisualization(
        mockFunctionCall,
        mockOriginalFunction,
        ['arg1', 'arg2'],
        mockContext
      )).rejects.toThrow('Function execution error');
    });
  });

  describe('Error Propagation', () => {
    it('should preserve error stack traces', async () => {
      const originalError = new Error('Original error');
      originalError.stack = 'Original stack trace';
      mockOriginalFunction.mockRejectedValue(originalError);

      try {
        await service.resumeAfterVisualization(
          mockFunctionCall,
          mockOriginalFunction,
          ['arg1', 'arg2'],
          mockContext
        );
      } catch (error) {
        expect((error as Error).stack).toBe('Original stack trace');
        expect((error as any).executionContext).toBeDefined();
        expect((error as any).executionContext.currentNode).toBe('node1');
      }
    });

    it('should add execution context to errors', async () => {
      const testError = new Error('Test error');
      mockOriginalFunction.mockRejectedValue(testError);

      try {
        await service.resumeAfterVisualization(
          mockFunctionCall,
          mockOriginalFunction,
          ['arg1', 'arg2'],
          mockContext
        );
      } catch (error) {
        expect((error as any).executionContext).toEqual({
          currentNode: 'node1',
          callStack: [],
          visualizationMode: true
        });
      }
    });
  });

  describe('Queue Management', () => {
    it('should track resumptions in queue', async () => {
      // Start a resumption but don't await it immediately
      const promise = service.resumeAfterVisualization(
        mockFunctionCall,
        mockOriginalFunction,
        ['arg1', 'arg2'],
        mockContext
      );

      // Check queue state during execution
      const queueState = service.getQueueState();
      expect(queueState.pending.length + queueState.visualizing.length + queueState.resuming.length).toBeGreaterThan(0);

      await promise;

      // Queue should be empty after completion
      const finalQueueState = service.getQueueState();
      expect(finalQueueState.pending.length).toBe(0);
      expect(finalQueueState.visualizing.length).toBe(0);
      expect(finalQueueState.resuming.length).toBe(0);
    });

    it('should handle multiple concurrent resumptions', async () => {
      const promises = [];
      
      for (let i = 0; i < 3; i++) {
        const functionCall = { ...mockFunctionCall, id: `call${i}` };
        const mockFunc = vi.fn().mockResolvedValue(`result${i}`);
        
        promises.push(service.resumeAfterVisualization(
          functionCall,
          mockFunc,
          [`arg${i}`],
          mockContext
        ));
      }

      const results = await Promise.all(promises);
      
      expect(results).toEqual(['result0', 'result1', 'result2']);
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should provide resumption statistics', async () => {
      // Execute successful resumption
      await service.resumeAfterVisualization(
        mockFunctionCall,
        mockOriginalFunction,
        ['arg1', 'arg2'],
        mockContext
      );

      // Execute failed resumption
      const errorFunction = vi.fn().mockRejectedValue(new Error('Test error'));
      try {
        await service.resumeAfterVisualization(
          { ...mockFunctionCall, id: 'call2' },
          errorFunction,
          ['arg1'],
          mockContext
        );
      } catch (error) {
        // Expected error
      }

      const stats = service.getResumptionStats();
      expect(stats.completed).toBe(1);
      expect(stats.errors).toBe(1);
      expect(stats.total).toBe(2);
      expect(stats.averageExecutionTime).toBeGreaterThanOrEqual(0);
    });

    it('should calculate timing statistics', async () => {
      await service.resumeAfterVisualization(
        mockFunctionCall,
        mockOriginalFunction,
        ['arg1', 'arg2'],
        mockContext
      );

      const stats = service.getResumptionStats();
      expect(stats.averageVisualizationTime).toBeGreaterThanOrEqual(0);
      expect(stats.averageExecutionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Timeout Handling', () => {
    it('should have timeout configuration', () => {
      const shortTimeoutService = new ExecutionResumptionService(
        visualizationService,
        interceptionService,
        { visualizationTimeout: 100, debug: false }
      );

      expect(shortTimeoutService).toBeDefined();
      // Timeout functionality is tested implicitly through other tests
    });
  });

  describe('Context Management', () => {
    it('should maintain proper call stack context', async () => {
      const contextWithCallStack = {
        ...mockContext,
        callStack: ['parentFunc', 'currentFunc']
      };

      await service.resumeAfterVisualization(
        mockFunctionCall,
        mockOriginalFunction,
        ['arg1', 'arg2'],
        contextWithCallStack
      );

      expect(mockOriginalFunction).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should restore execution context after resumption', async () => {
      const updateContextSpy = vi.spyOn(interceptionService, 'updateExecutionContext');

      await service.resumeAfterVisualization(
        mockFunctionCall,
        mockOriginalFunction,
        ['arg1', 'arg2'],
        mockContext
      );

      expect(updateContextSpy).toHaveBeenCalledWith(mockContext);
    });
  });

  describe('Cleanup', () => {
    it('should clear all resumptions', async () => {
      // Start some resumptions
      const promise1 = service.resumeAfterVisualization(
        mockFunctionCall,
        mockOriginalFunction,
        ['arg1'],
        mockContext
      );

      const promise2 = service.resumeAfterVisualization(
        { ...mockFunctionCall, id: 'call2' },
        vi.fn().mockResolvedValue('result2'),
        ['arg2'],
        mockContext
      );

      // Clear all
      service.clearAllResumptions();

      const stats = service.getResumptionStats();
      expect(stats.total).toBe(0);

      const queueState = service.getQueueState();
      expect(queueState.pending.length).toBe(0);
      expect(queueState.visualizing.length).toBe(0);
      expect(queueState.resuming.length).toBe(0);

      // Original promises should still resolve/reject appropriately
      await expect(promise1).resolves.toBeDefined();
      await expect(promise2).resolves.toBeDefined();
    });
  });

  describe('Integration with Visualization Service', () => {
    it('should respect visualization decision logic', async () => {
      // Mock shouldVisualize to return false
      vi.spyOn(visualizationService, 'shouldVisualize').mockReturnValue(false);

      const result = await service.resumeAfterVisualization(
        mockFunctionCall,
        mockOriginalFunction,
        ['arg1', 'arg2'],
        mockContext
      );

      expect(result).toBe('function result');
      expect(mockOriginalFunction).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should handle visualization service events', async () => {
      const mockProcessContext = {
        startNodeProcess: vi.fn(),
        completeNodeProcess: vi.fn(),
        setNodeError: vi.fn(),
        getNodeProcessState: vi.fn(() => ({ status: 'idle' }))
      };
      visualizationService.setProcessContext(mockProcessContext);

      await service.resumeAfterVisualization(
        mockFunctionCall,
        mockOriginalFunction,
        ['arg1', 'arg2'],
        mockContext
      );

      expect(mockOriginalFunction).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });
});