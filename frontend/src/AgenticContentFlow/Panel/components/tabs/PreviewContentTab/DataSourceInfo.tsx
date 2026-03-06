import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DataSource } from '../../utils/contentPreviewUtils';

interface DataSourceInfoProps {
  previewData: any;
  dataSource: DataSource;
}

export const DataSourceInfo: React.FC<DataSourceInfoProps> = ({ previewData, dataSource }) => {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-700">Data Source:</h4>
      <div className="text-xs text-gray-600">
        {previewData ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge 
                variant={dataSource === 'realtime' ? 'default' : 'secondary'} 
                className="text-xs"
              >
                {dataSource === 'realtime' ? '🔴 Live Data' : '🧪 Test Data'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {Array.isArray(previewData) ? 'Array' : typeof previewData}
              </Badge>
              <span>
                {Array.isArray(previewData) 
                  ? `${previewData.length} items loaded`
                  : 'Single object loaded'
                }
              </span>
            </div>
            {dataSource === 'realtime' && (
              <div className="text-xs text-green-600">
                ✓ Showing actual data from connected nodes
              </div>
            )}
            {dataSource === 'test' && (
              <div className="text-xs text-yellow-600">
                ⚠ Showing generated test data (no live data available)
              </div>
            )}
          </div>
        ) : (
          <span className="text-gray-400">No data source configured</span>
        )}
      </div>
    </div>
  );
};