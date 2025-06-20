import React, { useRef } from 'react';

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
 * Handles the main text input with keyboard shortcuts
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
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="flex-1 min-w-0">
      {/* Main Input */}
      <textarea
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        rows={1}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 resize-none min-w-0"
        style={{ minHeight: '36px', maxHeight: '120px' }}
      />
    </div>
  );
};