/**
 * Provider Selector Component
 * 
 * Handles LLM provider selection with dropdown menu.
 */

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { LLMProvider } from '../../generatortypes';
import { useGenerator } from '../../context/GeneratorContext';

interface APIProviderSelectorProps {
  selectedProvider: LLMProvider;
  onProviderChange: (provider: LLMProvider) => void;
  disabled?: boolean;
}

const providerIcons: Record<LLMProvider, string> = {
  openai: '/openai.svg',
  gemini: '/gemini.svg',
  claude: '/claude.svg',
  ollama: '/ollama.svg',
  custom: '/settings.svg'
};

const providerNames: Record<LLMProvider, string> = {
  openai: 'OpenAI',
  gemini: 'Gemini',
  claude: 'Claude',
  ollama: 'Ollama',
  custom: 'Custom'
};

export const APIProviderSelector: React.FC<APIProviderSelectorProps> = ({
  selectedProvider,
  onProviderChange,
  disabled = false
}) => {
  const { availableProviders, providersLoading } = useGenerator();

  const handleProviderChange = (value: string) => {
    onProviderChange(value as LLMProvider);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Provider
      </label>
      <Select
        value={selectedProvider}
        onValueChange={handleProviderChange}
        disabled={disabled || providersLoading}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            <div className="flex items-center gap-2">
              <img
                src={providerIcons[selectedProvider]}
                alt={providerNames[selectedProvider]}
                className="w-4 h-4"
              />
              <span>{providerNames[selectedProvider]}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableProviders.map((providerInfo) => (
            <SelectItem
              key={providerInfo.provider}
              value={providerInfo.provider}
              className="flex items-center gap-2"
            >
              <div className="flex items-center gap-2 w-full">
                <img
                  src={providerIcons[providerInfo.provider]}
                  alt={providerInfo.name}
                  className="w-4 h-4"
                />
                <span className="flex-1">{providerInfo.name}</span>
                {providerInfo.configured && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    ✓
                  </span>
                )}
                {providerInfo.preferred && (
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    ★
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};