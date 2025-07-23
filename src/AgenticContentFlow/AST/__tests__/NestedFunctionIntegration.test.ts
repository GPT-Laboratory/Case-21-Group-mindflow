/** @format */

import { ASTParserService } from '../ASTParserService';
import { NestedFunctionProcessor } from '../services/NestedFunctionProcessor';

describe('Nested Function Integration', () => {
  let astParser: ASTParserService;
  let nestedProcessor: NestedFunctionProcessor;

  beforeEach(() => {
    astParser = new ASTParserService();
    nestedProcessor = new NestedFunctionProcessor();
  });

  describe('End-to-End Nested Function Processing', () => {
    it('should parse and create nodes for simple nested functions', () => {
      const code = `
        /**
         * Main function that contains nested functions
         */
        function mainFunction(x) {
          /**
           * Helper function nested inside main
           */
          function helperFunction(y) {
            return y * 2;
          }
          
          return helperFunction(x) + 1;
        }
      `;

      // Parse the code
      const parsedFile = astParser.parseFile(code);
      
      // Verify parsing results
      expect(parsedFile.functions).toHaveLength(2);
      
      const mainFunc = parsedFile.functions.find(f => f.name === 'mainFunction');
      const helperFunc = parsedFile.functions.find(f => f.name === 'helperFunction');
      
      expect(mainFunc).toBeDefined();
      expect(helperFunc).toBeDefined();
      expect(mainFunc?.isNested).toBe(false);
      expect(helperFunc?.isNested).toBe(true);
      expect(helperFunc?.parentFunction).toBe(mainFunc?.id);

      // Create nodes from parsed structure
      const { nodes, relationships } = nestedProcessor.createNodesFromParsedFile(parsedFile);
      
      expect(nodes).toHaveLength(2);
      expect(relationships).toHaveLength(1);

      const mainNode = nodes.find(n => n.data.functionName === 'mainFunction');
      const helperNode = nodes.find(n => n.data.functionName === 'helperFunction');

      // Verify node structure
      expect(mainNode?.canContainChildren).toBe(true);
      expect(mainNode?.childNodeIds).toContain(helperNode?.id);
      expect(helperNode?.parentId).toBe(mainNode?.id);
      expect(helperNode?.depth).toBe(1);

      // Verify relationship
      const relationship = relationships[0];
      expect(relationship.relationshipType).toBe('nested_function');
      expect(relationship.parentId).toBe(mainNode?.id);
      expect(relationship.childId).toBe(helperNode?.id);
    });

    it('should handle multiple levels of nesting', () => {
      const code = `
        /**
         * Outer function
         */
        function outerFunction() {
          /**
           * Middle function
           */
          function middleFunction() {
            /**
             * Inner function
             */
            function innerFunction() {
              return 'deeply nested';
            }
            
            return innerFunction();
          }
          
          return middleFunction();
        }
      `;

      const parsedFile = astParser.parseFile(code);
      const { nodes, relationships } = nestedProcessor.createNodesFromParsedFile(parsedFile);

      expect(nodes).toHaveLength(3);
      expect(relationships).toHaveLength(2);

      const outerNode = nodes.find(n => n.data.functionName === 'outerFunction');
      const middleNode = nodes.find(n => n.data.functionName === 'middleFunction');
      const innerNode = nodes.find(n => n.data.functionName === 'innerFunction');

      // Verify hierarchy
      expect(outerNode?.depth).toBe(0);
      expect(middleNode?.depth).toBe(1);
      expect(innerNode?.depth).toBe(2);

      // Verify parent-child relationships
      expect(outerNode?.childNodeIds).toContain(middleNode?.id);
      expect(middleNode?.childNodeIds).toContain(innerNode?.id);
      expect(middleNode?.parentId).toBe(outerNode?.id);
      expect(innerNode?.parentId).toBe(middleNode?.id);

      // Verify scope levels
      expect(outerNode?.scope?.level).toBe(0);
      expect(middleNode?.scope?.level).toBe(1);
      expect(innerNode?.scope?.level).toBe(2);
    });

    it('should handle multiple nested functions at the same level', () => {
      const code = `
        /**
         * Container function with multiple helpers
         */
        function containerFunction(data) {
          /**
           * First helper function
           */
          function helper1(x) {
            return x + 1;
          }
          
          /**
           * Second helper function
           */
          function helper2(x) {
            return x * 2;
          }
          
          /**
           * Third helper function
           */
          function helper3(x) {
            return x - 1;
          }
          
          return helper1(helper2(helper3(data)));
        }
      `;

      const parsedFile = astParser.parseFile(code);
      const { nodes, relationships } = nestedProcessor.createNodesFromParsedFile(parsedFile);

      expect(nodes).toHaveLength(4);
      expect(relationships).toHaveLength(3);

      const containerNode = nodes.find(n => n.data.functionName === 'containerFunction');
      const helper1Node = nodes.find(n => n.data.functionName === 'helper1');
      const helper2Node = nodes.find(n => n.data.functionName === 'helper2');
      const helper3Node = nodes.find(n => n.data.functionName === 'helper3');

      // Verify container has all helpers as children
      expect(containerNode?.childNodeIds).toHaveLength(3);
      expect(containerNode?.childNodeIds).toContain(helper1Node?.id);
      expect(containerNode?.childNodeIds).toContain(helper2Node?.id);
      expect(containerNode?.childNodeIds).toContain(helper3Node?.id);

      // Verify all helpers have same parent and depth
      [helper1Node, helper2Node, helper3Node].forEach(helperNode => {
        expect(helperNode?.parentId).toBe(containerNode?.id);
        expect(helperNode?.depth).toBe(1);
        expect(helperNode?.scope?.level).toBe(1);
      });
    });

    it('should handle arrow functions and function expressions', () => {
      const code = `
        /**
         * Main function with various nested function types
         */
        function mainFunction() {
          /**
           * Regular nested function
           */
          function regularNested() {
            return 'regular';
          }
          
          // Arrow function (anonymous, will be detected as nested)
          const arrowNested = () => {
            return 'arrow';
          };
          
          // Function expression
          const expressionNested = function() {
            return 'expression';
          };
          
          return regularNested() + arrowNested() + expressionNested();
        }
      `;

      const parsedFile = astParser.parseFile(code);
      
      // Should detect the main function and the regular nested function
      // Arrow functions and function expressions may be detected depending on AST parser implementation
      expect(parsedFile.functions.length).toBeGreaterThanOrEqual(2);
      
      const mainFunc = parsedFile.functions.find(f => f.name === 'mainFunction');
      expect(mainFunc).toBeDefined();
      expect(mainFunc?.isNested).toBe(false);

      // Check for nested functions
      const nestedFunctions = parsedFile.functions.filter(f => f.isNested);
      expect(nestedFunctions.length).toBeGreaterThanOrEqual(1);

      const { nodes, relationships } = nestedProcessor.createNodesFromParsedFile(parsedFile);
      
      expect(nodes.length).toBe(parsedFile.functions.length);
      expect(relationships.length).toBe(nestedFunctions.length);
    });

    it('should preserve function descriptions from comments', () => {
      const code = `
        /**
         * This is the main processing function
         * It handles all the complex logic
         */
        function processData(input) {
          /**
           * Helper function to validate input
           * Returns true if input is valid
           */
          function validateInput(data) {
            return data != null;
          }
          
          return validateInput(input) ? input : null;
        }
      `;

      const parsedFile = astParser.parseFile(code);
      const { nodes } = nestedProcessor.createNodesFromParsedFile(parsedFile);

      const mainNode = nodes.find(n => n.data.functionName === 'processData');
      const helperNode = nodes.find(n => n.data.functionName === 'validateInput');

      expect(mainNode?.data.functionDescription).toContain('main processing function');
      expect(helperNode?.data.functionDescription).toContain('validate input');
    });

    it('should handle complex nested structures with parameters and scoping', () => {
      const code = `
        /**
         * Calculator with nested operations
         */
        function calculator(a, b) {
          /**
           * Addition operation
           */
          function add(x, y) {
            return x + y;
          }
          
          /**
           * Multiplication with nested helper
           */
          function multiply(x, y) {
            /**
             * Helper to validate numbers
             */
            function isNumber(val) {
              return typeof val === 'number';
            }
            
            return isNumber(x) && isNumber(y) ? x * y : 0;
          }
          
          return add(a, b) + multiply(a, b);
        }
      `;

      const parsedFile = astParser.parseFile(code);
      const { nodes, relationships } = nestedProcessor.createNodesFromParsedFile(parsedFile);

      expect(nodes).toHaveLength(4);
      expect(relationships).toHaveLength(3);

      const calculatorNode = nodes.find(n => n.data.functionName === 'calculator');
      const addNode = nodes.find(n => n.data.functionName === 'add');
      const multiplyNode = nodes.find(n => n.data.functionName === 'multiply');
      const isNumberNode = nodes.find(n => n.data.functionName === 'isNumber');

      // Verify parameter scoping
      expect(calculatorNode?.scope?.variables).toEqual(['a', 'b']);
      expect(addNode?.scope?.variables).toEqual(['x', 'y']);
      expect(multiplyNode?.scope?.variables).toEqual(['x', 'y']);
      expect(isNumberNode?.scope?.variables).toEqual(['val']);

      // Verify nesting structure
      expect(calculatorNode?.childNodeIds).toContain(addNode?.id);
      expect(calculatorNode?.childNodeIds).toContain(multiplyNode?.id);
      expect(multiplyNode?.childNodeIds).toContain(isNumberNode?.id);

      // Verify depths
      expect(calculatorNode?.depth).toBe(0);
      expect(addNode?.depth).toBe(1);
      expect(multiplyNode?.depth).toBe(1);
      expect(isNumberNode?.depth).toBe(2);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle code with syntax errors gracefully', () => {
      const invalidCode = `
        function validFunction() {
          return 'valid';
        }
        
        function invalidFunction( {
          // Missing closing parenthesis
          return 'invalid';
        }
      `;

      expect(() => {
        astParser.parseFile(invalidCode);
      }).toThrow();
    });

    it('should handle empty functions', () => {
      const code = `
        function emptyFunction() {
          function emptyNested() {
          }
        }
      `;

      const parsedFile = astParser.parseFile(code);
      const { nodes, relationships } = nestedProcessor.createNodesFromParsedFile(parsedFile);

      expect(nodes).toHaveLength(2);
      expect(relationships).toHaveLength(1);

      const parentNode = nodes.find(n => n.data.functionName === 'emptyFunction');
      const childNode = nodes.find(n => n.data.functionName === 'emptyNested');

      expect(parentNode?.childNodeIds).toContain(childNode?.id);
      expect(childNode?.parentId).toBe(parentNode?.id);
    });

    it('should validate the created node structure', () => {
      const code = `
        function parent() {
          function child() {
            return 'child';
          }
        }
      `;

      const parsedFile = astParser.parseFile(code);
      const { nodes } = nestedProcessor.createNodesFromParsedFile(parsedFile);

      const validation = nestedProcessor.validateNestedStructure(nodes);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });
});