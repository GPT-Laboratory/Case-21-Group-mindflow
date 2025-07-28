import * as t from '@babel/types';
import { Node } from '@babel/types';
import { BaseExtractor } from '../core/BaseExtractor';
import { ASTTraverser, NodeVisitor } from '../interfaces/CoreInterfaces';
import { ExternalDependency } from '../types/ASTTypes';
import { NodeUtils } from '../utils/NodeUtils';
import { ValidationUtils, ASTError } from '../utils/ValidationUtils';

/**
 * DependencyExtractor refactored to follow SOLID principles and use new architecture.
 * Extends BaseExtractor and implements ASTExtractor interface.
 * Eliminates code duplication by using shared ASTTraverser and utilities.
 * Follows Single Responsibility Principle - only handles dependency extraction.
 */
export class DependencyExtractor extends BaseExtractor<ExternalDependency> {
  /**
   * Create a new DependencyExtractor instance with dependency injection.
   * 
   * @param traverser The ASTTraverser instance for consistent traversal logic
   */
  constructor(traverser: ASTTraverser) {
    super(traverser);
  }

  /**
   * Extract dependencies (imports, requires) from an AST.
   * Implements the ASTExtractor interface contract.
   * Uses visitor pattern for AST traversal with shared ASTTraverser.
   * 
   * @param ast The root AST node to extract dependencies from
   * @returns Array of external dependencies found in the AST
   * @throws ASTError if extraction fails
   */
  extract(ast: Node): ExternalDependency[] {
    try {
      // Pre-validate the AST node
      this.validateNode(ast);

      const dependencies: ExternalDependency[] = [];

      // Use visitor pattern with shared traverser
      const visitor: NodeVisitor = {
        visit: (node: Node) => {
          try {
            if (this.isImportDeclaration(node)) {
              const dependency = this.extractImportDependency(node as t.ImportDeclaration);
              if (dependency) {
                dependencies.push(dependency);
              }
            } else if (this.isRequireCall(node)) {
              const dependency = this.extractRequireDependency(node as t.CallExpression);
              if (dependency) {
                dependencies.push(dependency);
              }
            }
          } catch (error) {
            // Handle individual node extraction errors gracefully
            this.handleExtractionError(error, 'Failed to extract dependency from node', node);
          }
        }
      };

      // Traverse the AST using shared traverser
      this.traverse(ast, visitor);

      // Validate and return results
      this.validateResults(dependencies, this.validateDependency.bind(this));
      return this.postProcess(dependencies);

    } catch (error) {
      this.handleExtractionError(error, 'Failed to extract dependencies from AST', ast);
    }
  }

  /**
   * Check if a node is an import declaration using NodeUtils.
   * 
   * @param node The AST node to check
   * @returns true if the node is an import declaration
   */
  private isImportDeclaration(node: Node): node is t.ImportDeclaration {
    return NodeUtils.isImportDeclaration(node);
  }

  /**
   * Check if a node is a require call expression using NodeUtils.
   * 
   * @param node The AST node to check
   * @returns true if the node is a require call
   */
  private isRequireCall(node: Node): node is t.CallExpression {
    return NodeUtils.isCallExpression(node) && 
           t.isIdentifier((node as t.CallExpression).callee) && 
           (node as t.CallExpression).callee.name === 'require';
  }

  /**
   * Extract dependency information from an import declaration.
   * 
   * @param node The import declaration node
   * @returns ExternalDependency object or null if extraction fails
   */
  private extractImportDependency(node: t.ImportDeclaration): ExternalDependency | null {
    try {
      this.validateNode(node, 'ImportDeclaration');

      if (!t.isStringLiteral(node.source)) {
        throw new ASTError(
          'Import declaration source must be a string literal',
          this.getExtractorName(),
          this.extractSourceLocation(node)
        );
      }

      const source = node.source.value;
      this.validateDependencySource(source);

      return {
        name: source,
        type: 'import',
        source: source
      };

    } catch (error) {
      // Use safe extraction to allow partial results
      return this.safeExtract(() => {
        throw error;
      }, 'Import dependency extraction');
    }
  }

  /**
   * Extract dependency information from a require call expression.
   * 
   * @param node The call expression node
   * @returns ExternalDependency object or null if extraction fails
   */
  private extractRequireDependency(node: t.CallExpression): ExternalDependency | null {
    try {
      this.validateNode(node, 'CallExpression');

      if (node.arguments.length === 0) {
        throw new ASTError(
          'Require call must have at least one argument',
          this.getExtractorName(),
          this.extractSourceLocation(node)
        );
      }

      const firstArg = node.arguments[0];
      if (!t.isStringLiteral(firstArg)) {
        throw new ASTError(
          'Require call first argument must be a string literal',
          this.getExtractorName(),
          this.extractSourceLocation(node)
        );
      }

      const source = firstArg.value;
      this.validateDependencySource(source);

      return {
        name: source,
        type: 'require',
        source: source
      };

    } catch (error) {
      // Use safe extraction to allow partial results
      return this.safeExtract(() => {
        throw error;
      }, 'Require dependency extraction');
    }
  }

  /**
   * Validate a dependency source string.
   * 
   * @param source The dependency source to validate
   * @throws ASTError if validation fails
   */
  private validateDependencySource(source: string): void {
    if (typeof source !== 'string') {
      throw new ASTError(
        'Dependency source must be a string',
        this.getExtractorName()
      );
    }

    if (source.trim().length === 0) {
      throw new ASTError(
        'Dependency source cannot be empty',
        this.getExtractorName()
      );
    }
  }

  /**
   * Validate a single dependency object.
   * 
   * @param dependency The dependency to validate
   * @throws ASTError if validation fails
   */
  private validateDependency(dependency: ExternalDependency): void {
    if (!dependency || typeof dependency !== 'object') {
      throw new ASTError(
        'Dependency must be an object',
        this.getExtractorName()
      );
    }

    if (typeof dependency.name !== 'string' || dependency.name.trim().length === 0) {
      throw new ASTError(
        'Dependency must have a non-empty name string',
        this.getExtractorName()
      );
    }

    if (!['import', 'require', 'global'].includes(dependency.type)) {
      throw new ASTError(
        'Dependency type must be "import", "require", or "global"',
        this.getExtractorName()
      );
    }

    if (dependency.source !== undefined && typeof dependency.source !== 'string') {
      throw new ASTError(
        'Dependency source must be a string or undefined',
        this.getExtractorName()
      );
    }
  }

  /**
   * Check if the extractor can handle a specific AST node type.
   * Overrides BaseExtractor method for dependency-specific handling.
   * 
   * @param node The AST node to check
   * @returns true if the extractor can handle this node type
   */
  protected canHandle(node: Node): boolean {
    return this.isImportDeclaration(node) || this.isRequireCall(node);
  }

  /**
   * Pre-process an AST before dependency extraction.
   * Validates that the AST is suitable for dependency extraction.
   * 
   * @param ast The AST to pre-process
   * @throws ASTError if pre-processing fails
   */
  protected preProcess(ast: Node): void {
    super.preProcess(ast);

    // Additional dependency-specific validation
    if (!ast) {
      throw new ASTError(
        'AST cannot be null or undefined for dependency extraction',
        this.getExtractorName()
      );
    }
  }

  /**
   * Post-process dependency extraction results.
   * Removes duplicates and sorts dependencies.
   * 
   * @param results The extraction results to post-process
   * @returns The processed results
   */
  protected postProcess(results: ExternalDependency[]): ExternalDependency[] {
    const processedResults = super.postProcess(results);

    // Remove duplicate dependencies based on name and type
    const uniqueDependencies = this.removeDuplicateDependencies(processedResults);

    // Sort dependencies by type then by name for consistent output
    return this.sortDependencies(uniqueDependencies);
  }

  /**
   * Remove duplicate dependencies from the results.
   * 
   * @param dependencies The dependencies to deduplicate
   * @returns Array of unique dependencies
   */
  private removeDuplicateDependencies(dependencies: ExternalDependency[]): ExternalDependency[] {
    const seen = new Set<string>();
    return dependencies.filter(dep => {
      const key = `${dep.type}:${dep.name}:${dep.source || ''}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Sort dependencies by type then by name.
   * 
   * @param dependencies The dependencies to sort
   * @returns Sorted array of dependencies
   */
  private sortDependencies(dependencies: ExternalDependency[]): ExternalDependency[] {
    return dependencies.sort((a, b) => {
      // First sort by type (import before require before global)
      const typeOrder = { import: 0, require: 1, global: 2 };
      const typeComparison = typeOrder[a.type] - typeOrder[b.type];
      
      if (typeComparison !== 0) {
        return typeComparison;
      }
      
      // Then sort by name alphabetically
      return a.name.localeCompare(b.name);
    });
  }
}