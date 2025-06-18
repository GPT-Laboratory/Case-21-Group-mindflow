/**
 * Unified Generator System Types
 * 
 * Consolidated type definitions that support both process and flow generation
 * while eliminating duplication between the two systems.
 * 
 * Includes process generation capabilities for creating JavaScript process 
 * functions from descriptions and node configurations.
 * 
 * Architecture:
 * - ProcessDescriptor: Structured descriptions for process generation
 * - ProcessGenerator: AI-powered code generation from descriptions
 * - ProcessTemplate: Template-based generation for common patterns
 * - ProcessValidator: Validation and safety checks for generated code
 * 
 * @author Agentic Content Flow Team
 * @version 2.1.0
 * @since 2025-06-16
 */

import { Node, Edge } from '@xyflow/react';

// ============================================================================
// CORE GENERATION TYPES
// ============================================================================

export type GenerationType = 'process' | 'flow';
export type LLMProvider = 'openai' | 'gemini' | 'claude' | 'ollama' | 'custom';
export type GenerationStrategy = 'template' | 'ai';

// ============================================================================
// UNIFIED GENERATION REQUEST
// ============================================================================

export interface BaseGenerationRequest {
  type: GenerationType;
  strategy?: GenerationStrategy;
  provider?: LLMProvider;
  fallbackToTemplates?: boolean;
}

export interface ProcessGenerationRequest extends BaseGenerationRequest {
  type: 'process';
  nodeId: string;
  nodeType: string;
  nodeData: Record<string, any>;
  context?: ProcessContext;
  inputSchema?: any;
  outputSchema?: any;
  
  // Enhanced with legacy types
  descriptor?: ProcessDescriptor;
  nodeConfig?: {
    nodeType: string;
    category: string;
    defaultLabel: string;
    description: string;
  };
  instanceData?: Record<string, any>;
  preferences?: GenerationPreferences;
  sourceNodes?: Array<{ id: string; type: string; data: any }>;
  targetNodes?: Array<{ id: string; type: string; data: any }>;
}

export interface FlowGenerationRequest extends BaseGenerationRequest {
  type: 'flow';
  description: string;
  selectedNodesContext?: string;
  nodeTypes?: string[];
  features?: string[];
}

export type GenerationRequest = ProcessGenerationRequest | FlowGenerationRequest;

// ============================================================================
// GENERATION RESULTS
// ============================================================================

export interface BaseGenerationResult {
  type: GenerationType;
  generatedAt: string;
  provider?: LLMProvider;
  strategy: GenerationStrategy;
  confidence: number;
}

export interface ProcessGenerationResult extends BaseGenerationResult {
  type: 'process';
  code: string;
  nodeId: string;
  validation: ProcessValidationResult;
  metadata: ProcessMetadata;
  
  // Enhanced with legacy fields
  explanation?: ProcessExplanation;
  tokensUsed?: number;
  suggestions?: string[];
  warnings?: string[];
}

export interface FlowGenerationResult extends BaseGenerationResult {
  type: 'flow';
  nodes: Node[];
  edges: Edge[];
  description: string;
  validation: FlowValidationResult;
  metadata: FlowMetadata;
}

export type GenerationResult = ProcessGenerationResult | FlowGenerationResult;

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface BaseValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  corrected?: boolean;
}

export interface ProcessValidationResult extends BaseValidationResult {
  syntaxValid: boolean;
  securityIssues: SecurityIssue[];
  performanceWarnings: string[];
  suggestions: string[];
}

export interface FlowValidationResult extends BaseValidationResult {
  nodeTypeValidation: boolean;
  handleValidation: boolean;
  structureValidation: boolean;
  circularDependencies: boolean;
}

export interface ValidationError {
  type: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
  field?: string;
  suggestedFix?: string;
}

export interface ValidationWarning {
  type: string;
  message: string;
  suggestion?: string;
}

export interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: SecurityIssueType;
  description: string;
  line?: number;
  snippet?: string;
  suggestion?: string;
}

export type SecurityIssueType = 
  | 'code-injection'
  | 'xss-vulnerability' 
  | 'unsafe-eval'
  | 'dangerous-function'
  | 'prototype-pollution'
  | 'resource-exhaustion'
  | 'data-exposure'
  | 'unsafe-html'
  | 'network-security';

// ============================================================================
// METADATA TYPES
// ============================================================================

export interface GenerationMetadata {
  requestId: string;
  timestamp: number;
  version: string;
}

export interface ProcessMetadata {
  nodeType: string;
  templateUsed?: string;
  tokensUsed?: number;
  generationTime: number;
  validationScore: number;
  
  // Enhanced fields from legacy
  generatedBy?: 'ai' | 'template' | 'hybrid';
  sourceDescriptorId?: string;
  confidence: number; // 0-1 confidence score
}

export interface FlowMetadata extends GenerationMetadata {
  nodeCount: number;
  edgeCount: number;
  flowType: string;
  features: string[];
  autoCorrections: number;
}

// ============================================================================
// PROVIDER TYPES
// ============================================================================

export interface LLMAPIConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  options?: Record<string, any>;
}

export interface LLMProviderInfo {
  provider: LLMProvider;
  name: string;
  configured: boolean;
  preferred: boolean;
  models: string[];
  defaultModel?: string;
}

export interface LLMRequest {
  prompt: string;
  type: GenerationType;
  context: string;
  provider?: LLMProvider;
  config?: Partial<LLMAPIConfig>;
}

export interface LLMResponse {
  content: string;
  provider: LLMProvider;
  model: string;
  confidence?: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  timestamp: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export interface TemplateRegistry {
  register(template: Template): void;
  getTemplate(id: string): Template | undefined;
  getAllTemplates(): Template[];
  findByTags(tags: string[]): Template[];
  findByKeywords(keywords: string[]): Template[];
  findBestMatch(prompt: string): Template | null;
}

export interface BaseTemplate {
  id: string;
  name: string;
  description: string;
  tags: string[];
  type: GenerationType;
}

export interface ProcessTemplate extends BaseTemplate {
  type: 'process';
  nodeType: string;
  generate: (request: ProcessGenerationRequest) => string;
  getFeatures: () => string[];
  getImplementationNotes: () => string[];
  getUsageInstructions: () => string[];
}

export interface FlowTemplate extends BaseTemplate {
  type: 'flow';
  generate: (variation?: number) => {
    nodes: Node[];
    edges: Edge[];
    description: string;
    flowType: string;
    features: string[];
  };
}

export type Template = ProcessTemplate | FlowTemplate;

// ============================================================================
// CONTEXT TYPES
// ============================================================================

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

export interface FlowContext {
  selectedNodes: Node[];
  nodeMap: Map<string, Node>;
  nodeParentIdMap: Map<string, Set<string>>;
}

// ============================================================================
// ORCHESTRATOR TYPES
// ============================================================================

export interface GenerationProgress {
  stage: 'preparing' | 'building_prompt' | 'calling_llm' | 'validating' | 'complete' | 'error';
  message: string;
  progress: number; // 0-100
  type: GenerationType;
}

export type ProgressCallback = (progress: GenerationProgress) => void;

export interface GeneratorConfig {
  defaultProvider: LLMProvider;
  generationStrategy: GenerationStrategy;
  fallbackToTemplates: boolean;
  validationLevel: 'lenient' | 'strict' | 'paranoid';
  maxConcurrentGenerations: number;
  cacheResults: boolean;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface GenerationError {
  type: 'generation_failed' | 'validation_failed' | 'provider_error' | 'configuration_error';
  message: string;
  code: string;
  details?: any;
}

// ============================================================================
// UI TYPES
// ============================================================================

export interface GenerationPanelProps {
  type: GenerationType;
  onGenerated: (result: GenerationResult) => void;
  onClose?: () => void;
  defaultRequest?: Partial<GenerationRequest>;
}

export interface PromptHistoryEntry {
  prompt: string;
  type: GenerationType;
  timestamp: string;
  success: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface NodeContextInfo {
  selected: number;
  children: number;
  context: string;
}

export interface TemplateMatch {
  template: Template;
  confidence: number;
  reasons: string[];
}

// ============================================================================
// STATE TYPES
// ============================================================================

export type GenerationState = 'idle' | 'generating' | 'completed' | 'error';

// Provider configuration and defaults
export const PROVIDER_DEFAULTS: Record<LLMProvider, Partial<LLMProviderDefaults>> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    maxTokens: 4000,
    temperature: 0.3,
    timeout: 30000
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-pro',
    maxTokens: 2048,
    temperature: 0.3,
    timeout: 30000
  },
  claude: {
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-sonnet-20240229',
    maxTokens: 4000,
    temperature: 0.3,
    timeout: 30000
  },
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'llama2',
    maxTokens: 2048,
    temperature: 0.3,
    timeout: 30000
  },
  custom: {
    maxTokens: 2048,
    temperature: 0.3,
    timeout: 30000
  }
};

export interface LLMProviderDefaults {
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

// ============================================================================
// PROCESS DESCRIPTOR TYPES
// ============================================================================

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

export interface GenerationPreferences {
  codeStyle?: 'functional' | 'procedural' | 'async-first';
  verbosity?: 'minimal' | 'documented' | 'verbose';
  errorHandling?: 'basic' | 'comprehensive' | 'enterprise';
}

export interface ProcessExplanation {
  summary: string;
  keyFeatures: string[];
  implementationNotes: string[];
  usageInstructions: string[];
}

// ============================================================================
// ENHANCED LLM TYPES
// ============================================================================

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