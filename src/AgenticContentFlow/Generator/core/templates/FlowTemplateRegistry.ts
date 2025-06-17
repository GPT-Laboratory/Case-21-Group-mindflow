import { FlowTemplate, TemplateRegistry, Template } from '../../generatortypes';
import { userManagementTemplate } from './flow/UserManagementTemplate';

/**
 * Unified Flow Template Registry
 * 
 * Manages and provides access to predefined flow templates for the unified Generator infrastructure.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-17
 */
export class FlowTemplateRegistry implements TemplateRegistry {
  private templates: Map<string, FlowTemplate> = new Map();

  constructor() {
    this.registerDefaults();
  }

  /**
   * Register default templates
   */
  private registerDefaults(): void {
    this.register(userManagementTemplate);
    // Additional templates will be registered here as they're created
  }

  /**
   * Register a flow template
   */
  register(template: Template): void {
    if (template.type === 'flow') {
      this.templates.set(template.id, template as FlowTemplate);
    }
  }

  /**
   * Get a template by ID
   */
  getTemplate(id: string): Template | undefined {
    return this.templates.get(id);
  }

  /**
   * Get all templates
   */
  getAllTemplates(): Template[] {
    return Array.from(this.templates.values());
  }

  /**
   * Find templates by tags
   */
  findByTags(tags: string[]): Template[] {
    return this.getAllTemplates().filter(template =>
      tags.some(tag => template.tags.includes(tag))
    );
  }

  /**
   * Find templates by description keywords
   */
  findByKeywords(keywords: string[]): Template[] {
    return this.getAllTemplates().filter(template => {
      const searchText = `${template.name} ${template.description}`.toLowerCase();
      return keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
    });
  }

  /**
   * Get a template based on prompt analysis
   */
  findBestMatch(prompt: string): Template | null {
    const lowerPrompt = prompt.toLowerCase();
    
    // Direct keyword matching
    if (lowerPrompt.includes('user') && (lowerPrompt.includes('two nodes') || lowerPrompt.includes('simple'))) {
      return this.getTemplate('user-management') ?? null;
    }

    // Tag-based matching
    const keywords = lowerPrompt.split(/\s+/);
    const keywordMatches = this.findByKeywords(keywords);
    
    if (keywordMatches.length > 0) {
      return keywordMatches[0];
    }

    // Return a random template as fallback
    const allTemplates = this.getAllTemplates();
    if (allTemplates.length > 0) {
      const randomIndex = Math.floor(Math.random() * allTemplates.length);
      return allTemplates[randomIndex];
    }

    return null;
  }
}

// Export singleton instance
export const flowTemplateRegistry = new FlowTemplateRegistry();