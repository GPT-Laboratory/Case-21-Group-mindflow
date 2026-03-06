import { Node } from '@babel/types';
import { FunctionCall } from '../types/ASTTypes';
import { BaseExtractor } from '../core/BaseExtractor';
import { ASTTraverser, NodeVisitor } from '../interfaces/CoreInterfaces';
import { NodeUtils } from '../utils/NodeUtils';
import { ASTError } from '../utils/ValidationUtils';
import { BabelParser } from '../parsers/BabelParser';

/**
 * CallExtractor refactored to follow SOLID principles and use new architecture.
 * Extends BaseExtractor and implements ASTExtractor interface.
 * Eliminates duplicate traversal logic by using shared ASTTraverser.
 * Uses NodeUtils for common node operations.
 * Implements consistent error handling patterns.
 * Uses visitor pattern for AST traversal.
 * 
 * Maintains backward compatibility with the old constructor pattern.
 */
export class CallExtractor extends BaseExtractor<FunctionCall> {
  private functionStack: string[] = [];
  private definedFunctions: Set<string> = new Set();

  /**
   * Create a new CallExtractor instance with dependency injection.
   * Supports both new architecture (ASTTraverser) and legacy (BabelParser) constructors.
   * 
   * @param traverserOrParser The ASTTraverser instance for new architecture or BabelParser for legacy
   */
  constructor(traverserOrParser: ASTTraverser | BabelParser) {
    // Determine the traverser to use and call super() unconditionally
    const traverser = (traverserOrParser && 'parse' in traverserOrParser)
      ? // Legacy constructor - create a simple traverser internally
      {
        traverse: (node: Node, visitor: NodeVisitor) => {
          this.legacyTraverse(node, visitor);
        }
      } as ASTTraverser
      : // New architecture constructor
      traverserOrParser as ASTTraverser;

    super(traverser);
  }

  /**
   * Legacy traversal method for backward compatibility.
   * Implements the old traversal logic when using BabelParser constructor.
   * 
   * @param node The node to traverse
   * @param visitor The visitor to apply
   */
  private legacyTraverse(node: Node, visitor: NodeVisitor): void {
    if (!NodeUtils.isValidNode(node)) return;

    visitor.visit(node);

    // Traverse children using the old logic
    for (const key in node) {
      if (!NodeUtils.shouldTraverseProperty(key)) continue;

      const child = (node as any)[key];
      if (Array.isArray(child)) {
        child.forEach(item => {
          if (NodeUtils.isValidNode(item)) {
            this.legacyTraverse(item, visitor);
          }
        });
      } else if (NodeUtils.isValidNode(child)) {
        this.legacyTraverse(child, visitor);
      }
    }
  }

  /**
   * Set the list of functions defined in the current file.
   * This is used to determine if function calls are internal or external.
   * 
   * @param functionNames Array of function names defined in the current file
   */
  setDefinedFunctions(functionNames: string[]): void {
    this.definedFunctions = new Set(functionNames);
  }

  /**
   * Extract function calls from the AST using the new architecture.
   * Follows Single Responsibility Principle - only handles call extraction.
   * Uses shared traversal logic to eliminate code duplication.
   * 
   * @param ast The root AST node to extract calls from
   * @returns Array of extracted function calls
   * @throws ASTError if extraction fails
   */
  extract(ast: Node): FunctionCall[] {
    try {
      this.validateNode(ast);

      const calls: FunctionCall[] = [];
      this.functionStack = [];
      this.definedFunctions.clear();

      // First pass: collect all function definitions
      const functionCollector: NodeVisitor = {
        visit: (node: Node) => {
          if (this.isFunctionNode(node)) {
            const functionName = this.getFunctionName(node);
            if (functionName && functionName !== 'anonymous') {
              this.definedFunctions.add(functionName);
            }
          }
        }
      };

      this.traverse(ast, functionCollector);

      // Second pass: extract function calls with proper internal/external classification
      const visitor: NodeVisitor = {
        visit: (node: Node) => {
          this.processNode(node, calls);
        }
      };

      this.traverse(ast, visitor);

      this.validateResults(calls, this.validateFunctionCall.bind(this));
      return calls;

    } catch (error) {
      this.handleExtractionError(error, 'Function call extraction failed', ast);
    }
  }

  /**
   * Process a single AST node to extract function calls and track function context.
   * Handles both function declarations and call expressions.
   * 
   * @param node The AST node to process
   * @param calls The array to collect function calls
   */
  private processNode(node: Node, calls: FunctionCall[]): void {
    try {
      // Track function context for proper caller identification
      if (this.isFunctionNode(node)) {
        this.enterFunction(node);
        return;
      }

      // Extract function calls
      if (this.isCallExpression(node)) {
        const call = this.extractFunctionCall(node);
        if (call) {
          calls.push(call);
        }
      }
    } catch (error) {
      // Use safe extraction to continue processing other nodes
      this.safeExtract(() => {
        throw error;
      }, `Processing node of type ${node.type}`);
    }
  }

  /**
   * Check if a node is a function using shared NodeUtils.
   * 
   * @param node The node to check
   * @returns true if the node is a function, false otherwise
   */
  private isFunctionNode(node: Node): boolean {
    return NodeUtils.isFunctionNode(node) || NodeUtils.isMethodDefinition(node);
  }

  /**
   * Check if a node is a call expression using shared NodeUtils.
   * 
   * @param node The node to check
   * @returns true if the node is a call expression, false otherwise
   */
  private isCallExpression(node: Node): boolean {
    return NodeUtils.isCallExpression(node);
  }

  /**
   * Enter a function context and update the function stack.
   * Tracks nested function contexts for proper caller identification.
   * 
   * @param node The function node being entered
   */
  private enterFunction(node: Node): void {
    const functionName = this.getFunctionName(node);
    this.functionStack.push(functionName);
  }

  /**
   * Get function name using shared NodeUtils with fallback handling.
   * 
   * @param node The function node
   * @returns The function name or 'anonymous' if not determinable
   */
  private getFunctionName(node: Node): string {
    try {
      if (NodeUtils.isFunctionNode(node)) {
        return NodeUtils.getFunctionName(node as any);
      }
      if (NodeUtils.isMethodDefinition(node)) {
        return NodeUtils.getMethodName(node as any);
      }
      return 'anonymous';
    } catch (error) {
      // Fallback to anonymous if name extraction fails
      return 'anonymous';
    }
  }

  /**
   * Extract a function call from a call expression node.
   * Creates a FunctionCall object with proper metadata.
   * 
   * @param node The call expression node
   * @returns The extracted function call or null if extraction fails
   */
  private extractFunctionCall(node: Node): FunctionCall | null {
    try {
      this.validateNode(node, 'CallExpression');

      const calledFunction = this.getCalledFunctionName(node);
      const currentFunction = this.getCurrentFunction();

      if (!calledFunction || !currentFunction) {
        return null;
      }

      return {
        id: this.generateCallId(currentFunction, calledFunction),
        callerFunction: currentFunction,
        calledFunction,
        sourceLocation: this.extractSourceLocation(node),
        isExternal: this.isExternalCall(calledFunction)
      };

    } catch (error) {
      // Return null for failed extractions to allow partial processing
      return null;
    }
  }

  /**
   * Get the called function name from a call expression using shared NodeUtils.
   * 
   * @param node The call expression node
   * @returns The called function name or null if not determinable
   */
  private getCalledFunctionName(node: Node): string | null {
    try {
      return NodeUtils.getCalledFunctionName(node as any);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get the current function context from the function stack.
   * 
   * @returns The current function name or null if not in a function
   */
  private getCurrentFunction(): string | null {
    return this.functionStack.length > 0 ? this.functionStack[this.functionStack.length - 1] : null;
  }

  /**
   * Generate a unique identifier for a function call.
   * 
   * @param callerFunction The name of the calling function
   * @param calledFunction The name of the called function
   * @returns A unique call identifier
   */
  private generateCallId(callerFunction: string, calledFunction: string): string {
    const timestamp = Date.now().toString(36);
    return `${callerFunction}_calls_${calledFunction}_${timestamp}`;
  }

  /**
   * Determine if a function call is external (not defined in the current file).
   * First checks if the function is defined in the current file, then falls back to common patterns.
   * 
   * @param functionName The name of the called function
   * @returns true if the call is external, false if it's internal
   */
  private isExternalCall(functionName: string): boolean {
    // First check if the function is defined in the current file
    if (this.definedFunctions.has(functionName)) {
      return false; // Internal call - function is defined in this file
    }

    // If not found in defined functions, check common external patterns
    const externalPatterns = [
      'console', 'require', 'import', 'setTimeout', 'setInterval',
      'JSON', 'Math', 'Date', 'Array', 'Object', 'String', 'Number',
      'log' // Add 'log' as it's commonly imported from external modules
    ];

    // Check if it matches known external patterns
    const isKnownExternal = externalPatterns.some(pattern =>
      functionName.startsWith(pattern) || functionName === pattern
    );

    // If it matches known external patterns, it's external
    if (isKnownExternal) {
      return true;
    }

    // For unknown functions not defined in this file, assume they are external
    // This handles imported functions that aren't in our hardcoded list
    return true;
  }

  /**
   * Validate a function call object.
   * Ensures the call has all required properties and valid values.
   * 
   * @param call The function call to validate
   * @throws ASTError if validation fails
   */
  private validateFunctionCall(call: FunctionCall): void {
    if (!call.id || typeof call.id !== 'string') {
      throw new ASTError('Function call must have a valid id', this.getExtractorName());
    }

    if (!call.callerFunction || typeof call.callerFunction !== 'string') {
      throw new ASTError('Function call must have a valid caller function', this.getExtractorName());
    }

    if (!call.calledFunction || typeof call.calledFunction !== 'string') {
      throw new ASTError('Function call must have a valid called function', this.getExtractorName());
    }

    if (!call.sourceLocation) {
      throw new ASTError('Function call must have source location', this.getExtractorName());
    }

    if (typeof call.isExternal !== 'boolean') {
      throw new ASTError('Function call must have valid isExternal flag', this.getExtractorName());
    }
  }

  /**
   * Override canHandle to specify this extractor handles call expressions.
   * 
   * @param node The AST node to check
   * @returns true if this extractor can handle the node type
   */
  protected canHandle(node: Node): boolean {
    return this.isCallExpression(node) || this.isFunctionNode(node);
  }

  /**
   * Override preProcess to reset function stack before extraction.
   * 
   * @param ast The AST to pre-process
   */
  protected preProcess(ast: Node): void {
    super.preProcess(ast);
    this.functionStack = [];
  }

  /**
   * Override postProcess to clean up function stack after extraction.
   * 
   * @param results The extraction results to post-process
   * @returns The processed results
   */
  protected postProcess(results: FunctionCall[]): FunctionCall[] {
    this.functionStack = [];
    return super.postProcess(results);
  }

  /**
   * Legacy method for backward compatibility.
   * Delegates to the new extract method.
   * 
   * @param ast The AST node to extract calls from
   * @returns Array of extracted function calls
   * @deprecated Use extract() method instead
   */
  identifyFunctionCalls(ast: Node): FunctionCall[] {
    return this.extract(ast);
  }
}