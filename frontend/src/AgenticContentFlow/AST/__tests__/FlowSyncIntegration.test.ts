import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { FlowGenerator } from '../services/FlowGenerator';
import { flowSyncService } from '../services/FlowSyncService';
import { useCodeStore } from '../../../stores/codeStore';

describe('Flow Synchronization Integration', () => {
  let flowGenerator: FlowGenerator;

  beforeEach(() => {
    flowGenerator = new FlowGenerator();
    // Clear the code store before each test
    useCodeStore.getState().clearAll();
  });

  it('should synchronize flow when function code is updated', async () => {
    // Read the test file
    const testFilePath = path.join(process.cwd(), 'stringStatsStandard.js');
    const originalCode = fs.readFileSync(testFilePath, 'utf8');

    // Generate initial flow
    const initialFlow = flowGenerator.generateFlow(originalCode, 'stringStatsStandard.js');
    
    // Find the sanitizeString function node
    const sanitizeStringNode = initialFlow.nodes.find(n => 
      n.type === 'functionnode' && n.data.functionName === 'sanitizeString'
    );
    expect(sanitizeStringNode).toBeDefined();

    // Check initial edges - should have edges TO sanitizeString
    const initialEdgesToSanitize = initialFlow.edges.filter(e => e.target === sanitizeStringNode!.id);
    expect(initialEdgesToSanitize.length).toBeGreaterThan(0);

    // Mock callback to capture flow updates
    const mockCallback = vi.fn();
    const unsubscribe = flowSyncService.onFlowUpdate(mockCallback);

    try {
      // Modify the sanitizeString function to remove the log call
      const modifiedFunctionCode = `
/**
 * @title sanitizeString
 * @description Removes punctuation and converts a string to lowercase.
 * @param {string} str - The input string to sanitize.
 * @returns {string} - The sanitized string.
 */
function sanitizeString(str) {
  const result = str.replace(/[^\\w\\s]|_/g, '').toLowerCase().trim();
  // Removed the log call - this should remove a child node
  return result;
}`;

      // Update the function code and sync
      const success = await flowSyncService.updateFunctionCodeAndSync(
        sanitizeStringNode!.id,
        modifiedFunctionCode,
        'stringStatsStandard.js',
        initialFlow.nodes,
        initialFlow.edges
      );

      expect(success).toBe(true);
      expect(mockCallback).toHaveBeenCalled();

      // Get the updated flow from the callback
      const [updatedNodes, updatedEdges] = mockCallback.mock.calls[0];

      // Verify that the sanitizeString function still exists
      const updatedSanitizeStringNode = updatedNodes.find((n: any) => 
        n.type === 'functionnode' && n.data.functionName === 'sanitizeString'
      );
      expect(updatedSanitizeStringNode).toBeDefined();

      // Verify that edges TO sanitizeString are preserved
      const updatedEdgesToSanitize = updatedEdges.filter((e: any) => e.target === updatedSanitizeStringNode.id);
      expect(updatedEdgesToSanitize.length).toBe(initialEdgesToSanitize.length);

      // Verify that child nodes for sanitizeString are updated (should have fewer due to removed log call)
      const initialChildNodes = initialFlow.nodes.filter(n => 
        n.type === 'childnode' && n.parentId === sanitizeStringNode!.id
      );
      const updatedChildNodes = updatedNodes.filter((n: any) => 
        n.type === 'childnode' && n.parentId === updatedSanitizeStringNode.id
      );

      // Should have one less child node (the log call was removed)
      expect(updatedChildNodes.length).toBe(initialChildNodes.length - 1);

      console.log('✅ Flow sync test results:', {
        initialChildNodes: initialChildNodes.length,
        updatedChildNodes: updatedChildNodes.length,
        initialEdges: initialFlow.edges.length,
        updatedEdges: updatedEdges.length
      });

    } finally {
      unsubscribe();
    }
  });

  it('should synchronize flow when function calls are added', async () => {
    // Create a simple test code
    const testCode = `
function functionA() {
  return 'A';
}

function functionB() {
  return 'B';
}
`;

    // Generate initial flow
    const initialFlow = flowGenerator.generateFlow(testCode, 'test.js');
    
    // Should have no edges initially (no function calls)
    expect(initialFlow.edges.length).toBe(0);

    // Find functionB node
    const functionBNode = initialFlow.nodes.find(n => 
      n.type === 'functionnode' && n.data.functionName === 'functionB'
    );
    expect(functionBNode).toBeDefined();

    // Mock callback to capture flow updates
    const mockCallback = vi.fn();
    const unsubscribe = flowSyncService.onFlowUpdate(mockCallback);

    try {
      // Modify functionB to call functionA
      const modifiedFunctionCode = `
function functionB() {
  const result = functionA(); // Added function call
  return result + 'B';
}`;

      // Update the function code and sync
      const success = await flowSyncService.updateFunctionCodeAndSync(
        functionBNode!.id,
        modifiedFunctionCode,
        'test.js',
        initialFlow.nodes,
        initialFlow.edges
      );

      expect(success).toBe(true);
      expect(mockCallback).toHaveBeenCalled();

      // Get the updated flow from the callback
      const [updatedNodes, updatedEdges] = mockCallback.mock.calls[0];

      // Should now have an edge from functionB to functionA
      expect(updatedEdges.length).toBe(1);
      
      const newEdge = updatedEdges[0];
      const sourceFunctionNode = updatedNodes.find((n: any) => n.id === newEdge.source);
      const targetFunctionNode = updatedNodes.find((n: any) => n.id === newEdge.target);
      
      expect(sourceFunctionNode?.data?.functionName).toBe('functionB');
      expect(targetFunctionNode?.data?.functionName).toBe('functionA');

      console.log('✅ Function call addition test results:', {
        initialEdges: initialFlow.edges.length,
        updatedEdges: updatedEdges.length,
        newEdgeSource: sourceFunctionNode?.data?.functionName,
        newEdgeTarget: targetFunctionNode?.data?.functionName
      });

    } finally {
      unsubscribe();
    }
  });

  it('should preserve node positions and UI state during sync', async () => {
    // Read the test file
    const testFilePath = path.join(process.cwd(), 'stringStatsStandard.js');
    const originalCode = fs.readFileSync(testFilePath, 'utf8');

    // Generate initial flow
    const initialFlow = flowGenerator.generateFlow(originalCode, 'stringStatsStandard.js');
    
    // Modify node positions and UI state
    const modifiedNodes = initialFlow.nodes.map(node => ({
      ...node,
      position: { x: node.position.x + 100, y: node.position.y + 50 },
      selected: true,
      width: 500,
      height: 300,
      data: {
        ...node.data,
        expanded: true
      }
    }));

    // Find a function node to modify
    const functionNode = modifiedNodes.find(n => n.type === 'functionnode');
    expect(functionNode).toBeDefined();

    // Mock callback to capture flow updates
    const mockCallback = vi.fn();
    const unsubscribe = flowSyncService.onFlowUpdate(mockCallback);

    try {
      // Update function code (minor change)
      const modifiedFunctionCode = `
/**
 * @title ${functionNode!.data.functionName}
 * @description Modified function for testing
 */
function ${functionNode!.data.functionName}() {
  // Modified function
  return 'test';
}`;

      // Update with modified nodes to test position preservation
      const success = await flowSyncService.updateFunctionCodeAndSync(
        functionNode!.id,
        modifiedFunctionCode,
        'stringStatsStandard.js',
        modifiedNodes,
        initialFlow.edges
      );

      expect(success).toBe(true);
      expect(mockCallback).toHaveBeenCalled();

      // Get the updated flow from the callback
      const [updatedNodes] = mockCallback.mock.calls[0];

      // Find the updated function node
      const updatedFunctionNode = updatedNodes.find((n: any) => 
        n.data.functionName === functionNode!.data.functionName
      );

      // Verify that position and UI state are preserved
      expect(updatedFunctionNode.position).toEqual({ x: 250, y: 130 }); // 150 + 100, 80 + 50
      expect(updatedFunctionNode.selected).toBe(true);
      expect(updatedFunctionNode.width).toBe(500);
      expect(updatedFunctionNode.height).toBe(300);
      expect(updatedFunctionNode.data.expanded).toBe(true);

      console.log('✅ Position preservation test results:', {
        originalPosition: functionNode!.position,
        modifiedPosition: { x: functionNode!.position.x + 100, y: functionNode!.position.y + 50 },
        updatedPosition: updatedFunctionNode.position,
        preservedUIState: {
          selected: updatedFunctionNode.selected,
          width: updatedFunctionNode.width,
          height: updatedFunctionNode.height,
          expanded: updatedFunctionNode.data.expanded
        }
      });

    } finally {
      unsubscribe();
    }
  });
});