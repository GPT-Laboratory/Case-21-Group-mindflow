import React, { useState, useEffect } from 'react';
import { Settings2, RotateCcw } from 'lucide-react';
import { 
  TabContainer, 
  ConfigurationSection,
  Badge,
  InfoCard
} from '../../shared';
import { factoryNodeRegistration } from '@/AgenticContentFlow/Node/factories/cell/FactoryNodeRegistration';

interface ParametersTabProps {
  formData: Record<string, any>;
  onFieldChange: (fieldKey: string, value: any) => void;
  nodeId?: string;
  nodeType?: string;
  hasChanges?: boolean;
}

export const ParametersTab: React.FC<ParametersTabProps> = ({ 
  formData, 
  onFieldChange,
  nodeId,
  nodeType,
  hasChanges = false
}) => {
  const [templateParameters, setTemplateParameters] = useState<Record<string, any>>({});
  const [parameterConfigs, setParameterConfigs] = useState<Record<string, any>>({});

  // Load factory configuration for parameters
  useEffect(() => {
    const loadConfiguration = async () => {
      if (nodeType) {
        try {
          const configLoader = factoryNodeRegistration.getConfigurationLoader();
          const config = configLoader.getConfiguration(nodeType);
          
          setTemplateParameters(config?.template?.defaultParameters || {});
          setParameterConfigs(config?.process?.parameters || {});
        } catch (error) {
          console.warn('Could not load factory configuration:', error);
        }
      }
    };

    loadConfiguration();
  }, [nodeType]);

  // Get current parameter values - check processOverrides first, then fallback to template defaults
  const currentParameters = {
    ...templateParameters,
    ...(formData.processOverrides?.parameters || {})
  };

  const handleParameterChange = (fieldKey: string, value: any) => {
    const newProcessOverrides = {
      ...formData.processOverrides,
      parameters: {
        ...(formData.processOverrides?.parameters || {}),
        [fieldKey]: value
      }
    };
    
    onFieldChange('processOverrides', newProcessOverrides);
  };

  const handleParameterDelete = (fieldKey: string) => {
    const newParameters = { ...(formData.processOverrides?.parameters || {}) };
    delete newParameters[fieldKey];
    
    const newProcessOverrides = {
      ...formData.processOverrides,
      parameters: newParameters
    };
    
    onFieldChange('processOverrides', newProcessOverrides);
  };

  const resetAllToDefaults = () => {
    const newProcessOverrides = {
      ...formData.processOverrides,
      parameters: {}
    };
    
    onFieldChange('processOverrides', newProcessOverrides);
  };

  // Generate field configs from the parameter definitions
  const fieldConfigs: Record<string, any> = {};
  Object.entries(parameterConfigs).forEach(([key, config]: [string, any]) => {
    fieldConfigs[key] = {
      fieldType: config.type === 'boolean' ? 'boolean' : 
                 config.type === 'number' ? 'number' : 'text',
      label: config.description || key.charAt(0).toUpperCase() + key.slice(1),
      description: config.description,
      required: config.required || false,
      defaultValue: config.default
    };
  });

  const hasOverrides = Object.keys(formData.processOverrides?.parameters || {}).length > 0;

  return (
    <TabContainer
      title="Runtime Parameters"
      description="Configure how the process executes - retry settings, logging options, and behavior flags"
      icon={Settings2}
      badges={[
        nodeType && <Badge key="type" variant="outline" className="text-xs">{nodeType}</Badge>,
        hasChanges && <Badge key="changes" variant="secondary" className="text-xs">Modified</Badge>,
        hasOverrides && <Badge key="overrides" variant="default" className="text-xs">Custom Values</Badge>
      ].filter(Boolean)}
    >
      {/* Current Parameters */}
      <ConfigurationSection
        title={`Process Parameters (${Object.keys(currentParameters).length} available)`}
        icon={Settings2}
        data={currentParameters}
        templateDefaults={templateParameters}
        fieldConfigs={fieldConfigs}
        onChange={handleParameterChange}
        onDelete={handleParameterDelete}
        allowAddFields={true}
        allowDeleteFields={true}
        showResetButtons={true}
        description="Runtime parameters that control process execution behavior. These can override template defaults."
        emptyMessage="No parameters defined for this node type."
      />

      {/* Reset all button */}
      {hasOverrides && (
        <div className="flex justify-end mt-4">
          <button
            onClick={resetAllToDefaults}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset All to Defaults</span>
          </button>
        </div>
      )}

      {/* Template Defaults Info */}
      {Object.keys(templateParameters).length > 0 && (
        <InfoCard
          title="Template Defaults"
          type="success"
          content={
            <div className="space-y-1">
              {Object.entries(templateParameters).map(([key, value]) => (
                <div key={key} className="text-xs">
                  <span className="font-mono">{key}</span>: {JSON.stringify(value)}
                </div>
              ))}
            </div>
          }
        />
      )}
    </TabContainer>
  );
};