import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../../../../components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../components/ui/tooltip';
import { Loader2, CheckCircle2, XCircle, TestTube } from 'lucide-react';
import { LLMProvider } from '../../generatortypes';
import { apiKeyManager } from '../../providers/management/APIKeyManager';
import { LLMProviderFactory } from '../../providers/factory/LLMProviderFactory';

interface ConnectionStatusProps {
  provider: LLMProvider;
  size?: 'sm' | 'md';
  showText?: boolean;
  onConnectionChange?: (status: 'unknown' | 'loading' | 'success' | 'error', error?: string) => void;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  provider,
  size = 'sm',
  showText = false,
  onConnectionChange,
  className = ''
}) => {
  const [status, setStatus] = useState<'unknown' | 'loading' | 'success' | 'error'>('unknown');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = useCallback(async () => {
    setIsLoading(true);
    setStatus('loading');
    setError(null);
    onConnectionChange?.('loading');
    
    const minDuration = 500;
    const start = Date.now();
    
    try {
      const config = apiKeyManager.getConfig(provider);
      if (!config) {
        const elapsed = Date.now() - start;
        if (elapsed < minDuration) await new Promise(res => setTimeout(res, minDuration - elapsed));
        setStatus('error');
        setError('No configuration found');
        onConnectionChange?.('error', 'No configuration found');
        setIsLoading(false);
        return;
      }
      
      const providerInstance = LLMProviderFactory.createProvider(provider);
      const result = await providerInstance.testConnection(config);
      
      const elapsed = Date.now() - start;
      if (elapsed < minDuration) await new Promise(res => setTimeout(res, minDuration - elapsed));
      
      if (result.success) {
        setStatus('success');
        setError(null);
        onConnectionChange?.('success');
      } else {
        setStatus('error');
        setError(result.error || 'Unknown error');
        onConnectionChange?.('error', result.error || 'Unknown error');
      }
    } catch (err: any) {
      const elapsed = Date.now() - start;
      if (elapsed < minDuration) await new Promise(res => setTimeout(res, minDuration - elapsed));
      setStatus('error');
      setError(err?.message || 'Test failed');
      onConnectionChange?.('error', err?.message || 'Test failed');
    } finally {
      setIsLoading(false);
    }
  }, [provider, onConnectionChange]);

  // Test connection on mount and when provider changes
  useEffect(() => {
    setStatus('unknown');
    setError(null);
    const providerInfo = apiKeyManager.getProviderInfo();
    const isConfigured = providerInfo.then(providers => 
      providers.find(p => p.provider === provider)?.configured
    );
    
    isConfigured.then(configured => {
      if (configured) {
        testConnection();
      }
    });
  }, [provider, testConnection]);

  const buttonSize = size === 'md' ? 'default' : 'sm';
  const iconSize = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';

  if (isLoading || status === 'loading') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size={buttonSize} 
              disabled 
              className={`flex-shrink-0 ${className}`}
            >
              <Loader2 className={`${iconSize} animate-spin`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Testing connection...</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (status === 'success') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size={buttonSize} 
              className={`flex-shrink-0 text-green-600 ${className}`}
            >
              <CheckCircle2 className={iconSize} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Connection successful</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (status === 'error') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size={buttonSize} 
              onClick={testConnection}
              className={`flex-shrink-0 text-red-600 ${className}`}
            >
              <XCircle className={iconSize} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Connection failed: {error}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // unknown or default
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            size={buttonSize} 
            onClick={testConnection}
            className={`flex-shrink-0 ${className}`}
          >
            <TestTube className={iconSize} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Test connection</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}; 