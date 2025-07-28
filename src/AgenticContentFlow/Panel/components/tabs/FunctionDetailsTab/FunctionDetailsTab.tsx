import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, FileText, Link, Layers } from 'lucide-react';

interface FunctionDetailsTabProps {
  nodeId: string;
  formData: any;
}

export const FunctionDetailsTab: React.FC<FunctionDetailsTabProps> = ({
  formData
}) => {
  const {
    functionName,
    functionDescription,
    parameters = [],
    sourceLocation,
    isNested,
    parentFunction,
    externalDependencies = [],
    childNodes = [],
  } = formData;

  const getComplexityBadge = () => {
    const connectionCount = (externalDependencies.length || 0) + (childNodes.length || 0);
    const isComplex = connectionCount > 3;
    
    return (
      <Badge variant={isComplex ? "destructive" : "secondary"} className="text-xs">
        {isComplex ? 'Complex' : 'Simple'} ({connectionCount} connections)
      </Badge>
    );
  };

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      {/* Function Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Code className="h-4 w-4" />
            Function Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <div className="text-sm font-mono bg-muted p-2 rounded mt-1">
              {functionName || 'Unnamed Function'}
            </div>
          </div>

          {functionDescription && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <div className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {functionDescription}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {getComplexityBadge()}
            {isNested && (
              <Badge variant="outline" className="text-xs">
                <Layers className="h-3 w-3 mr-1" />
                Nested
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Parameters */}
      {parameters.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Parameters ({parameters.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {parameters.map((param: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono">{param.name}</code>
                    {param.type && (
                      <Badge variant="outline" className="text-xs">
                        {param.type}
                      </Badge>
                    )}
                  </div>
                  {param.defaultValue && (
                    <code className="text-xs text-muted-foreground">
                      = {param.defaultValue}
                    </code>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* External Dependencies */}
      {externalDependencies.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Link className="h-4 w-4" />
              External Dependencies ({externalDependencies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {externalDependencies.map((dep: string, index: number) => (
                <div key={index} className="text-sm font-mono bg-muted p-2 rounded">
                  {dep}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Child Functions (for nested functions) */}
      {childNodes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Child Functions ({childNodes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {childNodes.map((child: any, index: number) => (
                <div key={index} className="p-2 bg-muted rounded">
                  <div className="text-sm font-medium">
                    {child.functionName || child.label || 'Unnamed'}
                  </div>
                  {child.functionDescription && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {child.functionDescription}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source Location */}
      {sourceLocation && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Source Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono bg-muted p-2 rounded">
              Line {sourceLocation.line}, Column {sourceLocation.column}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parent Function (for nested functions) */}
      {parentFunction && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Parent Function</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono bg-muted p-2 rounded">
              {parentFunction}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};