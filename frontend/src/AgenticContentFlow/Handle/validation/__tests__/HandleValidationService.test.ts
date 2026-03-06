import { describe, it, expect, beforeEach } from 'vitest';
import { HandleValidationService } from '../HandleValidationService';

describe('HandleValidationService', () => {
  let validationService: HandleValidationService;

  beforeEach(() => {
    validationService = new HandleValidationService();
  });

  describe('Handle Type Validation', () => {
    it('should allow valid source to target horizontal connections', () => {
      const result = validationService.validateConnection(
        'node1',
        'source',
        'node2', 
        'target',
        'horizontal'
      );

      expect(result.isValid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should allow valid source to target vertical connections', () => {
      const result = validationService.validateConnection(
        'node1',
        'source',
        'node2',
        'target', 
        'vertical'
      );

      expect(result.isValid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should reject source to source connections', () => {
      const result = validationService.validateConnection(
        'node1',
        'source',
        'node2',
        'source',
        'horizontal'
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Cannot connect source handle to source handle');
    });

    it('should reject target to target connections', () => {
      const result = validationService.validateConnection(
        'node1',
        'target',
        'node2',
        'target',
        'horizontal'
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Cannot connect target handle to target handle');
    });

    it('should reject self-connections', () => {
      const result = validationService.validateConnection(
        'node1',
        'source',
        'node1',
        'target',
        'horizontal'
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Cannot connect node to itself');
    });
  });

  describe('Connection Type Constraints', () => {
    it('should allow first connection of any type', () => {
      const result = validationService.validateConnection(
        'node1',
        'source',
        'node2',
        'target',
        'horizontal'
      );

      expect(result.isValid).toBe(true);
    });

    it('should allow additional connections of the same type', () => {
      // Add first horizontal connection
      validationService.addConnection('node1', 'node2', 'horizontal');

      // Try to add another horizontal connection
      const result = validationService.validateConnection(
        'node1',
        'source',
        'node3',
        'target',
        'horizontal'
      );

      expect(result.isValid).toBe(true);
    });

    it('should reject connections of different type when node already has connections', () => {
      // Add horizontal connection
      validationService.addConnection('node1', 'node2', 'horizontal');

      // Try to add vertical connection
      const result = validationService.validateConnection(
        'node1',
        'source',
        'node3',
        'target',
        'vertical'
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('already has horizontal connections');
      expect(result.suggestedAlternatives).toContain('Use horizontal connections instead');
    });

    it('should allow mixed connection types after removing all connections', () => {
      // Add and remove horizontal connection
      validationService.addConnection('node1', 'node2', 'horizontal');
      validationService.removeConnection('node1', 'node2', 'horizontal');

      // Should now allow vertical connection
      const result = validationService.validateConnection(
        'node1',
        'source',
        'node3',
        'target',
        'vertical'
      );

      expect(result.isValid).toBe(true);
    });
  });

  describe('Connection Limits', () => {
    it('should enforce maximum horizontal connection limits', () => {
      validationService.setNodeConnectionLimits('node1', 2, undefined);

      // Add maximum allowed connections
      validationService.addConnection('node1', 'node2', 'horizontal');
      validationService.addConnection('node1', 'node3', 'horizontal');

      // Try to add one more
      const result = validationService.validateConnection(
        'node1',
        'source',
        'node4',
        'target',
        'horizontal'
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('reached maximum horizontal connections (2)');
    });

    it('should enforce maximum vertical connection limits', () => {
      validationService.setNodeConnectionLimits('node1', undefined, 1);

      // Add maximum allowed connection
      validationService.addConnection('node1', 'node2', 'vertical');

      // Try to add one more
      const result = validationService.validateConnection(
        'node1',
        'source',
        'node3',
        'target',
        'vertical'
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('reached maximum vertical connections (1)');
    });

    it('should allow connections when under the limit', () => {
      validationService.setNodeConnectionLimits('node1', 3, 3);

      // Add one connection
      validationService.addConnection('node1', 'node2', 'horizontal');

      // Should still allow more
      const result = validationService.validateConnection(
        'node1',
        'source',
        'node3',
        'target',
        'horizontal'
      );

      expect(result.isValid).toBe(true);
    });
  });

  describe('Node Constraint Management', () => {
    it('should track connection counts correctly', () => {
      validationService.addConnection('node1', 'node2', 'horizontal');
      validationService.addConnection('node1', 'node3', 'horizontal');

      const status = validationService.getNodeConnectionStatus('node1');
      expect(status.horizontalConnections).toBe(2);
      expect(status.verticalConnections).toBe(0);
      expect(status.activeConnectionType).toBe('horizontal');
    });

    it('should update connection counts when connections are removed', () => {
      validationService.addConnection('node1', 'node2', 'horizontal');
      validationService.addConnection('node1', 'node3', 'horizontal');
      validationService.removeConnection('node1', 'node2', 'horizontal');

      const status = validationService.getNodeConnectionStatus('node1');
      expect(status.horizontalConnections).toBe(1);
      expect(status.activeConnectionType).toBe('horizontal');
    });

    it('should clear active connection type when all connections are removed', () => {
      validationService.addConnection('node1', 'node2', 'horizontal');
      validationService.removeConnection('node1', 'node2', 'horizontal');

      const status = validationService.getNodeConnectionStatus('node1');
      expect(status.horizontalConnections).toBe(0);
      expect(status.activeConnectionType).toBeUndefined();
    });

    it('should not allow negative connection counts', () => {
      // Try to remove connection that doesn't exist
      validationService.removeConnection('node1', 'node2', 'horizontal');

      const status = validationService.getNodeConnectionStatus('node1');
      expect(status.horizontalConnections).toBe(0);
    });
  });

  describe('Utility Methods', () => {
    it('should check if node can accept connection', () => {
      expect(validationService.canNodeAcceptConnection('node1', 'horizontal', 'source')).toBe(true);

      validationService.addConnection('node1', 'node2', 'horizontal');
      expect(validationService.canNodeAcceptConnection('node1', 'horizontal', 'source')).toBe(true);
      expect(validationService.canNodeAcceptConnection('node1', 'vertical', 'source')).toBe(false);
    });

    it('should clear node constraints', () => {
      validationService.addConnection('node1', 'node2', 'horizontal');
      validationService.clearNodeConstraints('node1');

      const status = validationService.getNodeConnectionStatus('node1');
      expect(status.horizontalConnections).toBe(0);
      expect(status.activeConnectionType).toBeUndefined();
    });

    it('should reset all constraints and rules', () => {
      validationService.addConnection('node1', 'node2', 'horizontal');
      validationService.setNodeConnectionLimits('node1', 5, 5);
      
      validationService.reset();

      const status = validationService.getNodeConnectionStatus('node1');
      expect(status.horizontalConnections).toBe(0);
      expect(status.maxHorizontalConnections).toBeUndefined();
    });
  });

  describe('Custom Validation Rules', () => {
    it('should allow adding custom validation rules', () => {
      validationService.addValidationRule({
        sourceHandleType: 'source',
        targetHandleType: 'target',
        connectionType: 'horizontal',
        isValid: false,
        reason: 'Custom rule: no horizontal connections allowed'
      });

      const result = validationService.validateConnection(
        'node1',
        'source',
        'node2',
        'target',
        'horizontal'
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Custom rule: no horizontal connections allowed');
    });

    it('should allow removing validation rules', () => {
      const initialRules = validationService.getValidationRules().length;

      validationService.addValidationRule({
        sourceHandleType: 'source',
        targetHandleType: 'target',
        connectionType: 'horizontal',
        isValid: false,
        reason: 'Temporary rule'
      });

      expect(validationService.getValidationRules().length).toBe(initialRules + 1);

      validationService.removeValidationRule({
        sourceHandleType: 'source',
        targetHandleType: 'target',
        connectionType: 'horizontal',
        reason: 'Temporary rule'
      });

      expect(validationService.getValidationRules().length).toBe(initialRules);
    });

    it('should return validation rules', () => {
      const rules = validationService.getValidationRules();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined connection limits gracefully', () => {
      // No limits set - should allow unlimited connections
      for (let i = 0; i < 10; i++) {
        validationService.addConnection('node1', `node${i + 2}`, 'horizontal');
      }

      const result = validationService.validateConnection(
        'node1',
        'source',
        'node12',
        'target',
        'horizontal'
      );

      expect(result.isValid).toBe(true);
    });

    it('should handle validation for non-existent rules', () => {
      // Try to validate with handle types that have no rules
      const result = validationService.validateConnection(
        'node1',
        'source' as any,
        'node2',
        'target' as any,
        'diagonal' as any
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('No validation rule found');
    });
  });
});