import { ASTExtractor, ASTTraverser as IASTTraverser } from '../interfaces/CoreInterfaces';
import { FunctionExtractor } from '../extractors/FunctionExtractor';
import { CallExtractor } from '../extractors/CallExtractor';
import { VariableExtractor } from '../extractors/VariableExtractor';
import { CommentExtractor } from '../extractors/CommentExtractor';
import { DependencyExtractor } from '../extractors/DependencyExtractor';
import { ASTTraverser } from '../core/ASTTraverser';
import { ASTError } from '../utils/ValidationUtils';

/**
 * Factory for creating extractor instances with proper dependency injection.
 * Follows SOLID principles, especially Dependency Inversion Principle (DIP).
 * Provides abstraction layer between high-level modules and concrete extractor implementations.
 * Supports Open/Closed Principle - new extractors can be added without modifying existing code.
 * 
 * Requirements addressed:
 * - 2.4: Open/Closed Principle - extensible without modification
 * - 5.1: Dependency Inversion Principle - depends on abstractions
 * - 5.5: Dependencies injected rather than hard-coded
 * - 9.5: Factory methods for dependency injection
 * - 11.1: Simple, straightforward design (KISS)
 */
export class ExtractorFactory {
    private static readonly SUPPORTED_EXTRACTORS = [
        'function',
        'call',
        'variable',
        'comment',
        'dependency'
    ] as const;

    /**
     * Create all extractors with proper dependencies injected.
     * Returns a map of extractor type to extractor instance.
     * All extractors share the same ASTTraverser instance for consistency.
     * 
     * @param traverser The ASTTraverser instance to inject into extractors
     * @returns Map of extractor type to extractor instance
     * @throws ASTError if creation fails
     */
    static createExtractors(traverser: IASTTraverser): Map<string, ASTExtractor<any>> {
        try {
            // Validate the traverser dependency
            this.validateTraverser(traverser);

            const extractors = new Map<string, ASTExtractor<any>>();

            // Create each extractor with dependency injection
            extractors.set('function', this.createFunctionExtractor(traverser));
            extractors.set('call', this.createCallExtractor(traverser));
            extractors.set('variable', this.createVariableExtractor(traverser));
            extractors.set('comment', this.createCommentExtractor(traverser));
            extractors.set('dependency', this.createDependencyExtractor(traverser));

            // Validate all extractors were created successfully
            this.validateExtractorMap(extractors);

            return extractors;
        } catch (error) {
            if (error instanceof ASTError) {
                throw error;
            }

            throw new ASTError(
                `Failed to create extractors: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'ExtractorFactory'
            );
        }
    }

    /**
     * Create a single extractor of the specified type.
     * Follows Factory Method pattern for object creation.
     * 
     * @param type The type of extractor to create
     * @param traverser The ASTTraverser instance to inject
     * @returns An ASTExtractor instance
     * @throws ASTError if the extractor type is unknown or creation fails
     */
    static createExtractor(
        type: 'function' | 'call' | 'variable' | 'comment' | 'dependency',
        traverser: IASTTraverser
    ): ASTExtractor<any> {
        try {
            // Validate inputs
            this.validateExtractorType(type);
            this.validateTraverser(traverser);

            // Create extractor based on type
            switch (type) {
                case 'function':
                    return this.createFunctionExtractor(traverser);

                case 'call':
                    return this.createCallExtractor(traverser);

                case 'variable':
                    return this.createVariableExtractor(traverser);

                case 'comment':
                    return this.createCommentExtractor(traverser);

                case 'dependency':
                    return this.createDependencyExtractor(traverser);

                default:
                    // This should never be reached due to validation, but provides safety
                    throw new ASTError(
                        `Unsupported extractor type: ${type}. Supported types: ${this.SUPPORTED_EXTRACTORS.join(', ')}`,
                        'ExtractorFactory'
                    );
            }
        } catch (error) {
            if (error instanceof ASTError) {
                throw error;
            }

            throw new ASTError(
                `Failed to create ${type} extractor: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'ExtractorFactory'
            );
        }
    }

    /**
     * Create a FunctionExtractor instance with dependency injection.
     * 
     * @param traverser The ASTTraverser instance to inject
     * @returns A FunctionExtractor instance
     * @throws ASTError if creation fails
     */
    private static createFunctionExtractor(traverser: IASTTraverser): FunctionExtractor {
        try {
            const extractor = new FunctionExtractor(traverser);
            this.validateExtractorInterface(extractor, 'FunctionExtractor');
            return extractor;
        } catch (error) {
            throw new ASTError(
                `Failed to create FunctionExtractor: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'ExtractorFactory'
            );
        }
    }

    /**
     * Create a CallExtractor instance with dependency injection.
     * 
     * @param traverser The ASTTraverser instance to inject
     * @returns A CallExtractor instance
     * @throws ASTError if creation fails
     */
    private static createCallExtractor(traverser: IASTTraverser): CallExtractor {
        try {
            const extractor = new CallExtractor(traverser);
            this.validateExtractorInterface(extractor, 'CallExtractor');
            return extractor;
        } catch (error) {
            throw new ASTError(
                `Failed to create CallExtractor: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'ExtractorFactory'
            );
        }
    }

    /**
     * Create a VariableExtractor instance with dependency injection.
     * 
     * @param traverser The ASTTraverser instance to inject
     * @returns A VariableExtractor instance
     * @throws ASTError if creation fails
     */
    private static createVariableExtractor(traverser: IASTTraverser): VariableExtractor {
        try {
            const extractor = new VariableExtractor(traverser);
            this.validateExtractorInterface(extractor, 'VariableExtractor');
            return extractor;
        } catch (error) {
            throw new ASTError(
                `Failed to create VariableExtractor: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'ExtractorFactory'
            );
        }
    }

    /**
     * Create a CommentExtractor instance with dependency injection.
     * 
     * @param traverser The ASTTraverser instance to inject
     * @returns A CommentExtractor instance
     * @throws ASTError if creation fails
     */
    private static createCommentExtractor(traverser: IASTTraverser): CommentExtractor {
        try {
            const extractor = new CommentExtractor(traverser);
            this.validateExtractorInterface(extractor, 'CommentExtractor');
            return extractor;
        } catch (error) {
            throw new ASTError(
                `Failed to create CommentExtractor: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'ExtractorFactory'
            );
        }
    }

    /**
     * Create a DependencyExtractor instance with dependency injection.
     * 
     * @param traverser The ASTTraverser instance to inject
     * @returns A DependencyExtractor instance
     * @throws ASTError if creation fails
     */
    private static createDependencyExtractor(traverser: IASTTraverser): DependencyExtractor {
        try {
            const extractor = new DependencyExtractor(traverser);
            this.validateExtractorInterface(extractor, 'DependencyExtractor');
            return extractor;
        } catch (error) {
            throw new ASTError(
                `Failed to create DependencyExtractor: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'ExtractorFactory'
            );
        }
    }

    /**
     * Create extractors with a default ASTTraverser instance.
     * Provides convenience method when no specific traverser is needed.
     * 
     * @returns Map of extractor type to extractor instance
     * @throws ASTError if creation fails
     */
    static createExtractorsWithDefaultTraverser(): Map<string, ASTExtractor<any>> {
        try {
            const defaultTraverser = new ASTTraverser();
            return this.createExtractors(defaultTraverser);
        } catch (error) {
            throw new ASTError(
                `Failed to create extractors with default traverser: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'ExtractorFactory'
            );
        }
    }

    /**
     * Create a subset of extractors based on specified types.
     * Useful when only certain extractors are needed.
     * 
     * @param types Array of extractor types to create
     * @param traverser The ASTTraverser instance to inject
     * @returns Map of extractor type to extractor instance
     * @throws ASTError if creation fails
     */
    static createSelectedExtractors(
        types: ('function' | 'call' | 'variable' | 'comment' | 'dependency')[],
        traverser: IASTTraverser
    ): Map<string, ASTExtractor<any>> {
        try {
            // Validate inputs
            this.validateExtractorTypes(types);
            this.validateTraverser(traverser);

            const extractors = new Map<string, ASTExtractor<any>>();

            // Create only the requested extractors
            for (const type of types) {
                const extractor = this.createExtractor(type, traverser);
                extractors.set(type, extractor);
            }

            return extractors;
        } catch (error) {
            throw new ASTError(
                `Failed to create selected extractors: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'ExtractorFactory'
            );
        }
    }

    /**
     * Validate that an extractor type is supported.
     * 
     * @param type The extractor type to validate
     * @throws ASTError if the type is not supported
     */
    private static validateExtractorType(type: string): void {
        if (!type || typeof type !== 'string') {
            throw new ASTError(
                'Extractor type must be a non-empty string',
                'ExtractorFactory'
            );
        }

        if (!this.SUPPORTED_EXTRACTORS.includes(type as any)) {
            throw new ASTError(
                `Unsupported extractor type: '${type}'. Supported types: ${this.SUPPORTED_EXTRACTORS.join(', ')}`,
                'ExtractorFactory'
            );
        }
    }

    /**
     * Validate an array of extractor types.
     * 
     * @param types The extractor types to validate
     * @throws ASTError if any type is not supported
     */
    private static validateExtractorTypes(types: string[]): void {
        if (!Array.isArray(types)) {
            throw new ASTError(
                'Extractor types must be an array',
                'ExtractorFactory'
            );
        }

        if (types.length === 0) {
            throw new ASTError(
                'At least one extractor type must be specified',
                'ExtractorFactory'
            );
        }

        for (const type of types) {
            this.validateExtractorType(type);
        }
    }

    /**
     * Validate that a traverser instance is valid.
     * 
     * @param traverser The traverser to validate
     * @throws ASTError if the traverser is invalid
     */
    private static validateTraverser(traverser: any): void {
        if (!traverser) {
            throw new ASTError(
                'ASTTraverser instance is required',
                'ExtractorFactory'
            );
        }

        if (typeof traverser.traverse !== 'function') {
            throw new ASTError(
                'ASTTraverser must implement the traverse method',
                'ExtractorFactory'
            );
        }
    }

    /**
     * Validate that an extractor instance implements the required interface.
     * 
     * @param extractor The extractor instance to validate
     * @param extractorName The name of the extractor for error messages
     * @throws ASTError if the extractor doesn't implement the required interface
     */
    private static validateExtractorInterface(extractor: any, extractorName: string): void {
        if (!extractor) {
            throw new ASTError(
                `${extractorName} instance cannot be null or undefined`,
                'ExtractorFactory'
            );
        }

        if (typeof extractor.extract !== 'function') {
            throw new ASTError(
                `${extractorName} must implement the extract method`,
                'ExtractorFactory'
            );
        }
    }

    /**
     * Validate that an extractor map contains all expected extractors.
     * 
     * @param extractors The extractor map to validate
     * @throws ASTError if validation fails
     */
    private static validateExtractorMap(extractors: Map<string, ASTExtractor<any>>): void {
        if (!extractors || !(extractors instanceof Map)) {
            throw new ASTError(
                'Extractors must be a Map instance',
                'ExtractorFactory'
            );
        }

        // Check that all expected extractors are present
        for (const expectedType of this.SUPPORTED_EXTRACTORS) {
            if (!extractors.has(expectedType)) {
                throw new ASTError(
                    `Missing ${expectedType} extractor in extractor map`,
                    'ExtractorFactory'
                );
            }

            const extractor = extractors.get(expectedType);
            this.validateExtractorInterface(extractor, `${expectedType}Extractor`);
        }
    }

    /**
     * Get the list of supported extractor types.
     * 
     * @returns Array of supported extractor type strings
     */
    static getSupportedExtractorTypes(): readonly string[] {
        return [...this.SUPPORTED_EXTRACTORS];
    }

    /**
     * Check if an extractor type is supported.
     * 
     * @param type The extractor type to check
     * @returns true if the type is supported, false otherwise
     */
    static isExtractorTypeSupported(type: string): boolean {
        try {
            this.validateExtractorType(type);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Create extractors with custom traverser configuration.
     * Allows for future extensibility with traverser-specific options.
     * 
     * @param traverserOptions Optional configuration for the traverser
     * @returns Map of extractor type to extractor instance
     * @throws ASTError if creation fails
     */
    static createExtractorsWithCustomTraverser(
        traverserOptions?: { maxDepth?: number }
    ): Map<string, ASTExtractor<any>> {
        try {
            // Create traverser with custom options
            const maxDepth = traverserOptions?.maxDepth ?? 100;
            const traverser = new ASTTraverser(maxDepth);

            return this.createExtractors(traverser);
        } catch (error) {
            throw new ASTError(
                `Failed to create extractors with custom traverser: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'ExtractorFactory'
            );
        }
    }
}