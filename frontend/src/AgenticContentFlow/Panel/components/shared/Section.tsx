import React, { ReactNode } from 'react';
import { Separator } from '@/components/ui/separator';
import { LucideIcon } from 'lucide-react';

interface SectionProps {
  title?: string;
  icon?: LucideIcon;
  children: ReactNode;
  actions?: ReactNode;
  separator?: boolean;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({
  title,
  icon: Icon,
  children,
  actions,
  separator = false,
  className
}) => {
  return (
    <div className={className}>
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4" />}
            {title}
          </h4>
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
      {separator && <Separator className="mt-4" />}
    </div>
  );
};

interface InfoCardProps {
  title: string;
  content: string | ReactNode;
  type?: 'default' | 'info' | 'warning' | 'success';
  className?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  content,
  type = 'info',
  className
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className={`text-xs p-3 rounded border ${getTypeStyles()} ${className || ''}`}>
      <div className="font-medium mb-1">{title}</div>
      <div>{content}</div>
    </div>
  );
};