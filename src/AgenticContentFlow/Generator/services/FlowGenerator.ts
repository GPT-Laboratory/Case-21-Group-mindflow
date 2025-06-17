/**
 * Flow Generator Service
 * 
 * Specialized service for generating complete flow structures with intelligent
 * node placement and connection logic.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-16
 */

import { 
  FlowGenerationRequest,
  GenerationResult,
  GeneratorConfig
} from '../generatortypes';
import { UnifiedAIService } from '../core/AIService';
import { 
  AIFlowStrategy,
  FlowGenerationOptions
} from './modules';

/**
 * Flow Generator Service
 * 
 * Handles all flow-specific generation logic using modular strategies
 */
export class FlowGenerator {
  private aiService: UnifiedAIService;
  private config: Partial<GeneratorConfig> = {};
  
  // Strategy instances
  private aiStrategy: AIFlowStrategy;

  constructor() {
    this.aiService = new UnifiedAIService();
    
    // Initialize strategies
    this.aiStrategy = new AIFlowStrategy(this.aiService);
  }

  configure(config: Partial<GeneratorConfig>): void {
    this.config = { ...this.config, ...config };
    this.aiService.configure(config);
  }

  /**
   * Generate flow structure using specified strategy
   */
  async generate(
    request: FlowGenerationRequest, 
    options: FlowGenerationOptions
  ): Promise<GenerationResult> {
    switch (options.strategy) {
      case 'ai':
        return this.aiStrategy.generate(request, options.prompt || '');
      default:
        throw new Error(`Unsupported generation strategy: ${options.strategy}`);
    }
  }
}