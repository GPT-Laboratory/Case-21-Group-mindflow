/** @format */

import { ContainerNodeJSON } from '../types';

/**
 * StatisticsNode Configuration
 * Represents analytics and metrics visualization
 */
export const statisticsNodeConfig: ContainerNodeJSON = {
  nodeType: "statisticsnode",
  defaultLabel: "Statistics",
  category: "statistics",
  group: "container",
  description: "Container for analytics and metrics visualization",
  
  visual: {
    icon: { 
      type: "component", 
      value: "ChartIcon",
      className: "stroke-slate-700"
    },
    headerIcon: { 
      type: "component", 
      value: "ChartIcon", 
      className: "w-6 h-6" 
    },
    depthColorScheme: "default",
    containerStyle: {
      borderStyle: "solid",
      shadowStyle: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      customStyles: { 
        borderRadius: "0.5rem",
        border: "2px solid #d1d5db"
      }
    },
    expandedAppearance: {
      showIcon: "small",
      iconPosition: "header"
    },
    collapsedAppearance: {
      showIcon: "large",
      iconPosition: "center"
    }
  },
  
  behavior: {
    expandable: true,
    resizable: true,
    canContainChildren: false,
    defaultExpanded: false,
    autoExpandOnChildAdd: false,
    deleteOnEmpty: false
  },
  
  dimensions: {
    collapsed: { width: 300, height: 200 },
    expanded: { width: 300, height: 300 },
    minDimensions: { width: 200, height: 150 },
    maxDimensions: { width: 600, height: 500 }
  },
  
  handles: {
    category: "statistics",
    definitions: [
      {
        position: "left",
        type: "target",
        dataFlow: "analytics",
        connectsTo: [],
        acceptsFrom: ["pagenode"],
        icon: "ArrowLeft",
        edgeType: "default"
      }
    ]
  },
  
  menu: {
    items: [
      { 
        key: "export", 
        label: "Export Data", 
        action: "export_data",
        requiresExpanded: false 
      },
      { 
        key: "refresh", 
        label: "Refresh Metrics", 
        action: "refresh",
        requiresExpanded: false 
      },
      { 
        key: "configure", 
        label: "Configure Charts", 
        action: "configure",
        requiresExpanded: false 
      }
    ],
    containerSpecificItems: [
      {
        key: "chart_settings",
        label: "Chart Display Settings",
        action: "chart_settings",
        requiresExpanded: true
      }
    ]
  },
  
  content: {
    expandedContent: "statisticsContent",
    collapsedContent: undefined,
    customContentFunction: "generateStatisticsNodeContent"
  },
  
  template: {
    defaultData: {
      label: "Statistics",
      chartType: "bar",
      expanded: false,
      isParent: false,
      nodeLevel: "intermediate",
      details: "Analytics and metrics visualization",
      metrics: "Views: 0, Clicks: 0, Duration: 0s"
    },
    defaultParameters: {
      chartConfig: {},
      dataPoints: [],
      refreshInterval: 60000
    }
  }
};