import React from 'react';
import { Play, RefreshCw } from 'lucide-react';
import { FormField } from './FormField';
import { Section, ActionButton, AlertBox } from './index';

interface ProcessControlsProps {
  useTestData: boolean;
  generatedTestData?: any;
  isProcessing: boolean;
  processResult?: any;
  onToggleTestData: (value: boolean) => void;
  onRunProcess: () => void;
}

export const ProcessControls: React.FC<ProcessControlsProps> = ({
  useTestData,
  generatedTestData,
  isProcessing,
  processResult,
  onToggleTestData,
  onRunProcess
}) => {
  return (
    <Section title="Process Controls">
      <FormField
        fieldKey="useTestData"
        config={{
          fieldType: 'boolean',
          label: 'Use Test Data',
          defaultValue: false,
          description: 'Enable automatic test data generation for this node'
        }}
        value={useTestData}
        onChange={onToggleTestData}
      />

      {useTestData && generatedTestData && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">Auto-Generated Test Data:</label>
          <div className="border rounded p-2 bg-gray-50 max-h-32 overflow-y-auto">
            <pre className="text-xs">{JSON.stringify(generatedTestData, null, 2)}</pre>
          </div>
        </div>
      )}

      <ActionButton
        icon={isProcessing ? RefreshCw : Play}
        text={isProcessing ? 'Processing...' : 'Run Process'}
        onClick={onRunProcess}
        disabled={isProcessing}
        loading={isProcessing}
        className="w-full"
      />

      {processResult && (
        <AlertBox
          type={processResult.success ? 'success' : 'error'}
          title={processResult.success ? '✓ Process completed successfully' : '✗ Process failed'}
          message={processResult.success ? (
            <div className="space-y-1">
              <div>Generated {processResult.dataGenerated} test data items</div>
              <div className="text-gray-600">Type: {processResult.type}</div>
              <div className="text-gray-600">Time: {new Date(processResult.timestamp).toLocaleTimeString()}</div>
            </div>
          ) : (
            processResult.error
          )}
        />
      )}
    </Section>
  );
};