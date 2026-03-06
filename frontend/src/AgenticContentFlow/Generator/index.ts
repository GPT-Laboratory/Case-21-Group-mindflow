/**
 * Unified Generator System
 * 
 * Main entry point for the consolidated generation system that unifies
 * Process, Flow, and Hybrid generation capabilities.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-16
 */

import { GeneratorOrchestrator } from './core/GeneratorOrchestrator';
import { UnifiedPromptBuilder } from './core/PromptBuilder';
import type { GeneratorConfig } from './generatortypes';
import { ValidationService } from './core/ValidationService';

// Core Generator exports
export { GeneratorOrchestrator } from './core/GeneratorOrchestrator';
export { ValidationService } from './core/ValidationService';
export { UnifiedPromptBuilder } from './core/PromptBuilder';

// Validation exports - now from unified Generator validation
export { FlowValidator } from './core/validation/FlowValidator';
export { ProcessCodeValidator as ProcessValidator } from './core/validation/ProcessValidator';

// Template exports
export { FlowTemplateRegistry, flowTemplateRegistry } from './core/templates/FlowTemplateRegistry';

// Prompt builders - unified in Generator
export { FlowPromptBuilder } from './core/prompts/FlowPromptBuilder';
export { ProcessPromptBuilder } from './core/prompts/ProcessPromptBuilder';

// Provider management
export { apiKeyManager } from './providers/management';

// UI Components
export * from './ui';

// Hooks - now from unified Generator hooks
export { useGenerationForm } from './hooks/useGenerationForm';

// Core types - explicitly export to avoid conflicts
export type {
  GeneratorConfig,
  GenerationType,
  GenerationResult,
  FlowGenerationResult,
  ProcessGenerationResult,
  LLMProviderInfo,
  BaseValidationResult
} from './generatortypes';

// Utils
export * from './utils';

// Legacy compatibility - re-export validation service for backward compatibility  
export { FlowValidator as FlowValidationService } from './core/validation/FlowValidator';

/**
 * Default configuration for the Generator system
 */
export const DEFAULT_GENERATOR_CONFIG: GeneratorConfig = {
  defaultProvider: 'openai' as const,
  generationStrategy: 'ai' as const,
  fallbackToTemplates: true,
  validationLevel: 'strict' as const,
  maxConcurrentGenerations: 3,
  cacheResults: true
};

/**
 * Create a configured generator instance
 */
export const createGenerator = (config?: Partial<GeneratorConfig>) => {
  const finalConfig = { ...DEFAULT_GENERATOR_CONFIG, ...config };
  
  const orchestrator = new GeneratorOrchestrator();
  const promptBuilder = new UnifiedPromptBuilder();
  const validationService = new ValidationService();
  
  // Configure all services with the correct config structure
  orchestrator.configure(finalConfig);
  promptBuilder.configure(finalConfig);
  validationService.configure(finalConfig);
  
  return {
    orchestrator,
    promptBuilder,
    validationService,
    config: finalConfig
  };
};