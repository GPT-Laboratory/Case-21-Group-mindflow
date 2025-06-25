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
    providersLoading,
    setUpdatingNode
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

    console.log('🚀 [useGenerationForm] Starting generation:', { type, selectedNodes: selectedNodes.length, description });
    setIsGenerating(true);
    
    // Set updating state for selected node if this is a process generation
    if (type === 'process' && selectedNodes.length === 1) {
      const node = selectedNodes[0];
      console.log('🔄 [useGenerationForm] Setting updating state for node:', node.id);
      setUpdatingNode(node.id, true);
    }
    
    try {
      // Get the API configuration to use the saved model
      const apiConfig = apiKeyManager.getConfig(selectedProvider);
      const modelToUse = apiConfig?.model || localStorage.getItem('agentic_selected_model') || undefined;
      
      if (type === 'process' && selectedNodes.length === 1) {
        // Process generation for single node
        const node = selectedNodes[0];
        console.log('🎯 [useGenerationForm] Generating process for node:', { 
          nodeId: node.id, 
          nodeType: node.type, 
          provider: selectedProvider, 
          model: modelToUse 
        });
        
        // Build ProcessGenerationRequest
        const request = {
          type: 'process' as const,
          nodeId: node.id,
          nodeType: node.type,
          nodeData: {
            // Pass the complete node data structure
            ...node.data,
            // Ensure we have the current instanceCode for context
            currentInstanceCode: node.data?.instanceCode || '',
            // Include all the data fields the AI needs to understand the node
            instanceData: node.data?.instanceData || {},
            templateData: node.data?.templateData || {},
            // Include metadata about the current state
            lastGenerated: node.data?.lastGenerated,
            generationMetadata: node.data?.generationMetadata,
            // Include the user's request for what to change
            userRequest: description
          },
          provider: selectedProvider,
          model: modelToUse, // Include model
          // Add more fields as needed
        };
        
        console.log('📤 [useGenerationForm] Sending process generation request:', request);
        const result = await orchestrator.generate(request);
        console.log('📥 [useGenerationForm] Received process generation result:', result);
        
        // Call the onGenerated callback with the result
        // This will be handled by the GenerationPanel to update the node
        console.log('📞 [useGenerationForm] Calling onGenerated callback with result');
        onGenerated(result);
      } else {
        // Flow generation: use orchestrator and retry if result is empty/invalid
        console.log('🌊 [useGenerationForm] Generating flow with description:', description);
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
      console.error('❌ [useGenerationForm] Generation failed:', error);
      // Show error notification to user
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showErrorToast('Generation Failed', errorMessage);
    } finally {
      console.log('🏁 [useGenerationForm] Generation completed, clearing states');
      setIsGenerating(false);
      
      // Clear updating state for selected node if this was a process generation
      if (type === 'process' && selectedNodes.length === 1) {
        const node = selectedNodes[0];
        console.log('🔄 [useGenerationForm] Clearing updating state for node:', node.id);
        setUpdatingNode(node.id, false);
      }
    }
  }, [description, type, selectedNodes, isGenerating, onGenerated, orchestrator, selectedProvider, resetHistory, promptHistory, showErrorToast, setUpdatingNode]);

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