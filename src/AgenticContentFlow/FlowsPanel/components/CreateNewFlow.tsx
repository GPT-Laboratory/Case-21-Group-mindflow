/** @format */

import React from 'react';
import { Plus } from 'lucide-react';

interface CreateNewFlowProps {
  isSelected: boolean;
  onSelect: () => void;
}

export const CreateNewFlow: React.FC<CreateNewFlowProps> = ({
  isSelected,
  onSelect,
}) => {
  return (
    <div 
      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors hover:bg-accent/50 ${
        isSelected ? 'bg-accent' : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex-shrink-0">
        <Plus className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm truncate">Create New Flow</h3>
      </div>
    </div>
  );
}; 