import React from 'react';
import { LLMProvider } from '../../generatortypes';
import { Settings } from 'lucide-react';

interface ProviderIconProps {
  provider: LLMProvider;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
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

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6'
};

export const ProviderIcon: React.FC<ProviderIconProps> = ({
  provider,
  size = 'md',
  className = '',
  showTooltip = false
}) => {
  const iconElement = provider === 'custom' ? (
    <Settings className={sizeClasses[size]} />
  ) : (
    <img
      src={providerIcons[provider]}
      alt={providerNames[provider]}
      className={sizeClasses[size]}
    />
  );

  if (showTooltip) {
    return (
      <div className={`flex items-center justify-center ${className}`} title={providerNames[provider]}>
        {iconElement}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {iconElement}
    </div>
  );
}; 