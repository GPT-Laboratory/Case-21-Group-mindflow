/** @format */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CleanNodeDisplay } from '../CleanNodeDisplay';

describe('CleanNodeDisplay', () => {
  describe('Essential Information Display', () => {
    it('should display function name as title', () => {
      render(
        <CleanNodeDisplay
          functionName="testFunction"
          functionDescription="A test function"
        />
      );

      expect(screen.getByText('testFunction')).toBeInTheDocument();
    });

    it('should fallback to label when no function name is provided', () => {
      render(
        <CleanNodeDisplay
          label="Test Label"
          functionDescription="A test function"
        />
      );

      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('should display "Unnamed Function" when neither function name nor label is provided', () => {
      render(
        <CleanNodeDisplay
          functionDescription="A test function"
        />
      );

      expect(screen.getByText('Unnamed Function')).toBeInTheDocument();
    });

    it('should display function description from block comments', () => {
      render(
        <CleanNodeDisplay
          functionName="testFunction"
          functionDescription="This function processes user input and returns validated data"
        />
      );

      expect(screen.getByText('This function processes user input and returns validated data')).toBeInTheDocument();
    });

    it('should not display description in compact mode', () => {
      render(
        <CleanNodeDisplay
          functionName="testFunction"
          functionDescription="This function processes user input"
          compact={true}
        />
      );

      expect(screen.queryByText('This function processes user input')).not.toBeInTheDocument();
    });
  });

  describe('Status Indicators', () => {
    it('should show processing badge when isProcessing is true', () => {
      render(
        <CleanNodeDisplay
          functionName="testFunction"
          isProcessing={true}
        />
      );

      expect(screen.getByText('Processing')).toBeInTheDocument();
    });

    it('should show error badge when hasError is true', () => {
      render(
        <CleanNodeDisplay
          functionName="testFunction"
          hasError={true}
        />
      );

      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should show complete badge when isCompleted is true', () => {
      render(
        <CleanNodeDisplay
          functionName="testFunction"
          isCompleted={true}
        />
      );

      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('should show nested badge when isNested is true', () => {
      render(
        <CleanNodeDisplay
          functionName="testFunction"
          isNested={true}
        />
      );

      expect(screen.getByText('Nested')).toBeInTheDocument();
    });

    it('should prioritize error over processing status', () => {
      render(
        <CleanNodeDisplay
          functionName="testFunction"
          isProcessing={true}
          hasError={true}
        />
      );

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.queryByText('Processing')).not.toBeInTheDocument();
    });
  });

  describe('Container Functionality', () => {
    it('should show child function count for containers', () => {
      const childNodes = [
        {
          id: 'child1',
          data: {
            functionName: 'childFunction1',
            functionDescription: 'First child function'
          }
        },
        {
          id: 'child2',
          data: {
            functionName: 'childFunction2',
            functionDescription: 'Second child function'
          }
        }
      ];

      render(
        <CleanNodeDisplay
          functionName="parentFunction"
          canContainChildren={true}
          childNodes={childNodes}
        />
      );

      expect(screen.getByText('Contains 2 functions')).toBeInTheDocument();
    });

    it('should show singular form for single child function', () => {
      const childNodes = [
        {
          id: 'child1',
          data: {
            functionName: 'childFunction1',
            functionDescription: 'Child function'
          }
        }
      ];

      render(
        <CleanNodeDisplay
          functionName="parentFunction"
          canContainChildren={true}
          childNodes={childNodes}
        />
      );

      expect(screen.getByText('Contains 1 function')).toBeInTheDocument();
    });

    it('should not show child count when node cannot contain children', () => {
      const childNodes = [
        {
          id: 'child1',
          data: {
            functionName: 'childFunction1'
          }
        }
      ];

      render(
        <CleanNodeDisplay
          functionName="testFunction"
          canContainChildren={false}
          childNodes={childNodes}
        />
      );

      expect(screen.queryByText(/Contains.*function/)).not.toBeInTheDocument();
    });
  });

  describe('Expandable Details', () => {
    it('should show details button when expandable content is available', () => {
      render(
        <CleanNodeDisplay
          functionName="testFunction"
          functionDescription="A test function"
          parameters={[{ name: 'param1', type: 'string' }]}
        />
      );

      expect(screen.getByText('Details')).toBeInTheDocument();
    });

    it('should not show details button in compact mode', () => {
      render(
        <CleanNodeDisplay
          functionName="testFunction"
          functionDescription="A test function"
          parameters={[{ name: 'param1', type: 'string' }]}
          compact={true}
        />
      );

      expect(screen.queryByText('Details')).not.toBeInTheDocument();
    });

    it('should expand and show detailed information when details button is clicked', async () => {
      const parameters = [
        { name: 'param1', type: 'string', defaultValue: '"default"' },
        { name: 'param2', type: 'number' }
      ];

      render(
        <CleanNodeDisplay
          functionName="testFunction"
          functionDescription="A detailed test function"
          parameters={parameters}
          externalDependencies={['lodash', 'axios']}
        />
      );

      // Click the details button
      fireEvent.click(screen.getByText('Details'));

      // Wait for expansion
      await waitFor(() => {
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getAllByText('A detailed test function')).toHaveLength(2); // One in main view, one in expanded
        expect(screen.getByText('Parameters')).toBeInTheDocument();
        expect(screen.getByText('param1')).toBeInTheDocument();
        expect(screen.getByText(': string')).toBeInTheDocument();
        expect(screen.getByText('= "default"')).toBeInTheDocument();
        expect(screen.getByText('param2')).toBeInTheDocument();
        expect(screen.getByText(': number')).toBeInTheDocument();
        expect(screen.getByText('Dependencies')).toBeInTheDocument();
        expect(screen.getByText('lodash')).toBeInTheDocument();
        expect(screen.getByText('axios')).toBeInTheDocument();
      });
    });

    it('should show child functions in expanded view for containers', async () => {
      const childNodes = [
        {
          id: 'child1',
          data: {
            functionName: 'childFunction1',
            functionDescription: 'First child function',
            label: 'Child 1'
          }
        },
        {
          id: 'child2',
          data: {
            functionName: 'childFunction2',
            functionDescription: 'Second child function',
            label: 'Child 2'
          }
        }
      ];

      render(
        <CleanNodeDisplay
          functionName="parentFunction"
          functionDescription="Parent function"
          canContainChildren={true}
          childNodes={childNodes}
        />
      );

      // Click the details button
      fireEvent.click(screen.getByText('Details'));

      // Wait for expansion
      await waitFor(() => {
        expect(screen.getByText('Child Functions (2)')).toBeInTheDocument();
        expect(screen.getByText('childFunction1')).toBeInTheDocument();
        expect(screen.getByText('First child function')).toBeInTheDocument();
        expect(screen.getByText('childFunction2')).toBeInTheDocument();
        expect(screen.getByText('Second child function')).toBeInTheDocument();
      });
    });

    it('should collapse when details button is clicked again', async () => {
      render(
        <CleanNodeDisplay
          functionName="testFunction"
          functionDescription="A test function"
          parameters={[{ name: 'param1', type: 'string' }]}
        />
      );

      // Expand
      fireEvent.click(screen.getByText('Details'));
      await waitFor(() => {
        expect(screen.getByText('Parameters')).toBeInTheDocument();
      });

      // Collapse
      fireEvent.click(screen.getByText('Details'));
      await waitFor(() => {
        expect(screen.queryByText('Parameters')).not.toBeInTheDocument();
      });
    });
  });

  describe('Parameter Display', () => {
    it('should display parameters with types and default values', async () => {
      const parameters = [
        { name: 'name', type: 'string', defaultValue: '"John"' },
        { name: 'age', type: 'number', defaultValue: '25' },
        { name: 'active', type: 'boolean' }
      ];

      render(
        <CleanNodeDisplay
          functionName="testFunction"
          parameters={parameters}
        />
      );

      fireEvent.click(screen.getByText('Details'));

      await waitFor(() => {
        expect(screen.getByText('name')).toBeInTheDocument();
        expect(screen.getByText(': string')).toBeInTheDocument();
        expect(screen.getByText('= "John"')).toBeInTheDocument();
        expect(screen.getByText('age')).toBeInTheDocument();
        expect(screen.getByText(': number')).toBeInTheDocument();
        expect(screen.getByText('= 25')).toBeInTheDocument();
        expect(screen.getByText('active')).toBeInTheDocument();
        expect(screen.getByText(': boolean')).toBeInTheDocument();
      });
    });

    it('should handle parameters without types or default values', async () => {
      const parameters = [
        { name: 'param1' },
        { name: 'param2', type: 'string' }
      ];

      render(
        <CleanNodeDisplay
          functionName="testFunction"
          parameters={parameters}
        />
      );

      fireEvent.click(screen.getByText('Details'));

      await waitFor(() => {
        expect(screen.getByText('param1')).toBeInTheDocument();
        expect(screen.getByText('param2')).toBeInTheDocument();
        expect(screen.getByText(': string')).toBeInTheDocument();
      });
    });
  });

  describe('External Dependencies', () => {
    it('should display external dependencies as badges', async () => {
      const dependencies = ['lodash', 'axios', 'react'];

      render(
        <CleanNodeDisplay
          functionName="testFunction"
          externalDependencies={dependencies}
        />
      );

      fireEvent.click(screen.getByText('Details'));

      await waitFor(() => {
        expect(screen.getByText('Dependencies')).toBeInTheDocument();
        expect(screen.getByText('lodash')).toBeInTheDocument();
        expect(screen.getByText('axios')).toBeInTheDocument();
        expect(screen.getByText('react')).toBeInTheDocument();
      });
    });

    it('should not show dependencies section when no dependencies exist', async () => {
      render(
        <CleanNodeDisplay
          functionName="testFunction"
          functionDescription="A test function"
        />
      );

      fireEvent.click(screen.getByText('Details'));

      await waitFor(() => {
        expect(screen.queryByText('Dependencies')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for interactive elements', () => {
      render(
        <CleanNodeDisplay
          functionName="testFunction"
          functionDescription="A test function"
        />
      );

      const detailsButton = screen.getByRole('button');
      expect(detailsButton).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(
        <CleanNodeDisplay
          functionName="testFunction"
          functionDescription="A test function"
        />
      );

      const detailsButton = screen.getByRole('button');
      detailsButton.focus();
      expect(detailsButton).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty child nodes array', () => {
      render(
        <CleanNodeDisplay
          functionName="testFunction"
          canContainChildren={true}
          childNodes={[]}
        />
      );

      expect(screen.queryByText(/Contains.*function/)).not.toBeInTheDocument();
    });

    it('should handle child nodes without function names', async () => {
      const childNodes = [
        {
          id: 'child1',
          data: {
            label: 'Child Label Only'
          }
        },
        {
          id: 'child2',
          data: {
            functionName: 'namedChild'
          }
        }
      ];

      render(
        <CleanNodeDisplay
          functionName="parentFunction"
          canContainChildren={true}
          childNodes={childNodes}
        />
      );

      fireEvent.click(screen.getByText('Details'));

      await waitFor(() => {
        expect(screen.getByText('Child Label Only')).toBeInTheDocument();
        expect(screen.getByText('namedChild')).toBeInTheDocument();
      });
    });

    it('should handle very long descriptions with proper truncation', () => {
      const longDescription = 'This is a very long function description that should be truncated in the main view but shown in full in the expanded details section. It contains multiple sentences and detailed explanations about what the function does and how it works.';

      render(
        <CleanNodeDisplay
          functionName="testFunction"
          functionDescription={longDescription}
        />
      );

      // The description should be visible but truncated with line-clamp-2
      const descriptionElement = screen.getByText(longDescription);
      expect(descriptionElement).toBeInTheDocument();
      expect(descriptionElement).toHaveClass('line-clamp-2');
    });
  });
});