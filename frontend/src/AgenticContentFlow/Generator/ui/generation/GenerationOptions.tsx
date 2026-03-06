import React from 'react';
import { LLMProvider } from '../../generatortypes';

interface GenerationOptionsProps {
  selectedProvider: LLMProvider;
  onProviderChange: (provider: LLMProvider) => void;
  availableProviders: Array<{
    provider: LLMProvider;
    name: string;
    configured: boolean;
  }>;
  disabled?: boolean;
}

/**
 * Generation Options (Simplified)
 * 
 * Now only handles LLM provider selection.
 * Complexity and context options have been removed as per requirements.
 */
export const GenerationOptions: React.FC<GenerationOptionsProps> = ({
  selectedProvider,
  onProviderChange,
  availableProviders,
  disabled = false
}) => (
  <div className="flex items-center gap-2 min-w-0">
    <label className="text-xs text-gray-600 flex-shrink-0">Provider:</label>
    <select
      value={selectedProvider}
      onChange={(e) => onProviderChange(e.target.value as LLMProvider)}
      disabled={disabled}
      className="text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50 min-w-0 flex-1"
    >
      {availableProviders.map(({ provider, name, configured }) => (
        <option key={provider} value={provider} disabled={!configured}>
          {name.split(' ')[0]} {!configured ? '(Not configured)' : ''}
        </option>
      ))}
    </select>
  </div>
);