import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Hash, Type, ToggleLeft } from 'lucide-react';

interface LogicRule {
  id: string;
  field: string;
  operator: string;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

interface FieldInfo {
  name: string;
  type: string;
  path: string;
  description?: string;
  required?: boolean;
}

interface LogicRuleBuilderProps {
  rule: LogicRule;
  availableFields: FieldInfo[];
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (ruleId: string, updates: Partial<LogicRule>) => void;
  onRemove: (ruleId: string) => void;
}

export const LogicRuleBuilder: React.FC<LogicRuleBuilderProps> = ({
  rule,
  availableFields,
  isFirst,
  onUpdate,
  onRemove
}) => {
  // Get the field info for the currently selected field
  const selectedField = availableFields.find(f => f.path === rule.field);
  const fieldType = selectedField?.type || 'string';

  // Get appropriate operators based on field type
  const getOperatorsForType = (type: string) => {
    switch (type) {
      case 'number':
        return [
          { value: '==', label: 'equals' },
          { value: '!=', label: 'not equals' },
          { value: '>', label: 'greater than' },
          { value: '>=', label: 'greater or equal' },
          { value: '<', label: 'less than' },
          { value: '<=', label: 'less or equal' }
        ];
      case 'string':
        return [
          { value: '==', label: 'equals' },
          { value: '!=', label: 'not equals' },
          { value: 'contains', label: 'contains' },
          { value: 'startsWith', label: 'starts with' },
          { value: 'endsWith', label: 'ends with' },
          { value: 'length>', label: 'length greater than' },
          { value: 'length<', label: 'length less than' }
        ];
      case 'boolean':
        return [
          { value: '==', label: 'is' },
          { value: '!=', label: 'is not' }
        ];
      default:
        return [
          { value: '==', label: 'equals' },
          { value: '!=', label: 'not equals' }
        ];
    }
  };

  // Get the appropriate input component for the value based on field type and operator
  const renderValueInput = () => {

    // Handle length-based operations for strings
    if (rule.operator.startsWith('length')) {
      return (
        <Input
          type="number"
          value={rule.value}
          onChange={(e) => onUpdate(rule.id, { value: parseInt(e.target.value) || 0 })}
          placeholder="Length"
          className="h-8 text-xs"
        />
      );
    }

    switch (fieldType) {
      case 'number':
        return (
          <Input
            type="number"
            value={rule.value}
            onChange={(e) => onUpdate(rule.id, { value: parseFloat(e.target.value) || 0 })}
            placeholder="Number"
            className="h-8 text-xs"
          />
        );
      case 'boolean':
        return (
          <Select value={rule.value?.toString()} onValueChange={(value) => onUpdate(rule.id, { value: value === 'true' })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
        );
      default: // string
        return (
          <Input
            type="text"
            value={rule.value}
            onChange={(e) => onUpdate(rule.id, { value: e.target.value })}
            placeholder="Value"
            className="h-8 text-xs"
          />
        );
    }
  };

  // Get icon for field type
  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'number': return <Hash className="w-3 h-3" />;
      case 'string': return <Type className="w-3 h-3" />;
      case 'boolean': return <ToggleLeft className="w-3 h-3" />;
      default: return <Type className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-2">
      {/* Logical Operator for non-first rules */}
      {!isFirst && (
        <div className="flex justify-center">
          <Select 
            value={rule.logicalOperator} 
            onValueChange={(value: 'AND' | 'OR') => onUpdate(rule.id, { logicalOperator: value })}
          >
            <SelectTrigger className="w-20 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">AND</SelectItem>
              <SelectItem value="OR">OR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Main Rule Row */}
      <div className="flex items-center space-x-2 p-3 border rounded-lg bg-white">
        {/* Field Selection */}
        <div className="flex-1 min-w-0">
          <Select value={rule.field} onValueChange={(value) => onUpdate(rule.id, { field: value })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select field..." />
            </SelectTrigger>
            <SelectContent>
              {availableFields.map((field) => (
                <SelectItem key={field.path} value={field.path}>
                  <div className="flex items-center space-x-2">
                    {getFieldTypeIcon(field.type)}
                    <span className="font-mono">{field.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {field.type}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Operator Selection */}
        <div className="flex-1 min-w-0">
          <Select value={rule.operator} onValueChange={(value) => onUpdate(rule.id, { operator: value })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Operator..." />
            </SelectTrigger>
            <SelectContent>
              {getOperatorsForType(fieldType).map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Value Input */}
        <div className="flex-1 min-w-0">
          {renderValueInput()}
        </div>

        {/* Remove Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(rule.id)}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {/* Field Info */}
      {selectedField && (
        <div className="text-xs text-gray-500 pl-3">
          <div className="flex items-center space-x-2">
            {getFieldTypeIcon(selectedField.type)}
            <span className="font-mono">{selectedField.path}</span>
            <Badge variant="outline" className="text-xs">
              {selectedField.type}
            </Badge>
            {selectedField.required && (
              <Badge variant="destructive" className="text-xs">
                required
              </Badge>
            )}
          </div>
          {selectedField.description && (
            <p className="mt-1 text-gray-400">{selectedField.description}</p>
          )}
        </div>
      )}
    </div>
  );
};