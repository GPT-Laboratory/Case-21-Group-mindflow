import { useState, useCallback, useEffect } from 'react';
import { 
  GenerationType, 
  GenerationResult, 
  LLMProvider 
} from '../generatortypes';
import { GeneratorOrchestrator } from '../core/GeneratorOrchestrator';
import { useGenerator } from '../context/GeneratorContext';
import { useNotifications } from '../../Notifications/hooks/useNotifications';
import { apiKeyManager } from '../providers/management/APIKeyManager';

export interface GenerationFormState {
  description: string;
  setDescription: (description: string) => void;
  selectedProvider: LLMProvider;
  setSelectedProvider: (provider: LLMProvider) => void;
  handleGenerate: () => Promise<void>;
  handleSuggest: () => void;
  isGenerating: boolean;
  availableProviders: Array<{
    provider: LLMProvider;
    name: string;
    configured: boolean;
    preferred: boolean;
  }>;
  promptHistory: string[];
  historyIndex: number;
  navigateHistory: (direction: 'up' | 'down', currentValue: string) => string;
  resetHistory: () => void;
}

/**
 * Unified Generation Form Hook
 * 
 * Simplified hook that handles both flow and process generation
 * without complexity levels or redundant context options.
 */
export function useGenerationForm(
  type: GenerationType,
  selectedNodes: any[],
  onGenerated: (result: GenerationResult) => void,
  _defaultRequest?: any, // Prefixed with underscore to indicate unused parameter
  notifyError?: (title: string, message?: string) => void
): GenerationFormState {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptHistory, setPromptHistory] = useState<string[]>(() => {
    const savedHistory = localStorage.getItem('agentic_prompt_history');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Use the GeneratorContext for provider management
  const {
    selectedProvider,
    setSelectedProvider,
    availableProviders,
    providersLoading
  } = useGenerator();

  // Use notifications for error handling
  const { showErrorToast, showWarningToast } = useNotifications();

  const orchestrator = new GeneratorOrchestrator(notifyError);

  // Load initial state from localStorage
  useEffect(() => {
    const savedInput = localStorage.getItem('agentic_generation_input');
    if (savedInput) {
      setDescription(savedInput);
    }
  }, []);

  // Save description (input value) to localStorage on change
  useEffect(() => {
    localStorage.setItem('agentic_generation_input', description);
  }, [description]);

  // Save prompt history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('agentic_prompt_history', JSON.stringify(promptHistory));
  }, [promptHistory]);

  const navigateHistory = useCallback((direction: 'up' | 'down', currentValue: string) => {
    if (promptHistory.length === 0) return currentValue;

    if (direction === 'up') {
      const newIndex = historyIndex < promptHistory.length - 1 ? historyIndex + 1 : historyIndex;
      setHistoryIndex(newIndex);
      return promptHistory[newIndex] || currentValue;
    } else {
      const newIndex = historyIndex > 0 ? historyIndex - 1 : -1;
      setHistoryIndex(newIndex);
      return newIndex >= 0 ? promptHistory[newIndex] : '';
    }
  }, [promptHistory, historyIndex]);

  const resetHistory = useCallback(() => {
    setHistoryIndex(-1);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!description.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      // Get the API configuration to use the saved model
      const apiConfig = apiKeyManager.getConfig(selectedProvider);
      const modelToUse = apiConfig?.model || localStorage.getItem('agentic_selected_model') || undefined;
      
      if (type === 'process' && selectedNodes.length === 1) {
        // Process generation for single node
        const node = selectedNodes[0];
        // Build ProcessGenerationRequest
        const request = {
          type: 'process' as const,
          nodeId: node.id,
          nodeType: node.type,
          nodeData: node.data || {},
          provider: selectedProvider,
          model: modelToUse, // Include model
          // Add more fields as needed
        };
        const result = await orchestrator.generate(request);
        onGenerated(result);
      } else {
        // Flow generation: use orchestrator and retry if result is empty/invalid
        let attempts = 0;
        let result: GenerationResult | null = null;
        let lastError: any = null;
        while (attempts < 3) {
          try {
            const flowRequest = {
              type: 'flow' as const,
              description,
              provider: selectedProvider,
              model: modelToUse, // Include model
              // Optionally: nodeTypes, features, etc.
            };
            result = await orchestrator.generate(flowRequest);
            // Check if result is valid (has nodes and edges)
            if (result && result.type === 'flow' && Array.isArray(result.nodes) && result.nodes.length > 0 && Array.isArray(result.edges)) {
              break;
            }
            lastError = 'Empty or invalid flow result';
          } catch (err) {
            lastError = err;
          }
          attempts++;
        }
        if (result && result.type === 'flow' && Array.isArray(result.nodes) && result.nodes.length > 0) {
          onGenerated(result);
        } else {
          console.error('Flow generation failed after retries:', lastError);
          // Show error notification to user
          const errorMessage = lastError?.message || lastError || 'Unknown error occurred';
          showErrorToast('Flow Generation Failed', `Failed to generate flow after ${attempts} attempts: ${errorMessage}`);
        }
      }

      // Add to history and persist
      const newHistory = [description, ...promptHistory.slice(0, 9)];
      setPromptHistory(newHistory);
      setDescription('');
      resetHistory();

    } catch (error) {
      console.error('Generation failed:', error);
      // Show error notification to user
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showErrorToast('Generation Failed', errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [description, type, selectedNodes, isGenerating, onGenerated, orchestrator, selectedProvider, resetHistory, promptHistory, showErrorToast]);

  const handleSuggest = useCallback(() => {
    const suggestions = [
      "Build a REST API workflow that fetches user data and displays it",
      "Create a data filtering system with conditional routing", 
      "Design a user authentication flow with API validation",
      "Build a content management system with data storage",
      "Create an API data pipeline with processing and display",
      "Generate a form submission handler with validation",
      "Build a real-time data dashboard with live updates",
      "Create a file processing workflow with error handling"
    ];
    
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    setDescription(randomSuggestion);
    resetHistory();
  }, []);

  return {
    description,
    setDescription,
    selectedProvider,
    setSelectedProvider,
    handleGenerate,
    handleSuggest,
    isGenerating,
    availableProviders,
    promptHistory,
    historyIndex,
    navigateHistory,
    resetHistory
  };
}