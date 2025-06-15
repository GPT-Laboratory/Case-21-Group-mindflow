import React, { useState, useEffect } from 'react';
import { useSelect } from '../Select/contexts/SelectContext';
import { useNodeContext } from '../Node/store/useNodeContext';
import { Tabs, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { getNodeConfig, getVariantFields } from './nodeConfigs';
import { PanelFooter } from './components/PanelFooter';
import { PropertiesTab } from './components/tabs/PropertiesTab/PropertiesTab';
import { ParametersTab } from './components/tabs/ParametersTab/ParametersTab';
import { PanelHeader } from './components/PanelHeader';
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
  const [hasDataChanges, setHasDataChanges] = useState(false);

  const { size, isResizing, handleResizeStart } = useResizePanel({
    position,
    defaultSizes: DEFAULT_SIZES,
  });

  // Track data changes for generate button
  useEffect(() => {
    if (activeNode) {
      const originalData = activeNode.data || {};
      const currentKeys = Object.keys(formData);
      const originalKeys = Object.keys(originalData);
      
      // Check if data structure has changed (keys added/removed) or values changed
      const keysChanged = currentKeys.length !== originalKeys.length || 
        currentKeys.some(key => !originalKeys.includes(key)) ||
        originalKeys.some(key => !currentKeys.includes(key));
        
      const valuesChanged = currentKeys.some(key => 
        JSON.stringify(formData[key]) !== JSON.stringify(originalData[key])
      );
      
      setHasDataChanges(keysChanged || valuesChanged);
    }
  }, [formData, activeNode]);

  // Update active node when selection changes
  useEffect(() => {
    if (selectedNodes.length === 1) {
      const node = selectedNodes[0];
      setActiveNode(node);
      setFormData(node.data || {});
      setHasChanges(false);
      setHasDataChanges(false);
    } else if (selectedNodes.length === 0) {
      setActiveNode(null);
      setHasDataChanges(false);
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
      setHasDataChanges(false);
    }
  };

  const handleReset = () => {
    if (activeNode) {
      setFormData(activeNode.data || {});
      setHasChanges(false);
      setHasDataChanges(false);
    }
  };

  const handleGenerate = () => {
    // Generate/regenerate node configuration based on current data
    if (activeNode && hasDataChanges) {
      console.log('Generating configuration for node:', activeNode.id);
      // This would trigger any code generation, schema updates, etc.
      // For now, we'll just save the current state
      handleSave();
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
              <Tabs defaultValue="nodedata" className="flex flex-col flex-1 overflow-hidden">
                <ScrollableTabs className="mb-4">
                  <TabsTrigger value="nodedata">Node Data</TabsTrigger>
                  <TabsTrigger value="parameters">Parameters</TabsTrigger>
                  
                  {/* Code Editor tab for ProcessNodes (formerly Process tab) */}
                  {isProcessNode(activeNode.type) && (
                    <TabsTrigger value="code">Code</TabsTrigger>
                  )}
                  
                  {/* Content Preview tab for PreviewNodes (contentnode) */}
                  {isPreviewNode(activeNode.type) && (
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  )}
                  
                  {/* Input/Output tab - universal for all nodes */}
                  <TabsTrigger value="inputoutput">Input/Output</TabsTrigger>
                  
                  {/* Errors tab - universal for all nodes */}
                  <TabsTrigger value="errors">Errors</TabsTrigger>
                </ScrollableTabs>
                
                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="nodedata" className="m-0">
                    <PropertiesTab 
                      fields={allFields}
                      formData={formData}
                      onFieldChange={handleFieldChange}
                      nodeId={activeNode.id}
                      nodeType={activeNode.type}
                      nodeGroup={getNodeGroup(activeNode.type)}
                      nodeConfig={nodeConfig}
                      hasChanges={hasChanges}
                    />
                  </TabsContent>

                  <TabsContent value="parameters" className="m-0">
                    <ParametersTab 
                      formData={formData}
                      onFieldChange={handleFieldChange}
                      nodeId={activeNode.id}
                      nodeType={activeNode.type}
                      hasChanges={hasChanges}
                    />
                  </TabsContent>
                  
                  {/* Code Editor Tab for ProcessNodes (renamed from Process) */}
                  {isProcessNode(activeNode.type) && (
                    <TabsContent value="code" className="m-0">
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
                  
                  {/* Universal Input/Output Tab */}
                  <TabsContent value="inputoutput" className="m-0">
                    <DataFlowTab 
                      nodeId={activeNode.id} 
                      nodeType={activeNode.type}
                      formData={formData} 
                      onFieldChange={handleFieldChange}
                    />
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
                position={position}
                onPositionChange={setPosition}
                hasDataChanges={hasDataChanges}
                onGenerate={handleGenerate}
              />
            </div>
          )}
        </div>
      </PanelContainer>
    </>
  );
};

export default NodeConfigPanel;