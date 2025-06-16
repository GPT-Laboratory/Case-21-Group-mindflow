import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Send, Lightbulb } from 'lucide-react';
import { FlowGenerationService, FlowGenerationRequest } from './FlowGenerationService';
import { GenerationOrchestrator } from '../../Process/Generation/GenerationOrchestrator';
import { LLMProvider } from '../../Process/Generation/types';
import { useSelect } from '../../Select/contexts/SelectContext';
import { useNodeContext } from '../../Node/store/useNodeContext';
import { Node } from '@xyflow/react';
import { NodeData } from '../../types';
import { useInputFocusHandlers } from '../../Panel/hooks/useInputFocusHandlers';

// Simple checkbox component since it's not available in the UI library
const Checkbox: React.FC<{
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: React.ReactNode;
}> = ({ id, checked, onCheckedChange, children }) => (
  <label htmlFor={id} className="flex items-center gap-2 cursor-pointer text-xs">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className="w-3 h-3"
    />
    {children}
  </label>
);

interface FlowGenerationPanelProps {
  onFlowGenerated: (nodes: any[], edges: any[]) => void;
  onClose?: () => void;
}

/**
 * Helper function to get all child node IDs for a given parent node ID
 */
const getChildNodeIds = (
  parentNodeId: string,
  nodeParentIdMapWithChildIdSet: Map<string, Set<string>>
): string[] => {
  const childIdSet = nodeParentIdMapWithChildIdSet.get(parentNodeId);
  return childIdSet ? Array.from(childIdSet) : [];
};

const FlowGenerationPanel: React.FC<FlowGenerationPanelProps> = ({
  onFlowGenerated,
}) => {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [complexity, _] = useState<'simple' | 'intermediate' | 'advanced'>('simple');
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>('openai');
  const [includeSelectedContext, setIncludeSelectedContext] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<Array<{
    provider: LLMProvider;
    name: string;
    configured: boolean;
    preferred: boolean;
  }>>([]);
  
  // Prompt history state
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentInput, setCurrentInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const flowService = new FlowGenerationService();
  const orchestrator = new GenerationOrchestrator();
  const { selectedNodes, clearSelection } = useSelect();
  const { nodeMap, nodeParentIdMapWithChildIdSet, updateNodes } = useNodeContext();
  
  // Use the same focus handlers as FormField to fix macOS backspace issue
  const { onFocus, onBlur } = useInputFocusHandlers();

  // Load available providers on mount
  useEffect(() => {
    const providers = orchestrator.getAvailableProviders();
    setAvailableProviders(providers);
    
    // Set default to preferred provider if available
    const preferred = providers.find(p => p.preferred);
    if (preferred) {
      setSelectedProvider(preferred.provider);
    }
  }, []);
  
  // Simple prompts for suggestions
  const examplePrompts = [
    "Build a REST API workflow that fetches user data and displays it",
    "Create a data filtering system with conditional routing",
    "Design a user authentication flow with API validation",
    "Build a content management system with data storage",
    "Create an API data pipeline with processing and display"
  ];

  const handleSuggest = useCallback(() => {
    const randomPrompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
    setDescription(randomPrompt);
    setHistoryIndex(-1);
    setCurrentInput(randomPrompt);
  }, []);

  /**
   * Formats node data for context inclusion
   */
  const formatNodeForContext = (node: Node<NodeData>): string => {
    const { data } = node;
    let context = `Node "${data.label || node.id}" (${node.type || 'unknown type'})`;
    
    if (data.details) {
      context += `\n  Details: ${data.details}`;
    }
    
    if (data.subject) {
      context += `\n  Subject: ${data.subject}`;
    }
    
    if (data.level) {
      context += `\n  Level: ${data.level}`;
    }

    // Add any other relevant properties
    const otherProps = Object.entries(data)
      .filter(([key, value]) => 
        !['label', 'details', 'subject', 'level', 'type', 'highlighted', 'expanded', 'isParent', 'deleteOnEmpty'].includes(key) &&
        value !== undefined && value !== null && value !== ''
      )
      .map(([key, value]) => `  ${key}: ${value}`)
      .join('\n');
      
    if (otherProps) {
      context += `\n${otherProps}`;
    }
    
    return context;
  };

  /**
   * Gathers context from selected nodes and their children
   */
  const gatherSelectedNodesContext = useCallback((): string => {
    if (!includeSelectedContext || selectedNodes.length === 0) {
      return '';
    }

    const allRelevantNodes = new Set<Node<NodeData>>();
    
    // Add selected nodes and their children
    for (const selectedNode of selectedNodes) {
      // Type assertion to ensure selectedNode is typed as Node<NodeData>
      const typedSelectedNode = selectedNode as Node<NodeData>;
      allRelevantNodes.add(typedSelectedNode);
      
      // Get all children of this selected node
      const childNodeIds = getChildNodeIds(
        selectedNode.id, 
        nodeParentIdMapWithChildIdSet
      );
      
      childNodeIds.forEach((childId: string) => {
        const childNode = nodeMap.get(childId);
        if (childNode) {
          allRelevantNodes.add(childNode);
        }
      });
    }

    if (allRelevantNodes.size === 0) {
      return '';
    }

    // Format the context
    const contextLines = [
      '\n--- Context from Selected Nodes ---',
      `Selected ${selectedNodes.length} node(s) with ${allRelevantNodes.size - selectedNodes.length} child node(s):\n`
    ];

    // Add selected nodes first
    contextLines.push('Selected Nodes:');
    for (const selectedNode of selectedNodes) {
      // Type assertion to ensure selectedNode is typed as Node<NodeData>
      const typedSelectedNode = selectedNode as Node<NodeData>;
      contextLines.push(formatNodeForContext(typedSelectedNode));
    }

    // Add child nodes if any
    const childNodes = Array.from(allRelevantNodes).filter(node => 
      !selectedNodes.some(selected => selected.id === node.id)
    );
    
    if (childNodes.length > 0) {
      contextLines.push('\nChild Nodes:');
      for (const childNode of childNodes) {
        contextLines.push(formatNodeForContext(childNode));
      }
    }

    contextLines.push('--- End Context ---\n');
    
    return contextLines.join('\n');
  }, [includeSelectedContext, selectedNodes, nodeMap, nodeParentIdMapWithChildIdSet]);

  const handleGenerate = async () => {
    if (!description.trim()) return;
    
    // Store the actual selected nodes before clearing selection
    const originallySelectedNodes = [...selectedNodes];
    
    // Get all affected nodes (selected nodes + their children)
    const affectedNodes = new Set<Node<NodeData>>();
    
    // Add selected nodes (with type safety)
    originallySelectedNodes.forEach(node => {
      // Type assertion since we know these are our nodes with NodeData
      const typedNode = node as Node<NodeData>;
      affectedNodes.add(typedNode);
    });
    
    // Add children of selected nodes
    originallySelectedNodes.forEach(selectedNode => {
      const childNodeIds = getChildNodeIds(
        selectedNode.id, 
        nodeParentIdMapWithChildIdSet
      );
      
      childNodeIds.forEach((childId: string) => {
        const childNode = nodeMap.get(childId);
        if (childNode) {
          affectedNodes.add(childNode);
        }
      });
    });
    
    const allAffectedNodes = Array.from(affectedNodes);
    const affectedNodeIds = allAffectedNodes.map(node => node.id);
    
    setIsGenerating(true);
    
    try {
      // 🎯 STEP 1: Deselect all selected nodes immediately
      clearSelection();
      
      // 🎯 STEP 2: Set generation state on selected nodes AND their children
      if (allAffectedNodes.length > 0) {
        const nodesWithGenerationState = allAffectedNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            isGenerating: true,
            isSelectable: false // Make unselectable during generation
          }
        }));
        updateNodes(nodesWithGenerationState);
      }
      
      // Gather context from selected nodes if enabled
      const selectedNodesContext = gatherSelectedNodesContext();
      
      const request: FlowGenerationRequest = {
        description: description.trim(),
        complexity,
        selectedNodesContext: selectedNodesContext || undefined
      };
      
      const generatedFlow = await flowService.generateFlow(request);
      
      console.log('Generated flow:', generatedFlow);
      onFlowGenerated(generatedFlow.nodes, generatedFlow.edges);
      
      // Add to history if it's not already the most recent entry
      const trimmedDescription = description.trim();
      if (trimmedDescription && (promptHistory.length === 0 || promptHistory[0] !== trimmedDescription)) {
        setPromptHistory(prev => [trimmedDescription, ...prev.slice(0, 19)]); // Keep last 20 prompts
      }
      
      // Clear the input and reset history navigation
      setDescription('');
      setHistoryIndex(-1);
      setCurrentInput('');
      
    } catch (error) {
      console.error('Flow generation error:', error);
      // You could add error state/notification here
    } finally {
      // 🎯 STEP 3: Remove generation state from affected nodes
      if (affectedNodeIds.length > 0) {
        // Get current nodes and remove generation state
        const currentNodes = affectedNodeIds.map(nodeId => nodeMap.get(nodeId)).filter(Boolean);
        const nodesWithoutGenerationState = currentNodes.map(node => ({
          ...node!,
          data: {
            ...node!.data,
            isGenerating: false,
            isSelectable: true // Make selectable again
          }
        }));
        updateNodes(nodesWithoutGenerationState);
      }
      
      setIsGenerating(false);
    }
  };

  // Count total nodes that would be included in context
  const getContextNodeCount = useCallback((): { selected: number; children: number } => {
    if (!includeSelectedContext || selectedNodes.length === 0) {
      return { selected: 0, children: 0 };
    }

    const allChildren = new Set<string>();
    for (const selectedNode of selectedNodes) {
      const childNodeIds = getChildNodeIds(
        selectedNode.id, 
        nodeParentIdMapWithChildIdSet
      );
      childNodeIds.forEach((childId: string) => allChildren.add(childId));
    }

    return {
      selected: selectedNodes.length,
      children: allChildren.size
    };
  }, [includeSelectedContext, selectedNodes, nodeParentIdMapWithChildIdSet]);

  const contextCounts = getContextNodeCount();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (promptHistory.length === 0) return;
      
      // Save current input when starting to navigate
      if (historyIndex === -1) {
        setCurrentInput(description);
      }
      
      const newIndex = Math.min(historyIndex + 1, promptHistory.length - 1);
      setHistoryIndex(newIndex);
      setDescription(promptHistory[newIndex]);
      
      // Move cursor to end of text
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(
            inputRef.current.value.length,
            inputRef.current.value.length
          );
        }
      }, 0);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      
      if (historyIndex === 0) {
        // Go back to current input
        setHistoryIndex(-1);
        setDescription(currentInput);
      } else {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setDescription(promptHistory[newIndex]);
      }
      
      // Move cursor to end of text
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(
            inputRef.current.value.length,
            inputRef.current.value.length
          );
        }
      }, 0);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isGenerating) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
    // Reset history navigation when user types
    if (historyIndex !== -1) {
      setHistoryIndex(-1);
      setCurrentInput(e.target.value);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3">
      <div className="flex items-center gap-3">
        {/* Suggest Button */}
        <button
          onClick={handleSuggest}
          disabled={isGenerating}
          className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Suggest a workflow idea"
        >
          <Lightbulb className="w-4 h-4" />
        </button>
        
        {/* Main Input */}
        <div className="flex-1 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Describe the flow you want to generate (e.g., 'Build a REST API workflow that fetches user data')"
            value={description}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
            disabled={isGenerating}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
          />
          
          {/* Context Checkbox */}
          {selectedNodes.length > 0 && (
            <Checkbox
              id="include-context"
              checked={includeSelectedContext}
              onCheckedChange={setIncludeSelectedContext}
            >
              Include {contextCounts.selected} selected
            </Checkbox>
          )}
          
          {/* Model Selection */}
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value as LLMProvider)}
            disabled={isGenerating}
            className="text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
          >
            {availableProviders.map(({ provider, name, configured }) => (
              <option key={provider} value={provider} disabled={!configured}>
                {name.split(' ')[0]} {!configured ? '(?)' : ''}
              </option>
            ))}
          </select>
        </div>
        
        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!description.trim() || isGenerating}
          className="flex items-center justify-center w-8 h-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Generate Flow"
        >
          <Send className="w-4 h-4" />
        </button>
        
        {/* History indicator */}
        {historyIndex !== -1 && (
          <div className="text-xs text-gray-500 px-2">
            {historyIndex + 1}/{promptHistory.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlowGenerationPanel;