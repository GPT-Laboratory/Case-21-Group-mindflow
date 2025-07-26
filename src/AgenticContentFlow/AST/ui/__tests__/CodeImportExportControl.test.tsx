/** @format */

import { describe, it, expect } from 'vitest';
import { flowGenerator } from '../../services/FlowGenerator';

describe('CodeImportExportControl Integration', () => {
  it('should be able to generate flow from JavaScript code', () => {
    const testCode = `
      /**
       * @title Test Module
       * @description A simple test module
       */
      
      function greet(name) {
        return 'Hello ' + name;
      }
      
      function main() {
        const result = greet('World');
        console.log(result);
        return result;
      }
    `;

    const flow = flowGenerator.generateFlow(testCode, 'test.js');
    
    expect(flow).toBeDefined();
    expect(flow.nodes).toBeDefined();
    expect(flow.edges).toBeDefined();
    expect(flow.nodes.length).toBeGreaterThan(0);
    expect(flow.name).toBe('Test Module');
  });

  it('should handle JavaScript files with external dependencies', () => {
    const testCode = `
      function processData(data) {
        // External dependency calls
        console.log('Processing:', data);
        JSON.stringify(data);
        return data.map(item => item.value);
      }
    `;

    const flow = flowGenerator.generateFlow(testCode, 'processor.js');
    
    expect(flow).toBeDefined();
    expect(flow.nodes).toBeDefined();
    expect(flow.nodes.length).toBeGreaterThan(0);
    
    // Should have function node and potentially child nodes for external dependencies
    const functionNodes = flow.nodes.filter(node => node.type === 'functionnode');
    expect(functionNodes.length).toBeGreaterThan(0);
  });
});