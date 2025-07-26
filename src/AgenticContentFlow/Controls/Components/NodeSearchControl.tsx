import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNodeContext } from '../../Node/context/useNodeContext';
import { useReactFlow } from '@xyflow/react';

export const NodeSearchControl: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { nodes } = useNodeContext();
  const { fitView, setCenter } = useReactFlow();

  // Find matching nodes
  const matchingNodes = searchTerm ? nodes.filter(node => {
    const functionName = node.data?.functionName?.toLowerCase() || '';
    const label = node.data?.label?.toLowerCase() || '';
    const description = node.data?.functionDescription?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    return functionName.includes(search) || 
           label.includes(search) || 
           description.includes(search);
  }) : [];

  // Focus on first matching node
  useEffect(() => {
    if (matchingNodes.length > 0 && searchTerm) {
      const firstMatch = matchingNodes[0];
      if (firstMatch.position) {
        setCenter(firstMatch.position.x, firstMatch.position.y, { zoom: 1.2, duration: 500 });
      }
    }
  }, [matchingNodes, searchTerm, setCenter]);

  const handleClear = () => {
    setSearchTerm('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <Search className="h-4 w-4" />
        Find Function
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-background border rounded-md p-1">
      <Search className="h-4 w-4 text-muted-foreground ml-2" />
      <Input
        placeholder="Search functions..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border-0 focus-visible:ring-0 h-8 w-48"
        autoFocus
      />
      {searchTerm && (
        <span className="text-xs text-muted-foreground px-2">
          {matchingNodes.length} found
        </span>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClear}
        className="h-6 w-6 p-0"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};