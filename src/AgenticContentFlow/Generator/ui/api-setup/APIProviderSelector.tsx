/**
 * Provider Selector Component
 * 
 * Handles LLM provider selection with quick setup cards and existing provider indicators.
 */

import React from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LLMProvider } from '../../generatortypes';

interface ProviderSelectorProps {
  selectedProvider: LLMProvider;
  onProviderSelect: (provider: LLMProvider) => void;
  existingConfigs: LLMProvider[];
  providerInfo: Record<string, any>;
  showQuickSetup?: boolean;
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  selectedProvider,
  onProviderSelect,
  existingConfigs,
  providerInfo,
  showQuickSetup = true
}) => {
  return (
    <div className="space-y-4">
      {/* Quick Setup Cards */}
      {showQuickSetup && existingConfigs.length === 0 && (
        <div>
          <Label className="text-sm font-medium mb-3 block">Quick Setup</Label>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(providerInfo).slice(0, 3).map(([provider, info]) => (
              <Card 
                key={provider}
                className={`cursor-pointer transition-colors ${
                  selectedProvider === provider ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                }`}
                onClick={() => onProviderSelect(provider as LLMProvider)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{info.name}</CardTitle>
                  <CardDescription className="text-xs">{info.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Provider Selection Dropdown */}
      <div className="space-y-2">
        <Label htmlFor="provider">Provider</Label>
        <Select value={selectedProvider} onValueChange={onProviderSelect}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(providerInfo).map(([provider, info]) => (
              <SelectItem key={provider} value={provider}>
                <div className="flex items-center gap-2">
                  {info.name}
                  {existingConfigs.includes(provider as LLMProvider) && (
                    <Badge variant="secondary" className="text-xs">Configured</Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};