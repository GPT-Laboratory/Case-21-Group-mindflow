/**
 * API Configuration Form Component
 * 
 * Handles the form fields for API configuration including API key, URL, model selection, and advanced settings.
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Globe, Settings } from 'lucide-react';
import { LLMAPIConfig, LLMProvider } from '../../generatortypes';

interface APIConfigFormProps {
  config: Partial<LLMAPIConfig>;
  onConfigChange: (field: keyof LLMAPIConfig, value: any) => void;
  provider: LLMProvider;
  providerInfo: {
    name: string;
    keyLabel: string;
    keyPlaceholder: string;
    helpUrl: string;
    models: string[];
    defaultModel: string;
  };
}

export const APIConfigForm: React.FC<APIConfigFormProps> = ({
  config,
  onConfigChange,
  provider,
  providerInfo
}) => {
  return (
    <div className="space-y-4">
      {/* API Key */}
      <div className="space-y-2">
        <Label htmlFor="apiKey" className="flex items-center gap-2">
          {providerInfo.keyLabel}
          {provider !== 'custom' && provider !== 'ollama' && <span className="text-red-500">*</span>}
        </Label>
        <div className="flex gap-2">
          <Input
            id="apiKey"
            type="password"
            placeholder={providerInfo.keyPlaceholder}
            value={config.apiKey || ''}
            onChange={(e) => onConfigChange('apiKey', e.target.value)}
            className="flex-1"
          />
          {providerInfo.helpUrl !== '#' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(providerInfo.helpUrl, '_blank')}
            >
              <Globe className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Custom Provider URL */}
      {provider === 'custom' && (
        <div className="space-y-2">
          <Label htmlFor="baseUrl">
            Base URL <span className="text-red-500">*</span>
          </Label>
          <Input
            id="baseUrl"
            placeholder="https://your-api.example.com/v1"
            value={config.baseUrl || ''}
            onChange={(e) => onConfigChange('baseUrl', e.target.value)}
          />
        </div>
      )}

      {/* Model Selection */}
      <div className="space-y-2">
        <Label htmlFor="model">Model</Label>
        <Select 
          value={config.model || providerInfo.defaultModel} 
          onValueChange={(value) => onConfigChange('model', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {providerInfo.models.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Advanced Settings */}
      <div className="space-y-4">
        <Label className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Advanced Settings
        </Label>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="temperature" className="text-sm">Temperature</Label>
            <Input
              id="temperature"
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={config.temperature || 0.3}
              onChange={(e) => onConfigChange('temperature', parseFloat(e.target.value))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maxTokens" className="text-sm">Max Tokens</Label>
            <Input
              id="maxTokens"
              type="number"
              min="100"
              max="4096"
              value={config.maxTokens || 2048}
              onChange={(e) => onConfigChange('maxTokens', parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  );
};