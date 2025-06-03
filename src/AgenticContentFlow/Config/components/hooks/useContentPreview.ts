import { useState, useEffect, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { dataSchemaManager, JSONSchema } from '../../../Process/DataSchemaManager';
import { useProcessContext } from '../../../Process/ProcessContext';
import { 
  SchemaValidationResult, 
  DataSource,
  isValidRealTimeData,
  generateTestDataSafely
} from '../utils/contentPreviewUtils';

interface UseContentPreviewProps {
  nodeId: string;
  expectedSchema?: JSONSchema;
}

export const useContentPreview = ({ nodeId, expectedSchema }: UseContentPreviewProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [schemaValidation, setSchemaValidation] = useState<SchemaValidationResult | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>('none');

  const processContext = useProcessContext();
  const { getEdges } = useReactFlow();

  // Simple function to load preview data when user clicks refresh
  const loadPreviewData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      console.log(`🔍 Loading preview data for ${nodeId}`);
      
      // 1. First try to get the last processed data for this node
      const lastData = processContext.getNodeLastData(nodeId);
      if (lastData) {
        console.log(`✅ Found last processed data:`, lastData);
        setPreviewData(Array.isArray(lastData) ? lastData.slice(0, 10) : [lastData]);
        setDataSource('realtime');
        setIsLoading(false);
        return;
      }
      
      // 2. Then try current flow data for this node
      const currentData = processContext.getFlowData(nodeId);
      if (currentData && isValidRealTimeData({ data: currentData })) {
        console.log(`✅ Found current flow data:`, currentData);
        setPreviewData(Array.isArray(currentData) ? currentData.slice(0, 10) : [currentData]);
        setDataSource('realtime');
        setIsLoading(false);
        return;
      }
      
      // 3. Check incoming edges for data
      const edges = getEdges();
      const incomingEdges = edges.filter(edge => edge.target === nodeId);
      
      for (const edge of incomingEdges) {
        const edgeData = processContext.getFlowData(edge.id);
        if (edgeData && isValidRealTimeData({ data: edgeData })) {
          console.log(`✅ Found edge data from ${edge.id}:`, edgeData);
          setPreviewData(Array.isArray(edgeData) ? edgeData.slice(0, 10) : [edgeData]);
          setDataSource('realtime');
          setIsLoading(false);
          return;
        }
      }
      
      // 4. Fallback to test data if we have a schema
      if (expectedSchema) {
        console.log(`⚠️ No real data found, generating test data`);
        const testData = generateTestDataSafely(expectedSchema, dataSchemaManager.generateTestData.bind(dataSchemaManager));
        setPreviewData(testData);
        setDataSource('test');
      } else {
        console.log(`❌ No data or schema available`);
        setPreviewData(null);
        setDataSource('none');
      }
    } catch (error) {
      console.error(`❌ Error loading preview data:`, error);
      setPreviewData(null);
      setDataSource('none');
    } finally {
      setIsLoading(false);
    }
  }, [nodeId, expectedSchema, processContext, getEdges]);

  // Simple schema validation
  const validateSchemaCompatibility = useCallback(() => {
    if (!expectedSchema) {
      setSchemaValidation(null);
      return;
    }

    const edges = getEdges();
    const incomingEdges = edges.filter(edge => edge.target === nodeId);
    
    if (incomingEdges.length === 0) {
      setSchemaValidation(null);
      return;
    }

    const sourceEdge = incomingEdges[0];
    const sourceSchema = dataSchemaManager.getSchema(sourceEdge.source);
    
    if (!sourceSchema?.outputSchema) {
      setSchemaValidation(null);
      return;
    }

    console.log(`🔍 Validating schema compatibility:`, {
      sourceNodeId: sourceEdge.source,
      sourceOutputSchema: sourceSchema.outputSchema,
      targetExpectedSchema: expectedSchema,
      hasRealTimeData: previewData && previewData.length > 0
    });

    // Use the dataSchemaManager's validation with real-time data context
    const validation = dataSchemaManager.validateCompatibility(
      sourceSchema.outputSchema, 
      expectedSchema,
      { hasRealTimeData: previewData && previewData.length > 0 }
    );

    console.log(`🔍 Validation result:`, validation);
    setSchemaValidation(validation);
  }, [expectedSchema, nodeId, getEdges, previewData]);

  // Auto-load data when the hook is first used
  useEffect(() => {
    loadPreviewData();
  }, [nodeId]);

  // Validate schema compatibility whenever data or schema changes
  useEffect(() => {
    validateSchemaCompatibility();
  }, [validateSchemaCompatibility, previewData]);

  return {
    previewData,
    isLoading,
    schemaValidation,
    dataSource,
    loadPreviewData,
    validateSchemaCompatibility
  };
};