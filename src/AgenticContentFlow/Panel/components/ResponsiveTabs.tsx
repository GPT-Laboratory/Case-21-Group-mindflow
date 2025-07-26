import React, { useState, useEffect, useRef } from 'react';
import { TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Code, 
  Eye, 
  ArrowLeftRight, 
  AlertTriangle,
  Info,
  LucideIcon 
} from 'lucide-react';

interface TabConfig {
  value: string;
  label: string;
  icon: LucideIcon;
  abbreviation: string;
}

const TAB_CONFIGS: TabConfig[] = [
  {
    value: 'data',
    label: 'Data',
    icon: Database,
    abbreviation: 'D'
  },
  {
    value: 'details',
    label: 'Details',
    icon: Info,
    abbreviation: 'Det'
  },
  {
    value: 'code',
    label: 'Code',
    icon: Code,
    abbreviation: 'C'
  },
  {
    value: 'preview',
    label: 'Preview',
    icon: Eye,
    abbreviation: 'P'
  },
  {
    value: 'inputoutput',
    label: 'Input/Output',
    icon: ArrowLeftRight,
    abbreviation: 'I/O'
  },
  {
    value: 'errors',
    label: 'Errors',
    icon: AlertTriangle,
    abbreviation: 'E'
  }
];

export const ResponsiveTabs: React.FC = () => {
  const [displayMode, setDisplayMode] = useState<'full' | 'abbreviated' | 'icon'>('full');
  const tablistRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Find the tablist element on mount
    const tablist = document.querySelector('[role="tablist"]');
    if (!tablist) return;
    tablistRef.current = tablist as HTMLDivElement;

    const checkSpace = () => {
      if (!tablistRef.current) return;
      const containerWidth = tablistRef.current.clientWidth;
      // Estimate widths
      const fullWidth = TAB_CONFIGS.length * 100; // generous for full text
      const abbreviatedWidth = TAB_CONFIGS.length * 56; // icon + abbrev
      const iconWidth = TAB_CONFIGS.length * 40; // icon only
      if (containerWidth >= fullWidth) {
        setDisplayMode('full');
      } else if (containerWidth >= abbreviatedWidth) {
        setDisplayMode('abbreviated');
      } else {
        setDisplayMode('icon');
      }
    };

    // Use ResizeObserver for parent width changes
    const observer = new window.ResizeObserver(checkSpace);
    observer.observe(tablistRef.current);
    // Initial check
    checkSpace();
    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);

  const renderTabContent = (tab: TabConfig) => {
    const IconComponent = tab.icon;
    
    switch (displayMode) {
      case 'full':
        return tab.label;
      case 'abbreviated':
        return (
          <span className="flex items-center gap-1">
            <IconComponent className="h-4 w-4" />
            <span>{tab.abbreviation}</span>
          </span>
        );
      case 'icon':
        return <IconComponent className="h-5 w-5" />;
      default:
        return tab.label;
    }
  };

  return (
    <div className="min-w-0 flex-1 overflow-x-auto scrollbar-hide flex">
      {TAB_CONFIGS.map((tab) => (
        <TabsTrigger 
          key={tab.value} 
          value={tab.value}
          className={
            `flex-1 flex items-center justify-center min-w-[40px] max-w-[120px] px-1 truncate
            !bg-transparent !shadow-none !ring-0 border-0 border-b border-b-transparent rounded-none
            data-[state=active]:border-b-primary data-[state=active]:!bg-transparent`
          }
          title={tab.label} // Show full label on hover
        >
          {renderTabContent(tab)}
        </TabsTrigger>
      ))}
    </div>
  );
}; 