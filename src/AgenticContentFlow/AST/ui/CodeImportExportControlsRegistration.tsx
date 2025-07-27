/** @format */

import { useEffect } from 'react';
import { registerControl, unregisterControl } from '../../Controls/registry/controlsRegistry';
import { CodeImportExportControl } from './CodeImportExportControl';
import { CONTROL_TYPES } from '../../constants';

/**
 * Code Import/Export Controls Registration
 * 
 * Registers the code import/export controls in the controls registry.
 * These controls allow users to import JavaScript files and convert them to flows,
 * and export current flows as data files.
 */
export const CodeImportExportControlsRegistration: React.FC = () => {
  useEffect(() => {
    // Register the import control
    registerControl(
      'tools',
      CONTROL_TYPES.MINDMAP,
      'import-js',
      CodeImportExportControl,
      {
        mode: 'import'
      },
      20 // Medium priority order
    );

    // Register the export control (separate instance)
    registerControl(
      'tools',
      CONTROL_TYPES.MINDMAP, 
      'export-flow',
      CodeImportExportControl,
      {
        mode: 'export'
      },
      21 // Medium priority order
    );

    // Cleanup on unmount
    return () => {
      unregisterControl('tools', CONTROL_TYPES.MINDMAP, 'import-js');
      unregisterControl('tools', CONTROL_TYPES.MINDMAP, 'export-flow');
    };
  }, []);

  return null;
};