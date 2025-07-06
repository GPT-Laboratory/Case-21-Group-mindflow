/** @format */

import { useEffect } from 'react';
import { registerControl, unregisterControl } from './registry/controlsRegistry';
import { SaveFlowControl } from './Components/SaveFlowControl';

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
      'flow-management',
      'save-flow',
      SaveFlowControl,
      {
        variant: 'outline',
        size: 'sm'
      },
      10 // High priority order
    );

    // Cleanup on unmount
    return () => {
      unregisterControl('tools', 'flow-management', 'save-flow');
    };
  }, []);

  return null;
}; 