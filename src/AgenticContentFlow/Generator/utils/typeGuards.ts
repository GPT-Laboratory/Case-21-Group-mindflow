/**
 * Type Guards Utility
 * 
 * Type guard functions for generation requests and metadata.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-16
 */

import {
  GenerationRequest,
  ProcessGenerationRequest,
  FlowGenerationRequest,
  GenerationMetadata,
  ProcessMetadata,
  FlowMetadata,
} from '../generatortypes';

/**
 * Type guards for generation requests
 */
export const isProcessGenerationRequest = (request: GenerationRequest): request is ProcessGenerationRequest => {
  return request.type === 'process';
};

export const isFlowGenerationRequest = (request: GenerationRequest): request is FlowGenerationRequest => {
  return request.type === 'flow';
};


/**
 * Type guards for metadata - using property checking instead of inheritance
 */
export const isProcessMetadata = (metadata: any): metadata is ProcessMetadata & GenerationMetadata => {
  return metadata && typeof metadata === 'object' && 'nodeType' in metadata;
};

export const isFlowMetadata = (metadata: any): metadata is FlowMetadata => {
  return metadata && typeof metadata === 'object' && 'nodeCount' in metadata && 'edgeCount' in metadata;
};
