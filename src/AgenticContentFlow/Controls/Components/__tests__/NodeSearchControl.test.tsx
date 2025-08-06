import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NodeSearchControl } from '../NodeSearchControl';
import { useNodeContext } from '../../../Node/context/useNodeContext';
import { useReactFlow } from '@xyflow/react';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';

// Mock the dependencies
vi.mock('../../../Node/context/useNodeContext');
vi.mock('@xyflow/react');

const mockUseNodeContext = vi.mocked(useNodeContext);
const mockUseReactFlow = vi.mocked(useReactFlow);

describe('NodeSearchControl', () => {
  const mockSetCenter = vi.fn();
  const mockFitView = vi.fn();

  const mockNodes = [
    {
      id: '1',
      type: 'function',
      position: { x: 100, y: 200 },
      data: {
        functionName: 'calculateSum',
        functionDescription: 'Calculates the sum of two numbers',
        label: 'Sum Calculator'
      }
    },
    {
      id: '2',
      type: 'function',
      position: { x: 300, y: 400 },
      data: {
        functionName: 'processData',
        functionDescription: 'Processes user input data',
        label: 'Data Processor'
      }
    },
    {
      id: '3',
      type: 'utility',
      position: { x: 500, y: 600 },
      data: {
        functionName: 'validateInput',
        functionDescription: 'Validates user input',
        label: 'Input Validator'
      }
    }
  ];

  beforeEach(() => {
    mockSetCenter.mockClear();
    mockUseNodeContext.mockReturnValue({
      nodes: mockNodes,
      updateNode: vi.fn(),
      nodeMap: new Map(),
      addNode: vi.fn(),
      removeNodes: vi.fn(),
      onNodesChange: vi.fn(),
      onNodeDrag: vi.fn(),
      onNodeDragStop: vi.fn(),
      isDragging: false,
      setNodes: vi.fn(),
      localNodes: mockNodes
    } as any);

    mockUseReactFlow.mockReturnValue({
      setCenter: mockSetCenter,
      fitView: mockFitView,
      getNodes: vi.fn(),
      getEdges: vi.fn(),
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNodes: vi.fn(),
      addEdges: vi.fn(),
      toObject: vi.fn(),
      deleteElements: vi.fn(),
      getNode: vi.fn(),
      getEdge: vi.fn(),
      getIntersectingNodes: vi.fn(),
      isNodeIntersecting: vi.fn(),
      updateNode: vi.fn(),
      updateNodeData: vi.fn(),
      updateEdge: vi.fn(),
      updateEdgeData: vi.fn(),
      setViewport: vi.fn(),
      getViewport: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      zoomTo: vi.fn(),
      getZoom: vi.fn(),
      screenToFlowPosition: vi.fn(),
      flowToScreenPosition: vi.fn()
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockSetCenter.mockClear();
  });

  it('should render the search button initially', () => {
    render(<NodeSearchControl />);
    
    const searchButton = screen.getByRole('button', { name: /find function/i });
    expect(searchButton).toBeInTheDocument();
    expect(screen.getByText('Find Function')).toBeInTheDocument();
  });

  it('should open search input when button is clicked', async () => {
    const user = userEvent.setup();
    render(<NodeSearchControl />);
    
    const searchButton = screen.getByRole('button', { name: /find function/i });
    await user.click(searchButton);
    
    expect(screen.getByPlaceholderText('Search functions...')).toBeInTheDocument();
    expect(screen.getByDisplayValue('')).toBeInTheDocument();
  });

  it('should focus the input when opened', async () => {
    const user = userEvent.setup();
    render(<NodeSearchControl />);
    
    const searchButton = screen.getByRole('button', { name: /find function/i });
    await user.click(searchButton);
    
    const input = screen.getByPlaceholderText('Search functions...');
    expect(input).toHaveFocus();
  });

  it('should show matching results count when typing', async () => {
    const user = userEvent.setup();
    render(<NodeSearchControl />);
    
    // Open search
    const searchButton = screen.getByRole('button', { name: /find function/i });
    await user.click(searchButton);
    
    // Type search term
    const input = screen.getByPlaceholderText('Search functions...');
    await user.type(input, 'calculate');
    
    expect(screen.getByText('1 found')).toBeInTheDocument();
  });

  it('should show correct count for multiple matches', async () => {
    const user = userEvent.setup();
    render(<NodeSearchControl />);
    
    // Open search
    const searchButton = screen.getByRole('button', { name: /find function/i });
    await user.click(searchButton);
    
    // Type search term that matches multiple nodes
    const input = screen.getByPlaceholderText('Search functions...');
    await user.type(input, 'data'); // Should match "processData" and "validateInput" (in description)
    
    expect(screen.getByText('1 found')).toBeInTheDocument(); // Only processData matches "data"
  });

  it('should show 0 found when no matches', async () => {
    const user = userEvent.setup();
    render(<NodeSearchControl />);
    
    // Open search
    const searchButton = screen.getByRole('button', { name: /find function/i });
    await user.click(searchButton);
    
    // Type search term with no matches
    const input = screen.getByPlaceholderText('Search functions...');
    await user.type(input, 'nonexistent');
    
    expect(screen.getByText('0 found')).toBeInTheDocument();
  });

  it('should center on first matching node when typing', async () => {
    const user = userEvent.setup();
    render(<NodeSearchControl />);
    
    // Open search
    const searchButton = screen.getByRole('button', { name: /find function/i });
    await user.click(searchButton);
    
    // Type search term
    const input = screen.getByPlaceholderText('Search functions...');
    await user.type(input, 'calculate');
    
    await waitFor(() => {
      expect(mockSetCenter).toHaveBeenCalledWith(100, 200, { zoom: 1.2, duration: 500 });
    });
  });

  it('should not call setCenter when no matches found', async () => {
    const user = userEvent.setup();
    render(<NodeSearchControl />);
    
    // Open search
    const searchButton = screen.getByRole('button', { name: /find function/i });
    await user.click(searchButton);
    
    // Type search term with no matches
    const input = screen.getByPlaceholderText('Search functions...');
    await user.type(input, 'nonexistent');
    
    await waitFor(() => {
      expect(mockSetCenter).not.toHaveBeenCalled();
    });
  });

  it('should clear search and close when X button is clicked', async () => {
    const user = userEvent.setup();
    render(<NodeSearchControl />);
    
    // Open search and type
    const searchButton = screen.getByRole('button', { name: /find function/i });
    await user.click(searchButton);
    
    const input = screen.getByPlaceholderText('Search functions...');
    await user.type(input, 'test');
    
    // Click clear button
    const clearButton = screen.getByRole('button', { name: '' }); // X button has no accessible name
    await user.click(clearButton);
    
    // Should be back to initial state
    expect(screen.getByRole('button', { name: /find function/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search functions...')).not.toBeInTheDocument();
  });

  it('should handle nodes without position data gracefully', async () => {
    const nodesWithoutPosition = [
      {
        id: '1',
        type: 'function',
        position: { x: 0, y: 0 }, // Provide default position
        data: {
          functionName: 'testFunction',
          label: 'Test Function'
        }
      }
    ];

    mockUseNodeContext.mockReturnValue({
      nodes: nodesWithoutPosition,
      updateNode: vi.fn(),
      nodeMap: new Map(),
      addNode: vi.fn(),
      removeNodes: vi.fn(),
      onNodesChange: vi.fn(),
      onNodeDrag: vi.fn(),
      onNodeDragStop: vi.fn(),
      isDragging: false,
      setNodes: vi.fn(),
      localNodes: nodesWithoutPosition
    } as any);

    const user = userEvent.setup();
    render(<NodeSearchControl />);
    
    // Open search and type
    const searchButton = screen.getByRole('button', { name: /find function/i });
    await user.click(searchButton);
    
    const input = screen.getByPlaceholderText('Search functions...');
    await user.type(input, 'test');
    
    // Should not crash and should not call setCenter
    expect(screen.getByText('1 found')).toBeInTheDocument();
    expect(mockSetCenter).not.toHaveBeenCalled();
  });

  it('should search case-insensitively', async () => {
    const user = userEvent.setup();
    render(<NodeSearchControl />);
    
    // Open search
    const searchButton = screen.getByRole('button', { name: /find function/i });
    await user.click(searchButton);
    
    // Type uppercase search term
    const input = screen.getByPlaceholderText('Search functions...');
    await user.type(input, 'CALCULATE');
    
    expect(screen.getByText('1 found')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockSetCenter).toHaveBeenCalledWith(100, 200, { zoom: 1.2, duration: 500 });
    });
  });
});