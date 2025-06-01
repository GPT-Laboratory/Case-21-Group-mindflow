import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { dataSchemaManager, JSONSchema } from '../../Process/DataSchemaManager';

interface ContentPreviewTabProps {
  nodeId: string;
  formData: Record<string, any>;
}

export const ContentPreviewTab: React.FC<ContentPreviewTabProps> = ({ nodeId, formData }) => {
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [schemaValidation, setSchemaValidation] = useState<{ isValid: boolean; errors: string[]; warnings: string[] } | null>(null);

  // Get the expected schema from form data
  const expectedSchema: JSONSchema | undefined = formData.expectedSchema;
  const displayType = formData.displayType || 'list';
  const listConfig = formData.listConfig ? JSON.parse(formData.listConfig || '{}') : {};

  // Generate test data based on expected schema
  const generatePreviewData = () => {
    if (!expectedSchema) return null;
    return dataSchemaManager.generateTestData(expectedSchema);
  };

  // Load preview data
  const loadPreviewData = async () => {
    setIsLoading(true);
    try {
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const testData = generatePreviewData();
      setPreviewData(testData);
      
      // Validate schema if we have upstream data
      const nodeSchema = dataSchemaManager.getSchema(nodeId);
      if (nodeSchema?.inputSchema && expectedSchema) {
        const validation = dataSchemaManager.validateCompatibility(nodeSchema.inputSchema, expectedSchema);
        setSchemaValidation(validation);
      }
    } catch (error) {
      console.error('Failed to generate preview data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load preview data when component mounts or form data changes
  useEffect(() => {
    loadPreviewData();
  }, [formData.displayType, formData.listConfig, nodeId]);

  // Render list items based on template
  const renderListItems = (data: any[]) => {
    if (!Array.isArray(data)) return null;

    const template = listConfig.itemTemplate || {
      title: '{{title}}',
      subtitle: '{{body}}',
      metadata: 'ID: {{id}}'
    };

    return data.slice(0, formData.maxItems || 10).map((item, index) => (
      <div key={index} className="border rounded p-3 mb-2 bg-white">
        <div className="font-medium text-sm">
          {template.title?.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => item[key] || match)}
        </div>
        {template.subtitle && (
          <div className="text-sm text-gray-600 mt-1">
            {template.subtitle.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => item[key] || match)}
          </div>
        )}
        {template.metadata && (
          <div className="text-xs text-gray-500 mt-2">
            {template.metadata.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => item[key] || match)}
          </div>
        )}
      </div>
    ));
  };

  // Render table format
  const renderTable = (data: any[]) => {
    if (!Array.isArray(data) || data.length === 0) return null;

    const columns = Object.keys(data[0]);
    
    return (
      <div className="border rounded overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(col => (
                <th key={col} className="px-2 py-1 text-left font-medium">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, formData.maxItems || 10).map((row, index) => (
              <tr key={index} className="border-t">
                {columns.map(col => (
                  <td key={col} className="px-2 py-1">{String(row[col])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render cards format
  const renderCards = (data: any[]) => {
    if (!Array.isArray(data)) return null;

    return (
      <div className="grid grid-cols-1 gap-2">
        {data.slice(0, formData.maxItems || 10).map((item, index) => (
          <div key={index} className="border rounded p-2 bg-white">
            <div className="grid grid-cols-2 gap-1 text-xs">
              {Object.entries(item).map(([key, value]) => (
                <div key={key}>
                  <span className="font-medium">{key}:</span> {String(value)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Content Preview</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={loadPreviewData}
          disabled={isLoading}
        >
          {isLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Refresh
        </Button>
      </div>

      {/* Schema Validation Status */}
      {schemaValidation && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {schemaValidation.isValid ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span className="text-sm font-medium">
              Schema Validation: {schemaValidation.isValid ? 'Valid' : 'Issues Found'}
            </span>
          </div>
          
          {schemaValidation.errors.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-red-600">Errors:</div>
              {schemaValidation.errors.map((error, index) => (
                <div key={index} className="text-xs text-red-600 ml-2">• {error}</div>
              ))}
            </div>
          )}
          
          {schemaValidation.warnings.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-yellow-600">Warnings:</div>
              {schemaValidation.warnings.map((warning, index) => (
                <div key={index} className="text-xs text-yellow-600 ml-2">• {warning}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <Separator />

      {/* Display Configuration */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">Display Type:</span>
          <Badge variant="outline">{displayType}</Badge>
        </div>
        {formData.maxItems && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">Max Items:</span>
            <Badge variant="outline">{formData.maxItems}</Badge>
          </div>
        )}
      </div>

      <Separator />

      {/* Dual Display: Raw Data and Rendered Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Raw Data */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-700">Raw Data:</h4>
          <div className="border rounded p-2 bg-gray-50 max-h-40 overflow-y-auto">
            {isLoading ? (
              <div className="text-xs text-gray-500">Loading...</div>
            ) : previewData ? (
              <pre className="text-xs">{JSON.stringify(previewData, null, 2)}</pre>
            ) : (
              <div className="text-xs text-gray-500">No data available</div>
            )}
          </div>
        </div>

        {/* Rendered Preview */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-700">Rendered Preview:</h4>
          <div className="border rounded p-2 bg-gray-50 max-h-40 overflow-y-auto">
            {isLoading ? (
              <div className="text-xs text-gray-500">Rendering...</div>
            ) : previewData ? (
              <div>
                {displayType === 'list' && renderListItems(previewData)}
                {displayType === 'table' && renderTable(previewData)}
                {displayType === 'cards' && renderCards(previewData)}
                {displayType === 'custom' && (
                  <div className="text-xs text-gray-500">Custom display configuration needed</div>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-500">No preview available</div>
            )}
          </div>
        </div>
      </div>

      {/* Template Testing */}
      {displayType === 'list' && listConfig.itemTemplate && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-700">Template Configuration:</h4>
          <div className="border rounded p-2 bg-gray-50">
            <pre className="text-xs">{JSON.stringify(listConfig.itemTemplate, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};