/**
 * Tests for Function Interception Service
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { FunctionInterceptionService } from '../FunctionInterceptionService';
import {
  ExecutionContext,
  FunctionInterceptor,
  ExecutionDecision,
  NodePermissions,
  ExecutionMode
} from '../../types/ExecutionTypes';

describe('FunctionInterceptionService', () => {
  let service: FunctionInterceptionService;
  let mockInterceptor: FunctionInterceptor;
  let mockFunction: Mock;

  beforeEach(() => {
    service = new FunctionInterceptionService();
    mockFunction = vi.fn();
    
    mockInterceptor = {
      beforeCall: vi.fn().mockResolvedValue({
        shouldExecute: true,
        shouldVisualize: false,
        reason: 'test'
      } as ExecutionDecision),
      afterCall: vi.fn().mockImplementation((result) => Promise.resolve(result)),
      onError: vi.fn().mockImplementation((error) => Promise.resolve(error))
    };
  });

  describe('Function Registration', () => {
    it('should register a function for interception', () => {
      service.registerFunction('testFunc', 'node1', mockFunction, mockInterceptor);
      
      expect(service.isFunctionRegistered('testFunc')).toBe(true);
      expect(service.getRegisteredFunctions()).toContain('testFunc');
    });

    it('should unregister a function from interception', () => {
      service.registerFunction('testFunc', 'node1', mockFunction, mockInterceptor);
      service.unregisterFunction('testFunc');
      
      expect(service.isFunctionRegistered('testFunc')).toBe(false);
      expect(service.getRegisteredFunctions()).not.toContain('testFunc');
    });

    it('should clear all intercepted functions', () => {
      service.registerFunction('func1', 'node1', mockFunction, mockInterceptor);
      service.registerFunction('func2', 'node2', mockFunction, mockInterceptor);
      
      service.clearAllInterceptions();
      
      expect(service.getRegisteredFunctions()).toHaveLength(0);
      expect(service.getCallStack()).toHaveLength(0);
    });
  });

  describe('Function Interception', () => {
    it('should create an intercepted function that calls the original', async () => {
      mockFunction.mockResolvedValue('original result');
      
      const interceptedFunc = service.createInterceptedFunction(
        'testFunc',
        'node1',
        mockFunction,
        mockInterceptor
      );

      const result = await interceptedFunc('arg1', 'arg2');

      expect(mockInterceptor.beforeCall).toHaveBeenCalledWith(
        ['arg1', 'arg2'],
        expect.objectContaining({
          currentNode: 'node1'
        })
      );
      expect(mockFunction).toHaveBeenCalledWith('arg1', 'arg2');
      expect(mockInterceptor.afterCall).toHaveBeenCalledWith(
        'original result',
        expect.objectContaining({
          currentNode: 'node1'
        })
      );
      expect(result).toBe('original result');
    });

    it('should not execute function when beforeCall returns shouldExecute: false', async () => {
      mockInterceptor.beforeCall = vi.fn().mockResolvedValue({
        shouldExecute: false,
        shouldVisualize: false,
        reason: 'blocked'
      });

      const interceptedFunc = service.createInterceptedFunction(
        'testFunc',
        'node1',
        mockFunction,
        mockInterceptor
      );

      const result = await interceptedFunc('arg1');

      expect(mockFunction).not.toHaveBeenCalled();
      expect(result).toEqual({
        intercepted: true,
        reason: 'blocked',
        executed: false
      });
    });

    it('should handle errors through interceptor', async () => {
      const testError = new Error('test error');
      mockFunction.mockRejectedValue(testError);
      mockInterceptor.onError = vi.fn().mockResolvedValue(testError);

      const interceptedFunc = service.createInterceptedFunction(
        'testFunc',
        'node1',
        mockFunction,
        mockInterceptor
      );

      await expect(interceptedFunc('arg1')).rejects.toThrow('test error');
      expect(mockInterceptor.onError).toHaveBeenCalledWith(
        testError,
        expect.objectContaining({
          currentNode: 'node1'
        })
      );
    });

    it('should bypass interception when disabled', async () => {
      mockFunction.mockResolvedValue('direct result');
      service.setInterceptionEnabled(false);

      const interceptedFunc = service.createInterceptedFunction(
        'testFunc',
        'node1',
        mockFunction,
        mockInterceptor
      );

      const result = await interceptedFunc('arg1');

      expect(mockInterceptor.beforeCall).not.toHaveBeenCalled();
      expect(mockFunction).toHaveBeenCalledWith('arg1');
      expect(result).toBe('direct result');
    });
  });

  describe('Execution Context Management', () => {
    it('should update execution context during function calls', async () => {
      mockFunction.mockResolvedValue('result');
      
      const interceptedFunc = service.createInterceptedFunction(
        'testFunc',
        'node1',
        mockFunction,
        mockInterceptor
      );

      await interceptedFunc('arg1');

      expect(mockInterceptor.beforeCall).toHaveBeenCalledWith(
        ['arg1'],
        expect.objectContaining({
          currentNode: 'node1',
          callStack: ['testFunc']
        })
      );
    });

    it('should restore execution context after function completion', async () => {
      mockFunction.mockResolvedValue('result');
      service.updateExecutionContext({ currentNode: 'initialNode' });
      
      const interceptedFunc = service.createInterceptedFunction(
        'testFunc',
        'node1',
        mockFunction,
        mockInterceptor
      );

      await interceptedFunc('arg1');

      const context = service.getExecutionContext();
      expect(context.currentNode).toBe('initialNode');
      expect(context.callStack).toHaveLength(0);
    });

    it('should maintain call stack during nested calls', async () => {
      const nestedFunction = vi.fn().mockResolvedValue('nested result');
      const nestedInterceptor = {
        beforeCall: vi.fn().mockResolvedValue({
          shouldExecute: true,
          shouldVisualize: false
        }),
        afterCall: vi.fn().mockImplementation((result) => Promise.resolve(result)),
        onError: vi.fn().mockImplementation((error) => Promise.resolve(error))
      };

      // Create nested function that calls another intercepted function
      mockFunction.mockImplementation(async () => {
        const nestedFunc = service.createInterceptedFunction(
          'nestedFunc',
          'node2',
          nestedFunction,
          nestedInterceptor
        );
        return await nestedFunc('nested arg');
      });

      const interceptedFunc = service.createInterceptedFunction(
        'parentFunc',
        'node1',
        mockFunction,
        mockInterceptor
      );

      await interceptedFunc('parent arg');

      // Verify nested call context
      expect(nestedInterceptor.beforeCall).toHaveBeenCalledWith(
        ['nested arg'],
        expect.objectContaining({
          currentNode: 'node2',
          callStack: ['parentFunc', 'nestedFunc']
        })
      );
    });
  });

  describe('Call Stack Management', () => {
    it('should track call stack frames', async () => {
      let capturedCallStack: any[] = [];
      
      // Capture call stack during beforeCall
      mockInterceptor.beforeCall = vi.fn().mockImplementation(async (args, context) => {
        capturedCallStack = service.getCallStack();
        return {
          shouldExecute: true,
          shouldVisualize: false,
          reason: 'test'
        };
      });
      
      mockFunction.mockResolvedValue('result');
      
      const interceptedFunc = service.createInterceptedFunction(
        'testFunc',
        'node1',
        mockFunction,
        mockInterceptor
      );

      await interceptedFunc('arg1', 'arg2');
      
      // Check that call stack was populated during execution
      expect(capturedCallStack).toHaveLength(1);
      expect(capturedCallStack[0]).toMatchObject({
        functionName: 'testFunc',
        nodeId: 'node1',
        arguments: ['arg1', 'arg2']
      });
      
      // Call stack should be empty after completion
      expect(service.getCallStack()).toHaveLength(0);
    });

    it('should handle call stack correctly on errors', async () => {
      const testError = new Error('test error');
      mockFunction.mockRejectedValue(testError);
      
      const interceptedFunc = service.createInterceptedFunction(
        'testFunc',
        'node1',
        mockFunction,
        mockInterceptor
      );

      await expect(interceptedFunc('arg1')).rejects.toThrow('test error');
      
      // Call stack should be cleaned up even after error
      expect(service.getCallStack()).toHaveLength(0);
    });
  });

  describe('Function Call Records', () => {
    it('should create function call records', () => {
      const functionCall = service.createFunctionCall(
        'sourceFunc',
        'targetFunc',
        ['arg1', 'arg2'],
        'direct'
      );

      expect(functionCall).toMatchObject({
        sourceFunction: 'sourceFunc',
        targetFunction: 'targetFunc',
        arguments: ['arg1', 'arg2'],
        callType: 'direct'
      });
      expect(functionCall.id).toBeDefined();
      expect(functionCall.timestamp).toBeDefined();
    });
  });

  describe('Execution Statistics', () => {
    it('should provide execution statistics', () => {
      service.registerFunction('func1', 'node1', mockFunction, mockInterceptor);
      service.registerFunction('func2', 'node2', mockFunction, mockInterceptor);
      service.updateExecutionContext({ currentNode: 'activeNode' });

      const stats = service.getExecutionStats();

      expect(stats).toEqual({
        registeredFunctions: 2,
        currentCallStackDepth: 0,
        interceptionEnabled: true,
        currentNode: 'activeNode'
      });
    });
  });

  describe('Context Updates', () => {
    it('should allow updating execution context', () => {
      const initialContext = service.getExecutionContext();
      expect(initialContext.visualizationMode).toBe(false);

      service.updateExecutionContext({
        visualizationMode: true,
        pauseDuration: 2000
      });

      const updatedContext = service.getExecutionContext();
      expect(updatedContext.visualizationMode).toBe(true);
      expect(updatedContext.pauseDuration).toBe(2000);
    });

    it('should initialize with custom context', () => {
      const customService = new FunctionInterceptionService({
        visualizationMode: true,
        pauseDuration: 500,
        currentNode: 'customNode'
      });

      const context = customService.getExecutionContext();
      expect(context.visualizationMode).toBe(true);
      expect(context.pauseDuration).toBe(500);
      expect(context.currentNode).toBe('customNode');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unregistered function execution', async () => {
      await expect(
        (service as any).executeWithInterception('unregisteredFunc', [])
      ).rejects.toThrow('Function unregisteredFunc is not registered for interception');
    });

    it('should preserve stack traces through interception', async () => {
      const originalError = new Error('original error');
      originalError.stack = 'original stack trace';
      
      mockFunction.mockRejectedValue(originalError);
      mockInterceptor.onError = vi.fn().mockResolvedValue(originalError);

      const interceptedFunc = service.createInterceptedFunction(
        'testFunc',
        'node1',
        mockFunction,
        mockInterceptor
      );

      try {
        await interceptedFunc('arg1');
      } catch (error) {
        expect((error as Error).stack).toBe('original stack trace');
      }
    });
  });
});