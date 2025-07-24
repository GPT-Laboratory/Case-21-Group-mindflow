import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Edge } from '@xyflow/react';
import { EdgeSynchronizationService } from '../EdgeSynchronizationService';
import { AutomaticEdgeManager } from '../AutomaticEdgeManager';
import { ASTParserService } from '../../ASTParserService';

// Mock the dependencies
vi.mock('../AutomaticEdgeManager');
vi.mock('../../ASTParserService');

describe('EdgeSynchronizationService', () => {
  let syncService: EdgeSynchronizationService;
  let mockEdgeManager: AutomaticEdgeManager;
  let mockASTParser: ASTParserService;

  const sampleCode = `
    function functionA() {
      functionB();
    }
    
    function functionB() {
      return "B";
    }
    
    function functionC() {
      functionA();
    }
  `;

  const updatedCode = `
    function functionA() {
      functionB();
      functionC();
    }
    
    function functionB() {
      return "B";
    }
    
    function functionC() {
      return "C";
    }
  `;

  beforeEach(() => {
    mockEdgeManager = new AutomaticEdgeManager();
    mockASTParser = new ASTParserService();
    syncService = new EdgeSynchronizationService(mockEdgeManager, mockASTParser);

    // Setup mock implementations
    vi.mocked(mockASTParser.parseFile).mockReturnValue({
      functions: [
        {
          id: 'func1',
          name: 'functionA',
          description: 'Function A',
          parameters: [],
          sourceLocation: { start: { line: 1, column: 0 }, end: { line: 3, column: 0 } },
          isNested: false,
          scope: 'function',
          code: 'function functionA() { functionB(); }'
        },
        {
          id: 'func2',
          name: 'functionB',
          description: 'Function B',
          parameters: [],
          sourceLocation: { start: { line: 4, column: 0 }, end: { line: 6, column: 0 } },
          isNested: false,
          scope: 'function',
          code: 'function functionB() { return "B"; }'
        }
      ],
      calls: [
        {
          id: 'call1',
          callerFunction: 'functionA',
          calledFunction: 'functionB',
          sourceLocation: { start: { line: 2, column: 2 }, end: { line: 2, column: 13 } },
          isExternal: false
        }
      ],
      dependencies: [],
      variables: [],
      comments: []
    });

    vi.mocked(mockEdgeManager.removeObsoleteEdges).mockReturnValue({
      remainingEdges: [],
      removedEdges: []
    });

    vi.mocked(mockEdgeManager.createEdgesFromFunctionCalls).mockReturnValue({
      edges: [],
      createdEdges: [],
      skippedCalls: []
    });
  });

  describe('synchronizeEdges', () => {
    it('should successfully synchronize edges with code', () => {
      const currentEdges: Edge[] = [];
      
      const result = syncService.synchronizeEdges(sampleCode, currentEdges);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(mockASTParser.parseFile).toHaveBeenCalledWith(sampleCode);
      expect(mockEdgeManager.removeObsoleteEdges).toHaveBeenCalled();
      expect(mockEdgeManager.createEdgesFromFunctionCalls).toHaveBeenCalled();
    });

    it('should handle parsing errors gracefully', () => {
      vi.mocked(mockASTParser.parseFile).mockImplementation(() => {
        throw new Error('Syntax error');
      });

      const result = syncService.synchronizeEdges('invalid code', []);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Syntax error');
    });

    it('should return early when sync is disabled', () => {
      syncService.setSyncEnabled(false);
      
      const result = syncService.synchronizeEdges(sampleCode, []);

      expect(result.success).toBe(true);
      expect(mockASTParser.parseFile).not.toHaveBeenCalled();
    });

    it('should track removed edges', () => {
      const removedEdge: Edge = {
        id: 'removed-edge',
        source: 'func1',
        target: 'func3'
      };

      vi.mocked(mockEdgeManager.removeObsoleteEdges).mockReturnValue({
        remainingEdges: [],
        removedEdges: [removedEdge]
      });

      const result = syncService.synchronizeEdges(sampleCode, [removedEdge]);

      expect(result.edgesRemoved).toHaveLength(1);
      expect(result.edgesRemoved[0]).toBe(removedEdge);
    });

    it('should track added edges', () => {
      const newEdge: Edge = {
        id: 'new-edge',
        source: 'func1',
        target: 'func2'
      };

      vi.mocked(mockEdgeManager.createEdgesFromFunctionCalls).mockReturnValue({
        edges: [newEdge],
        createdEdges: [newEdge],
        skippedCalls: []
      });

      const result = syncService.synchronizeEdges(sampleCode, []);

      expect(result.edgesAdded).toHaveLength(1);
      expect(result.edgesAdded[0]).toBe(newEdge);
    });
  });

  describe('handleCodeChange', () => {
    it('should delegate to synchronizeEdges', () => {
      const spy = vi.spyOn(syncService, 'synchronizeEdges');
      const currentEdges: Edge[] = [];
      const options = { animated: true };

      syncService.handleCodeChange(updatedCode, currentEdges, options);

      expect(spy).toHaveBeenCalledWith(updatedCode, currentEdges, options);
    });
  });

  describe('hasSignificantChanges', () => {
    it('should return true when no previous code exists', () => {
      const result = syncService.hasSignificantChanges(sampleCode);
      expect(result).toBe(true);
    });

    it('should detect changes in function calls', () => {
      // First, set the initial code
      syncService.synchronizeEdges(sampleCode, []);

      // Mock different parse results for the updated code
      vi.mocked(mockASTParser.parseFile).mockReturnValueOnce({
        functions: [],
        calls: [
          {
            id: 'call1',
            callerFunction: 'functionA',
            calledFunction: 'functionB',
            sourceLocation: { start: { line: 2, column: 2 }, end: { line: 2, column: 13 } },
            isExternal: false
          }
        ],
        dependencies: [],
        variables: [],
        comments: []
      }).mockReturnValueOnce({
        functions: [],
        calls: [
          {
            id: 'call1',
            callerFunction: 'functionA',
            calledFunction: 'functionB',
            sourceLocation: { start: { line: 2, column: 2 }, end: { line: 2, column: 13 } },
            isExternal: false
          },
          {
            id: 'call2',
            callerFunction: 'functionA',
            calledFunction: 'functionC',
            sourceLocation: { start: { line: 3, column: 2 }, end: { line: 3, column: 13 } },
            isExternal: false
          }
        ],
        dependencies: [],
        variables: [],
        comments: []
      });

      const result = syncService.hasSignificantChanges(updatedCode);
      expect(result).toBe(true);
    });

    it('should return false when no significant changes detected', () => {
      // Set initial code
      syncService.synchronizeEdges(sampleCode, []);

      // Mock same parse results
      vi.mocked(mockASTParser.parseFile).mockReturnValue({
        functions: [],
        calls: [
          {
            id: 'call1',
            callerFunction: 'functionA',
            calledFunction: 'functionB',
            sourceLocation: { start: { line: 2, column: 2 }, end: { line: 2, column: 13 } },
            isExternal: false
          }
        ],
        dependencies: [],
        variables: [],
        comments: []
      });

      const result = syncService.hasSignificantChanges(sampleCode);
      expect(result).toBe(false);
    });

    it('should return true when parsing fails', () => {
      syncService.synchronizeEdges(sampleCode, []);
      
      vi.mocked(mockASTParser.parseFile).mockImplementation(() => {
        throw new Error('Parse error');
      });

      const result = syncService.hasSignificantChanges('invalid code');
      expect(result).toBe(true);
    });
  });

  describe('sync state management', () => {
    it('should enable and disable sync', () => {
      expect(syncService.isSyncEnabled()).toBe(true);
      
      syncService.setSyncEnabled(false);
      expect(syncService.isSyncEnabled()).toBe(false);
      
      syncService.setSyncEnabled(true);
      expect(syncService.isSyncEnabled()).toBe(true);
    });

    it('should track last known code', () => {
      expect(syncService.getLastKnownCode()).toBe('');
      
      syncService.synchronizeEdges(sampleCode, []);
      expect(syncService.getLastKnownCode()).toBe(sampleCode);
    });

    it('should reset state', () => {
      syncService.synchronizeEdges(sampleCode, []);
      syncService.setSyncEnabled(false);
      
      syncService.reset();
      
      expect(syncService.getLastKnownCode()).toBe('');
      expect(syncService.isSyncEnabled()).toBe(true);
    });
  });

  describe('validateEdgeConsistency', () => {
    it('should validate consistent edges', () => {
      const edges: Edge[] = [
        {
          id: 'edge1',
          source: 'func1',
          target: 'func2',
          data: {
            functionCall: {},
            sourceFunction: 'functionA',
            targetFunction: 'functionB'
          }
        }
      ];

      const result = syncService.validateEdgeConsistency(sampleCode, edges);

      expect(result.consistent).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect inconsistent edges', () => {
      const edges: Edge[] = [
        {
          id: 'edge1',
          source: 'func1',
          target: 'func2',
          data: {
            functionCall: {},
            sourceFunction: 'nonExistentFunction',
            targetFunction: 'functionB'
          }
        }
      ];

      const result = syncService.validateEdgeConsistency(sampleCode, edges);

      expect(result.consistent).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should handle parsing errors in validation', () => {
      vi.mocked(mockASTParser.parseFile).mockImplementation(() => {
        throw new Error('Parse error');
      });

      const result = syncService.validateEdgeConsistency('invalid code', []);

      expect(result.consistent).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toContain('Parse error');
    });
  });

  describe('getSyncStats', () => {
    it('should return sync statistics', () => {
      const edges: Edge[] = [
        {
          id: 'auto-edge',
          source: 'func1',
          target: 'func2',
          data: { functionCall: {} }
        },
        {
          id: 'manual-edge',
          source: 'func2',
          target: 'func3'
        }
      ];

      const stats = syncService.getSyncStats(sampleCode, edges);

      expect(stats.totalEdges).toBe(2);
      expect(stats.automaticEdges).toBe(1);
      expect(stats.manualEdges).toBe(1);
      expect(stats.functionCalls).toBe(1);
      expect(stats.functions).toBe(2);
      expect(stats.syncRatio).toBe(1); // 1 automatic edge / 1 function call
    });

    it('should handle parsing errors in stats', () => {
      vi.mocked(mockASTParser.parseFile).mockImplementation(() => {
        throw new Error('Parse error');
      });

      const edges: Edge[] = [{ id: 'edge1', source: 'a', target: 'b' }];
      const stats = syncService.getSyncStats('invalid code', edges);

      expect(stats.totalEdges).toBe(1);
      expect(stats.automaticEdges).toBe(0);
      expect(stats.manualEdges).toBe(1);
      expect(stats.functionCalls).toBe(0);
      expect(stats.functions).toBe(0);
      expect(stats.syncRatio).toBe(0);
    });
  });
});