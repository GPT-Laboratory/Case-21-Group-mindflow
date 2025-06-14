/** @format */

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { IconReference } from '../container/types';

// Import custom icon components used in the original nodes
import CircleStackIcon from '@/components/icons/circle-stack';
import WebIcon from '@/components/icons/web';
import ChartIcon from '@/components/icons/chart';

/**
 * Icon resolver for both built-in Lucide icons and custom components
 */
export class IconResolver {
  private customComponents: Map<string, React.ComponentType<any>> = new Map();
  
  constructor() {
    // Register custom icon components used in original nodes
    this.registerComponent('CircleStackIcon', CircleStackIcon);
    this.registerComponent('WebIcon', WebIcon);
    this.registerComponent('ChartIcon', ChartIcon);
  }

  /**
   * Register a custom icon component
   */
  registerComponent(name: string, component: React.ComponentType<any>) {
    this.customComponents.set(name, component);
  }

  /**
   * Resolve an icon reference to a React component
   */
  resolveIcon(iconRef: IconReference, props: any = {}): React.ReactNode {
    if (iconRef.type === 'component') {
      // Check custom components first
      const CustomComponent = this.customComponents.get(iconRef.value);
      if (CustomComponent) {
        return React.createElement(CustomComponent, {
          ...props,
          className: `${iconRef.className || ''} ${props.className || ''}`.trim()
        });
      }
      
      // Fallback to Lucide icons
      const LucideComponent = (LucideIcons as any)[iconRef.value];
      if (LucideComponent) {
        return React.createElement(LucideComponent, {
          ...props,
          className: `${iconRef.className || ''} ${props.className || ''}`.trim()
        });
      }
      
      console.warn(`Icon component '${iconRef.value}' not found`);
      return null;
    }
    
    if (iconRef.type === 'builtin') {
      const LucideComponent = (LucideIcons as any)[iconRef.value];
      if (LucideComponent) {
        return React.createElement(LucideComponent, {
          ...props,
          className: `${iconRef.className || ''} ${props.className || ''}`.trim()
        });
      }
      
      console.warn(`Built-in icon '${iconRef.value}' not found`);
      return null;
    }
    
    console.warn(`Unknown icon type: ${iconRef.type}`);
    return null;
  }

  /**
   * Get available icon names for debugging
   */
  getAvailableIcons(): { custom: string[], builtin: string[] } {
    return {
      custom: Array.from(this.customComponents.keys()),
      builtin: Object.keys(LucideIcons).filter(key => 
        typeof (LucideIcons as any)[key] === 'function'
      )
    };
  }
}