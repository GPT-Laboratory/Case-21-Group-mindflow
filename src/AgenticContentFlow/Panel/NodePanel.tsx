import React, { useState, useEffect } from 'react';
import { useSelect } from '../Select/contexts/SelectContext';
import { useNodeContext } from '../Node/context/useNodeContext';
import { Tabs, TabsContent, TabsList } from '@/components/ui/tabs';
import { getNodeConfig } from './nodeConfigs';
import { DataTab } from './components/tabs/DataTab/DataTab';
import { PanelHeader } from './components/PanelHeader';
import { PanelToggleDragHandle } from './components/PanelHandle';
import { PanelContainer } from './components/PanelContainer';
import { useResizePanel } from './hooks/useResizePanel';
import { ErrorsTab } from './components/tabs/ErrorsTab/ErrorsTab';
import { ResponsiveTabs } from './components/ResponsiveTabs';
import { ContentPreviewTab } from './components/tabs/PreviewContentTab/ContentPreviewTab';
import { CodeEditorTab } from './components/tabs/CodeEditorTab/CodeEditorTab';

// LLM Generation System imports
import { apiKeyManager } from '../Generator/providers/management/APIKeyManager';
import { useNotifications } from '../Notifications/hooks/useNotifications';
import { useGeneration } from '../Generator/hooks/useGeneration';
import { useGenerator } from '../Generator/context/GeneratorContext';
import { ProcessGenerationRequest } from '../Generator/generatortypes';
import { InputOutputTab } from './components/tabs/InputOutput/InputOutputTab';
import { PanelMenu } from './components/PanelMenu';

type PanelPosition = 'top' | 'bottom' | 'left' | 'right';

const DEFAULT_SIZES = {
  top: { width: 0, height: 350 },
  bottom: { width: 0, height: 350 },
  left: { width: 400, height: 0 },
  right: { width: 400, height: 0 }
};

export const NodeConfigPanel: React.FC = () => {
  const { selectedNodes } = useSelect();
  const { updateNode, nodeMap } = useNodeContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState<PanelPosition>('right');
  const [activeNode, setActiveNode] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [hasDataChanges, setHasDataChanges] = useState(false);

  // LLM Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const { generateContent } = useGeneration();
  const { updateNodeGenerationStatus, setUpdatingNode } = useGenerator();

  // Notifications for progress and results
  const {
    showErrorToast,
    showInfoToast,
    showBlockingNotification,
    completeBlockingNotification,
    failBlockingNotification
  } = useNotifications();

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

  // Update formData when the selected node's data changes (e.g., from AI generation)
  useEffect(() => {
    if (selectedNodes.length === 1) {
      const selectedNodeId = selectedNodes[0].id;
      const currentNodeFromMap = nodeMap.get(selectedNodeId);
      
      if (currentNodeFromMap && activeNode && activeNode.id === selectedNodeId) {
        // Check if the node data has actually changed
        const oldDataString = JSON.stringify(activeNode.data);
        const newDataString = JSON.stringify(currentNodeFromMap.data);
        
        if (oldDataString !== newDataString) {
          console.log('🔄 [NodePanel] Node data updated from nodeMap, refreshing formData:', {
            nodeId: selectedNodeId,
            oldData: activeNode.data,
            newData: currentNodeFromMap.data
          });
          setActiveNode(currentNodeFromMap);
          setFormData(currentNodeFromMap.data || {});
          setHasChanges(false);
          setHasDataChanges(false);
        }
      }
    }
  }, [selectedNodes, activeNode, nodeMap]);

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

  const handleGenerate = async () => {
    if (!activeNode || !hasDataChanges) {
      showInfoToast('No Changes', 'Make some changes to the node configuration before generating code.');
      return;
    }

    console.log('🚀 Starting LLM code generation for node:', activeNode.id);

    // Check if any LLM provider is configured
    const configuredProviders = apiKeyManager.getConfiguredProviders();
    if (configuredProviders.length === 0) {
      console.log('📝 No LLM providers configured, showing setup dialog');
      return;
    }

    setIsGenerating(true);
    let notificationId: string | null = null;

    try {
      // Set the node as updating in the context
      setUpdatingNode(activeNode.id, true);

      // Show progress notification
      notificationId = showBlockingNotification(
        'Generating Code',
        'Preparing LLM request for node processing logic...'
      );

      // Build generation request
      const request: ProcessGenerationRequest = {
        type: 'process',
        nodeId: activeNode.id,
        nodeType: activeNode.type,
        nodeData: formData,
        strategy: 'ai',
        inputSchema: null, // TODO: Get from DataFlowTab
      };

      // Status callback for real-time updates
      const statusCallback = (nodeId: string, status: string, message: string, error?: string) => {
        console.log(`🔄 [NodePanel] Generation status update:`, { nodeId, status, message, error });
        
        // Update the notification with current status
        if (notificationId) {
          if (status === 'error') {
            failBlockingNotification(notificationId, error || message);
          } else if (status === 'completed') {
            completeBlockingNotification(notificationId, message);
          } else {
            // Update the notification message for intermediate steps
            // Note: The notification system might not support dynamic updates, so we'll log them
            console.log(`📝 [NodePanel] ${message}`);
          }
        }
        
        // Update the generation status in context
        updateNodeGenerationStatus(nodeId, { status: status as any, message, error });
      };

      // Generate code with status callback
      await generateContent(request, statusCallback);

      // Auto-save the generated code
      setTimeout(() => {
        handleSave();
        showInfoToast('Auto-saved', 'Generated code has been saved to the node.');
      }, 1000);

    } catch (error) {
      console.error('💥 Code generation failed:', error);
      
      if (notificationId) {
        failBlockingNotification(
          notificationId,
          error instanceof Error ? error.message : 'Code generation failed'
        );
      }

      // Show detailed error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showErrorToast('Generation Failed', errorMessage);

      // If it's an API configuration issue, offer to reconfigure
      if (errorMessage.includes('No LLM provider') || errorMessage.includes('API error')) {
        setTimeout(() => {
          showInfoToast('Configuration Issue', 'Would you like to check your API settings?');
        }, 2000);
      }
    } finally {
      setIsGenerating(false);
      // Clear the updating state
      setUpdatingNode(activeNode.id, false);
    }
  };

  const nodeConfig = activeNode ? getNodeConfig(activeNode.type, activeNode.data) : null;

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
        <div className="flex flex-col h-full">
          {/* Content */}
          {!activeNode ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              Select a node to configure
            </div>
          ) : (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Header */}
          

              {/* Tabs */}
              <Tabs defaultValue="data" className="flex flex-col flex-1">
              <div className="flex items-center justify-between py-1 px-2 flex-nowrap w-full">
                <PanelHeader 
                  activeNode={activeNode} 
                  nodeConfig={nodeConfig!}
                />
                <TabsList className="w-full flex bg-transparent min-w-0">
                  <ResponsiveTabs />
                </TabsList>
                <div className="flex-shrink-0">
                  <PanelMenu
                    hasChanges={hasChanges}
                    hasDataChanges={hasDataChanges}
                    onSave={handleSave}
                    onReset={handleReset}
                    onGenerate={handleGenerate}
                    position={position}
                    onPositionChange={setPosition}
                  />
                </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="data" className="m-0 h-full">
                    <DataTab 
                      formData={formData}
                      onFieldChange={handleFieldChange}
                      nodeId={activeNode.id}
                      nodeType={activeNode.type}
                      hasChanges={hasChanges}
                    />
                  </TabsContent>
                  
                  {/* Code Editor Tab - available for all nodes */}
                  <TabsContent value="code" className="m-0 h-full">
                    <CodeEditorTab 
                      nodeType={activeNode.type}
                      formData={formData} 
                      onFieldChange={handleFieldChange} 
                    />
                  </TabsContent>
                  
                  {/* Content Preview Tab - available for all nodes */}
                  <TabsContent value="preview" className="m-0 h-full">
                    <ContentPreviewTab 
                      nodeId={activeNode.id} 
                      formData={formData} 
                    />
                  </TabsContent>
                  
                  {/* Universal Input/Output Tab */}
                  <TabsContent value="inputoutput" className="m-0 h-full">
                    <InputOutputTab 
                      nodeId={activeNode.id} 
                      nodeType={activeNode.type}
                      formData={formData} 
                      onFieldChange={handleFieldChange}
                    />
                  </TabsContent>
                  
                  {/* Universal Errors Tab */}
                  <TabsContent value="errors" className="m-0 h-full">
                    <ErrorsTab nodeId={activeNode.id} formData={formData} />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          )}
        </div>
      </PanelContainer>
    </>
  );
};

export default NodeConfigPanel;