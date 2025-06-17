/**
 * Identifier Generation Utility
 * 
 * Handles generation of unique identifiers and cache keys.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-16
 */

import { GenerationRequest } from '../generatortypes';
import { isProcessGenerationRequest, isFlowGenerationRequest } from './typeGuards';

/**
 * Generate unique request ID
 */
export const generateRequestId = (): string => {
  return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create cache key for generation request
 */
export const createCacheKey = (request: GenerationRequest): string => {
  if (isProcessGenerationRequest(request)) {
    return `process_${request.nodeType}_${JSON.stringify(request.nodeData).substring(0, 50)}`;
  }
  
  if (isFlowGenerationRequest(request)) {
    return `flow_${request.description.substring(0, 50)}_${request.type || 'default'}`;
  }
  
  return `unknown_${Date.now()}`;
};