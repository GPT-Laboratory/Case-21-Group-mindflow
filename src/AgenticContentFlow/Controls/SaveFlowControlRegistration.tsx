/** @format */

import { useEffect } from 'react';
import { registerControl, unregisterControl } from './registry/controlsRegistry';
import { SaveFlowControl } from './Components/SaveFlowControl';
import { CONTROL_TYPES } from '../constants';

/**
 * Save Flow Control Registration
 * 
 * Registers the save flow control in the controls registry.
 * This control allows users to save their current flow state.
 */
export const SaveFlowControlRegistration: React.FC = () => {
  useEffect(() => {
    // Register the save flow control
    registerControl(
      'tools',
      CONTROL_TYPES.MINDMAP,
      'save-flow',
      SaveFlowControl,
      {}, // No props needed since we're using ControlButton
      10 // High priority order
    );

    // Cleanup on unmount
    return () => {
      unregisterControl('tools', CONTROL_TYPES.MINDMAP, 'save-flow');
    };
  }, []);

  return null;
}; 