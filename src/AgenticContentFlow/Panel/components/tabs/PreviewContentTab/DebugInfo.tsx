import React from 'react';
import { Separator } from '@/components/ui/separator';
import { ListConfig } from '../../utils/contentPreviewUtils';

interface DebugInfoProps {
  previewData: any;
  listConfig: ListConfig;
  displayType: string;
  showDebugInfo: boolean;
}

export const DebugInfo: React.FC<DebugInfoProps> = ({ 
  previewData, 
  listConfig, 
  displayType, 
  showDebugInfo 
}) => {
  if (!showDebugInfo) return null;

  return (
    <>
      <Separator />
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-700">Debug Information:</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Raw Data */}
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">Raw Data:</h5>
            <div className="border rounded p-2 bg-gray-50 max-h-32 overflow-y-auto">
              {previewData ? (
                <pre className="text-xs">{JSON.stringify(previewData, null, 2)}</pre>
              ) : (
                <div className="text-xs text-gray-500">No data available</div>
              )}
            </div>
          </div>

          {/* Template Configuration */}
          {displayType === 'list' && listConfig.itemTemplate && (
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-gray-600">Template Configuration:</h5>
              <div className="border rounded p-2 bg-gray-50 max-h-32 overflow-y-auto">
                <pre className="text-xs">{JSON.stringify(listConfig.itemTemplate, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};