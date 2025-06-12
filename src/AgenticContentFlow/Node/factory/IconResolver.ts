/** @format */

import React from 'react';
import { IconReference } from './types';
import * as LucideIcons from 'lucide-react';

/**
 * IconResolver handles resolving different types of icon references to actual React components
 */
export class IconResolver {
  private componentRegistry: Map<string, React.ComponentType<any>> = new Map();
  
  constructor() {
    // Pre-register common components
    this.registerComponent('DomainIcon', this.createDomainIcon);
  }
  
  /**
   * Register a custom icon component
   */
  registerComponent(name: string, component: React.ComponentType<any>) {
    this.componentRegistry.set(name, component);
  }
  
  /**
   * Resolve an icon reference to a React component
   */
  resolveIcon(iconRef: IconReference): React.ReactNode {
    switch (iconRef.type) {
      case 'builtin':
        return this.resolveBuiltinIcon(iconRef);
      case 'component':
        return this.resolveComponentIcon(iconRef);
      case 'path':
        return this.resolvePathIcon(iconRef);
      default:
        console.warn(`Unknown icon type: ${iconRef.type}`);
        return null;
    }
  }
  
  private resolveBuiltinIcon(iconRef: IconReference): React.ReactNode {
    // Try to get from Lucide icons
    const IconComponent = (LucideIcons as any)[iconRef.value];
    
    if (!IconComponent) {
      console.warn(`Builtin icon not found: ${iconRef.value}`);
      return null;
    }
    
    return React.createElement(IconComponent, {
      className: iconRef.className,
      size: iconRef.size,
    });
  }
  
  private resolveComponentIcon(iconRef: IconReference): React.ReactNode {
    const Component = this.componentRegistry.get(iconRef.value);
    
    if (!Component) {
      console.warn(`Component icon not found: ${iconRef.value}`);
      return null;
    }
    
    return React.createElement(Component, {
      className: iconRef.className,
    });
  }
  
  private resolvePathIcon(iconRef: IconReference): React.ReactNode {
    // For SVG paths or image paths
    return React.createElement('img', {
      src: iconRef.value,
      className: iconRef.className,
      width: iconRef.size,
      height: iconRef.size,
      alt: 'Icon',
    });
  }
  
  /**
   * Create a domain icon component (similar to existing DomainIcon)
   */
  private createDomainIcon = ({ domain, favicon, className }: { 
    domain?: string; 
    favicon?: string; 
    className?: string; 
  }) => {
    if (favicon) {
      return React.createElement('img', {
        src: favicon,
        className: `${className} rounded-sm`,
        width: 16,
        height: 16,
        alt: domain || 'Domain',
      });
    }
    
    // Fallback to Globe icon from Lucide
    const Globe = (LucideIcons as any).Globe;
    return React.createElement(Globe, { className });
  };
}