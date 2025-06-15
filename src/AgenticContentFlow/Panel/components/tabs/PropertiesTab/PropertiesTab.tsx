import React, { useState, useEffect } from 'react';
import { Settings, Database } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TabContainer, 
  ConfigurationSection,
  Badge
} from '../../shared';
import { factoryNodeRegistration } from '@/AgenticContentFlow/Node/factories/cell/FactoryNodeRegistration';

// Define NodeGroup type locally since we removed the separate file
export type NodeGroup = 'process' | 'preview' | 'container';

interface PropertiesTabProps {
  fields: Record<string, any>;
  formData: Record<string, any>;
  onFieldChange: (fieldKey: string, value: any) => void;
  nodeId?: string;
  nodeType?: string;
  nodeGroup?: NodeGroup;
  nodeConfig?: any;
  hasChanges?: boolean;
}

export const PropertiesTab: React.FC<PropertiesTabProps> = ({ 
  formData, 
  onFieldChange,
  nodeId,
  nodeType,
  nodeGroup,
  hasChanges = false
}) => {
  const [templateDefaults, setTemplateDefaults] = useState<Record<string, any>>({});

  // Load factory configuration
  useEffect(() => {
    const loadConfiguration = async () => {
      if (nodeType) {
        try {
          const configLoader = factoryNodeRegistration.getConfigurationLoader();
          const config = configLoader.getConfiguration(nodeType);
          
          setTemplateDefaults(config?.template?.defaultData || {});
        } catch (error) {
          console.warn('Could not load factory configuration:', error);
        }
      }
    };

    loadConfiguration();
  }, [nodeType]);

  // Extract templateData and instanceData from the new structure
  const templateData = formData.templateData || {};
  const instanceData = formData.instanceData || {};

  // For backward compatibility, if data is in old flat structure, separate it
  let actualTemplateData = templateData;
  let actualInstanceData = instanceData;

  // Check if we're dealing with old flat structure (no templateData/instanceData properties)
  if (!formData.hasOwnProperty('templateData') && !formData.hasOwnProperty('instanceData')) {
    // Old flat structure - need to migrate
    const instanceFields = ['label', 'details', 'subject', 'nodeLevel', 'nodeType', 'category', 'group', 'description', 'expanded', 'depth', 'isParent'];
    const templateDefaultKeys = Object.keys(templateDefaults);
    
    actualTemplateData = {};
    actualInstanceData = {};
    
    // Separate into instance vs template data
    Object.entries(formData).forEach(([key, value]) => {
      // Skip instanceCode as it's handled separately
      if (key === 'instanceCode' || key === 'instanceCodeMetadata') {
        return;
      }
      
      if (instanceFields.includes(key)) {
        actualInstanceData[key] = value;
      } else if (templateDefaultKeys.includes(key)) {
        // This is a template field that might have been overridden
        actualTemplateData[key] = value;
      } else {
        // Unknown field - treat as instance data
        actualInstanceData[key] = value;
      }
    });

    console.log('Migrated old flat structure:', {
      originalData: formData,
      separatedInstance: actualInstanceData,
      separatedTemplate: actualTemplateData,
      templateDefaults
    });
  } else {
    console.log('Using new structure:', {
      templateData: actualTemplateData,
      instanceData: actualInstanceData,
      templateDefaults
    });
  }

  const handleInstanceDataChange = (fieldKey: string, value: any) => {
    const newInstanceData = {
      ...actualInstanceData,
      [fieldKey]: value
    };
    
    onFieldChange('instanceData', newInstanceData);
  };

  const handleInstanceDataDelete = (fieldKey: string) => {
    const newInstanceData = { ...actualInstanceData };
    delete newInstanceData[fieldKey];
    onFieldChange('instanceData', newInstanceData);
  };

  const handleTemplateDataChange = (fieldKey: string, value: any) => {
    const newTemplateData = {
      ...actualTemplateData,
      [fieldKey]: value
    };
    
    onFieldChange('templateData', newTemplateData);
  };

  return (
    <TabContainer
      title="Node Data Configuration"
      description={`Configure the data and behavior properties of this ${nodeGroup || 'unknown'} node`}
      icon={Settings}
      badges={[
        nodeType && <Badge key="type" variant="outline" className="text-xs">{nodeType}</Badge>,
        hasChanges && <Badge key="changes" variant="secondary" className="text-xs">Modified</Badge>
      ].filter(Boolean)}
    >
      <Tabs defaultValue="instance" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="instance">
            Instance Data ({Object.keys(actualInstanceData).length})
          </TabsTrigger>
          <TabsTrigger value="template">
            Template Data ({Object.keys(actualTemplateData).length})
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="instance" className="space-y-4">
            <ConfigurationSection
              title="Instance-Specific Configuration"
              icon={Database}
              data={actualInstanceData}
              onChange={handleInstanceDataChange}
              onDelete={handleInstanceDataDelete}
              allowAddFields={true}
              allowDeleteFields={true}
              description="Configuration specific to this node instance - things like labels, details, instance-specific overrides, etc. You can add or remove fields as needed."
              emptyMessage="No instance-specific configuration found. Click the + button below to add fields."
            />
          </TabsContent>

          <TabsContent value="template" className="space-y-4">
            <ConfigurationSection
              title="Template Configuration"
              icon={Settings}
              data={actualTemplateData}
              templateDefaults={templateDefaults}
              onChange={handleTemplateDataChange}
              showResetButtons={true}
              description="Template-based configuration for this node type - the actual functional parameters and settings defined by the node template. Use the reset buttons to revert to defaults."
              emptyMessage="No template configuration found. This typically includes the main functional parameters like URL, method, conditions, etc."
            />
          </TabsContent>
        </div>
      </Tabs>
    </TabContainer>
  );
};