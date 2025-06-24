import React, { useState, useEffect, useRef } from 'react';
import { UnifiedFrameJSON } from '../../factory/types/UnifiedFrameJSON';
import { Badge } from '@/components/ui/badge';
import { IconResolver } from '../../factory/IconResolver';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface NodeTypeListProps {
  nodeTypes: UnifiedFrameJSON[];
  onNodeTypeSelect: (nodeType: string) => void;
  className?: string;
  isOpen?: boolean;
}

interface GroupedNodeTypes {
  cell: UnifiedFrameJSON[];
  container: UnifiedFrameJSON[];
}

const NodeTypeList: React.FC<NodeTypeListProps> = ({
  nodeTypes,
  onNodeTypeSelect,
  className = '',
  isOpen = false
}) => {
  const [activeTab, setActiveTab] = useState('cell');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const iconResolver = new IconResolver();

  // Reset focus when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(0);
      setActiveTab('cell');
      // Auto-focus the container after a short delay to ensure it's rendered
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen]);

  // Auto-scroll to focused item
  useEffect(() => {
    if (contentRef.current) {
      const focusedElement = contentRef.current.querySelector(`[data-node-type]:nth-child(${focusedIndex + 1})`) as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }
  }, [focusedIndex, activeTab]);

  // Group node types by their group (cell or container)
  const groupedNodeTypes = nodeTypes.reduce<GroupedNodeTypes>((acc, nodeType) => {
    if (nodeType.group === 'cell') {
      acc.cell.push(nodeType);
    } else if (nodeType.group === 'container') {
      acc.container.push(nodeType);
    }
    return acc;
  }, { cell: [], container: [] });

  // Get current active node types
  const activeNodeTypes = activeTab === 'cell' ? groupedNodeTypes.cell : groupedNodeTypes.container;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        event.stopPropagation();
        setFocusedIndex((prev) => (prev + 1) % activeNodeTypes.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        event.stopPropagation();
        setFocusedIndex((prev) => (prev - 1 + activeNodeTypes.length) % activeNodeTypes.length);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        event.stopPropagation();
        if (activeTab === 'container' && groupedNodeTypes.cell.length > 0) {
          setActiveTab('cell');
          setFocusedIndex(0);
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        event.stopPropagation();
        if (activeTab === 'cell' && groupedNodeTypes.container.length > 0) {
          setActiveTab('container');
          setFocusedIndex(0);
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        event.stopPropagation();
        if (activeNodeTypes[focusedIndex]) {
          onNodeTypeSelect(activeNodeTypes[focusedIndex].nodeType);
        }
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        // Close dropdown - this will be handled by the parent
        break;
      case 'Tab':
        // Let tab work normally for accessibility
        break;
    }
  };

  const renderNodeTypeItem = (nodeType: UnifiedFrameJSON, index: number) => {
    const iconElement = iconResolver.resolveIcon(nodeType.visual.icon, {
      className: "w-5 h-5",
      size: nodeType.visual.icon.size || 20
    });
    
    const isFocused = index === focusedIndex;
    
    return (
      <div
        key={nodeType.nodeType}
        data-node-type={nodeType.nodeType}
        className={`flex items-center gap-3 p-3 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer transition-colors focus:outline-none focus:ring-0 ${
          isFocused ? 'bg-accent text-accent-foreground border-b-2 border-primary' : ''
        }`}
        onClick={() => onNodeTypeSelect(nodeType.nodeType)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Create ${nodeType.defaultLabel} node`}
        aria-selected={isFocused}
      >
        {/* Icon */}
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
          {iconElement}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">
              {nodeType.defaultLabel}
            </span>
            <Badge 
              variant="secondary" 
              className="text-xs px-2 py-0.5"
            >
              {nodeType.category}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
            {nodeType.description}
          </p>
        </div>
      </div>
    );
  };

  const renderNodeTypeGroup = (nodeTypes: UnifiedFrameJSON[], groupName: string) => {
    if (nodeTypes.length === 0) {
      return (
        <div className="p-4 text-center text-muted-foreground text-sm">
          No {groupName} nodes available
        </div>
      );
    }

    return (
      <div className="space-y-1 p-2">
        {nodeTypes.map((nodeType, index) => renderNodeTypeItem(nodeType, index))}
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className={`${className} focus:outline-none`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="listbox"
      aria-label="Node type selection"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sticky top-0 bg-background z-10 border-b-2 border-border focus:outline-none">
          <TabsTrigger 
            value="cell" 
            className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent focus:outline-none focus:ring-0"
            onClick={() => setFocusedIndex(0)}
          >
            Process Nodes ({groupedNodeTypes.cell.length})
          </TabsTrigger>
          <TabsTrigger 
            value="container" 
            className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent focus:outline-none focus:ring-0"
            onClick={() => setFocusedIndex(0)}
          >
            Container Nodes ({groupedNodeTypes.container.length})
          </TabsTrigger>
        </TabsList>
        
        <div ref={contentRef} className="max-h-64 overflow-y-auto focus:outline-none">
          <TabsContent value="cell" className="mt-2">
            {renderNodeTypeGroup(groupedNodeTypes.cell, 'process')}
          </TabsContent>
          
          <TabsContent value="container" className="mt-2">
            {renderNodeTypeGroup(groupedNodeTypes.container, 'container')}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default NodeTypeList; 