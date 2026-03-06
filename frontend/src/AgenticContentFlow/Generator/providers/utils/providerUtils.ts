/**
 * Provider Utilities
 * 
 * Shared utility functions for LLM providers to avoid code duplication.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-17
 */

/**
 * Extract code from markdown blocks
 * Handles both JavaScript and generic code blocks
 */
export function extractCodeFromMarkdown(content: string): string {
  const codeMatch = content.match(/```(?:javascript|js)?\n([\s\S]*?)\n```/);
  return codeMatch ? codeMatch[1].trim() : content.trim();
}

/**
 * Create legacy compatibility metadata fields
 */
export function createLegacyMetadata(providerName: string): {
  explanation: string;
  suggestions: string[];
  warnings: string[];
} {
  const baseMessage = `Generated using ${providerName} with process-specific prompt`;
  const baseSuggestions = [
    'Review generated code for your specific requirements',
    'Test with sample data'
  ];

  return {
    explanation: baseMessage,
    suggestions: baseSuggestions,
    warnings: []
  };
}