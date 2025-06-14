/** @format */

import React from 'react';
import { ContainerNodeJSON, ContainerStyleConfig, ExpandCollapseState } from '../types';

/**
 * Container Style Manager - handles styling logic for container nodes
 */
export class ContainerStyleManager {
  
  /**
   * Generate style configuration based on container config and state
   */
  static generateStyleConfig(
    config: ContainerNodeJSON,
    nodeData: any,
    state: {
      selected: boolean;
      expanded: boolean;
      isProcessing?: boolean;
      hasError?: boolean;
      isCompleted?: boolean;
    }
  ): ContainerStyleConfig {
    const { selected } = state;
    
    // Get depth-based color
    const depth = nodeData.depth || 0;
    const baseColor = this.getDepthColor(depth, config.visual.depthColorScheme);
    
    // Determine border color based on state
    const borderColor = selected ? '#3b82f6' : baseColor;
    
    // Background color logic - transparent when expanded for some container types
    const backgroundColor = 'var(--color-background)';
    
    return {
      color: baseColor,
      borderColor,
      backgroundColor,
      shadowStyle: config.visual.containerStyle.shadowStyle,
      borderStyle: config.visual.containerStyle.borderStyle,
      processingStyles: {
        processing: {
          animation: 'pulse 2s infinite',
          borderColor: '#3b82f6'
        },
        completed: {
          borderColor: '#10b981',
          boxShadow: `0 0 0 2px #10b98120`
        },
        error: {
          borderColor: '#ef4444',
          boxShadow: `0 0 0 2px #ef444420`
        }
      }
    };
  }

  /**
   * Get color based on depth and color scheme
   */
  private static getDepthColor(depth: number, scheme: string): string {
    const colorSchemes: Record<string, string[]> = {
      default: [
        '#f3f4f6', // gray-100
        '#e5e7eb', // gray-200
        '#d1d5db', // gray-300
        '#9ca3af', // gray-400
        '#6b7280', // gray-500
      ],
      purple: [
        '#faf5ff', // purple-50
        '#f3e8ff', // purple-100
        '#e9d5ff', // purple-200
        '#c4b5fd', // purple-300
        '#a78bfa', // purple-400
      ],
      blue: [
        '#eff6ff', // blue-50
        '#dbeafe', // blue-100
        '#bfdbfe', // blue-200
        '#93c5fd', // blue-300
        '#60a5fa', // blue-400
      ],
      green: [
        '#f0fdf4', // green-50
        '#dcfce7', // green-100
        '#bbf7d0', // green-200
        '#86efac', // green-300
        '#4ade80', // green-400
      ]
    };

    const colors = colorSchemes[scheme] || colorSchemes.default;
    return colors[Math.min(depth, colors.length - 1)];
  }

  /**
   * Get icon styling based on expand state and config
   */
  static getIconStyling(
    config: ContainerNodeJSON,
    expanded: boolean
  ): {
    className: string;
    size: 'small' | 'large';
    position: 'center' | 'header';
  } {
    const appearance = expanded ? config.visual.expandedAppearance : config.visual.collapsedAppearance;
    
    let className = '';
    
    if (appearance.iconPosition === 'center') {
      className = expanded 
        ? 'relative w-6 h-6' 
        : 'absolute w-16 h-16 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2';
    } else {
      className = 'relative w-6 h-6';
    }

    return {
      className,
      size: appearance.showIcon as 'small' | 'large',
      position: appearance.iconPosition
    };
  }

  /**
   * Generate container wrapper styles
   */
  static getContainerWrapperStyles(
    config: ContainerNodeJSON,
    styleConfig: ContainerStyleConfig,
    dimensions: { width: number; height: number },
    state: ExpandCollapseState
  ): React.CSSProperties {    
    const baseStyles: React.CSSProperties = {
      width: dimensions.width,
      height: dimensions.height,
      backgroundColor: styleConfig.backgroundColor,
      border: styleConfig.borderStyle !== 'none' ? `2px ${styleConfig.borderStyle} ${styleConfig.borderColor}` : 'none',
      boxShadow: styleConfig.shadowStyle,
      transition: 'width 0.2s ease, height 0.2s ease, border-color 0.2s ease',
      borderRadius: '0.375rem', // rounded-md
      overflow: 'visible',
      position: 'relative',
      ...config.visual.containerStyle.customStyles
    };

    return baseStyles;
  }

  /**
   * Get content area styles for expanded content
   */
  static getContentAreaStyles(expanded: boolean): React.CSSProperties {
    if (!expanded) return { display: 'none' };
    
    return {
      flex: '1',
      padding: '1rem',
      fontSize: '0.875rem', // text-sm
      overflow: 'auto'
    };
  }

  /**
   * Generate processing state styles
   */
  static getProcessingStateStyles(
    styleConfig: ContainerStyleConfig,
    processingState: 'idle' | 'processing' | 'completed' | 'error'
  ): React.CSSProperties {
    if (processingState === 'idle' || !styleConfig.processingStyles) {
      return {};
    }

    return styleConfig.processingStyles[processingState] || {};
  }
}