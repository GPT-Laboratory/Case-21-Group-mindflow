/**
 * Process Templates Module
 * 
 * Contains template classes for generating node-specific process functions.
 * Each template encapsulates the logic for a specific node type.
 * 
 * @author Agentic Content Flow Team
 * @version 1.0.0
 * @since 2025-06-15
 */

import { GenerationRequest } from '../types';

/**
 * Base interface for all process templates
 */
export interface ProcessTemplate {
  /** Generate process code from a generation request */
  generate(request: GenerationRequest): string;
  
  /** Get list of key features implemented by this template */
  getFeatures(): string[];
  
  /** Get implementation notes and technical details */
  getImplementationNotes(): string[];
  
  /** Get usage instructions for the generated code */
  getUsageInstructions(): string[];
  
  /** Get the node type this template is designed for */
  getNodeType(): string;
}

/**
 * Abstract base class for all process templates
 */
export abstract class BaseProcessTemplate implements ProcessTemplate {
  protected nodeType: string;
  
  constructor(nodeType: string) {
    this.nodeType = nodeType;
  }
  
  abstract generate(request: GenerationRequest): string;
  abstract getFeatures(): string[];
  abstract getImplementationNotes(): string[];
  abstract getUsageInstructions(): string[];
  
  getNodeType(): string {
    return this.nodeType;
  }
  
  /**
   * Common helper to extract timeout value from instance data
   */
  protected getTimeout(instanceData: Record<string, any>): number {
    return instanceData.timeout || 30000;
  }
  
  /**
   * Common helper to get operation type with fallback
   */
  protected getOperation(instanceData: Record<string, any>, defaultOperation: string): string {
    return instanceData.operation || defaultOperation;
  }
  
  /**
   * Common helper to generate logging statements
   */
  protected generateLogging(nodeType: string, operation?: string): {
    start: string;
    success: string;
    error: string;
  } {
    const emoji = this.getNodeEmoji(nodeType);
    const operationText = operation ? ` ${operation}` : '';
    
    return {
      start: `console.log('${emoji}${operationText} processing:', { incomingData, nodeData });`,
      success: `console.log('✅${operationText} processing completed:', result);`,
      error: `console.error('❌${operationText} processing failed:', error);`
    };
  }
  
  /**
   * Get appropriate emoji for node type
   */
  private getNodeEmoji(nodeType: string): string {
    switch (nodeType) {
      case 'restnode': return '🌐';
      case 'logicalnode': return '🧠';
      case 'conditionalnode': return '🔀';
      case 'contentnode': return '👁️';
      default: return '🔄';
    }
  }
}