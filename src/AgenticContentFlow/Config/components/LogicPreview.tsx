import React from 'react';

interface LogicPreviewProps {
  conditionString: string;
}

export const LogicPreview: React.FC<LogicPreviewProps> = ({ conditionString }) => {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-700">Generated Logic:</h4>
      <div className="bg-gray-50 border rounded p-2 font-mono text-xs">
        {conditionString}
      </div>
    </div>
  );
};