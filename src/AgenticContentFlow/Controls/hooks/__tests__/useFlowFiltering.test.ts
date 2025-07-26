import { renderHook } from '@testing-library/react';
import { useFlowFiltering } from '../useFlowFiltering';
import { useNodeContext } from '../../../Node/context/useNodeContext';
import { Node } from '@xyflow/react';
import { vi } from 'vitest';

// Mock the useNodeContext hook
vi.mock('../../../Node/context/useNodeContext');
const mockUseNodeContext = vi.mocked(useNodeContext);

describe('useFlowFiltering', () => {
  const mockNodes: Node[] = [
    {
      id: '1',
      type: 'function',
      position: { x: 0, y: 0 },
      data: {
        functionName: 'calculateSum',
        functionDescription: 'Calculates the sum of two numbers',
        label: 'Sum Calculator',
        connections: [],
        dependencies: [],
        childNodes: []
      }
    },
    {
      id: '2',
      type: 'function',
      position: { x: 100, y: 0 },
      data: {
        functionName: 'processData',
        functionDescription: 'Processes user input data',
        label: 'Data Processor',
        connections: ['1', '3', '4', '5'], // Complex node (>3 connections)
        dependencies: ['external1'],
        childNodes: []
      }
    },
    {
      id: '3',
      type: 'utility',
      position: { x: 200, y: 0 },
      data: {
        functionName: 'validateInput',
        functionDescription: 'Validates user input',
        label: 'Input Validator',
        connections: [],
        dependencies: [],
        childNodes: []
      }
    }
  ];

  beforeEach(() => {
    mockUseNodeContext.mockReturnValue({
      nodes: mockNodes,
      // Add other required properties with mock implementations
      updateNode: vi.fn(),
      nodeMap: new Map(),
      addNode: vi.fn(),
      removeNode: vi.fn(),
      onNodesChange: vi.fn(),
      onNodeDrag: vi.fn(),
      onNodeDragStop: vi.fn(),
      isDragging: false,
      setNodes: vi.fn(),
      localNodes: mockNodes
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('searchNodes', () => {
    it('should return all nodes when search term is empty', () => {
      const { result } = renderHook(() => useFlowFiltering());
      
      const searchResults = result.current.searchNodes('');
      expect(searchResults).toHaveLength(3);
      expect(searchResults).toEqual(mockNodes);
    });

    it('should filter nodes by function name', () => {
      const { result } = renderHook(() => useFlowFiltering());
      
      const searchResults = result.current.searchNodes('calculate');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].data.functionName).toBe('calculateSum');
    });

    it('should filter nodes by function description', () => {
      const { result } = renderHook(() => useFlowFiltering());
      
      const searchResults = result.current.searchNodes('processes user');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].data.functionName).toBe('processData');
    });

    it('should filter nodes by label', () => {
      const { result } = renderHook(() => useFlowFiltering());
      
      const searchResults = result.current.searchNodes('validator');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].data.functionName).toBe('validateInput');
    });

    it('should be case insensitive', () => {
      const { result } = renderHook(() => useFlowFiltering());
      
      const searchResults = result.current.searchNodes('CALCULATE');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].data.functionName).toBe('calculateSum');
    });

    it('should return multiple matches when search term matches multiple nodes', () => {
      const { result } = renderHook(() => useFlowFiltering());
      
      const searchResults = result.current.searchNodes('data');
      expect(searchResults).toHaveLength(1); // Only processData matches "data"
      expect(searchResults[0].data.functionName).toBe('processData');
    });

    it('should return empty array when no matches found', () => {
      const { result } = renderHook(() => useFlowFiltering());
      
      const searchResults = result.current.searchNodes('nonexistent');
      expect(searchResults).toHaveLength(0);
    });

    it('should handle nodes with missing data properties', () => {
      const nodesWithMissingData: Node[] = [
        {
          id: '4',
          type: 'function',
          position: { x: 0, y: 0 },
          data: {} // Missing function name, description, label
        }
      ];

      mockUseNodeContext.mockReturnValue({
        nodes: nodesWithMissingData,
        updateNode: vi.fn(),
        nodeMap: new Map(),
        addNode: vi.fn(),
        removeNode: vi.fn(),
        onNodesChange: vi.fn(),
        onNodeDrag: vi.fn(),
        onNodeDragStop: vi.fn(),
        isDragging: false,
        setNodes: vi.fn(),
        localNodes: nodesWithMissingData
      });

      const { result } = renderHook(() => useFlowFiltering());
      
      const searchResults = result.current.searchNodes('test');
      expect(searchResults).toHaveLength(0);
    });
  });

  describe('getNodeComplexity', () => {
    it('should classify node as simple when connections <= 3', () => {
      const { result } = renderHook(() => useFlowFiltering());
      
      const simpleNode = mockNodes[0]; // calculateSum has 0 connections
      const complexity = result.current.getNodeComplexity(simpleNode);
      expect(complexity).toBe('simple');
    });

    it('should classify node as complex when connections > 3', () => {
      const { result } = renderHook(() => useFlowFiltering());
      
      const complexNode = mockNodes[1]; // processData has 5 connections + 1 dependency = 6 total
      const complexity = result.current.getNodeComplexity(complexNode);
      expect(complexity).toBe('complex');
    });

    it('should count connections, dependencies, and child nodes', () => {
      const { result } = renderHook(() => useFlowFiltering());
      
      const nodeWithMixedConnections: Node = {
        id: '5',
        type: 'function',
        position: { x: 0, y: 0 },
        data: {
          connections: ['1', '2'], // 2 connections
          dependencies: ['ext1'], // 1 dependency
          childNodes: ['child1'] // 1 child node
          // Total: 4 connections (complex)
        }
      };

      const complexity = result.current.getNodeComplexity(nodeWithMixedConnections);
      expect(complexity).toBe('complex');
    });

    it('should handle nodes with missing connection data', () => {
      const { result } = renderHook(() => useFlowFiltering());
      
      const nodeWithoutConnections: Node = {
        id: '6',
        type: 'function',
        position: { x: 0, y: 0 },
        data: {} // No connection data
      };

      const complexity = result.current.getNodeComplexity(nodeWithoutConnections);
      expect(complexity).toBe('simple'); // Should default to 0 connections
    });
  });

  describe('totalNodes', () => {
    it('should return the total number of nodes', () => {
      const { result } = renderHook(() => useFlowFiltering());
      
      expect(result.current.totalNodes).toBe(3);
    });

    it('should update when nodes change', () => {
      const { result, rerender } = renderHook(() => useFlowFiltering());
      
      expect(result.current.totalNodes).toBe(3);

      // Update mock to return different nodes
      mockUseNodeContext.mockReturnValue({
        nodes: [mockNodes[0]], // Only one node
        updateNode: vi.fn(),
        nodeMap: new Map(),
        addNode: vi.fn(),
        removeNode: vi.fn(),
        onNodesChange: vi.fn(),
        onNodeDrag: vi.fn(),
        onNodeDragStop: vi.fn(),
        isDragging: false,
        setNodes: vi.fn(),
        localNodes: [mockNodes[0]]
      });

      rerender();
      expect(result.current.totalNodes).toBe(1);
    });
  });
});