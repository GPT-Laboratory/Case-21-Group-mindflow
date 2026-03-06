import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  icon: LucideIcon;
  text: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon: Icon,
  text,
  onClick,
  variant = 'outline',
  size = 'sm',
  disabled = false,
  loading = false,
  className
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
    >
      <Icon className={`w-3 h-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
      {text}
    </Button>
  );
};

interface ActionButtonGroupProps {
  buttons: ActionButtonProps[];
  className?: string;
}

export const ActionButtonGroup: React.FC<ActionButtonGroupProps> = ({
  buttons,
  className
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className || ''}`}>
      {buttons.map((buttonProps, index) => (
        <ActionButton key={index} {...buttonProps} />
      ))}
    </div>
  );
};