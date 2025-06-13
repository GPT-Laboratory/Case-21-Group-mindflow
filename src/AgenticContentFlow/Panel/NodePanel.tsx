import React, { useState, useEffect } from 'react';
import { useSelect } from '../Select/contexts/SelectContext';
import { useNodeContext } from '../Node/store/useNodeContext';
import { Tabs, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { getNodeConfig, getVariantFields } from './nodeConfigs';
import { PanelFooter } from './components/PanelFooter';
import { PropertiesTab } from './components/tabs/PropertiesTab/PropertiesTab';
import { PanelHeader } from './components/PanelHeader';
import { PositionSelector } from './components/PositionSelector';
import { PanelToggleDragHandle } from './components/PanelToggleDragHandle';
import { PanelContainer } from './components/PanelContainer';
import { useResizePanel } from './hooks/useResizePanel';
import { ErrorsTab } from './components/tabs/ErrorsTab/ErrorsTab';
import { ScrollableTabs } from './components/ScrollableTabs';
import { ContentPreviewTab } from './components/tabs/PreviewContentTab/ContentPreviewTab';
import { DataFlowTab } from './components/tabs/DataFlowTab/DataFlowTab';
import { CodeEditorTab } from './components/tabs/CodeEditorTab/CodeEditorTab';
import { getNodeGroup, isProcessNode, isPreviewNode } from './types/nodeGroups';

type PanelPosition = 'top' | 'bottom' | 'left' | 'right';

const DEFAULT_SIZES = {
  top: { width: 0, height: 350 },
  bottom: { width: 0, height: 350 },
  left: { width: 400, height: 0 },
  right: { width: 400, height: 0 }
};

export const NodeConfigPanel: React.FC = () => {
  const { selectedNodes } = useSelect();
  const { updateNode } = useNodeContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState<PanelPosition>('right');
  const [activeNode, setActiveNode] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { size, isResizing, handleResizeStart } = useResizePanel({
    position,
    defaultSizes: DEFAULT_SIZES,
  });

  // Update active node when selection changes
  useEffect(() => {
    if (selectedNodes.length === 1) {
      const node = selectedNodes[0];
      setActiveNode(node);
      setFormData(node.data || {});
      setHasChanges(false);
    } else if (selectedNodes.length === 0) {
      setActiveNode(null);
    }
  }, [selectedNodes]);

  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldKey]: value
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (activeNode) {
      updateNode({
        ...activeNode,
        data: {
          ...activeNode.data,
          ...formData
        }
      });
      setHasChanges(false);
    }
  };

  const handleReset = () => {
    if (activeNode) {
      setFormData(activeNode.data || {});
      setHasChanges(false);
    }
  };

  const nodeConfig = activeNode ? getNodeConfig(activeNode.type, activeNode.data) : null;
  const variantFields = activeNode && nodeConfig ? getVariantFields(nodeConfig, formData, activeNode.data) : {};
  const allFields = nodeConfig ? { ...nodeConfig.configFields, ...variantFields } : {};

  return (
    <>
      {/* Toggle/Drag Handle */}
      <PanelToggleDragHandle
        isExpanded={isExpanded}
        position={position}
        size={size}
        hasChanges={hasChanges}
        onToggle={() => setIsExpanded(!isExpanded)}
        onResizeStart={handleResizeStart}
      />

      {/* Panel Container */}
      <PanelContainer
        isExpanded={isExpanded}
        position={position}
        size={size}
        isResizing={isResizing}
      >
        <div className="p-4 flex flex-col h-full">
          {/* Position Selector */}
          <div className="flex justify-between items-center mb-3">
            <PositionSelector 
              position={position} 
              onPositionChange={setPosition} 
            />
          </div>
          <Separator className="mb-4" />

          {/* Content */}
          {!activeNode ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              Select a node to configure
            </div>
          ) : (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Header */}
              <div className="mb-4">
                <PanelHeader activeNode={activeNode} nodeConfig={nodeConfig!} />
              </div>
              <Separator className="mb-4" />

              {/* Tabs */}
              <Tabs defaultValue="properties" className="flex flex-col flex-1 overflow-hidden">
                <ScrollableTabs className="mb-4">
                  <TabsTrigger value="properties">Properties</TabsTrigger>
                  
                  {/* Code Editor tab for ProcessNodes (restnode, logicalnode) */}
                  {isProcessNode(activeNode.type) && (
                    <TabsTrigger value="codeeditor">Code Editor</TabsTrigger>
                  )}
                  
                  {/* Content Preview tab for PreviewNodes (contentnode) */}
                  {isPreviewNode(activeNode.type) && (
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  )}
                  
                  {/* Data Schema tab - universal for all nodes */}
                  <TabsTrigger value="dataschema">Data Schema</TabsTrigger>
                  
                  {/* Errors tab - universal for all nodes */}
                  <TabsTrigger value="errors">Errors</TabsTrigger>
                </ScrollableTabs>
                
                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="properties" className="m-0">
                    <PropertiesTab 
                      fields={allFields}
                      formData={formData}
                      onFieldChange={handleFieldChange}
                      nodeId={activeNode.id}
                      nodeType={activeNode.type}
                      nodeGroup={getNodeGroup(activeNode.type)}
                    />
                  </TabsContent>
                  
                  {/* Code Editor Tab for ProcessNodes */}
                  {isProcessNode(activeNode.type) && (
                    <TabsContent value="codeeditor" className="m-0">
                      <CodeEditorTab 
                        nodeType={activeNode.type}
                        formData={formData} 
                        onFieldChange={handleFieldChange} 
                      />
                    </TabsContent>
                  )}
                  
                  {/* Content Preview Tab for PreviewNodes */}
                  {isPreviewNode(activeNode.type) && (
                    <TabsContent value="preview" className="m-0">
                      <ContentPreviewTab 
                        nodeId={activeNode.id} 
                        formData={formData} 
                      />
                    </TabsContent>
                  )}
                  
                  {/* Universal Data Schema Tab */}
                  <TabsContent value="dataschema" className="m-0">
                    <DataFlowTab nodeId={activeNode.id} formData={formData} />
                  </TabsContent>
                  
                  {/* Universal Errors Tab */}
                  <TabsContent value="errors" className="m-0">
                    <ErrorsTab nodeId={activeNode.id} formData={formData} />
                  </TabsContent>
                </div>
              </Tabs>

              {/* Footer */}
              <Separator className="my-4" />
              <PanelFooter 
                hasChanges={hasChanges}
                onSave={handleSave}
                onReset={handleReset}
              />
            </div>
          )}
        </div>
      </PanelContainer>
    </>
  );
};

export default NodeConfigPanel;