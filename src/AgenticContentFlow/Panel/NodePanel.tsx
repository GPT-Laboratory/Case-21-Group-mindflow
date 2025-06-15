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

// LLM Generation System imports
import { GenerationOrchestrator } from '../Process/Generation/GenerationOrchestrator';
import { APISetupDialog } from '../Process/Generation/components/APISetupDialog';
import { apiKeyManager } from '../Process/Generation/APIKeyManager';
import { useNotifications } from '../Notifications/hooks/useNotifications';
import { GenerationContext, LLMGenerationResult } from '../Process/Generation/types';

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

  // LLM Generation state
  const [showApiSetup, setShowApiSetup] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationOrchestrator] = useState(() => new GenerationOrchestrator());

  // Notifications for progress and results
  const {
    showSuccessToast,
    showErrorToast,
    showInfoToast,
    showBlockingNotification,
    updateBlockingNotification,
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
      setShowApiSetup(true);
      return;
    }

    setIsGenerating(true);
    let notificationId: string | null = null;

    try {
      // Show progress notification
      notificationId = showBlockingNotification(
        'Generating Code',
        'Preparing LLM request for node processing logic...'
      );

      // Build generation context
      const context: GenerationContext = {
        nodeId: activeNode.id,
        nodeType: activeNode.type,
        formData,
        inputSchema: null, // TODO: Get from DataFlowTab
        onFieldChange: handleFieldChange,
        onGenerationComplete: (result: LLMGenerationResult) => {
          console.log('✅ Code generation completed:', {
            nodeId: activeNode.id,
            provider: result.provider,
            confidence: result.confidence,
            codeLength: result.code.length
          });

          // Show success details
          showSuccessToast(
            'Code Generated!', 
            `Generated ${result.code.length} characters of code using ${result.provider} (${Math.round(result.confidence * 100)}% confidence)`
          );

          // Show suggestions if any
          if (result.suggestions?.length) {
            setTimeout(() => {
              showInfoToast(
                'Suggestions',
                result.suggestions!.slice(0, 2).join('. ')
              );
            }, 2000);
          }
        },
        onGenerationError: (error: string) => {
          console.error('❌ Code generation failed:', error);
          showErrorToast('Generation Failed', error);
        }
      };

      // Generate code with progress tracking
      const result = await generationOrchestrator.generateCode(context, (progress) => {
        if (notificationId) {
          updateBlockingNotification(notificationId, 'loading', progress.progress);
        }
        // Only log significant progress milestones to reduce spam
        if (progress.progress % 25 === 0 || progress.stage === 'complete' || progress.stage === 'error') {
          console.log('📊 Generation progress:', progress);
        }
      });

      // Complete the notification
      if (notificationId) {
        completeBlockingNotification(
          notificationId,
          `Code generated successfully! ${result.warnings?.length ? `(${result.warnings.length} warnings)` : ''}`
        );
      }

      // Auto-save the generated code
      setTimeout(() => {
        handleSave();
        showInfoToast('Auto-saved', 'Generated code has been saved to the node.');
      }, 1000);

      // Show warnings if any
      if (result.warnings?.length) {
        setTimeout(() => {
          const warningText = result.warnings!.slice(0, 3).join('. ');
          showInfoToast('Code Warnings', warningText);
        }, 3000);
      }

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
    }
  };

  const handleApiSetupComplete = () => {
    console.log('✅ API setup completed, configured providers:', apiKeyManager.getConfiguredProviders());
    setShowApiSetup(false);
    
    // Show success and offer to generate
    showSuccessToast(
      'LLM Provider Configured!', 
      'You can now use AI-powered code generation.'
    );
    
    // Auto-trigger generation if user had tried to generate before
    if (hasDataChanges) {
      setTimeout(() => {
        showInfoToast('Ready to Generate', 'Click the Generate button to create code with AI.');
      }, 1500);
    }
  };

  const nodeConfig = activeNode ? getNodeConfig(activeNode.type, activeNode.data) : null;
  const variantFields = activeNode && nodeConfig ? getVariantFields(nodeConfig, formData, activeNode.data) : {};
  const allFields = nodeConfig ? { ...nodeConfig.configFields, ...variantFields } : {};

  return (
    <>
      {/* API Setup Dialog */}
      <APISetupDialog
        open={showApiSetup}
        onOpenChange={setShowApiSetup}
        onComplete={handleApiSetupComplete}
      />

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

              {/* Footer with enhanced Generate functionality */}
              <Separator className="my-4" />
              <PanelFooter 
                hasChanges={hasChanges}
                onSave={handleSave}
                onReset={handleReset}
                position={position}
                onPositionChange={setPosition}
                hasDataChanges={hasDataChanges && !isGenerating}
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