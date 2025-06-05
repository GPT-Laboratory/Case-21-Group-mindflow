import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Loader2, AlertCircle, CheckCircle2, Database, Code } from 'lucide-react';

interface AnalyzeTabProps {
  formData: Record<string, any>;
}

interface AnalysisResult {
  status: 'success' | 'error' | 'loading';
  data?: any;
  schema?: any;
  error?: string;
  responseTime?: number;
  statusCode?: number;
  headers?: Record<string, string>;
}

export const AnalyzeTab: React.FC<AnalyzeTabProps> = ({ formData }) => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeEndpoint = async () => {
    if (!formData.url) {
      setAnalysisResult({
        status: 'error',
        error: 'No URL specified'
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult({ status: 'loading' });

    try {
      const startTime = Date.now();
      
      // Build request options
      const requestOptions: RequestInit = {
        method: formData.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(formData.headers ? JSON.parse(formData.headers) : {})
        }
      };

      // Add body for POST/PUT/PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(formData.method) && formData.body) {
        requestOptions.body = formData.body;
      }

      const response = await fetch(formData.url, requestOptions);
      const responseTime = Date.now() - startTime;
      
      const data = await response.json();
      const schema = generateSchema(data);

      setAnalysisResult({
        status: response.ok ? 'success' : 'error',
        data,
        schema,
        responseTime,
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      });
    } catch (error) {
      setAnalysisResult({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateSchema = (data: any): any => {
    if (data === null) return { type: 'null' };
    if (Array.isArray(data)) {
      return {
        type: 'array',
        items: data.length > 0 ? generateSchema(data[0]) : { type: 'unknown' },
        length: data.length
      };
    }
    if (typeof data === 'object') {
      const properties: Record<string, any> = {};
      Object.keys(data).forEach(key => {
        properties[key] = generateSchema(data[key]);
      });
      return {
        type: 'object',
        properties,
        keys: Object.keys(data)
      };
    }
    return { type: typeof data };
  };

  const renderDataStructure = (data: any, level = 0): React.ReactNode => {
    if (level > 3) return <span className="text-muted-foreground">...</span>;
    
    if (Array.isArray(data)) {
      return (
        <div className="ml-4">
          <div className="text-blue-600 font-mono text-sm">Array[{data.length}]</div>
          {data.length > 0 && (
            <div className="ml-2 border-l-2 border-gray-200 pl-2">
              {renderDataStructure(data[0], level + 1)}
            </div>
          )}
        </div>
      );
    }
    
    if (typeof data === 'object' && data !== null) {
      return (
        <div className="ml-4">
          <div className="text-green-600 font-mono text-sm">Object</div>
          <div className="ml-2 border-l-2 border-gray-200 pl-2 space-y-1">
            {Object.entries(data).slice(0, 5).map(([key, value]) => (
              <div key={key} className="text-sm">
                <span className="text-purple-600 font-mono">{key}:</span>
                <span className="text-orange-600 ml-2">{typeof value}</span>
                {(typeof value === 'object' && value !== null) && renderDataStructure(value, level + 1)}
              </div>
            ))}
            {Object.keys(data).length > 5 && (
              <div className="text-muted-foreground text-sm">... {Object.keys(data).length - 5} more</div>
            )}
          </div>
        </div>
      );
    }
    
    return <span className="text-orange-600 font-mono">{typeof data}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Analysis Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            API Response Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={analyzeEndpoint}
              disabled={isAnalyzing || !formData.url}
              className="flex items-center gap-2"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Analyze Endpoint
            </Button>
            <Badge variant="outline" className="ml-auto">
              {formData.method || 'GET'} {formData.url || 'No URL'}
            </Badge>
          </div>

          {analysisResult && (
            <Tabs defaultValue="structure" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="structure">Data Structure</TabsTrigger>
                <TabsTrigger value="schema">JSON Schema</TabsTrigger>
                <TabsTrigger value="raw">Raw Response</TabsTrigger>
              </TabsList>

              {/* Status Header */}
              <div className="my-4 flex items-center gap-2">
                {analysisResult.status === 'success' && (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
                {analysisResult.status === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                {analysisResult.status === 'loading' && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                
                <span className="text-sm font-medium">
                  {analysisResult.status === 'loading' && 'Analyzing...'}
                  {analysisResult.status === 'success' && `Success (${analysisResult.responseTime}ms)`}
                  {analysisResult.status === 'error' && 'Error'}
                </span>
                
                {analysisResult.statusCode && (
                  <Badge variant={analysisResult.statusCode < 400 ? 'default' : 'destructive'}>
                    {analysisResult.statusCode}
                  </Badge>
                )}
              </div>

              {analysisResult.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-red-700 text-sm">{analysisResult.error}</span>
                  </div>
                </div>
              )}

              <TabsContent value="structure" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Response Data Structure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-60 overflow-y-auto border rounded p-3">
                      {analysisResult.data && renderDataStructure(analysisResult.data)}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="schema" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Generated JSON Schema</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-60 overflow-y-auto border rounded">
                      <pre className="text-xs font-mono bg-muted p-3 overflow-x-auto">
                        {JSON.stringify(analysisResult.schema, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="raw" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Raw Response Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-60 overflow-y-auto border rounded">
                      <pre className="text-xs font-mono bg-muted p-3 overflow-x-auto">
                        {JSON.stringify(analysisResult.data, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Data Provides Section */}
      {analysisResult?.status === 'success' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Code className="w-4 h-4" />
              What This Node Provides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data Type:</span>
                <Badge variant="outline">{analysisResult.schema?.type}</Badge>
              </div>
              {analysisResult.schema?.type === 'array' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Array Length:</span>
                  <Badge variant="outline">{analysisResult.schema.length} items</Badge>
                </div>
              )}
              {analysisResult.schema?.keys && (
                <div>
                  <span className="text-muted-foreground">Available Fields:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {analysisResult.schema.keys.map((key: string) => (
                      <Badge key={key} variant="secondary" className="text-xs">
                        {key}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};