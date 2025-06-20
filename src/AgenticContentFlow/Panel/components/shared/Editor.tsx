import React, { useState, useRef } from 'react';
import { Save, RotateCcw, Edit3 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { ActionButtonGroup, ValidationResult } from './index';

interface EditorProps {
  // Core props
  value: string;
  onChange: (value: string) => void;
  language: 'javascript' | 'json' | 'typescript' | 'html' | 'css';
  
  // UI props
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  
  // State props
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  validationResult?: any;
  isSaving?: boolean;
  hasCustomContent?: boolean;
  
  // Action props
  onSave: () => void;
  onReset?: () => void;
  
  // Optional props
  readOnly?: boolean;
  showThemeToggle?: boolean;
  showFormatButton?: boolean;
  height?: string;
  schema?: any;
  beforeMount?: (monaco: any) => void;
  onMount?: (editor: any, monaco: any) => void;
}

export const SharedEditor: React.FC<EditorProps> = ({
  value,
  onChange,
  language,
  title,
  description,
  icon: Icon,
  isEditing,
  setIsEditing,
  validationResult,
  isSaving = false,
  hasCustomContent = false,
  onSave,
  onReset,
  readOnly = false,
  showThemeToggle = true,
  showFormatButton = true,
  height = 'calc(100vh - 200px)',
  schema,
  beforeMount,
  onMount
}) => {
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

  const handleMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    if (isEditing && !readOnly) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        onSave();
      });
    }
    
    if (onMount) {
      onMount(editor, monaco);
    }
  };

  const handleBeforeMount = (monaco: any) => {
    // Add JSON schema if provided
    if (schema && language === 'json') {
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [{
          uri: 'http://myschema/custom',
          fileMatch: ['*'],
          schema: schema
        }]
      });
    }
    
    if (beforeMount) {
      beforeMount(monaco);
    }
  };

  const actionButtons = [];
  
  if (!isEditing) {
    actionButtons.push({
      icon: Edit3,
      text: 'Edit',
      onClick: () => setIsEditing(true),
      variant: 'default' as const
    });
  } else {
    if (onReset) {
      actionButtons.push({
        icon: RotateCcw,
        text: 'Reset',
        onClick: onReset,
        disabled: !hasCustomContent,
        variant: 'outline' as const
      });
    }
    
    actionButtons.push({
      icon: Save,
      text: isSaving ? 'Saving...' : 'Save',
      onClick: onSave,
      disabled: !validationResult?.isValid || isSaving,
      loading: isSaving,
      variant: 'default' as const
    });
  }

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {showThemeToggle && (
            <button
              onClick={() => setEditorTheme(editorTheme === 'vs-light' ? 'vs-dark' : 'vs-light')}
              className="text-xs px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              {editorTheme === 'vs-light' ? '🌙 Dark' : '☀️ Light'}
            </button>
          )}
          {isEditing && showFormatButton && (
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
        
        <ActionButtonGroup buttons={actionButtons} />
      </div>

      {/* Editor */}
      <div className="border rounded overflow-hidden" style={{ height }}>
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={(newValue) => onChange(newValue || '')}
          options={{
            ...editorOptions,
            readOnly: !isEditing || readOnly,
            theme: editorTheme,
            contextmenu: isEditing && !readOnly,
            quickSuggestions: isEditing && !readOnly
          }}
          theme={editorTheme}
          onMount={handleMount}
          beforeMount={handleBeforeMount}
        />
      </div>

      {/* Validation Results */}
      {isEditing && validationResult && (
        <div className="mt-3">
          <ValidationResult
            isValid={validationResult.isValid}
            errors={validationResult.errors}
            warnings={validationResult.warnings}
            successMessage="Validation passed"
          />
        </div>
      )}
    </div>
  );
}; 