import React from 'react';

interface GenerationStatusProps {
  isGenerating: boolean;
  generationType: string;
  historyIndex: number;
  historyLength: number;
}

/**
 * Generation Status
 * 
 * Shows generation progress and history navigation status
 */
export const GenerationStatus: React.FC<GenerationStatusProps> = ({
  isGenerating,
  generationType,
  historyIndex,
  historyLength
}) => (
  <div className="flex items-center justify-between min-h-[16px] mt-1">
    {/* Generation Progress */}
    {isGenerating && (
      <div className="text-xs text-purple-600 flex items-center gap-2 min-w-0">
        <div className="w-3 h-3 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin flex-shrink-0" />
        <span className="truncate">Generating {generationType}...</span>
      </div>
    )}
    
    {/* History Navigation Indicator */}
    {!isGenerating && historyIndex !== -1 && historyLength > 0 && (
      <div className="text-xs text-gray-500 flex-shrink-0">
        {historyIndex + 1}/{historyLength}
      </div>
    )}
  </div>
);