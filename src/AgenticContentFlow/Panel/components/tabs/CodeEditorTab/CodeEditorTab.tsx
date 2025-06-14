import React, { useState, useEffect, useRef } from 'react';
import { Code2, Save, RotateCcw, Eye, Edit3, Settings } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { 
  TabContainer, 
  ActionButtonGroup,
  ValidationResult,
  MetadataGrid, 
  Section,
  InfoCard,
  Badge,
  Separator 
} from '../../shared';
import { factoryNodeRegistration } from '@/AgenticContentFlow/Node/factories/factory/FactoryNodeRegistration';
import { CodeValidator } from '@/AgenticContentFlow/Node/factories/factory/process/ProcessContextManager';

interface CodeEditorTabProps {
  nodeType: string;
  formData: Record<string, any>;
  onFieldChange: (fieldKey: string, value: any) => void;
}

export const CodeEditorTab: React.FC<CodeEditorTabProps> = ({ 
  nodeType, 
  formData, 
  onFieldChange 
}) => {
  const [factoryConfig, setFactoryConfig] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isSaving, setSisSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [editorTheme, setEditorTheme] = useState<'vs-light' | 'vs-dark'>('vs-light');
  const editorRef = useRef<any>(null);

  // Monaco Editor configuration
  const editorOptions = {
    fontSize: 12,
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    wordWrap: 'on' as const,
    lineNumbers: 'on' as const,
    folding: true,
    bracketMatching: 'always' as const,
    autoIndent: 'full' as const,
    formatOnPaste: true,
    formatOnType: true,
    tabSize: 2,
    insertSpaces: true,
    detectIndentation: false,
    renderWhitespace: 'selection' as const,
    renderControlCharacters: false,
    renderIndentGuides: true,
    renderLineHighlight: 'all' as const,
    contextmenu: true,
    mouseWheelZoom: true,
    quickSuggestions: true,
    parameterHints: { enabled: true },
    suggest: {
      showMethods: true,
      showFunctions: true,
      showConstructors: true,
      showFields: true,
      showVariables: true,
      showClasses: true,
      showStructs: true,
      showInterfaces: true,
      showModules: true,
      showProperties: true,
      showEvents: true,
      showOperators: true,
      showUnits: true,
      showValues: true,
      showConstants: true,
      showEnums: true,
      showEnumMembers: true,
      showKeywords: true,
      showWords: true,
      showColors: true,
      showFiles: true,
      showReferences: true,
      showFolders: true,
      showTypeParameters: true,
      showSnippets: true,
    }
  };

  // Load factory configuration
  useEffect(() => {
    const loadFactoryConfig = async () => {
      try {
        const configLoader = factoryNodeRegistration.getConfigurationLoader();
        const config = configLoader.getConfiguration(nodeType);
        setFactoryConfig(config);
        
        // Initialize with current process code (could be custom override or default)
        const currentCode = formData.processOverrides?.customCode || config?.process?.code || '';
        setEditedCode(currentCode);
      } catch (error) {
        console.warn('Could not load factory configuration:', error);
      }
    };

    loadFactoryConfig();
  }, [nodeType, formData.processOverrides?.customCode]);

  // Validate code
  const validateCode = async () => {
    if (!editedCode.trim()) {
      setValidationResult({ isValid: false, errors: ['Code cannot be empty'], warnings: [] });
      return;
    }

    setIsValidating(true);
    try {
      // Import the CodeValidator dynamically
      const validator = new CodeValidator();
      const result = validator.validateProcessCode(editedCode);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({ 
        isValid: false, 
        errors: [`Validation failed: ${error}`], 
        warnings: [] 
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Save code changes
  const saveCodeChanges = async () => {
    setSisSaving(true);
    try {
      // Validate first
      await validateCode();
      
      if (validationResult?.isValid) {
        // Save as custom code override
        const processOverrides = {
          ...formData.processOverrides,
          customCode: editedCode,
          // Update metadata
          customCodeMetadata: {
            modifiedBy: 'user',
            modifiedAt: new Date().toISOString(),
            originalVersion: factoryConfig?.process?.metadata?.version || '1.0.0'
          }
        };
        
        onFieldChange('processOverrides', processOverrides);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to save code:', error);
    } finally {
      setSisSaving(false);
    }
  };

  // Reset to default code
  const resetToDefault = () => {
    const defaultCode = factoryConfig?.process?.code || '';
    setEditedCode(defaultCode);
    setValidationResult(null);
    
    // Remove custom code override
    const processOverrides = { ...formData.processOverrides };
    delete processOverrides.customCode;
    delete processOverrides.customCodeMetadata;
    onFieldChange('processOverrides', processOverrides);
  };

  // Auto-validate when code changes
  useEffect(() => {
    if (editedCode && isEditing) {
      const timeoutId = setTimeout(validateCode, 1000); // Debounce validation
      return () => clearTimeout(timeoutId);
    }
  }, [editedCode, isEditing]);

  if (!factoryConfig) {
    return (
      <TabContainer
        title="Process Code Editor"
        description="No process code configuration found for this node type"
        icon={Code2}
      >
        <div className="text-center text-gray-500 py-8">
          <Code2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No process code configuration found for this node type</p>
        </div>
      </TabContainer>
    );
  }

  const currentCode = formData.processOverrides?.customCode || factoryConfig.process.code;
  const isCustomCode = !!formData.processOverrides?.customCode;
  const metadata = factoryConfig.process.metadata;

  const badges = [
    <Badge key="type" variant="outline" className="text-xs">{nodeType}</Badge>
  ];
  if (isCustomCode) {
    badges.push(<Badge key="modified" variant="secondary" className="text-xs">Modified</Badge>);
  }

  return (
    <TabContainer
      title="Process Code Editor"
      description="View and edit the JavaScript process function executed by this node"
      icon={Code2}
      badges={badges}
    >
      {/* Process Metadata */}
      <Section title="Process Information">
        <MetadataGrid
          items={[
            { label: 'Version', value: metadata.version },
            { label: 'Generated By', value: metadata.generatedBy },
            { label: 'Last Updated', value: new Date(metadata.lastUpdated).toLocaleDateString() },
            { label: 'Context', value: metadata.executionContext }
          ]}
          columns={2}
        />
        
        <InfoCard
          title="Function Signature"
          type="info"
          content={metadata.signature || 'async function process(incomingData, nodeData, params)'}
        />
      </Section>

      <Separator />

      {/* Code Editor Section */}
      <Section 
        title="Process Function Code"
        actions={
          <ActionButtonGroup
            buttons={!isEditing ? [
              {
                icon: Edit3,
                text: 'Edit',
                onClick: () => setIsEditing(true),
                variant: 'outline'
              }
            ] : [
              {
                icon: Eye,
                text: 'View',
                onClick: () => {
                  setIsEditing(false);
                  setEditedCode(currentCode);
                  setValidationResult(null);
                },
                variant: 'outline'
              },
              {
                icon: RotateCcw,
                text: 'Reset',
                onClick: resetToDefault,
                disabled: !isCustomCode,
                variant: 'outline'
              },
              {
                icon: Save,
                text: isSaving ? 'Saving...' : 'Save',
                onClick: saveCodeChanges,
                disabled: !validationResult?.isValid || isSaving,
                loading: isSaving,
                variant: 'default'
              }
            ]}
          />
        }
      >
        {/* Editor Controls */}
        <div className="flex items-center justify-between mb-2">
          <ActionButtonGroup
            buttons={[
              {
                icon: Settings,
                text: `${editorTheme === 'vs-light' ? 'Dark' : 'Light'} Theme`,
                onClick: () => setEditorTheme(editorTheme === 'vs-light' ? 'vs-dark' : 'vs-light'),
                variant: 'outline',
                size: 'sm'
              },
              {
                icon: Settings,
                text: 'Format Code',
                onClick: () => {
                  if (editorRef.current) {
                    editorRef.current.getAction('editor.action.formatDocument').run();
                  }
                },
                disabled: !isEditing,
                variant: 'outline',
                size: 'sm'
              }
            ]}
          />
          <div className="text-xs text-gray-500">
            {isEditing ? 'Monaco Editor • Ctrl+Space for suggestions' : 'Read-only view'}
          </div>
        </div>

        {/* Code Display/Editor */}
        <div className="border rounded overflow-hidden">
          <Editor
            height="400px"
            language="javascript"
            value={isEditing ? editedCode : currentCode}
            onChange={(value) => isEditing && setEditedCode(value || '')}
            options={{
              ...editorOptions,
              readOnly: !isEditing,
              theme: editorTheme,
              contextmenu: isEditing,
              quickSuggestions: isEditing
            }}
            theme={editorTheme}
            onMount={(editor, monaco) => {
              editorRef.current = editor;
              
              if (isEditing) {
                // Add keyboard shortcuts
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                  saveCodeChanges();
                });
              }
            }}
            beforeMount={(monaco) => {
              // Add process function type definitions for better IntelliSense
              monaco.languages.typescript.javascriptDefaults.addExtraLib(`
                /**
                 * Process function executed by factory nodes
                 * @param {any} incomingData - Data from upstream nodes
                 * @param {object} nodeData - Static configuration for this node instance
                 * @param {object} params - Dynamic parameters that can be configured per instance
                 * @returns {Promise<any>} Processed result data
                 */
                declare function process(incomingData: any, nodeData: object, params: object): Promise<any>;
                
                // Common utilities available in process context
                declare const fetch: typeof globalThis.fetch;
                declare const console: typeof globalThis.console;
                declare const JSON: typeof globalThis.JSON;
                declare const Promise: typeof globalThis.Promise;
                declare const Error: typeof globalThis.Error;
              `, 'ts:process-types.d.ts');
            }}
          />
        </div>

        {/* Validation Results */}
        {isEditing && validationResult && (
          <ValidationResult
            isValid={validationResult.isValid}
            errors={validationResult.errors}
            warnings={validationResult.warnings}
            successMessage="Code validation passed successfully"
          />
        )}

        {/* Loading state */}
        {isValidating && (
          <div className="text-xs text-gray-500 text-center py-2">
            Validating code...
          </div>
        )}
      </Section>

      <Separator />

      {/* Future AI Integration */}
      <InfoCard
        title="AI Code Generation (Coming Soon)"
        type="info"
        content="Future versions will allow AI-powered code regeneration based on node description and requirements."
      />

      {/* Custom Code Info */}
      {isCustomCode && formData.processOverrides?.customCodeMetadata && (
        <InfoCard
          title="Custom Code Information"
          type="success"
          content={
            <div className="space-y-1">
              <div>Modified: {new Date(formData.processOverrides.customCodeMetadata.modifiedAt).toLocaleString()}</div>
              <div>Original Version: {formData.processOverrides.customCodeMetadata.originalVersion}</div>
            </div>
          }
        />
      )}
    </TabContainer>
  );
};