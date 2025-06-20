import React, { useState, useEffect } from 'react';
import { Code2 } from 'lucide-react';
import { 
  TabContainer, 
  SharedEditor,
  InfoCard,
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
  
  // Code editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Load factory configuration
  useEffect(() => {
    const loadFactoryConfig = async () => {
      try {
        const { getNodeType } = await import('@/AgenticContentFlow/Node/store/unifiedNodeTypeStoreInitializer');
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

  // Validate code
  const validateCode = async () => {
    if (!editedCode.trim()) {
      setValidationResult({ isValid: false, errors: ['Code cannot be empty'], warnings: [] });
      return;
    }

    setIsValidating(true);
    try {
      const validator = new ProcessCodeValidator();
      const result = validator.validateCode(editedCode);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({ 
        isValid: false, 
        errors: [`Validation failed: ${error}`], 
        warnings: [] 
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Save code changes
  const saveCodeChanges = async () => {
    setIsSaving(true);
    try {
      await validateCode();
      
      if (validationResult?.isValid) {
        onFieldChange('instanceCode', editedCode);
        onFieldChange('instanceCodeMetadata', {
          modifiedBy: 'user',
          modifiedAt: new Date().toISOString(),
          originalVersion: factoryConfig?.process?.metadata?.version || '1.0.0',
          generatedFrom: 'manual-edit'
        });
        
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to save code:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to template code
  const resetToDefault = () => {
    const templateCode = factoryConfig?.process?.templateCode || factoryConfig?.process?.code || '';
    setEditedCode(templateCode);
    setValidationResult(null);
    
    // Remove instance code to fall back to template
    onFieldChange('instanceCode', undefined);
    onFieldChange('instanceCodeMetadata', undefined);
  };

  // Auto-validate when code changes
  useEffect(() => {
    if (editedCode && isEditing) {
      const timeoutId = setTimeout(validateCode, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [editedCode, isEditing]);

  if (!factoryConfig) {
    return (
      <TabContainer
        title="Code Editor"
        description="Loading code configuration..."
        icon={Code2}
      >
        <div className="text-center text-gray-500 py-8">
          <Code2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Loading code configuration...</p>
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
    badges.push(<Badge key="modified" variant="secondary" className="text-xs">Custom Code</Badge>);
  } else {
    badges.push(<Badge key="template" variant="outline" className="text-xs">Template Code</Badge>);
  }

  return (
    <TabContainer
      title="Code Editor"
      description="Edit the JavaScript process function for this node"
      icon={Code2}
      badges={badges}
    >
      <SharedEditor
        value={isEditing ? editedCode : currentCode}
        onChange={setEditedCode}
        language="javascript"
        title="Code Editor"
        description="Edit the JavaScript process function for this node"
        icon={Code2}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        validationResult={validationResult}
        isSaving={isSaving}
        hasCustomContent={isCustomCode}
        onSave={saveCodeChanges}
        onReset={resetToDefault}
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
            declare const Error: typeof globalThis.Error;
          `, 'ts:process-types.d.ts');
        }}
      />

      {/* Loading state */}
      {isValidating && (
        <div className="text-xs text-gray-500 text-center py-2">
          Validating code...
        </div>
      )}

      {/* Custom Code Info - Compact */}
      {isCustomCode && formData.instanceCodeMetadata && (
        <div className="mt-3">
          <InfoCard
            title="Custom Code Active"
            type="info"
            content={`Modified: ${new Date(formData.instanceCodeMetadata.modifiedAt).toLocaleString()}`}
          />
        </div>
      )}
    </TabContainer>
  );
};