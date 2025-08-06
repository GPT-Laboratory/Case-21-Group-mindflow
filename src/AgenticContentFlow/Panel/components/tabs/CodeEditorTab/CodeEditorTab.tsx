import React, { useState, useEffect } from 'react';
import { Code2 } from 'lucide-react';
import {
  TabContainer,
  SharedEditor,
  Badge
} from '../../shared';
import { useCodeStore } from '../../../../../stores/codeStore';
import { useCodeFlowSync } from '../../../../AST/hooks/useCodeFlowSync';

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

  // Access code store - subscribe to specific parts to trigger re-renders
  const sourceFiles = useCodeStore(state => state.sourceFiles);
  const functionLocations = useCodeStore(state => state.functionLocations);
  const getSourceCode = useCodeStore(state => state.getSourceCode);
  const getFunctionCode = useCodeStore(state => state.getFunctionCode);

  // Flow synchronization hook
  const { updateFunctionCodeAndSync, updateFileCodeAndSync } = useCodeFlowSync();

  // Load factory configuration and code
  useEffect(() => {
    const loadFactoryConfig = async () => {
      try {
        const { getNodeType } = await import('@/AgenticContentFlow/Node/store/NodeTypeStoreInitializer');
        const config = getNodeType(nodeType);
        setFactoryConfig(config);

        // Get code from code store using filePath
        let currentCode = '';

        console.log('🔍 CodeEditorTab: Attempting to load code:', {
          filePath: formData.filePath,
          functionName: formData.functionName,
          nodeType,
          nodeId: formData.id,
          hasNodeId: !!formData.id
        });

        if (formData.filePath) {
          // Try to get the full source code for the file
          const sourceCode = getSourceCode(formData.filePath);
          console.log('🔍 CodeEditorTab: Source code from store:', sourceCode ? `${sourceCode.length} chars` : 'null');

          if (sourceCode) {
            currentCode = sourceCode;
          }

          // If this is a function node, try to get the specific function code
          if (formData.functionName && nodeType === 'functionnode') {
            const functionCode = getFunctionCode(formData.id || '');
            console.log('🔍 CodeEditorTab: Function code from store:', functionCode ? `${functionCode.length} chars` : 'null');

            if (functionCode) {
              currentCode = functionCode;
            }
          }
        }

        console.log('🔍 CodeEditorTab: Final code to display:', currentCode ? `${currentCode.length} chars` : 'empty');

        // Fall back to template code if no code found in store
        if (!currentCode) {
          const templateCode = config?.process?.templateCode || config?.process?.code || '';
          currentCode = templateCode;
        }

        setEditedCode(currentCode);
      } catch (error) {
        console.warn('Could not load factory configuration:', error);
      }
    };

    loadFactoryConfig();
  }, [nodeType, formData.filePath, formData.functionName, formData.id, sourceFiles, functionLocations, getSourceCode, getFunctionCode]);

  // Update formData when code changes
  const handleCodeChange = async (newValue: string) => {
    setEditedCode(newValue);

    if (formData.filePath) {
      if (nodeType === 'functionnode' && formData.id && formData.functionName) {
        // For function nodes, update the function code and synchronize the flow
        try {
          const success = await updateFunctionCodeAndSync(formData.id, newValue, formData.filePath);
          if (success) {
            console.log(`🔧 CodeEditorTab: Updated function ${formData.functionName} and synchronized flow`);
          } else {
            console.warn(`🔧 CodeEditorTab: Failed to update function ${formData.functionName}, falling back to full file update`);
            await updateFileCodeAndSync(formData.filePath, newValue);
          }
        } catch (error) {
          console.error('🔧 CodeEditorTab: Error during function code sync:', error);
          // Fallback to direct code store update without sync
          const { updateFunctionCode, setSourceCode } = useCodeStore.getState();
          const success = updateFunctionCode(formData.id, newValue);
          if (!success) {
            setSourceCode(formData.filePath, newValue);
          }
        }
      } else {
        // For container nodes, update the entire file and synchronize the flow
        try {
          const success = await updateFileCodeAndSync(formData.filePath, newValue);
          if (success) {
            console.log(`🔧 CodeEditorTab: Updated entire file ${formData.filePath} and synchronized flow`);
          } else {
            console.warn(`🔧 CodeEditorTab: Failed to sync file update, updating code store only`);
            const { setSourceCode } = useCodeStore.getState();
            setSourceCode(formData.filePath, newValue);
          }
        } catch (error) {
          console.error('🔧 CodeEditorTab: Error during file code sync:', error);
          // Fallback to direct code store update without sync
          const { setSourceCode } = useCodeStore.getState();
          setSourceCode(formData.filePath, newValue);
        }
      }
    }

    // Update metadata to indicate manual edit
    onFieldChange('codeMetadata', {
      modifiedBy: 'user',
      modifiedAt: new Date().toISOString(),
      originalVersion: factoryConfig?.process?.metadata?.version || '1.0.0',
      generatedFrom: 'manual-edit',
      editType: nodeType === 'functionnode' ? 'function' : 'file'
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

  const isCustomCode = !!formData.codeMetadata?.modifiedBy;

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