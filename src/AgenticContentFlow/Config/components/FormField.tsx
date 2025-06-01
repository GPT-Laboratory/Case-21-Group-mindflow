import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { FieldConfig } from '../types';

interface FormFieldProps {
  fieldKey: string;
  config: FieldConfig;
  value: any;
  onChange: (value: any) => void;
}

export const FormField: React.FC<FormFieldProps> = ({ fieldKey, config, value, onChange }) => {
  // Helper function to format object values for textarea display
  const formatValueForDisplay = (val: any, fieldType: string): string => {
    if (fieldType === 'textarea' && val && typeof val === 'object') {
      try {
        return JSON.stringify(val, null, 2);
      } catch (error) {
        console.warn('Error stringifying object value:', error);
        return '';
      }
    }
    return val || config.defaultValue || '';
  };

  // Helper function to parse textarea values back to objects when needed
  const parseTextareaValue = (textValue: string): any => {
    // If the placeholder suggests JSON format, try to parse it
    if (config.placeholder && config.placeholder.includes('{')) {
      try {
        return JSON.parse(textValue);
      } catch (error) {
        // If parsing fails, return as string
        return textValue;
      }
    }
    return textValue;
  };

  const renderField = () => {
    switch (config.fieldType) {
      case 'text':
        return (
          <Input
            type="text"
            value={formatValueForDisplay(value, 'text')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder}
            required={config.required}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            value={formatValueForDisplay(value, 'textarea')}
            onChange={(e) => onChange(parseTextareaValue(e.target.value))}
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
            min={config.validation?.min}
            max={config.validation?.max}
          />
        );
      
      case 'select':
        return (
          <Select value={value || config.defaultValue} onValueChange={onChange}>
            <SelectTrigger>
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
            />
            <Label>{value ? 'Enabled' : 'Disabled'}</Label>
          </div>
        );
      
      default:
        return (
          <Input
            type="text"
            value={formatValueForDisplay(value, 'text')}
            onChange={(e) => onChange(e.target.value)}
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