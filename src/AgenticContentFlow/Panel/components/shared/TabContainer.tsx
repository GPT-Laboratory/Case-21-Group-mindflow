import React, { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface TabContainerProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  badges?: ReactNode[];
  children: ReactNode;
  className?: string;
}

export const TabContainer: React.FC<TabContainerProps> = ({
  title,
  description,
  icon: Icon,
  badges = [],
  children,
  className
}) => {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center space-x-2">
          <Icon className="w-4 h-4" />
          <span>{title}</span>
          {badges.map((badge, index) => (
            <React.Fragment key={index}>{badge}</React.Fragment>
          ))}
        </CardTitle>
        {description && (
          <CardDescription className="text-xs">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
};