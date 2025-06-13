import React from 'react';
import { AlertTriangle, XCircle, Clock, Activity, Zap } from 'lucide-react';
import { useProcessContext } from '../../../../Process/ProcessContext';
import { 
  TabContainer, 
  StatusBadge, 
  AlertBox, 
  DataDisplay, 
  MetadataGrid,
  Section,
  EmptyState,
  Separator 
} from '../../shared';

interface ErrorsTabProps {
  nodeId: string;
  formData: Record<string, any>;
}

export const ErrorsTab: React.FC<ErrorsTabProps> = ({ nodeId, formData }) => {
  const processContext = useProcessContext();
  const processState = processContext.getNodeProcessState(nodeId);

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  // Handle error display - processState.error is a string, not an Error object
  const renderError = () => {
    if (typeof processState.error === 'string') {
      return processState.error;
    } else if (processState.error && typeof processState.error === 'object') {
      return (
        <div className="space-y-2">
          <div className="font-medium">{(processState.error as any).message || 'Unknown error'}</div>
          {(processState.error as any).stack && (
            <pre className="text-xs bg-red-100 p-2 rounded overflow-x-auto">
              {(processState.error as any).stack}
            </pre>
          )}
        </div>
      );
    }
    return 'Unknown error';
  };

  const hasErrors = processState.status === 'error' && processState.error;

  return (
    <TabContainer
      title="Errors & Issues"
      description="Error monitoring, debugging information, and issue tracking for this node"
      icon={AlertTriangle}
    >
      {/* Current Error Status */}
      <Section 
        title="Error Status"
        icon={Activity}
      >
        {hasErrors ? (
          <StatusBadge
            status="error"
            icon={XCircle}
            customText="Node has errors"
            timestamp={processState.startTime ? 
              `Error occurred: ${formatTimestamp(processState.startTime)}` : 
              undefined
            }
          />
        ) : (
          <StatusBadge
            status="success"
            customText="No errors detected"
          />
        )}
      </Section>

      <Separator />

      {/* Error Details */}
      {hasErrors ? (
        <AlertBox
          type="error"
          icon={AlertTriangle}
          title="Current Error"
          message={renderError()}
        />
      ) : (
        <EmptyState
          icon={AlertTriangle}
          title="No errors found"
          description="This node is currently operating without errors"
        />
      )}

      {/* Error Timeline */}
      {processState.startTime && (
        <Section title="Error Timeline" icon={Clock}>
          <div className="space-y-1 text-xs">
            {processState.startTime && (
              <div className="flex justify-between p-2 bg-blue-50 rounded">
                <span>Process Started</span>
                <span className="font-mono">{formatTimestamp(processState.startTime)}</span>
              </div>
            )}
            {processState.status === 'error' && (
              <div className="flex justify-between p-2 bg-red-50 rounded">
                <span>Error Occurred</span>
                <span className="font-mono">{formatTimestamp(Date.now())}</span>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Node Configuration Issues */}
      <Section title="Configuration Check" icon={Zap}>
        <MetadataGrid
          items={[
            { 
              label: 'Status', 
              value: processState.status 
            },
            { 
              label: 'Node ID', 
              value: nodeId, 
              span: 2 
            },
            { 
              label: 'Condition Valid', 
              value: formData.condition ? 'Yes' : 'No condition set'
            },
            {
              label: 'Has Required Data',
              value: processState.data ? 'Yes' : 'No'
            }
          ]}
          columns={2}
        />
      </Section>

      {/* Error Data Context (only show if there's an error) */}
      {hasErrors && processState.data && (
        <DataDisplay
          data={processState.data}
          title="Error Context Data"
          icon={XCircle}
          maxHeight="max-h-32"
        />
      )}
    </TabContainer>
  );
};