import React, { useState } from 'react';
import { Plus, FileText, Clock, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useEdgeContext } from '../Edge/store/useEdgeContext';
import { useNodeContext } from '../Node/context/useNodeContext';
import { PanelToggleDragHandle } from '../Panel/components/PanelHandle';
import { useResizePanel } from '../Panel/hooks/useResizePanel';

// Import existing test data
import { childNodesData, parentNodesData } from '../test/default/nodesData';
import { edgesData } from '../test/default/edgeData';
import { initialSimpleNodes } from '../test/simpleBasic/nodesData';
import { initialSimpleEdges } from '../test/simpleBasic/edgeData';
import { lmsNodesData } from '../test/lms/nodesData';
import { lmsEdgesData } from '../test/lms/edgeData';
import { apiFlowNodesData, apiFlowEdgesData } from '../test/rest/apiFlowNodesEdges';

interface Flow {
  id: string;
  name: string;
  description: string;
  lastModified: Date;
  nodeCount: number;
  edgeCount: number;
  type: 'template' | 'saved' | 'recent';
}

const DEFAULT_SIZES = {
  top: { width: 0, height: 350 },
  bottom: { width: 0, height: 350 },
  left: { width: 140, height: 0 },
  right: { width: 400, height: 0 }
};

export const FlowsPanel: React.FC = () => {
  const { setEdges } = useEdgeContext();
  const { setNodes } = useNodeContext();
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [position] = useState<'left'>('left');

  const { size, isResizing, handleResizeStart } = useResizePanel({
    position,
    defaultSizes: DEFAULT_SIZES,
  });

  // Define available flows using existing test data
  const flows: Flow[] = [
    {
      id: 'create-new',
      name: 'Create New Flow',
      description: 'Start with a blank canvas',
      lastModified: new Date(),
      nodeCount: 0,
      edgeCount: 0,
      type: 'template'
    },
    {
      id: 'simple',
      name: 'Simple Example',
      description: 'Basic flow with simple nodes',
      lastModified: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      nodeCount: initialSimpleNodes.length,
      edgeCount: initialSimpleEdges.length,
      type: 'template'
    },
    {
      id: 'default',
      name: 'Default Example',
      description: 'Complex flow with parent-child relationships',
      lastModified: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      nodeCount: parentNodesData.length + childNodesData.length,
      edgeCount: edgesData.length,
      type: 'template'
    },
    {
      id: 'rest-api',
      name: 'REST API Flow',
      description: 'Cell process example with API integration',
      lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      nodeCount: apiFlowNodesData.length,
      edgeCount: apiFlowEdgesData.length,
      type: 'template'
    },
    {
      id: 'lms',
      name: 'LMS Flow',
      description: 'Learning management system with containers',
      lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      nodeCount: lmsNodesData.length,
      edgeCount: lmsEdgesData.length,
      type: 'template'
    }
  ];

  const loadFlow = (flowId: string) => {
    setSelectedFlowId(flowId);
    
    switch (flowId) {
      case 'create-new':
        setNodes([]);
        setEdges([]);
        break;
      case 'simple':
        setNodes(initialSimpleNodes);
        setEdges(initialSimpleEdges);
        break;
      case 'default':
        setNodes([...parentNodesData, ...childNodesData]);
        setEdges(edgesData);
        break;
      case 'rest-api':
        setNodes(apiFlowNodesData);
        setEdges(apiFlowEdgesData);
        break;
      case 'lms':
        setNodes(lmsNodesData);
        setEdges(lmsEdgesData);
        break;
      default:
        console.warn('Unknown flow:', flowId);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    }
  };

  const getFlowIcon = (flow: Flow) => {
    if (flow.id === 'create-new') {
      return <Plus className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const getPositionStyles = () => {
    const baseStyle = {
      position: 'relative' as const,
      backgroundColor: 'var(--background)',
      zIndex: 100,
      transition: isResizing ? 'none' : 'all 0.3s ease-in-out',
      height: '100%',
      overflow: 'visible' as const,
      paddingRight: '10px',
    };

    return {
      ...baseStyle,
      width: isExpanded ? `${size.width}px` : '0px',
      minWidth: isExpanded ? `${size.width}px` : '0px',
      maxWidth: isExpanded ? `${size.width}px` : '0px',
    };
  };

  return (
    <div style={getPositionStyles()}>
      {/* Handle */}
      <PanelToggleDragHandle
        isExpanded={isExpanded}
        position={position}
        size={size}
        hasChanges={false}
        onToggle={() => setIsExpanded(!isExpanded)}
        onResizeStart={handleResizeStart}
      />

      {/* Panel Content */}
      {isExpanded && (
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-3 border-b border-border">
            <h2 className="text-sm font-semibold">Flows</h2>
          </div>

          {/* Flows List */}
          <div className="flex-1 overflow-y-auto p-1 space-y-1">
            {flows.map((flow) => (
              <div 
                key={flow.id}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors hover:bg-accent/50 ${
                  selectedFlowId === flow.id ? 'bg-accent' : ''
                }`}
                onClick={() => loadFlow(flow.id)}
              >
                <div className="flex-shrink-0">
                  {getFlowIcon(flow)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm truncate">{flow.name}</h3>
                </div>
                
                {flow.id !== 'create-new' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Rename</DropdownMenuItem>
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlowsPanel; 