import { Edge } from '@xyflow/react';
import { AutomaticEdgeManager, EdgeCreationOptions } from './AutomaticEdgeManager';
import { ASTParserService } from '../ASTParserService';

export interface SynchronizationResult {
  success: boolean;
  edgesAdded: Edge[];
  edgesRemoved: Edge[];
  edgesUpdated: Edge[];
  errors: string[];
}

export interface EdgeSynchronizationOptions extends EdgeCreationOptions {
  preserveManualEdges?: boolean;
  enableRealTimeSync?: boolean;
}

/**
 * Service for synchronizing edges with code changes in real-time
 */
export class EdgeSynchronizationService {
  private edgeManager: AutomaticEdgeManager;
  private astParser: ASTParserService;
  private lastKnownCode: string = '';
  private syncEnabled: boolean = true;

  constructor(
    edgeManager?: AutomaticEdgeManager,
    astParser?: ASTParserService
  ) {
    this.edgeManager = edgeManager || new AutomaticEdgeManager();
    this.astParser = astParser || new ASTParserService();
  }

  /**
   * Synchronize edges with current code state
   */
  synchronizeEdges(
    code: string,
    currentEdges: Edge[],
    options: EdgeSynchronizationOptions = {}
  ): SynchronizationResult {
    const result: SynchronizationResult = {
      success: false,
      edgesAdded: [],
      edgesRemoved: [],
      edgesUpdated: [],
      errors: []
    };

    if (!this.syncEnabled) {
      result.success = true;
      return result;
    }

    try {
      // Parse the code to get current function structure
      const parsedStructure = this.astParser.parseFile(code);
      
      // Get current function calls
      const currentCalls = parsedStructure.calls;
      const availableFunctions = parsedStructure.functions;

      // Remove obsolete edges
      const removalResult = this.edgeManager.removeObsoleteEdges(
        currentCalls,
        availableFunctions,
        currentEdges
      );

      result.edgesRemoved = removalResult.removedEdges;

      // Create new edges from current function calls
      const creationResult = this.edgeManager.createEdgesFromFunctionCalls(
        currentCalls,
        availableFunctions,
        removalResult.remainingEdges,
        options
      );

      result.edgesAdded = creationResult.createdEdges;
      result.success = true;

      // Update last known code
      this.lastKnownCode = code;

    } catch (error) {
      result.errors.push(
        `Synchronization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return result;
  }

  /**
   * Handle incremental code changes for better performance
   */
  handleCodeChange(
    newCode: string,
    currentEdges: Edge[],
    options: EdgeSynchronizationOptions = {}
  ): SynchronizationResult {
    // For now, perform full synchronization
    // In the future, this could be optimized for incremental changes
    return this.synchronizeEdges(newCode, currentEdges, options);
  }

  /**
   * Detect if code changes affect function calls
   */
  hasSignificantChanges(newCode: string): boolean {
    if (!this.lastKnownCode) {
      return true;
    }

    try {
      const oldStructure = this.astParser.parseFile(this.lastKnownCode);
      const newStructure = this.astParser.parseFile(newCode);

      // Compare function calls
      const oldCallsSet = new Set(
        oldStructure.calls.map(call => `${call.callerFunction}->${call.calledFunction}`)
      );
      const newCallsSet = new Set(
        newStructure.calls.map(call => `${call.callerFunction}->${call.calledFunction}`)
      );

      // Check if sets are different
      if (oldCallsSet.size !== newCallsSet.size) {
        return true;
      }

      for (const call of oldCallsSet) {
        if (!newCallsSet.has(call)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      // If parsing fails, assume significant changes
      return true;
    }
  }

  /**
   * Enable or disable automatic synchronization
   */
  setSyncEnabled(enabled: boolean): void {
    this.syncEnabled = enabled;
  }

  /**
   * Check if synchronization is enabled
   */
  isSyncEnabled(): boolean {
    return this.syncEnabled;
  }

  /**
   * Get the last known code state
   */
  getLastKnownCode(): string {
    return this.lastKnownCode;
  }

  /**
   * Reset the service state
   */
  reset(): void {
    this.lastKnownCode = '';
    this.syncEnabled = true;
  }

  /**
   * Validate that edges are consistent with code
   */
  validateEdgeConsistency(
    code: string,
    edges: Edge[]
  ): { consistent: boolean; issues: string[] } {
    const issues: string[] = [];

    try {
      const parsedStructure = this.astParser.parseFile(code);
      const functionMap = new Map(parsedStructure.functions.map(f => [f.name, f]));
      
      // Create set of valid function call pairs
      const validCallPairs = new Set(
        parsedStructure.calls.map(call => `${call.callerFunction}->${call.calledFunction}`)
      );

      // Check each edge that claims to represent a function call
      for (const edge of edges) {
        if (edge.data?.functionCall) {
          const sourceFunc = functionMap.get(edge.data.sourceFunction);
          const targetFunc = functionMap.get(edge.data.targetFunction);

          if (!sourceFunc) {
            issues.push(`Edge ${edge.id} references non-existent source function: ${edge.data.sourceFunction}`);
          }

          if (!targetFunc) {
            issues.push(`Edge ${edge.id} references non-existent target function: ${edge.data.targetFunction}`);
          }

          const callPair = `${edge.data.sourceFunction}->${edge.data.targetFunction}`;
          if (!validCallPairs.has(callPair)) {
            issues.push(`Edge ${edge.id} represents a function call that no longer exists in code: ${callPair}`);
          }
        }
      }

      return {
        consistent: issues.length === 0,
        issues
      };
    } catch (error) {
      issues.push(`Code parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        consistent: false,
        issues
      };
    }
  }

  /**
   * Get statistics about current synchronization state
   */
  getSyncStats(code: string, edges: Edge[]): {
    totalEdges: number;
    automaticEdges: number;
    manualEdges: number;
    functionCalls: number;
    functions: number;
    syncRatio: number;
  } {
    try {
      const parsedStructure = this.astParser.parseFile(code);
      const automaticEdges = edges.filter(e => e.data?.functionCall).length;
      const manualEdges = edges.filter(e => !e.data?.functionCall).length;
      
      return {
        totalEdges: edges.length,
        automaticEdges,
        manualEdges,
        functionCalls: parsedStructure.calls.length,
        functions: parsedStructure.functions.length,
        syncRatio: parsedStructure.calls.length > 0 ? automaticEdges / parsedStructure.calls.length : 0
      };
    } catch (error) {
      return {
        totalEdges: edges.length,
        automaticEdges: 0,
        manualEdges: edges.length,
        functionCalls: 0,
        functions: 0,
        syncRatio: 0
      };
    }
  }
}