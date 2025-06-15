import React, { useState, useCallback, useEffect } from 'react';
import { Loader2, Send, RefreshCw } from 'lucide-react';
import { FlowGenerationService, FlowGenerationRequest } from './FlowGenerationService';
import { GenerationOrchestrator } from '../../Process/Generation/GenerationOrchestrator';
import { LLMProvider } from '../../Process/Generation/types';

interface FlowGenerationPanelProps {
  onFlowGenerated: (nodes: any[], edges: any[]) => void;
  onClose?: () => void;
}

const FlowGenerationPanel: React.FC<FlowGenerationPanelProps> = ({
  onFlowGenerated,
}) => {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [complexity, _] = useState<'simple' | 'intermediate' | 'advanced'>('simple');
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>('openai');
  const [availableProviders, setAvailableProviders] = useState<Array<{
    provider: LLMProvider;
    name: string;
    configured: boolean;
    preferred: boolean;
  }>>([]);
  
  const flowService = new FlowGenerationService();
  const orchestrator = new GenerationOrchestrator();

  // Load available providers on mount
  useEffect(() => {
    const providers = orchestrator.getAvailableProviders();
    setAvailableProviders(providers);
    
    // Set default to preferred provider if available
    const preferred = providers.find(p => p.preferred);
    if (preferred) {
      setSelectedProvider(preferred.provider);
    }
  }, []);
  
  // Expanded collection of good prompts
  const allExamplePrompts = [
    "Build a REST API workflow that fetches user data and displays it in a content list",
    "Create a data filtering system using logical nodes with conditional routing",
    "Design a user authentication flow with REST API validation and conditional access",
    "Build a content management system with page nodes and data storage",
    "Create an API data pipeline with logical processing and content display",
    "Design a conditional workflow that routes users based on their role permissions",
    "Build a dynamic content system that fetches and displays filtered API data",
    "Create a multi-step form workflow with data validation and conditional paths",
    "Design a REST API integration with error handling and fallback content",
    "Build a data transformation pipeline with logical processing and output routing",
    "Create a content filtering system with conditional display logic",
    "Design a user dashboard with REST data fetching and dynamic content rendering",
    "Build a notification system with conditional routing based on user preferences",
    "Create an API aggregation workflow that combines multiple data sources",
    "Design a content personalization system with conditional logic and display nodes",
    "Build a data validation workflow with logical checks and error routing",
    "Create a REST API polling system with conditional data processing",
    "Design a content approval workflow with conditional routing and page updates",
    "Build a data synchronization system with logical transformations and storage",
    "Create a dynamic API-driven content system with conditional display logic"
  ];

  // State for currently displayed prompts
  const [currentPrompts, setCurrentPrompts] = useState<string[]>(() => {
    const shuffled = [...allExamplePrompts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2);
  });

  // Function to get new random prompts
  const rerollPrompts = useCallback(() => {
    const shuffled = [...allExamplePrompts].sort(() => 0.5 - Math.random());
    setCurrentPrompts(shuffled.slice(0, 2));
  }, [allExamplePrompts]);

  const handleGenerate = async () => {
    if (!description.trim()) return;
    
    setIsGenerating(true);
    
    try {
      const request: FlowGenerationRequest = {
        description: description.trim(),
        complexity
      };
      
      const generatedFlow = await flowService.generateFlow(request);
      
      console.log('Generated flow:', generatedFlow);
      onFlowGenerated(generatedFlow.nodes, generatedFlow.edges);
      
      // Clear the input
      setDescription('');
      
    } catch (error) {
      console.error('Flow generation error:', error);
      // You could add error state/notification here
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isGenerating) {
      e.preventDefault();
      handleGenerate();
    }
  };


  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-[1200px] max-w-[95vw]">
        {/* Input Area */}
        <div className="relative mb-0">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe the workflow you want to create... (e.g., 'Create a todo management system with API integration and conditional routing')"
            className="w-full h-16 p-3 pr-24 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            disabled={isGenerating}
          />
          
          {/* Model Selection Dropdown */}
          <div className="absolute bottom-3 right-12 flex items-center">
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as LLMProvider)}
              disabled={isGenerating}
              className="text-xs px-0 py-0 bg-transparent border-0 border-b border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 focus:outline-none focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors min-w-0 w-20"
              title="Select AI Model"
            >
              {availableProviders.map(({ provider, name, configured }) => (
                <option key={provider} value={provider} disabled={!configured}>
                  {name} {!configured ? '(not configured)' : ''}
                </option>
              ))}
            </select>
          </div>
          
          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!description.trim() || isGenerating}
            className="absolute bottom-2 right-2 flex items-center justify-center w-8 h-8 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>

        {/* Example Prompts with Reroll Button */}
        <div className="mb-0">
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 mb-2">
            <div className="flex-1 text-xs text-gray-500 dark:text-gray-400">
              <strong>Pro tip:</strong> Be specific about APIs, data transformations, and conditional logic. 
              <span className="text-gray-600 dark:text-gray-300 ml-1">Example:</span>
              <button
                onClick={() => setDescription(currentPrompts[0])}
                disabled={isGenerating}
                className="ml-2 px-2 py-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentPrompts[0]?.length > 60 ? currentPrompts[0].substring(0, 57) + '...' : currentPrompts[0]}
              </button>
            </div>
            {/* Reroll Button on same row */}
            <button
              onClick={rerollPrompts}
              disabled={isGenerating}
              className="flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Get new suggestion"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowGenerationPanel;