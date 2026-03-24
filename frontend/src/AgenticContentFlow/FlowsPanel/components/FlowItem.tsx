/** @format */

import React from 'react';
import { FileText } from 'lucide-react';
import { Flow } from '../../stores/useFlowsStore';
import { FlowActions } from './FlowActions';

interface FlowItemProps {
  flow: Flow;
  isSelected: boolean;
  onSelect: (flowId: string) => void;
  onRename: (flow: Flow) => void;
  onDelete: (flowId: string) => void;
}

export const FlowItem: React.FC<FlowItemProps> = ({
  flow,
  isSelected,
  onSelect,
  onRename,
  onDelete,
}) => {
  return (
    <div 
      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors hover:bg-accent/50 group relative ${
        isSelected ? 'bg-accent' : ''
      }`}
      onClick={() => onSelect(flow.id)}
    >
      <div className="flex-shrink-0">
        <FileText className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0 pr-2">
        <h3 className="text-sm truncate">{flow.name}</h3>
        <p className="text-xs text-muted-foreground truncate">
          {flow.nodeCount} nodes, {flow.edgeCount} edges
        </p>
      </div>
      
      <FlowActions 
        flow={flow}
        isSelected={isSelected}
        onRename={onRename}
        onDelete={onDelete}
      />
    </div>
  );
}; 