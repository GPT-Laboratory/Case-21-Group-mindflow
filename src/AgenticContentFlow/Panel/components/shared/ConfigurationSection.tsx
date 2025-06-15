import React, { useState } from 'react';
import { LucideIcon, Plus, Trash2, RotateCcw } from 'lucide-react';
import { FormField } from './FormField';
import { Section, InfoCard, MetadataGrid } from './index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldConfig } from '../../types';

interface ConfigurationSectionProps {
  title: string;
  icon?: LucideIcon;
  data: Record<string, any>;
  templateDefaults?: Record<string, any>;
  fieldConfigs?: Record<string, FieldConfig>;
  onChange: (fieldKey: string, value: any) => void;
  onDelete?: (fieldKey: string) => void;
  readOnly?: boolean;
  showAsGrid?: boolean;
  description?: string;
  emptyMessage?: string;
  allowAddFields?: boolean;
  allowDeleteFields?: boolean;
  showResetButtons?: boolean;
}

export const ConfigurationSection: React.FC<ConfigurationSectionProps> = ({
  title,
  icon,
  data,
  templateDefaults = {},
  fieldConfigs = {},
  onChange,
  onDelete,
  readOnly = false,
  showAsGrid = false,
  description,
  emptyMessage = "No configuration found",
  allowAddFields = false,
  allowDeleteFields = false,
  showResetButtons = false
}) => {
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  
  const dataEntries = Object.entries(data);
  
  const handleAddField = () => {
    if (newFieldKey.trim() && !data.hasOwnProperty(newFieldKey)) {
      const defaultValue = newFieldType === 'boolean' ? false :
                          newFieldType === 'number' ? 0 :
                          newFieldType === 'object' ? {} : '';
      onChange(newFieldKey, defaultValue);
      setNewFieldKey('');
    }
  };

  const handleDeleteField = (fieldKey: string) => {
    if (onDelete) {
      onDelete(fieldKey);
    }
  };

  const handleResetToDefault = (fieldKey: string) => {
    if (templateDefaults[fieldKey] !== undefined) {
      onChange(fieldKey, templateDefaults[fieldKey]);
    }
  };

  if (dataEntries.length === 0 && !allowAddFields) {
    return (
      <Section title={title} icon={icon}>
        {description && (
          <InfoCard title="Information" type="info" content={description} />
        )}
        <div className="text-sm text-muted-foreground italic">
          {emptyMessage}
        </div>
      </Section>
    );
  }

  if (readOnly || showAsGrid) {
    return (
      <Section title={title} icon={icon}>
        {description && (
          <InfoCard title="Information" type="info" content={description} />
        )}
        <MetadataGrid
          items={dataEntries.map(([key, value]) => ({
            label: key,
            value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
          }))}
          columns={2}
        />
      </Section>
    );
  }

  return (
    <Section title={title} icon={icon}>
      {description && (
        <InfoCard title="Information" type="info" content={description} />
      )}
      
      <div className="space-y-3">
        {dataEntries.map(([fieldKey, value]) => {
          // Use provided field config or generate a dynamic one
          const fieldConfig = fieldConfigs[fieldKey] || {
            fieldType: typeof value === 'boolean' ? 'boolean' : 
                     typeof value === 'number' ? 'number' :
                     typeof value === 'object' ? 'textarea' : 'text',
            label: fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1).replace(/([A-Z])/g, ' $1'),
            description: `Configuration for ${fieldKey}`,
            defaultValue: templateDefaults[fieldKey] || value
          };

          const hasDefault = templateDefaults[fieldKey] !== undefined;
          const isDefaultValue = hasDefault && JSON.stringify(value) === JSON.stringify(templateDefaults[fieldKey]);

          return (
            <div key={fieldKey} className="flex items-start space-x-2">
              <div className="flex-1">
                <FormField
                  fieldKey={fieldKey}
                  config={fieldConfig}
                  value={value}
                  onChange={(newValue) => onChange(fieldKey, newValue)}
                />
              </div>
              
              <div className="flex flex-col space-y-1 pt-6">
                {/* Reset to default button */}
                {showResetButtons && hasDefault && !isDefaultValue && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResetToDefault(fieldKey)}
                    className="h-8 w-8 p-0"
                    title={`Reset to default: ${JSON.stringify(templateDefaults[fieldKey])}`}
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}
                
                {/* Delete field button */}
                {allowDeleteFields && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteField(fieldKey)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    title={`Delete field: ${fieldKey}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add new field section */}
        {allowAddFields && (
          <div className="border-t pt-3 mt-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Field name"
                value={newFieldKey}
                onChange={(e) => setNewFieldKey(e.target.value)}
                className="flex-1"
              />
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="object">Object</option>
              </select>
              <Button
                onClick={handleAddField}
                disabled={!newFieldKey.trim() || data.hasOwnProperty(newFieldKey)}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
};