import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Code2, Save, RotateCcw, AlertTriangle, CheckCircle, Eye, Edit3, Wand2, Settings } from 'lucide-react';
import { factoryNodeRegistration } from '../../../../Node/factory/FactoryNodeRegistration';
import Editor from '@monaco-editor/react';

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
      const { CodeValidator } = await import('../../../../Node/factory/process/ProcessContextManager');
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
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Code2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No process code configuration found for this node type</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentCode = formData.processOverrides?.customCode || factoryConfig.process.code;
  const isCustomCode = !!formData.processOverrides?.customCode;
  const metadata = factoryConfig.process.metadata;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center space-x-2">
          <Code2 className="w-4 h-4" />
          <span>Process Code Editor</span>
          <Badge variant="outline" className="text-xs">{nodeType}</Badge>
          {isCustomCode && <Badge variant="secondary" className="text-xs">Modified</Badge>}
        </CardTitle>
        <CardDescription className="text-xs">
          View and edit the JavaScript process function executed by this node
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Process Metadata */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2 bg-gray-50 rounded">
            <span className="font-medium">Version:</span> {metadata.version}
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <span className="font-medium">Generated By:</span> {metadata.generatedBy}
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <span className="font-medium">Last Updated:</span> {new Date(metadata.lastUpdated).toLocaleDateString()}
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <span className="font-medium">Context:</span> {metadata.executionContext}
          </div>
        </div>

        {/* Function Signature */}
        <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border">
          <span className="font-medium">Function Signature:</span> {metadata.signature || 'async function process(incomingData, nodeData, params)'}
        </div>

        <Separator />

        {/* Code Editor */}
        <div className="space-y-3">
          {/* Editor Controls */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditorTheme(editorTheme === 'vs-light' ? 'vs-dark' : 'vs-light')}
              >
                <Settings className="w-3 h-3 mr-1" />
                {editorTheme === 'vs-light' ? 'Dark' : 'Light'} Theme
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (editorRef.current) {
                    editorRef.current.getAction('editor.action.formatDocument').run();
                  }
                }}
                disabled={!isEditing}
              >
                Format Code
              </Button>
            </div>
            <div className="text-xs text-gray-500">
              {isEditing ? 'Monaco Editor • Ctrl+Space for suggestions' : 'Read-only view'}
            </div>
          </div>

          {/* Code Display/Editor */}
          {isEditing ? (
            <div className="border rounded overflow-hidden">
              <Editor
                height="400px"
                language="javascript"
                value={editedCode}
                onChange={(value) => setEditedCode(value || '')}
                options={{
                  ...editorOptions,
                  readOnly: false,
                  theme: editorTheme
                }}
                theme={editorTheme}
                onMount={(editor, monaco) => {
                  editorRef.current = editor;
                  
                  // Add custom JavaScript snippets and auto-completion
                  editor.onDidChangeModelContent(() => {
                    // Auto-validate on change (debounced via useEffect)
                  });
                  
                  // Add keyboard shortcuts
                  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                    saveCodeChanges();
                  });
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
          ) : (
            <div className="border rounded overflow-hidden">
              <Editor
                height="400px"
                language="javascript"
                value={currentCode}
                options={{
                  ...editorOptions,
                  readOnly: true,
                  theme: editorTheme,
                  contextmenu: false,
                  quickSuggestions: false
                }}
                theme={editorTheme}
              />
            </div>
          )}

          {/* Validation Results */}
          {isEditing && validationResult && (
            <div className="space-y-2">
              {validationResult.isValid ? (
                <div className="border border-green-200 bg-green-50 p-3 rounded flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-green-800 text-xs">
                    Code validation passed successfully
                  </div>
                </div>
              ) : (
                <div className="border border-red-200 bg-red-50 p-3 rounded flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-red-800 text-xs">
                    <div className="space-y-1">
                      <p className="font-medium">Validation Errors:</p>
                      {validationResult.errors.map((error: string, index: number) => (
                        <p key={index}>• {error}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {validationResult.warnings && validationResult.warnings.length > 0 && (
                <div className="border border-yellow-200 bg-yellow-50 p-3 rounded flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-yellow-800 text-xs">
                    <div className="space-y-1">
                      <p className="font-medium">Warnings:</p>
                      {validationResult.warnings.map((warning: string, index: number) => (
                        <p key={index}>• {warning}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading state */}
          {isValidating && (
            <div className="text-xs text-gray-500 text-center py-2">
              Validating code...
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Process Function Code</h4>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit3 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => {
                    setIsEditing(false);
                    setEditedCode(currentCode);
                    setValidationResult(null);
                  }}>
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={resetToDefault}
                    disabled={!isCustomCode}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={saveCodeChanges} 
                    disabled={!validationResult?.isValid || isSaving}
                  >
                    <Save className="w-3 h-3 mr-1" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Future AI Integration Placeholder */}
        <div className="text-xs text-gray-500 bg-purple-50 p-3 rounded border border-purple-200">
          <div className="flex items-center space-x-2 mb-1">
            <Wand2 className="w-4 h-4 text-purple-600" />
            <span className="font-medium text-purple-700">AI Code Generation (Coming Soon)</span>
          </div>
          <p>Future versions will allow AI-powered code regeneration based on node description and requirements.</p>
        </div>

        {/* Custom Code Info */}
        {isCustomCode && formData.processOverrides?.customCodeMetadata && (
          <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded border">
            <p className="font-medium">Custom Code Information:</p>
            <p>Modified: {new Date(formData.processOverrides.customCodeMetadata.modifiedAt).toLocaleString()}</p>
            <p>Original Version: {formData.processOverrides.customCodeMetadata.originalVersion}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};