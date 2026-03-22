/** @format */

import { useEffect } from 'react';
import { registerControl, unregisterControl } from './registry/controlsRegistry';
import { FlowSettingsControl } from './Components/FlowSettingsControl';
import { CONTROL_TYPES } from '../constants';

/**
 * Flow Settings Control Registration
 *
 * Registers a toolbar control that opens settings for the currently selected flow.
 */
export const FlowSettingsControlRegistration: React.FC = () => {
  useEffect(() => {
    registerControl(
      'tools',
      CONTROL_TYPES.MINDMAP,
      'flow-settings',
      FlowSettingsControl,
      {},
      12
    );

    return () => {
      unregisterControl('tools', CONTROL_TYPES.MINDMAP, 'flow-settings');
    };
  }, []);

  return null;
};
