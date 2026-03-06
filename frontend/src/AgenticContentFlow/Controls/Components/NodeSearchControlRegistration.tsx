import { useEffect } from 'react';
import { registerControl, unregisterControl } from '../registry/controlsRegistry';
import { NodeSearchControl } from './NodeSearchControl';

export const NodeSearchControlRegistration = () => {
  useEffect(() => {
    registerControl(
      'tools',
      'flow-search',
      'node-search',
      NodeSearchControl,
      {},
      10 // Order - show early in tools
    );

    return () => {
      unregisterControl('tools', 'flow-search', 'node-search');
    };
  }, []);

  return null;
};