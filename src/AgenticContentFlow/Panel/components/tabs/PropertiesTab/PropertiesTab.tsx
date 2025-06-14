import React, { useState, useEffect } from 'react';
import { Settings, Play, RefreshCw, Cog, Database } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FieldConfig } from '../../../types';
import { dataSchemaManager, schemaGenerator } from '../../../../Schema';
import { FormField } from '../../common/FormField';
import { 
  TabContainer, 
  ActionButton, 
  AlertBox, 
  Section,
  InfoCard,
  MetadataGrid,
  Badge,
  Separator 
} from '../../shared';
import { factoryNodeRegistration } from '@/AgenticContentFlow/Node/factories/factory/FactoryNodeRegistration';

// Define NodeGroup type locally since we removed the separate file
export type NodeGroup = 'process' | 'preview' | 'container';

interface PropertiesTabProps {
  fields: Record<string, FieldConfig>;
  formData: Record<string, any>;
  onFieldChange: (fieldKey: string, value: any) => void;
  nodeId?: string;
  nodeType?: string;
  nodeGroup?: NodeGroup;
}

export const PropertiesTab: React.FC<PropertiesTabProps> = ({ 
  fields, 
  formData, 
  onFieldChange,
  nodeId,
  nodeType,
  nodeGroup
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<any>(null);
  const [factoryProcessParameters, setFactoryProcessParameters] = useState<Record<string, any>>({});
  const [factoryDefaultParameters, setFactoryDefaultParameters] = useState<Record<string, any>>({});

  // Load factory configuration asynchronously
  useEffect(() => {
    const loadFactoryConfig = async () => {
      if (nodeType) {
        try {
          const configLoader = factoryNodeRegistration.getConfigurationLoader();
          const config = configLoader.getConfiguration(nodeType);
          const parameters = config?.process?.parameters || {};
          const defaultParams = config?.template?.defaultParameters || {};
          setFactoryProcessParameters(parameters);
          setFactoryDefaultParameters(defaultParams);
        } catch (error) {
          console.warn('Could not load factory configuration:', error);
        }
      }
    };

    loadFactoryConfig();
  }, [nodeType]);

  // Separate fields into categories based on actual factory config
  const nodeDataFields: Record<string, FieldConfig> = {};
  const processParameterFields: Record<string, FieldConfig> = {};

  Object.entries(fields).forEach(([key, field]) => {
    if (factoryProcessParameters[key]) {
      processParameterFields[key] = field;
    } else {
      nodeDataFields[key] = field;
    }
  });

  // Generate smart test data based on node type
  const generateTestData = () => {
    if (!nodeType || !nodeId) return {};

    switch (nodeType) {
      case 'restnode':
        // For REST nodes, generate test data from endpoint analysis
        return {
          testData: {
            method: formData.method || 'GET',
            url: formData.url || 'https://jsonplaceholder.typicode.com/posts',
            headers: formData.headers ? JSON.parse(formData.headers || '{}') : { 'Content-Type': 'application/json' },
            expectedResponse: [
              { id: 1, title: 'Sample Post 1', body: 'Sample content', userId: 1 },
              { id: 2, title: 'Sample Post 2', body: 'More sample content', userId: 2 }
            ]
          }
        };

      case 'logicalnode':
        // For Logical nodes, inherit test data from connected upstream nodes
        const upstreamSchema = dataSchemaManager.getSchema(nodeId);
        if (upstreamSchema?.inputSchema) {
          return {
            testData: schemaGenerator.generateTestData(upstreamSchema.inputSchema)
          };
        }
        return {
          testData: [
            { id: 1, title: 'Sample Item 1', status: 'active', value: 100 },
            { id: 2, title: 'Sample Item 2', status: 'inactive', value: 200 }
          ]
        };

      case 'contentnode':
        // For Content nodes, generate test data based on expected UI component props
        const expectedSchema = formData.expectedSchema;
        if (expectedSchema) {
          return {
            testData: schemaGenerator.generateTestData(expectedSchema)
          };
        }
        return {
          testData: [
            { id: 1, title: 'Sample Content 1', body: 'Sample body text', userId: 1 },
            { id: 2, title: 'Sample Content 2', body: 'More sample text', userId: 2 }
          ]
        };

      default:
        return { testData: {} };
    }
  };

  // Handle running the process with test data
  const handleRunProcess = async () => {
    setIsProcessing(true);
    try {
      // Simulate process execution
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const testData = generateTestData();
      
      // Update the form data with generated test data
      onFieldChange('useTestData', true);
      onFieldChange('generatedTestData', testData.testData);
      
      setProcessResult({
        success: true,
        timestamp: new Date().toISOString(),
        dataGenerated: Array.isArray(testData.testData) ? testData.testData.length : 1,
        type: nodeType
      });

      // Update the schema manager if this is a new schema
      if (nodeType === 'restnode' && testData.testData.expectedResponse) {
        dataSchemaManager.updateSchema(nodeId!, undefined, {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              title: { type: 'string' },
              body: { type: 'string' },
              userId: { type: 'number' }
            }
          }
        });
      }
      
    } catch (error) {
      setProcessResult({
        success: false,
        error: error instanceof Error ? error.message : 'Process failed'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <TabContainer
      title={`${nodeGroup?.charAt(0).toUpperCase()}${nodeGroup?.slice(1)} Node Configuration`}
      description={`Configure the behavior and properties of this ${nodeGroup} node`}
      icon={Settings}
      badges={nodeType ? [<Badge key="type" variant="outline" className="text-xs">{nodeType}</Badge>] : []}
    >
      {/* Configuration fields organized in accordion */}
      <Accordion type="single" collapsible defaultValue="nodeData">
        {/* Node Data Section */}
        {Object.keys(nodeDataFields).length > 0 && (
          <AccordionItem value="nodeData">
            <AccordionTrigger className="text-sm font-medium">
              <Database className="w-4 h-4 mr-2" />
              Node Data ({Object.keys(nodeDataFields).length} fields)
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              {Object.entries(nodeDataFields).map(([fieldKey, fieldConfig]) => (
                <FormField
                  key={fieldKey}
                  fieldKey={fieldKey}
                  config={fieldConfig}
                  value={formData[fieldKey]}
                  onChange={(value) => onFieldChange(fieldKey, value)}
                />
              ))}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Process Parameters Section */}
        {Object.keys(processParameterFields).length > 0 && (
          <AccordionItem value="processParameters">
            <AccordionTrigger className="text-sm font-medium">
              <Cog className="w-4 h-4 mr-2" />
              Process Parameters ({Object.keys(processParameterFields).length} fields)
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              {Object.entries(processParameterFields).map(([fieldKey, fieldConfig]) => (
                <FormField
                  key={fieldKey}
                  fieldKey={fieldKey}
                  config={fieldConfig}
                  value={formData[fieldKey] ?? fieldConfig.defaultValue}
                  onChange={(value) => onFieldChange(fieldKey, value)}
                />
              ))}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Default Parameters Section - Read-only info */}
        {Object.keys(factoryDefaultParameters).length > 0 && (
          <AccordionItem value="defaultParameters">
            <AccordionTrigger className="text-sm font-medium">
              <Settings className="w-4 h-4 mr-2" />
              Default Parameters ({Object.keys(factoryDefaultParameters).length} values)
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <InfoCard
                title="Global Default Values"
                type="info"
                content="These are default parameter values applied to all nodes of this type. Some may be managed globally by the system (like retry settings)."
              />
              <MetadataGrid
                items={Object.entries(factoryDefaultParameters).map(([paramKey, defaultValue]) => ({
                  label: paramKey,
                  value: JSON.stringify(defaultValue)
                }))}
                columns={2}
              />
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {/* Fallback: show all fields if accordion sections are empty */}
      {Object.keys(nodeDataFields).length === 0 && Object.keys(processParameterFields).length === 0 && (
        <Section title="All Configuration Fields">
          {Object.entries(fields).map(([fieldKey, fieldConfig]) => (
            <FormField
              key={fieldKey}
              fieldKey={fieldKey}
              config={fieldConfig}
              value={formData[fieldKey]}
              onChange={(value) => onFieldChange(fieldKey, value)}
            />
          ))}
        </Section>
      )}

      <Separator />

      {/* Process Controls Section */}
      <Section title="Process Controls">
        {/* Use Test Data Checkbox */}
        <FormField
          fieldKey="useTestData"
          config={{
            fieldType: 'boolean',
            label: 'Use Test Data',
            defaultValue: false,
            description: 'Enable automatic test data generation for this node'
          }}
          value={formData.useTestData}
          onChange={(value) => onFieldChange('useTestData', value)}
        />

        {/* Auto-Generated Test Data Display */}
        {formData.useTestData && formData.generatedTestData && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Auto-Generated Test Data:</label>
            <div className="border rounded p-2 bg-gray-50 max-h-32 overflow-y-auto">
              <pre className="text-xs">{JSON.stringify(formData.generatedTestData, null, 2)}</pre>
            </div>
          </div>
        )}

        {/* Run Process Button */}
        <ActionButton
          icon={isProcessing ? RefreshCw : Play}
          text={isProcessing ? 'Processing...' : 'Run Process'}
          onClick={handleRunProcess}
          disabled={isProcessing}
          loading={isProcessing}
          className="w-full"
        />

        {/* Process Results Display */}
        {processResult && (
          <AlertBox
            type={processResult.success ? 'success' : 'error'}
            title={processResult.success ? '✓ Process completed successfully' : '✗ Process failed'}
            message={processResult.success ? (
              <div className="space-y-1">
                <div>Generated {processResult.dataGenerated} test data items</div>
                <div className="text-gray-600">Type: {processResult.type}</div>
                <div className="text-gray-600">Time: {new Date(processResult.timestamp).toLocaleTimeString()}</div>
              </div>
            ) : (
              processResult.error
            )}
          />
        )}
      </Section>
    </TabContainer>
  );
};