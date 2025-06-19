/** @format */

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { IconReference } from './types/UnifiedFrameJSON';

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
   * Get favicon URL from a given URL
   */
  getFaviconUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      
      // Check if it's localhost
      if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
        return null; // Will trigger local icon
      }
      
      // Use Google's favicon service
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
    } catch (error) {
      console.warn('Invalid URL provided for favicon:', url);
      return null;
    }
  }

  /**
   * Create a favicon icon component from URL
   */
  createFaviconIcon(url: string, props: any = {}): React.ReactNode {
    try {
      const urlObj = new URL(url);
      
      // Check if it's localhost - use "L" icon
      if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
        return React.createElement('div', {
          ...props,
          className: `inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-800 rounded text-xs font-bold ${props.className || ''}`.trim(),
          style: { fontSize: '12px', ...props.style }
        }, 'L');
      }
      
      // Use Google's favicon service for external URLs
      const faviconUrl = this.getFaviconUrl(url);
      if (faviconUrl) {
        return React.createElement('img', {
          ...props,
          src: faviconUrl,
          alt: `${urlObj.hostname} favicon`,
          className: `w-5 h-5 ${props.className || ''}`.trim(),
          style: { objectFit: 'contain', ...props.style },
          onError: (e: any) => {
            // Fallback to a generic web icon if favicon fails to load
            console.warn(`Failed to load favicon for ${urlObj.hostname}`);
            e.target.style.display = 'none';
          }
        });
      }
    } catch (error) {
      console.warn('Invalid URL provided for favicon:', url);
    }
    
    // Fallback to generic web icon
    const WebIconComponent = (LucideIcons as any)['Globe'];
    if (WebIconComponent) {
      return React.createElement(WebIconComponent, {
        ...props,
        className: `w-5 h-5 ${props.className || ''}`.trim()
      });
    }
    
    return null;
  }

  /**
   * Resolve an icon, checking for URL in data first
   */
  resolveIconWithUrl(iconRef: IconReference, nodeData: any = {}, props: any = {}): React.ReactNode {
    // Check if node has a URL and use favicon instead
    if (nodeData.url && typeof nodeData.url === 'string') {
      return this.createFaviconIcon(nodeData.url, props);
    }
    
    // Fall back to regular icon resolution
    return this.resolveIcon(iconRef, props);
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