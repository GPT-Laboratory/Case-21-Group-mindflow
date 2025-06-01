import React, { useState, useEffect } from 'react';
import { NodeProps } from '@xyflow/react';
import { DataNodeContainer } from './DataNodeStyles';
import {
    NodeHeader,
    NodeHeaderMenuAction,
    NodeHeaderDeleteAction
} from '../common/NodeHeader';
import { useUpdateNodeInternals, useReactFlow } from '@xyflow/react';
import { LAYOUT_CONSTANTS } from '../../Layout/utils/layoutUtils';
import CornerResizer from '../common/CornerResizer';
import ConnectionHandles from '../common/ConnectionHandles';
import ExpandCollapseButton from '../common/ExpandCollapseButton';
import { colorByDepth } from '../common/utils/colorByDepth';
import { useNodeProcess } from '../../Process/useNodeProcess';

import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

// Components that might need conversion but are used as-is for now
import CircleStackIcon from '@/components/icons/circle-stack';

/**
 * Data Node Component
 * 
 * Represents a data source or repository in a flow diagram.
 * Has a distinctive folder appearance.
 * Accepts data primarily from left side, produces data primarily to right side.
 * Also maintains top/bottom connections for sibling/conditional communication.
 */
export const DataNode: React.FC<NodeProps> = ({ id, data, selected }) => {
    const updateNodeInternals = useUpdateNodeInternals();
    const { getNode } = useReactFlow();
    const nodeInFlow = getNode(id);
    const [isExpanded, setIsExpanded] = useState(nodeInFlow?.data.expanded || false);

    // Use the process system
    const { 
        processState, 
        isProcessing, 
        isCompleted, 
        hasError,
        startProcess, 
        completeProcess, 
        setError 
    } = useNodeProcess({ 
        nodeId: id,
        autoAcknowledge: true,
        acknowledgeDelay: 150 
    });

    useEffect(() => {
        if (nodeInFlow) {
            setIsExpanded(Boolean(nodeInFlow.data?.expanded));
        }
    }, [nodeInFlow]);

    const nodeDepth = nodeInFlow?.data.depth || 0;
    const color = colorByDepth(nodeDepth as number);

    if (!nodeInFlow) {
        console.error(`Node with id ${id} not found in store.`);
        return null;
    }

    // Default dimensions for the container
    const collapsedDimensions = {
        width: 300,
        height: 60,
    };

    const expandedDimensions = {
        width: nodeInFlow?.width || 300,
        height: nodeInFlow?.height || 300,
    };

    // Type checking for data properties
    const nodeLabel = data?.label ? String(data.label) : 'Files';

    // Simulate data loading/processing
    const handleLoadData = async () => {
        try {
            startProcess({ action: 'loading', source: nodeLabel });
            
            // Simulate data loading time
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const result = {
                source: nodeLabel,
                loaded: true,
                records: Math.floor(Math.random() * 1000) + 100,
                timestamp: new Date().toISOString(),
                data: `Loaded data from ${nodeLabel}`
            };
            
            completeProcess(result);
        } catch (error) {
            setError(`Failed to load data: ${error}`);
        }
    };

    // Custom menu items for file operations
    const fileNodeMenuItems = [
        <DropdownMenuItem key="load" onClick={handleLoadData}>
            Load Data
        </DropdownMenuItem>,
        <DropdownMenuItem key="open" onClick={() => console.log('Open file')}>
            Open File
        </DropdownMenuItem>,
        <DropdownMenuItem key="download" onClick={() => console.log('Download file')}>
            Download
        </DropdownMenuItem>,
        <DropdownMenuItem key="share" onClick={() => console.log('Share file')}>
            Share
        </DropdownMenuItem>
    ];

    return (
        <>
            <CornerResizer
                minHeight={LAYOUT_CONSTANTS.NODE_DEFAULT_HEIGHT}
                minWidth={LAYOUT_CONSTANTS.NODE_DEFAULT_WIDTH}
                nodeToResize={nodeInFlow}
                canResize={selected}
                color={color}
            />

            <DataNodeContainer
                onTransitionEnd={() => updateNodeInternals(id)}
                selected={selected}
                color={color}
                processing={isProcessing}
                processState={processState.status}
                className="w-full h-full flex flex-col select-none transition-[width,height] duration-200 ease-in-out"
                style={{
                    width: nodeInFlow?.width || collapsedDimensions.width,
                    height: nodeInFlow?.height || (isExpanded ? expandedDimensions.height : collapsedDimensions.height),
                    backgroundColor: color,
                }}
            >
                {/* Connection handles */}
                <ConnectionHandles 
                    nodeType="datanode"
                    color={color} 
                    icons={{
                        left: <ArrowLeft className="size-4" />,
                        right: <ArrowRight className="size-4" />,
                        top: <ArrowUp className="size-4" />,
                        bottom: <ArrowDown className="size-4" />
                    }}
                />

                <NodeHeader 
                    className="dragHandle"
                    icon={
                        <CircleStackIcon
                            className={`
                                ${isExpanded ? 'relative w-6 h-6' : 'absolute w-16 h-16'} 
                                ${isExpanded ? '' : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'}
                                stroke-slate transition-all
                                ${isProcessing ? 'animate-pulse' : ''}
                            `}
                        />
                    }
                    label={nodeLabel}
                    isProcessing={isProcessing}
                    isCompleted={isCompleted}
                    hasError={hasError}
                    menuItems={fileNodeMenuItems}
                >
                    <ExpandCollapseButton
                        collapsedDimensions={collapsedDimensions}
                        expandedDimensions={expandedDimensions}
                        nodeInFlow={nodeInFlow}
                    />
                </NodeHeader>

                {/* Expanded content area */}
                {isExpanded && (
                    <div className="flex-1 p-4 text-sm">
                        {hasError ? (
                            <div className="text-red-600">
                                Error: {processState.error}
                            </div>
                        ) : isProcessing ? (
                            <div className="text-blue-600 animate-pulse">
                                Loading data...
                            </div>
                        ) : isCompleted && processState.data ? (
                            <div className="space-y-2">
                                <div className="font-medium text-green-600">Data Loaded</div>
                                <div className="text-xs text-gray-600">
                                    Records: {processState.data.records}
                                </div>
                                <div className="text-xs text-gray-500">
                                    Last updated: {new Date(processState.data.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-500">
                                Click "Load Data" to fetch data from this source
                            </div>
                        )}
                    </div>
                )}
            </DataNodeContainer>
        </>
    );
};

export default DataNode;