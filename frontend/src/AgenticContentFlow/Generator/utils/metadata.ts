/**
 * Metadata Creation and Management Utility
 * 
 * Handles creation, validation, and formatting of generation metadata.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-16
 */

import {
  GenerationRequest,
  GenerationMetadata,
  ProcessMetadata,
  FlowMetadata,
} from '../generatortypes';

import { isProcessGenerationRequest, isFlowGenerationRequest } from './typeGuards';

/**
 * Generate unique request ID
 */
const generateRequestId = (): string => {
  return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create default metadata for a generation request
 */
export const createDefaultMetadata = (request: GenerationRequest): GenerationMetadata => {
  const baseMetadata: GenerationMetadata = {
    requestId: generateRequestId(),
    timestamp: Date.now(),
    version: '2.0.0'
  };

  if (isProcessGenerationRequest(request)) {
    const processMetadata: ProcessMetadata & GenerationMetadata = {
      ...baseMetadata,
      nodeType: request.nodeType,
      templateUsed: 'unified',
      tokensUsed: 0,
      generationTime: 0,
      validationScore: 0,
      confidence: 0.8 // Add required confidence property
    };
    return processMetadata;
  }

  if (isFlowGenerationRequest(request)) {
    const flowMetadata: FlowMetadata = {
      ...baseMetadata,
      nodeCount: 0,
      edgeCount: 0,
      flowType: request.type || 'intermediate',
      features: request.features || [],
      autoCorrections: 0
    };
    return flowMetadata;
  }


  return baseMetadata;
};

/**
 * Format generation metadata for display
 */
export const formatMetadata = (metadata: GenerationMetadata): Record<string, string> => {
  const formatted: Record<string, string> = {
    'Request ID': metadata.requestId,
    'Timestamp': new Date(metadata.timestamp).toLocaleString(),
    'Version': metadata.version
  };

  if ('nodeType' in metadata) {
    const processMetadata = metadata as unknown as ProcessMetadata & GenerationMetadata;
    formatted['Node Type'] = processMetadata.nodeType;
    formatted['Template'] = processMetadata.templateUsed || 'default';
    formatted['Tokens Used'] = processMetadata.tokensUsed?.toString() || '0';
    formatted['Generation Time'] = `${processMetadata.generationTime || 0}ms`;
    formatted['Validation Score'] = `${processMetadata.validationScore}/100`;
  }

  if ('nodeCount' in metadata) {
    const flowMetadata = metadata as FlowMetadata;
    formatted['Nodes'] = flowMetadata.nodeCount.toString();
    formatted['Edges'] = flowMetadata.edgeCount.toString();
    formatted['Flow Type'] = flowMetadata.flowType;
    formatted['Features'] = flowMetadata.features.join(', ') || 'None';
    formatted['Auto Corrections'] = flowMetadata.autoCorrections.toString();
  }


  return formatted;
};