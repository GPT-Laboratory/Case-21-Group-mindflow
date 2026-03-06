/**
 * Template Registry and Factory
 * 
 * Central registry for all process templates with factory methods for
 * creating and managing template instances.
 */

import { ProcessTemplate } from './base';
import { UniversalProcessTemplate } from './nodeTemplates';

/**
 * Template Registry
 * 
 * Manages process templates with a node-agnostic approach.
 * Uses a single universal template that adapts to any node type.
 */
export class TemplateRegistry {
  private universalTemplate: ProcessTemplate;
  
  constructor() {
    this.universalTemplate = new UniversalProcessTemplate();
  }
  
  /**
   * Get a template instance for any node type
   * Returns the universal template that works with all node types
   */
  getTemplate(_nodeType: string): ProcessTemplate {
    return this.universalTemplate;
  }
  
  /**
   * Check if a template exists for a node type
   * Always returns true since the universal template works with all nodes
   */
  hasTemplate(_nodeType: string): boolean {
    return true;
  }
  
  /**
   * Get all supported node types
   * Returns empty array since we support all types universally
   */
  getRegisteredNodeTypes(): string[] {
    return ['universal'];
  }
  
  /**
   * Get the universal template (same as getTemplate for any node type)
   */
  getGenericTemplate(): ProcessTemplate {
    return this.universalTemplate;
  }
}

// Export all template classes
export * from './base';
export * from './nodeTemplates';