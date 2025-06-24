/** @format */

import { HandleTypeDefinition, NodeCategory } from "@/AgenticContentFlow/types/handleTypes";

/**
 * Unified node frame structure that combines cell and container functionality
 * This will eventually replace both CellFrameJSON and ContainerFrameJSON
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

/**
 * Unified frame structure for all node types
 */
export interface UnifiedFrameJSON {
  // Basic node identity
  nodeType: string;
  defaultLabel: string;
  category: string;
  group: 'cell' | 'container'; 
  description: string;
  
  // Visual configuration with unified color system
  visual: {
    icon: IconReference;
    headerGradient?: string;
    selectedColor?: string;
    
    // Variant-based badge colors (for cell-like nodes)
    variants?: {
      fieldName: string; // e.g., "method", "operation", "displayType"
      options: Record<string, {
        badgeText: string;
        badgeColor: string;
        description?: string;
      }>;
      default: {
        badgeText: string;
        badgeColor: string;
      };
    };
    
    // Generic styling for all node types
    style?: {
      borderStyle: 'solid' | 'dashed' | 'none';
      shadowStyle: string;
      customStyles?: Record<string, any>;
    };
    
    // Simple content display function
    additionalContentFunction?: string;
  };
  
  // Default dimensions for node instances
  defaultDimensions: {
    width: number;
    height: number;
  };
  
  // Handle configuration
  handles: {
    category: NodeCategory;
    definitions: HandleTypeDefinition[];
  };
  
  // Process configuration (for cell-like nodes)
  process?: {
    code?: string;
    templateCode?: string;
    metadata: {
      generatedBy: 'ai' | 'manual';
      version: string;
      lastUpdated: string;
      executionContext: 'frontend' | 'backend';
      signature: string;
    };
    expectedInput?: string;
    expectedOutput?: string;
    parameters: Record<string, ProcessParameter>;
  };
}

/**
 * Unified node instance data
 */
export interface UnifiedNodeInstanceData {
  // Core node properties
  label: string;
  details?: string;
  nodeLevel: 'basic' | 'intermediate' | 'advanced';
  
  // Variant selection (if frame has variants)
  selectedVariant?: string;
  
  // Container-specific data
  expanded?: boolean;
  depth?: number;
  isParent?: boolean;
  canContainChildren?: boolean;
  
  // Layout data
  layoutDirection?: 'LR' | 'TB' | 'RL' | 'BT';
  isContainer?: boolean;
  
  // Process customization for cell-like nodes
  processOverrides?: {
    parameters?: Record<string, any>;
    customCode?: string;
    constraints?: {
      timeout?: number;
      maxRetries?: number;
    };
  };
  
  // Node type specific data
  [key: string]: any;
}

/**
 * Style configuration for unified nodes
 */
export interface UnifiedStyleConfig {
  // Color system
  backgroundColor: string; // Depth-based
  borderColor: string; // Selected state or depth-based
  badgeColor?: string; // Variant-based for cell nodes
  
  // Visual properties
  shadowStyle?: string;
  borderStyle?: string;
  
  // Processing states
  processingStyles?: {
    processing: Record<string, any>;
    completed: Record<string, any>;
    error: Record<string, any>;
  };
}

/**
 * Expand/collapse state for container-like nodes
 */
export interface ExpandCollapseState {
  expanded: boolean;
  childCount: number;
  dimensions: {
    current: { width: number; height: number };
    collapsed: { width: number; height: number };
    expanded: { width: number; height: number };
  };
} 