/**
 * Unified Validation Service
 * 
 * Comprehensive validation system for all generation types with security
 * analysis and quality scoring.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-16
 */

import { 
  GeneratorConfig,
  ProcessGenerationResult,
  FlowGenerationResult,
} from '../generatortypes';

import { FlowValidator } from './validation/FlowValidator';
import { ProcessCodeValidator, ValidationUtils } from './validation/ProcessValidator';

/**
 * Unified Validation Service
 * 
 * Provides comprehensive validation across all generation types
 */
export class ValidationService {
  private config: Partial<GeneratorConfig> = {};
  private processValidator: ProcessCodeValidator;
  private flowValidator: FlowValidator;

  constructor() {
    this.processValidator = new ProcessCodeValidator();
    this.flowValidator = new FlowValidator();
  }

  /**
   * Configure the validation service
   */
  configure(config: Partial<GeneratorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Validate process generation result
   */
  async validateProcessResult(result: ProcessGenerationResult): Promise<ProcessGenerationResult> {
    const validation = this.processValidator.validateCode(result.code);
    
    return {
      ...result,
      validation: {
        isValid: validation.isValid,
        errors: validation.errors.map(error => ({
          type: 'syntax_error',
          message: error,
          suggestedFix: 'Check code syntax and structure'
        })),
        warnings: validation.warnings.map(warning => ({
          type: 'best_practice',
          message: warning,
          suggestion: 'Consider improving code quality'
        })),
        syntaxValid: validation.isValid,
        securityIssues: validation.securityIssues,
        performanceWarnings: validation.performanceWarnings,
        suggestions: validation.suggestions
      }
    };
  }

  /**
   * Validate flow generation result
   */
  async validateFlowResult(result: FlowGenerationResult): Promise<FlowGenerationResult> {
    const validation = this.flowValidator.validateFlow(
      { nodes: result.nodes, edges: result.edges },
      { description: result.description }
    );
    
    return {
      ...result,
      validation: {
        isValid: validation.isValid,
        errors: validation.errors || [],
        warnings: validation.warnings || [],
        nodeTypeValidation: validation.nodeTypeValidation !== false,
        handleValidation: validation.handleValidation !== false,
        structureValidation: validation.structureValidation !== false,
        circularDependencies: validation.circularDependencies === true
      }
    };
  }

  /**
   * Validate flow using original FlowValidationService for compatibility
   */
  validateFlow(flow: any, request: any): any {
    return this.flowValidator.validateFlow(flow, request);
  }

  /**
   * Build self-correction prompt for flows
   */
  buildSelfCorrectionPrompt(invalidFlow: any, errors: any[], request: any): string {
    return this.flowValidator.buildSelfCorrectionPrompt(invalidFlow, errors, request);
  }

  /**
   * Legacy method support for ProcessCodeValidator compatibility
   */
  validateCode(code: string): any {
    return this.processValidator.validateCode(code);
  }

  /**
   * Get security score for code
   */
  getSecurityScore(code: string): number {
    return ValidationUtils.getSecurityScore(code);
  }

  /**
   * Check if code is safe
   */
  isCodeSafe(code: string): boolean {
    return ValidationUtils.isCodeSafe(code);
  }

  /**
   * Sanitize code by removing dangerous patterns
   */
  sanitizeCode(code: string): string {
    return ValidationUtils.sanitizeCode(code);
  }

  /**
   * Quick validation for real-time feedback
   */
  quickValidate(code: string): { isValid: boolean; errors: string[] } {
    return this.processValidator.quickValidate(code);
  }
}