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

/**
 * LLM-Powered Process Generation Types
 * 
 * Type definitions for the LLM-based code generation system that creates
 * node-specific process functions from natural language descriptions.
 * 
 * @author Agentic Content Flow Team
 * @version 1.0.0
 * @since 2025-06-15
 */

// LLM Provider Types
export type LLMProvider = 'openai' | 'gemini' | 'claude' | 'ollama' | 'custom';

export interface LLMAPIConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMGenerationRequest {
  prompt: string;
  nodeType: string;
  nodeId: string;
  config?: Partial<LLMAPIConfig>;
}

export interface LLMGenerationResult {
  code: string;
  confidence: number;
  provider: LLMProvider;
  model?: string;
  tokensUsed?: number;
  explanation?: string;
  suggestions?: string[];
  warnings?: string[];
}

export interface PromptBuildRequest {
  nodeType: string;
  nodeId: string;
  templateDescription: string;
  instanceData: Record<string, any>;
  templateData: Record<string, any>;
  inputSchema?: any;
  outputSchema?: any;
  sourceNodes?: Array<{ id: string; type: string; data: any }>;
  targetNodes?: Array<{ id: string; type: string; data: any }>;
}

export interface GenerationContext {
  nodeId: string;
  nodeType: string;
  formData: Record<string, any>;
  inputSchema?: any;
  onFieldChange: (field: string, value: any) => void;
  onGenerationComplete?: (result: LLMGenerationResult) => void;
  onGenerationError?: (error: string) => void;
}

// Enhanced generation request that includes all node context
export interface EnhancedGenerationRequest extends GenerationRequest {
  llmProvider?: LLMProvider;
  inputSchema?: any;
  sourceNodes?: Array<{ id: string; type: string; data: any }>;
  targetNodes?: Array<{ id: string; type: string; data: any }>;
}