/** @format */

import React from 'react';
import { Loader2, FileText } from 'lucide-react';
import { Flow } from '../../stores/useFlowsStore';
import { FlowItem } from './FlowItem';
import { CreateNewFlow } from './CreateNewFlow';

interface FlowsListProps {
  flows: Flow[];
  loading: boolean;
  error: string | null;
  selectedFlowId: string | null;
  onLoadFlow: (flowId: string) => void;
  onDeleteFlow: (flowId: string) => void;
}

export const FlowsList: React.FC<FlowsListProps> = ({
  flows,
  loading,
  error,
  selectedFlowId,
  onLoadFlow,
  onDeleteFlow,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Loading flows...</span>
      </div>
    );
  }

  return (
    <>
      {/* Create New Flow - Always first */}
      <CreateNewFlow 
        isSelected={selectedFlowId === null}
        onSelect={() => onLoadFlow('create-new')}
      />

      {/* Saved Flows */}
      {flows.map((flow) => (
        <FlowItem
          key={flow.id}
          flow={flow}
          isSelected={selectedFlowId === flow.id}
          onSelect={onLoadFlow}
          onDelete={onDeleteFlow}
        />
      ))}

      {/* Empty State */}
      {flows.length === 0 && !loading && (
        <div className="flex items-center justify-center p-4 text-center">
          <div>
            <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No saved flows</p>
            <p className="text-xs text-muted-foreground">
              {error ? 'Server connection issue. Check if test server is running.' : 'Create your first flow to get started'}
            </p>
          </div>
        </div>
      )}
    </>
  );
}; 