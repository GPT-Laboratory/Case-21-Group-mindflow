import React from 'react';
import { 
  GenerationType, 
  GenerationResult 
} from '../../generatortypes';
import { useSelect } from '../../../Select/contexts/SelectContext';
import { useInputFocusHandlers } from '../../../Panel/hooks/useInputFocusHandlers';
import { useGenerationForm } from '../../hooks/useGenerationForm';
import { MoreHorizontal, Lightbulb } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '../../../../components/ui/dropdown-menu';
import { GenerationInput } from './GenerationInput';
import { GenerationStatus } from './GenerationStatus';

export interface GenerationPanelProps {
  type?: GenerationType;
  onGenerated: (result: GenerationResult) => void;
  onClose?: () => void;
  defaultRequest?: any;
}

/**
 * Generation Panel
 * 
 * Clean, focused panel for AI generation with smart type detection.
 * Automatically determines generation type based on selection context.
 */
const GenerationPanel: React.FC<GenerationPanelProps> = ({
  type,
  onGenerated,
  defaultRequest
}) => {
  const { selectedNodes } = useSelect();
  const { onFocus, onBlur } = useInputFocusHandlers();
  
  // Smart type detection: single node = process, multiple/none = flow
  const smartGenerationType: GenerationType = selectedNodes.length === 1 ? 'process' : 'flow';
  const actualType = type || smartGenerationType;
  
  // All form logic is now in a custom hook
  const {
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
  } = useGenerationForm(actualType, selectedNodes as any[], onGenerated, defaultRequest);

  // History navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newValue = navigateHistory('up', description);
      setDescription(newValue);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = navigateHistory('down', description);
      setDescription(newValue);
    }
  };

  const handleInputChange = (value: string) => {
    setDescription(value);
    resetHistory();
  };

  // Smart placeholder based on type and selection
  const getSmartPlaceholder = () => {
    if (actualType === 'process' && selectedNodes.length === 1) {
      const nodeType = selectedNodes[0].type;
      return `Describe how this ${nodeType} should process data...`;
    } else {
      return `Describe the ${actualType === 'flow' ? 'workflow' : 'process'} you want to generate...`;
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-2">
      {/* Header with close button */}

      {/* Main input and options row */}
      <div className="flex items-center gap-2">
        <GenerationInput
          value={description}
          onChange={handleInputChange}
          onSubmit={handleGenerate}
          onKeyDown={handleKeyDown}
          placeholder={getSmartPlaceholder()}
          disabled={isGenerating}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        
        {/* Triple dot menu for advanced options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              disabled={isGenerating}
              className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={handleSuggest}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Lightbulb className="w-4 h-4" />
              Suggest idea
            </DropdownMenuItem>
            
            {/* Nested AI Provider submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-2">
                AI Provider
                <div className="ml-auto flex items-center gap-1">
                  <span className="text-xs text-gray-500">
                    {availableProviders.find(p => p.provider === selectedProvider)?.name.split(' ')[0] || 'None'}
                  </span>
                </div>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {availableProviders.map(({ provider, name, configured }) => (
                  <DropdownMenuItem
                    key={provider}
                    onClick={() => setSelectedProvider(provider)}
                    disabled={!configured || isGenerating}
                    className={`flex items-center justify-between ${
                      selectedProvider === provider ? 'bg-purple-50 text-purple-700' : ''
                    }`}
                  >
                    <span>{name.split(' ')[0]}</span>
                    {selectedProvider === provider && (
                      <div className="w-2 h-2 rounded-full bg-purple-600" />
                    )}
                    {!configured && (
                      <span className="text-xs text-gray-400">Not configured</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Status indicator */}
      <GenerationStatus
        isGenerating={isGenerating}
        generationType={actualType}
        historyIndex={historyIndex}
        historyLength={promptHistory.length}
      />
    </div>
  );
};

export default GenerationPanel;