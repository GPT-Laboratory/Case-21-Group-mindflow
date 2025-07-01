import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';

interface EditorProps {
  // Core props
  value: string;
  onChange: (value: string) => void;
  language: 'javascript' | 'json' | 'typescript' | 'html' | 'css';
  
  // Optional props
  height?: string;
  schema?: any;
  beforeMount?: (monaco: any) => void;
  onMount?: (editor: any, monaco: any) => void;
}

export const SharedEditor: React.FC<EditorProps> = ({
  value,
  onChange,
  language,
  height = '100%',
  schema,
  beforeMount,
  onMount
}) => {
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
    lineNumbersMinChars: 3, // Reduce minimum characters for line numbers
    lineDecorationsWidth: 3, // Reduce line decorations width
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

  return (
    <div className="h-full">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(newValue) => onChange(newValue || '')}
        options={editorOptions}
        onMount={handleMount}
        beforeMount={handleBeforeMount}
      />
    </div>
  );
}; 