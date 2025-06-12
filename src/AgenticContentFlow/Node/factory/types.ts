/** @format */

/**
 * JSON-driven node factory types for RestNode, LogicalNode, and ContentNode
 */

export interface IconReference {
  type: 'builtin' | 'path' | 'component';
  value: string; // e.g., 'Globe2', '/icons/custom.svg', 'DomainIcon'
  className?: string;
  size?: number;
}

export interface ProcessParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
  // UI hints for the node panel
  ui?: {
    component: 'input' | 'textarea' | 'select' | 'checkbox' | 'number';
    placeholder?: string;
    options?: Array<{ value: any; label: string }>;
  };
}

export interface NodeFactoryJSON {
  // Basic node identity
  nodeType: string;
  defaultLabel: string;
  category: 'integration' | 'logic' | 'view' | 'data' | 'container';
  description: string; // AI uses this to understand node purpose
  
  // Visual configuration with variant support
  visual: {
    icon: IconReference;
    headerIcon: IconReference;
    headerGradient: string;
    selectedColor: string;
    
    // Variant-based styling (e.g., HTTP methods, operations)
    variants?: {
      // Key is the data field name to check
      fieldName: string; // e.g., "method", "operation", "displayType"
      
      // Variant configurations
      options: Record<string, {
        badgeText: string;
        badgeColor: string;
        description?: string; // Additional context for AI
      }>;
      
      // Default if no variant matches
      default: {
        badgeText: string;
        badgeColor: string;
      };
    };
    
    // Simple content display function
    additionalContentFunction?: string; // Simple accessor like "data.url" or "data.condition"
  };
  
  // Process configuration with stored code
  process: {
    // The actual function code (AI-generated or manually created)
    code: string; // JavaScript function as string
    
    // Function metadata
    metadata: {
      generatedBy: 'ai' | 'manual';
      version: string;
      lastUpdated: string;
      executionContext: 'frontend' | 'backend';
      signature: string;
    };
    
    // Expected input/output types for validation
    expectedInput?: string;
    expectedOutput?: string;
    
    // Configurable parameters that can be overridden per node instance
    parameters: Record<string, ProcessParameter>;
    
    // Constraints for function execution
    constraints?: {
      timeout?: number;
      maxRetries?: number;
      requiresAuth?: boolean;
    };
    
    // AI generation context (for regeneration)
    aiContext?: {
      originalPrompt: string;
      nodeDescription: string;
      generationSettings: Record<string, any>;
    };
  };
  
  // Menu items (simplified)
  menu: {
    items: Array<{
      key: string;
      label: string;
      action: 'execute' | 'configure' | 'debug' | 'analyze' | 'regenerate';
    }>;
  };
  
  // Template creation for new node instances
  template: {
    defaultData: Record<string, any>;
    defaultDimensions: { width: number; height: number };
    // Default parameter values for new instances
    defaultParameters: Record<string, any>;
  };
}

// Node instance data structure (what's stored in flows)
export interface NodeInstanceData {
  // Core node properties
  label: string;
  details?: string;
  nodeLevel: 'basic' | 'intermediate' | 'advanced';
  
  // Process customization for this instance
  processOverrides?: {
    // Override specific parameters for this instance
    parameters?: Record<string, any>;
    
    // Optional: custom process code for this specific instance
    customCode?: string;
    
    // Instance-specific constraints
    constraints?: {
      timeout?: number;
      maxRetries?: number;
    };
  };
  
  // Node type specific data (varies by node type)
  [key: string]: any;
}

export interface ProcessFunctionResult {
  code: string;
  metadata: {
    generatedBy: 'ai' | 'manual';
    version: string;
    lastUpdated: string;
    executionContext: 'frontend' | 'backend';
  };
  aiContext?: {
    originalPrompt: string;
    nodeDescription: string;
    generationSettings: Record<string, any>;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}