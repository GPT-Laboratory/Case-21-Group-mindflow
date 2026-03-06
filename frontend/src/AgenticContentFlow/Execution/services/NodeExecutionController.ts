/**
 * Node Execution Controller
 * 
 * This service manages node execution state, permissions, and execution modes.
 * It provides execution guards that prevent unwanted function calls and handles
 * course sequencing without unwanted execution.
 */

import {
  ExecutionContext,
  NodePermissions,
  ExecutionMode,
  ExecutionCheckResult,
  ExecutionDecision
} from '../types/ExecutionTypes';

export interface NodeExecutionState {
  nodeId: string;
  isActive: boolean;
  permissions: NodePermissions;
  executionMode: ExecutionMode;
  lastExecuted?: number;
  executionCount: number;
}

export interface ExecutionGuard {
  nodeId: string;
  guardType: 'permission' | 'state' | 'mode' | 'custom';
  condition: (context: ExecutionContext) => boolean;
  message: string;
}

export class NodeExecutionController {
  private nodeStates: Map<string, NodeExecutionState> = new Map();
  private executionGuards: Map<string, ExecutionGuard[]> = new Map();
  private globalExecutionMode: ExecutionMode = 'normal';
  private currentUserId?: string;

  constructor(userId?: string) {
    this.currentUserId = userId;
  }

  /**
   * Set node active/inactive status
   */
  public setNodeActive(nodeId: string, isActive: boolean): void {
    const state = this.getOrCreateNodeState(nodeId);
    state.isActive = isActive;
    this.nodeStates.set(nodeId, state);
  }

  /**
   * Set node permissions
   */
  public setNodePermissions(nodeId: string, permissions: NodePermissions): void {
    const state = this.getOrCreateNodeState(nodeId);
    state.permissions = permissions;
    this.nodeStates.set(nodeId, state);
  }

  /**
   * Set execution mode for a specific node
   */
  public setExecutionMode(nodeId: string, mode: ExecutionMode): void {
    const state = this.getOrCreateNodeState(nodeId);
    state.executionMode = mode;
    this.nodeStates.set(nodeId, state);
  }

  /**
   * Set global execution mode (affects all nodes unless overridden)
   */
  public setGlobalExecutionMode(mode: ExecutionMode): void {
    this.globalExecutionMode = mode;
  }

  /**
   * Get current global execution mode
   */
  public getGlobalExecutionMode(): ExecutionMode {
    return this.globalExecutionMode;
  }

  /**
   * Check if a node can be executed
   */
  public canExecuteNode(nodeId: string, context?: ExecutionContext): ExecutionCheckResult {
    const state = this.getOrCreateNodeState(nodeId);
    
    // Check if node is active
    if (!state.isActive) {
      return {
        canExecute: false,
        reason: 'Node is inactive',
        suggestedAction: 'Activate the node to enable execution'
      };
    }

    // Check execution mode
    const effectiveMode = state.executionMode || this.globalExecutionMode;
    if (effectiveMode === 'blocked') {
      return {
        canExecute: false,
        reason: 'Node execution is blocked',
        suggestedAction: 'Change execution mode to normal or visualization'
      };
    }

    // Check permissions
    const permissionCheck = this.checkPermissions(state.permissions);
    if (!permissionCheck.canExecute) {
      return permissionCheck;
    }

    // Check custom execution guards
    const guardCheck = this.checkExecutionGuards(nodeId, context);
    if (!guardCheck.canExecute) {
      return guardCheck;
    }

    return {
      canExecute: true,
      reason: 'All checks passed'
    };
  }

  /**
   * Intercept execution and make decision based on node state
   */
  public async interceptExecution(
    functionName: string,
    nodeId: string,
    context: ExecutionContext
  ): Promise<ExecutionDecision> {
    const executionCheck = this.canExecuteNode(nodeId, context);
    
    if (!executionCheck.canExecute) {
      return {
        shouldExecute: false,
        shouldVisualize: false,
        reason: executionCheck.reason
      };
    }

    const state = this.getOrCreateNodeState(nodeId);
    const effectiveMode = state.executionMode || this.globalExecutionMode;

    // Update execution statistics
    state.lastExecuted = Date.now();
    state.executionCount++;
    this.nodeStates.set(nodeId, state);

    switch (effectiveMode) {
      case 'normal':
        return {
          shouldExecute: true,
          shouldVisualize: context.visualizationMode,
          reason: 'Normal execution mode'
        };

      case 'visualization':
        return {
          shouldExecute: false,
          shouldVisualize: true,
          reason: 'Visualization-only mode - showing visual flow without execution'
        };

      case 'blocked':
        // This should not happen as we check above, but included for completeness
        return {
          shouldExecute: false,
          shouldVisualize: false,
          reason: 'Node execution is blocked'
        };

      default:
        return {
          shouldExecute: true,
          shouldVisualize: context.visualizationMode,
          reason: 'Default execution behavior'
        };
    }
  }

  /**
   * Add custom execution guard for a node
   */
  public addExecutionGuard(nodeId: string, guard: ExecutionGuard): void {
    const guards = this.executionGuards.get(nodeId) || [];
    guards.push(guard);
    this.executionGuards.set(nodeId, guards);
  }

  /**
   * Remove execution guard for a node
   */
  public removeExecutionGuard(nodeId: string, guardType: string): void {
    const guards = this.executionGuards.get(nodeId) || [];
    const filteredGuards = guards.filter(guard => guard.guardType !== guardType);
    this.executionGuards.set(nodeId, filteredGuards);
  }

  /**
   * Clear all execution guards for a node
   */
  public clearExecutionGuards(nodeId: string): void {
    this.executionGuards.delete(nodeId);
  }

  /**
   * Get node execution state
   */
  public getNodeState(nodeId: string): NodeExecutionState | undefined {
    return this.nodeStates.get(nodeId);
  }

  /**
   * Get all node states
   */
  public getAllNodeStates(): Map<string, NodeExecutionState> {
    return new Map(this.nodeStates);
  }

  /**
   * Reset node execution statistics
   */
  public resetNodeStats(nodeId: string): void {
    const state = this.getOrCreateNodeState(nodeId);
    state.executionCount = 0;
    state.lastExecuted = undefined;
    this.nodeStates.set(nodeId, state);
  }

  /**
   * Set current user ID for permission checks
   */
  public setCurrentUser(userId: string): void {
    this.currentUserId = userId;
  }

  /**
   * Get current user ID
   */
  public getCurrentUser(): string | undefined {
    return this.currentUserId;
  }

  /**
   * Create execution summary for debugging/monitoring
   */
  public getExecutionSummary(): {
    totalNodes: number;
    activeNodes: number;
    blockedNodes: number;
    visualizationOnlyNodes: number;
    totalExecutions: number;
    globalMode: ExecutionMode;
  } {
    let activeNodes = 0;
    let blockedNodes = 0;
    let visualizationOnlyNodes = 0;
    let totalExecutions = 0;

    for (const state of this.nodeStates.values()) {
      if (state.isActive) activeNodes++;
      
      const effectiveMode = state.executionMode || this.globalExecutionMode;
      if (effectiveMode === 'blocked') blockedNodes++;
      if (effectiveMode === 'visualization') visualizationOnlyNodes++;
      
      totalExecutions += state.executionCount;
    }

    return {
      totalNodes: this.nodeStates.size,
      activeNodes,
      blockedNodes,
      visualizationOnlyNodes,
      totalExecutions,
      globalMode: this.globalExecutionMode
    };
  }

  /**
   * Bulk update node states (useful for course sequencing)
   */
  public bulkUpdateNodeStates(updates: Array<{
    nodeId: string;
    isActive?: boolean;
    executionMode?: ExecutionMode;
    permissions?: NodePermissions;
  }>): void {
    for (const update of updates) {
      const state = this.getOrCreateNodeState(update.nodeId);
      
      if (update.isActive !== undefined) {
        state.isActive = update.isActive;
      }
      if (update.executionMode !== undefined) {
        state.executionMode = update.executionMode;
      }
      if (update.permissions !== undefined) {
        state.permissions = update.permissions;
      }
      
      this.nodeStates.set(update.nodeId, state);
    }
  }

  /**
   * Create course sequence control (prevents unwanted execution in course1 → course2 flows)
   */
  public setupCourseSequenceControl(courseNodes: string[]): void {
    // Set all course nodes to visualization mode by default
    // This allows visual flow representation without automatic execution
    for (const nodeId of courseNodes) {
      this.setExecutionMode(nodeId, 'visualization');
      this.setNodeActive(nodeId, true);
      
      // Add guard to prevent automatic course progression
      this.addExecutionGuard(nodeId, {
        nodeId,
        guardType: 'custom',
        condition: (context) => {
          // Allow execution only if explicitly requested (not from automatic flow)
          return !context.callStack.some(caller => courseNodes.includes(caller));
        },
        message: 'Course progression requires explicit user action'
      });
    }
  }

  /**
   * Get or create node state with defaults
   */
  private getOrCreateNodeState(nodeId: string): NodeExecutionState {
    let state = this.nodeStates.get(nodeId);
    
    if (!state) {
      state = {
        nodeId,
        isActive: true,
        permissions: {
          nodeId,
          canExecute: true,
          requiredRoles: [],
          userId: this.currentUserId
        },
        executionMode: this.globalExecutionMode,
        executionCount: 0
      };
      this.nodeStates.set(nodeId, state);
    }
    
    return state;
  }

  /**
   * Check permissions for execution
   */
  private checkPermissions(permissions: NodePermissions): ExecutionCheckResult {
    if (!permissions.canExecute) {
      return {
        canExecute: false,
        reason: 'Node execution is disabled by permissions',
        suggestedAction: 'Enable execution permissions for this node'
      };
    }

    // Check required roles (simplified - in real implementation would check against user roles)
    if (permissions.requiredRoles.length > 0 && !this.currentUserId) {
      return {
        canExecute: false,
        reason: 'Authentication required for this node',
        suggestedAction: 'Please log in to execute this node'
      };
    }

    // Check user-specific permissions
    if (permissions.userId && permissions.userId !== this.currentUserId) {
      return {
        canExecute: false,
        reason: 'Insufficient permissions - node restricted to specific user',
        suggestedAction: 'Contact the node owner for access'
      };
    }

    return {
      canExecute: true,
      reason: 'Permission checks passed'
    };
  }

  /**
   * Check custom execution guards
   */
  private checkExecutionGuards(nodeId: string, context?: ExecutionContext): ExecutionCheckResult {
    const guards = this.executionGuards.get(nodeId) || [];
    
    for (const guard of guards) {
      if (context && !guard.condition(context)) {
        return {
          canExecute: false,
          reason: guard.message,
          suggestedAction: 'Check execution conditions and try again'
        };
      }
    }

    return {
      canExecute: true,
      reason: 'All execution guards passed'
    };
  }
}