import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { FlowGenerator } from '../services/FlowGenerator';

describe('CallExtractor Internal Function Call Fix', () => {
  let flowGenerator: FlowGenerator;

  beforeEach(() => {
    flowGenerator = new FlowGenerator();
  });

  it('should create edges for internal function calls in stringStatsStandard.js', () => {
    // Read the test file
    const testFilePath = path.join(process.cwd(), 'stringStatsStandard.js');
    const code = fs.readFileSync(testFilePath, 'utf8');

    // Generate flow
    const flow = flowGenerator.generateFlow(code, 'stringStatsStandard.js');

    // Get function nodes
    const functionNodes = flow.nodes.filter(n => n.type === 'functionnode');
    const functionNames = functionNodes.map(n => n.data.functionName);

    // Verify all expected functions are present
    expect(functionNames).toContain('sanitizeString');
    expect(functionNames).toContain('countWords');
    expect(functionNames).toContain('sumWordLengths');
    expect(functionNames).toContain('averageWordLength');

    // Check that we have edges (internal function calls)
    expect(flow.edges.length).toBeGreaterThan(0);

    // Create a map of function ID to name for easier edge verification
    const idToName = new Map();
    functionNodes.forEach(node => {
      idToName.set(node.id, node.data.functionName);
    });

    // Verify that edges use actual node IDs, not function names
    flow.edges.forEach(edge => {
      expect(edge.source).toMatch(/^[a-zA-Z]+_[a-zA-Z]+_\d+_\d+_[a-z0-9]+$/);
      expect(edge.target).toMatch(/^[a-zA-Z]+_[a-zA-Z]+_\d+_\d+_[a-z0-9]+$/);
    });

    // Convert edges to readable format for verification
    const edgeRelationships = flow.edges.map(edge => ({
      from: idToName.get(edge.source) || edge.source,
      to: idToName.get(edge.target) || edge.target,
      sourceId: edge.source,
      targetId: edge.target
    }));

    // Verify expected internal function call relationships
    const expectedRelationships = [
      { from: 'countWords', to: 'sanitizeString' },
      { from: 'sumWordLengths', to: 'sanitizeString' },
      { from: 'averageWordLength', to: 'countWords' },
      { from: 'averageWordLength', to: 'sumWordLengths' }
    ];

    expectedRelationships.forEach(expected => {
      const found = edgeRelationships.some(edge => 
        edge.from === expected.from && edge.to === expected.to
      );
      expect(found).toBe(true, 
        `Expected edge from ${expected.from} to ${expected.to} not found. ` +
        `Available edges: ${JSON.stringify(edgeRelationships)}`
      );
    });

    // Verify that internal function calls are NOT creating child nodes
    const childNodes = flow.nodes.filter(n => n.type === 'childnode');
    const internalFunctionNames = ['sanitizeString', 'countWords', 'sumWordLengths', 'averageWordLength'];
    
    childNodes.forEach(childNode => {
      expect(internalFunctionNames).not.toContain(childNode.data.functionName);
    });

    console.log('✅ Test Results:');
    console.log(`Functions found: ${functionNames.join(', ')}`);
    console.log(`Edges created: ${flow.edges.length}`);
    console.log('Edge relationships:', edgeRelationships);
    console.log(`Child nodes (external calls): ${childNodes.length}`);
  });

  it('should still create child nodes for external function calls', () => {
    // Read the test file
    const testFilePath = path.join(process.cwd(), 'stringStatsStandard.js');
    const code = fs.readFileSync(testFilePath, 'utf8');

    // Generate flow
    const flow = flowGenerator.generateFlow(code, 'stringStatsStandard.js');

    // Check that external calls still create child nodes
    const childNodes = flow.nodes.filter(n => n.type === 'childnode');
    expect(childNodes.length).toBeGreaterThan(0);

    // Verify that 'log' function calls create child nodes (external import)
    const logChildNodes = childNodes.filter(n => n.data.functionName === 'log');
    expect(logChildNodes.length).toBeGreaterThan(0);

    console.log('External function child nodes:', 
      childNodes.map(n => n.data.functionName)
    );
  });
});