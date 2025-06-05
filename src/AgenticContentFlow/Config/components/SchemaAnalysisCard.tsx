import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';

interface SchemaAnalysisCardProps {
  schemaAnalysis: any;
  availableFields: any[];
}

export const SchemaAnalysisCard: React.FC<SchemaAnalysisCardProps> = ({
  schemaAnalysis,
  availableFields
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center space-x-2">
          <Brain className="w-4 h-4" />
          <span>Data Schema Analysis</span>
        </CardTitle>
        <CardDescription className="text-xs">
          Available fields from connected nodes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {schemaAnalysis ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                {schemaAnalysis.totalFields} fields
              </Badge>
              <Badge variant="outline" className="text-xs">
                {schemaAnalysis.hasArrayData ? 'Array' : 'Object'} data
              </Badge>
              {schemaAnalysis.fieldTypes.map((type: string) => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {type}
                </Badge>
              ))}
              {schemaAnalysis.isExample && (
                <Badge variant="destructive" className="text-xs">
                  Example Data
                </Badge>
              )}
            </div>

            {availableFields.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-xs font-medium text-gray-700">Available Fields:</h4>
                <div className="flex flex-wrap gap-1">
                  {availableFields.slice(0, 8).map((field) => (
                    <Badge key={field.path} variant="outline" className="text-xs font-mono">
                      {field.name}
                      <span className="ml-1 text-gray-500">({field.type})</span>
                    </Badge>
                  ))}
                  {availableFields.length > 8 && (
                    <Badge variant="outline" className="text-xs">
                      +{availableFields.length - 8} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">No schema available</p>
            <p className="text-xs">Connect to a data source to analyze fields</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};