import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FormField } from './FormField';

interface ComplexDataEditorProps {
  value: Record<string, any> | any[];
  onChange: (value: Record<string, any> | any[]) => void;
  label?: string;
  description?: string;
  allowAddFields?: boolean;
  allowDeleteFields?: boolean;
}

export const ComplexDataEditor: React.FC<ComplexDataEditorProps> = ({
  value,
  onChange,
  label = 'Data',
  description,
  allowAddFields = true,
  allowDeleteFields = true
}) => {
  const [expanded, setExpanded] = useState(true);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldType, setNewFieldType] = useState('string');

  // Ensure we always work with objects or arrays
  const isArray = Array.isArray(value);
  const isObject = !isArray && typeof value === 'object' && value !== null;
  const isSimpleValue = !isArray && !isObject;

  // If we have a simple value, we need to convert it to an object structure
  // so we can add fields to it
  const effectiveValue = isSimpleValue ? { value: value } : value;
  const effectiveIsArray = Array.isArray(effectiveValue);
  const effectiveIsObject = !effectiveIsArray && typeof effectiveValue === 'object' && effectiveValue !== null;

  const getDefaultValue = (type: string) => {
    switch (type) {
      case 'boolean': return false;
      case 'number': return 0;
      case 'object': return {};
      case 'array': return [];
      default: return '';
    }
  };

  const handleAddField = () => {
    if (newFieldKey.trim() && effectiveIsObject && !effectiveValue.hasOwnProperty(newFieldKey)) {
      const defaultValue = getDefaultValue(newFieldType);
      const newValue = {
        ...effectiveValue,
        [newFieldKey]: defaultValue
      };
      
      // If this was originally a simple value, we need to preserve that structure
      if (isSimpleValue) {
        onChange(newValue);
      } else {
        onChange(newValue);
      }
      setNewFieldKey('');
    }
  };

  const handleAddArrayItem = () => {
    if (effectiveIsArray) {
      const defaultValue = getDefaultValue(newFieldType);
      onChange([...effectiveValue, defaultValue]);
    }
  };

  const handleRemoveField = (fieldKey: string) => {
    if (effectiveIsObject) {
      const newValue = { ...effectiveValue };
      delete newValue[fieldKey];
      onChange(newValue);
    }
  };

  const handleRemoveArrayItem = (index: number) => {
    if (effectiveIsArray) {
      const newValue = [...effectiveValue];
      newValue.splice(index, 1);
      onChange(newValue);
    }
  };

  const handleFieldChange = (fieldKey: string, fieldValue: any) => {
    if (effectiveIsObject) {
      const newValue = {
        ...effectiveValue,
        [fieldKey]: fieldValue
      };
      onChange(newValue);
    }
  };


  const getEntries = () => {
    if (effectiveIsArray) {
      return effectiveValue.map((item, index) => [index.toString(), item]);
    }
    return Object.entries(effectiveValue);
  };

  const getItemCount = () => {
    if (effectiveIsArray) {
      return effectiveValue.length;
    }
    return Object.keys(effectiveValue).length;
  };

  const getItemLabel = (key: string) => {
    if (effectiveIsArray) {
      return `Item ${key}`;
    }
    return key;
  };

  const handleRemoveItem = (key: string) => {
    if (effectiveIsArray) {
      handleRemoveArrayItem(parseInt(key));
    } else {
      handleRemoveField(key);
    }
  };

  const handleAddItem = () => {
    if (effectiveIsArray) {
      handleAddArrayItem();
    } else {
      handleAddField();
    }
  };

  const entries = getEntries();
  const itemCount = getItemCount();
  const dataType = effectiveIsArray ? 'Array' : 'Object';
  const itemLabel = effectiveIsArray ? 'item' : 'field';

  return (
    <div className="border rounded-md p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <Label className="text-sm font-medium">{label}</Label>
          <Badge variant="outline" className="text-xs">{dataType}</Badge>
        </div>
        <div className="text-xs text-gray-500">
          {itemCount} {itemLabel}{itemCount !== 1 ? 's' : ''}
        </div>
      </div>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {expanded && (
        <div className="space-y-3">
          {/* Items/Fields */}
          {entries.map(([key, itemValue]) => (
            <Field
              key={key}
              fieldKey={key}
              itemValue={itemValue}
              allowDeleteFields={allowDeleteFields}
              handleRemoveItem={handleRemoveItem}
              getItemLabel={getItemLabel}
              handleFieldChange={handleFieldChange}
              itemLabel={itemLabel}
            />
          ))}

          {/* Add new item/field */}
          {allowAddFields && (
            <NewFieldForm
              effectiveIsArray={effectiveIsArray}
              newFieldKey={newFieldKey}
              setNewFieldKey={setNewFieldKey}
              newFieldType={newFieldType}
              setNewFieldType={setNewFieldType}
              handleAddItem={handleAddItem}
              effectiveValue={effectiveValue}
            />
          )}
        </div>
      )}
    </div>
  );
};

interface FieldProps {
  fieldKey: string;
  itemValue: any;
  allowDeleteFields: boolean;
  handleRemoveItem: (key: string) => void;
  getItemLabel: (key: string) => string;
  handleFieldChange: (fieldKey: string, fieldValue: any) => void;
  itemLabel: string;
}

const Field = ({
  fieldKey,
  itemValue,
  allowDeleteFields,
  handleRemoveItem,
  handleFieldChange,
  getItemLabel,
  itemLabel,
}: FieldProps) => {

  const getFieldType = (value: any): string => {
    if (Array.isArray(value)) return 'array';
    if (value === null) return 'null';
    if (typeof value === 'object') return 'object';
    return typeof value;
  };
  return(
    <div className="flex items-start space-x-2">
      <div className="flex-1">
          <FormField
        fieldKey={fieldKey}
        config={{ fieldType: getFieldType(itemValue), label: getItemLabel(fieldKey) }}
        value={itemValue || ''}
        onChange={(newValue) => handleFieldChange(fieldKey, newValue)}
      />
      </div>
      {allowDeleteFields && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRemoveItem(fieldKey)}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
          title={`Remove ${itemLabel}: ${getItemLabel(fieldKey)}`}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}

interface NewFieldFormProps {
  effectiveIsArray: boolean;
  newFieldKey: string;
  setNewFieldKey: (value: string) => void;
  newFieldType: string;
  setNewFieldType: (value: string) => void;
  handleAddItem: () => void;
  effectiveValue: any;
}

const NewFieldForm = ({
  effectiveIsArray,
  newFieldKey,
  setNewFieldKey,
  newFieldType,
  setNewFieldType,
  handleAddItem,
  effectiveValue,
}: NewFieldFormProps) => {
  return( 
    <div className="border-t pt-3">
      <div className="flex items-center space-x-2">
        {!effectiveIsArray && (
          <FormField
            fieldKey={newFieldKey}
            config={{ fieldType: 'text', label: newFieldKey }}
            value={newFieldKey}
            onChange={(newValue) => setNewFieldKey(newValue)}
          />
        )}
        <select
          value={newFieldType}
          onChange={(e) => setNewFieldType(e.target.value)}
          className="px-2 py-1 border rounded text-xs"
        >
          <option value="string">String</option>
          <option value="number">Number</option>
          <option value="boolean">Boolean</option>
          <option value="object">Object</option>
          <option value="array">Array</option>
        </select>
        <Button
          onClick={handleAddItem}
          disabled={!effectiveIsArray && (!newFieldKey.trim() || effectiveValue.hasOwnProperty(newFieldKey))}
          size="sm"
          className="h-8"
        >
          <Plus className="h-3 w-3" />
          {effectiveIsArray ? 'Add Item' : ''}
        </Button>
      </div>
    </div>
  )
}