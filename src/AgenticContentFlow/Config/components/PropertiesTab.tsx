import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Play, RefreshCw } from 'lucide-react';
import { FieldConfig } from '../types';
import { dataSchemaManager } from '../../Process/DataSchemaManager';
import { FormField } from './common/FormField';

interface PropertiesTabProps {
  fields: Record<string, FieldConfig>;
  formData: Record<string, any>;
  onFieldChange: (fieldKey: string, value: any) => void;
  nodeId?: string;
  nodeType?: string;
}

export const PropertiesTab: React.FC<PropertiesTabProps> = ({ 
  fields, 
  formData, 
  onFieldChange,
  nodeId,
  nodeType
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<any>(null);

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
            testData: dataSchemaManager.generateTestData(upstreamSchema.inputSchema)
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
            testData: dataSchemaManager.generateTestData(expectedSchema)
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center space-x-2">
          <Settings className="w-4 h-4" />
          <span>Node Configuration</span>
        </CardTitle>
        <CardDescription className="text-xs">
          Configure the behavior and properties of this node
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Regular configuration fields */}
        {Object.entries(fields).map(([fieldKey, fieldConfig]) => (
          <FormField
            key={fieldKey}
            fieldKey={fieldKey}
            config={fieldConfig}
            value={formData[fieldKey]}
            onChange={(value) => onFieldChange(fieldKey, value)}
          />
        ))}

        <Separator className="my-4" />

        {/* Process Controls Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Process Controls</h4>
            {nodeType && (
              <Badge variant="outline" className="text-xs">{nodeType}</Badge>
            )}
          </div>

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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunProcess}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
              ) : (
                <Play className="w-3 h-3 mr-2" />
              )}
              {isProcessing ? 'Processing...' : 'Run Process'}
            </Button>
          </div>

          {/* Process Results Display */}
          {processResult && (
            <div className={`p-3 rounded border text-xs ${
              processResult.success 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {processResult.success ? (
                <div className="space-y-1">
                  <div className="font-medium">✓ Process completed successfully</div>
                  <div>Generated {processResult.dataGenerated} test data items</div>
                  <div className="text-gray-600">Type: {processResult.type}</div>
                  <div className="text-gray-600">Time: {new Date(processResult.timestamp).toLocaleTimeString()}</div>
                </div>
              ) : (
                <div>
                  <div className="font-medium">✗ Process failed</div>
                  <div>{processResult.error}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};