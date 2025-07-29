import { Edge } from '@xyflow/react';
import { FunctionCall, FunctionMetadata } from '../types/ASTTypes';
import { ASTParserService } from '../ASTParserService';
import { ParserFactory } from '../factories/ParserFactory';
import { ExtractorFactory } from '../factories/ExtractorFactory';
import { ASTTraverser } from '../core/ASTTraverser';
import * as t from '@babel/types';
import { BabelParser } from '../parsers/BabelParser';

export interface EdgeCreationOptions {
  edgeType?: string;
  animated?: boolean;
  style?: Record<string, any>;
}

export interface EdgeCreationResult {
  edges: Edge[];
  createdEdges: Edge[];
  skippedCalls: FunctionCall[];
}

export interface EdgeRemovalResult {
  remainingEdges: Edge[];
  removedEdges: Edge[];
}

export interface EdgeToCodeResult {
  updatedCode: string;
  addedCalls: FunctionCall[];
  validationErrors: string[];
}

export interface ManualEdgeValidation {
  valid: boolean;
  reason?: string;
  sourceFunction?: FunctionMetadata;
  targetFunction?: FunctionMetadata;
}

/**
 * Service for automatically managing edges based on function calls in code
 */
export class AutomaticEdgeManager {
  private astParser: ASTParserService;

  constructor(astParser?: ASTParserService) {
    if (astParser) {
      this.astParser = astParser;
    } else {
      // Create dependencies using factories
      const parser = ParserFactory.createParser('babel');
      const traverser = new ASTTraverser();
      const extractors = ExtractorFactory.createExtractors(traverser);
      this.astParser = new ASTParserService(parser, extractors);
    }
  }

  /**
   * Create edges from function calls detected in code
   * Implements single edge rule - only one edge per source-target pair
   */
  createEdgesFromFunctionCalls(
    functionCalls: FunctionCall[],
    availableFunctions: FunctionMetadata[],
    existingEdges: Edge[] = [],
    options: EdgeCreationOptions = {}
  ): EdgeCreationResult {
    const functionMap = new Map(availableFunctions.map(f => [f.name, f]));
    const existingEdgeMap = new Map(existingEdges.map(e => [`${e.source}-${e.target}`, e]));

    const createdEdges: Edge[] = [];
    const skippedCalls: FunctionCall[] = [];

    // Process each function call
    for (const call of functionCalls) {
      // Skip external calls (not in available functions)
      const targetFunction = functionMap.get(call.calledFunction);
      const sourceFunction = functionMap.get(call.callerFunction);

      if (!targetFunction || !sourceFunction) {
        skippedCalls.push(call);
        continue;
      }

      const edgeKey = `${sourceFunction.id}-${targetFunction.id}`;

      // Skip if edge already exists (single edge rule)
      if (existingEdgeMap.has(edgeKey)) {
        skippedCalls.push(call);
        continue;
      }

      // Create new edge
      const newEdge: Edge = {
        id: `edge-${sourceFunction.id}-${targetFunction.id}`,
        source: sourceFunction.id,
        target: targetFunction.id,
        type: options.edgeType || 'default',
        animated: options.animated || false,
        style: options.style || {},
        data: {
          functionCall: call,
          sourceFunction: sourceFunction.name,
          targetFunction: targetFunction.name,
          callType: call.isExternal ? 'external' : 'direct'
        }
      };

      createdEdges.push(newEdge);
      existingEdgeMap.set(edgeKey, newEdge);
    }

    const allEdges = [...existingEdges, ...createdEdges];

    return {
      edges: allEdges,
      createdEdges,
      skippedCalls
    };
  }

  /**
   * Parse code and automatically create edges from detected function calls
   */
  createEdgesFromCode(
    code: string,
    existingEdges: Edge[] = [],
    options: EdgeCreationOptions = {}
  ): EdgeCreationResult {
    try {
      const parsedStructure = this.astParser.parseFile(code);
      return this.createEdgesFromFunctionCalls(
        parsedStructure.calls,
        parsedStructure.functions,
        existingEdges,
        options
      );
    } catch (error) {
      console.error('Failed to create edges from code:', error);
      return {
        edges: existingEdges,
        createdEdges: [],
        skippedCalls: []
      };
    }
  }

  /**
   * Remove edges that no longer have corresponding function calls
   */
  removeObsoleteEdges(
    currentFunctionCalls: FunctionCall[],
    availableFunctions: FunctionMetadata[],
    existingEdges: Edge[]
  ): EdgeRemovalResult {
    const functionMap = new Map(availableFunctions.map(f => [f.name, f]));

    // Create set of valid edge keys from current function calls
    const validEdgeKeys = new Set<string>();

    for (const call of currentFunctionCalls) {
      const sourceFunction = functionMap.get(call.callerFunction);
      const targetFunction = functionMap.get(call.calledFunction);

      if (sourceFunction && targetFunction) {
        validEdgeKeys.add(`${sourceFunction.id}-${targetFunction.id}`);
      }
    }

    const remainingEdges: Edge[] = [];
    const removedEdges: Edge[] = [];

    // Check each existing edge
    for (const edge of existingEdges) {
      const edgeKey = `${edge.source}-${edge.target}`;

      if (validEdgeKeys.has(edgeKey)) {
        remainingEdges.push(edge);
      } else {
        // Only remove edges that were created from function calls
        // (check if edge has function call data)
        if (edge.data?.functionCall) {
          removedEdges.push(edge);
        } else {
          // Keep manually created edges
          remainingEdges.push(edge);
        }
      }
    }

    return {
      remainingEdges,
      removedEdges
    };
  }

  /**
   * Synchronize edges with current code state
   * Creates new edges and removes obsolete ones
   */
  synchronizeEdgesWithCode(
    code: string,
    existingEdges: Edge[],
    options: EdgeCreationOptions = {}
  ): EdgeCreationResult & EdgeRemovalResult {
    try {
      const parsedStructure = this.astParser.parseFile(code);

      // Remove obsolete edges first
      const removalResult = this.removeObsoleteEdges(
        parsedStructure.calls,
        parsedStructure.functions,
        existingEdges
      );

      // Create new edges from current function calls
      const creationResult = this.createEdgesFromFunctionCalls(
        parsedStructure.calls,
        parsedStructure.functions,
        removalResult.remainingEdges,
        options
      );

      return {
        edges: creationResult.edges,
        createdEdges: creationResult.createdEdges,
        skippedCalls: creationResult.skippedCalls,
        remainingEdges: removalResult.remainingEdges,
        removedEdges: removalResult.removedEdges
      };
    } catch (error) {
      console.error('Failed to synchronize edges with code:', error);
      return {
        edges: existingEdges,
        createdEdges: [],
        skippedCalls: [],
        remainingEdges: existingEdges,
        removedEdges: []
      };
    }
  }

  /**
   * Validate if an edge can be created between two functions
   */
  validateEdgeCreation(
    sourceFunction: FunctionMetadata,
    targetFunction: FunctionMetadata,
    existingEdges: Edge[]
  ): { valid: boolean; reason?: string } {
    // Check if edge already exists
    const existingEdge = existingEdges.find(e =>
      e.source === sourceFunction.id && e.target === targetFunction.id
    );

    if (existingEdge) {
      return {
        valid: false,
        reason: 'Edge already exists between these functions'
      };
    }

    // Check for self-loops (optional validation)
    if (sourceFunction.id === targetFunction.id) {
      return {
        valid: false,
        reason: 'Cannot create edge from function to itself'
      };
    }

    return { valid: true };
  }

  /**
   * Get function calls that would create edges between specific functions
   */
  getFunctionCallsForEdge(
    sourceFunction: FunctionMetadata,
    targetFunction: FunctionMetadata,
    functionCalls: FunctionCall[]
  ): FunctionCall[] {
    return functionCalls.filter(call =>
      call.callerFunction === sourceFunction.name &&
      call.calledFunction === targetFunction.name
    );
  }

  /**
   * Validate a manual edge creation against existing code structure
   */
  validateManualEdge(
    edge: Edge,
    availableFunctions: FunctionMetadata[],
    existingEdges: Edge[]
  ): ManualEdgeValidation {
    const functionMap = new Map(availableFunctions.map(f => [f.id, f]));

    const sourceFunction = functionMap.get(edge.source);
    const targetFunction = functionMap.get(edge.target);

    if (!sourceFunction) {
      return {
        valid: false,
        reason: `Source function with id '${edge.source}' not found`
      };
    }

    if (!targetFunction) {
      return {
        valid: false,
        reason: `Target function with id '${edge.target}' not found`
      };
    }

    // Use existing validation logic
    const validation = this.validateEdgeCreation(sourceFunction, targetFunction, existingEdges);

    return {
      valid: validation.valid,
      reason: validation.reason,
      sourceFunction,
      targetFunction
    };
  }

  /**
   * Add function call to source code when manual edge is created
   */
  addFunctionCallToCode(
    code: string,
    sourceFunction: FunctionMetadata,
    targetFunction: FunctionMetadata
  ): EdgeToCodeResult {
    const validationErrors: string[] = [];
    const addedCalls: FunctionCall[] = [];

    try {
      const babelParser = new BabelParser();
      const ast = babelParser.parse(code);

      // Find the source function in the AST
      let sourceFunctionNode: t.Function | null = null;

      const traverse = (node: t.Node, path: string[] = []) => {
        if (t.isFunctionDeclaration(node) && node.id?.name === sourceFunction.name) {
          sourceFunctionNode = node;
          return;
        }

        // Continue traversing
        for (const key in node) {
          const child = (node as any)[key];
          if (Array.isArray(child)) {
            child.forEach((item, index) => {
              if (item && typeof item === 'object' && item.type) {
                traverse(item, [...path, key, index.toString()]);
              }
            });
          } else if (child && typeof child === 'object' && child.type) {
            traverse(child, [...path, key]);
          }
        }
      };

      if (ast && (ast as any).program && (ast as any).program.body) {
        (ast as any).program.body.forEach((node: t.Node, index: number) =>
          traverse(node, ['program', 'body', index.toString()])
        );
      }

      if (!sourceFunctionNode) {
        validationErrors.push(`Source function '${sourceFunction.name}' not found in code`);
        return {
          updatedCode: code,
          addedCalls: [],
          validationErrors
        };
      }

      // Check if function call already exists
      const existingCalls = this.findFunctionCallsInNode(sourceFunctionNode, targetFunction.name);
      if (existingCalls.length > 0) {
        validationErrors.push(`Function call to '${targetFunction.name}' already exists in '${sourceFunction.name}'`);
        return {
          updatedCode: code,
          addedCalls: [],
          validationErrors
        };
      }

      // Add function call to the end of the source function body
      const updatedCode = this.insertFunctionCall(code, sourceFunction, targetFunction);

      // Create function call metadata
      const newCall: FunctionCall = {
        id: `manual_${sourceFunction.name}_calls_${targetFunction.name}`,
        callerFunction: sourceFunction.name,
        calledFunction: targetFunction.name,
        sourceLocation: {
          start: { line: sourceFunction.sourceLocation.end.line - 1, column: 2 },
          end: { line: sourceFunction.sourceLocation.end.line - 1, column: 2 + targetFunction.name.length + 2 }
        },
        isExternal: false
      };

      addedCalls.push(newCall);

      return {
        updatedCode,
        addedCalls,
        validationErrors
      };

    } catch (error) {
      validationErrors.push(`Failed to parse or modify code: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        updatedCode: code,
        addedCalls: [],
        validationErrors
      };
    }
  }

  /**
   * Find existing function calls within a function node
   */
  private findFunctionCallsInNode(functionNode: t.Function, targetFunctionName: string): t.CallExpression[] {
    const calls: t.CallExpression[] = [];

    const traverse = (node: t.Node) => {
      if (t.isCallExpression(node)) {
        if (t.isIdentifier(node.callee) && node.callee.name === targetFunctionName) {
          calls.push(node);
        }
      }

      // Continue traversing
      for (const key in node) {
        const child = (node as any)[key];
        if (Array.isArray(child)) {
          child.forEach(item => {
            if (item && typeof item === 'object' && item.type) {
              traverse(item);
            }
          });
        } else if (child && typeof child === 'object' && child.type) {
          traverse(child);
        }
      }
    };

    if (functionNode.body) {
      traverse(functionNode.body);
    }

    return calls;
  }

  /**
   * Insert function call into source function code
   */
  private insertFunctionCall(
    code: string,
    sourceFunction: FunctionMetadata,
    targetFunction: FunctionMetadata
  ): string {
    const lines = code.split('\n');

    // Find the end of the source function (before the closing brace)
    const functionStartLine = sourceFunction.sourceLocation.start.line - 1;
    const functionEndLine = sourceFunction.sourceLocation.end.line - 1;

    // Find the last meaningful line before the closing brace
    let insertLine = functionEndLine;
    for (let i = functionEndLine; i >= functionStartLine; i--) {
      const line = lines[i].trim();
      if (line === '}') {
        insertLine = i;
        break;
      }
    }

    // Determine indentation by looking at existing function content
    let indentation = '  '; // Default 2 spaces
    for (let i = functionStartLine + 1; i < insertLine; i++) {
      const line = lines[i];
      if (line.trim() && !line.trim().startsWith('//')) {
        const match = line.match(/^(\s*)/);
        if (match && match[1]) {
          indentation = match[1];
          break;
        }
      }
    }

    // Create the function call statement
    const functionCall = `${indentation}${targetFunction.name}();`;

    // Insert the function call before the closing brace
    lines.splice(insertLine, 0, functionCall);

    return lines.join('\n');
  }

  /**
   * Synchronize manual edges with code by adding missing function calls
   */
  synchronizeManualEdgesWithCode(
    code: string,
    manualEdges: Edge[],
    availableFunctions: FunctionMetadata[]
  ): EdgeToCodeResult {
    let updatedCode = code;
    const allAddedCalls: FunctionCall[] = [];
    const allValidationErrors: string[] = [];

    const functionMap = new Map(availableFunctions.map(f => [f.id, f]));

    for (const edge of manualEdges) {
      const sourceFunction = functionMap.get(edge.source);
      const targetFunction = functionMap.get(edge.target);

      if (!sourceFunction || !targetFunction) {
        allValidationErrors.push(`Invalid edge: source or target function not found for edge ${edge.id}`);
        continue;
      }

      // Skip if this edge already has a corresponding function call
      if (edge.data?.functionCall) {
        continue;
      }

      const result = this.addFunctionCallToCode(updatedCode, sourceFunction, targetFunction);

      if (result.validationErrors.length === 0) {
        updatedCode = result.updatedCode;
        allAddedCalls.push(...result.addedCalls);
      } else {
        allValidationErrors.push(...result.validationErrors);
      }
    }

    return {
      updatedCode,
      addedCalls: allAddedCalls,
      validationErrors: allValidationErrors
    };
  }

  /**
   * Remove function call from source code when manual edge is removed
   */
  removeFunctionCallFromCode(
    code: string,
    sourceFunction: FunctionMetadata,
    targetFunction: FunctionMetadata
  ): EdgeToCodeResult {
    const validationErrors: string[] = [];
    const removedCalls: FunctionCall[] = [];

    try {
      const babelParser = new BabelParser();
      const ast = babelParser.parse(code);

      // Find the source function in the AST
      let sourceFunctionNode: t.Function | null = null;

      const traverse = (node: t.Node) => {
        if (t.isFunctionDeclaration(node) && node.id?.name === sourceFunction.name) {
          sourceFunctionNode = node;
          return;
        }

        // Continue traversing
        for (const key in node) {
          const child = (node as any)[key];
          if (Array.isArray(child)) {
            child.forEach(item => {
              if (item && typeof item === 'object' && item.type) {
                traverse(item);
              }
            });
          } else if (child && typeof child === 'object' && child.type) {
            traverse(child);
          }
        }
      };

      if (ast && (ast as any).program && (ast as any).program.body) {
        (ast as any).program.body.forEach((node: t.Node) => traverse(node));
      }

      if (!sourceFunctionNode) {
        validationErrors.push(`Source function '${sourceFunction.name}' not found in code`);
        return {
          updatedCode: code,
          addedCalls: [],
          validationErrors
        };
      }

      // Check if function call exists
      const existingCalls = this.findFunctionCallsInNode(sourceFunctionNode, targetFunction.name);
      if (existingCalls.length === 0) {
        // No function call to remove, return original code
        return {
          updatedCode: code,
          addedCalls: [],
          validationErrors: []
        };
      }

      // Remove function calls from the source function
      const updatedCode = this.removeFunctionCallFromFunction(code, sourceFunction, targetFunction);

      // Create metadata for removed calls
      existingCalls.forEach((call, index) => {
        const removedCall: FunctionCall = {
          id: `removed_${sourceFunction.name}_calls_${targetFunction.name}_${index}`,
          callerFunction: sourceFunction.name,
          calledFunction: targetFunction.name,
          sourceLocation: {
            start: { line: call.loc?.start.line || 0, column: call.loc?.start.column || 0 },
            end: { line: call.loc?.end.line || 0, column: call.loc?.end.column || 0 }
          },
          isExternal: false
        };
        removedCalls.push(removedCall);
      });

      return {
        updatedCode,
        addedCalls: removedCalls, // Using addedCalls field to return removed calls for consistency
        validationErrors
      };

    } catch (error) {
      validationErrors.push(`Failed to parse or modify code: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        updatedCode: code,
        addedCalls: [],
        validationErrors
      };
    }
  }

  /**
   * Remove function call statements from source function code
   */
  private removeFunctionCallFromFunction(
    code: string,
    sourceFunction: FunctionMetadata,
    targetFunction: FunctionMetadata
  ): string {
    const lines = code.split('\n');
    const functionStartLine = sourceFunction.sourceLocation.start.line - 1;
    const functionEndLine = sourceFunction.sourceLocation.end.line - 1;

    // Find and remove lines that contain calls to the target function
    const updatedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // If we're inside the source function
      if (i >= functionStartLine && i <= functionEndLine) {
        // Check if this line contains a call to the target function
        const trimmedLine = line.trim();
        const callPattern = new RegExp(`^\\s*${targetFunction.name}\\s*\\(\\s*\\)\\s*;?\\s*$`);

        if (callPattern.test(trimmedLine)) {
          // Skip this line (remove the function call)
          continue;
        }
      }

      updatedLines.push(line);
    }

    return updatedLines.join('\n');
  }

  /**
   * Remove function calls from code when manual edges are removed
   */
  removeManualEdgeFunctionCalls(
    code: string,
    removedEdges: Edge[],
    availableFunctions: FunctionMetadata[]
  ): EdgeToCodeResult {
    let updatedCode = code;
    const allRemovedCalls: FunctionCall[] = [];
    const allValidationErrors: string[] = [];

    const functionMap = new Map(availableFunctions.map(f => [f.id, f]));

    for (const edge of removedEdges) {
      const sourceFunction = functionMap.get(edge.source);
      const targetFunction = functionMap.get(edge.target);

      if (!sourceFunction || !targetFunction) {
        allValidationErrors.push(`Invalid edge: source or target function not found for edge ${edge.id}`);
        continue;
      }

      // Only process manual edges (those without functionCall data)
      if (edge.data?.functionCall) {
        continue;
      }

      const result = this.removeFunctionCallFromCode(updatedCode, sourceFunction, targetFunction);

      if (result.validationErrors.length === 0) {
        updatedCode = result.updatedCode;
        allRemovedCalls.push(...result.addedCalls); // addedCalls contains removed calls
      } else {
        allValidationErrors.push(...result.validationErrors);
      }
    }

    return {
      updatedCode,
      addedCalls: allRemovedCalls,
      validationErrors: allValidationErrors
    };
  }

  /**
   * Complete bidirectional synchronization between edges and code
   */
  bidirectionalSync(
    code: string,
    edges: Edge[],
    availableFunctions: FunctionMetadata[],
    options: EdgeCreationOptions = {}
  ): EdgeCreationResult & EdgeRemovalResult & EdgeToCodeResult {
    // First, synchronize manual edges to code
    const manualEdges = edges.filter(edge => !edge.data?.functionCall);
    const edgeToCodeResult = this.synchronizeManualEdgesWithCode(code, manualEdges, availableFunctions);

    // Then, synchronize code to edges using the updated code
    const codeToEdgeResult = this.synchronizeEdgesWithCode(edgeToCodeResult.updatedCode, edges, options);

    return {
      ...codeToEdgeResult,
      updatedCode: edgeToCodeResult.updatedCode,
      addedCalls: edgeToCodeResult.addedCalls,
      validationErrors: edgeToCodeResult.validationErrors
    };
  }
}