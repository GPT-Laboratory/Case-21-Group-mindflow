import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus, Play, Settings2 } from 'lucide-react';
import { LogicRuleBuilder } from './LogicRuleBuilder';

import { dataSchemaManager } from '../../../../Process/DataSchemaManager';
import { SchemaAnalysisCard } from '../../SchemaAnalysisCard';
import { LogicPreview } from './LogicPreview';

interface LogicRule {
  id: string;
  field: string;
  operator: string;
  value: any;
  logicalOperator?: 'AND' | 'OR'; // How this rule connects to the next one
}

interface LogicTabProps {
  nodeId: string;
  formData: Record<string, any>;
  onFieldChange: (fieldKey: string, value: any) => void;
}

export const LogicTab: React.FC<LogicTabProps> = ({ 
  nodeId, 
  formData, 
  onFieldChange 
}) => {
  const [rules, setRules] = useState<LogicRule[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableFields, setAvailableFields] = useState<any[]>([]);
  const [schemaAnalysis, setSchemaAnalysis] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get the current operation type
  const operation = formData.operation || 'filter';

  // Analyze the input schema to get available fields
  useEffect(() => {
    const analyzeSchema = () => {
      const schema = dataSchemaManager.getInputSchema(nodeId);
      console.log('📊 Analyzing schema for LogicTab:', schema);
      
      if (schema) {
        const fields = extractFieldsFromSchema(schema);
        setAvailableFields(fields);
        setSchemaAnalysis({
          totalFields: fields.length,
          fieldTypes: [...new Set(fields.map(f => f.type))],
          hasArrayData: schema.type === 'array',
          itemType: schema.type === 'array' ? schema.items?.type : schema.type
        });
      } else {
        // Fallback: provide some common field examples
        const fallbackFields = [
          { name: 'id', type: 'number', path: 'id' },
          { name: 'title', type: 'string', path: 'title' },
          { name: 'userId', type: 'number', path: 'userId' },
          { name: 'category', type: 'string', path: 'category' },
          { name: 'status', type: 'string', path: 'status' },
        ];
        setAvailableFields(fallbackFields);
        setSchemaAnalysis({
          totalFields: fallbackFields.length,
          fieldTypes: ['string', 'number'],
          hasArrayData: true,
          itemType: 'object',
          isExample: true
        });
      }
    };

    analyzeSchema();

    // Subscribe to schema changes
    const unsubscribe = dataSchemaManager.subscribe((updatedNodeId) => {
      if (updatedNodeId === nodeId) {
        analyzeSchema();
      }
    });

    return unsubscribe;
  }, [nodeId]);

  // Load existing rules from formData only once on mount
  useEffect(() => {
    if (!isInitialized) {
      if (formData.logicRules && Array.isArray(formData.logicRules)) {
        setRules(formData.logicRules);
      } else if (formData.condition && typeof formData.condition === 'string' && availableFields.length > 0) {
        // Try to parse legacy condition into rules
        const parsedRules = parseLegacyCondition(formData.condition);
        setRules(parsedRules);
      }
      setIsInitialized(true);
    }
  }, [formData.logicRules, formData.condition, availableFields, isInitialized]);

  // Memoized function to update parent form data
  const updateFormData = useCallback((newRules: LogicRule[]) => {
    const conditionString = generateConditionString(newRules);
    
    // Use a single batch update to prevent multiple re-renders
    requestAnimationFrame(() => {
      onFieldChange('logicRules', newRules);
      onFieldChange('condition', conditionString);
    });
  }, [onFieldChange]);

  // Update form data when rules change (but only after initialization)
  useEffect(() => {
    if (isInitialized) {
      updateFormData(rules);
    }
  }, [rules, isInitialized, updateFormData]);

  const addRule = useCallback(() => {
    const newRule: LogicRule = {
      id: `rule-${Date.now()}`,
      field: availableFields[0]?.path || 'id',
      operator: '==',
      value: '',
      logicalOperator: rules.length > 0 ? 'AND' : undefined
    };
    setRules(prev => [...prev, newRule]);
  }, [availableFields, rules.length]);

  const updateRule = useCallback((ruleId: string, updates: Partial<LogicRule>) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  }, []);

  const removeRule = useCallback((ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
  }, []);

  const testLogic = async () => {
    setIsProcessing(true);
    try {
      // Simulate testing the logic with sample data
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('🧪 Testing logic with rules:', rules);
    } finally {
      setIsProcessing(false);
    }
  };

  // Memoize the generated condition string for display
  const conditionString = useMemo(() => {
    return generateConditionString(rules) || 'No conditions defined';
  }, [rules]);

  return (
    <div className="space-y-4">
      {/* Schema Analysis */}
      <SchemaAnalysisCard 
        schemaAnalysis={schemaAnalysis}
        availableFields={availableFields}
      />

      {/* Logic Rules Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <Settings2 className="w-4 h-4" />
            <span>{operation.charAt(0).toUpperCase() + operation.slice(1)} Rules</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Build logic visually using available data fields
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Rules List */}
          {rules.length === 0 ? (
            <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              <Settings2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No rules defined</p>
              <p className="text-xs">Add a rule to start building your logic</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule, index) => (
                <LogicRuleBuilder
                  key={rule.id}
                  rule={rule}
                  availableFields={availableFields}
                  isFirst={index === 0}
                  isLast={index === rules.length - 1}
                  onUpdate={updateRule}
                  onRemove={removeRule}
                />
              ))}
            </div>
          )}

          {/* Add Rule Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={addRule}
            className="w-full"
            disabled={availableFields.length === 0}
          >
            <Plus className="w-3 h-3 mr-2" />
            Add Rule
          </Button>

          {/* Logic Preview */}
          {rules.length > 0 && (
            <>
              <Separator />
              <LogicPreview  conditionString={conditionString} />
            </>
          )}

          {/* Test Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={testLogic}
            disabled={isProcessing || rules.length === 0}
            className="w-full"
          >
            <Play className="w-3 h-3 mr-2" />
            {isProcessing ? 'Testing...' : 'Test Logic'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function to extract fields from a JSON schema
function extractFieldsFromSchema(schema: any): any[] {
  const fields: any[] = [];
  
  if (!schema) return fields;

  // Handle array schemas (most common for LogicalNodes)
  if (schema.type === 'array' && schema.items?.properties) {
    const properties = schema.items.properties;
    Object.entries(properties).forEach(([key, prop]: [string, any]) => {
      fields.push({
        name: key,
        type: prop.type || 'string',
        path: key,
        description: prop.description,
        required: schema.items.required?.includes(key) || false
      });
    });
  }
  // Handle object schemas
  else if (schema.type === 'object' && schema.properties) {
    Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
      fields.push({
        name: key,
        type: prop.type || 'string',
        path: key,
        description: prop.description,
        required: schema.required?.includes(key) || false
      });
    });
  }

  return fields;
}

// Helper function to parse legacy condition strings into rules
function parseLegacyCondition(condition: string): LogicRule[] {
  if (!condition) return [];
  
  try {
    // Simple parser for basic conditions like "post.userId <= 5 && post.title.length > 10"
    const rules: LogicRule[] = [];
    
    // Split by && or ||
    const parts = condition.split(/(\s*&&\s*|\s*\|\|\s*)/);
    
    for (let i = 0; i < parts.length; i += 2) {
      const part = parts[i]?.trim();
      if (!part) continue;
      
      const logicalOp = parts[i + 1]?.trim();
      
      // Try to parse "field operator value"
      const match = part.match(/(\w+(?:\.\w+)*)\s*(<=|>=|<|>|==|!=)\s*(.+)/);
      if (match) {
        const [, fieldPath, operator, value] = match;
        
        // Find the field metadata from available fields
        
        rules.push({
          id: `rule-${i / 2}`,
          field: fieldPath,
          operator,
          value: value.replace(/['"]/g, ''), // Remove quotes
          logicalOperator: logicalOp?.includes('&&') ? 'AND' : logicalOp?.includes('||') ? 'OR' : undefined
        });
      }
    }
    
    return rules;
  } catch (error) {
    console.warn('Failed to parse legacy condition:', error);
    return [];
  }
}

// Helper function to generate condition string from rules
function generateConditionString(rules: LogicRule[]): string {
  if (rules.length === 0) return '';
  
  return rules.map((rule, index) => {
    const { field, operator, value } = rule;
    let condition = '';
    
    // Handle different value types
    if (typeof value === 'string' && !value.match(/^\d+$/)) {
      condition = `${field} ${operator} "${value}"`;
    } else {
      condition = `${field} ${operator} ${value}`;
    }
    
    // Add logical operator for connecting to next rule
    // Look at the NEXT rule's logical operator (not the current one)
    if (index < rules.length - 1) {
      const nextRule = rules[index + 1];
      if (nextRule.logicalOperator) {
        condition += ` ${nextRule.logicalOperator === 'AND' ? '&&' : '||'} `;
      }
    }
    
    return condition;
  }).join('');
}