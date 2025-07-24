/** @format */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { UnifiedNodeWrapper } from '../NodeWrapper';
import { NodeProvider } from '../../../context/useNodeContext';
import { FrameJSON } from '../../types/FrameJSON';
import { EnhancedContainerNode } from '../../../interfaces/ContainerNodeInterfaces';

// Mock the node type store
vi.mock('../../../store/NodeTypeStoreInitializer', () => ({
  getNodeType: vi.fn((nodeType: string) => {
    if (nodeType === 'container-test') {
      return {
        nodeType: 'container-test',
        defaultLabel: 'Test Container',
        category: 'test',
        group: 'container',
        description: 'Test container node',
        visual: {
          icon: { type: 'lucide', name: 'Box' },
          selectedColor: '#3b82f6',
          style: {
            borderStyle: 'solid',
            shadowStyle: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }
        },
        handles: {
          category: 'basic',
          definitions: [
            { position: 'left', type: 'target', icon: { type: 'lucide', name: 'ArrowLeft' } },
            { position: 'right', type: 'source', icon: { type: 'lucide', name: 'ArrowRight' } }
          ]
        },
        defaultDimensions: { width: 200, height: 200 }
      } as FrameJSON;
    }
    if (nodeType === 'function-test') {
      return {
        nodeType: 'function-test',
        defaultLabel: 'Test Function',
        category: 'test',
        group: 'cell',
        description: 'Test function node',
        visual: {
          icon: { type: 'lucide', name: 'Code' },
          selectedColor: '#10b981',
          style: {
            borderStyle: 'solid',
            shadowStyle: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }
        },
        handles: {
          category: 'basic',
          definitions: [
            { position: 'left', type: 'target', icon: { type: 'lucide', name: 'ArrowLeft' } },
            { position: 'right', type: 'source', icon: { type: 'lucide', name: 'ArrowRight' } }
          ]
        },
        defaultDimensions: { width: 150, height: 100 }
      } as FrameJSON;
    }
    return null;
  })
}));

// Mock the generator context
vi.mock('../../../../Generator/context/GeneratorContext', () => ({
  useGenerator: () => ({
    updatingNodes: new Map()
  })
}));

// Mock the process hook
vi.mock('../../../../Process/useNodeProcess', () => ({
  useNodeProcess: () => ({
    isProcessing: false,
    isCompleted: false,
    hasError: false,
    startProcess: vi.fn(),
    completeProcess: vi.fn(),
    setError: vi.fn(),
    availableData: null,
    approvalStatus: 'none',
    autoApprove: false,
    pendingData: null,
    setApprovalStatus: vi.fn(),
    setAutoApprove: vi.fn(),
    setPendingApproval: vi.fn(),
    approveAndContinue: vi.fn(),
    declineAndStop: vi.fn()
  })
}));

// Mock the StateHistoryProvider
vi.mock('@jalez/react-state-history', () => ({
  StateHistoryProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useHistoryStateContext: () => ({
    trackableState: vi.fn(),
    setTrackableState: vi.fn(),
    canUndo: false,
    canRedo: false,
    undo: vi.fn(),
    redo: vi.fn(),
    clearHistory: vi.fn()
  }),
  useTrackableState: (key: string, setter: any) => setter
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ReactFlowProvider>
    <NodeProvider>
      {children}
    </NodeProvider>
  </ReactFlowProvider>
);

describe('Enhanced Container Integration', () => {
  describe('Container Node Rendering', () => {
    it('should render a container node with enhanced functionality', async () => {
      const containerNode: EnhancedContainerNode = {
        id: 'container-1',
        type: 'container-test',
        position: { x: 0, y: 0 },
        data: {
          label: 'Test Container',
          canContainChildren: true,
          expanded: false
        },
        canContainChildren: true,
        childNodeIds: [],
        expanded: false,
        depth: 0
      };

      render(
        <TestWrapper>
          <UnifiedNodeWrapper
            id={containerNode.id}
            type={containerNode.type}
            data={containerNode.data}
            selected={false}
          />
        </TestWrapper>
      );

      // Check if container node is rendered
      expect(screen.getByText('Test Container')).toBeInTheDocument();
      
      // Check if expand/collapse button is present
      const expandButton = screen.getByRole('button', { name: /expand/i });
      expect(expandButton).toBeInTheDocument();
    });

    it('should show child count badge when container has children', async () => {
      const containerNode: EnhancedContainerNode = {
        id: 'container-with-children',
        type: 'container-test',
        position: { x: 0, y: 0 },
        data: {
          label: 'Container with Children',
          canContainChildren: true,
          expanded: false
        },
        canContainChildren: true,
        childNodeIds: ['child-1', 'child-2'],
        expanded: false,
        depth: 0
      };

      render(
        <TestWrapper>
          <UnifiedNodeWrapper
            id={containerNode.id}
            type={containerNode.type}
            data={containerNode.data}
            selected={false}
          />
        </TestWrapper>
      );

      // The child count badge should be visible when collapsed
      await waitFor(() => {
        const badge = screen.getByText('2');
        expect(badge).toBeInTheDocument();
      });
    });

    it('should expand and show container content when expand button is clicked', async () => {
      const containerNode: EnhancedContainerNode = {
        id: 'expandable-container',
        type: 'container-test',
        position: { x: 0, y: 0 },
        data: {
          label: 'Expandable Container',
          canContainChildren: true,
          expanded: false
        },
        canContainChildren: true,
        childNodeIds: [],
        expanded: false,
        depth: 0
      };

      render(
        <TestWrapper>
          <UnifiedNodeWrapper
            id={containerNode.id}
            type={containerNode.type}
            data={containerNode.data}
            selected={false}
          />
        </TestWrapper>
      );

      // Click expand button
      const expandButton = screen.getByRole('button', { name: /expand/i });
      fireEvent.click(expandButton);

      // Check if container content is shown
      await waitFor(() => {
        expect(screen.getByText(/drop nodes here or use the ast parser/i)).toBeInTheDocument();
      });

      // Check if button changed to collapse
      expect(screen.getByRole('button', { name: /collapse/i })).toBeInTheDocument();
    });
  });

  describe('Function Node as Child', () => {
    it('should render function nodes that can be contained', async () => {
      const functionNode: EnhancedContainerNode = {
        id: 'function-1',
        type: 'function-test',
        position: { x: 100, y: 100 },
        data: {
          label: 'Test Function',
          functionName: 'testFunction',
          functionDescription: 'A test function',
          isNestedFunction: false,
          canContainChildren: false
        },
        canContainChildren: false,
        depth: 0
      };

      render(
        <TestWrapper>
          <UnifiedNodeWrapper
            id={functionNode.id}
            type={functionNode.type}
            data={functionNode.data}
            selected={false}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Test Function')).toBeInTheDocument();
    });

    it('should render nested function nodes with proper depth indication', async () => {
      const nestedFunctionNode: EnhancedContainerNode = {
        id: 'nested-function-1',
        type: 'function-test',
        position: { x: 150, y: 150 },
        data: {
          label: 'Nested Function',
          functionName: 'nestedFunction',
          functionDescription: 'A nested function',
          isNestedFunction: true,
          canContainChildren: false
        },
        canContainChildren: false,
        parentId: 'parent-function',
        depth: 1,
        scope: {
          level: 1,
          variables: ['param1', 'param2'],
          functionName: 'nestedFunction',
          parentScope: {
            level: 0,
            variables: ['globalVar'],
            functionName: 'parentFunction'
          }
        }
      };

      render(
        <TestWrapper>
          <UnifiedNodeWrapper
            id={nestedFunctionNode.id}
            type={nestedFunctionNode.type}
            data={nestedFunctionNode.data}
            selected={false}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Nested Function')).toBeInTheDocument();
    });
  });

  describe('Container-Child Relationships', () => {
    it('should display child nodes when container is expanded', async () => {
      // Mock the node context to return child nodes
      const mockChildNodes = [
        {
          id: 'child-1',
          data: {
            functionName: 'childFunction1',
            functionDescription: 'First child function',
            label: 'Child 1'
          },
          scope: {
            level: 1,
            variables: ['x', 'y'],
            functionName: 'childFunction1'
          }
        },
        {
          id: 'child-2',
          data: {
            functionName: 'childFunction2',
            functionDescription: 'Second child function',
            label: 'Child 2'
          },
          scope: {
            level: 1,
            variables: ['a', 'b'],
            functionName: 'childFunction2'
          }
        }
      ];

      // Create a container with expanded state
      const expandedContainer: EnhancedContainerNode = {
        id: 'expanded-container',
        type: 'container-test',
        position: { x: 0, y: 0 },
        data: {
          label: 'Expanded Container',
          canContainChildren: true,
          expanded: true
        },
        canContainChildren: true,
        childNodeIds: ['child-1', 'child-2'],
        expanded: true,
        depth: 0
      };

      // Mock the useNodeContext to return our mock child nodes
      const mockUseNodeContext = vi.fn(() => ({
        getChildNodes: vi.fn(() => mockChildNodes),
        getParentNode: vi.fn(() => undefined),
        canNodeContainChildren: vi.fn(() => true),
        enableContainerFunctionality: vi.fn(),
        disableContainerFunctionality: vi.fn(),
        addChildNode: vi.fn(),
        removeChildNode: vi.fn(),
        updateNodeScope: vi.fn(),
        nodeParentIdMapWithChildIdSet: new Map(),
        nodeMap: new Map(),
        updateNodes: vi.fn()
      }));

      // Temporarily replace the useNodeContext hook
      const originalModule = require('../../../context/useNodeContext');
      originalModule.useNodeContext = mockUseNodeContext;

      render(
        <TestWrapper>
          <UnifiedNodeWrapper
            id={expandedContainer.id}
            type={expandedContainer.type}
            data={expandedContainer.data}
            selected={false}
          />
        </TestWrapper>
      );

      // Check if child nodes are displayed
      await waitFor(() => {
        expect(screen.getByText('Child Nodes (2)')).toBeInTheDocument();
        expect(screen.getByText('childFunction1')).toBeInTheDocument();
        expect(screen.getByText('First child function')).toBeInTheDocument();
        expect(screen.getByText('childFunction2')).toBeInTheDocument();
        expect(screen.getByText('Second child function')).toBeInTheDocument();
      });

      // Check if scope information is displayed
      expect(screen.getByText(/Scope Level: 1/)).toBeInTheDocument();
      expect(screen.getByText(/Variables: x, y/)).toBeInTheDocument();
      expect(screen.getByText(/Variables: a, b/)).toBeInTheDocument();
    });

    it('should show empty state when container has no children', async () => {
      const emptyContainer: EnhancedContainerNode = {
        id: 'empty-container',
        type: 'container-test',
        position: { x: 0, y: 0 },
        data: {
          label: 'Empty Container',
          canContainChildren: true,
          expanded: true
        },
        canContainChildren: true,
        childNodeIds: [],
        expanded: true,
        depth: 0
      };

      render(
        <TestWrapper>
          <UnifiedNodeWrapper
            id={emptyContainer.id}
            type={emptyContainer.type}
            data={emptyContainer.data}
            selected={false}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/drop nodes here or use the ast parser/i)).toBeInTheDocument();
      });
    });
  });

  describe('Enhanced Container Functionality', () => {
    it('should enable container functionality for container group nodes', async () => {
      const mockEnableContainerFunctionality = vi.fn();
      const mockCanNodeContainChildren = vi.fn(() => false);

      // Mock the useNodeContext to track function calls
      const mockUseNodeContext = vi.fn(() => ({
        getChildNodes: vi.fn(() => []),
        getParentNode: vi.fn(() => undefined),
        canNodeContainChildren: mockCanNodeContainChildren,
        enableContainerFunctionality: mockEnableContainerFunctionality,
        disableContainerFunctionality: vi.fn(),
        addChildNode: vi.fn(),
        removeChildNode: vi.fn(),
        updateNodeScope: vi.fn(),
        nodeParentIdMapWithChildIdSet: new Map(),
        nodeMap: new Map(),
        updateNodes: vi.fn()
      }));

      const originalModule = require('../../../context/useNodeContext');
      originalModule.useNodeContext = mockUseNodeContext;

      const containerNode: EnhancedContainerNode = {
        id: 'auto-enable-container',
        type: 'container-test',
        position: { x: 0, y: 0 },
        data: {
          label: 'Auto Enable Container',
          canContainChildren: false
        },
        canContainChildren: false,
        expanded: false,
        depth: 0
      };

      render(
        <TestWrapper>
          <UnifiedNodeWrapper
            id={containerNode.id}
            type={containerNode.type}
            data={containerNode.data}
            selected={false}
          />
        </TestWrapper>
      );

      // Wait for the effect to run
      await waitFor(() => {
        expect(mockEnableContainerFunctionality).toHaveBeenCalledWith('auto-enable-container');
      });
    });

    it('should properly integrate with existing node context functionality', async () => {
      const containerNode: EnhancedContainerNode = {
        id: 'integrated-container',
        type: 'container-test',
        position: { x: 0, y: 0 },
        data: {
          label: 'Integrated Container',
          canContainChildren: true,
          expanded: false
        },
        canContainChildren: true,
        childNodeIds: [],
        expanded: false,
        depth: 0
      };

      render(
        <TestWrapper>
          <UnifiedNodeWrapper
            id={containerNode.id}
            type={containerNode.type}
            data={containerNode.data}
            selected={false}
          />
        </TestWrapper>
      );

      // Verify the node renders without errors
      expect(screen.getByText('Integrated Container')).toBeInTheDocument();
    });
  });
});