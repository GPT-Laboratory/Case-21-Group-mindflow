import { useState, useCallback, useEffect } from 'react';
import { 
  GenerationType, 
  GenerationResult, 
  LLMProvider 
} from '../generatortypes';
import { GenerationOrchestrator } from '../core/LegacyProcessGenerationOrchestrator';

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
  _defaultRequest?: any // Prefixed with underscore to indicate unused parameter
): GenerationFormState {
  const [description, setDescription] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>('openai');
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const orchestrator = new GenerationOrchestrator();

  // Load available providers
  const availableProviders = orchestrator.getAvailableProviders();

  // Set preferred provider on mount
  useEffect(() => {
    const preferred = availableProviders.find(p => p.preferred);
    if (preferred) {
      setSelectedProvider(preferred.provider);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!description.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      if (type === 'process' && selectedNodes.length === 1) {
        // Process generation for single node
        const node = selectedNodes[0];
        const context = {
          nodeId: node.id,
          nodeType: node.type,
          formData: node.data || {},
          onFieldChange: (field: string, value: any) => {
            // Handle field changes if needed
            console.log(`Field ${field} changed to:`, value);
          },
          onGenerationComplete: (result: any) => {
            onGenerated({
              type: 'process',
              code: result.code,
              nodeId: node.id,
              validation: result.validation || {},
              metadata: result.metadata || {},
              generatedAt: new Date().toISOString(),
              strategy: 'ai',
              confidence: result.confidence || 0.8
            } as GenerationResult);
          },
          onGenerationError: (error: string) => {
            console.error('Process generation error:', error);
          }
        };

        await orchestrator.generateCode(context);
      } else {
        // Flow generation
        // For now, delegate to existing flow generation system
        console.log('Flow generation with description:', description);
        
        // Create a mock flow result for now
        const mockResult: GenerationResult = {
          type: 'flow',
          nodes: [],
          edges: [],
          description,
          validation: { 
            isValid: true, 
            errors: [], 
            warnings: [],
            nodeTypeValidation: true,
            handleValidation: true,
            structureValidation: true,
            circularDependencies: false
          },
          metadata: { 
            nodeCount: 0, 
            edgeCount: 0, 
            flowType: 'workflow',
            features: [],
            autoCorrections: 0,
            requestId: 'mock',
            timestamp: Date.now(),
            version: '1.0.0'
          },
          generatedAt: new Date().toISOString(),
          strategy: 'ai',
          confidence: 0.8
        };
        
        onGenerated(mockResult);
      }

      // Add to history
      setPromptHistory(prev => [description, ...prev.slice(0, 9)]);
      setDescription('');
      resetHistory();

    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [description, type, selectedNodes, isGenerating, onGenerated, orchestrator]);

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