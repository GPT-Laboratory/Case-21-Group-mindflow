import { describe, it, expect, beforeEach } from 'vitest';
import { HandleValidationService } from '../validation/HandleValidationService';

describe('Handle Validation Integration', () => {
  let validationService: HandleValidationService;

  beforeEach(() => {
    validationService = new HandleValidationService();
  });

  describe('HandleValidationService Integration', () => {
    it('should enforce horizontal/vertical connection constraints', () => {
      // Test the core constraint logic
      const result1 = validationService.validateConnection(
        'node1',
        'source',
        'node2',
        'target',
        'horizontal'
      );
      expect(result1.isValid).toBe(true);

      // Add the connection
      validationService.addConnection('node1', 'node2', 'horizontal');

      // Try to add a vertical connection - should be rejected
      const result2 = validationService.validateConnection(
        'node1',
        'source',
        'node3',
        'target',
        'vertical'
      );
      expect(result2.isValid).toBe(false);
      expect(result2.reason).toContain('already has horizontal connections');

      // But another horizontal connection should be allowed
      const result3 = validationService.validateConnection(
        'node1',
        'source',
        'node3',
        'target',
        'horizontal'
      );
      expect(result3.isValid).toBe(true);
    });

    it('should track connection counts correctly', () => {
      // Add multiple connections
      validationService.addConnection('node1', 'node2', 'horizontal');
      validationService.addConnection('node1', 'node3', 'horizontal');

      const status = validationService.getNodeConnectionStatus('node1');
      expect(status.horizontalConnections).toBe(2);
      expect(status.verticalConnections).toBe(0);
      expect(status.activeConnectionType).toBe('horizontal');

      // Remove one connection
      validationService.removeConnection('node1', 'node2', 'horizontal');

      const updatedStatus = validationService.getNodeConnectionStatus('node1');
      expect(updatedStatus.horizontalConnections).toBe(1);
      expect(updatedStatus.activeConnectionType).toBe('horizontal');
    });

    it('should enforce connection limits', () => {
      // Set a limit of 2 horizontal connections
      validationService.setNodeConnectionLimits('node1', 2, undefined);

      // Add maximum allowed connections
      validationService.addConnection('node1', 'node2', 'horizontal');
      validationService.addConnection('node1', 'node3', 'horizontal');

      // Try to add one more - should be rejected
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

    it('should reset constraints properly', () => {
      // Add connections and set limits
      validationService.addConnection('node1', 'node2', 'horizontal');
      validationService.setNodeConnectionLimits('node1', 1, 1);

      // Reset everything
      validationService.reset();

      // Should be able to add connections again
      const result = validationService.validateConnection(
        'node1',
        'source',
        'node2',
        'target',
        'vertical'
      );
      expect(result.isValid).toBe(true);

      const status = validationService.getNodeConnectionStatus('node1');
      expect(status.horizontalConnections).toBe(0);
      expect(status.verticalConnections).toBe(0);
      expect(status.activeConnectionType).toBeUndefined();
    });
  });

  describe('End-to-End Validation Workflow', () => {
    it('should demonstrate complete validation workflow', () => {
      // 1. Create validation service
      const service = new HandleValidationService();

      // 2. Validate first connection (should be allowed)
      const firstConnection = service.validateConnection(
        'functionA',
        'source',
        'functionB',
        'target',
        'horizontal'
      );
      expect(firstConnection.isValid).toBe(true);

      // 3. Add the connection
      service.addConnection('functionA', 'functionB', 'horizontal');

      // 4. Try to add a vertical connection (should be rejected)
      const verticalConnection = service.validateConnection(
        'functionA',
        'source',
        'functionC',
        'target',
        'vertical'
      );
      expect(verticalConnection.isValid).toBe(false);
      expect(verticalConnection.reason).toContain('already has horizontal connections');

      // 5. Add another horizontal connection (should be allowed)
      const secondHorizontal = service.validateConnection(
        'functionA',
        'source',
        'functionC',
        'target',
        'horizontal'
      );
      expect(secondHorizontal.isValid).toBe(true);

      service.addConnection('functionA', 'functionC', 'horizontal');

      // 6. Check final state
      const finalStatus = service.getNodeConnectionStatus('functionA');
      expect(finalStatus.horizontalConnections).toBe(2);
      expect(finalStatus.verticalConnections).toBe(0);
      expect(finalStatus.activeConnectionType).toBe('horizontal');

      // 7. Verify that functionA can still accept horizontal connections
      expect(service.canNodeAcceptConnection('functionA', 'horizontal', 'source')).toBe(true);
      expect(service.canNodeAcceptConnection('functionA', 'vertical', 'source')).toBe(false);
    });

    it('should handle connection removal and type switching', () => {
      const service = new HandleValidationService();

      // Add horizontal connections
      service.addConnection('node1', 'node2', 'horizontal');
      service.addConnection('node1', 'node3', 'horizontal');

      // Remove all horizontal connections
      service.removeConnection('node1', 'node2', 'horizontal');
      service.removeConnection('node1', 'node3', 'horizontal');

      // Should now be able to add vertical connections
      const verticalConnection = service.validateConnection(
        'node1',
        'source',
        'node2',
        'target',
        'vertical'
      );
      expect(verticalConnection.isValid).toBe(true);

      service.addConnection('node1', 'node2', 'vertical');

      const status = service.getNodeConnectionStatus('node1');
      expect(status.activeConnectionType).toBe('vertical');
      expect(status.horizontalConnections).toBe(0);
      expect(status.verticalConnections).toBe(1);
    });

    it('should demonstrate function call flow constraints', () => {
      const service = new HandleValidationService();

      // Simulate function call flow: functionA -> functionB -> functionC
      // All should be horizontal connections (function calls)
      
      // functionA calls functionB
      const call1 = service.validateConnection(
        'functionA',
        'source',
        'functionB',
        'target',
        'horizontal'
      );
      expect(call1.isValid).toBe(true);
      service.addConnection('functionA', 'functionB', 'horizontal');

      // functionB calls functionC
      const call2 = service.validateConnection(
        'functionB',
        'source',
        'functionC',
        'target',
        'horizontal'
      );
      expect(call2.isValid).toBe(true);
      service.addConnection('functionB', 'functionC', 'horizontal');

      // functionA also calls functionC directly
      const call3 = service.validateConnection(
        'functionA',
        'source',
        'functionC',
        'target',
        'horizontal'
      );
      expect(call3.isValid).toBe(true);
      service.addConnection('functionA', 'functionC', 'horizontal');

      // Verify all nodes have horizontal connections only
      const statusA = service.getNodeConnectionStatus('functionA');
      const statusB = service.getNodeConnectionStatus('functionB');
      const statusC = service.getNodeConnectionStatus('functionC');

      expect(statusA.activeConnectionType).toBe('horizontal');
      expect(statusB.activeConnectionType).toBe('horizontal');
      expect(statusC.activeConnectionType).toBe('horizontal');

      expect(statusA.horizontalConnections).toBe(2); // calls B and C
      expect(statusB.horizontalConnections).toBe(2); // called by A, calls C
      expect(statusC.horizontalConnections).toBe(2); // called by A and B
    });

    it('should demonstrate data flow constraints', () => {
      const service = new HandleValidationService();

      // Simulate data flow: dataA -> processB -> outputC
      // All should be vertical connections (data flow)
      
      // dataA flows to processB
      const flow1 = service.validateConnection(
        'dataA',
        'source',
        'processB',
        'target',
        'vertical'
      );
      expect(flow1.isValid).toBe(true);
      service.addConnection('dataA', 'processB', 'vertical');

      // processB outputs to outputC
      const flow2 = service.validateConnection(
        'processB',
        'source',
        'outputC',
        'target',
        'vertical'
      );
      expect(flow2.isValid).toBe(true);
      service.addConnection('processB', 'outputC', 'vertical');

      // Try to add a horizontal connection (function call) - should be rejected
      const invalidCall = service.validateConnection(
        'processB',
        'source',
        'helperFunction',
        'target',
        'horizontal'
      );
      expect(invalidCall.isValid).toBe(false);
      expect(invalidCall.reason).toContain('already has vertical connections');

      // Verify all nodes have vertical connections only
      const statusA = service.getNodeConnectionStatus('dataA');
      const statusB = service.getNodeConnectionStatus('processB');
      const statusC = service.getNodeConnectionStatus('outputC');

      expect(statusA.activeConnectionType).toBe('vertical');
      expect(statusB.activeConnectionType).toBe('vertical');
      expect(statusC.activeConnectionType).toBe('vertical');
    });

    it('should handle complex validation scenarios', () => {
      const service = new HandleValidationService();

      // Set different limits for different nodes
      service.setNodeConnectionLimits('hub', 5, 0); // Hub can have 5 horizontal, 0 vertical
      service.setNodeConnectionLimits('processor', 2, 3); // Processor can have 2 horizontal, 3 vertical
      service.setNodeConnectionLimits('endpoint', 1, 1); // Endpoint can have 1 of each

      // Test hub connections
      for (let i = 1; i <= 5; i++) {
        const result = service.validateConnection(
          'hub',
          'source',
          `node${i}`,
          'target',
          'horizontal'
        );
        expect(result.isValid).toBe(true);
        service.addConnection('hub', `node${i}`, 'horizontal');
      }

      // 6th connection should be rejected
      const overLimit = service.validateConnection(
        'hub',
        'source',
        'node6',
        'target',
        'horizontal'
      );
      expect(overLimit.isValid).toBe(false);
      expect(overLimit.reason).toContain('reached maximum horizontal connections (5)');

      // Vertical connection to hub should be rejected (already has horizontal connections)
      const verticalToHub = service.validateConnection(
        'external',
        'source',
        'hub',
        'target',
        'vertical'
      );
      expect(verticalToHub.isValid).toBe(false);
      expect(verticalToHub.reason).toContain('already has horizontal connections');

      // Test processor mixed connections
      service.addConnection('processor', 'output1', 'vertical');
      service.addConnection('processor', 'output2', 'vertical');

      // Should still be able to add horizontal connections
      const horizontalToProcessor = service.validateConnection(
        'processor',
        'source',
        'helper',
        'target',
        'horizontal'
      );
      expect(horizontalToProcessor.isValid).toBe(false); // Already has vertical connections
      expect(horizontalToProcessor.reason).toContain('already has vertical connections');
    });
  });
});