/** @format */

import { describe, it, expect } from 'vitest';
import { flowGenerator } from '../../services/FlowGenerator';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('External Dependency Integration', () => {
  it('should properly handle external dependencies in imported JavaScript files', () => {
    // Create a test file content inline instead of reading from file system
    const testCode = `
      /**
       * @title External Dependencies Test
       * @description Test file with various external dependencies
       */

      // Import statements
      import React from 'react';
      import { useState, useEffect } from 'react';
      import axios from 'axios';

      // Require statements
      const fs = require('fs');
      const path = require('path');

      function processData(data) {
        // Built-in function calls
        console.log('Processing data:', data);
        JSON.stringify(data);
        
        // Math operations
        const result = Math.max(...data);
        
        // External library calls
        axios.get('/api/data').then(response => {
          console.log('Response:', response.data);
        });
        
        return result;
      }

      function fileOperations() {
        // Node.js built-in module usage
        const filePath = path.join(__dirname, 'data.txt');
        fs.readFileSync(filePath, 'utf8');
        
        // Browser APIs
        if (typeof window !== 'undefined') {
          localStorage.setItem('key', 'value');
          fetch('/api/endpoint');
        }
      }

      function main() {
        const data = [1, 2, 3, 4, 5];
        const result = processData(data);
        fileOperations();
        return result;
      }
    `;

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