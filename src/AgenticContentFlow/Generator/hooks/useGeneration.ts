/**
 * Unified Generation Hook
 * 
 * Provides state management and operations for all generation types (process, flow, hybrid).
 * Consolidates the functionality from the separate Flow and Process generation hooks.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-16
 */

import { useState, useCallback } from 'react';
import { 
  GenerationRequest, 
  GenerationResult, 
  LLMProviderInfo
} from '../generatortypes';
import { GeneratorOrchestrator } from '../core/GeneratorOrchestrator';
import { GenerationOrchestrator } from '../core/LegacyProcessGenerationOrchestrator';

export interface UseGenerationReturn {
  isGenerating: boolean;
  availableProviders: LLMProviderInfo[];
  promptHistory: string[];
  historyIndex: number;
  generateContent: (request: GenerationRequest) => Promise<GenerationResult>;
  addToHistory: (prompt: string) => void;
  navigateHistory: (direction: 'up' | 'down', currentValue: string) => string;
  resetHistory: () => void;
  loadProviders: () => LLMProviderInfo[];
  getContextNodeCount: (includeContext: boolean) => { selected: number; children: number };
}

/**
 * Unified Generation Hook
 * 
 * Provides state management and operations for all generation types (process, flow, hybrid).
 * Consolidates the functionality from the separate Flow and Process generation hooks.
 */
export const useGeneration = (): UseGenerationReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<LLMProviderInfo[]>([]);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentInput, setCurrentInput] = useState('');
  
  const orchestrator = new GeneratorOrchestrator();

  // Load available providers
  const loadProviders = useCallback(() => {
    try {
      // Use the legacy GenerationOrchestrator for provider loading until the new orchestrator is fully implemented
      const legacyOrchestrator = new GenerationOrchestrator();
      const legacyProviders = legacyOrchestrator.getAvailableProviders();
      
      // Convert legacy provider format to new LLMProviderInfo format
      const providers: LLMProviderInfo[] = legacyProviders.map(provider => ({
        ...provider,
        models: provider.provider === 'openai' ? ['gpt-4', 'gpt-3.5-turbo'] :
                provider.provider === 'gemini' ? ['gemini-pro', 'gemini-pro-vision'] :
                provider.provider === 'claude' ? ['claude-3-opus', 'claude-3-sonnet'] :
                provider.provider === 'ollama' ? ['llama2', 'codellama'] :
                ['custom-model'],
        defaultModel: provider.provider === 'openai' ? 'gpt-4' :
                     provider.provider === 'gemini' ? 'gemini-pro' :
                     provider.provider === 'claude' ? 'claude-3-sonnet' :
                     provider.provider === 'ollama' ? 'llama2' :
                     'custom-model'
      }));
      
      setAvailableProviders(providers);
      return providers;
    } catch (error) {
      console.error('Failed to load providers:', error);
      // Return empty array as fallback
      const fallbackProviders: LLMProviderInfo[] = [
        {
          provider: 'openai',
          name: 'OpenAI GPT',
          configured: false,
          preferred: false,
          models: ['gpt-4', 'gpt-3.5-turbo'],
          defaultModel: 'gpt-4'
        }
      ];
      setAvailableProviders(fallbackProviders);
      return fallbackProviders;
    }
  }, []);

  // Generate content based on request type
  const generateContent = useCallback(async (request: GenerationRequest): Promise<GenerationResult> => {
    setIsGenerating(true);
    
    try {
      console.log(`🎯 Generating ${request.type} content...`);
      
      const result = await orchestrator.generate(request);
      
      console.log(`✅ ${request.type} generation completed:`, {
        type: result.type,
        confidence: result.confidence,
        strategy: result.strategy
      });
      
      return result;
      
    } catch (error) {
      console.error(`❌ ${request.type} generation failed:`, error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [orchestrator]);

  // Prompt history management
  const addToHistory = useCallback((prompt: string) => {
    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt && (promptHistory.length === 0 || promptHistory[0] !== trimmedPrompt)) {
      setPromptHistory(prev => [trimmedPrompt, ...prev.slice(0, 19)]); // Keep last 20 prompts
    }
  }, [promptHistory]);

  const navigateHistory = useCallback((direction: 'up' | 'down', currentValue: string) => {
    if (direction === 'up') {
      if (promptHistory.length === 0) return currentValue;
      
      // Save current input when starting to navigate
      if (historyIndex === -1) {
        setCurrentInput(currentValue);
      }
      
      const newIndex = Math.min(historyIndex + 1, promptHistory.length - 1);
      setHistoryIndex(newIndex);
      return promptHistory[newIndex];
    } else {
      if (historyIndex === -1) return currentValue;
      
      if (historyIndex === 0) {
        // Go back to current input
        setHistoryIndex(-1);
        return currentInput;
      } else {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        return promptHistory[newIndex];
      }
    }
  }, [promptHistory, historyIndex, currentInput]);

  const resetHistory = useCallback(() => {
    setHistoryIndex(-1);
    setCurrentInput('');
  }, []);

  // Context node counting (simplified for now)
  const getContextNodeCount = useCallback((includeContext: boolean) => {
    if (!includeContext) return { selected: 0, children: 0 };
    
    // This would be enhanced with actual context from useSelect/useNodeContext
    // For now, return placeholder values
    return { selected: 0, children: 0 };
  }, []);

  return {
    isGenerating,
    availableProviders,
    promptHistory,
    historyIndex,
    generateContent,
    addToHistory,
    navigateHistory,
    resetHistory,
    loadProviders,
    getContextNodeCount
  };
};