import React, { useState, useEffect, useRef } from 'react';
import { Code2, Save, RotateCcw, Edit3 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { 
  TabContainer, 
  ActionButtonGroup,
  ValidationResult,
  InfoCard,
  Badge
} from '../../shared';
import { ProcessCodeValidator } from '@/AgenticContentFlow/Generator/core/validation/ProcessValidator';

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
  // Core state
  const [factoryConfig, setFactoryConfig] = useState<any>(null);
  
  // Code editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isSaving, setSisSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [editorTheme, setEditorTheme] = useState<'vs-light' | 'vs-dark'>('vs-light');
  
  const editorRef = useRef<any>(null);

  // Monaco Editor configuration
  const editorOptions = {
    fontSize: 14,
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
        const { getNodeType } = await import('@/AgenticContentFlow/Node/store/unifiedNodeTypeStoreInitializer');
        const config = getNodeType(nodeType);
        setFactoryConfig(config);
        
        // Initialize with instance code if available, otherwise fall back to template code
        const instanceCode = formData.instanceCode;
        const templateCode = config?.process?.templateCode || config?.process?.code || '';
        const currentCode = instanceCode || templateCode;
        setEditedCode(currentCode);
      } catch (error) {
        console.warn('Could not load factory configuration:', error);
      }
    };

    loadFactoryConfig();
  }, [nodeType, formData.instanceCode, formData.templateData, formData.instanceData]);

  // Validate code
  const validateCode = async () => {
    if (!editedCode.trim()) {
      setValidationResult({ isValid: false, errors: ['Code cannot be empty'], warnings: [] });
      return;
    }

    setIsValidating(true);
    try {
      const validator = new ProcessCodeValidator();
      const result = validator.validateCode(editedCode);
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
      await validateCode();
      
      if (validationResult?.isValid) {
        onFieldChange('instanceCode', editedCode);
        onFieldChange('instanceCodeMetadata', {
          modifiedBy: 'user',
          modifiedAt: new Date().toISOString(),
          originalVersion: factoryConfig?.process?.metadata?.version || '1.0.0',
          generatedFrom: 'manual-edit'
        });
        
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to save code:', error);
    } finally {
      setSisSaving(false);
    }
  };

  // Reset to template code
  const resetToDefault = () => {
    const templateCode = factoryConfig?.process?.templateCode || factoryConfig?.process?.code || '';
    setEditedCode(templateCode);
    setValidationResult(null);
    
    // Remove instance code to fall back to template
    onFieldChange('instanceCode', undefined);
    onFieldChange('instanceCodeMetadata', undefined);
  };

  // Auto-validate when code changes
  useEffect(() => {
    if (editedCode && isEditing) {
      const timeoutId = setTimeout(validateCode, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [editedCode, isEditing]);

  if (!factoryConfig) {
    return (
      <TabContainer
        title="Code Editor"
        description="Loading code configuration..."
        icon={Code2}
      >
        <div className="text-center text-gray-500 py-8">
          <Code2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Loading code configuration...</p>
        </div>
      </TabContainer>
    );
  }

  const currentCode = formData.instanceCode || factoryConfig.process?.templateCode || factoryConfig.process?.code || '';
  const isCustomCode = !!formData.instanceCode;

  const badges = [
    <Badge key="type" variant="outline" className="text-xs">{nodeType}</Badge>
  ];
  if (isCustomCode) {
    badges.push(<Badge key="modified" variant="secondary" className="text-xs">Custom Code</Badge>);
  } else {
    badges.push(<Badge key="template" variant="outline" className="text-xs">Template Code</Badge>);
  }

  return (
    <TabContainer
      title="Code Editor"
      description="Edit the JavaScript process function for this node"
      icon={Code2}
      badges={badges}
    >
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setEditorTheme(editorTheme === 'vs-light' ? 'vs-dark' : 'vs-light')}
            className="text-xs px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            {editorTheme === 'vs-light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          {isEditing && (
            <button
              onClick={() => {
                if (editorRef.current) {
                  editorRef.current.getAction('editor.action.formatDocument').run();
                }
              }}
              className="text-xs px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              ✨ Format
            </button>
          )}
          <div className="text-xs text-gray-500">
            {isEditing ? 'Editing • Ctrl+S to save' : 'Read-only view'}
          </div>
        </div>
        
        <ActionButtonGroup
          buttons={
            !isEditing ? [
              {
                icon: Edit3,
                text: 'Edit Code',
                onClick: () => setIsEditing(true),
                variant: 'default'
              }
            ] : [
              {
                icon: RotateCcw,
                text: 'Reset to Template',
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
            ]
          }
        />
      </div>

      {/* Code Editor - Full Height */}
      <div className="border rounded overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <Editor
          height="100%"
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
              editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                saveCodeChanges();
              });
            }
          }}
          beforeMount={(monaco) => {
            monaco.languages.typescript.javascriptDefaults.addExtraLib(`
              /**
               * Process function executed by factory nodes
               * @param {any} incomingData - Data from upstream nodes
               * @param {object} nodeData - Static configuration for this node instance
               * @param {object} params - Dynamic parameters that can be configured per instance
               * @param {Map} targetMap - Map of downstream target nodes
               * @param {Map} sourceMap - Map of upstream source nodes
               * @param {Map} edgeMap - Map of edge configurations
               * @returns {Promise<any>} Processed result data
               */
              declare function process(incomingData: any, nodeData: object, params: object, targetMap?: Map<string, any>, sourceMap?: Map<string, any>, edgeMap?: Map<string, any>): Promise<any>;
              
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

      {/* Validation Results - Compact */}
      {isEditing && validationResult && (
        <div className="mt-3">
          <ValidationResult
            isValid={validationResult.isValid}
            errors={validationResult.errors}
            warnings={validationResult.warnings}
            successMessage="Code validation passed"
          />
        </div>
      )}

      {/* Loading state */}
      {isValidating && (
        <div className="text-xs text-gray-500 text-center py-2">
          Validating code...
        </div>
      )}

      {/* Custom Code Info - Compact */}
      {isCustomCode && formData.instanceCodeMetadata && (
        <div className="mt-3">
          <InfoCard
            title="Custom Code Active"
            type="info"
            content={`Modified: ${new Date(formData.instanceCodeMetadata.modifiedAt).toLocaleString()}`}
          />
        </div>
      )}
    </TabContainer>
  );
};