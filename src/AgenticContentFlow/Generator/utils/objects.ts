/**
 * Object Manipulation Utility
 * 
 * Handles cloning, merging, and object manipulation operations.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-16
 */

import { GenerationRequest } from '../generatortypes';

/**
 * Deep clone generation request for safe mutation
 */
export const cloneRequest = <T extends GenerationRequest>(request: T): T => {
  return JSON.parse(JSON.stringify(request));
};

/**
 * Merge generation configurations
 */
export const mergeConfigs = (...configs: Array<Partial<any>>): any => {
  return configs.reduce((merged, config) => ({
    ...merged,
    ...config
  }), {});
};