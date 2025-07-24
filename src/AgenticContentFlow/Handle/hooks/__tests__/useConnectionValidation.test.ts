import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConnectionValidation } from '../useConnectionValidation';
import { Node, Edge, Connection } from '@xyflow/react';

describe('useConnectionValidation', () => {
  const mockNodes: Node[] = [
    { id: 'node1', position: { x: 0, y: 0 }, data: {} },
    { id: 'node2', position: { x: 100, y: 0 }, data: {} },
    { id: 'node3', position: { x: 200, y: 0 }, data: {} }
  ];

  const mockEdges: Edge[] = [
    { id: 'edge1', source: 'node1', target: 'node2' }
  ];

  describe('Basic Hook Functionality', () => {
    it('should initialize without errors', () => {
      const { result } = renderHook(() => 
        useConnectionValidation(mockNodes, mockEdges)
      );

      expect(result.current).toBeDefined();
      expect(typeof result.current.validateConnection).toBe('function');
      expect(typeof result.current.onConnect).toBe('function');
      expect(typeof result.current.onConnectStart).toBe('function');
      expect(typeof result.current.onConnectEnd).toBe('function');
      expect(typeof result.current.isValidConnectionTarget).toBe('function');
      expect(typeof result.current.getConnectionFeedback).toBe('function');
    });

    it('should reject connections with missing source or target', () => {
      const { result } = renderHook(() => 
        useConnectionValidation(mockNodes, mockEdges)
      );

      const connection: Connection = {
        source: null,
        target: 'node2'
      };

      const validation = result.current.validateConnection(connection);
      expect(validation.isValid).toBe(false);
      expect(validation.reason).toContain('missing source or target');
    });

    it('should handle connection start and end', () => {
      const { result } = renderHook(() => 
        useConnectionValidation(mockNodes, mockEdges)
      );

      // Should not throw errors
      act(() => {
        result.current.onConnectStart(null as any, {
          nodeId: 'node1',
          handleId: 'handle1',
          handleType: 'source'
        });
      });

      act(() => {
        result.current.onConnectEnd();
      });

      expect(result.current.isValidConnectionTarget('node2', 'target')).toBe(true);
    });
  });

  describe('Connection Type Detection', () => {
    it('should detect vertical connections from handle IDs', () => {
      const { result } = renderHook(() => 
        useConnectionValidation(mockNodes, mockEdges)
      );

      const connection: Connection = {
        source: 'node1',
        target: 'node2',
        sourceHandle: 'vertical-source',
        targetHandle: 'vertical-target'
      };

      // Should not throw error
      const validation = result.current.validateConnection(connection);
      expect(validation).toBeDefined();
      expect(typeof validation.isValid).toBe('boolean');
    });

    it('should detect horizontal connections from handle IDs', () => {
      const { result } = renderHook(() => 
        useConnectionValidation(mockNodes, mockEdges)
      );

      const connection: Connection = {
        source: 'node1',
        target: 'node2',
        sourceHandle: 'horizontal-source',
        targetHandle: 'horizontal-target'
      };

      // Should not throw error
      const validation = result.current.validateConnection(connection);
      expect(validation).toBeDefined();
      expect(typeof validation.isValid).toBe('boolean');
    });

    it('should default to horizontal connections', () => {
      const { result } = renderHook(() => 
        useConnectionValidation(mockNodes, mockEdges)
      );

      const connection: Connection = {
        source: 'node1',
        target: 'node2',
        sourceHandle: 'some-handle',
        targetHandle: 'other-handle'
      };

      // Should not throw error
      const validation = result.current.validateConnection(connection);
      expect(validation).toBeDefined();
      expect(typeof validation.isValid).toBe('boolean');
    });
  });

  describe('Connection Validation', () => {
    it('should validate basic source to target connections', () => {
      const { result } = renderHook(() => 
        useConnectionValidation(mockNodes, mockEdges)
      );

      const connection: Connection = {
        source: 'node1',
        target: 'node2',
        sourceHandle: 'source',
        targetHandle: 'target'
      };

      const validation = result.current.validateConnection(connection);
      expect(validation.isValid).toBe(true);
    });

    it('should reject invalid handle type combinations', () => {
      const { result } = renderHook(() => 
        useConnectionValidation(mockNodes, mockEdges)
      );

      const connection: Connection = {
        source: 'node1',
        target: 'node2',
        sourceHandle: 'source',
        targetHandle: 'source' // Invalid: source to source
      };

      const validation = result.current.validateConnection(connection);
      expect(validation.isValid).toBe(false);
      expect(validation.reason).toContain('source handle to source handle');
    });

    it('should reject self-connections', () => {
      const { result } = renderHook(() => 
        useConnectionValidation(mockNodes, mockEdges)
      );

      const connection: Connection = {
        source: 'node1',
        target: 'node1', // Self-connection
        sourceHandle: 'source',
        targetHandle: 'target'
      };

      const validation = result.current.validateConnection(connection);
      expect(validation.isValid).toBe(false);
      expect(validation.reason).toContain('Cannot connect node to itself');
    });
  });

  describe('Connection Handling', () => {
    it('should call onValidConnection for valid connections', () => {
      let validConnectionCalled = false;
      const onValidConnection = () => { validConnectionCalled = true; };
      
      const { result } = renderHook(() => 
        useConnectionValidation(mockNodes, mockEdges, { onValidConnection })
      );

      const connection: Connection = {
        source: 'node1',
        target: 'node2',
        sourceHandle: 'source',
        targetHandle: 'target'
      };

      act(() => {
        result.current.onConnect(connection);
      });

      expect(validConnectionCalled).toBe(true);
    });

    it('should call onInvalidConnection for invalid connections', () => {
      let invalidConnectionCalled = false;
      let invalidReason = '';
      const onInvalidConnection = (conn: Connection, reason: string) => { 
        invalidConnectionCalled = true;
        invalidReason = reason;
      };
      
      const { result } = renderHook(() => 
        useConnectionValidation(mockNodes, mockEdges, { onInvalidConnection })
      );

      const connection: Connection = {
        source: 'node1',
        target: 'node1', // Self-connection (invalid)
        sourceHandle: 'source',
        targetHandle: 'target'
      };

      act(() => {
        result.current.onConnect(connection);
      });

      expect(invalidConnectionCalled).toBe(true);
      expect(invalidReason).toContain('Cannot connect node to itself');
    });
  });

  describe('Connection Constraints', () => {
    it('should enforce connection type constraints', () => {
      const { result } = renderHook(() => 
        useConnectionValidation(mockNodes, mockEdges)
      );

      // First connection should be allowed
      const firstConnection: Connection = {
        source: 'node1',
        target: 'node2',
        sourceHandle: 'horizontal-source',
        targetHandle: 'horizontal-target'
      };

      act(() => {
        result.current.onConnect(firstConnection);
      });

      // Second connection of different type should be rejected
      const secondConnection: Connection = {
        source: 'node1',
        target: 'node3',
        sourceHandle: 'vertical-source',
        targetHandle: 'vertical-target'
      };

      const validation = result.current.validateConnection(secondConnection);
      expect(validation.isValid).toBe(false);
      expect(validation.reason).toContain('already has horizontal connections');
    });

    it('should allow multiple connections of the same type', () => {
      const { result } = renderHook(() => 
        useConnectionValidation(mockNodes, mockEdges)
      );

      // First horizontal connection
      const firstConnection: Connection = {
        source: 'node1',
        target: 'node2',
        sourceHandle: 'horizontal-source',
        targetHandle: 'horizontal-target'
      };

      act(() => {
        result.current.onConnect(firstConnection);
      });

      // Second horizontal connection should be allowed
      const secondConnection: Connection = {
        source: 'node1',
        target: 'node3',
        sourceHandle: 'horizontal-source',
        targetHandle: 'horizontal-target'
      };

      const validation = result.current.validateConnection(secondConnection);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Connection Target Validation', () => {
    it('should return true when no connection is active', () => {
      const { result } = renderHook(() => 
        useConnectionValidation(mockNodes, mockEdges)
      );

      const isValid = result.current.isValidConnectionTarget('node2', 'target');
      expect(isValid).toBe(true);
    });

    it('should validate connection targets during drag', () => {
      const { result } = renderHook(() => 
        useConnectionValidation(mockNodes, mockEdges)
      );

      // Start a connection
      act(() => {
        result.current.onConnectStart(null as any, {
          nodeId: 'node1',
          handleId: 'source',
          handleType: 'source'
        });
      });

      // Valid target should return true
      const isValid = result.current.isValidConnectionTarget('node2', 'target');
      expect(isValid).toBe(true);

      // Invalid target (same node) should return false
      const isSelfValid = result.current.isValidConnectionTarget('node1', 'target');
      expect(isSelfValid).toBe(false);
    });
  });

  describe('Connection Feedback', () => {
    it('should provide feedback for nodes with active connections', () => {
      const { result } = renderHook(() => 
        useConnectionValidation(mockNodes, mockEdges)
      );

      // Add a horizontal connection
      const connection: Connection = {
        source: 'node1',
        target: 'node2',
        sourceHandle: 'horizontal-source',
        targetHandle: 'horizontal-target'
      };

      act(() => {
        result.current.onConnect(connection);
      });

      const feedback = result.current.getConnectionFeedback('node1');
      expect(feedback).toContain('horizontal connections only');
    });

    it('should return null for nodes without active connections', () => {
      const { result } = renderHook(() => 
        useConnectionValidation(mockNodes, []) // No existing edges
      );

      const feedback = result.current.getConnectionFeedback('node1');
      expect(feedback).toBeNull();
    });
  });
});