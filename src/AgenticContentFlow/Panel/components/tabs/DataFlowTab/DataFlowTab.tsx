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
  Separator 
} from '../../shared';

interface DataFlowTabProps {
  nodeId: string;
  formData: Record<string, any>;
}

export const DataFlowTab: React.FC<DataFlowTabProps> = ({ nodeId, formData }) => {
  const { getNode, getEdges } = useReactFlow();
  const [nodeSchema, setNodeSchema] = useState<NodeSchema | undefined>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'analyzing' | 'success' | 'error'>('idle');

  const node = getNode(nodeId);
  const nodeType = node?.type;

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
    if (nodeType === 'restnode' && formData.url && formData.url !== '') {
      // Add a small delay to ensure form data is fully updated
      const timeoutId = setTimeout(() => {
        handleRefreshSchema();
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [formData.url, formData.method, nodeType]);

  const handleRefreshSchema = async () => {
    setIsAnalyzing(true);
    setConnectionStatus('analyzing');

    try {
      // Universal schema analysis for ALL node types
      await flowSchemaAnalyzer.analyzeNodeFlow(nodeId, nodeType!, getNode, getEdges);
      
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

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'analyzing': return RefreshCw;
      case 'success': return CheckCircle;
      case 'error': return AlertTriangle;
      default: return Activity;
    }
  };

  const description = nodeType === 'restnode' 
    ? 'Analyze endpoint structure and define data schemas'
    : 'View and configure input/output data schemas';

  return (
    <TabContainer
      title="Data Schema"
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
      {nodeType === 'restnode' && formData.url && (
        <InfoCard
          title="Endpoint Information"
          type="info"
          content={`${formData.method || 'GET'} ${formData.url}`}
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
          description={nodeType === 'restnode' 
            ? 'Configure an endpoint URL to analyze its schema'
            : 'Connect to other nodes or configure data sources'
          }
        />
      )}

      {/* Connection Info */}
      {nodeSchema && (
        <InfoCard
          title="Connection Information"
          content={
            <div className="space-y-1">
              <div>Node ID: {nodeId}</div>
              <div>Type: {nodeType}</div>
            </div>
          }
        />
      )}
    </TabContainer>
  );
};