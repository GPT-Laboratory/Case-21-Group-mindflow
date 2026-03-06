import { HandleType } from '@xyflow/react';

/**
 * Handle validation rule definition
 */
export interface HandleValidationRule {
  sourceHandleType: HandleType;
  targetHandleType: HandleType;
  connectionType: 'horizontal' | 'vertical';
  isValid: boolean;
  reason?: string;
}

/**
 * Node connection constraint tracking
 */
export interface NodeConnectionConstraint {
  nodeId: string;
  activeConnectionType?: 'horizontal' | 'vertical';
  horizontalConnections: number;
  verticalConnections: number;
  maxHorizontalConnections?: number;
  maxVerticalConnections?: number;
}

/**
 * Connection validation result
 */
export interface ConnectionValidationResult {
  isValid: boolean;
  reason?: string;
  suggestedAlternatives?: string[];
}

/**
 * Handle validation service for enforcing connection rules
 */
export class HandleValidationService {
  private validationRules: HandleValidationRule[] = [];
  private nodeConstraints: Map<string, NodeConnectionConstraint> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default validation rules
   */
  private initializeDefaultRules(): void {
    // Function call connections (horizontal)
    this.addValidationRule({
      sourceHandleType: 'source',
      targetHandleType: 'target',
      connectionType: 'horizontal',
      isValid: true
    });

    // Data flow connections (vertical)
    this.addValidationRule({
      sourceHandleType: 'source',
      targetHandleType: 'target', 
      connectionType: 'vertical',
      isValid: true
    });

    // Invalid: source to source
    this.addValidationRule({
      sourceHandleType: 'source',
      targetHandleType: 'source',
      connectionType: 'horizontal',
      isValid: false,
      reason: 'Cannot connect source handle to source handle'
    });

    // Invalid: target to target
    this.addValidationRule({
      sourceHandleType: 'target',
      targetHandleType: 'target',
      connectionType: 'horizontal',
      isValid: false,
      reason: 'Cannot connect target handle to target handle'
    });
  }

  /**
   * Add a validation rule
   */
  addValidationRule(rule: HandleValidationRule): void {
    this.validationRules.push(rule);
  }

  /**
   * Remove validation rules matching criteria
   */
  removeValidationRule(criteria: Partial<HandleValidationRule>): void {
    this.validationRules = this.validationRules.filter(rule => {
      return !Object.keys(criteria).every(key => 
        rule[key as keyof HandleValidationRule] === criteria[key as keyof HandleValidationRule]
      );
    });
  }

  /**
   * Validate a potential connection between handles
   */
  validateConnection(
    sourceNodeId: string,
    sourceHandleType: HandleType,
    targetNodeId: string,
    targetHandleType: HandleType,
    connectionType: 'horizontal' | 'vertical'
  ): ConnectionValidationResult {
    // Check basic handle type compatibility
    const handleValidation = this.validateHandleTypes(
      sourceHandleType,
      targetHandleType,
      connectionType
    );

    if (!handleValidation.isValid) {
      return handleValidation;
    }

    // Check node connection constraints
    const constraintValidation = this.validateNodeConstraints(
      sourceNodeId,
      targetNodeId,
      connectionType
    );

    if (!constraintValidation.isValid) {
      return constraintValidation;
    }

    // Check for self-connections
    if (sourceNodeId === targetNodeId) {
      return {
        isValid: false,
        reason: 'Cannot connect node to itself'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate handle type compatibility
   */
  private validateHandleTypes(
    sourceHandleType: HandleType,
    targetHandleType: HandleType,
    connectionType: 'horizontal' | 'vertical'
  ): ConnectionValidationResult {
    // Find all matching rules (later rules override earlier ones)
    const matchingRules = this.validationRules.filter(rule =>
      rule.sourceHandleType === sourceHandleType &&
      rule.targetHandleType === targetHandleType &&
      rule.connectionType === connectionType
    );

    if (matchingRules.length === 0) {
      return {
        isValid: false,
        reason: `No validation rule found for ${sourceHandleType} -> ${targetHandleType} (${connectionType})`
      };
    }

    // Use the last matching rule (most recently added takes precedence)
    const activeRule = matchingRules[matchingRules.length - 1];

    return {
      isValid: activeRule.isValid,
      reason: activeRule.reason
    };
  }

  /**
   * Validate node connection constraints
   */
  private validateNodeConstraints(
    sourceNodeId: string,
    targetNodeId: string,
    connectionType: 'horizontal' | 'vertical'
  ): ConnectionValidationResult {
    const sourceConstraint = this.getNodeConstraint(sourceNodeId);
    const targetConstraint = this.getNodeConstraint(targetNodeId);

    // Check if source node can accept this connection type
    const sourceValidation = this.validateNodeConnectionType(sourceConstraint, connectionType, 'source');
    if (!sourceValidation.isValid) {
      return sourceValidation;
    }

    // Check if target node can accept this connection type
    const targetValidation = this.validateNodeConnectionType(targetConstraint, connectionType, 'target');
    if (!targetValidation.isValid) {
      return targetValidation;
    }

    return { isValid: true };
  }

  /**
   * Validate if a node can accept a specific connection type
   */
  private validateNodeConnectionType(
    constraint: NodeConnectionConstraint,
    connectionType: 'horizontal' | 'vertical',
    role: 'source' | 'target'
  ): ConnectionValidationResult {
    // Check if node already has connections of the opposite type
    if (constraint.activeConnectionType && constraint.activeConnectionType !== connectionType) {
      return {
        isValid: false,
        reason: `Node already has ${constraint.activeConnectionType} connections. Cannot mix connection types.`,
        suggestedAlternatives: [`Use ${constraint.activeConnectionType} connections instead`]
      };
    }

    // Check connection limits
    const currentConnections = connectionType === 'horizontal' 
      ? constraint.horizontalConnections 
      : constraint.verticalConnections;
    
    const maxConnections = connectionType === 'horizontal'
      ? constraint.maxHorizontalConnections
      : constraint.maxVerticalConnections;

    if (maxConnections !== undefined && currentConnections >= maxConnections) {
      return {
        isValid: false,
        reason: `Node has reached maximum ${connectionType} connections (${maxConnections})`
      };
    }

    return { isValid: true };
  }

  /**
   * Get or create node constraint
   */
  private getNodeConstraint(nodeId: string): NodeConnectionConstraint {
    if (!this.nodeConstraints.has(nodeId)) {
      this.nodeConstraints.set(nodeId, {
        nodeId,
        horizontalConnections: 0,
        verticalConnections: 0
      });
    }
    return this.nodeConstraints.get(nodeId)!;
  }

  /**
   * Update node constraints when connection is added
   */
  addConnection(
    sourceNodeId: string,
    targetNodeId: string,
    connectionType: 'horizontal' | 'vertical'
  ): void {
    const sourceConstraint = this.getNodeConstraint(sourceNodeId);
    const targetConstraint = this.getNodeConstraint(targetNodeId);

    // Update connection counts
    if (connectionType === 'horizontal') {
      sourceConstraint.horizontalConnections++;
      targetConstraint.horizontalConnections++;
    } else {
      sourceConstraint.verticalConnections++;
      targetConstraint.verticalConnections++;
    }

    // Set active connection type if this is the first connection
    if (!sourceConstraint.activeConnectionType) {
      sourceConstraint.activeConnectionType = connectionType;
    }
    if (!targetConstraint.activeConnectionType) {
      targetConstraint.activeConnectionType = connectionType;
    }
  }

  /**
   * Update node constraints when connection is removed
   */
  removeConnection(
    sourceNodeId: string,
    targetNodeId: string,
    connectionType: 'horizontal' | 'vertical'
  ): void {
    const sourceConstraint = this.getNodeConstraint(sourceNodeId);
    const targetConstraint = this.getNodeConstraint(targetNodeId);

    // Update connection counts
    if (connectionType === 'horizontal') {
      sourceConstraint.horizontalConnections = Math.max(0, sourceConstraint.horizontalConnections - 1);
      targetConstraint.horizontalConnections = Math.max(0, targetConstraint.horizontalConnections - 1);
    } else {
      sourceConstraint.verticalConnections = Math.max(0, sourceConstraint.verticalConnections - 1);
      targetConstraint.verticalConnections = Math.max(0, targetConstraint.verticalConnections - 1);
    }

    // Clear active connection type if no connections remain
    if (sourceConstraint.horizontalConnections === 0 && sourceConstraint.verticalConnections === 0) {
      sourceConstraint.activeConnectionType = undefined;
    }
    if (targetConstraint.horizontalConnections === 0 && targetConstraint.verticalConnections === 0) {
      targetConstraint.activeConnectionType = undefined;
    }
  }

  /**
   * Check if a node can accept a new connection of the specified type
   */
  canNodeAcceptConnection(
    nodeId: string,
    connectionType: 'horizontal' | 'vertical',
    role: 'source' | 'target'
  ): boolean {
    const constraint = this.getNodeConstraint(nodeId);
    const validation = this.validateNodeConnectionType(constraint, connectionType, role);
    return validation.isValid;
  }

  /**
   * Get node connection status
   */
  getNodeConnectionStatus(nodeId: string): NodeConnectionConstraint {
    return this.getNodeConstraint(nodeId);
  }

  /**
   * Set connection limits for a node
   */
  setNodeConnectionLimits(
    nodeId: string,
    maxHorizontal?: number,
    maxVertical?: number
  ): void {
    const constraint = this.getNodeConstraint(nodeId);
    constraint.maxHorizontalConnections = maxHorizontal;
    constraint.maxVerticalConnections = maxVertical;
  }

  /**
   * Clear all constraints for a node
   */
  clearNodeConstraints(nodeId: string): void {
    this.nodeConstraints.delete(nodeId);
  }

  /**
   * Get all validation rules
   */
  getValidationRules(): HandleValidationRule[] {
    return [...this.validationRules];
  }

  /**
   * Reset all constraints and rules to defaults
   */
  reset(): void {
    this.nodeConstraints.clear();
    this.validationRules = [];
    this.initializeDefaultRules();
  }
}

// Export singleton instance
export const handleValidationService = new HandleValidationService();