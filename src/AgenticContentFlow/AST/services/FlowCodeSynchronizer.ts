import { ASTParserServiceInterface } from '../interfaces/CoreInterfaces';
import { ASTError } from '../errors/ASTError';
import {
  FlowStructure,
  FunctionMetadata,
  ParsedFileStructure,
  SyncValidationResult,
  FlowVariable,
  FlowChange,
  ScopeViolation,
  ScopeCorrection
} from '../types/ASTTypes';
import { Node, Edge } from '@xyflow/react';

/**
 * FlowCodeSynchronizer handles bidirectional synchronization between JavaScript code and visual flows.
 * It serves as the core engine for maintaining consistency between code files and their visual representations.
 */
export class FlowCodeSynchronizer {
  private astParser: ASTParserServiceInterface;
  private currentFlowStructure: FlowStructure | null = null;
  private currentCode: string = '';

  constructor(astParser: ASTParserServiceInterface) {
    if (!astParser) {
      throw new ASTError('ASTParserServiceInterface instance is required', 'FlowCodeSynchronizer');
    }

    if (typeof astParser.parseFile !== 'function') {
      throw new ASTError('Parser service must implement parseFile method', 'FlowCodeSynchronizer');
    }

    this.astParser = astParser;
  }

  /**
   * Converts JavaScript code to a flow structure
   * Maps functions to nodes and function calls to edges
   */
  syncCodeToFlow(code: string, fileName: string = 'untitled.js'): FlowStructure {
    try {
      this.currentCode = code;

      // Parse the code using AST parser
      const parsedStructure = this.astParser.parseFile(code);

      // Create flow structure from parsed data
      const flowStructure = this.createFlowFromParsedStructure(parsedStructure, fileName);

      this.currentFlowStructure = flowStructure;
      return flowStructure;
    } catch (error) {
      console.error('Error synchronizing code to flow:', error);
      if (error instanceof ASTError) {
        throw error;
      }
      throw new ASTError(`Failed to convert code to flow: ${(error as Error).message}`, 'FlowCodeSynchronizer');
    }
  }

  /**
   * Converts a flow structure back to JavaScript code
   * Maintains code file as single source of truth
   */
  syncFlowToCode(flow: FlowStructure): string {
    try {
      // Generate JavaScript code from flow structure
      const generatedCode = this.generateCodeFromFlow(flow);

      this.currentCode = generatedCode;
      this.currentFlowStructure = flow;

      return generatedCode;
    } catch (error) {
      console.error('Error synchronizing flow to code:', error);
      if (error instanceof ASTError) {
        throw error;
      }
      throw new ASTError(`Failed to convert flow to code: ${(error as Error).message}`, 'FlowCodeSynchronizer');
    }
  }

  /**
   * Updates code in real-time from visual changes
   * Maintains incremental synchronization for better performance
   */
  updateCodeFromFlowChanges(changes: FlowChange[]): string {
    if (!this.currentFlowStructure) {
      throw new ASTError('No current flow structure to update from', 'FlowCodeSynchronizer');
    }

    try {
      // Apply changes to current flow structure
      const updatedFlow = this.applyFlowChanges(this.currentFlowStructure, changes);

      // Generate updated code
      const updatedCode = this.generateCodeFromFlow(updatedFlow);

      this.currentCode = updatedCode;
      this.currentFlowStructure = updatedFlow;

      return updatedCode;
    } catch (error) {
      console.error('Error updating code from flow changes:', error);
      if (error instanceof ASTError) {
        throw error;
      }
      throw new ASTError(`Failed to update code from flow changes: ${(error as Error).message}`, 'FlowCodeSynchronizer');
    }
  }

  /**
   * Maintains code file as single source of truth by persisting changes
   */
  persistCodeChanges(code: string, filePath?: string): void {
    this.currentCode = code;

    // In a real implementation, this would write to the file system
    // For now, we just update the internal state
    if (filePath) {
      console.log(`Code would be persisted to: ${filePath}`);
    }
  }

  /**
   * Monitors node code changes and re-analyzes function calls
   * Automatically updates edges when code is modified
   */
  reAnalyzeCodeChanges(updatedCode: string): FlowStructure {
    if (!this.currentFlowStructure) {
      throw new ASTError('No current flow structure to re-analyze', 'FlowCodeSynchronizer');
    }

    try {
      // Parse the updated code
      const parsedStructure = this.astParser.parseFile(updatedCode);

      // Create updated flow structure
      const updatedFlow = this.createUpdatedFlowFromChanges(
        this.currentFlowStructure,
        parsedStructure,
        updatedCode
      );

      this.currentCode = updatedCode;
      this.currentFlowStructure = updatedFlow;

      return updatedFlow;
    } catch (error) {
      console.error('Error re-analyzing code changes:', error);
      if (error instanceof ASTError) {
        throw error;
      }
      throw new ASTError(`Failed to re-analyze code changes: ${(error as Error).message}`, 'FlowCodeSynchronizer');
    }
  }

  /**
   * Updates node name references throughout the flow when function names change
   */
  updateNodeNameReferences(oldName: string, newName: string): FlowStructure {
    if (!this.currentFlowStructure) {
      throw new ASTError('No current flow structure to update', 'FlowCodeSynchronizer');
    }

    const updatedFlow = { ...this.currentFlowStructure };

    // Update node function names
    updatedFlow.nodes = updatedFlow.nodes.map(node => {
      if (node.data?.functionName === oldName) {
        return {
          ...node,
          data: {
            ...node.data,
            functionName: newName,
            label: newName
          }
        };
      }
      return node;
    });

    // Update edge references
    updatedFlow.edges = updatedFlow.edges.map(edge => {
      const updatedEdge = { ...edge };
      if (edge.data?.sourceFunction === oldName) {
        updatedEdge.data = { ...edge.data, sourceFunction: newName };
      }
      if (edge.data?.targetFunction === oldName) {
        updatedEdge.data = { ...edge.data, targetFunction: newName };
      }
      return updatedEdge;
    });

    // Update parent function references for nested functions
    updatedFlow.nodes = updatedFlow.nodes.map(node => {
      if (node.data?.parentFunction === oldName ||
        (typeof node.data?.parentFunction === 'string' &&
          this.currentFlowStructure?.nodes.find(n => n.id === node.data?.parentFunction)?.data?.functionName === oldName)) {
        return {
          ...node,
          data: {
            ...node.data,
            parentFunction: newName
          }
        };
      }
      return node;
    });

    this.currentFlowStructure = updatedFlow;
    return updatedFlow;
  }

  /**
   * Automatically detects and handles scope violations
   */
  detectScopeViolations(): ScopeViolation[] {
    if (!this.currentFlowStructure) {
      return [];
    }

    const violations: ScopeViolation[] = [];

    this.currentFlowStructure.nodes.forEach(node => {
      if (node.data?.isNested && node.data?.parentFunction) {
        // Check if parent function still exists
        const parentExists = this.currentFlowStructure!.nodes.some(
          n => n.data?.functionName === node.data.parentFunction
        );

        if (!parentExists) {
          violations.push({
            type: 'missing_parent',
            nodeId: node.id,
            functionName: node.data.functionName,
            parentFunction: node.data.parentFunction,
            message: `Parent function '${node.data.parentFunction}' not found for nested function '${node.data.functionName}'`,
            severity: 'error'
          });
        }
      }

      // Check for circular dependencies in function calls
      const circularDeps = this.detectCircularDependencies(node.id);
      if (circularDeps.length > 0) {
        violations.push({
          type: 'circular_dependency',
          nodeId: node.id,
          functionName: node.data?.functionName,
          message: `Circular dependency detected: ${circularDeps.join(' -> ')}`,
          severity: 'warning'
        });
      }
    });

    return violations;
  }

  /**
   * Provides suggestions for scope corrections
   */
  suggestScopeCorrections(violations: ScopeViolation[]): ScopeCorrection[] {
    const corrections: ScopeCorrection[] = [];

    violations.forEach(violation => {
      switch (violation.type) {
        case 'missing_parent':
          corrections.push({
            violationId: violation.nodeId,
            type: 'move_to_global',
            description: `Move '${violation.functionName}' to global scope`,
            action: () => this.moveNodeToGlobalScope(violation.nodeId)
          });
          break;

        case 'circular_dependency':
          corrections.push({
            violationId: violation.nodeId,
            type: 'break_cycle',
            description: `Break circular dependency by removing one of the function calls`,
            action: () => this.suggestCycleBreaking(violation.nodeId)
          });
          break;
      }
    });

    return corrections;
  }

  /**
   * Updates edges based on function calls detected in code
   */
  updateEdgesFromCode(functionCalls: any[]): Edge[] {
    const edges: Edge[] = [];

    functionCalls.forEach((call, index) => {
      // Map function names to node IDs
      const sourceNodeId = this.findNodeIdByFunctionName(call.callerFunction);
      const targetNodeId = this.findNodeIdByFunctionName(call.calledFunction);

      if (sourceNodeId && targetNodeId) {
        const edge: Edge = {
          id: `edge-${call.callerFunction}-${call.calledFunction}-${index}`,
          source: sourceNodeId,
          target: targetNodeId,
          type: 'default',
          data: {
            callType: call.isExternal ? 'external' : 'direct',
            sourceFunction: call.callerFunction,
            targetFunction: call.calledFunction,
            visualizationEnabled: true,
            executionOrder: index
          }
        };

        edges.push(edge);
      }
    });

    return edges;
  }

  /**
   * Validates synchronization between current flow and code
   */
  validateSynchronization(): SyncValidationResult {
    if (!this.currentFlowStructure || !this.currentCode) {
      return {
        isValid: false,
        errors: ['No flow structure or code to validate'],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Re-parse current code to compare with flow structure
      const reparsedStructure = this.astParser.parseFile(this.currentCode);

      // Check if function count matches
      if (reparsedStructure.functions.length !== this.currentFlowStructure.nodes.length) {
        errors.push(`Function count mismatch: code has ${reparsedStructure.functions.length} functions, flow has ${this.currentFlowStructure.nodes.length} nodes`);
      }

      // Check if function names match
      const codeFunctionNames = reparsedStructure.functions.map(f => f.name).sort();
      const flowNodeNames = this.currentFlowStructure.nodes.map(n => n.data?.functionName || n.id).sort();

      const missingInFlow = codeFunctionNames.filter(name => !flowNodeNames.includes(name));
      const missingInCode = flowNodeNames.filter(name => !codeFunctionNames.includes(name));

      if (missingInFlow.length > 0) {
        warnings.push(`Functions in code but not in flow: ${missingInFlow.join(', ')}`);
      }

      if (missingInCode.length > 0) {
        warnings.push(`Nodes in flow but not in code: ${missingInCode.join(', ')}`);
      }

    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Creates a flow structure from parsed AST data
   */
  private createFlowFromParsedStructure(parsed: ParsedFileStructure, fileName: string): FlowStructure {
    const nodes = this.createNodesFromFunctions(parsed.functions);
    const edges = this.createEdgesFromCalls(parsed.calls, nodes);
    const variables = this.extractFlowVariables(parsed.variables);

    return {
      id: `flow-${Date.now()}`,
      fileName,
      description: this.extractFileDescription(this.currentCode),
      variables,
      nodes,
      edges,
      metadata: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: '1.0.0',
        astVersion: parsed.astVersion || 'unknown'
      }
    };
  }

  /**
   * Creates nodes from function metadata
   */
  private createNodesFromFunctions(functions: FunctionMetadata[]): Node[] {
    return functions.map((func, index) => {
      const node: Node = {
        id: func.id,
        type: 'default',
        position: this.calculateNodePosition(index, functions.length),
        data: {
          label: func.name,
          description: func.description,
          functionName: func.name,
          parameters: func.parameters,
          returnType: func.returnType,
          sourceLocation: func.sourceLocation,
          isNested: func.isNested,
          parentFunction: func.parentFunction,
          scope: func.scope,
          canContainChildren: true,
          childNodes: []
        }
      };

      return node;
    });
  }

  /**
   * Calculates position for nodes in a flow layout
   */
  private calculateNodePosition(index: number, total: number): { x: number; y: number } {
    const cols = Math.ceil(Math.sqrt(total));
    const row = Math.floor(index / cols);
    const col = index % cols;

    return {
      x: col * 250 + 50,
      y: row * 150 + 50
    };
  }

  /**
   * Extracts flow-level variables from variable declarations
   */
  private extractFlowVariables(variables: any[]): FlowVariable[] {
    return variables.map(variable => ({
      id: `var-${variable.name}`,
      name: variable.name,
      type: variable.type || 'unknown',
      defaultValue: variable.defaultValue,
      description: variable.description || '',
      isConfigurable: true,
      scope: 'flow'
    }));
  }

  /**
   * Extracts file description from comments at the top of the file
   */
  private extractFileDescription(code: string): string {
    const lines = code.split('\n');
    const descriptionLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        descriptionLines.push(trimmed.replace(/^(\/\/|\*|\/\*)\s?/, ''));
      } else if (trimmed && !trimmed.startsWith('import') && !trimmed.startsWith('const') && !trimmed.startsWith('let') && !trimmed.startsWith('var')) {
        break;
      }
    }

    return descriptionLines.join(' ').trim() || 'Generated flow from JavaScript file';
  }

  /**
   * Generates JavaScript code from flow structure
   */
  private generateCodeFromFlow(flow: FlowStructure): string {
    const codeLines: string[] = [];

    // Add file description as comment
    if (flow.description) {
      codeLines.push(`// ${flow.description}`);
      codeLines.push('');
    }

    // Add flow variables
    flow.variables.forEach(variable => {
      const declaration = variable.type === 'const' ? 'const' : 'let';
      const value = variable.defaultValue !== undefined ? variable.defaultValue : 'undefined';
      codeLines.push(`${declaration} ${variable.name} = ${JSON.stringify(value)};`);
    });

    if (flow.variables.length > 0) {
      codeLines.push('');
    }

    // Generate functions from nodes
    flow.nodes.forEach(node => {
      if (node.data?.functionName) {
        codeLines.push(this.generateFunctionCode(node, flow));
        codeLines.push('');
      }
    });

    return codeLines.join('\n');
  }

  /**
   * Generates function code from a node
   */
  private generateFunctionCode(node: Node, flow: FlowStructure): string {
    const functionName = node.data.functionName;
    const description = node.data.description;
    const parameters = node.data.parameters || [];

    const lines: string[] = [];

    // Add function description as comment
    if (description) {
      lines.push(`/**`);
      lines.push(` * ${description}`);
      lines.push(` */`);
    }

    // Generate function signature
    const paramList = Array.isArray(parameters) ? parameters.map(p => p.name).join(', ') : '';
    lines.push(`function ${functionName}(${paramList}) {`);

    // Add function calls based on edges
    const outgoingEdges = flow.edges.filter(edge => edge.source === node.id);
    outgoingEdges.forEach(edge => {
      const targetNode = flow.nodes.find(n => n.id === edge.target);
      if (targetNode?.data?.functionName) {
        lines.push(`  ${targetNode.data.functionName}();`);
      }
    });

    // Add return statement if needed
    if (node.data.returnType && node.data.returnType !== 'void') {
      lines.push(`  // TODO: Implement return value`);
      lines.push(`  return null;`);
    }

    lines.push(`}`);

    return lines.join('\n');
  }

  /**
   * Gets the current flow structure
   */
  getCurrentFlowStructure(): FlowStructure | null {
    return this.currentFlowStructure;
  }

  /**
   * Gets the current code
   */
  getCurrentCode(): string {
    return this.currentCode;
  }

  /**
   * Creates edges from function calls and nodes
   */
  private createEdgesFromCalls(functionCalls: any[], nodes: Node[]): Edge[] {
    const edges: Edge[] = [];

    functionCalls.forEach((call, index) => {
      // Find source and target nodes by function name
      const sourceNode = nodes.find(n => n.data?.functionName === call.callerFunction);
      const targetNode = nodes.find(n => n.data?.functionName === call.calledFunction);

      if (sourceNode && targetNode) {
        const edge: Edge = {
          id: `edge-${call.callerFunction}-${call.calledFunction}-${index}`,
          source: sourceNode.id,
          target: targetNode.id,
          type: 'default',
          data: {
            callType: call.isExternal ? 'external' : 'direct',
            sourceFunction: call.callerFunction,
            targetFunction: call.calledFunction,
            visualizationEnabled: true,
            executionOrder: index
          }
        };

        edges.push(edge);
      }
    });

    return edges;
  }

  /**
   * Applies flow changes to a flow structure
   */
  private applyFlowChanges(flow: FlowStructure, changes: FlowChange[]): FlowStructure {
    const updatedFlow = { ...flow };

    changes.forEach(change => {
      switch (change.type) {
        case 'node_added':
          if (change.newValue) {
            updatedFlow.nodes = [...updatedFlow.nodes, change.newValue];
          }
          break;

        case 'node_removed':
          if (change.nodeId) {
            updatedFlow.nodes = updatedFlow.nodes.filter(n => n.id !== change.nodeId);
            // Also remove edges connected to this node
            updatedFlow.edges = updatedFlow.edges.filter(e =>
              e.source !== change.nodeId && e.target !== change.nodeId
            );
          }
          break;

        case 'node_modified':
          if (change.nodeId && change.newValue) {
            const nodeIndex = updatedFlow.nodes.findIndex(n => n.id === change.nodeId);
            if (nodeIndex !== -1) {
              updatedFlow.nodes[nodeIndex] = { ...updatedFlow.nodes[nodeIndex], ...change.newValue };
            }
          }
          break;

        case 'edge_added':
          if (change.newValue) {
            updatedFlow.edges = [...updatedFlow.edges, change.newValue];
          }
          break;

        case 'edge_removed':
          if (change.edgeId) {
            updatedFlow.edges = updatedFlow.edges.filter(e => e.id !== change.edgeId);
          }
          break;

        case 'variable_changed':
          if (change.variableId && change.newValue) {
            const variableIndex = updatedFlow.variables.findIndex(v => v.id === change.variableId);
            if (variableIndex !== -1) {
              updatedFlow.variables[variableIndex] = { ...updatedFlow.variables[variableIndex], ...change.newValue };
            }
          }
          break;
      }
    });

    // Update metadata
    updatedFlow.metadata = {
      ...updatedFlow.metadata,
      lastModified: new Date().toISOString()
    };

    return updatedFlow;
  }

  /**
   * Finds a node ID by function name
   */
  private findNodeIdByFunctionName(functionName: string): string | null {
    if (!this.currentFlowStructure) {
      return null;
    }

    const node = this.currentFlowStructure.nodes.find(n => n.data?.functionName === functionName);
    return node ? node.id : null;
  }

  /**
   * Creates updated flow structure from code changes
   */
  private createUpdatedFlowFromChanges(
    currentFlow: FlowStructure,
    parsedStructure: ParsedFileStructure,
    _updatedCode: string
  ): FlowStructure {
    // Create new flow structure from parsed data
    const newFlow = this.createFlowFromParsedStructure(parsedStructure, currentFlow.fileName);

    // Preserve existing node positions and IDs where possible
    const updatedNodes = newFlow.nodes.map(newNode => {
      const existingNode = currentFlow.nodes.find(n => n.data?.functionName === newNode.data?.functionName);
      if (existingNode) {
        return {
          ...newNode,
          id: existingNode.id,
          position: existingNode.position,
          data: {
            ...newNode.data,
            // Preserve any visual state from existing node
            expanded: existingNode.data?.expanded,
            selected: existingNode.data?.selected
          }
        };
      }
      return newNode;
    });

    return {
      ...newFlow,
      id: currentFlow.id,
      nodes: updatedNodes,
      metadata: {
        ...newFlow.metadata,
        createdAt: currentFlow.metadata.createdAt,
        lastModified: new Date().toISOString()
      }
    };
  }

  /**
   * Detects circular dependencies in function calls
   */
  private detectCircularDependencies(nodeId: string, visited: Set<string> = new Set(), path: string[] = []): string[] {
    if (!this.currentFlowStructure) {
      return [];
    }

    if (visited.has(nodeId)) {
      // Found a cycle - return the path that creates the cycle
      const cycleStart = path.indexOf(nodeId);
      return cycleStart >= 0 ? path.slice(cycleStart).concat(nodeId) : [];
    }

    visited.add(nodeId);
    path.push(nodeId);

    // Find all outgoing edges from this node
    const outgoingEdges = this.currentFlowStructure.edges.filter(edge => edge.source === nodeId);

    for (const edge of outgoingEdges) {
      const cycle = this.detectCircularDependencies(edge.target, new Set(visited), [...path]);
      if (cycle.length > 0) {
        return cycle;
      }
    }

    return [];
  }

  /**
   * Moves a node to global scope (removes parent function reference)
   */
  private moveNodeToGlobalScope(nodeId: string): void {
    if (!this.currentFlowStructure) {
      return;
    }

    const nodeIndex = this.currentFlowStructure.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex !== -1) {
      this.currentFlowStructure.nodes[nodeIndex] = {
        ...this.currentFlowStructure.nodes[nodeIndex],
        data: {
          ...this.currentFlowStructure.nodes[nodeIndex].data,
          isNested: false,
          parentFunction: undefined,
          scope: 'global'
        }
      };
    }
  }

  /**
   * Suggests ways to break circular dependencies
   */
  private suggestCycleBreaking(nodeId: string): string[] {
    if (!this.currentFlowStructure) {
      return [];
    }

    const suggestions: string[] = [];
    const cycle = this.detectCircularDependencies(nodeId);

    if (cycle.length > 0) {
      // Suggest removing edges that would break the cycle
      for (let i = 0; i < cycle.length - 1; i++) {
        const sourceId = cycle[i];
        const targetId = cycle[i + 1];
        const sourceNode = this.currentFlowStructure.nodes.find(n => n.id === sourceId);
        const targetNode = this.currentFlowStructure.nodes.find(n => n.id === targetId);

        if (sourceNode && targetNode) {
          suggestions.push(
            `Remove call from '${sourceNode.data?.functionName}' to '${targetNode.data?.functionName}'`
          );
        }
      }
    }

    return suggestions;
  }

  /**
   * Monitors node code changes and re-analyzes function calls
   * This is the core method for automatic re-synchronization
   */
  monitorNodeCodeChanges(nodeId: string, updatedCode: string): FlowStructure {
    if (!this.currentFlowStructure) {
      throw new ASTError('No current flow structure to monitor', 'FlowCodeSynchronizer');
    }

    try {
      // Find the node that was modified
      const nodeIndex = this.currentFlowStructure.nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) {
        throw new ASTError(`Node with ID ${nodeId} not found`, 'FlowCodeSynchronizer');
      }

      // Update the node's code
      const updatedNode = {
        ...this.currentFlowStructure.nodes[nodeIndex],
        data: {
          ...this.currentFlowStructure.nodes[nodeIndex].data,
          code: updatedCode
        }
      };

      // Re-parse the entire file to get updated function calls
      const fullCode = this.reconstructFullCodeFromNodes();
      const parsedStructure = this.astParser.parseFile(fullCode);

      // Update edges based on new function calls
      const updatedEdges = this.updateEdgesFromCode(parsedStructure.calls);

      // Create updated flow structure
      const updatedFlow = {
        ...this.currentFlowStructure,
        nodes: [
          ...this.currentFlowStructure.nodes.slice(0, nodeIndex),
          updatedNode,
          ...this.currentFlowStructure.nodes.slice(nodeIndex + 1)
        ],
        edges: updatedEdges,
        metadata: {
          ...this.currentFlowStructure.metadata,
          lastModified: new Date().toISOString()
        }
      };

      this.currentFlowStructure = updatedFlow;
      this.currentCode = fullCode;

      return updatedFlow;
    } catch (error) {
      console.error('Error monitoring node code changes:', error);
      if (error instanceof ASTError) {
        throw error;
      }
      throw new ASTError(`Failed to monitor node code changes: ${(error as Error).message}`, 'FlowCodeSynchronizer');
    }
  }

  /**
   * Automatically updates edges when function calls are modified in code
   */
  autoUpdateEdgesFromCodeModification(modifiedCode: string): Edge[] {
    try {
      // Parse the modified code to extract function calls
      const parsedStructure = this.astParser.parseFile(modifiedCode);

      // Update edges based on new function calls
      const newEdges = this.updateEdgesFromCode(parsedStructure.calls);

      // Update current flow structure with new edges
      if (this.currentFlowStructure) {
        this.currentFlowStructure = {
          ...this.currentFlowStructure,
          edges: newEdges,
          metadata: {
            ...this.currentFlowStructure.metadata,
            lastModified: new Date().toISOString()
          }
        };
      }

      return newEdges;
    } catch (error) {
      console.error('Error auto-updating edges from code modification:', error);
      if (error instanceof ASTError) {
        throw error;
      }
      throw new ASTError(`Failed to auto-update edges: ${(error as Error).message}`, 'FlowCodeSynchronizer');
    }
  }

  /**
   * Handles node name changes and updates all references throughout the flow
   */
  handleNodeNameChange(_nodeId: string, oldName: string, newName: string): FlowStructure {
    if (!this.currentFlowStructure) {
      throw new ASTError('No current flow structure to update', 'FlowCodeSynchronizer');
    }

    try {
      // Update the node itself
      const updatedFlow = this.updateNodeNameReferences(oldName, newName);

      // Update the actual code to reflect the name change
      const updatedCode = this.updateFunctionNameInCode(this.currentCode, oldName, newName);

      // Re-parse to ensure consistency
      const parsedStructure = this.astParser.parseFile(updatedCode);
      const newEdges = this.updateEdgesFromCode(parsedStructure.calls);

      const finalFlow = {
        ...updatedFlow,
        edges: newEdges,
        metadata: {
          ...updatedFlow.metadata,
          lastModified: new Date().toISOString()
        }
      };

      this.currentFlowStructure = finalFlow;
      this.currentCode = updatedCode;

      return finalFlow;
    } catch (error) {
      console.error('Error handling node name change:', error);
      if (error instanceof ASTError) {
        throw error;
      }
      throw new ASTError(`Failed to handle node name change: ${(error as Error).message}`, 'FlowCodeSynchronizer');
    }
  }

  /**
   * Monitors and handles automatic re-synchronization when code changes
   */
  enableAutoSync(callback?: (updatedFlow: FlowStructure) => void): void {
    // This would typically set up file watchers or event listeners
    // For now, we'll just store the callback for manual triggering
    (this as any).autoSyncCallback = callback;
  }

  /**
   * Disables automatic synchronization
   */
  disableAutoSync(): void {
    (this as any).autoSyncCallback = undefined;
  }

  /**
   * Triggers automatic re-synchronization (would be called by file watchers)
   */
  triggerAutoSync(updatedCode: string): FlowStructure {
    const updatedFlow = this.reAnalyzeCodeChanges(updatedCode);

    // Call the callback if it exists
    const callback = (this as any).autoSyncCallback;
    if (callback && typeof callback === 'function') {
      callback(updatedFlow);
    }

    return updatedFlow;
  }

  /**
   * Detects changes between current code and new code, then applies incremental updates
   */
  detectAndApplyIncrementalChanges(newCode: string): FlowStructure {
    if (!this.currentFlowStructure) {
      throw new ASTError('No current flow structure for incremental updates', 'FlowCodeSynchronizer');
    }

    try {
      // Parse both old and new code
      const oldParsed = this.astParser.parseFile(this.currentCode);
      const newParsed = this.astParser.parseFile(newCode);

      // Detect changes in functions
      const functionChanges = this.detectFunctionChanges(oldParsed.functions, newParsed.functions);

      // Detect changes in function calls
      const callChanges = this.detectCallChanges(oldParsed.calls, newParsed.calls);

      // Apply changes incrementally
      let updatedFlow = { ...this.currentFlowStructure };

      // Apply function changes
      functionChanges.forEach(change => {
        updatedFlow = this.applyFunctionChange(updatedFlow, change);
      });

      // Apply call changes (update edges)
      if (callChanges.length > 0) {
        updatedFlow.edges = this.updateEdgesFromCode(newParsed.calls);
      }

      // Update metadata
      updatedFlow.metadata = {
        ...updatedFlow.metadata,
        lastModified: new Date().toISOString()
      };

      this.currentFlowStructure = updatedFlow;
      this.currentCode = newCode;

      return updatedFlow;
    } catch (error) {
      console.error('Error detecting and applying incremental changes:', error);
      if (error instanceof ASTError) {
        throw error;
      }
      throw new ASTError(`Failed to apply incremental changes: ${(error as Error).message}`, 'FlowCodeSynchronizer');
    }
  }

  /**
   * Compares two flow structures to identify differences
   */
  compareFlowStructures(oldFlow: FlowStructure, newFlow: FlowStructure): FlowChange[] {
    const changes: FlowChange[] = [];

    // Compare nodes
    const oldNodeMap = new Map(oldFlow.nodes.map(n => [n.data?.functionName || n.id, n]));
    const newNodeMap = new Map(newFlow.nodes.map(n => [n.data?.functionName || n.id, n]));

    // Find added nodes
    for (const [functionName, node] of newNodeMap) {
      if (!oldNodeMap.has(functionName)) {
        changes.push({
          type: 'node_added',
          newValue: node,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Find removed nodes
    for (const [functionName, node] of oldNodeMap) {
      if (!newNodeMap.has(functionName)) {
        changes.push({
          type: 'node_removed',
          nodeId: node.id,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Find modified nodes
    for (const [functionName, newNode] of newNodeMap) {
      const oldNode = oldNodeMap.get(functionName);
      if (oldNode && this.hasNodeChanged(oldNode, newNode)) {
        changes.push({
          type: 'node_modified',
          nodeId: oldNode.id,
          oldValue: oldNode,
          newValue: newNode,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Compare edges
    const oldEdgeMap = new Map(oldFlow.edges.map(e => [`${e.source}-${e.target}`, e]));
    const newEdgeMap = new Map(newFlow.edges.map(e => [`${e.source}-${e.target}`, e]));

    // Find added edges
    for (const [edgeKey, edge] of newEdgeMap) {
      if (!oldEdgeMap.has(edgeKey)) {
        changes.push({
          type: 'edge_added',
          newValue: edge,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Find removed edges
    for (const [edgeKey, edge] of oldEdgeMap) {
      if (!newEdgeMap.has(edgeKey)) {
        changes.push({
          type: 'edge_removed',
          edgeId: edge.id,
          timestamp: new Date().toISOString()
        });
      }
    }

    return changes;
  }

  /**
   * Checks if a node has changed between two versions
   */
  private hasNodeChanged(oldNode: Node, newNode: Node): boolean {
    // Compare key properties that would indicate a change
    const oldData = oldNode.data || {};
    const newData = newNode.data || {};

    return (
      oldData.description !== newData.description ||
      JSON.stringify(oldData.parameters) !== JSON.stringify(newData.parameters) ||
      oldData.returnType !== newData.returnType ||
      oldData.isNested !== newData.isNested ||
      oldData.parentFunction !== newData.parentFunction
    );
  }

  /**
   * Reconstructs full code from current nodes (used for re-parsing)
   */
  private reconstructFullCodeFromNodes(): string {
    if (!this.currentFlowStructure) {
      return this.currentCode;
    }

    // For now, return the current code as-is
    // In a more sophisticated implementation, this would reconstruct code from individual node code blocks
    return this.currentCode;
  }

  /**
   * Updates function name in code string
   */
  private updateFunctionNameInCode(code: string, oldName: string, newName: string): string {
    // Replace function declarations
    let updatedCode = code.replace(
      new RegExp(`function\\s+${oldName}\\s*\\(`, 'g'),
      `function ${newName}(`
    );

    // Replace function calls
    updatedCode = updatedCode.replace(
      new RegExp(`\\b${oldName}\\s*\\(`, 'g'),
      `${newName}(`
    );

    return updatedCode;
  }

  /**
   * Detects changes in functions between old and new parsed structures
   */
  private detectFunctionChanges(oldFunctions: FunctionMetadata[], newFunctions: FunctionMetadata[]): any[] {
    const changes: any[] = [];

    const oldFunctionMap = new Map(oldFunctions.map(f => [f.name, f]));
    const newFunctionMap = new Map(newFunctions.map(f => [f.name, f]));

    // Find added functions
    for (const [name, func] of newFunctionMap) {
      if (!oldFunctionMap.has(name)) {
        changes.push({
          type: 'function_added',
          function: func
        });
      }
    }

    // Find removed functions
    for (const [name, func] of oldFunctionMap) {
      if (!newFunctionMap.has(name)) {
        changes.push({
          type: 'function_removed',
          function: func
        });
      }
    }

    // Find modified functions
    for (const [name, newFunc] of newFunctionMap) {
      const oldFunc = oldFunctionMap.get(name);
      if (oldFunc && this.hasFunctionChanged(oldFunc, newFunc)) {
        changes.push({
          type: 'function_modified',
          oldFunction: oldFunc,
          newFunction: newFunc
        });
      }
    }

    return changes;
  }

  /**
   * Detects changes in function calls between old and new parsed structures
   */
  private detectCallChanges(oldCalls: any[], newCalls: any[]): any[] {
    const changes: any[] = [];

    const oldCallMap = new Map(oldCalls.map(c => [`${c.callerFunction}-${c.calledFunction}`, c]));
    const newCallMap = new Map(newCalls.map(c => [`${c.callerFunction}-${c.calledFunction}`, c]));

    // Find added calls
    for (const [key, call] of newCallMap) {
      if (!oldCallMap.has(key)) {
        changes.push({
          type: 'call_added',
          call
        });
      }
    }

    // Find removed calls
    for (const [key, call] of oldCallMap) {
      if (!newCallMap.has(key)) {
        changes.push({
          type: 'call_removed',
          call
        });
      }
    }

    return changes;
  }

  /**
   * Applies a function change to the flow structure
   */
  private applyFunctionChange(flow: FlowStructure, change: any): FlowStructure {
    const updatedFlow = { ...flow };

    switch (change.type) {
      case 'function_added':
        // Add new node for the function
        const newNode = this.createNodeFromFunction(change.function, flow.nodes.length);
        updatedFlow.nodes = [...updatedFlow.nodes, newNode];
        break;

      case 'function_removed':
        // Remove node for the function
        updatedFlow.nodes = updatedFlow.nodes.filter(n => n.data?.functionName !== change.function.name);
        // Also remove related edges
        updatedFlow.edges = updatedFlow.edges.filter(e =>
          e.data?.sourceFunction !== change.function.name &&
          e.data?.targetFunction !== change.function.name
        );
        break;

      case 'function_modified':
        // Update existing node
        const nodeIndex = updatedFlow.nodes.findIndex(n => n.data?.functionName === change.oldFunction.name);
        if (nodeIndex !== -1) {
          updatedFlow.nodes[nodeIndex] = {
            ...updatedFlow.nodes[nodeIndex],
            data: {
              ...updatedFlow.nodes[nodeIndex].data,
              description: change.newFunction.description,
              parameters: change.newFunction.parameters,
              returnType: change.newFunction.returnType,
              isNested: change.newFunction.isNested,
              parentFunction: change.newFunction.parentFunction,
              scope: change.newFunction.scope
            }
          };
        }
        break;
    }

    return updatedFlow;
  }

  /**
   * Creates a node from function metadata
   */
  private createNodeFromFunction(func: FunctionMetadata, index: number): Node {
    return {
      id: func.id,
      type: 'default',
      position: this.calculateNodePosition(index, index + 1),
      data: {
        label: func.name,
        description: func.description,
        functionName: func.name,
        parameters: func.parameters,
        returnType: func.returnType,
        sourceLocation: func.sourceLocation,
        isNested: func.isNested,
        parentFunction: func.parentFunction,
        scope: func.scope,
        canContainChildren: true,
        childNodes: []
      }
    };
  }

  /**
   * Checks if a function has changed between two versions
   */
  private hasFunctionChanged(oldFunc: FunctionMetadata, newFunc: FunctionMetadata): boolean {
    return (
      oldFunc.description !== newFunc.description ||
      JSON.stringify(oldFunc.parameters) !== JSON.stringify(newFunc.parameters) ||
      oldFunc.returnType !== newFunc.returnType ||
      oldFunc.isNested !== newFunc.isNested ||
      oldFunc.parentFunction !== newFunc.parentFunction ||
      oldFunc.scope !== newFunc.scope ||
      oldFunc.code !== newFunc.code
    );
  }
}