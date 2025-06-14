/** @format */

import { ReactNode } from 'react';
import { NodeProps } from '@xyflow/react';

/**
 * Container-specific node configuration
 */
export interface ContainerNodeJSON {
  nodeType: string;
  defaultLabel: string;
  category: 'container' | 'data' | 'page' | 'statistics';
  group: 'container';
  description: string;
  
  visual: {
    icon: IconReference;
    headerIcon: IconReference;
    headerGradient?: string;
    selectedColor?: string;
    depthColorScheme: 'default' | 'purple' | 'blue' | 'green';
    containerStyle: {
      borderStyle: 'solid' | 'dashed' | 'none';
      shadowStyle: string;
      customStyles?: Record<string, any>;
    };
    expandedAppearance: {
      showIcon: 'small' | 'large' | 'none';
      iconPosition: 'center' | 'header';
    };
    collapsedAppearance: {
      showIcon: 'small' | 'large';
      iconPosition: 'center' | 'header';
    };
  };
  
  behavior: {
    expandable: boolean;
    resizable: boolean;
    canContainChildren: boolean;
    defaultExpanded: boolean;
    autoExpandOnChildAdd?: boolean;
    deleteOnEmpty?: boolean;
  };
  
  dimensions: {
    collapsed: { width: number; height: number };
    expanded: { width: number; height: number };
    minDimensions: { width: number; height: number };
    maxDimensions?: { width: number; height: number };
  };
  
  handles: {
    category: string;
    definitions: HandleDefinition[];
  };
  
  menu: {
    items: MenuItemConfig[];
    containerSpecificItems?: MenuItemConfig[];
  };
  
  content: {
    expandedContent?: string; // Component name or template
    collapsedContent?: string;
    customContentFunction?: string;
  };
  
  template: {
    defaultData: Record<string, any>;
    defaultParameters: Record<string, any>;
  };
}

/**
 * Instance data for container nodes
 */
export interface ContainerInstanceData {
  // Basic node data
  label: string;
  details?: string;
  nodeLevel?: 'basic' | 'intermediate' | 'advanced';
  
  // Container-specific data
  expanded?: boolean;
  depth?: number;
  isParent?: boolean;
  canContainChildren?: boolean;
  
  // Layout data
  layoutDirection?: 'LR' | 'TB' | 'RL' | 'BT';
  isContainer?: boolean;
  
  // Custom data per node type
  [key: string]: any;
}

/**
 * Icon reference for container nodes
 */
export interface IconReference {
  type: 'builtin' | 'component' | 'path';
  value: string;
  className?: string;
  size?: number;
}

/**
 * Handle definition for container nodes
 */
export interface HandleDefinition {
  position: 'top' | 'bottom' | 'left' | 'right';
  type: 'source' | 'target';
  dataFlow: 'control' | 'data' | 'analytics' | 'reference';
  connectsTo?: string[];
  acceptsFrom?: string[];
  icon: string;
  edgeType: 'default' | 'package';
}

/**
 * Menu item configuration
 */
export interface MenuItemConfig {
  key: string;
  label: string;
  action: string;
  icon?: string;
  requiresExpanded?: boolean;
  requiresCollapsed?: boolean;
}

/**
 * Container node factory result
 */
export interface ContainerNodeFactoryResult {
  nodeComponent: React.FC<NodeProps>;
  templateFunction: (params: any) => any;
  config: ContainerNodeJSON;
}

/**
 * Style configuration for container appearance
 */
export interface ContainerStyleConfig {
  color: string;
  borderColor: string;
  backgroundColor: string;
  shadowStyle: string;
  borderStyle: string;
  processingStyles?: {
    processing: Record<string, any>;
    completed: Record<string, any>;
    error: Record<string, any>;
  };
}

/**
 * Expand/collapse state management
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

/**
 * Container content configuration
 */
export interface ContainerContentConfig {
  expandedContent?: ReactNode;
  collapsedContent?: ReactNode;
  hasCustomContent: boolean;
  contentFunction?: (data: any, state: ExpandCollapseState) => ReactNode;
}