import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface TabContainerProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  badges?: ReactNode[];
  children: ReactNode;
  className?: string;
  compact?: boolean;
}

export const TabContainer: React.FC<TabContainerProps> = ({
  children,
  className,
}) => {

    return (
      <div className={`h-full flex flex-col ${className || ''}`}>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    );
  
};