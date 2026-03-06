/** @format */

import { ASTParserService } from '../ASTParserService';
import { ExternalDependencyResult } from './ExternalDependencyProcessor';
import { FunctionMetadata, FunctionCall } from '../types/ASTTypes';
import { ParserFactory } from '../factories/ParserFactory';
import { ExtractorFactory } from '../factories/ExtractorFactory';
import { ASTTraverser } from '../core/ASTTraverser';
import { useCodeStore } from '../../../stores/codeStore';
import './ASTNodeTypeRegistration'; // Ensure AST node types are registered

/**
 * Flow node types
 */
export type FlowNodeType = 'ast-flownode' | 'ast-functionnode' | 'ast-childnode' | 'external-function';

/**
 * Flow node interface
 */
export interface FlowNode {
  id: string;
  type: FlowNodeType;
  parentId?: string;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    fileName?: string;
    functionName?: string;
    isContainer?: boolean;
    layoutDirection?: 'TB' | 'LR';
    variables?: Record<string, any>;
    [key: string]: any;
  };
  style?: {
    width?: number;
    height?: number;
    [key: string]: any;
  };
}

/**
 * Flow edge interface
 */
export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

/**
 * Flow structure interface
 */
export interface Flow {
  id: string;
  name: string;
  description: string;
  lastModified: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  type: 'module' | 'function' | 'flow';
}

/**
 * Service for generating flow JSON from JavaScript code
 */
export class FlowGenerator {
  private astParser: ASTParserService;
  private edgeIdCounter = 0;

  constructor() {
    // Create dependencies using factories
    const parser = ParserFactory.createParser('babel');
    const traverser = new ASTTraverser();
    const extractors = ExtractorFactory.createExtractors(traverser);
    this.astParser = new ASTParserService(parser, extractors);
  }

  /**
   * Generate a flow from JavaScript code
   */
  generateFlow(
    code: string,
    fileName: string,
    flowId?: string,
    flowName?: string
  ): Flow {
    // Parse the file with external dependencies
    const parseResult = this.astParser.parseFileWithChildNodes(code, fileName || 'unknown');
    
    // Debug: Check if code store is populated
    const codeStore = useCodeStore.getState();
    console.log('🔍 FlowGenerator: Code store state after parsing:', {
      fileName,
      sourceFilesCount: codeStore.sourceFiles.size,
      functionLocationsCount: codeStore.functionLocations.size,
      hasSourceCode: !!codeStore.getSourceCode(fileName || 'unknown'),
      sourceCodeLength: codeStore.getSourceCode(fileName || 'unknown')?.length || 0
    });

    // Reset counters for this flow
    this.edgeIdCounter = 0;

    // Extract module-level information
    const moduleTitle = this.extractModuleTitle(parseResult.comments);
    const moduleDescription = this.extractModuleDescription(parseResult.comments);

    // Create container node for the module
    const containerNode = this.createContainerNode(fileName, moduleTitle, moduleDescription, code);
    const nodes: FlowNode[] = [containerNode];

    // Create function nodes
    const functionNodes = parseResult.functions.map((func, index) =>
      this.createFunctionNode(func, containerNode.id, index, code)
    );
    nodes.push(...functionNodes);

    console.log('🏭 FlowGenerator: Created nodes:', {
      containerNode: {
        id: containerNode.id,
        type: containerNode.type,
        expanded: containerNode.data.expanded,
        filePath: containerNode.data.filePath
      },
      functionNodes: functionNodes.map(fn => ({
        id: fn.id,
        type: fn.type,
        parentId: fn.parentId,
        functionName: fn.data.functionName,
        filePath: fn.data.filePath,
        hasDescription: !!fn.data.functionDescription
      }))
    });

    // Create external dependency child nodes
    const externalNodes: FlowNode[] = [];
    parseResult.functions.forEach(func => {
      const extDeps = parseResult.externalDependencyResults.get(func.id);
      if (extDeps) {
        const childNodes = this.createExternalDependencyNodes(extDeps, func.id);
        externalNodes.push(...childNodes);
      }
    });
    nodes.push(...externalNodes);

    // Create edges for function calls
    const edges = this.createEdges(parseResult.calls, parseResult.externalDependencyResults, functionNodes);

    return {
      id: flowId || this.generateId(),
      name: flowName || moduleTitle || fileName,
      description: moduleDescription || `Flow generated from ${fileName}`,
      lastModified: new Date().toISOString().split('T')[0],
      nodes,
      edges,
      type: 'module'
    };
  }

  /**
   * Generate multiple flows from multiple JavaScript files
   */
  generateFlows(files: Array<{ code: string; fileName: string }>): Flow[] {
    return files.map((file, index) =>
      this.generateFlow(file.code, file.fileName, (index + 1).toString())
    );
  }

  /**
   * Create a container node for a module
   */
  private createContainerNode(fileName: string, title?: string, description?: string, code?: string): FlowNode {
    return {
      id: 'container-'+fileName,
      type: 'ast-flownode',
      data: {
        label: title || `${fileName} Module`,
        description: description,
        fileName: fileName,
        filePath: fileName, // Reference to code store
        isContainer: true,
        layoutDirection: 'LR',
        expanded: true // Make container initially open
      },
      position: { x: 0, y: 0 },
    };
  }

  /**
   * Create a function node
   */
  private createFunctionNode(func: FunctionMetadata, parentId: string, index: number, fullCode?: string): FlowNode {
    return {
      id: func.id,
      type: 'ast-functionnode',
      parentId: parentId,
      position: { x: 150, y: 80 + (index * 70) },
      data: {
        label: func.name,
        description: func.description,
        functionName: func.name,
        functionDescription: func.description, // Add this for CleanNodeDisplay
        parameters: func.parameters,
        isNested: func.isNested,
        filePath: func.filePath, // Store the file path for code retrieval
        returnType: func.returnType,
        sourceLocation: func.sourceLocation
      }
    };
  }

  /**
   * Create external dependency child nodes
   */
  private createExternalDependencyNodes(
    extDeps: ExternalDependencyResult,
    parentFunctionId: string
  ): FlowNode[] {
    return extDeps.childNodes.map((childNode, index) => ({
      id: childNode.id,
      type: 'ast-childnode' as FlowNodeType,
      parentId: parentFunctionId,
      position: { x: 300, y: 80 + (index * 30) },
      data: {
        label: (childNode.data.label as string) || 'Unknown',
        description: (childNode.data.functionDescription as string) || undefined,
        functionName: (childNode.data.functionName as string) || 'unknown',
        dependencyType: (childNode.data as any).dependencyType,
        isBuiltIn: (childNode.data as any).isBuiltIn,
        modulePath: (childNode.data as any).modulePath
      }
    }));
  }

  /**
   * Create edges for function calls
   */
  private createEdges(
    calls: FunctionCall[],
    externalDeps: Map<string, ExternalDependencyResult>,
    functionNodes: FlowNode[]
  ): FlowEdge[] {
    const edges: FlowEdge[] = [];

    // Create a mapping from function names to node IDs
    const functionNameToNodeId = new Map<string, string>();
    functionNodes.forEach(node => {
      if (node.data.functionName) {
        functionNameToNodeId.set(node.data.functionName, node.id);
      }
    });

    // Create edges for internal function calls
    calls.forEach(call => {
      if (!call.isExternal) {
        const sourceNodeId = functionNameToNodeId.get(call.callerFunction);
        const targetNodeId = functionNameToNodeId.get(call.calledFunction);
        
        if (sourceNodeId && targetNodeId) {
          edges.push({
            id: `e${this.edgeIdCounter++}`,
            source: sourceNodeId,
            target: targetNodeId
          });
        } else {
          console.warn(`Could not create edge: ${call.callerFunction} -> ${call.calledFunction}`, {
            sourceNodeId,
            targetNodeId,
            availableFunctions: Array.from(functionNameToNodeId.keys())
          });
        }
      }
    });

    // Note: External dependency child nodes don't need edges - they are visually contained within their parent function

    return edges;
  }

  /**
   * Extract module title from comments
   */
  private extractModuleTitle(comments: any[]): string {
    // Look for the first block comment that contains @title
    // This should be the module-level comment even if it's associated with a function
    const titleComment = comments.find(comment =>
      comment.type === 'block' &&
      comment.value.includes('@title')
    );

    if (titleComment) {
      // Extract title from multiline comment
      const lines = titleComment.value.split('\n');
      for (const line of lines) {
        const match = line.match(/\*?\s*@title\s+(.+)/);
        if (match) {
          return match[1].trim();
        }
      }
    }

    return '';
  }

  /**
   * Extract module description from comments
   */
  private extractModuleDescription(comments: any[]): string {
    // Look for the first block comment that contains @description
    // This should be the module-level comment even if it's associated with a function
    const descComment = comments.find(comment =>
      comment.type === 'block' &&
      comment.value.includes('@description')
    );

    if (descComment) {
      // Extract description from multiline comment
      const lines = descComment.value.split('\n');
      for (const line of lines) {
        const match = line.match(/\*?\s*@description\s+(.+)/);
        if (match) {
          return match[1].trim();
        }
      }
    }

    return '';
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

/**
 * Singleton instance of the flow generator
 */
export const flowGenerator = new FlowGenerator();