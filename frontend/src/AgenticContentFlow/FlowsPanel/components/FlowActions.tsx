/** @format */

import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Flow } from '../../stores/useFlowsStore';

interface FlowActionsProps {
  flow: Flow;
  isSelected: boolean;
  onDelete: (flowId: string) => void;
}

export const FlowActions: React.FC<FlowActionsProps> = ({
  flow,
  isSelected,
  onDelete,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`h-6 w-6 p-0 transition-all hover:bg-accent/80 rounded ${
            isSelected 
              ? 'opacity-100' 
              : 'opacity-0 group-hover:opacity-100 hover:opacity-100'
          }`}
          onClick={(e) => e.stopPropagation()}
          title="Flow options"
        >
          <MoreHorizontal className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[9999]">
        <DropdownMenuItem>Rename</DropdownMenuItem>
        <DropdownMenuItem>Duplicate</DropdownMenuItem>
        <DropdownMenuItem 
          className="text-destructive"
          onClick={() => onDelete(flow.id)}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 