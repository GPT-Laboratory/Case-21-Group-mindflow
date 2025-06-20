import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useInputFocusHandlers } from '../../hooks/useInputFocusHandlers';
import { FieldConfig } from '../../types';

interface FormFieldProps {
  fieldKey: string;
  config: FieldConfig;
  value: any;
  onChange: (value: any) => void;
}

export const FormField: React.FC<FormFieldProps> = ({ fieldKey, config, value, onChange }) => {
  const { onFocus, onBlur } = useInputFocusHandlers();

  // Debug logging to help identify [object Object] issues
  React.useEffect(() => {
    if (value && typeof value === 'object') {
      console.log(`FormField debug for ${fieldKey}:`, {
        value,
        valueType: typeof value,
        fieldType: config.fieldType,
        isArray: Array.isArray(value)
      });
    }
  }, [fieldKey, value, config.fieldType]);

  const renderField = () => {
    // Handle object and array values by showing them as JSON strings
    if (value && typeof value === 'object' && value !== null) {
      return (
        <Textarea
          value={JSON.stringify(value, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onChange(parsed);
            } catch (error) {
              // If JSON is invalid, just store the raw string
              onChange(e.target.value);
            }
          }}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="Enter JSON object or array..."
          rows={4}
          className="font-mono text-sm"
        />
      );
    }

    switch (config.fieldType) {
      case 'text':
        return (
          <Input
            type="text"
            value={value || config.defaultValue || ''}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={config.placeholder}
            required={config.required}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            value={value || config.defaultValue || ''}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={config.placeholder}
            rows={4}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value || config.defaultValue || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            onFocus={onFocus}
            onBlur={onBlur}
            min={config.validation?.min}
            max={config.validation?.max}
          />
        );
      
      case 'select':
        return (
          <Select value={value || config.defaultValue} onValueChange={onChange}>
            <SelectTrigger onFocus={onFocus} onBlur={onBlur}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {config.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={value !== undefined ? value : config.defaultValue}
              onCheckedChange={onChange}
              onFocus={onFocus}
              onBlur={onBlur}
            />
            <Label>{value ? 'Enabled' : 'Disabled'}</Label>
          </div>
        );
      
      default:
        return (
          <Input
            type="text"
            value={value || config.defaultValue || ''}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={config.placeholder}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Label htmlFor={fieldKey} className="text-sm font-medium">
          {config.label}
        </Label>
        {config.required && (
          <Badge variant="outline" className="text-xs">Required</Badge>
        )}
      </div>
      {renderField()}
      {config.description && (
        <p className="text-xs text-muted-foreground">{config.description}</p>
      )}
    </div>
  );
};