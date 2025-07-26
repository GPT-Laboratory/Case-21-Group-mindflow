/** @format */

import { useEffect } from 'react';
import { registerControl, unregisterControl } from './registry/controlsRegistry';
import { CodeImportExportControl } from './Components/CodeImportExportControl';

/**
 * Code Import/Export Control Registration
 * 
 * Registers the code import/export controls in the controls registry.
 * These controls allow users to import JavaScript files and convert them to flows,
 * and export current flows as data files.
 */
export const CodeImportExportControlRegistration: React.FC = () => {
  useEffect(() => {
    // Register the import control
    registerControl(
      'tools',
      'code-management',
      'import-js',
      CodeImportExportControl,
      {
        variant: 'outline',
        size: 'sm',
        mode: 'import'
      },
      20 // Medium priority order
    );

    // Register the export control (separate instance)
    registerControl(
      'tools',
      'code-management', 
      'export-flow',
      CodeImportExportControl,
      {
        variant: 'outline',
        size: 'sm',
        mode: 'export'
      },
      21 // Medium priority order
    );

    // Cleanup on unmount
    return () => {
      unregisterControl('tools', 'code-management', 'import-js');
      unregisterControl('tools', 'code-management', 'export-flow');
    };
  }, []);

  return null;
};