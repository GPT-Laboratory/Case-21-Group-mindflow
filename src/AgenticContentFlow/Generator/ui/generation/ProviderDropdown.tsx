import React from 'react';
import { Settings, Loader2 } from 'lucide-react';
import { LLMProvider } from '../../generatortypes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProviderDropdownProps {
  selectedProvider: LLMProvider;
  setSelectedProvider: (provider: LLMProvider) => void;
  availableProviders: Array<{
    provider: LLMProvider;
    name: string;
    configured: boolean;
    models?: string[];
    defaultModel?: string;
  }>;
  isGenerating: boolean;
  onConfigureProvider: (provider: LLMProvider) => void;
  selectedModel?: string;
  setSelectedModel?: (model: string) => void;
  providersLoading?: boolean;
}

export const ProviderDropdown: React.FC<ProviderDropdownProps> = ({
  selectedProvider,
  setSelectedProvider,
  availableProviders,
  isGenerating,
  onConfigureProvider,
  selectedModel,
  setSelectedModel,
  providersLoading
}) => {
  const currentProvider = availableProviders.find(p => p.provider === selectedProvider);
  const showModelDropdown = currentProvider && currentProvider.models && currentProvider.models.length > 0;

  return (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="flex items-center gap-2 w-full">
          <span className="flex-1 text-left">AI Provider</span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-xs text-gray-500">
              {currentProvider?.name.split(' ')[0] || 'None'}
            </span>
          </div>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="min-w-[200px] max-w-[300px]">
          {availableProviders.map(({ provider, name, configured }) => (
            <DropdownMenuItem
              key={provider}
              onClick={() => {
                if (configured) {
                  setSelectedProvider(provider);
                } else {
                  onConfigureProvider(provider);
                }
              }}
              className={`flex items-center justify-between w-full ${
                selectedProvider === provider && configured ? 'bg-purple-50 text-purple-700' : ''
              } ${!configured ? 'opacity-60' : ''}`}
            >
              <span className="flex-1 truncate">{name.split(' ')[0]}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                {selectedProvider === provider && configured && (
                  <div className="w-2 h-2 rounded-full bg-purple-600" />
                )}
                {!configured && (
                  <span className="text-xs text-gray-400">Not configured</span>
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      {/* Model dropdown for all providers with models */}
      {showModelDropdown && setSelectedModel && (
        <div className="px-3 py-2 border-t">
          <label className="block text-xs text-gray-500 mb-1">Model</label>
          {providersLoading ? (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="w-3 h-3 animate-spin" /> 
              Loading models...
            </div>
          ) : (
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="w-full text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
              disabled={isGenerating}
            >
              {currentProvider.models!.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          )}
        </div>
      )}
    </>
  );
}; 