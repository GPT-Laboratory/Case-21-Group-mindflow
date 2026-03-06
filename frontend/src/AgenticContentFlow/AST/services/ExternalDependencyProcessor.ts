/** @format */

import { Node as ASTNode } from '@babel/types';
import {
    EnhancedContainerNode,
    ScopeContext,
    ParentChildRelationship
} from '../../Node/interfaces/ContainerNodeInterfaces';

/**
 * External dependency information
 */
export interface ExternalDependency {
    /** Name of the external function or module */
    name: string;
    /** Type of dependency (function call, import, require, etc.) */
    type: 'function_call' | 'import' | 'require' | 'global_reference';
    /** Source location in the code */
    location: {
        line: number;
        column: number;
    };
    /** Arguments passed to the function (if applicable) */
    arguments?: string[];
    /** Module path (for imports/requires) */
    modulePath?: string;
    /** Whether this is a built-in or external library */
    isBuiltIn: boolean;
}

/**
 * Result of external dependency processing
 */
export interface ExternalDependencyResult {
    /** List of detected external dependencies */
    dependencies: ExternalDependency[];
    /** Child nodes created for external dependencies */
    childNodes: EnhancedContainerNode[];
    /** Parent-child relationships created */
    relationships: ParentChildRelationship[];
}

/**
 * Service for processing external dependencies and creating child nodes
 */
export class ExternalDependencyProcessor {
    private definedFunctions = new Set<string>();
    private builtInFunctions = new Set([
        // JavaScript built-ins
        'console', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
        'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent',
        'JSON', 'Math', 'Date', 'Array', 'Object', 'String', 'Number', 'Boolean',
        'RegExp', 'Error', 'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet',
        // Node.js built-ins (common ones)
        'require', 'module', 'exports', '__dirname', '__filename', 'process', 'Buffer',
        // Browser built-ins
        'window', 'document', 'navigator', 'location', 'history', 'localStorage', 'sessionStorage',
        'fetch', 'XMLHttpRequest', 'alert', 'confirm', 'prompt'
    ]);

    private builtInModules = new Set([
        // Node.js built-in modules
        'fs', 'path', 'http', 'https', 'url', 'querystring', 'crypto',
        'os', 'util', 'events', 'stream', 'buffer', 'child_process',
        'cluster', 'dgram', 'dns', 'net', 'readline', 'repl', 'tls',
        'tty', 'vm', 'zlib', 'assert', 'constants', 'domain', 'punycode',
        'string_decoder', 'timers', 'v8',
        // Popular external modules that are commonly considered "built-in"
        'react', 'react-dom', 'lodash', 'axios', 'express'
    ]);

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
     * Process external dependencies from an AST node
     */
    processExternalDependencies(
        astNode: ASTNode,
        parentNodeId: string,
        parentScope?: ScopeContext
    ): ExternalDependencyResult {
        const dependencies: ExternalDependency[] = [];
        const childNodes: EnhancedContainerNode[] = [];
        const relationships: ParentChildRelationship[] = [];

        // Extract external dependencies from the AST
        this.extractDependencies(astNode, dependencies);

        // Create child nodes for each external dependency
        dependencies.forEach((dependency, index) => {
            const childNode = this.createDependencyChildNode(
                dependency,
                parentNodeId,
                index,
                parentScope
            );

            childNodes.push(childNode);

            // Create relationship
            const relationship: ParentChildRelationship = {
                parentId: parentNodeId,
                childId: childNode.id,
                relationshipType: 'external_dependency',
                scope: childNode.scope
            };

            relationships.push(relationship);
        });

        return {
            dependencies,
            childNodes,
            relationships
        };
    }

    /**
     * Extract dependencies from AST node recursively
     */
    private extractDependencies(node: ASTNode, dependencies: ExternalDependency[]): void {
        if (!node) return;

        // Handle different node types
        switch (node.type) {
            case 'ImportDeclaration':
                this.extractImportDependencies(node as any, dependencies);
                break;
            case 'CallExpression':
                this.extractCallExpressionDependencies(node as any, dependencies);
                break;
            case 'VariableDeclarator':
                this.extractVariableDeclaratorDependencies(node as any, dependencies);
                break;
        }

        // Recursively process child nodes
        for (const key in node) {
            const child = (node as any)[key];
            if (Array.isArray(child)) {
                child.forEach(item => {
                    if (item && typeof item === 'object' && item.type) {
                        this.extractDependencies(item, dependencies);
                    }
                });
            } else if (child && typeof child === 'object' && child.type) {
                this.extractDependencies(child, dependencies);
            }
        }
    }

    /**
     * Extract import dependencies
     */
    private extractImportDependencies(node: any, dependencies: ExternalDependency[]): void {
        if (node.source && node.source.value) {
            const modulePath = node.source.value;
            const isBuiltIn = this.isBuiltInModule(modulePath);

            // Handle different import types
            if (node.specifiers) {
                node.specifiers.forEach((specifier: any) => {
                    let name = '';
                    if (specifier.type === 'ImportDefaultSpecifier') {
                        name = specifier.local.name;
                    } else if (specifier.type === 'ImportSpecifier') {
                        name = specifier.imported.name;
                    } else if (specifier.type === 'ImportNamespaceSpecifier') {
                        name = specifier.local.name;
                    }

                    if (name) {
                        dependencies.push({
                            name,
                            type: 'import',
                            location: {
                                line: node.loc?.start?.line || 0,
                                column: node.loc?.start?.column || 0
                            },
                            modulePath,
                            isBuiltIn
                        });
                    }
                });
            }
        }
    }

    /**
     * Extract call expression dependencies
     */
    private extractCallExpressionDependencies(node: any, dependencies: ExternalDependency[]): void {
        let functionName = '';

        if (node.callee.type === 'Identifier') {
            functionName = node.callee.name;
        } else if (node.callee.type === 'MemberExpression') {
            functionName = this.getMemberExpressionName(node.callee);
        }

        if (functionName && this.isExternalFunction(functionName)) {
            const args = node.arguments?.map((arg: any) => {
                if (arg.type === 'Literal') {
                    return String(arg.value);
                } else if (arg.type === 'Identifier') {
                    return arg.name;
                } else if (arg.type === 'StringLiteral') {
                    return arg.value;
                }
                return '[complex expression]';
            }) || [];

            dependencies.push({
                name: functionName,
                type: 'function_call',
                location: {
                    line: node.loc?.start?.line || 0,
                    column: node.loc?.start?.column || 0
                },
                arguments: args,
                isBuiltIn: this.isBuiltInFunction(functionName)
            });
        }
    }

    /**
     * Extract variable declarator dependencies (for require statements)
     */
    private extractVariableDeclaratorDependencies(node: any, dependencies: ExternalDependency[]): void {
        if (node.init && node.init.type === 'CallExpression' &&
            node.init.callee && node.init.callee.name === 'require') {

            const modulePath = node.init.arguments[0]?.value;
            if (modulePath && node.id && node.id.name) {
                dependencies.push({
                    name: node.id.name,
                    type: 'require',
                    location: {
                        line: node.loc?.start?.line || 0,
                        column: node.loc?.start?.column || 0
                    },
                    modulePath,
                    isBuiltIn: this.isBuiltInModule(modulePath)
                });
            }
        }
    }

    /**
     * Get the full name of a member expression (e.g., "Math.max", "console.log")
     */
    private getMemberExpressionName(node: any): string {
        if (node.type === 'MemberExpression') {
            const object = node.object.type === 'Identifier' ? node.object.name :
                node.object.type === 'MemberExpression' ? this.getMemberExpressionName(node.object) : '';
            const property = node.property.name || node.property.value;
            return object ? `${object}.${property}` : property;
        } else if (node.type === 'Identifier') {
            return node.name;
        }
        return '';
    }

    /**
     * Check if a function is external (not locally defined)
     */
    private isExternalFunction(functionName: string): boolean {
        // Skip 'require' function calls as they are handled separately in variable declarators
        if (functionName === 'require') {
            return false;
        }

        // First check if the function is defined in the current file
        if (this.definedFunctions.has(functionName)) {
            return false; // Internal function - defined in this file
        }

        // If not found in defined functions, check if it's a built-in function
        if (this.isBuiltInFunction(functionName)) {
            return true; // External built-in function
        }

        // For unknown functions not defined in this file, assume they are external
        // This handles imported functions and other external dependencies
        return true;
    }

    /**
     * Check if a function is built-in
     */
    private isBuiltInFunction(functionName: string): boolean {
        const baseName = functionName.split('.')[0];
        return this.builtInFunctions.has(baseName);
    }

    /**
     * Check if a module is built-in
     */
    private isBuiltInModule(modulePath: string): boolean {
        return this.builtInModules.has(modulePath) || !modulePath.startsWith('.');
    }

    /**
     * Create a child node for an external dependency
     */
    private createDependencyChildNode(
        dependency: ExternalDependency,
        parentNodeId: string,
        index: number,
        parentScope?: ScopeContext
    ): EnhancedContainerNode {
        const nodeId = `${parentNodeId}-ext-dep-${index}`;

        // Create scope for the dependency
        const scope: ScopeContext = {
            level: (parentScope?.level || 0) + 1,
            variables: dependency.arguments || [],
            parentScope: parentScope,
            functionName: dependency.name
        };

        const childNode: EnhancedContainerNode = {
            id: nodeId,
            type: 'external-function',
            position: { x: 0, y: 0 }, // Will be positioned by layout algorithm
            data: {
                label: dependency.name,
                functionName: dependency.name,
                functionDescription: `External ${dependency.type}: ${dependency.name}`,
                dependencyType: dependency.type,
                isBuiltIn: dependency.isBuiltIn,
                modulePath: dependency.modulePath,
                arguments: dependency.arguments,
                location: dependency.location
            },
            parentId: parentNodeId,
            canContainChildren: false,
            expanded: false,
            depth: (parentScope?.level || 0) + 1,
            scope
        };

        return childNode;
    }
}

/**
 * Singleton instance of the external dependency processor
 */
export const externalDependencyProcessor = new ExternalDependencyProcessor();