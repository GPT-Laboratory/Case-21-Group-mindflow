import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bug, AlertTriangle, CheckCircle, Clock, Activity, Zap } from 'lucide-react';
import { useProcessContext } from '../../../../Process/ProcessContext';

interface DebugTabProps {
  nodeId: string;
  formData: Record<string, any>;
}

export const DebugTab: React.FC<DebugTabProps> = ({ nodeId, formData }) => {
  const processContext = useProcessContext();
  const processState = processContext.getNodeProcessState(nodeId);
  const availableData = processContext.getFlowData(nodeId);
  const lastData = processContext.getNodeLastData?.(nodeId);

  const getStatusColor = () => {
    switch (processState.status) {
      case 'processing': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (processState.status) {
      case 'processing': return <Activity className="w-4 h-4 animate-pulse" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  const renderDataSection = (data: any, title: string, icon: React.ReactNode) => {
    if (!data) return null;

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </h4>
        <div className="border rounded p-3 bg-gray-50 font-mono text-xs max-h-40 overflow-y-auto">
          <pre className="overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center space-x-2">
          <Bug className="w-4 h-4" />
          <span>Debug Information</span>
        </CardTitle>
        <CardDescription className="text-xs">
          Process state, errors, and debugging information for this LogicalNode
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Process Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${getStatusColor()}`}>
              {getStatusIcon()}
              {processState.status === 'idle' ? 'Idle' :
               processState.status === 'processing' ? 'Processing' :
               processState.status === 'completed' ? 'Completed' :
               processState.status === 'error' ? 'Error' : 'Unknown'}
            </Badge>
            {processState.startTime && (
              <span className="text-xs text-gray-500">
                Started: {formatTimestamp(processState.startTime)}
              </span>
            )}
          </div>
        </div>

        <Separator />

        {/* Error Information */}
        {processState.status === 'error' && processState.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-red-700">
                <strong>Error:</strong>
                <div className="mt-1 p-2 bg-red-100 rounded font-mono text-red-800">
                  {processState.error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Node Configuration */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Node Configuration
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-gray-50 rounded">
              <span className="font-medium">Operation:</span> {formData.operation || 'filter'}
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <span className="font-medium">Node ID:</span> {nodeId}
            </div>
            <div className="col-span-2 p-2 bg-gray-50 rounded">
              <span className="font-medium">Condition:</span> 
              <div className="mt-1 font-mono text-gray-700">
                {formData.condition || 'No condition set'}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Process Data */}
        {processState.data && renderDataSection(
          processState.data, 
          'Current Process Data', 
          <Activity className="w-4 h-4" />
        )}

        {/* Available Input Data */}
        {availableData && renderDataSection(
          availableData, 
          'Available Input Data', 
          <Clock className="w-4 h-4" />
        )}

        {/* Last Processed Data */}
        {lastData && renderDataSection(
          lastData, 
          'Last Processed Data', 
          <CheckCircle className="w-4 h-4" />
        )}

        {/* Process History */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Process Timeline
          </h4>
          <div className="space-y-1 text-xs">
            {processState.startTime && (
              <div className="flex justify-between p-2 bg-blue-50 rounded">
                <span>Process Started</span>
                <span className="font-mono">{formatTimestamp(processState.startTime)}</span>
              </div>
            )}
            {processState.status === 'completed' && (
              <div className="flex justify-between p-2 bg-green-50 rounded">
                <span>Process Completed</span>
                <span className="font-mono">{formatTimestamp(Date.now())}</span>
              </div>
            )}
            {processState.status === 'error' && (
              <div className="flex justify-between p-2 bg-red-50 rounded">
                <span>Error Occurred</span>
                <span className="font-mono">{formatTimestamp(Date.now())}</span>
              </div>
            )}
          </div>
        </div>

        {/* No Debug Info Message */}
        {processState.status === 'idle' && !availableData && !lastData && (
          <div className="text-center py-8 text-gray-500">
            <Bug className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No debug information available</p>
            <p className="text-xs">
              Process this node or connect it to other nodes to see debug information
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};