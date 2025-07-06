import React, { useState, useEffect } from 'react';
import { Code2 } from 'lucide-react';
import {
  TabContainer,
  SharedEditor,
  Badge
} from '../../shared';
import { ProcessCodeValidator } from '@/AgenticContentFlow/Generator/core/validation/ProcessValidator';

interface CodeEditorTabProps {
  nodeType: string;
  formData: Record<string, any>;
  onFieldChange: (fieldKey: string, value: any) => void;
}

export const CodeEditorTab: React.FC<CodeEditorTabProps> = ({
  nodeType,
  formData,
  onFieldChange
}) => {
  // Core state
  const [factoryConfig, setFactoryConfig] = useState<any>(null);
  const [editedCode, setEditedCode] = useState('');

  // Load factory configuration
  useEffect(() => {
    const loadFactoryConfig = async () => {
      try {
        const { getNodeType } = await import('@/AgenticContentFlow/Node/store/NodeTypeStoreInitializer');
        const config = getNodeType(nodeType);
        setFactoryConfig(config);

        // Initialize with instance code if available, otherwise fall back to template code
        const instanceCode = formData.instanceCode;
        const templateCode = config?.process?.templateCode || config?.process?.code || '';
        const currentCode = instanceCode || templateCode;
        setEditedCode(currentCode);
      } catch (error) {
        console.warn('Could not load factory configuration:', error);
      }
    };

    loadFactoryConfig();
  }, [nodeType, formData.instanceCode, formData.templateData, formData.instanceData]);

  // Update formData when code changes
  const handleCodeChange = (newValue: string) => {
    setEditedCode(newValue);

    // Update the instance code in formData
    onFieldChange('instanceCode', newValue);

    // Update metadata to indicate manual edit
    onFieldChange('instanceCodeMetadata', {
      modifiedBy: 'user',
      modifiedAt: new Date().toISOString(),
      originalVersion: factoryConfig?.process?.metadata?.version || '1.0.0',
      generatedFrom: 'manual-edit'
    });
  };

  if (!factoryConfig) {
    return (
      <TabContainer compact>
        <div className="text-center text-gray-500 py-4">
          <Code2 className="w-6 h-6 mx-auto mb-1 opacity-50" />
          <p className="text-xs">Loading...</p>
        </div>
      </TabContainer>
    );
  }

  const currentCode = formData.instanceCode || factoryConfig.process?.templateCode || factoryConfig.process?.code || '';
  const isCustomCode = !!formData.instanceCode;

  const badges = [
    <Badge key="type" variant="outline" className="text-xs">{nodeType}</Badge>
  ];
  if (isCustomCode) {
    badges.push(<Badge key="modified" variant="secondary" className="text-xs">Custom</Badge>);
  } else {
    badges.push(<Badge key="template" variant="outline" className="text-xs">Template</Badge>);
  }

  return (
    <TabContainer>
      <SharedEditor
        value={editedCode}
        onChange={handleCodeChange}
        language="javascript"
        beforeMount={(monaco) => {
          monaco.languages.typescript.javascriptDefaults.addExtraLib(`
            /**
             * Process function executed by factory nodes
             * @param {any} incomingData - Data from upstream nodes
             * @param {object} nodeData - Static configuration for this node instance
             * @param {object} params - Dynamic parameters that can be configured per instance
             * @param {Map} targetMap - Map of downstream target nodes
             * @param {Map} sourceMap - Map of upstream source nodes
             * @param {Map} edgeMap - Map of edge configurations
             * @returns {Promise<any>} Processed result data
             */
            declare function process(incomingData: any, nodeData: object, params: object, targetMap?: Map<string, any>, sourceMap?: Map<string, any>, edgeMap?: Map<string, any>): Promise<any>;
            
            // Common utilities available in process context
            declare const fetch: typeof globalThis.fetch;
            declare const console: typeof globalThis.console;
            declare const JSON: typeof globalThis.JSON;
            declare const Promise: typeof globalThis.Promise;
          `);
        }}
      />
    </TabContainer>
  );
};