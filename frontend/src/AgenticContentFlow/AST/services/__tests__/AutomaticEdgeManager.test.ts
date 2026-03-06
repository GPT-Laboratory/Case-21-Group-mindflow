import { describe, it, expect, beforeEach } from 'vitest';
import { Edge } from '@xyflow/react';
import { AutomaticEdgeManager } from '../AutomaticEdgeManager';
import { FunctionCall, FunctionMetadata } from '../../types/ASTTypes';

describe('AutomaticEdgeManager', () => {
  let edgeManager: AutomaticEdgeManager;
  let mockFunctions: FunctionMetadata[];
  let mockFunctionCalls: FunctionCall[];

  beforeEach(() => {
    edgeManager = new AutomaticEdgeManager();
    
    // Setup mock functions
    mockFunctions = [
      {
        id: 'func1',
        name: 'functionA',
        description: 'Function A',
        parameters: [],
        sourceLocation: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } },
        isNested: false,
        scope: 'function',
        code: 'function functionA() { functionB(); }'
      },
      {
        id: 'func2',
        name: 'functionB',
        description: 'Function B',
        parameters: [],
        sourceLocation: { start: { line: 6, column: 0 }, end: { line: 10, column: 0 } },
        isNested: false,
        scope: 'function',
        code: 'function functionB() { return "B"; }'
      },
      {
        id: 'func3',
        name: 'functionC',
        description: 'Function C',
        parameters: [],
        sourceLocation: { start: { line: 11, column: 0 }, end: { line: 15, column: 0 } },
        isNested: false,
        scope: 'function',
        code: 'function functionC() { functionA(); functionB(); }'
      }
    ];

    // Setup mock function calls
    mockFunctionCalls = [
      {
        id: 'call1',
        callerFunction: 'functionA',
        calledFunction: 'functionB',
        sourceLocation: { start: { line: 2, column: 2 }, end: { line: 2, column: 13 } },
        isExternal: false
      },
      {
        id: 'call2',
        callerFunction: 'functionC',
        calledFunction: 'functionA',
        sourceLocation: { start: { line: 12, column: 2 }, end: { line: 12, column: 13 } },
        isExternal: false
      },
      {
        id: 'call3',
        callerFunction: 'functionC',
        calledFunction: 'functionB',
        sourceLocation: { start: { line: 12, column: 15 }, end: { line: 12, column: 26 } },
        isExternal: false
      }
    ];
  });

  describe('createEdgesFromFunctionCalls', () => {
    it('should create edges for valid function calls', () => {
      const result = edgeManager.createEdgesFromFunctionCalls(
        mockFunctionCalls,
        mockFunctions
      );

      expect(result.createdEdges).toHaveLength(3);
      expect(result.edges).toHaveLength(3);
      expect(result.skippedCalls).toHaveLength(0);

      // Check first edge (functionA -> functionB)
      const edge1 = result.createdEdges.find(e => e.source === 'func1' && e.target === 'func2');
      expect(edge1).toBeDefined();
      expect(edge1?.id).toBe('edge-func1-func2');
      expect(edge1?.data?.sourceFunction).toBe('functionA');
      expect(edge1?.data?.targetFunction).toBe('functionB');
    });

    it('should skip external function calls', () => {
      const externalCall: FunctionCall = {
        id: 'external1',
        callerFunction: 'functionA',
        calledFunction: 'externalFunction',
        sourceLocation: { start: { line: 3, column: 2 }, end: { line: 3, column: 18 } },
        isExternal: true
      };

      const result = edgeManager.createEdgesFromFunctionCalls(
        [externalCall],
        mockFunctions
      );

      expect(result.createdEdges).toHaveLength(0);
      expect(result.skippedCalls).toHaveLength(1);
      expect(result.skippedCalls[0]).toBe(externalCall);
    });

    it('should enforce single edge rule - skip duplicate edges', () => {
      const existingEdge: Edge = {
        id: 'existing-edge',
        source: 'func1',
        target: 'func2',
        type: 'default'
      };

      const result = edgeManager.createEdgesFromFunctionCalls(
        mockFunctionCalls,
        mockFunctions,
        [existingEdge]
      );

      // Should skip the call that would create func1->func2 edge
      expect(result.createdEdges).toHaveLength(2); // Only 2 new edges created
      expect(result.edges).toHaveLength(3); // 1 existing + 2 new
      expect(result.skippedCalls).toHaveLength(1);
      
      // Verify the skipped call is the duplicate one
      const skippedCall = result.skippedCalls[0];
      expect(skippedCall.callerFunction).toBe('functionA');
      expect(skippedCall.calledFunction).toBe('functionB');
    });

    it('should handle multiple calls to same function with single edge', () => {
      const duplicateCall: FunctionCall = {
        id: 'call4',
        callerFunction: 'functionA',
        calledFunction: 'functionB',
        sourceLocation: { start: { line: 3, column: 2 }, end: { line: 3, column: 13 } },
        isExternal: false
      };

      const callsWithDuplicate = [...mockFunctionCalls, duplicateCall];
      
      const result = edgeManager.createEdgesFromFunctionCalls(
        callsWithDuplicate,
        mockFunctions
      );

      // Should still only create 3 edges (single edge rule)
      expect(result.createdEdges).toHaveLength(3);
      expect(result.skippedCalls).toHaveLength(1);
      expect(result.skippedCalls[0]).toBe(duplicateCall);
    });

    it('should apply custom edge options', () => {
      const options = {
        edgeType: 'custom',
        animated: true,
        style: { stroke: 'red' }
      };

      const result = edgeManager.createEdgesFromFunctionCalls(
        [mockFunctionCalls[0]],
        mockFunctions,
        [],
        options
      );

      const edge = result.createdEdges[0];
      expect(edge.type).toBe('custom');
      expect(edge.animated).toBe(true);
      expect(edge.style).toEqual({ stroke: 'red' });
    });
  });

  describe('createEdgesFromCode', () => {
    it('should parse code and create edges', () => {
      const code = `
        function functionA() {
          functionB();
        }
        
        function functionB() {
          return "B";
        }
      `;

      const result = edgeManager.createEdgesFromCode(code);

      expect(result.createdEdges.length).toBeGreaterThan(0);
      expect(result.edges.length).toBeGreaterThan(0);
    });

    it('should handle parsing errors gracefully', () => {
      const invalidCode = 'function invalid() { syntax error }';

      const result = edgeManager.createEdgesFromCode(invalidCode);

      expect(result.edges).toHaveLength(0);
      expect(result.createdEdges).toHaveLength(0);
      expect(result.skippedCalls).toHaveLength(0);
    });
  });

  describe('removeObsoleteEdges', () => {
    it('should remove edges that no longer have corresponding function calls', () => {
      const existingEdges: Edge[] = [
        {
          id: 'edge1',
          source: 'func1',
          target: 'func2',
          data: { functionCall: mockFunctionCalls[0] }
        },
        {
          id: 'edge2',
          source: 'func3',
          target: 'func1',
          data: { functionCall: mockFunctionCalls[1] }
        },
        {
          id: 'manual-edge',
          source: 'func1',
          target: 'func3',
          // No functionCall data - this is a manual edge
        }
      ];

      // Only provide the first function call
      const currentCalls = [mockFunctionCalls[0]];

      const result = edgeManager.removeObsoleteEdges(
        currentCalls,
        mockFunctions,
        existingEdges
      );

      expect(result.remainingEdges).toHaveLength(2); // edge1 + manual-edge
      expect(result.removedEdges).toHaveLength(1); // edge2
      expect(result.removedEdges[0].id).toBe('edge2');
    });

    it('should preserve manually created edges', () => {
      const manualEdge: Edge = {
        id: 'manual-edge',
        source: 'func1',
        target: 'func2',
        // No functionCall data
      };

      const result = edgeManager.removeObsoleteEdges(
        [], // No function calls
        mockFunctions,
        [manualEdge]
      );

      expect(result.remainingEdges).toHaveLength(1);
      expect(result.remainingEdges[0]).toBe(manualEdge);
      expect(result.removedEdges).toHaveLength(0);
    });
  });

  describe('synchronizeEdgesWithCode', () => {
    it('should create new edges and remove obsolete ones', () => {
      const code = `
        function functionA() {
          functionB();
        }
        
        function functionB() {
          return "B";
        }
      `;

      const obsoleteEdge: Edge = {
        id: 'obsolete',
        source: 'func1',
        target: 'func3',
        data: { functionCall: { callerFunction: 'functionA', calledFunction: 'functionC' } }
      };

      const result = edgeManager.synchronizeEdgesWithCode(code, [obsoleteEdge]);

      expect(result.removedEdges).toHaveLength(1);
      expect(result.createdEdges.length).toBeGreaterThan(0);
    });
  });

  describe('validateEdgeCreation', () => {
    it('should validate edge creation between functions', () => {
      const result = edgeManager.validateEdgeCreation(
        mockFunctions[0],
        mockFunctions[1],
        []
      );

      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should reject duplicate edges', () => {
      const existingEdge: Edge = {
        id: 'existing',
        source: 'func1',
        target: 'func2'
      };

      const result = edgeManager.validateEdgeCreation(
        mockFunctions[0],
        mockFunctions[1],
        [existingEdge]
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Edge already exists between these functions');
    });

    it('should reject self-loops', () => {
      const result = edgeManager.validateEdgeCreation(
        mockFunctions[0],
        mockFunctions[0],
        []
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Cannot create edge from function to itself');
    });
  });

  describe('getFunctionCallsForEdge', () => {
    it('should return function calls between specific functions', () => {
      const calls = edgeManager.getFunctionCallsForEdge(
        mockFunctions[0], // functionA
        mockFunctions[1], // functionB
        mockFunctionCalls
      );

      expect(calls).toHaveLength(1);
      expect(calls[0].callerFunction).toBe('functionA');
      expect(calls[0].calledFunction).toBe('functionB');
    });

    it('should return empty array when no calls exist', () => {
      const calls = edgeManager.getFunctionCallsForEdge(
        mockFunctions[1], // functionB
        mockFunctions[0], // functionA
        mockFunctionCalls
      );

      expect(calls).toHaveLength(0);
    });
  });

  describe('validateManualEdge', () => {
    it('should validate manual edge creation', () => {
      const edge: Edge = {
        id: 'manual-edge',
        source: 'func1',
        target: 'func2'
      };

      const result = edgeManager.validateManualEdge(edge, mockFunctions, []);

      expect(result.valid).toBe(true);
      expect(result.sourceFunction).toBe(mockFunctions[0]);
      expect(result.targetFunction).toBe(mockFunctions[1]);
    });

    it('should reject edge with invalid source function', () => {
      const edge: Edge = {
        id: 'invalid-edge',
        source: 'invalid-id',
        target: 'func2'
      };

      const result = edgeManager.validateManualEdge(edge, mockFunctions, []);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Source function with id 'invalid-id' not found");
    });

    it('should reject edge with invalid target function', () => {
      const edge: Edge = {
        id: 'invalid-edge',
        source: 'func1',
        target: 'invalid-id'
      };

      const result = edgeManager.validateManualEdge(edge, mockFunctions, []);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Target function with id 'invalid-id' not found");
    });

    it('should reject duplicate edges', () => {
      const existingEdge: Edge = {
        id: 'existing',
        source: 'func1',
        target: 'func2'
      };

      const newEdge: Edge = {
        id: 'duplicate',
        source: 'func1',
        target: 'func2'
      };

      const result = edgeManager.validateManualEdge(newEdge, mockFunctions, [existingEdge]);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Edge already exists between these functions');
    });
  });

  describe('addFunctionCallToCode', () => {
    it('should add function call to source function', () => {
      const code = `
function functionA() {
  console.log("A");
}

function functionB() {
  return "B";
}
      `.trim();

      const result = edgeManager.addFunctionCallToCode(
        code,
        mockFunctions[0], // functionA
        mockFunctions[1]  // functionB
      );

      expect(result.validationErrors).toHaveLength(0);
      expect(result.addedCalls).toHaveLength(1);
      expect(result.addedCalls[0].callerFunction).toBe('functionA');
      expect(result.addedCalls[0].calledFunction).toBe('functionB');
      expect(result.updatedCode).toContain('functionB();');
      
      // Verify the function call was added in the right place
      const lines = result.updatedCode.split('\n');
      const functionAEndIndex = lines.findIndex(line => line.trim() === '}');
      const functionCallIndex = lines.findIndex(line => line.includes('functionB();'));
      expect(functionCallIndex).toBeLessThan(functionAEndIndex);
      expect(functionCallIndex).toBeGreaterThan(0);
    });

    it('should handle function with existing content', () => {
      const code = `
function functionA() {
  const x = 1;
  console.log("A", x);
  return x;
}

function functionB() {
  return "B";
}
      `.trim();

      const result = edgeManager.addFunctionCallToCode(
        code,
        mockFunctions[0], // functionA
        mockFunctions[1]  // functionB
      );

      expect(result.validationErrors).toHaveLength(0);
      expect(result.updatedCode).toContain('functionB();');
      
      // Verify proper indentation
      const lines = result.updatedCode.split('\n');
      const functionCallLine = lines.find(line => line.includes('functionB();'));
      expect(functionCallLine).toMatch(/^\s+functionB\(\);$/);
    });

    it('should reject adding duplicate function call', () => {
      const code = `
function functionA() {
  functionB();
  console.log("A");
}

function functionB() {
  return "B";
}
      `.trim();

      const result = edgeManager.addFunctionCallToCode(
        code,
        mockFunctions[0], // functionA
        mockFunctions[1]  // functionB
      );

      expect(result.validationErrors).toHaveLength(1);
      expect(result.validationErrors[0]).toContain('already exists');
      expect(result.addedCalls).toHaveLength(0);
      expect(result.updatedCode).toBe(code); // No changes
    });

    it('should handle missing source function', () => {
      const code = `
function functionB() {
  return "B";
}
      `.trim();

      const result = edgeManager.addFunctionCallToCode(
        code,
        mockFunctions[0], // functionA (not in code)
        mockFunctions[1]  // functionB
      );

      expect(result.validationErrors).toHaveLength(1);
      expect(result.validationErrors[0]).toContain('not found in code');
      expect(result.addedCalls).toHaveLength(0);
      expect(result.updatedCode).toBe(code);
    });

    it('should handle parsing errors gracefully', () => {
      const invalidCode = 'function invalid() { syntax error }';

      const result = edgeManager.addFunctionCallToCode(
        invalidCode,
        mockFunctions[0],
        mockFunctions[1]
      );

      expect(result.validationErrors.length).toBeGreaterThan(0);
      expect(result.validationErrors[0]).toContain('Failed to parse');
      expect(result.addedCalls).toHaveLength(0);
      expect(result.updatedCode).toBe(invalidCode);
    });
  });

  describe('synchronizeManualEdgesWithCode', () => {
    it('should add function calls for manual edges', () => {
      const code = `
function functionA() {
  console.log("A");
}

function functionB() {
  return "B";
}

function functionC() {
  return "C";
}
      `.trim();

      const manualEdges: Edge[] = [
        {
          id: 'manual1',
          source: 'func1', // functionA
          target: 'func2'  // functionB
        },
        {
          id: 'manual2',
          source: 'func2', // functionB
          target: 'func3'  // functionC
        }
      ];

      const result = edgeManager.synchronizeManualEdgesWithCode(
        code,
        manualEdges,
        mockFunctions
      );

      expect(result.validationErrors).toHaveLength(0);
      expect(result.addedCalls).toHaveLength(2);
      expect(result.updatedCode).toContain('functionB();');
      expect(result.updatedCode).toContain('functionC();');
    });

    it('should skip edges that already have function calls', () => {
      const code = `
function functionA() {
  console.log("A");
}

function functionB() {
  return "B";
}
      `.trim();

      const edgesWithFunctionCall: Edge[] = [
        {
          id: 'existing',
          source: 'func1',
          target: 'func2',
          data: { functionCall: mockFunctionCalls[0] } // Already has function call
        }
      ];

      const result = edgeManager.synchronizeManualEdgesWithCode(
        code,
        edgesWithFunctionCall,
        mockFunctions
      );

      expect(result.validationErrors).toHaveLength(0);
      expect(result.addedCalls).toHaveLength(0);
      expect(result.updatedCode).toBe(code); // No changes
    });

    it('should handle invalid edges gracefully', () => {
      const code = `
function functionA() {
  console.log("A");
}
      `.trim();

      const invalidEdges: Edge[] = [
        {
          id: 'invalid',
          source: 'invalid-id',
          target: 'func1'
        }
      ];

      const result = edgeManager.synchronizeManualEdgesWithCode(
        code,
        invalidEdges,
        mockFunctions
      );

      expect(result.validationErrors.length).toBeGreaterThan(0);
      expect(result.addedCalls).toHaveLength(0);
      expect(result.updatedCode).toBe(code);
    });
  });

  describe('removeFunctionCallFromCode', () => {
    it('should remove function call from source function', () => {
      const code = `
function functionA() {
  console.log("A");
  functionB();
  return "A";
}

function functionB() {
  return "B";
}
      `.trim();

      const result = edgeManager.removeFunctionCallFromCode(
        code,
        mockFunctions[0], // functionA
        mockFunctions[1]  // functionB
      );

      expect(result.validationErrors).toHaveLength(0);
      expect(result.addedCalls).toHaveLength(1); // Contains removed calls
      expect(result.addedCalls[0].callerFunction).toBe('functionA');
      expect(result.addedCalls[0].calledFunction).toBe('functionB');
      expect(result.updatedCode).not.toContain('functionB();');
      
      // Verify other content remains
      expect(result.updatedCode).toContain('console.log("A");');
      expect(result.updatedCode).toContain('return "A";');
    });

    it('should handle multiple function calls to same function', () => {
      const code = `
function functionA() {
  functionB();
  console.log("middle");
  functionB();
}

function functionB() {
  return "B";
}
      `.trim();

      const result = edgeManager.removeFunctionCallFromCode(
        code,
        mockFunctions[0], // functionA
        mockFunctions[1]  // functionB
      );

      expect(result.validationErrors).toHaveLength(0);
      expect(result.addedCalls).toHaveLength(2); // Both calls removed
      expect(result.updatedCode).not.toContain('functionB();');
      expect(result.updatedCode).toContain('console.log("middle");');
    });

    it('should return original code when no function call exists', () => {
      const code = `
function functionA() {
  console.log("A");
}

function functionB() {
  return "B";
}
      `.trim();

      const result = edgeManager.removeFunctionCallFromCode(
        code,
        mockFunctions[0], // functionA
        mockFunctions[1]  // functionB
      );

      expect(result.validationErrors).toHaveLength(0);
      expect(result.addedCalls).toHaveLength(0);
      expect(result.updatedCode).toBe(code); // No changes
    });

    it('should handle missing source function', () => {
      const code = `
function functionB() {
  return "B";
}
      `.trim();

      const result = edgeManager.removeFunctionCallFromCode(
        code,
        mockFunctions[0], // functionA (not in code)
        mockFunctions[1]  // functionB
      );

      expect(result.validationErrors).toHaveLength(1);
      expect(result.validationErrors[0]).toContain('not found in code');
      expect(result.addedCalls).toHaveLength(0);
      expect(result.updatedCode).toBe(code);
    });

    it('should handle parsing errors gracefully', () => {
      const invalidCode = 'function invalid() { syntax error }';

      const result = edgeManager.removeFunctionCallFromCode(
        invalidCode,
        mockFunctions[0],
        mockFunctions[1]
      );

      expect(result.validationErrors.length).toBeGreaterThan(0);
      expect(result.validationErrors[0]).toContain('Failed to parse');
      expect(result.addedCalls).toHaveLength(0);
      expect(result.updatedCode).toBe(invalidCode);
    });
  });

  describe('removeManualEdgeFunctionCalls', () => {
    it('should remove function calls for removed manual edges', () => {
      const code = `
function functionA() {
  functionB();
  console.log("A");
}

function functionB() {
  functionC();
  return "B";
}

function functionC() {
  return "C";
}
      `.trim();

      const removedEdges: Edge[] = [
        {
          id: 'manual1',
          source: 'func1', // functionA
          target: 'func2'  // functionB
        },
        {
          id: 'manual2',
          source: 'func2', // functionB
          target: 'func3'  // functionC
        }
      ];

      const result = edgeManager.removeManualEdgeFunctionCalls(
        code,
        removedEdges,
        mockFunctions
      );

      expect(result.validationErrors).toHaveLength(0);
      expect(result.addedCalls).toHaveLength(2); // Both calls removed
      expect(result.updatedCode).not.toContain('functionB();');
      expect(result.updatedCode).not.toContain('functionC();');
      expect(result.updatedCode).toContain('console.log("A");');
    });

    it('should skip edges that have function call data (automatic edges)', () => {
      const code = `
function functionA() {
  functionB();
  console.log("A");
}

function functionB() {
  return "B";
}
      `.trim();

      const edgesWithFunctionCall: Edge[] = [
        {
          id: 'automatic',
          source: 'func1',
          target: 'func2',
          data: { functionCall: mockFunctionCalls[0] } // Has function call data
        }
      ];

      const result = edgeManager.removeManualEdgeFunctionCalls(
        code,
        edgesWithFunctionCall,
        mockFunctions
      );

      expect(result.validationErrors).toHaveLength(0);
      expect(result.addedCalls).toHaveLength(0); // No calls removed
      expect(result.updatedCode).toBe(code); // No changes
    });

    it('should handle invalid edges gracefully', () => {
      const code = `
function functionA() {
  console.log("A");
}
      `.trim();

      const invalidEdges: Edge[] = [
        {
          id: 'invalid',
          source: 'invalid-id',
          target: 'func1'
        }
      ];

      const result = edgeManager.removeManualEdgeFunctionCalls(
        code,
        invalidEdges,
        mockFunctions
      );

      expect(result.validationErrors.length).toBeGreaterThan(0);
      expect(result.addedCalls).toHaveLength(0);
      expect(result.updatedCode).toBe(code);
    });
  });

  describe('bidirectionalSync', () => {
    it('should perform complete bidirectional synchronization', () => {
      const code = `
function functionA() {
  console.log("A");
}

function functionB() {
  functionC(); // This call should create an edge
  return "B";
}

function functionC() {
  return "C";
}
      `.trim();

      const manualEdge: Edge = {
        id: 'manual',
        source: 'func1', // functionA
        target: 'func2'  // functionB
      };

      const obsoleteEdge: Edge = {
        id: 'obsolete',
        source: 'func3',
        target: 'func1',
        data: { functionCall: { callerFunction: 'functionC', calledFunction: 'functionA' } }
      };

      const edges = [manualEdge, obsoleteEdge];

      const result = edgeManager.bidirectionalSync(
        code,
        edges,
        mockFunctions
      );

      // Should add function call for manual edge
      expect(result.addedCalls.length).toBeGreaterThan(0);
      expect(result.updatedCode).toContain('functionB();');

      // Should create edge for existing function call (functionB -> functionC)
      expect(result.createdEdges.length).toBeGreaterThan(0);
      
      // Should remove obsolete edge
      expect(result.removedEdges.length).toBeGreaterThan(0);
      
      // Should have validation results
      expect(result.validationErrors).toBeDefined();
    });

    it('should handle errors in both directions', () => {
      const invalidCode = 'function invalid() { syntax error }';
      const edges: Edge[] = [
        {
          id: 'manual',
          source: 'func1',
          target: 'func2'
        }
      ];

      const result = edgeManager.bidirectionalSync(
        invalidCode,
        edges,
        mockFunctions
      );

      expect(result.validationErrors.length).toBeGreaterThan(0);
      expect(result.updatedCode).toBe(invalidCode);
      expect(result.addedCalls).toHaveLength(0);
      expect(result.createdEdges).toHaveLength(0);
    });
  });
});