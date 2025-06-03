// Re-export the new ProcessProvider and hook for compatibility
export { ProcessProvider as default, useProcessContext } from './ProcessContext';

// Legacy compatibility - this file now just re-exports the new ProcessContext
// All existing imports will continue to work