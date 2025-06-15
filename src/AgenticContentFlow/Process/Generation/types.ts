/**
 * Process Generation System
 * 
 * This module provides agentic process generation capabilities for creating
 * JavaScript process functions from descriptions and node configurations.
 * 
 * Architecture:
 * - ProcessDescriptor: Structured descriptions for process generation
 * - ProcessGenerator: AI-powered code generation from descriptions
 * - ProcessTemplate: Template-based generation for common patterns
 * - ProcessValidator: Validation and safety checks for generated code
 * 
 * @author Agentic Content Flow Team
 * @version 1.0.0
 * @since 2025-06-15
 */

export interface ProcessContext {
  /** Available parameters that the process function can access */
  availableParams: {
    incomingData: string; // Description of expected incoming data
    nodeData: Record<string, any>; // Static node configuration
    params: Record<string, any>; // Dynamic runtime parameters
    targetMap?: string; // Description of target nodes
    sourceMap?: string; // Description of source nodes
    edgeMap?: string; // Description of edge configurations
  };
  
  /** Execution environment information */
  environment: {
    context: 'frontend' | 'backend' | 'hybrid';
    availableAPIs: string[]; // Available APIs (fetch, console, etc.)
    constraints: {
      timeout?: number;
      maxRetries?: number;
      securityLevel: 'low' | 'medium' | 'high';
    };
  };
}

export interface ProcessDescriptor {
  /** Unique identifier for this process description */
  id: string;
  
  /** High-level description of what this process does */
  description: string;
  
  /** Detailed step-by-step breakdown of the process */
  steps: ProcessStep[];
  
  /** Expected input schema and description */
  expectedInput: {
    description: string;
    schema?: any; // JSON Schema
    examples?: any[]; // Example input data
  };
  
  /** Expected output schema and description */
  expectedOutput: {
    description: string;
    schema?: any; // JSON Schema
    examples?: any[]; // Example output data
  };
  
  /** Error handling requirements */
  errorHandling: {
    required: boolean;
    fallbackBehavior?: string;
    retryLogic?: string;
  };
  
  /** Performance requirements */
  performance?: {
    maxExecutionTime?: number;
    memoryConstraints?: string;
    scalabilityNotes?: string;
  };
  
  /** Dependencies and external resources */
  dependencies?: {
    externalAPIs?: string[];
    requiredLibraries?: string[];
    dataConnections?: string[];
  };
}

export interface ProcessStep {
  /** Step identifier */
  id: string;
  
  /** Human-readable description of this step */
  description: string;
  
  /** Technical implementation notes */
  implementation: string;
  
  /** Input requirements for this step */
  inputs: string[];
  
  /** Output produced by this step */
  outputs: string[];
  
  /** Conditional logic if applicable */
  conditions?: string[];
  
  /** Error handling for this specific step */
  errorHandling?: string;
}

export interface GenerationRequest {
  /** The process descriptor to generate code from */
  descriptor: ProcessDescriptor;
  
  /** Context about the execution environment */
  context: ProcessContext;
  
  /** Node-specific details from the factory configuration */
  nodeConfig: {
    nodeType: string;
    category: string;
    defaultLabel: string;
    description: string;
  };
  
  /** Instance-specific details from the node data */
  instanceData: Record<string, any>;
  
  /** Generation preferences */
  preferences?: {
    codeStyle: 'functional' | 'procedural' | 'async-first';
    verbosity: 'minimal' | 'documented' | 'verbose';
    errorHandling: 'basic' | 'comprehensive' | 'enterprise';
  };
}

export interface GenerationResult {
  /** Generated JavaScript code */
  code: string;
  
  /** Metadata about the generation process */
  metadata: {
    generatedBy: 'ai' | 'template' | 'hybrid';
    generatedAt: string;
    version: string;
    sourceDescriptorId: string;
    confidence: number; // 0-1 confidence score
  };
  
  /** Validation results */
  validation: {
    syntaxValid: boolean;
    securityChecks: boolean;
    performanceWarnings: string[];
    suggestions: string[];
  };
  
  /** Human-readable explanation of the generated code */
  explanation: {
    summary: string;
    keyFeatures: string[];
    implementationNotes: string[];
    usageInstructions: string[];
  };
}