import { useCallback } from 'react';
import { useInputFocus } from '../contexts/InputFocusContext';

/**
 * Custom hook that provides focus and blur handlers for input elements
 * to prevent accidental deletion when typing
 */
export const useInputFocusHandlers = () => {
  const { setInputFocused } = useInputFocus();

  const handleFocus = useCallback(() => {
    setInputFocused(true);
  }, [setInputFocused]);

  const handleBlur = useCallback(() => {
    setInputFocused(false);
  }, [setInputFocused]);

  return {
    onFocus: handleFocus,
    onBlur: handleBlur,
  };
};