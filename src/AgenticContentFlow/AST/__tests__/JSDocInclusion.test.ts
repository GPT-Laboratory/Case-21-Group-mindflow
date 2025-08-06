import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { FlowGenerator } from '../services/FlowGenerator';
import { useCodeStore } from '../../../stores/codeStore';

describe('JSDoc Inclusion in Function Code', () => {
  let flowGenerator: FlowGenerator;

  beforeEach(() => {
    flowGenerator = new FlowGenerator();
    // Clear the code store before each test
    useCodeStore.getState().clearAll();
  });

  it('should include JSDoc comments in function code for stringStatsStandard.js', () => {
    // Read the test file
    const testFilePath = path.join(process.cwd(), 'stringStatsStandard.js');
    const code = fs.readFileSync(testFilePath, 'utf8');

    // Generate flow
    const flow = flowGenerator.generateFlow(code, 'stringStatsStandard.js');

    // Get function nodes
    const functionNodes = flow.nodes.filter(n => n.type === 'functionnode');
    expect(functionNodes.length).toBeGreaterThan(0);

    // Get the code store
    const codeStore = useCodeStore.getState();

    // Test a specific function - let's check sanitizeString
    const sanitizeStringNode = functionNodes.find(n => n.data.functionName === 'sanitizeString');
    expect(sanitizeStringNode).toBeDefined();

    if (sanitizeStringNode) {
      // Get the function code from the code store
      const functionCode = codeStore.getFunctionCode(sanitizeStringNode.id);
      expect(functionCode).toBeDefined();

      if (functionCode) {
        console.log('Function code for sanitizeString:');
        console.log('=====================================');
        console.log(functionCode);
        console.log('=====================================');

        // Verify that JSDoc comments are included
        expect(functionCode).toContain('@title sanitizeString');
        expect(functionCode).toContain('@description Removes punctuation and converts a string to lowercase');
        expect(functionCode).toContain('@param {string} str - The input string to sanitize');
        expect(functionCode).toContain('@returns {string} - The sanitized string');
        
        // Verify that the function declaration is also included
        expect(functionCode).toContain('function sanitizeString(str)');
        expect(functionCode).toContain('str.replace(/[^\\w\\s]|_/g, \'\').toLowerCase().trim()');
      }
    }

    // Test another function - countWords
    const countWordsNode = functionNodes.find(n => n.data.functionName === 'countWords');
    expect(countWordsNode).toBeDefined();

    if (countWordsNode) {
      const functionCode = codeStore.getFunctionCode(countWordsNode.id);
      expect(functionCode).toBeDefined();

      if (functionCode) {
        console.log('Function code for countWords:');
        console.log('=====================================');
        console.log(functionCode);
        console.log('=====================================');

        // Verify JSDoc is included
        expect(functionCode).toContain('@title countWords');
        expect(functionCode).toContain('@description Counts the number of words in a string');
        expect(functionCode).toContain('function countWords(str, delimiter = defaultDelimiter)');
      }
    }
  });

  it('should handle functions without JSDoc comments gracefully', () => {
    // Create a simple test code without JSDoc
    const testCode = `
function simpleFunction() {
  return 'hello';
}

const arrowFunction = () => {
  return 'world';
};
`;

    // Generate flow
    const flow = flowGenerator.generateFlow(testCode, 'test.js');
    const functionNodes = flow.nodes.filter(n => n.type === 'functionnode');
    
    expect(functionNodes.length).toBeGreaterThan(0);

    // Get the code store
    const codeStore = useCodeStore.getState();

    // Test the simple function
    const simpleFunctionNode = functionNodes.find(n => n.data.functionName === 'simpleFunction');
    if (simpleFunctionNode) {
      const functionCode = codeStore.getFunctionCode(simpleFunctionNode.id);
      expect(functionCode).toBeDefined();
      
      if (functionCode) {
        // Should contain the function but no JSDoc
        expect(functionCode).toContain('function simpleFunction()');
        expect(functionCode).toContain('return \'hello\'');
        expect(functionCode).not.toContain('@title');
        expect(functionCode).not.toContain('@description');
      }
    }
  });
});