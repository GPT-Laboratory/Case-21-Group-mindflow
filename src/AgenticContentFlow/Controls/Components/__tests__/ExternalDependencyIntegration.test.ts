/** @format */

import { describe, it, expect } from 'vitest';
import { flowGenerator } from '../../../AST/services/FlowGenerator';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('External Dependency Integration', () => {
  it('should properly handle external dependencies in imported JavaScript files', () => {
    // Read the test file
    const testFilePath = join(process.cwd(), 'test-external-deps.js');
    const testCode = readFileSync(testFilePath, 'utf8');

    // Generate flow from the test code
    const flow = flowGenerator.generateFlow(testCode, 'test-external-deps.js');
    
    expect(flow).toBeDefined();
    expect(flow.name).toBe('External Dependencies Test');
    expect(flow.description).toBe('Test file with various external dependencies');
    
    // Should have function nodes
    const functionNodes = flow.nodes.filter(node => node.type === 'functionnode');
    expect(functionNodes.length).toBeGreaterThan(0);
    
    // Should have external dependency child nodes
    const externalNodes = flow.nodes.filter(node => node.type === 'childnode');
    expect(externalNodes.length).toBeGreaterThan(0);
    
    // Should have edges connecting functions to external dependencies
    expect(flow.edges.length).toBeGreaterThan(0);
    
    // Check for specific external dependencies
    const externalNodeLabels = externalNodes.map(node => node.data.label);
    
    // Should detect built-in functions
    expect(externalNodeLabels).toContain('console.log');
    expect(externalNodeLabels).toContain('JSON.stringify');
    expect(externalNodeLabels).toContain('Math.max');
    
    // Should detect imports
    expect(externalNodeLabels.some(label => label.includes('React') || label.includes('useState') || label.includes('axios'))).toBe(true);
    
    // Should detect require statements
    expect(externalNodeLabels.some(label => label.includes('fs') || label.includes('path'))).toBe(true);
  });

  it('should categorize external dependencies correctly', () => {
    const testCode = `
      function testFunction() {
        // Built-in functions
        console.log('test');
        Math.random();
        
        // Browser APIs
        fetch('/api/data');
        localStorage.getItem('key');
        
        // Node.js built-ins
        require('fs');
        require('path');
        
        // External libraries
        require('lodash');
        require('express');
      }
    `;

    const flow = flowGenerator.generateFlow(testCode, 'categorization-test.js');
    const externalNodes = flow.nodes.filter(node => node.type === 'childnode');
    
    expect(externalNodes.length).toBeGreaterThan(0);
    
    // Check that built-in status is properly set
    const builtInNodes = externalNodes.filter(node => node.data.isBuiltIn === true);
    
    expect(builtInNodes.length).toBeGreaterThan(0);
    expect(externalNodes.length).toBeGreaterThan(0);
    
    // Verify that we're detecting different types of external dependencies
    const dependencyTypes = externalNodes.map(node => node.data.dependencyType);
    expect(dependencyTypes).toContain('function_call');
  });
});