/** @format */

import { describe, it, expect } from 'vitest';
import { FlowGenerator } from '../FlowGenerator';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Flow Generation Demo', () => {
  it('should successfully generate flows from the example JavaScript files', () => {
    const generator = new FlowGenerator();
    
    // Read the actual example files
    const loggerPath = join(process.cwd(), '.kiro/specs/direct-function-calling-architecture/example/logger.js');
    const stringStatsPath = join(process.cwd(), '.kiro/specs/direct-function-calling-architecture/example/stringStatsStandard.js');
    
    const loggerCode = readFileSync(loggerPath, 'utf8');
    const stringStatsCode = readFileSync(stringStatsPath, 'utf8');

    // Generate flows
    const flows = generator.generateFlows([
      { code: stringStatsCode, fileName: 'stringStatsStandard.js' },
      { code: loggerCode, fileName: 'logger.js' }
    ]);

    // Verify we got 2 flows
    expect(flows).toHaveLength(2);

    // Verify StringStats flow
    const stringStatsFlow = flows[0];
    expect(stringStatsFlow.name).toBe('String Statistics with Logging');
    expect(stringStatsFlow.description).toContain('Provides functions to sanitize strings');
    expect(stringStatsFlow.type).toBe('module');
    
    // Should have container + function nodes + external dependency nodes
    expect(stringStatsFlow.nodes.length).toBeGreaterThan(5);
    
    // Should have a container node
    const containerNode = stringStatsFlow.nodes.find(n => n.type === 'flownode');
    expect(containerNode).toBeDefined();
    expect(containerNode?.data.isContainer).toBe(true);
    
    // Should have function nodes for the main functions
    const functionNodes = stringStatsFlow.nodes.filter(n => n.type === 'functionnode');
    expect(functionNodes.length).toBeGreaterThanOrEqual(4); // sanitizeString, countWords, sumWordLengths, averageWordLength
    
    // Should have external dependency child nodes
    const childNodes = stringStatsFlow.nodes.filter(n => n.type === 'childnode');
    expect(childNodes.length).toBeGreaterThan(0);
    
    // Should have edges representing function calls
    expect(stringStatsFlow.edges.length).toBeGreaterThan(0);

    // Verify Logger flow
    const loggerFlow = flows[1];
    expect(loggerFlow.name).toBe('Logger Utilities');
    expect(loggerFlow.description).toContain('log` function to record operation names');
    
    // Should have container + log function + external dependencies
    expect(loggerFlow.nodes.length).toBeGreaterThanOrEqual(3);
    
    // Should have the log function
    const logFunctionNode = loggerFlow.nodes.find(n => n.data.functionName === 'log');
    expect(logFunctionNode).toBeDefined();
    expect(logFunctionNode?.type).toBe('functionnode');
    
    // Should have external dependencies like console.log and JSON.stringify
    const loggerChildNodes = loggerFlow.nodes.filter(n => n.type === 'childnode');
    expect(loggerChildNodes.length).toBeGreaterThan(0);
    
    // Verify we can find console.log dependency
    const consoleLogNode = loggerChildNodes.find(n => n.data.functionName === 'console.log');
    expect(consoleLogNode).toBeDefined();
    expect(consoleLogNode?.data.isBuiltIn).toBe(true);

    console.log('✅ Successfully generated flows from JavaScript files!');
    console.log(`📊 StringStats Flow: ${stringStatsFlow.nodes.length} nodes, ${stringStatsFlow.edges.length} edges`);
    console.log(`📊 Logger Flow: ${loggerFlow.nodes.length} nodes, ${loggerFlow.edges.length} edges`);
  });

  it('should demonstrate the complete workflow: AST parsing → External dependencies → Flow generation', () => {
    const simpleCode = `
/**
 * @title Simple Calculator
 * @description A simple calculator with logging
 */

/**
 * @title add
 * @description Adds two numbers and logs the result
 */
function add(a, b) {
  const result = a + b;
  console.log('Addition result:', result);
  return result;
}

/**
 * @title multiply  
 * @description Multiplies two numbers
 */
function multiply(x, y) {
  const sum = add(x, y); // Internal function call
  const result = sum * 2;
  console.log('Multiply result:', result);
  return result;
}

export { add, multiply };
    `;

    const generator = new FlowGenerator();
    const flow = generator.generateFlow(simpleCode, 'calculator.js', 'demo', 'Calculator Demo');

    // Verify the generated flow structure
    expect(flow.id).toBe('demo');
    expect(flow.name).toBe('Calculator Demo');
    expect(flow.description).toBe('A simple calculator with logging');
    expect(flow.type).toBe('module');

    // Should have container + 2 functions + external dependencies
    expect(flow.nodes.length).toBeGreaterThan(3);

    // Verify container
    const container = flow.nodes.find(n => n.type === 'flownode');
    expect(container?.data.label).toBe('Simple Calculator');

    // Verify functions
    const functions = flow.nodes.filter(n => n.type === 'functionnode');
    expect(functions).toHaveLength(2);
    
    const addFunc = functions.find(f => f.data.functionName === 'add');
    const multiplyFunc = functions.find(f => f.data.functionName === 'multiply');
    expect(addFunc).toBeDefined();
    expect(multiplyFunc).toBeDefined();

    // Verify external dependencies (console.log calls)
    const externalDeps = flow.nodes.filter(n => n.type === 'childnode');
    expect(externalDeps.length).toBeGreaterThan(0);
    
    const consoleLogDeps = externalDeps.filter(n => n.data.functionName === 'console.log');
    expect(consoleLogDeps.length).toBeGreaterThanOrEqual(2); // One for each function

    // Verify edges (function calls)
    expect(flow.edges.length).toBeGreaterThan(0);
    
    // Should have edge from multiply to add (internal function call)
    const internalCallEdge = flow.edges.find(e => 
      e.source.includes('multiply') && e.target.includes('add')
    );
    expect(internalCallEdge).toBeDefined();

    console.log('✅ Complete workflow demonstration successful!');
    console.log('🔄 Workflow: JavaScript Code → AST Parsing → External Dependencies → Flow JSON');
    console.log(`📈 Generated flow with ${flow.nodes.length} nodes and ${flow.edges.length} edges`);
  });
});