import React, { useCallback, useRef } from 'react';
import { Connection, Edge, Node, OnConnect, OnConnectStart, OnConnectEnd } from '@xyflow/react';
import { handleValidationService, ConnectionValidationResult } from '../validation/HandleValidationService';

/**
 * Connection validation hook that integrates with React Flow
 */
export interface UseConnectionValidationOptions {
  onValidConnection?: (connection: Connection) => void;
  onInvalidConnection?: (connection: Connection, reason: string) => void;
  showValidationFeedback?: boolean;
}

export interface ConnectionValidationHook {
  validateConnection: (connection: Connection) => ConnectionValidationResult;
  onConnect: OnConnect;
  onConnectStart: OnConnectStart;
  onConnectEnd: OnConnectEnd;
  isValidConnectionTarget: (nodeId: string, handleType: string) => boolean;
  getConnectionFeedback: (nodeId: string) => string | null;
}

export function useConnectionValidation(
  nodes: Node[],
  edges: Edge[],
  options: UseConnectionValidationOptions = {}
): ConnectionValidationHook {
  const connectionStartRef = useRef<{
    nodeId: string | null;
    handleType: string | null;
    handleId: string | null;
  }>({ nodeId: null, handleType: null, handleId: null });

  /**
   * Determine connection type based on handle positions or IDs
   */
  const determineConnectionType = useCallback((
    sourceNodeId: string,
    targetNodeId: string,
    sourceHandleId?: string | null,
    targetHandleId?: string | null
  ): 'horizontal' | 'vertical' => {
    // Default logic - can be enhanced based on handle IDs or node positions
    // For now, assume horizontal connections are for function calls
    // and vertical connections are for data flow
    
    if (sourceHandleId?.includes('vertical') || targetHandleId?.includes('vertical')) {
      return 'vertical';
    }
    
    if (sourceHandleId?.includes('horizontal') || targetHandleId?.includes('horizontal')) {
      return 'horizontal';
    }

    // Default to horizontal for function calls
    return 'horizontal';
  }, []);

  /**
   * Validate a connection attempt
   */
  const validateConnection = useCallback((connection: Connection): ConnectionValidationResult => {
    if (!connection.source || !connection.target) {
      return {
        isValid: false,
        reason: 'Invalid connection: missing source or target'
      };
    }

    const connectionType = determineConnectionType(
      connection.source,
      connection.target,
      connection.sourceHandle,
      connection.targetHandle
    );

    // Determine handle types (default to source/target if not specified)
    const sourceHandleType = connection.sourceHandle?.includes('target') ? 'target' : 'source';
    const targetHandleType = connection.targetHandle?.includes('source') ? 'source' : 'target';

    return handleValidationService.validateConnection(
      connection.source,
      sourceHandleType,
      connection.target,
      targetHandleType,
      connectionType
    );
  }, [determineConnectionType]);

  /**
   * Handle connection attempts
   */
  const onConnect: OnConnect = useCallback((connection) => {
    const validation = validateConnection(connection);
    
    if (validation.isValid) {
      // Update validation service with new connection
      const connectionType = determineConnectionType(
        connection.source!,
        connection.target!,
        connection.sourceHandle,
        connection.targetHandle
      );
      
      handleValidationService.addConnection(
        connection.source!,
        connection.target!,
        connectionType
      );

      options.onValidConnection?.(connection);
    } else {
      options.onInvalidConnection?.(connection, validation.reason || 'Invalid connection');
      
      if (options.showValidationFeedback) {
        console.warn('Connection rejected:', validation.reason);
      }
    }
  }, [validateConnection, determineConnectionType, options]);

  /**
   * Handle connection start
   */
  const onConnectStart: OnConnectStart = useCallback((_, { nodeId, handleId, handleType }) => {
    connectionStartRef.current = {
      nodeId: nodeId || null,
      handleType: handleType || null,
      handleId: handleId || null
    };
  }, []);

  /**
   * Handle connection end
   */
  const onConnectEnd: OnConnectEnd = useCallback(() => {
    connectionStartRef.current = {
      nodeId: null,
      handleType: null,
      handleId: null
    };
  }, []);

  /**
   * Check if a node can accept a connection as target
   */
  const isValidConnectionTarget = useCallback((nodeId: string, handleType: string): boolean => {
    const startInfo = connectionStartRef.current;
    
    if (!startInfo.nodeId || !startInfo.handleType) {
      return true; // No active connection
    }

    // Create mock connection to validate
    const mockConnection: Connection = {
      source: startInfo.nodeId,
      target: nodeId,
      sourceHandle: startInfo.handleId,
      targetHandle: handleType
    };

    const validation = validateConnection(mockConnection);
    return validation.isValid;
  }, [validateConnection]);

  /**
   * Get validation feedback for a node
   */
  const getConnectionFeedback = useCallback((nodeId: string): string | null => {
    const constraint = handleValidationService.getNodeConnectionStatus(nodeId);
    
    if (constraint.activeConnectionType) {
      return `Node accepts ${constraint.activeConnectionType} connections only`;
    }
    
    return null;
  }, []);

  // Sync existing edges with validation service
  React.useEffect(() => {
    handleValidationService.reset();
    
    edges.forEach(edge => {
      if (edge.source && edge.target) {
        const connectionType = determineConnectionType(
          edge.source,
          edge.target,
          edge.sourceHandle,
          edge.targetHandle
        );
        
        handleValidationService.addConnection(
          edge.source,
          edge.target,
          connectionType
        );
      }
    });
  }, [edges, determineConnectionType]);

  return {
    validateConnection,
    onConnect,
    onConnectStart,
    onConnectEnd,
    isValidConnectionTarget,
    getConnectionFeedback
  };
}

// Re-export for convenience
export { handleValidationService };