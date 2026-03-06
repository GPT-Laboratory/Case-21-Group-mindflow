import React, { createContext, useContext, useState, useCallback } from 'react';

interface InputFocusContextValue {
  isInputFocused: boolean;
  setInputFocused: (focused: boolean) => void;
}

const InputFocusContext = createContext<InputFocusContextValue | undefined>(undefined);

export const useInputFocus = () => {
  const context = useContext(InputFocusContext);
  if (!context) {
    throw new Error('useInputFocus must be used within an InputFocusProvider');
  }
  return context;
};

interface InputFocusProviderProps {
  children: React.ReactNode;
}

export const InputFocusProvider: React.FC<InputFocusProviderProps> = ({ children }) => {
  const [isInputFocused, setIsInputFocused] = useState(false);

  const setInputFocused = useCallback((focused: boolean) => {
    setIsInputFocused(focused);
  }, []);

  const value = {
    isInputFocused,
    setInputFocused,
  };

  return (
    <InputFocusContext.Provider value={value}>
      {children}
    </InputFocusContext.Provider>
  );
};