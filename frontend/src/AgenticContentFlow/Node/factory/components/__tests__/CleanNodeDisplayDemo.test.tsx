/** @format */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CleanNodeDisplay } from '../CleanNodeDisplay';

describe('CleanNodeDisplay Demo', () => {
  describe('Real AST Data Scenarios', () => {
    it('should display a function with block comment description', () => {
      // Simulating data that would come from AST parsing
      const astData = {
        functionName: 'calculateTotalPrice',
        functionDescription: 'Calculates the total price including tax and discounts for a given product',
        parameters: [
          { name: 'basePrice', type: 'number' },
          { name: 'taxRate', type: 'number', defaultValue: '0.08' },
          { name: 'discount', type: 'number', defaultValue: '0' }
        ],
        externalDependencies: ['Math'],
        isNested: false
      };

      render(
        <div style={{ width: 200, height: 150 }}>
          <CleanNodeDisplay
            functionName={astData.functionName}
            functionDescription={astData.functionDescription}
            parameters={astData.parameters}
            externalDependencies={astData.externalDependencies}
            isNested={astData.isNested}
          />
        </div>
      );

      // Essential information should be visible
      expect(screen.getByText('calculateTotalPrice')).toBeInTheDocument();
      expect(screen.getByText('Calculates the total price including tax and discounts for a given product')).toBeInTheDocument();
      
      // Details button should be available
      expect(screen.getByText('Details')).toBeInTheDocument();
    });

    it('should show nested function with proper indicators', () => {
      const nestedFunctionData = {
        functionName: 'validateInput',
        functionDescription: 'Validates user input before processing',
        parameters: [
          { name: 'input', type: 'string' }
        ],
        isNested: true,
        isProcessing: true
      };

      render(
        <div style={{ width: 200, height: 150 }}>
          <CleanNodeDisplay
            functionName={nestedFunctionData.functionName}
            functionDescription={nestedFunctionData.functionDescription}
            parameters={nestedFunctionData.parameters}
            isNested={nestedFunctionData.isNested}
            isProcessing={nestedFunctionData.isProcessing}
          />
        </div>
      );

      expect(screen.getByText('validateInput')).toBeInTheDocument();
      expect(screen.getByText('Nested')).toBeInTheDocument();
      expect(screen.getByText('Processing')).toBeInTheDocument();
    });

    it('should display container function with child functions', async () => {
      const containerData = {
        functionName: 'userManagement',
        functionDescription: 'Main user management module containing user operations',
        canContainChildren: true,
        childNodes: [
          {
            id: 'child-1',
            data: {
              functionName: 'createUser',
              functionDescription: 'Creates a new user account'
            }
          },
          {
            id: 'child-2',
            data: {
              functionName: 'deleteUser',
              functionDescription: 'Deletes an existing user account'
            }
          },
          {
            id: 'child-3',
            data: {
              functionName: 'updateUser',
              functionDescription: 'Updates user account information'
            }
          }
        ]
      };

      render(
        <div style={{ width: 250, height: 200 }}>
          <CleanNodeDisplay
            functionName={containerData.functionName}
            functionDescription={containerData.functionDescription}
            canContainChildren={containerData.canContainChildren}
            childNodes={containerData.childNodes}
          />
        </div>
      );

      // Should show child count
      expect(screen.getByText('Contains 3 functions')).toBeInTheDocument();

      // Expand to see child details
      fireEvent.click(screen.getByText('Details'));

      await waitFor(() => {
        expect(screen.getByText('Child Functions (3)')).toBeInTheDocument();
        expect(screen.getByText('createUser')).toBeInTheDocument();
        expect(screen.getByText('Creates a new user account')).toBeInTheDocument();
        expect(screen.getByText('deleteUser')).toBeInTheDocument();
        expect(screen.getByText('Deletes an existing user account')).toBeInTheDocument();
        expect(screen.getByText('updateUser')).toBeInTheDocument();
        expect(screen.getByText('Updates user account information')).toBeInTheDocument();
      });
    });

    it('should handle complex function with all features', async () => {
      const complexFunctionData = {
        functionName: 'processPayment',
        functionDescription: 'Processes payment transactions with validation, fraud detection, and receipt generation',
        parameters: [
          { name: 'paymentData', type: 'PaymentRequest' },
          { name: 'options', type: 'ProcessingOptions', defaultValue: '{ timeout: 30000 }' },
          { name: 'callback', type: 'function' }
        ],
        externalDependencies: ['stripe', 'validator', 'crypto'],
        isNested: false,
        isCompleted: true
      };

      render(
        <div style={{ width: 300, height: 250 }}>
          <CleanNodeDisplay
            functionName={complexFunctionData.functionName}
            functionDescription={complexFunctionData.functionDescription}
            parameters={complexFunctionData.parameters}
            externalDependencies={complexFunctionData.externalDependencies}
            isNested={complexFunctionData.isNested}
            isCompleted={complexFunctionData.isCompleted}
          />
        </div>
      );

      // Essential info
      expect(screen.getByText('processPayment')).toBeInTheDocument();
      expect(screen.getByText('Processes payment transactions with validation, fraud detection, and receipt generation')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();

      // Expand for full details
      fireEvent.click(screen.getByText('Details'));

      await waitFor(() => {
        // Parameters
        expect(screen.getByText('Parameters')).toBeInTheDocument();
        expect(screen.getByText('paymentData')).toBeInTheDocument();
        expect(screen.getByText(': PaymentRequest')).toBeInTheDocument();
        expect(screen.getByText('options')).toBeInTheDocument();
        expect(screen.getByText('= { timeout: 30000 }')).toBeInTheDocument();
        expect(screen.getByText('callback')).toBeInTheDocument();
        expect(screen.getByText(': function')).toBeInTheDocument();

        // Dependencies
        expect(screen.getByText('Dependencies')).toBeInTheDocument();
        expect(screen.getByText('stripe')).toBeInTheDocument();
        expect(screen.getByText('validator')).toBeInTheDocument();
        expect(screen.getByText('crypto')).toBeInTheDocument();
      });
    });

    it('should work in compact mode for small nodes', () => {
      const compactData = {
        functionName: 'helper',
        functionDescription: 'A small helper function',
        parameters: [{ name: 'value', type: 'any' }],
        compact: true
      };

      render(
        <div style={{ width: 120, height: 80 }}>
          <CleanNodeDisplay
            functionName={compactData.functionName}
            functionDescription={compactData.functionDescription}
            parameters={compactData.parameters}
            compact={compactData.compact}
          />
        </div>
      );

      // Should show function name
      expect(screen.getByText('helper')).toBeInTheDocument();
      
      // Should not show description in compact mode
      expect(screen.queryByText('A small helper function')).not.toBeInTheDocument();
      
      // Should not show details button in compact mode
      expect(screen.queryByText('Details')).not.toBeInTheDocument();
    });
  });

  describe('Requirements Compliance', () => {
    it('should display only function description and title by default (Requirement 9.1)', () => {
      render(
        <CleanNodeDisplay
          functionName="exampleFunction"
          functionDescription="Example function description from block comment"
        />
      );

      // Only essential information should be visible by default
      expect(screen.getByText('exampleFunction')).toBeInTheDocument();
      expect(screen.getByText('Example function description from block comment')).toBeInTheDocument();
      
      // Detailed information should not be visible until expanded
      expect(screen.queryByText('Parameters')).not.toBeInTheDocument();
      expect(screen.queryByText('Dependencies')).not.toBeInTheDocument();
    });

    it('should use block comments as node descriptions and titles (Requirement 9.2)', () => {
      // This simulates how the AST parser would extract block comments
      const blockCommentData = {
        functionName: 'authenticateUser',
        functionDescription: 'Authenticates a user with email and password\n\nValidates credentials against the database and returns a JWT token\nif authentication is successful.',
      };

      render(
        <CleanNodeDisplay
          functionName={blockCommentData.functionName}
          functionDescription={blockCommentData.functionDescription}
        />
      );

      expect(screen.getByText('authenticateUser')).toBeInTheDocument();
      expect(screen.getByText(/Authenticates a user with email and password/)).toBeInTheDocument();
    });

    it('should create expandable views for detailed information (Requirement 9.3)', async () => {
      render(
        <CleanNodeDisplay
          functionName="detailedFunction"
          functionDescription="Function with detailed information"
          parameters={[{ name: 'param1', type: 'string' }]}
          externalDependencies={['lodash']}
        />
      );

      // Initially, detailed info should not be visible
      expect(screen.queryByText('Parameters')).not.toBeInTheDocument();
      expect(screen.queryByText('Dependencies')).not.toBeInTheDocument();

      // Click to expand
      fireEvent.click(screen.getByText('Details'));

      // Now detailed info should be visible
      await waitFor(() => {
        expect(screen.getByText('Parameters')).toBeInTheDocument();
        expect(screen.getByText('Dependencies')).toBeInTheDocument();
        expect(screen.getByText('param1')).toBeInTheDocument();
        expect(screen.getByText('lodash')).toBeInTheDocument();
      });
    });
  });
});