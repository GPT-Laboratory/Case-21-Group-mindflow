import React, { useState, useEffect } from 'react';
import { Database } from 'lucide-react';
import { 
  TabContainer, 
  SharedEditor,
  InfoCard,
  Badge
} from '../../shared';
import { getNodeType } from '@/AgenticContentFlow/Node/store';

interface DataTabProps {
  formData: Record<string, any>;
  onFieldChange: (fieldKey: string, value: any) => void;
  nodeId?: string;
  nodeType?: string;
  hasChanges?: boolean;
}

export const DataTab: React.FC<DataTabProps> = ({ 
  formData, 
  onFieldChange,
  nodeType,
  hasChanges = false
}) => {
  // Core state
  const [factoryConfig, setFactoryConfig] = useState<any>(null);
  
  // JSON editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedJson, setEditedJson] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load factory configuration
  useEffect(() => {
    const loadFactoryConfig = async () => {
      if (nodeType) {
        try {
          const config = getNodeType(nodeType);
          setFactoryConfig(config);
          
          // Initialize with current formData (complete node instance data) but exclude instanceCode
          const dataToShow = { ...formData };
          delete dataToShow.instanceCode; // Exclude instanceCode since it's edited in Code Editor tab
          setEditedJson(JSON.stringify(dataToShow, null, 2));
        } catch (error) {
          console.warn('Could not load factory configuration:', error);
        }
      }
    };

    loadFactoryConfig();
  }, [nodeType, formData]);

  // Validate JSON
  const validateJson = () => {
    if (!editedJson.trim()) {
      setValidationResult({ isValid: true, errors: [], warnings: [] });
      return;
    }

    try {
      JSON.parse(editedJson);
      setValidationResult({ isValid: true, errors: [], warnings: [] });
    } catch (error) {
      setValidationResult({ 
        isValid: false, 
        errors: [`Invalid JSON: ${error}`], 
        warnings: [] 
      });
    }
  };

  // Save JSON changes
  const saveJsonChanges = async () => {
    setIsSaving(true);
    try {
      validateJson();
      
      if (validationResult?.isValid) {
        const parsedData = editedJson.trim() ? JSON.parse(editedJson) : {};
        
        // Update all fields in formData with the parsed data, but preserve instanceCode
        Object.keys(parsedData).forEach(key => {
          if (key !== 'instanceCode') { // Don't overwrite instanceCode
            onFieldChange(key, parsedData[key]);
          }
        });
        
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to save data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    // Reset to factory defaults but preserve instanceCode
    const defaultData: Record<string, any> = {
      nodeType: formData.nodeType,
      nodeId: formData.nodeId,
      // Keep other essential fields but reset to defaults
      templateData: {},
      instanceCodeMetadata: undefined,
      instanceData: {},
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      }
    };
    
    setEditedJson(JSON.stringify(defaultData, null, 2));
    setValidationResult(null);
    
    // Apply the reset but preserve instanceCode
    Object.keys(defaultData).forEach(key => {
      if (key !== 'instanceCode') { // Don't reset instanceCode
        onFieldChange(key, defaultData[key]);
      }
    });
  };

  // Auto-validate when JSON changes
  useEffect(() => {
    if (editedJson && isEditing) {
      const timeoutId = setTimeout(validateJson, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [editedJson, isEditing]);

  if (!factoryConfig) {
    return (
      <TabContainer
        title="Node Data"
        description="Loading node configuration..."
        icon={Database}
      >
        <div className="text-center text-gray-500 py-8">
          <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Loading node configuration...</p>
        </div>
      </TabContainer>
    );
  }

  // Create data to show (excluding instanceCode)
  const dataToShow = { ...formData };
  delete dataToShow.instanceCode;

  const hasCustomData = Object.keys(dataToShow).some(key => 
    key !== 'nodeType' && key !== 'nodeId' && dataToShow[key] !== undefined && dataToShow[key] !== null
  );

  const badges = [
    nodeType && <Badge key="type" variant="outline" className="text-xs">{nodeType}</Badge>,
    hasChanges && <Badge key="changes" variant="secondary" className="text-xs">Modified</Badge>,
    hasCustomData && <Badge key="custom" variant="default" className="text-xs">Custom Data</Badge>
  ].filter(Boolean);

  // Create JSON schema for autocomplete based on factory config (excluding instanceCode)
  const schema = {
    type: 'object',
    properties: {
      nodeType: { type: 'string', description: 'Type of the node' },
      nodeId: { type: 'string', description: 'Unique identifier of the node' },
      templateData: { 
        type: 'object', 
        description: 'Runtime parameters that control process execution',
        properties: factoryConfig?.process?.parameters || {},
        additionalProperties: true
      },
      instanceCodeMetadata: { 
        type: 'object', 
        description: 'Metadata about custom code modifications (code is edited in Code tab)',
        properties: {
          modifiedBy: { type: 'string' },
          modifiedAt: { type: 'string' },
          originalVersion: { type: 'string' },
          generatedFrom: { type: 'string' }
        }
      },
      instanceData: { type: 'object', description: 'Instance-specific data' },
      metadata: { 
        type: 'object', 
        description: 'Node metadata',
        properties: {
          created: { type: 'string' },
          modified: { type: 'string' },
          version: { type: 'string' }
        }
      }
    },
    additionalProperties: true
  };

  return (
    <TabContainer
      title="Node Data"
      description="View and edit node configuration data (code is edited in the Code tab)"
      icon={Database}
      badges={badges}
    >
      <SharedEditor
        value={isEditing ? editedJson : JSON.stringify(dataToShow, null, 2)}
        onChange={setEditedJson}
        language="json"
        title="Node Data"
        description="View and edit node configuration data (code is edited in the Code tab)"
        icon={Database}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        validationResult={validationResult}
        isSaving={isSaving}
        hasCustomContent={hasCustomData}
        onSave={saveJsonChanges}
        onReset={resetToDefaults}
        schema={schema}
      />

      {/* Data Info - Compact */}
      {hasCustomData && (
        <div className="mt-3">
          <InfoCard
            title="Custom Data Active"
            type="info"
            content={`${Object.keys(dataToShow).length} data fields configured (excluding code)`}
          />
        </div>
      )}
    </TabContainer>
  );
};