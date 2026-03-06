/**
 * Validation and Security Utility
 * 
 * Handles input validation, sanitization, and security checks.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-16
 */

import { GenerationRequest } from '../generatortypes';
import { isProcessGenerationRequest, isFlowGenerationRequest } from './typeGuards';

/**
 * Sanitize user input for generation
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/data:/gi, '') // Remove data: URLs
    .substring(0, 1000); // Limit length
};

/**
 * Validate generation request
 */
export const validateGenerationRequest = (request: GenerationRequest): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Common validation
  if (!request.type) {
    errors.push('Request type is required');
  }

  if (isProcessGenerationRequest(request)) {
    if (!request.nodeType) {
      errors.push('Node type is required for process generation');
    }
    if (!request.nodeId) {
      errors.push('Node ID is required for process generation');
    }
    if (!request.nodeData) {
      errors.push('Node data is required for process generation');
    }
  }

  if (isFlowGenerationRequest(request)) {
    if (!request.description || request.description.trim().length < 5) {
      errors.push('Flow description must be at least 5 characters');
    }
  }


  return {
    isValid: errors.length === 0,
    errors
  };
};