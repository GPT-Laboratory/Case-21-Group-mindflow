/** @format */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CodeEntry {
  filePath: string;
  sourceCode: string;
  lastModified: number;
}

export interface FunctionCodeInfo {
  filePath: string;
  functionName: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
}

interface CodeStore {
  // Store the full source code for each file
  sourceFiles: Map<string, CodeEntry>;
  
  // Store function location metadata
  functionLocations: Map<string, FunctionCodeInfo>;
  
  // Actions
  setSourceCode: (filePath: string, sourceCode: string) => void;
  getSourceCode: (filePath: string) => string | undefined;
  setFunctionLocation: (functionId: string, location: FunctionCodeInfo) => void;
  getFunctionCode: (functionId: string) => string | undefined;
  removeSourceCode: (filePath: string) => void;
  removeFunctionLocation: (functionId: string) => void;
  removeFlowNodeCode: (nodeId: string, filePath?: string) => void;
  updateFunctionCode: (functionId: string, newFunctionCode: string) => boolean;
  clearAll: () => void;
}

export const useCodeStore = create<CodeStore>()(
  persist(
    (set, get) => ({
      sourceFiles: new Map(),
      functionLocations: new Map(),
  
  setSourceCode: (filePath: string, sourceCode: string) => {
    set((state) => {
      const newSourceFiles = new Map(state.sourceFiles);
      newSourceFiles.set(filePath, {
        filePath,
        sourceCode,
        lastModified: Date.now()
      });
      return { sourceFiles: newSourceFiles };
    });
  },
  
  getSourceCode: (filePath: string) => {
    const entry = get().sourceFiles.get(filePath);
    return entry?.sourceCode;
  },
  
  setFunctionLocation: (functionId: string, location: FunctionCodeInfo) => {
    set((state) => {
      const newFunctionLocations = new Map(state.functionLocations);
      newFunctionLocations.set(functionId, location);
      return { functionLocations: newFunctionLocations };
    });
  },
  
  getFunctionCode: (functionId: string) => {
    const state = get();
    const location = state.functionLocations.get(functionId);
    if (!location) return undefined;
    
    const sourceEntry = state.sourceFiles.get(location.filePath);
    if (!sourceEntry) return undefined;
    
    const lines = sourceEntry.sourceCode.split('\n');
    const startLine = location.startLine - 1; // Convert to 0-based
    const endLine = location.endLine - 1;
    
    if (startLine === endLine) {
      // Single line function
      return lines[startLine]?.substring(location.startColumn, location.endColumn);
    } else {
      // Multi-line function
      const functionLines: string[] = [];
      
      // First line (from start column to end)
      if (lines[startLine]) {
        functionLines.push(lines[startLine].substring(location.startColumn));
      }
      
      // Middle lines (complete lines)
      for (let i = startLine + 1; i < endLine; i++) {
        if (lines[i] !== undefined) {
          functionLines.push(lines[i]);
        }
      }
      
      // Last line (from start to end column)
      if (lines[endLine]) {
        functionLines.push(lines[endLine].substring(0, location.endColumn));
      }
      
      return functionLines.join('\n');
    }
  },
  
  removeSourceCode: (filePath: string) => {
    set((state) => {
      const newSourceFiles = new Map(state.sourceFiles);
      newSourceFiles.delete(filePath);
      return { sourceFiles: newSourceFiles };
    });
  },
  
  removeFunctionLocation: (functionId: string) => {
    set((state) => {
      const newFunctionLocations = new Map(state.functionLocations);
      newFunctionLocations.delete(functionId);
      return { functionLocations: newFunctionLocations };
    });
  },
  
  removeFlowNodeCode: (nodeId: string, filePath?: string) => {
    set((state) => {
      const newSourceFiles = new Map(state.sourceFiles);
      const newFunctionLocations = new Map(state.functionLocations);
      
      // If filePath is provided, remove the source file
      if (filePath) {
        newSourceFiles.delete(filePath);
        console.log(`🗑️ CodeStore: Removed source code for ${filePath}`);
      }
      
      // Remove all function locations that belong to this node
      // (function nodes have their own IDs, container nodes affect all functions in the file)
      let removedFunctions = 0;
      for (const [functionId, location] of newFunctionLocations.entries()) {
        // Remove if it's the exact function node or if it belongs to the file being removed
        if (functionId === nodeId || (filePath && location.filePath === filePath)) {
          newFunctionLocations.delete(functionId);
          removedFunctions++;
        }
      }
      
      if (removedFunctions > 0) {
        console.log(`🗑️ CodeStore: Removed ${removedFunctions} function locations for node ${nodeId}`);
      }
      
      return { 
        sourceFiles: newSourceFiles, 
        functionLocations: newFunctionLocations 
      };
    });
  },
  
  updateFunctionCode: (functionId: string, newFunctionCode: string) => {
    const state = get();
    const location = state.functionLocations.get(functionId);
    if (!location) {
      console.warn(`🔧 CodeStore: Function location not found for ${functionId}`);
      return false;
    }
    
    const sourceEntry = state.sourceFiles.get(location.filePath);
    if (!sourceEntry) {
      console.warn(`🔧 CodeStore: Source file not found for ${location.filePath}`);
      return false;
    }
    
    try {
      const lines = sourceEntry.sourceCode.split('\n');
      const startLine = location.startLine - 1; // Convert to 0-based
      const endLine = location.endLine - 1;
      
      // Replace the function code in the source
      const newFunctionLines = newFunctionCode.split('\n');
      const updatedLines = [
        ...lines.slice(0, startLine), // Lines before the function
        ...newFunctionLines, // New function code
        ...lines.slice(endLine + 1) // Lines after the function
      ];
      
      const updatedSourceCode = updatedLines.join('\n');
      
      // Update the source code in the store
      set((state) => {
        const newSourceFiles = new Map(state.sourceFiles);
        newSourceFiles.set(location.filePath, {
          filePath: location.filePath,
          sourceCode: updatedSourceCode,
          lastModified: Date.now()
        });
        return { sourceFiles: newSourceFiles };
      });
      
      console.log(`🔧 CodeStore: Updated function ${location.functionName} in ${location.filePath}`);
      return true;
      
    } catch (error) {
      console.error(`🔧 CodeStore: Failed to update function ${functionId}:`, error);
      return false;
    }
  },
  
      clearAll: () => {
        set({
          sourceFiles: new Map(),
          functionLocations: new Map()
        });
      }
    }),
    {
      name: 'code-store', // Storage key
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          
          try {
            const parsed = JSON.parse(str);
            return {
              state: {
                ...parsed.state,
                // Convert serialized objects back to Maps
                sourceFiles: new Map(Object.entries(parsed.state.sourceFiles || {})),
                functionLocations: new Map(Object.entries(parsed.state.functionLocations || {}))
              },
              version: parsed.version
            };
          } catch (error) {
            console.warn('Failed to parse code store from localStorage:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            const serialized = {
              state: {
                ...value.state,
                // Convert Maps to objects for serialization
                sourceFiles: Object.fromEntries(value.state.sourceFiles),
                functionLocations: Object.fromEntries(value.state.functionLocations)
              },
              version: value.version
            };
            localStorage.setItem(name, JSON.stringify(serialized));
          } catch (error) {
            console.warn('Failed to save code store to localStorage:', error);
          }
        },
        removeItem: (name) => localStorage.removeItem(name)
      },
      version: 1, // Increment this if you change the store structure
      migrate: (persistedState: any, version: number) => {
        // Handle migrations if needed when version changes
        if (version === 0) {
          // Migration from version 0 to 1
          return {
            ...persistedState,
            sourceFiles: new Map(),
            functionLocations: new Map()
          };
        }
        return persistedState;
      }
    }
  )
);