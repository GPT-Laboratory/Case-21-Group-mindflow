import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { dataSchemaManager, flowSchemaAnalyzer, NodeSchema } from '@/AgenticContentFlow/Schema';
import { 
  TabContainer, 
  StatusBadge, 
  ActionButton, 
  AlertBox, 
  DataDisplay, 
  EmptyState, 
  Section,
  InfoCard,
  ProcessControls,
  Separator 
} from '../../shared';

interface DataFlowTabProps {
  nodeId: string;
  nodeType?: string;
  formData: Record<string, any>;
  onFieldChange: (fieldKey: string, value: any) => void;
}

export const InputOutputTab: React.FC<DataFlowTabProps> = ({ nodeId, nodeType, formData, onFieldChange }) => {
  const { getNode, getEdges } = useReactFlow();
  const [nodeSchema, setNodeSchema] = useState<NodeSchema | undefined>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'analyzing' | 'success' | 'error'>('idle');
  
  // Process controls state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<any>(null);

  const node = getNode(nodeId);
  const actualNodeType = nodeType || node?.type;

  // Load current schema
  useEffect(() => {
    const schema = dataSchemaManager.getSchema(nodeId);
    setNodeSchema(schema);

    // Subscribe to schema changes
    const unsubscribe = dataSchemaManager.subscribe((updatedNodeId, updatedSchema) => {
      if (updatedNodeId === nodeId) {
        setNodeSchema(updatedSchema);
      }
    });

    return unsubscribe;
  }, [nodeId]);

  // Auto-analyze when URL changes for REST nodes
  useEffect(() => {
    if (actualNodeType === 'restnode' && formData.templateData?.url && formData.templateData.url !== '') {
      // Add a small delay to ensure form data is fully updated
      const timeoutId = setTimeout(() => {
        handleRefreshSchema();
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [formData.templateData?.url, formData.templateData?.method, actualNodeType]);

  const handleRefreshSchema = async () => {
    setIsAnalyzing(true);
    setConnectionStatus('analyzing');

    try {
      // Universal schema analysis for ALL node types
      await flowSchemaAnalyzer.analyzeNodeFlow(nodeId, actualNodeType!, getNode, getEdges);
      
      setAnalysisResult({
        success: true,
        timestamp: new Date().toISOString(),
        message: 'Schema analysis completed'
      });
      
      setConnectionStatus('success');
    } catch (error) {
      setAnalysisResult({
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
        timestamp: new Date().toISOString()
      });
      setConnectionStatus('error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generic test data generation - no node-type specific logic
  const generateTestData = () => {
    if (!nodeId) return {};

    // Generic test data based on existing form data structure
    const testData: Record<string, any> = {};
    
    // Look for common patterns in the form data to generate appropriate test data
    const templateData = formData.templateData || {};
    const instanceData = formData.instanceData || {};
    
    if (templateData.url) {
      testData.mockResponse = [
        { id: 1, title: 'Sample Item 1', value: 100 },
        { id: 2, title: 'Sample Item 2', value: 200 }
      ];
    } else if (templateData.displayType || instanceData.displayType) {
      testData.sampleContent = [
        { id: 1, title: 'Sample Content 1', body: 'Sample body text' },
        { id: 2, title: 'Sample Content 2', body: 'More sample text' }
      ];
    } else {
      testData.genericData = { 
        message: 'Generated test data',
        timestamp: new Date().toISOString(),
        items: [
          { id: 1, name: 'Test Item 1' },
          { id: 2, name: 'Test Item 2' }
        ]
      };
    }

    return { testData };
  };

  // Handle running the process with test data
  const handleRunProcess = async () => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const testData = generateTestData();
      
      onFieldChange('useTestData', true);
      onFieldChange('generatedTestData', testData.testData);
      
      setProcessResult({
        success: true,
        timestamp: new Date().toISOString(),
        dataGenerated: Array.isArray(testData.testData) ? testData.testData.length : Object.keys(testData.testData || {}).length,
        type: actualNodeType || 'unknown'
      });

      // Update the schema manager if this generates new schema
      if (testData.testData && Object.keys(testData.testData).length > 0) {
        dataSchemaManager.updateSchema(nodeId, undefined, {
          type: 'object',
          properties: Object.keys(testData.testData).reduce((acc, key) => {
            acc[key] = { type: typeof testData.testData[key] };
            return acc;
          }, {} as Record<string, any>)
        });
      }
      
    } catch (error) {
      setProcessResult({
        success: false,
        error: error instanceof Error ? error.message : 'Process failed'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'analyzing': return RefreshCw;
      case 'success': return CheckCircle;
      case 'error': return AlertTriangle;
      default: return Activity;
    }
  };

  const description = actualNodeType === 'restnode' 
    ? 'Analyze endpoint structure and test data flow'
    : 'View data schemas and test node processing';

  return (
    <TabContainer
      title="Input/Output Analysis"
      description={description}
      icon={Database}
    >
      {/* Status Section */}
      <Section 
        title="Schema Status"
        actions={
          <ActionButton
            icon={RefreshCw}
            text="Refresh Schema"
            onClick={handleRefreshSchema}
            disabled={isAnalyzing}
            loading={isAnalyzing}
          />
        }
      >
        <StatusBadge
          status={connectionStatus}
          icon={getStatusIcon()}
          timestamp={nodeSchema?.lastUpdated ? 
            `Updated: ${new Date(nodeSchema.lastUpdated).toLocaleTimeString()}` : 
            undefined
          }
        />
      </Section>

      <Separator />

      {/* REST Node Specific Info */}
      {actualNodeType === 'restnode' && formData.templateData?.url && (
        <InfoCard
          title="Endpoint Information"
          type="info"
          content={`${formData.templateData.method || 'GET'} ${formData.templateData.url}`}
        />
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <AlertBox
          type={analysisResult.success ? 'success' : 'error'}
          title={analysisResult.success ? '✓ Analysis Complete' : '✗ Analysis Failed'}
          message={analysisResult.success ? 
            `Schema generated successfully${analysisResult.timestamp ? ` at ${new Date(analysisResult.timestamp).toLocaleTimeString()}` : ''}` :
            analysisResult.error
          }
        />
      )}

      {/* Input Schema */}
      {nodeSchema?.inputSchema && (
        <DataDisplay
          data={nodeSchema.inputSchema}
          title="Input Schema"
          icon={Database}
        />
      )}

      {/* Output Schema */}
      {nodeSchema?.outputSchema && (
        <DataDisplay
          data={nodeSchema.outputSchema}
          title="Output Schema"
          icon={Database}
        />
      )}

      {/* No Schema Message */}
      {!nodeSchema?.inputSchema && !nodeSchema?.outputSchema && (
        <EmptyState
          icon={Database}
          title="No schema available"
          description={actualNodeType === 'restnode' 
            ? 'Configure an endpoint URL to analyze its schema'
            : 'Connect to other nodes or configure data sources'
          }
        />
      )}

      <Separator />

      {/* Process Controls - Moved from PropertiesTab */}
      <ProcessControls
        useTestData={formData.useTestData || false}
        generatedTestData={formData.generatedTestData}
        isProcessing={isProcessing}
        processResult={processResult}
        onToggleTestData={(value) => onFieldChange('useTestData', value)}
        onRunProcess={handleRunProcess}
      />

      {/* Connection Info */}
      {nodeSchema && (
        <InfoCard
          title="Connection Information"
          content={
            <div className="space-y-1">
              <div>Node ID: {nodeId}</div>
              <div>Type: {actualNodeType}</div>
            </div>
          }
        />
      )}
    </TabContainer>
  );
};