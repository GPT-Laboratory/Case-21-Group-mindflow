/**
 * Tests for Process Visualization Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProcessVisualizationService, VisualizationConfig } from '../ProcessVisualizationService';
import { NodeExecutionController } from '../NodeExecutionController';
import { ExecutionContext, FunctionCall } from '../../types/ExecutionTypes';

describe('ProcessVisualizationService', () => {
  let service: ProcessVisualizationService;
  let executionController: NodeExecutionController;
  let mockProcessContext: any;
  let mockContext: ExecutionContext;
  let mockFunctionCall: FunctionCall;

  beforeEach(() => {
    executionController = new NodeExecutionController('testUser');
    
    mockProcessContext = {
      startNodeProcess: vi.fn(),
      completeNodeProcess: vi.fn(),
      setNodeError: vi.fn(),
      getNodeProcessState: vi.fn(() => ({ status: 'idle' }))
    };

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

    // Use fast timers for testing
    const fastConfig: Partial<VisualizationConfig> = {
      edgeAnimationDuration: 10,
      nodeHighlightDuration: 5,
      sequenceDelay: 2,
      debug: false
    };

    service = new ProcessVisualizationService(executionController, fastConfig);
    service.setProcessContext(mockProcessContext);
  });

  describe('Configuration', () => {
    it('should initialize with default configuration', () => {
      const defaultService = new ProcessVisualizationService(executionController);
      const state = defaultService.getVisualizationState();
      
      expect(state.activeVisualizations.size).toBe(0);
      expect(state.visualizationQueue.length).toBe(0);
      expect(state.isPaused).toBe(false);
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<VisualizationConfig> = {
        edgeAnimationDuration: 2000,
        nodeHighlightDuration: 800,
        sequenceDelay: 300,
        debug: true
      };

      const customService = new ProcessVisualizationService(executionController, customConfig);
      
      expect(customService).toBeDefined();
    });

    it('should update configuration', () => {
      const newConfig: Partial<VisualizationConfig> = {
        edgeAnimationDuration: 1500,
        debug: true
      };

      service.updateConfig(newConfig);
      
      expect(service).toBeDefined();
    });
  });

  describe('Visual Transition Creation', () => {
    it('should create visual transition', async () => {
      await service.createVisualTransition(
        mockFunctionCall,
        'sourceNode',
        'targetNode',
        'edge1',
        mockContext
      );

      expect(mockProcessContext.startNodeProcess).toHaveBeenCalledWith('sourceNode', mockFunctionCall.arguments);
      expect(mockProcessContext.completeNodeProcess).toHaveBeenCalledWith('sourceNode', {
        functionCall: mockFunctionCall,
        targetNode: 'targetNode'
      });
    });

    it('should handle visualization errors', async () => {
      mockProcessContext.startNodeProcess.mockImplementation(() => {
        throw new Error('Process error');
      });

      await expect(service.createVisualTransition(
        mockFunctionCall,
        'sourceNode',
        'targetNode',
        'edge1',
        mockContext
      )).rejects.toThrow('Process error');

      expect(mockProcessContext.setNodeError).toHaveBeenCalledWith('sourceNode', 'Process error');
    });
  });

  describe('Visualization Decision Logic', () => {
    it('should visualize when conditions are met', () => {
      const shouldVisualize = service.shouldVisualize('node1', 'node2', mockContext);
      
      expect(shouldVisualize).toBe(true);
    });

    it('should not visualize when visualization mode is disabled', () => {
      mockContext.visualizationMode = false;
      
      const shouldVisualize = service.shouldVisualize('node1', 'node2', mockContext);
      
      expect(shouldVisualize).toBe(false);
    });

    it('should not visualize when source node cannot execute', () => {
      executionController.setNodeActive('node1', false);
      
      const shouldVisualize = service.shouldVisualize('node1', 'node2', mockContext);
      
      expect(shouldVisualize).toBe(false);
    });

    it('should not visualize when target node cannot execute', () => {
      executionController.setNodeActive('node2', false);
      
      const shouldVisualize = service.shouldVisualize('node1', 'node2', mockContext);
      
      expect(shouldVisualize).toBe(false);
    });
  });

  describe('Event System', () => {
    it('should add and trigger event listeners', async () => {
      const listener = vi.fn();
      service.addEventListener('visualizationStart', listener);

      await service.createVisualTransition(
        mockFunctionCall,
        'sourceNode',
        'targetNode',
        'edge1',
        mockContext
      );

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceNodeId: 'sourceNode',
          targetNodeId: 'targetNode',
          edgeId: 'edge1'
        })
      );
    });

    it('should remove event listeners', async () => {
      const listener = vi.fn();
      service.addEventListener('visualizationStart', listener);
      service.removeEventListener('visualizationStart', listener);

      await service.createVisualTransition(
        mockFunctionCall,
        'sourceNode',
        'targetNode',
        'edge1',
        mockContext
      );

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should provide current visualization state', () => {
      const state = service.getVisualizationState();
      
      expect(state).toHaveProperty('activeVisualizations');
      expect(state).toHaveProperty('visualizationQueue');
      expect(state).toHaveProperty('isPaused');
      expect(state.activeVisualizations).toBeInstanceOf(Map);
      expect(Array.isArray(state.visualizationQueue)).toBe(true);
      expect(typeof state.isPaused).toBe('boolean');
    });

    it('should clear all visualizations', () => {
      service.clearVisualizations();

      const state = service.getVisualizationState();
      expect(state.activeVisualizations.size).toBe(0);
      expect(state.visualizationQueue.length).toBe(0);
      expect(state.isPaused).toBe(false);
      expect(state.currentSequenceId).toBeUndefined();
    });
  });

  describe('Integration with NodeExecutionController', () => {
    it('should respect node execution permissions', () => {
      executionController.setNodePermissions('node1', {
        nodeId: 'node1',
        canExecute: false,
        requiredRoles: [],
        userId: 'testUser'
      });

      const shouldVisualize = service.shouldVisualize('node1', 'node2', mockContext);
      
      expect(shouldVisualize).toBe(false);
    });

    it('should respect node execution modes', () => {
      executionController.setExecutionMode('node1', 'blocked');

      const shouldVisualize = service.shouldVisualize('node1', 'node2', mockContext);
      
      expect(shouldVisualize).toBe(false);
    });

    it('should work with course sequence control', () => {
      executionController.setupCourseSequenceControl(['course1', 'course2']);

      mockContext.callStack = ['course1'];
      const shouldVisualize = service.shouldVisualize('course1', 'course2', mockContext);
      
      expect(shouldVisualize).toBe(false);
    });
  });

  describe('Execution Sequencing', () => {
    it('should execute sequenced visualization for multiple function calls', async () => {
      const functionCalls: FunctionCall[] = [
        mockFunctionCall,
        { ...mockFunctionCall, id: 'call2', sourceFunction: 'func2', targetFunction: 'func3' }
      ];

      await service.executeSequencedVisualization(functionCalls, mockContext);

      expect(mockProcessContext.startNodeProcess).toHaveBeenCalledTimes(2);
      expect(mockProcessContext.completeNodeProcess).toHaveBeenCalledTimes(2);
    });

    it('should track current sequence', async () => {
      const functionCalls: FunctionCall[] = [mockFunctionCall];

      const promise = service.executeSequencedVisualization(functionCalls, mockContext);
      
      // Check sequence is tracked during execution
      const currentSequence = service.getCurrentSequence();
      expect(currentSequence).toBeDefined();
      expect(currentSequence?.functionCalls).toEqual(functionCalls);
      
      await promise;

      // Check sequence is cleared after completion
      const completedSequence = service.getCurrentSequence();
      expect(completedSequence).toBeUndefined();
    });
  });

  describe('Execution Pausing', () => {
    it('should pause execution for specified duration', async () => {
      const promise = service.pauseExecution(10); // Short duration for testing
      
      expect(service.getVisualizationState().isPaused).toBe(true);
      
      await promise;
      
      expect(service.getVisualizationState().isPaused).toBe(false);
    });

    it('should not visualize when paused', async () => {
      const pausePromise = service.pauseExecution(10);
      
      const shouldVisualize = service.shouldVisualize('node1', 'node2', mockContext);
      expect(shouldVisualize).toBe(false);
      
      await pausePromise;
      
      // Should visualize again after pause ends
      const shouldVisualizeAfter = service.shouldVisualize('node1', 'node2', mockContext);
      expect(shouldVisualizeAfter).toBe(true);
    });
  });
});