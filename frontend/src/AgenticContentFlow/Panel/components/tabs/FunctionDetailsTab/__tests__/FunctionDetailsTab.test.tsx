import { render, screen } from '@testing-library/react';
import { FunctionDetailsTab } from '../FunctionDetailsTab';
import { describe, expect, it } from 'vitest';

describe('FunctionDetailsTab', () => {
  const mockFormData = {
    functionName: 'calculateSum',
    functionDescription: 'Calculates the sum of two numbers and returns the result',
    parameters: [
      { name: 'a', type: 'number', defaultValue: undefined },
      { name: 'b', type: 'number', defaultValue: undefined },
      { name: 'options', type: 'object', defaultValue: '{}' }
    ],
    returnType: 'number',
    sourceLocation: { line: 15, column: 4 },
    isNested: false,
    parentFunction: undefined,
    externalDependencies: ['Math.abs', 'console.log'],
    childNodes: [],
    complexity: 'simple'
  };

  it('should render function details correctly', () => {
    render(<FunctionDetailsTab nodeId="test-node" formData={mockFormData} />);
    
    expect(screen.getByText('Function Details')).toBeInTheDocument();
    expect(screen.getByText('calculateSum')).toBeInTheDocument();
    expect(screen.getByText('Calculates the sum of two numbers and returns the result')).toBeInTheDocument();
  });

  it('should show complexity badge as simple for nodes with few connections', () => {
    const simpleFormData = {
      ...mockFormData,
      externalDependencies: ['Math.abs'], // 1 dependency
      childNodes: [] // 0 child nodes
    };

    render(<FunctionDetailsTab nodeId="test-node" formData={simpleFormData} />);
    
    expect(screen.getByText('Simple (1 connections)')).toBeInTheDocument();
  });

  it('should show complexity badge as complex for nodes with many connections', () => {
    const complexFormData = {
      ...mockFormData,
      externalDependencies: ['Math.abs', 'console.log', 'JSON.stringify'], // 3 dependencies
      childNodes: [{ id: 'child1' }, { id: 'child2' }] // 2 child nodes = 5 total connections
    };

    render(<FunctionDetailsTab nodeId="test-node" formData={complexFormData} />);
    
    expect(screen.getByText('Complex (5 connections)')).toBeInTheDocument();
  });

  it('should show nested badge when function is nested', () => {
    const nestedFormData = {
      ...mockFormData,
      isNested: true,
      parentFunction: 'parentFunction'
    };

    render(<FunctionDetailsTab nodeId="test-node" formData={nestedFormData} />);
    
    expect(screen.getByText('Nested')).toBeInTheDocument();
  });

  it('should render parameters section when parameters exist', () => {
    render(<FunctionDetailsTab nodeId="test-node" formData={mockFormData} />);
    
    expect(screen.getByText('Parameters (3)')).toBeInTheDocument();
    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();
    expect(screen.getByText('options')).toBeInTheDocument();
    expect(screen.getByText('= {}')).toBeInTheDocument();
  });

  it('should not render parameters section when no parameters', () => {
    const noParamsFormData = {
      ...mockFormData,
      parameters: []
    };

    render(<FunctionDetailsTab nodeId="test-node" formData={noParamsFormData} />);
    
    expect(screen.queryByText(/Parameters/)).not.toBeInTheDocument();
  });

  it('should render external dependencies section', () => {
    render(<FunctionDetailsTab nodeId="test-node" formData={mockFormData} />);
    
    expect(screen.getByText('External Dependencies (2)')).toBeInTheDocument();
    expect(screen.getByText('Math.abs')).toBeInTheDocument();
    expect(screen.getByText('console.log')).toBeInTheDocument();
  });

  it('should not render external dependencies section when none exist', () => {
    const noDepsFormData = {
      ...mockFormData,
      externalDependencies: []
    };

    render(<FunctionDetailsTab nodeId="test-node" formData={noDepsFormData} />);
    
    expect(screen.queryByText(/External Dependencies/)).not.toBeInTheDocument();
  });

  it('should render child functions section when child nodes exist', () => {
    const withChildrenFormData = {
      ...mockFormData,
      childNodes: [
        {
          id: 'child1',
          functionName: 'helperFunction',
          functionDescription: 'A helper function',
          label: 'Helper'
        },
        {
          id: 'child2',
          functionName: 'anotherHelper',
          label: 'Another Helper'
        }
      ]
    };

    render(<FunctionDetailsTab nodeId="test-node" formData={withChildrenFormData} />);
    
    expect(screen.getByText('Child Functions (2)')).toBeInTheDocument();
    expect(screen.getByText('helperFunction')).toBeInTheDocument();
    expect(screen.getByText('A helper function')).toBeInTheDocument();
    expect(screen.getByText('anotherHelper')).toBeInTheDocument();
  });

  it('should not render child functions section when no child nodes', () => {
    render(<FunctionDetailsTab nodeId="test-node" formData={mockFormData} />);
    
    expect(screen.queryByText(/Child Functions/)).not.toBeInTheDocument();
  });

  it('should render source location when available', () => {
    render(<FunctionDetailsTab nodeId="test-node" formData={mockFormData} />);
    
    expect(screen.getByText('Source Location')).toBeInTheDocument();
    expect(screen.getByText('Line 15, Column 4')).toBeInTheDocument();
  });

  it('should not render source location when not available', () => {
    const noLocationFormData = {
      ...mockFormData,
      sourceLocation: undefined
    };

    render(<FunctionDetailsTab nodeId="test-node" formData={noLocationFormData} />);
    
    expect(screen.queryByText('Source Location')).not.toBeInTheDocument();
  });

  it('should render parent function when function is nested', () => {
    const nestedFormData = {
      ...mockFormData,
      isNested: true,
      parentFunction: 'parentCalculator'
    };

    render(<FunctionDetailsTab nodeId="test-node" formData={nestedFormData} />);
    
    expect(screen.getByText('Parent Function')).toBeInTheDocument();
    expect(screen.getByText('parentCalculator')).toBeInTheDocument();
  });

  it('should not render parent function when not nested', () => {
    render(<FunctionDetailsTab nodeId="test-node" formData={mockFormData} />);
    
    expect(screen.queryByText('Parent Function')).not.toBeInTheDocument();
  });

  it('should handle missing function name gracefully', () => {
    const noNameFormData = {
      ...mockFormData,
      functionName: undefined
    };

    render(<FunctionDetailsTab nodeId="test-node" formData={noNameFormData} />);
    
    expect(screen.getByText('Unnamed Function')).toBeInTheDocument();
  });

  it('should handle missing function description gracefully', () => {
    const noDescFormData = {
      ...mockFormData,
      functionDescription: undefined
    };

    render(<FunctionDetailsTab nodeId="test-node" formData={noDescFormData} />);
    
    expect(screen.getByText('Function Details')).toBeInTheDocument();
    expect(screen.queryByText('Description')).not.toBeInTheDocument();
  });

  it('should handle empty form data gracefully', () => {
    render(<FunctionDetailsTab nodeId="test-node" formData={{}} />);
    
    expect(screen.getByText('Function Details')).toBeInTheDocument();
    expect(screen.getByText('Unnamed Function')).toBeInTheDocument();
    expect(screen.getByText('Simple (0 connections)')).toBeInTheDocument();
  });

  it('should handle child nodes without function names', () => {
    const childrenWithoutNamesFormData = {
      ...mockFormData,
      childNodes: [
        {
          id: 'child1',
          label: 'Unnamed Child'
        },
        {
          id: 'child2'
          // No name or label
        }
      ]
    };

    render(<FunctionDetailsTab nodeId="test-node" formData={childrenWithoutNamesFormData} />);
    
    expect(screen.getByText('Child Functions (2)')).toBeInTheDocument();
    expect(screen.getByText('Unnamed Child')).toBeInTheDocument();
    expect(screen.getByText('Unnamed')).toBeInTheDocument();
  });
});