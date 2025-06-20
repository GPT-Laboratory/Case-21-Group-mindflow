/**
 * Flow Validation Module
 * 
 * Enhanced with comprehensive auto-correction capabilities from the original FlowValidationService.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-16
 */

import { 
  FlowValidationResult,
  ValidationError,
  ValidationWarning,
  FlowGenerationResult
} from '../../generatortypes';
import { useUnifiedNodeTypeStore } from '../../../Node/store/useUnifiedNodeTypeStore';

// Enhanced constants for validation and correction
export const VALID_HANDLE_POSITIONS = ['top', 'bottom', 'left', 'right'] as const;

// Get valid node types dynamically from the store
export const getValidNodeTypes = (): string[] => {
  const nodeTypeStore = useUnifiedNodeTypeStore.getState();
  return nodeTypeStore.getAllNodeTypeNames();
};

// Auto-correction mappings from the original FlowValidationService
export const NODE_TYPE_CORRECTIONS: Record<string, string> = {
  'filternode': 'logicnode',
  'apinode': 'restnode',
  'displaynode': 'contentnode',
  'routernode': 'conditionalnode',
  'storagenode': 'datanode',
  'viewnode': 'contentnode',
  'processnode': 'logicnode',
  'servicenode': 'restnode'
};

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

// Node type aliases for backward compatibility
const nodeTypeAliases: Record<string, string> = {
  'filternode': 'logicnode',
  'processnode': 'logicnode',
};

/**
 * Enhanced Flow Validator with auto-correction capabilities
 */
export class FlowValidator {
  
  /**
   * Validate flow generation result
   */
  async validateFlowResult(result: FlowGenerationResult): Promise<FlowGenerationResult> {
    const validation = this.validateFlowStructure(result.nodes, result.edges);
    
    return {
      ...result,
      validation: {
        ...result.validation,
        ...validation
      }
    };
  }

  /**
   * Enhanced flow structure validation with auto-correction
   */
  validateFlowStructure(nodes: any[], edges: any[]): Partial<FlowValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Node validation with enhanced error details
    const nodeValidation = this.validateNodes(nodes);
    errors.push(...nodeValidation.errors);
    warnings.push(...nodeValidation.warnings);

    // Edge validation with enhanced error details
    const edgeValidation = this.validateEdges(edges, nodes);
    errors.push(...edgeValidation.errors);
    warnings.push(...edgeValidation.warnings);

    // Structure validation
    const structureValidation = this.validateStructure(nodes, edges);
    errors.push(...structureValidation.errors);
    warnings.push(...structureValidation.warnings);

    // Check for circular dependencies
    const circularDependencies = this.hasCircularDependencies(nodes, edges);

    if (circularDependencies) {
      warnings.push({
        type: 'circular_dependency',
        message: 'Potential circular dependency detected in flow'
      });
    }

    return {
      nodeTypeValidation: !errors.some(e => e.type === 'invalid_node_type'),
      handleValidation: !errors.some(e => e.type === 'invalid_handle'),
      structureValidation: errors.length === 0,
      circularDependencies,
      errors,
      warnings,
      isValid: errors.length === 0
    };
  }

  /**
   * Enhanced node validation with detailed error reporting
   */
  private validateNodes(nodes: any[]): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const node of nodes) {
      // Check node type with correction suggestions
      if (node.type && !getValidNodeTypes().includes(node.type as any)) {
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

      // Enhanced data structure validation
      if (node.data) {
        // Check for required data fields
        const requiredFields = ['expanded', 'depth', 'isParent', 'instanceData', 'templateData'];
        for (const field of requiredFields) {
          if (node.data[field] === undefined) {
            errors.push({
              type: 'missing_required_field',
              message: `Node ${node.id} missing required field: data.${field}`,
              nodeId: node.id,
              field: `data.${field}`,
              suggestedFix: field === 'expanded' ? 'true' : 
                           field === 'depth' ? '0' : 
                           field === 'isParent' ? 'false' :
                           field === 'instanceData' ? '{ "label": "Node Label", "details": "Node description" }' :
                           '{ "method": "GET", "url": "https://api.example.com/endpoint", "headers": {}, "authentication": "none" }'
            });
          }
        }

        // Check instanceData structure
        const instanceData = node.data.instanceData as any;
        if (instanceData && (!instanceData.label || !instanceData.details)) {
          warnings.push({
            type: 'best_practice',
            message: `Node ${node.id} should have complete instanceData with label and details`,
            suggestion: 'Add instanceData.label and instanceData.details fields'
          });
        }

        // Check instanceCode for processing nodes
        if (!node.data.instanceCode && node.type !== 'invisiblenode') {
          errors.push({
            type: 'missing_required_field',
            message: `Node ${node.id} missing required field: data.instanceCode`,
            nodeId: node.id,
            field: 'data.instanceCode',
            suggestedFix: 'async function process(incomingData, nodeData, params, targetMap, sourceMap) { /* processing logic */ }'
          });
        }

        // Check for realistic API endpoints in restnode types
        if (node.type === 'restnode' && node.data.templateData?.url) {
          const url = node.data.templateData.url;
          if (url.includes('example.com') || url.includes('api.example.com')) {
            warnings.push({
              type: 'best_practice',
              message: `Node ${node.id} uses generic example.com URL`,
              suggestion: 'Use realistic API endpoints (Gmail API, Telegram API, etc.)'
            });
          }
        }
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

    return { errors, warnings };
  }

  /**
   * Enhanced edge validation with correction suggestions
   */
  private validateEdges(edges: any[], nodes: any[]): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const nodeIds = new Set(nodes.map(n => n.id));

    for (const edge of edges) {
      // Check source and target nodes exist
      if (!nodeIds.has(edge.source)) {
        errors.push({
          type: 'invalid_edge',
          message: `Edge references non-existent source node: "${edge.source}"`,
          edgeId: edge.id,
          suggestedFix: `Check if node ID "${edge.source}" exists in the nodes array`
        });
      }

      if (!nodeIds.has(edge.target)) {
        errors.push({
          type: 'invalid_edge',
          message: `Edge references non-existent target node: "${edge.target}"`,
          edgeId: edge.id,
          suggestedFix: `Check if node ID "${edge.target}" exists in the nodes array`
        });
      }

      // Check for similar node IDs that might be typos
      if (!nodeIds.has(edge.source)) {
        const similarIds = Array.from(nodeIds).filter(id => 
          id.includes(edge.source.split('-').slice(-2).join('-')) || 
          edge.source.includes(id.split('-').slice(-2).join('-'))
        );
        if (similarIds.length > 0) {
          errors.push({
            type: 'invalid_edge',
            message: `Edge source "${edge.source}" not found. Similar node IDs: ${similarIds.join(', ')}`,
            edgeId: edge.id,
            suggestedFix: `Use one of the existing node IDs: ${similarIds.join(', ')}`
          });
        }
      }

      if (!nodeIds.has(edge.target)) {
        const similarIds = Array.from(nodeIds).filter(id => 
          id.includes(edge.target.split('-').slice(-2).join('-')) || 
          edge.target.includes(id.split('-').slice(-2).join('-'))
        );
        if (similarIds.length > 0) {
          errors.push({
            type: 'invalid_edge',
            message: `Edge target "${edge.target}" not found. Similar node IDs: ${similarIds.join(', ')}`,
            edgeId: edge.id,
            suggestedFix: `Use one of the existing node IDs: ${similarIds.join(', ')}`
          });
        }
      }

      // Enhanced handle validation with correction suggestions
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

      // Edge type validation
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
   * Structure validation for isolated nodes and flow integrity
   */
  private validateStructure(nodes: any[], edges: any[]): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for the common AI error: edges without nodes
    if (edges.length > 0 && nodes.length === 0) {
      errors.push({
        type: 'missing_required_field',
        message: 'Flow contains edges but no nodes. This is a common generation error.',
        field: 'nodes',
        suggestedFix: 'Create actual nodes that the edges reference. Do not copy example structure without creating nodes.'
      });
    }

    // Check for isolated nodes
    const connectedNodes = new Set();
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    const isolatedNodes = nodes.filter(node => 
      !connectedNodes.has(node.id) && node.type !== 'invisiblenode'
    );

    if (isolatedNodes.length > 0) {
      warnings.push({
        type: 'unusual_pattern',
        message: `Found ${isolatedNodes.length} isolated nodes`,
        suggestion: 'Consider connecting all nodes or removing unused ones'
      });
    }

    return { errors, warnings };
  }

  /**
   * Enhanced circular dependency detection
   */
  private hasCircularDependencies(nodes: any[], edges: any[]): boolean {
    const graph = new Map<string, string[]>();
    
    // Build adjacency list
    for (const node of nodes) {
      graph.set(node.id, []);
    }
    
    for (const edge of edges) {
      const adjacentNodes = graph.get(edge.source) || [];
      adjacentNodes.push(edge.target);
      graph.set(edge.source, adjacentNodes);
    }

    // DFS cycle detection
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = graph.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) return true;
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of graph.keys()) {
      if (!visited.has(nodeId) && hasCycle(nodeId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Enhanced validateAndCorrect method with auto-correction from original FlowValidationService
   */
  validateAndCorrect(flow: any, request: any): any {
    const errors: any[] = [];
    const warnings: any[] = [];
    let correctedFlow: any | undefined;

    // Validate using the enhanced structure validation
    const structureResult = this.validateFlowStructure(flow.nodes || [], flow.edges || []);
    errors.push(...(structureResult.errors || []));
    warnings.push(...(structureResult.warnings || []));

    // Auto-correct if possible
    if (errors.length > 0) {
      console.log('🔧 Attempting auto-correction of flow validation errors...');
      correctedFlow = this.attemptAutoCorrection(flow, errors);
      
      if (correctedFlow) {
        // Re-validate corrected flow
        const revalidation = this.validateAndCorrect(correctedFlow, request);
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
   * Auto-correction logic from original FlowValidationService
   */
  private attemptAutoCorrection(flow: any, errors: any[]): any | undefined {
    try {
      const correctedNodes = [...(flow.nodes || [])];
      const correctedEdges = [...(flow.edges || [])];
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
            originalNodeCount: flow.nodes?.length || 0,
            originalEdgeCount: flow.edges?.length || 0
          }
        };
      }

      return undefined;

    } catch (error) {
      console.error('Auto-correction failed:', error);
      return undefined;
    }
  }

  /**
   * Legacy compatibility methods
   */
  validateFlow(flow: any, request: any): any {
    return this.validateAndCorrect(flow, request);
  }

  buildSelfCorrectionPrompt(invalidFlow: any, errors: any[], request: any): string {
    const validNodeTypes = getValidNodeTypes();
    const validHandles = VALID_HANDLE_POSITIONS;
    
    const errorsList = errors.map(e => 
      `- ${e.message}${e.suggestedFix ? ` (Fix: ${e.suggestedFix})` : ''}`
    ).join('\n');
    
    return `Fix the following validation errors in this flow:

**Original Request**: "${request.description}"

**Validation Errors**:
${errorsList}

**CRITICAL FIXES NEEDED**:
1. Replace invalid node types with: ${validNodeTypes.join(', ')}
2. Use only these handle positions: ${validHandles.join(', ')}
3. Ensure all node IDs and edge references are correct

**Invalid Flow to Fix**:
${JSON.stringify(invalidFlow, null, 2)}

Return ONLY the corrected JSON flow - no explanations, no markdown, just valid JSON that fixes all the errors above.`;
  }

  /**
   * Generate validation report for logging
   */
  generateValidationReport(result: any): string {
    let report = `\n📋 Flow Validation Report\n`;
    report += `========================\n`;
    report += `Status: ${result.isValid ? '✅ Valid' : '❌ Invalid'}\n`;
    report += `Errors: ${result.errors.length}\n`;
    report += `Warnings: ${result.warnings.length}\n`;

    if (result.errors.length > 0) {
      report += `\n🚨 Errors:\n`;
      result.errors.forEach((error: any, index: number) => {
        report += `  ${index + 1}. ${error.message}`;
        if (error.suggestedFix) {
          report += ` (Suggested: ${error.suggestedFix})`;
        }
        report += `\n`;
      });
    }

    if (result.warnings.length > 0) {
      report += `\n⚠️  Warnings:\n`;
      result.warnings.forEach((warning: any, index: number) => {
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