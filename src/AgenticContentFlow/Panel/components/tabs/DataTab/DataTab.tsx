import React, { useState, useEffect } from 'react';
import { Database } from 'lucide-react';
import { 
  TabContainer, 
  SharedEditor,
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

}) => {
  // Core state
  const [factoryConfig, setFactoryConfig] = useState<any>(null);
  const [editedJson, setEditedJson] = useState('');

  // Load factory configuration
  useEffect(() => {
    const loadFactoryConfig = async () => {
      if (nodeType) {
        try {
          const config = getNodeType(nodeType);
          setFactoryConfig(config);
          
          // Initialize with current formData (complete node instance data)
          const dataToShow = { ...formData };
          setEditedJson(JSON.stringify(dataToShow, null, 2));
        } catch (error) {
          console.warn('Could not load factory configuration:', error);
        }
      }
    };

    loadFactoryConfig();
  }, [nodeType, formData]);

  // Update formData when JSON changes
  const handleJsonChange = (newValue: string) => {
    setEditedJson(newValue);
    
    try {
      const parsedData = newValue.trim() ? JSON.parse(newValue) : {};
      
      // Update all fields in formData with the parsed data
      Object.keys(parsedData).forEach(key => {
        onFieldChange(key, parsedData[key]);
      });
    } catch (error) {
      // Invalid JSON, don't update formData
      console.warn('Invalid JSON:', error);
    }
  };

  if (!factoryConfig) {
    return (
      <TabContainer compact>
        <div className="text-center text-gray-500 py-4">
          <Database className="w-6 h-6 mx-auto mb-1 opacity-50" />
          <p className="text-xs">Loading...</p>
        </div>
      </TabContainer>
    );
  }

  // Create JSON schema for autocomplete based on factory config
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
      codeMetadata: { 
        type: 'object', 
        description: 'Metadata about code modifications (actual code is stored in code store)',
        properties: {
          modifiedBy: { type: 'string' },
          modifiedAt: { type: 'string' },
          originalVersion: { type: 'string' },
          generatedFrom: { type: 'string' }
        }
      },
      filePath: {
        type: 'string',
        description: 'Path to the source file in the code store'
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
    <TabContainer>
      <SharedEditor
        value={editedJson}
        onChange={handleJsonChange}
        language="json"
        beforeMount={(monaco) => {
          monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
            validate: true,
            schemas: [{
              uri: 'http://myschema/1',
              fileMatch: ['*'],
              schema: schema
            }]
          });
        }}
      />
    </TabContainer>
  );
};