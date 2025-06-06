import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { useContentPreview } from '../../hooks/useContentPreview';
import { ContentDisplay } from '../../ContentDisplay';
import { SchemaValidationDisplay } from '../../SchemaValidationDisplay';
import { ApprovalActions } from '../../ApprovalActions';
import { DataSourceInfo } from '../../DataSourceInfo';
import { DebugInfo } from '../../DebugInfo';
import { 
  parseListConfig, 
  ApprovalStatus, 
  DisplayType 
} from '../../utils/contentPreviewUtils';
import { JSONSchema } from '@/AgenticContentFlow/Process/DataSchemaManager';

interface ContentPreviewTabProps {
  nodeId: string;
  formData: Record<string, any>;
}

export const ContentPreviewTab: React.FC<ContentPreviewTabProps> = ({ nodeId, formData }) => {
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('pending');

  // Get the expected schema from form data
  const expectedSchema: JSONSchema | undefined = formData.expectedSchema;
  const displayType: DisplayType = formData.displayType || 'list';
  const listConfig = parseListConfig(formData.listConfig);

  // Use the custom hook for data management
  const {
    previewData,
    isLoading,
    schemaValidation,
    dataSource,
    loadPreviewData
  } = useContentPreview({ nodeId, expectedSchema });

  // Handle approval actions
  const handleApprove = () => {
    setApprovalStatus('approved');
    console.log('Content approved for node:', nodeId);
  };

  const handleDecline = () => {
    setApprovalStatus('declined');
    console.log('Content declined for node:', nodeId);
  };

  const resetApproval = () => {
    setApprovalStatus('pending');
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
      <SchemaValidationDisplay validation={schemaValidation} />

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

      {/* Main Preview Area */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <h4 className="text-sm font-medium">Component Preview</h4>
          <Badge variant={approvalStatus === 'approved' ? 'default' : 'secondary'}>
            {approvalStatus}
          </Badge>
        </div>
        
        <div className="border-2 rounded-lg p-4 bg-white min-h-[200px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading preview...</span>
            </div>
          ) : previewData ? (
            <div className="space-y-4">
              {/* Display Type Indicator */}
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                {displayType} View ({Array.isArray(previewData) ? previewData.length : 1} items)
              </div>
              
              {/* Rendered Content */}
              <ContentDisplay
                data={Array.isArray(previewData) ? previewData : [previewData]}
                displayType={displayType}
                listConfig={listConfig}
                maxItems={formData.maxItems}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <div className="text-sm">No data to preview</div>
                <div className="text-xs">Connect data source or configure test data</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Source Information */}
      <DataSourceInfo previewData={previewData} dataSource={dataSource} />

      <Separator />

      {/* Approval Actions */}
      <ApprovalActions
        approvalStatus={approvalStatus}
        onApprove={handleApprove}
        onDecline={handleDecline}
        onReset={resetApproval}
        hasData={!!previewData}
      />

      {/* Advanced Debug Section */}
      <DebugInfo
        previewData={previewData}
        listConfig={listConfig}
        displayType={displayType}
        showDebugInfo={formData.showDebugInfo}
      />
    </div>
  );
};