import { Node, Edge } from '@xyflow/react';
import { FlowGenerationRequest, GeneratedFlow } from './FlowGenerationService';

// Valid node types in your system
export const VALID_NODE_TYPES = [
  'restnode',
  'contentnode', 
  'logicalnode',
  'conditionalnode',
  'datanode',
  'pagenode',
  'statisticsnode',
  'invisiblenode',
  'coursenode',
  'modulenode'
] as const;

// Valid handle positions
export const VALID_HANDLE_POSITIONS = ['top', 'bottom', 'left', 'right'] as const;

// Common invalid node types and their corrections
export const NODE_TYPE_CORRECTIONS: Record<string, string> = {
  'filternode': 'logicalnode',
  'apinode': 'restnode',
  'displaynode': 'contentnode',
  'routernode': 'conditionalnode',
  'storagenode': 'datanode',
  'viewnode': 'contentnode',
  'processnode': 'logicalnode',
  'servicenode': 'restnode'
};

// Common invalid handle IDs and their corrections
export const HANDLE_ID_CORRECTIONS: Record<string, string> = {
  'left': 'left',
  'right': 'right', 
  'top': 'top',
  'bottom': 'bottom',
  'input': 'left',
  'output': 'right',
  'in': 'left',
  'out': 'right'
};

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  correctedFlow?: GeneratedFlow;
}

export interface ValidationError {
  type: 'invalid_node_type' | 'invalid_handle' | 'missing_required_field' | 'invalid_edge';
  message: string;
  nodeId?: string;
  edgeId?: string;
  field?: string;
  suggestedFix?: string;
}

export interface ValidationWarning {
  type: 'unusual_pattern' | 'performance_concern' | 'best_practice';
  message: string;
  nodeId?: string;
  suggestion?: string;
}

/**
 * Flow Validation Service
 * 
 * Validates AI-generated flows and provides self-correction capabilities
 */
export class FlowValidationService {
  
  /**
   * Validate and auto-correct an AI-generated flow
   */
  static validateAndCorrect(flow: GeneratedFlow, _request: FlowGenerationRequest): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let correctedFlow: GeneratedFlow | undefined;

    // Step 1: Validate nodes
    const nodeValidation = this.validateNodes(flow.nodes);
    errors.push(...nodeValidation.errors);
    warnings.push(...nodeValidation.warnings);

    // Step 2: Validate edges
    const edgeValidation = this.validateEdges(flow.edges, flow.nodes);
    errors.push(...edgeValidation.errors);
    warnings.push(...edgeValidation.warnings);

    // Step 3: Validate flow structure
    const structureValidation = this.validateFlowStructure(flow);
    errors.push(...structureValidation.errors);
    warnings.push(...structureValidation.warnings);

    // Step 4: Auto-correct if possible
    if (errors.length > 0) {
      console.log('🔧 Attempting auto-correction of flow validation errors...');
      correctedFlow = this.attemptAutoCorrection(flow, errors);
      
      if (correctedFlow) {
        // Re-validate corrected flow
        const revalidation = this.validateAndCorrect(correctedFlow, _request);
        if (revalidation.errors.length === 0) {
          console.log('✅ Auto-correction successful!');
          return {
            isValid: true,
            errors: [],
            warnings: [...warnings, ...revalidation.warnings],
            correctedFlow
          };
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      correctedFlow
    };
  }

  /**
   * Validate node structure and types
   */
  private static validateNodes(nodes: Node[]): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const node of nodes) {
      // Check node type
      if (node.type && !VALID_NODE_TYPES.includes(node.type as any)) {
        errors.push({
          type: 'invalid_node_type',
          message: `Invalid node type: "${node.type}"`,
          nodeId: node.id,
          suggestedFix: NODE_TYPE_CORRECTIONS[node.type] || 'restnode'
        });
      }

      // Check required fields
      if (!node.id) {
        errors.push({
          type: 'missing_required_field',
          message: 'Node missing required field: id',
          nodeId: node.id,
          field: 'id'
        });
      }

      if (!node.data) {
        errors.push({
          type: 'missing_required_field',
          message: 'Node missing required field: data',
          nodeId: node.id,
          field: 'data'
        });
      }

      // Check node data structure
      if (node.data) {
        const instanceData = node.data.instanceData as any;
        if (!instanceData?.label) {
          warnings.push({
            type: 'best_practice',
            message: 'Node should have a descriptive label',
            nodeId: node.id,
            suggestion: 'Add instanceData.label field'
          });
        }

        if (!node.data.instanceCode && node.type !== 'invisiblenode') {
          warnings.push({
            type: 'best_practice',
            message: 'Node should have instance code for processing',
            nodeId: node.id,
            suggestion: 'Add instanceCode field with processing logic'
          });
        }
      }

      // Performance warnings
      if (nodes.length > 20) {
        warnings.push({
          type: 'performance_concern',
          message: 'Large number of nodes may impact performance',
          suggestion: 'Consider breaking into smaller flows'
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate edge connections and handles
   */
  private static validateEdges(edges: Edge[], nodes: Node[]): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const nodeIds = new Set(nodes.map(n => n.id));

    for (const edge of edges) {
      // Check source and target nodes exist
      if (!nodeIds.has(edge.source)) {
        errors.push({
          type: 'invalid_edge',
          message: `Edge references non-existent source node: "${edge.source}"`,
          edgeId: edge.id
        });
      }

      if (!nodeIds.has(edge.target)) {
        errors.push({
          type: 'invalid_edge',
          message: `Edge references non-existent target node: "${edge.target}"`,
          edgeId: edge.id
        });
      }

      // Check handle IDs if present
      if (edge.sourceHandle && !VALID_HANDLE_POSITIONS.includes(edge.sourceHandle as any)) {
        errors.push({
          type: 'invalid_handle',
          message: `Invalid source handle: "${edge.sourceHandle}"`,
          edgeId: edge.id,
          suggestedFix: HANDLE_ID_CORRECTIONS[edge.sourceHandle] || 'right'
        });
      }

      if (edge.targetHandle && !VALID_HANDLE_POSITIONS.includes(edge.targetHandle as any)) {
        errors.push({
          type: 'invalid_handle',
          message: `Invalid target handle: "${edge.targetHandle}"`,
          edgeId: edge.id,
          suggestedFix: HANDLE_ID_CORRECTIONS[edge.targetHandle] || 'left'
        });
      }

      // Check edge type
      if (edge.type && !['package', 'default'].includes(edge.type)) {
        warnings.push({
          type: 'unusual_pattern',
          message: `Unusual edge type: "${edge.type}"`,
          suggestion: 'Consider using "package" or "default"'
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate overall flow structure
   */
  private static validateFlowStructure(flow: GeneratedFlow): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for isolated nodes
    const connectedNodes = new Set();
    flow.edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    const isolatedNodes = flow.nodes.filter(node => 
      !connectedNodes.has(node.id) && node.type !== 'invisiblenode'
    );

    if (isolatedNodes.length > 0) {
      warnings.push({
        type: 'unusual_pattern',
        message: `Found ${isolatedNodes.length} isolated nodes`,
        suggestion: 'Consider connecting all nodes or removing unused ones'
      });
    }

    // Check for circular dependencies (basic check)
    if (FlowValidationService.hasCircularDependencies(flow.edges)) {
      warnings.push({
        type: 'unusual_pattern',
        message: 'Potential circular dependencies detected',
        suggestion: 'Review flow logic to avoid infinite loops'
      });
    }

    return { errors, warnings };
  }

  /**
   * Attempt automatic correction of validation errors
   */
  private static attemptAutoCorrection(
    flow: GeneratedFlow, 
    errors: ValidationError[]
  ): GeneratedFlow | undefined {
    try {
      const correctedNodes = [...flow.nodes];
      const correctedEdges = [...flow.edges];
      let correctionsMade = false;

      // Correct node types
      for (const error of errors) {
        if (error.type === 'invalid_node_type' && error.nodeId && error.suggestedFix) {
          const nodeIndex = correctedNodes.findIndex(n => n.id === error.nodeId);
          if (nodeIndex >= 0) {
            correctedNodes[nodeIndex] = {
              ...correctedNodes[nodeIndex],
              type: error.suggestedFix
            };
            correctionsMade = true;
            console.log(`🔧 Corrected node type: ${error.nodeId} -> ${error.suggestedFix}`);
          }
        }

        // Correct handle IDs
        if (error.type === 'invalid_handle' && error.edgeId && error.suggestedFix) {
          const edgeIndex = correctedEdges.findIndex(e => e.id === error.edgeId);
          if (edgeIndex >= 0) {
            const edge = correctedEdges[edgeIndex];
            if (error.message.includes('source handle')) {
              correctedEdges[edgeIndex] = {
                ...edge,
                sourceHandle: error.suggestedFix
              };
            } else if (error.message.includes('target handle')) {
              correctedEdges[edgeIndex] = {
                ...edge,
                targetHandle: error.suggestedFix
              };
            }
            correctionsMade = true;
            console.log(`🔧 Corrected handle: ${error.edgeId} -> ${error.suggestedFix}`);
          }
        }
      }

      if (correctionsMade) {
        return {
          ...flow,
          nodes: correctedNodes,
          edges: correctedEdges,
          metadata: {
            ...flow.metadata,
            corrected: true,
            originalNodeCount: flow.nodes.length,
            originalEdgeCount: flow.edges.length
          } as any
        };
      }

      return undefined;

    } catch (error) {
      console.error('Auto-correction failed:', error);
      return undefined;
    }
  }

  /**
   * Basic circular dependency detection
   */
  private static hasCircularDependencies(edges: Edge[]): boolean {
    const graph = new Map<string, string[]>();
    
    // Build adjacency list
    edges.forEach(edge => {
      if (!graph.has(edge.source)) {
        graph.set(edge.source, []);
      }
      graph.get(edge.source)!.push(edge.target);
    });

    // DFS to detect cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (node: string): boolean => {
      visited.add(node);
      recursionStack.add(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) {
            return true;
          }
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        if (hasCycle(node)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Generate a validation report for logging
   */
  static generateValidationReport(result: ValidationResult): string {
    let report = `\n📋 Flow Validation Report\n`;
    report += `========================\n`;
    report += `Status: ${result.isValid ? '✅ Valid' : '❌ Invalid'}\n`;
    report += `Errors: ${result.errors.length}\n`;
    report += `Warnings: ${result.warnings.length}\n`;

    if (result.errors.length > 0) {
      report += `\n🚨 Errors:\n`;
      result.errors.forEach((error, index) => {
        report += `  ${index + 1}. ${error.message}`;
        if (error.suggestedFix) {
          report += ` (Suggested: ${error.suggestedFix})`;
        }
        report += `\n`;
      });
    }

    if (result.warnings.length > 0) {
      report += `\n⚠️  Warnings:\n`;
      result.warnings.forEach((warning, index) => {
        report += `  ${index + 1}. ${warning.message}\n`;
      });
    }
    
    if (result.correctedFlow) {
      report += `\n🔧 Auto-corrections applied:\n`;
      report += `  - Nodes: ${result.correctedFlow.nodes.length}\n`;
      report += `  - Edges: ${result.correctedFlow.edges.length}\n`;
    }
    
    return report;
  }
}