/**
 * Tests for Node Execution Controller
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NodeExecutionController, NodeExecutionState, ExecutionGuard } from '../NodeExecutionController';
import {
  ExecutionContext,
  NodePermissions,
  ExecutionMode
} from '../../types/ExecutionTypes';

describe('NodeExecutionController', () => {
  let controller: NodeExecutionController;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    controller = new NodeExecutionController('testUser');
    mockContext = {
      currentNode: 'node1',
      callStack: [],
      visualizationMode: false,
      pauseDuration: 1000,
      errorHandling: 'graceful',
      nodePermissions: new Map(),
      executionModes: new Map()
    };
  });

  describe('Node State Management', () => {
    it('should set node active/inactive status', () => {
      controller.setNodeActive('node1', false);
      
      const state = controller.getNodeState('node1');
      expect(state?.isActive).toBe(false);
    });

    it('should set node permissions', () => {
      const permissions: NodePermissions = {
        nodeId: 'node1',
        canExecute: false,
        requiredRoles: ['admin'],
        userId: 'specificUser'
      };

      controller.setNodePermissions('node1', permissions);
      
      const state = controller.getNodeState('node1');
      expect(state?.permissions).toEqual(permissions);
    });

    it('should set execution mode for specific node', () => {
      controller.setExecutionMode('node1', 'visualization');
      
      const state = controller.getNodeState('node1');
      expect(state?.executionMode).toBe('visualization');
    });

    it('should set global execution mode', () => {
      controller.setGlobalExecutionMode('blocked');
      
      expect(controller.getGlobalExecutionMode()).toBe('blocked');
    });

    it('should create node state with defaults when accessing non-existent node', () => {
      const state = controller.getNodeState('newNode');
      expect(state).toBeUndefined();

      // Accessing through canExecuteNode should create default state
      controller.canExecuteNode('newNode');
      const createdState = controller.getNodeState('newNode');
      
      expect(createdState).toBeDefined();
      expect(createdState?.isActive).toBe(true);
      expect(createdState?.permissions.canExecute).toBe(true);
    });
  });

  describe('Execution Checks', () => {
    it('should allow execution for active node with permissions', () => {
      const result = controller.canExecuteNode('node1');
      
      expect(result.canExecute).toBe(true);
      expect(result.reason).toBe('All checks passed');
    });

    it('should block execution for inactive node', () => {
      controller.setNodeActive('node1', false);
      
      const result = controller.canExecuteNode('node1');
      
      expect(result.canExecute).toBe(false);
      expect(result.reason).toBe('Node is inactive');
      expect(result.suggestedAction).toBe('Activate the node to enable execution');
    });

    it('should block execution for blocked execution mode', () => {
      controller.setExecutionMode('node1', 'blocked');
      
      const result = controller.canExecuteNode('node1');
      
      expect(result.canExecute).toBe(false);
      expect(result.reason).toBe('Node execution is blocked');
    });

    it('should block execution when permissions deny it', () => {
      controller.setNodePermissions('node1', {
        nodeId: 'node1',
        canExecute: false,
        requiredRoles: [],
        userId: 'testUser'
      });
      
      const result = controller.canExecuteNode('node1');
      
      expect(result.canExecute).toBe(false);
      expect(result.reason).toBe('Node execution is disabled by permissions');
    });

    it('should block execution for user-specific permissions with wrong user', () => {
      controller.setNodePermissions('node1', {
        nodeId: 'node1',
        canExecute: true,
        requiredRoles: [],
        userId: 'differentUser'
      });
      
      const result = controller.canExecuteNode('node1');
      
      expect(result.canExecute).toBe(false);
      expect(result.reason).toBe('Insufficient permissions - node restricted to specific user');
    });

    it('should require authentication for nodes with required roles', () => {
      const controllerWithoutUser = new NodeExecutionController();
      controllerWithoutUser.setNodePermissions('node1', {
        nodeId: 'node1',
        canExecute: true,
        requiredRoles: ['admin'],
        userId: undefined
      });
      
      const result = controllerWithoutUser.canExecuteNode('node1');
      
      expect(result.canExecute).toBe(false);
      expect(result.reason).toBe('Authentication required for this node');
    });
  });

  describe('Execution Interception', () => {
    it('should allow normal execution in normal mode', async () => {
      const decision = await controller.interceptExecution('testFunc', 'node1', mockContext);
      
      expect(decision.shouldExecute).toBe(true);
      expect(decision.shouldVisualize).toBe(false);
      expect(decision.reason).toBe('Normal execution mode');
    });

    it('should enable visualization in normal mode when context has visualization enabled', async () => {
      mockContext.visualizationMode = true;
      
      const decision = await controller.interceptExecution('testFunc', 'node1', mockContext);
      
      expect(decision.shouldExecute).toBe(true);
      expect(decision.shouldVisualize).toBe(true);
    });

    it('should only visualize in visualization mode', async () => {
      controller.setExecutionMode('node1', 'visualization');
      
      const decision = await controller.interceptExecution('testFunc', 'node1', mockContext);
      
      expect(decision.shouldExecute).toBe(false);
      expect(decision.shouldVisualize).toBe(true);
      expect(decision.reason).toBe('Visualization-only mode - showing visual flow without execution');
    });

    it('should block execution for blocked mode', async () => {
      controller.setExecutionMode('node1', 'blocked');
      
      const decision = await controller.interceptExecution('testFunc', 'node1', mockContext);
      
      expect(decision.shouldExecute).toBe(false);
      expect(decision.shouldVisualize).toBe(false);
      expect(decision.reason).toBe('Node execution is blocked');
    });

    it('should update execution statistics', async () => {
      await controller.interceptExecution('testFunc', 'node1', mockContext);
      
      const state = controller.getNodeState('node1');
      expect(state?.executionCount).toBe(1);
      expect(state?.lastExecuted).toBeDefined();
    });

    it('should use global execution mode when node mode is not set', async () => {
      controller.setGlobalExecutionMode('visualization');
      
      const decision = await controller.interceptExecution('testFunc', 'node1', mockContext);
      
      expect(decision.shouldExecute).toBe(false);
      expect(decision.shouldVisualize).toBe(true);
    });
  });

  describe('Execution Guards', () => {
    it('should add and check custom execution guards', () => {
      const guard: ExecutionGuard = {
        nodeId: 'node1',
        guardType: 'custom',
        condition: (context) => context.callStack.length === 0,
        message: 'Cannot execute from within call stack'
      };

      controller.addExecutionGuard('node1', guard);
      
      // Should pass with empty call stack
      let result = controller.canExecuteNode('node1', mockContext);
      expect(result.canExecute).toBe(true);
      
      // Should fail with non-empty call stack
      mockContext.callStack = ['parentFunc'];
      result = controller.canExecuteNode('node1', mockContext);
      expect(result.canExecute).toBe(false);
      expect(result.reason).toBe('Cannot execute from within call stack');
    });

    it('should remove execution guards', () => {
      const guard: ExecutionGuard = {
        nodeId: 'node1',
        guardType: 'custom',
        condition: () => false,
        message: 'Always block'
      };

      controller.addExecutionGuard('node1', guard);
      
      // Should be blocked
      let result = controller.canExecuteNode('node1', mockContext);
      expect(result.canExecute).toBe(false);
      
      // Remove guard
      controller.removeExecutionGuard('node1', 'custom');
      
      // Should now pass
      result = controller.canExecuteNode('node1', mockContext);
      expect(result.canExecute).toBe(true);
    });

    it('should clear all execution guards', () => {
      controller.addExecutionGuard('node1', {
        nodeId: 'node1',
        guardType: 'custom',
        condition: () => false,
        message: 'Block 1'
      });
      
      controller.addExecutionGuard('node1', {
        nodeId: 'node1',
        guardType: 'permission',
        condition: () => false,
        message: 'Block 2'
      });
      
      // Should be blocked
      let result = controller.canExecuteNode('node1', mockContext);
      expect(result.canExecute).toBe(false);
      
      // Clear all guards
      controller.clearExecutionGuards('node1');
      
      // Should now pass
      result = controller.canExecuteNode('node1', mockContext);
      expect(result.canExecute).toBe(true);
    });
  });

  describe('Course Sequence Control', () => {
    it('should setup course sequence control to prevent automatic progression', () => {
      const courseNodes = ['course1', 'course2', 'course3'];
      
      controller.setupCourseSequenceControl(courseNodes);
      
      // All course nodes should be in visualization mode
      for (const nodeId of courseNodes) {
        const state = controller.getNodeState(nodeId);
        expect(state?.executionMode).toBe('visualization');
        expect(state?.isActive).toBe(true);
      }
      
      // Should block execution when called from another course
      mockContext.callStack = ['course1'];
      const result = controller.canExecuteNode('course2', mockContext);
      expect(result.canExecute).toBe(false);
      expect(result.reason).toBe('Course progression requires explicit user action');
    });

    it('should allow course execution when not called from another course', () => {
      const courseNodes = ['course1', 'course2'];
      
      controller.setupCourseSequenceControl(courseNodes);
      
      // Should allow execution when not in call stack of another course
      mockContext.callStack = ['utilityFunction'];
      const result = controller.canExecuteNode('course1', mockContext);
      expect(result.canExecute).toBe(true);
    });
  });

  describe('Bulk Operations', () => {
    it('should bulk update node states', () => {
      const updates = [
        {
          nodeId: 'node1',
          isActive: false,
          executionMode: 'blocked' as ExecutionMode
        },
        {
          nodeId: 'node2',
          executionMode: 'visualization' as ExecutionMode,
          permissions: {
            nodeId: 'node2',
            canExecute: false,
            requiredRoles: ['admin'],
            userId: 'admin'
          }
        }
      ];

      controller.bulkUpdateNodeStates(updates);
      
      const state1 = controller.getNodeState('node1');
      expect(state1?.isActive).toBe(false);
      expect(state1?.executionMode).toBe('blocked');
      
      const state2 = controller.getNodeState('node2');
      expect(state2?.executionMode).toBe('visualization');
      expect(state2?.permissions.canExecute).toBe(false);
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should reset node execution statistics', () => {
      // Execute function to create stats
      controller.interceptExecution('testFunc', 'node1', mockContext);
      
      let state = controller.getNodeState('node1');
      expect(state?.executionCount).toBe(1);
      
      // Reset stats
      controller.resetNodeStats('node1');
      
      state = controller.getNodeState('node1');
      expect(state?.executionCount).toBe(0);
      expect(state?.lastExecuted).toBeUndefined();
    });

    it('should provide execution summary', () => {
      controller.setNodeActive('node1', true);
      controller.setExecutionMode('node1', 'normal');
      
      controller.setNodeActive('node2', true);
      controller.setExecutionMode('node2', 'blocked');
      
      controller.setNodeActive('node3', false);
      controller.setExecutionMode('node3', 'visualization');
      
      controller.setGlobalExecutionMode('normal');
      
      const summary = controller.getExecutionSummary();
      
      expect(summary.totalNodes).toBe(3);
      expect(summary.activeNodes).toBe(2);
      expect(summary.blockedNodes).toBe(1);
      expect(summary.visualizationOnlyNodes).toBe(1);
      expect(summary.globalMode).toBe('normal');
    });

    it('should get all node states', () => {
      controller.setNodeActive('node1', true);
      controller.setNodeActive('node2', false);
      
      const allStates = controller.getAllNodeStates();
      
      expect(allStates.size).toBe(2);
      expect(allStates.get('node1')?.isActive).toBe(true);
      expect(allStates.get('node2')?.isActive).toBe(false);
    });
  });

  describe('User Management', () => {
    it('should set and get current user', () => {
      controller.setCurrentUser('newUser');
      
      expect(controller.getCurrentUser()).toBe('newUser');
    });

    it('should use current user in permission checks', () => {
      controller.setCurrentUser('authorizedUser');
      controller.setNodePermissions('node1', {
        nodeId: 'node1',
        canExecute: true,
        requiredRoles: [],
        userId: 'authorizedUser'
      });
      
      const result = controller.canExecuteNode('node1');
      expect(result.canExecute).toBe(true);
    });
  });
});