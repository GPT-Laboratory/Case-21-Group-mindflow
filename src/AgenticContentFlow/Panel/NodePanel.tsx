import React, { useState, useEffect } from 'react';
import { useSelect } from '../Select/contexts/SelectContext';
import { useNodeContext } from '../Node/store/useNodeContext';
import { Tabs, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { getNodeConfig, getVariantFields } from './nodeConfigs';
import { PanelFooter } from './components/PanelFooter';
import { PropertiesTab } from './components/tabs/PropertiesTab/PropertiesTab';
import { AppearanceTab } from './components/tabs/AppearanceTab/AppearanceTab';
import { PanelHeader } from './components/PanelHeader';
import { PositionSelector } from './components/PositionSelector';
import { PanelToggleDragHandle } from './components/PanelToggleDragHandle';
import { PanelContainer } from './components/PanelContainer';
import { useResizePanel } from './hooks/useResizePanel';
import { PreviewTab } from './components/tabs/PreviewTab/PreviewTab';

import { DebugTab } from './components/tabs/DebugTab.tsx/DebugTab';
import { ScrollableTabs } from './components/ScrollableTabs';
import { LogicTab } from './components/tabs/LogicTab/LogicTab';
import { AdvancedTab } from './components/tabs/AdvancedTab/AdvancedTab';
import { ContentPreviewTab } from './components/tabs/PreviewContentTab/ContentPreviewTab';
import { DataFlowTab } from './components/tabs/DataFlowTab/DataFlowTab';
import { CodeEditorTab } from './components/tabs/CodeEditorTab/CodeEditorTab';

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
                  <TabsTrigger value="appearance">Appearance</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  {/* Add Code Editor tab for factory nodes */}
                  {(activeNode.type === "restnode" || activeNode.type === "logicalnode" || activeNode.type === "contentnode") && (
                    <TabsTrigger value="codeeditor">Code Editor</TabsTrigger>
                  )}
                  {activeNode.type === "restnode" && (
                    <>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                      <TabsTrigger value="dataschema">Data Schema</TabsTrigger>
                    </>
                  )}
                  {activeNode.type === "logicalnode" && (
                    <>
                      <TabsTrigger value="logic">Logic</TabsTrigger>
                      <TabsTrigger value="dataschema">Data Schema</TabsTrigger>
                      <TabsTrigger value="debug">Debug</TabsTrigger>
                    </>
                  )}
                  {activeNode.type === "contentnode" && (
                    <>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                      <TabsTrigger value="dataschema">Data Schema</TabsTrigger>
                    </>
                  )}
                  {activeNode.type === "customnode" && (
                    <TabsTrigger value="logic">Logic</TabsTrigger>
                  )}
                </ScrollableTabs>
                
                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="properties" className="m-0">
                    <PropertiesTab 
                      fields={allFields}
                      formData={formData}
                      onFieldChange={handleFieldChange}
                      nodeId={activeNode.id}
                      nodeType={activeNode.type}
                    />
                  </TabsContent>
                  <TabsContent value="appearance" className="m-0">
                    <AppearanceTab 
                      activeNode={activeNode}
                      formData={formData}
                      onFieldChange={handleFieldChange}
                    />
                  </TabsContent>
                  <TabsContent value="advanced" className="m-0">
                    <AdvancedTab 
                      activeNode={activeNode}
                      formData={formData}
                      onFieldChange={handleFieldChange}
                    />
                  </TabsContent>
                  {activeNode.type === "restnode" && (
                    <>
                      <TabsContent value="preview" className="m-0">
                        <PreviewTab formData={formData} />
                      </TabsContent>
                      <TabsContent value="dataschema" className="m-0">
                        <DataFlowTab nodeId={activeNode.id} formData={formData} />
                      </TabsContent>
                    </>
                  )}
                  {activeNode.type === "logicalnode" && (
                    <>
                      <TabsContent value="logic" className="m-0">
                        <LogicTab 
                          nodeId={activeNode.id} 
                          formData={formData} 
                          onFieldChange={handleFieldChange} 
                        />
                      </TabsContent>
                      <TabsContent value="dataschema" className="m-0">
                        <DataFlowTab nodeId={activeNode.id} formData={formData} />
                      </TabsContent>
                      <TabsContent value="debug" className="m-0">
                        <DebugTab nodeId={activeNode.id} formData={formData} />
                      </TabsContent>
                    </>
                  )}
                  {activeNode.type === "contentnode" && (
                    <>
                      <TabsContent value="preview" className="m-0">
                        <ContentPreviewTab nodeId={activeNode.id} formData={formData} />
                      </TabsContent>
                      <TabsContent value="dataschema" className="m-0">
                        <DataFlowTab nodeId={activeNode.id} formData={formData} />
                      </TabsContent>
                    </>
                  )}
                  {/* Code Editor Tab for all factory nodes */}
                  {(activeNode.type === "restnode" || activeNode.type === "logicalnode" || activeNode.type === "contentnode") && (
                    <TabsContent value="codeeditor" className="m-0">
                      <CodeEditorTab 
                        nodeType={activeNode.type}
                        formData={formData} 
                        onFieldChange={handleFieldChange} 
                      />
                    </TabsContent>
                  )}
                  {activeNode.type === "customnode" && (
                    <TabsContent value="logic" className="m-0">
                      <LogicTab 
                        nodeId={activeNode.id} 
                        formData={formData} 
                        onFieldChange={handleFieldChange} 
                      />
                    </TabsContent>
                  )}
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