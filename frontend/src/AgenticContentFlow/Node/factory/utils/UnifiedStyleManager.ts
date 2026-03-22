/** @format */

import { FrameJSON, UnifiedStyleConfig } from '../types/FrameJSON';

/**
 * Unified Style Manager - handles styling logic for all node types
 * Combines depth-based background colors with variant-based badge colors
 */
export class UnifiedStyleManager {
  
  /**
   * Generate unified style configuration based on frame config and node state
   */
  static generateStyleConfig(
    config: FrameJSON,
    nodeData: any,
    state: {
      selected: boolean;
      expanded?: boolean;
      isProcessing?: boolean;
      hasError?: boolean;
      isCompleted?: boolean;
    }
  ): UnifiedStyleConfig {
    const { selected } = state;
    
    // Use user-set color if available, otherwise depth-based
    const depth = nodeData.depth || 0;
    const backgroundColor = nodeData.nodeColor || this.getDepthColor(depth, config.category);
    
    // Determine border color based on state
    const borderColor = selected ? '#3b82f6' : backgroundColor;
    
    // Get variant-based badge color if applicable
    const badgeColor = this.getVariantBadgeColor(config, nodeData);
    
    // Get generic styles if applicable
    const genericStyles = config.visual.style ? {
      shadowStyle: config.visual.style.shadowStyle,
      borderStyle: config.visual.style.borderStyle,
    } : {};
    
    return {
      backgroundColor,
      borderColor,
      badgeColor,
      ...genericStyles,
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
   * Get background color based on depth and category
   */
  private static getDepthColor(depth: number, category: string): string {
    const colorSchemes: Record<string, string[]> = {
      logic: [
        '#fef3c7', // amber-100
        '#fde68a', // amber-200
        '#fcd34d', // amber-300
        '#fbbf24', // amber-400
        '#f59e0b'  // amber-500
      ],
      integration: [
        '#dbeafe', // blue-100
        '#bfdbfe', // blue-200
        '#93c5fd', // blue-300
        '#60a5fa', // blue-400
        '#3b82f6'  // blue-500
      ],
      view: [
        '#dcfce7', // green-100
        '#bbf7d0', // green-200
        '#86efac', // green-300
        '#4ade80', // green-400
        '#22c55e'  // green-500
      ],
      container: [
        '#f3e8ff', // purple-100
        '#e9d5ff', // purple-200
        '#c4b5fd', // purple-300
        '#a78bfa', // purple-400
        '#8b5cf6'  // purple-500
      ],
      page: [
        '#fef2f2', // red-100
        '#fecaca', // red-200
        '#fca5a5', // red-300
        '#f87171', // red-400
        '#ef4444'  // red-500
      ],
      default: [
        '#f0d1a0', // Light orange
        '#e1a382', // Medium orange  
        '#dd6e6e', // Light red
        '#c34949', // Medium red
        '#9f3d3d'  // Dark red
      ]
    };

    const colors = colorSchemes[category] || colorSchemes.default;
    return colors[Math.min(depth, colors.length - 1)];
  }

  /**
   * Get variant-based badge color if variants are configured
   */
  private static getVariantBadgeColor(config: FrameJSON, nodeData: any): string | undefined {
    const variants = config.visual.variants;
    if (!variants) return undefined;

    const fieldValue = nodeData[variants.fieldName];
    if (!fieldValue) return variants.default.badgeColor;

    const variantConfig = variants.options[fieldValue];
    return variantConfig ? variantConfig.badgeColor : variants.default.badgeColor;
  }

  /**
   * Get variant badge text if variants are configured
   */
  static getVariantBadgeText(config: FrameJSON, nodeData: any): string {
    const variants = config.visual.variants;
    if (!variants) return '';

    const fieldValue = nodeData[variants.fieldName];
    if (!fieldValue) return variants.default.badgeText;

    const variantConfig = variants.options[fieldValue];
    return variantConfig ? variantConfig.badgeText : variants.default.badgeText;
  }

  /**
   * Get variant description if variants are configured
   */
  static getVariantDescription(config: FrameJSON, nodeData: any): string | undefined {
    const variants = config.visual.variants;
    if (!variants) return undefined;

    const fieldValue = nodeData[variants.fieldName];
    if (!fieldValue) return undefined;

    const variantConfig = variants.options[fieldValue];
    return variantConfig?.description;
  }

  /**
   * Check if node has variants configured
   */
  static hasVariants(config: FrameJSON): boolean {
    return Boolean(config.visual.variants);
  }

  /**
   * Get processing state styles
   */
  static getProcessingStateStyles(
    styleConfig: UnifiedStyleConfig,
    processingState: 'idle' | 'processing' | 'completed' | 'error'
  ): Record<string, any> {
    if (processingState === 'idle') return {};
    
    return styleConfig.processingStyles?.[processingState] || {};
  }

  /**
   * Get content area styles for expandable nodes
   */
  static getContentAreaStyles(expanded: boolean): Record<string, any> {
    return {
      flex: 1,
      padding: expanded ? '1rem' : '0',
      overflow: 'hidden',
      transition: 'all 0.2s ease-in-out',
      opacity: expanded ? 1 : 0,
      maxHeight: expanded ? 'none' : 0,
    };
  }

  /**
   * Calculate the actual visual color for minimap representation
   * Takes into account special styling like transparent backgrounds and header gradients
   */
  static calculateMinimapColor(config: FrameJSON, styleConfig: UnifiedStyleConfig): string {
    // Check if the node has transparent background styling
    if (config.visual.style?.customStyles?.backgroundColor === 'transparent') {
      // Use a light gray for transparent nodes in minimap
      return '#f3f4f6'; // gray-100
    }
    
    // Check if the node has a header gradient and extract the primary color
    if (config.visual.headerGradient) {
      const gradientMatch = config.visual.headerGradient.match(/from-(\w+)-(\d+)/);
      if (gradientMatch) {
        const [, colorName, shade] = gradientMatch;
        const colorMap: Record<string, string> = {
          'purple': '#f3e8ff', // purple-100
          'blue': '#dbeafe',   // blue-100
          'green': '#dcfce7',  // green-100
          'amber': '#fef3c7',  // amber-100
          'red': '#fee2e2',    // red-100
          'orange': '#fff7ed', // orange-100
        };
        return colorMap[colorName] || styleConfig.backgroundColor;
      }
    }
    
    // Default to the calculated background color
    return styleConfig.backgroundColor;
  }

  /**
   * Calculate the actual visual color for handle representation
   * Uses the node's background color directly so handles match the node
   */
  static calculateHandleColor(config: FrameJSON, styleConfig: UnifiedStyleConfig): string {
    return styleConfig.backgroundColor;
  }
} 