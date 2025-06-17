import React, { useRef } from 'react';
import { Send } from 'lucide-react';

interface GenerationInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder: string;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

/**
 * Generation Input
 * 
 * Handles the main text input with suggest and submit buttons
 */
export const GenerationInput: React.FC<GenerationInputProps> = ({
  value,
  onChange,
  onSubmit,
  onKeyDown,
  placeholder,
  disabled = false,
  onFocus,
  onBlur
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="flex items-center gap-2 flex-1 ml-2">
      {/* Main Input */}
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
      />
      
      {/* Generate Button */}
      <button
        onClick={onSubmit}
        disabled={!value.trim() || disabled}
        className="flex items-center justify-center w-8 h-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Generate"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
};