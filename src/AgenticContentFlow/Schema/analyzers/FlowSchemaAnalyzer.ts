/** @format */

import { Node, Edge } from '@xyflow/react';
import { dataSchemaManager, JSONSchema } from '../core/DataSchemaManager';
import { schemaGenerator } from '../generators/SchemaGenerator';

/**
 * Flow Schema Analyzer
 * 
 * Handles analyzing entire node flows and propagating schemas through connected nodes
 */
export class FlowSchemaAnalyzer {
  /**
   * Analyze schemas for a node and its entire upstream chain
   */
  async analyzeNodeFlow(
    nodeId: string,
    nodeType: string,
    getNode: (id: string) => Node | undefined,
    getEdges: () => Edge[]
  ): Promise<void> {
    console.log(`🔍 FlowSchemaAnalyzer analyzing nodeId: ${nodeId}, nodeType: ${nodeType}`);
    
    const edges = getEdges();
    console.log(`🔗 Found ${edges.length} total edges in flow`);
    
    const connectedSources = edges
      .filter(edge => edge.target === nodeId)
      .map(edge => edge.source);
    
    console.log(`📥 Found ${connectedSources.length} connected sources for node ${nodeId}:`, connectedSources);
    
    // Get input schema from connected sources
    let inputSchema = undefined;
    let sampleInputData = undefined;
    
    if (connectedSources.length > 0) {
      const sourceId = connectedSources[0];
      let sourceSchema = dataSchemaManager.getSchema(sourceId);
      
      console.log(`📊 Source schema from ${sourceId}:`, sourceSchema);
      
      // Always re-analyze source nodes to ensure schemas are up-to-date
      const sourceNode = getNode(sourceId);
      if (sourceNode) {
        console.log(`🔄 Re-analyzing source node ${sourceId} to ensure schema is up-to-date...`);
        await this.analyzeSourceNode(sourceId, getNode, edges, true);
        sourceSchema = dataSchemaManager.getSchema(sourceId);
        console.log(`📊 Updated source schema from ${sourceId}:`, sourceSchema);
      } else if (!sourceSchema?.outputSchema) {
        console.log(`🔄 Source node ${sourceId} has no output schema, performing initial analysis...`);
        await this.analyzeSourceNode(sourceId, getNode, edges, false);
        sourceSchema = dataSchemaManager.getSchema(sourceId);
      }
      
      inputSchema = sourceSchema?.outputSchema;
      
      // Generate sample input data from the schema for testing
      if (inputSchema) {
        sampleInputData = schemaGenerator.generateTestData(inputSchema);
        console.log(`🧪 Generated sample input data for testing:`, sampleInputData);
      }
      
      console.log(`📥 Using input schema:`, inputSchema);
    } else {
      console.log(`⚠️ No connected sources found for node ${nodeId}`);
    }
    
    // Execute the process function to get real output schema for ALL node types
    let outputSchema = undefined;
    const currentNode = getNode(nodeId);
    
    if (currentNode) {
      console.log(`🔧 Executing process function for ${nodeType} node to generate accurate schema...`);
      
      try {
        outputSchema = await this.executeFactoryNodeForSchema(currentNode, sampleInputData, inputSchema);
      } catch (error) {
        console.error(`❌ Failed to execute process function for schema analysis:`, error);
        outputSchema = this.generateFallbackOutputSchema(nodeType, inputSchema);
      }
    } else {
      console.log(`⚠️ Node not found: ${nodeId}`);
    }
    
    // Update both schemas
    if (inputSchema || outputSchema) {
      console.log(`📊 Updating schemas for node ${nodeId}:`, { inputSchema, outputSchema });
      dataSchemaManager.updateSchema(nodeId, inputSchema, outputSchema);
      console.log(`✅ Schema update completed for node ${nodeId}`);
    } else {
      console.log(`❌ No schemas to update for node ${nodeId}`);
    }
  }

  /**
   * Analyze a source node by executing its process function
   */
  private async analyzeSourceNode(
    sourceId: string,
    getNode: (id: string) => Node | undefined,
    edges: Edge[],
    forceReAnalysis: boolean = false
  ): Promise<void> {
    const sourceNode = getNode(sourceId);
    
    if (!sourceNode) {
      console.log(`⚠️ Source node ${sourceId} not found`);
      return;
    }

    console.log(`🔧 ${forceReAnalysis ? 'Re-analyzing' : 'Analyzing'} source node ${sourceId} (${sourceNode.type})`);
    
    // First, ensure this node's upstream sources are analyzed
    const sourceEdges = edges.filter(edge => edge.target === sourceId);
    if (sourceEdges.length > 0) {
      const upstreamId = sourceEdges[0].source;
      console.log(`🔗 Ensuring upstream node ${upstreamId} is analyzed first...`);
      await this.analyzeSourceNode(upstreamId, getNode, edges, forceReAnalysis);
    }
    
    // Get the updated upstream schema
    const upstreamSchema = sourceEdges.length > 0 ? dataSchemaManager.getSchema(sourceEdges[0].source) : undefined;
    const upstreamInputSchema = upstreamSchema?.outputSchema;
    
    // Generate sample data and execute the node's process function
    let sampleData = null;
    if (upstreamInputSchema) {
      sampleData = schemaGenerator.generateTestData(upstreamInputSchema);
      console.log(`🧪 Generated sample data for node ${sourceId}:`, sampleData);
    }
    
    try {
      const outputSchema = await this.executeFactoryNodeForSchema(sourceNode, sampleData, upstreamInputSchema);
      dataSchemaManager.updateSchema(sourceId, upstreamInputSchema, outputSchema);
      console.log(`✅ Successfully ${forceReAnalysis ? 're-analyzed' : 'analyzed'} source node ${sourceId}`);
    } catch (error) {
      console.error(`❌ Failed to ${forceReAnalysis ? 're-analyze' : 'analyze'} source node ${sourceId}:`, error);
      // Fallback to input schema inheritance if execution fails
      if (upstreamInputSchema) {
        dataSchemaManager.updateSchema(sourceId, upstreamInputSchema, upstreamInputSchema);
      }
    }
  }

  /**
   * Execute factory node process function to get accurate schema
   */
  private async executeFactoryNodeForSchema(
    currentNode: Node,
    sampleInputData: any,
    inputSchema: JSONSchema | undefined
  ): Promise<JSONSchema | undefined> {
    try {
      console.log(`⚡ Executing factory node ${currentNode.type} process function with sample data...`);
      
      // Import the factory registration system
      const { factoryNodeRegistration } = await import('../../Node/factory/FactoryNodeRegistration');
      
      // Execute the actual process function with sample data
      const result = await factoryNodeRegistration.testNodeConfiguration(
        currentNode.type!,
        currentNode.data,
        sampleInputData
      );
      
      console.log(`✅ Factory node execution result:`, result);
      console.log(`🔍 Input data was:`, sampleInputData);
      console.log(`🔍 Result type:`, typeof result, Array.isArray(result) ? `Array[${result.length}]` : 'Non-array');
      console.log(`🔍 Data reference equality:`, result === sampleInputData);
      
      // Generate schema from the actual output
      if (result !== undefined) {
        // Check if the result is the same reference as input (pass-through)
        if (result === sampleInputData && inputSchema) {
          console.log(`🔄 Process function returned same data reference, using input schema`);
          return inputSchema;
        } else {
          // Generate schema from actual output
          console.log(`📊 Generating schema from actual process output...`);
          return schemaGenerator.generateSchemaFromData(result);
        }
      } else {
        console.log(`⚠️ Process function returned undefined`);
        return this.generateFallbackOutputSchema(currentNode.type!, inputSchema);
      }
    } catch (error) {
      console.error(`❌ Failed to execute factory node process function:`, error);
      return this.generateFallbackOutputSchema(currentNode.type!, inputSchema);
    }
  }

  /**
   * Generate fallback output schema when execution fails
   */
  private generateFallbackOutputSchema(nodeType: string, inputSchema: JSONSchema | undefined): JSONSchema | undefined {
    if (inputSchema) {
      console.log(`🧠 Generating output schema based on input schema and nodeType: ${nodeType}`);
      if (nodeType === 'contentnode') {
        return {
          type: 'object',
          properties: {
            rendered: { type: 'boolean' },
            content: { type: 'string' },
            originalData: inputSchema
          }
        };
      } else {
        // For logical nodes and others, assume they preserve the input structure
        return inputSchema;
      }
    } else {
      console.log(`⚠️ No input schema available, cannot generate output schema`);
      return undefined;
    }
  }
}

// Global instance
export const flowSchemaAnalyzer = new FlowSchemaAnalyzer();