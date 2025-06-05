import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Database, RefreshCw, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { dataSchemaManager, JSONSchema, NodeSchema } from '../../Process/DataSchemaManager';
import { useReactFlow } from '@xyflow/react';

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
        handleAnalyzeEndpoint();
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [formData.url, formData.method, nodeType]);

  const handleAnalyzeEndpoint = async () => {
    if (!formData.url || nodeType !== 'restnode') return;

    setIsAnalyzing(true);
    setConnectionStatus('analyzing');

    try {
      const schema = await dataSchemaManager.analyzeRestEndpoint(formData.url, formData.method || 'GET');
      
      // Update both input and output schemas for REST nodes
      dataSchemaManager.updateSchema(nodeId, undefined, schema);
      
      setAnalysisResult({
        success: true,
        timestamp: new Date().toISOString(),
        schema,
        url: formData.url,
        method: formData.method || 'GET'
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

  const handleRefreshSchema = () => {
    if (nodeType === 'restnode') {
      handleAnalyzeEndpoint();
    } else {
      // For other node types, refresh from connected sources
      const edges = getEdges();
      const connectedSources = edges
        .filter(edge => edge.target === nodeId)
        .map(edge => edge.source);
      
      connectedSources.forEach(sourceId => {
        const sourceSchema = dataSchemaManager.getSchema(sourceId);
        if (sourceSchema?.outputSchema) {
          dataSchemaManager.updateSchema(nodeId, sourceSchema.outputSchema);
        }
      });
    }
  };

  const renderSchema = (schema: JSONSchema, title: string) => {
    if (!schema) return null;

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Database className="w-4 h-4" />
          {title}
        </h4>
        <div className="border rounded p-3 bg-gray-50 font-mono text-xs">
          <pre className="overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(schema, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'analyzing': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'analyzing': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center space-x-2">
          <Database className="w-4 h-4" />
          <span>Data Schema</span>
        </CardTitle>
        <CardDescription className="text-xs">
          {nodeType === 'restnode' 
            ? 'Analyze endpoint structure and define data schemas'
            : 'View and configure input/output data schemas'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Status Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${getStatusColor()}`}>
              {getStatusIcon()}
              {connectionStatus === 'analyzing' ? 'Analyzing...' :
               connectionStatus === 'success' ? 'Schema Ready' :
               connectionStatus === 'error' ? 'Analysis Failed' :
               'Ready to Analyze'}
            </Badge>
            {nodeSchema?.lastUpdated && (
              <span className="text-xs text-gray-500">
                Updated: {new Date(nodeSchema.lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshSchema}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-2" />
            )}
            {nodeType === 'restnode' ? 'Analyze Endpoint' : 'Refresh Schema'}
          </Button>
        </div>

        <Separator />

        {/* REST Node Specific Info */}
        {nodeType === 'restnode' && formData.url && (
          <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <Activity className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <strong>Endpoint:</strong> {formData.method || 'GET'} {formData.url}
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <div className={`flex items-start space-x-2 p-3 rounded-md ${analysisResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="text-xs">
              {analysisResult.success ? (
                <div className="text-green-700">
                  <strong>✓ Analysis Complete:</strong> Schema generated successfully
                  <br />
                  <span className="text-green-600">
                    {analysisResult.timestamp && `at ${new Date(analysisResult.timestamp).toLocaleTimeString()}`}
                  </span>
                </div>
              ) : (
                <div className="text-red-700">
                  <strong>✗ Analysis Failed:</strong> {analysisResult.error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Input Schema */}
        {nodeSchema?.inputSchema && renderSchema(nodeSchema.inputSchema, 'Input Schema')}

        {/* Output Schema */}
        {nodeSchema?.outputSchema && renderSchema(nodeSchema.outputSchema, 'Output Schema')}

        {/* No Schema Message */}
        {!nodeSchema?.inputSchema && !nodeSchema?.outputSchema && (
          <div className="text-center py-8 text-gray-500">
            <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No schema available</p>
            <p className="text-xs">
              {nodeType === 'restnode' 
                ? 'Configure an endpoint URL to analyze its schema'
                : 'Connect to other nodes or configure data sources'
              }
            </p>
          </div>
        )}

        {/* Connection Info */}
        {nodeSchema && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <div className="flex justify-between">
              <span>Node ID: {nodeId}</span>
              <span>Type: {nodeType}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};