/** @format */

import { describe, it, expect, beforeEach } from 'vitest';
import { flowGenerator } from '../FlowGenerator';

describe('FlowGenerator', () => {
  beforeEach(() => {
    // Reset any state if needed
  });

  describe('generateFlow', () => {
    it('should generate a flow from the logger.js example', () => {
      const loggerCode = `
/**
 * @title Logger Utilities
 * @description Provides a \`log\` function to record operation names and payloads, sending them to the console or an external monitoring service.
 */

/**
 * @title log
 * @description Logs a given operation name and associated data.
 * @param {string} operation - The name of the operation being logged.
 * @param {Object} data - The data payload to record with the log.
 * @returns {void}
 */
function log(operation, data) {
    // Example: output to console. Replace with external service integration as needed.
    console.log(\`[\${operation}]\`, JSON.stringify(data));
    // TODO: send to remote monitoring endpoint, e.g.:
    // fetch('/api/logs', { method: 'POST', body: JSON.stringify({ operation, data }) });
  }
  
  export { log };
      `;

      const flow = flowGenerator.generateFlow(loggerCode, 'logger.js', '2', 'Logger Flow');

      expect(flow.id).toBe('2');
      expect(flow.name).toBe('Logger Flow');
      expect(flow.description).toBe('Provides a `log` function to record operation names and payloads, sending them to the console or an external monitoring service.');
      expect(flow.type).toBe('module');

      // Should have container node, function node, and external dependency child nodes
      expect(flow.nodes).toHaveLength(4);
      
      // Verify container node
      const containerNode = flow.nodes.find(n => n.type === 'ast-flownode');
      expect(containerNode?.type).toBe('ast-flownode');
      expect(containerNode?.data.label).toBe('Logger Module');

      // Verify function nodes
      const logNode = flow.nodes.find(n => n.type === 'ast-functionnode');
      expect(logNode?.type).toBe('ast-functionnode');
      expect(logNode?.data.functionName).toBe('log');

      // Verify external dependency nodes
      const consoleLogNode = flow.nodes.find(n => n.type === 'ast-childnode' && n.data.functionName === 'console.log');
      expect(consoleLogNode?.type).toBe('ast-childnode');
      expect(consoleLogNode?.data.functionName).toBe('console.log');

      const jsonStringifyNode = flow.nodes.find(n => n.type === 'ast-childnode' && n.data.functionName === 'JSON.stringify');
      expect(jsonStringifyNode?.type).toBe('ast-childnode');
      expect(jsonStringifyNode?.data.functionName).toBe('JSON.stringify');
      expect(logNode?.data.description).toContain('Logs a given operation name and associated data.');

      // Verify that child nodes do NOT have edges to their parent (they should be visually contained, not connected)
      const edgesToConsoleLog = flow.edges.filter(edge => edge.target === consoleLogNode?.id);
      const edgesToJsonStringify = flow.edges.filter(edge => edge.target === jsonStringifyNode?.id);
      expect(edgesToConsoleLog).toHaveLength(0);
      expect(edgesToJsonStringify).toHaveLength(0);
    });

    it('should generate a flow from the stringStatsStandard.js example', () => {
      const stringStatsCode = `
/**
 * @title String Statistics with Logging
 * @description Provides functions to sanitize strings, compute statistics, and log each operation via an external logger.
 */
import { log } from './logger.js';

/**
 * @title defaultDelimiter
 * @description Delimiter used to split words.
 */
const defaultDelimiter = ' ';

/**
 * @title sanitizeString
 * @description Removes punctuation and converts a string to lowercase.
 * @param {string} str - The input string to sanitize.
 * @returns {string} - The sanitized string.
 */
function sanitizeString(str) {
  const result = str.replace(/[^\\w\\s]|_/g, '').toLowerCase().trim();
  log('sanitizeString', { input: str, output: result });
  return result;
}

/**
 * @title countWords
 * @description Counts the number of words in a string.
 * @param {string} str - The input string.
 * @param {string} [delimiter=defaultDelimiter] - Delimiter to split words.
 * @returns {number} - The word count.
 */
function countWords(str, delimiter = defaultDelimiter) {
  const sanitized = sanitizeString(str);
  const count = sanitized ? sanitized.split(delimiter).length : 0;
  log('countWords', { input: str, count });
  return count;
}

/**
 * @title sumWordLengths
 * @description Sums the lengths of all words in a string.
 * @param {string} str - The input string.
 * @param {string} [delimiter=defaultDelimiter] - Delimiter to split words.
 * @returns {number} - The sum of word lengths.
 */
function sumWordLengths(str, delimiter = defaultDelimiter) {
  const sanitized = sanitizeString(str);
  const words = sanitized ? sanitized.split(delimiter) : [];
  const totalLength = words.reduce((sum, word) => sum + word.length, 0);
  log('sumWordLengths', { input: str, totalLength });
  return totalLength;
}

/**
 * @title averageWordLength
 * @description Calculates the average word length in a string.
 * @param {string} str - The input string.
 * @param {string} [delimiter=defaultDelimiter] - Delimiter to split words.
 * @returns {number} - The average word length.
 */
function averageWordLength(str, delimiter = defaultDelimiter) {
  const totalWords = countWords(str, delimiter);
  if (!totalWords) {
    log('averageWordLength', { input: str, average: 0 });
    return 0;
  }
  const totalLength = sumWordLengths(str, delimiter);
  const avg = totalLength / totalWords;
  log('averageWordLength', { input: str, average: avg });
  return avg;
}

export {
  defaultDelimiter,
  sanitizeString,
  countWords,
  sumWordLengths,
  averageWordLength,
};
      `;

      const flow = flowGenerator.generateFlow(stringStatsCode, 'stringStatsStandard.js', '1', 'StringStats Flow');

      expect(flow.id).toBe('1');
      expect(flow.name).toBe('StringStats Flow');
      expect(flow.description).toBe('Provides functions to sanitize strings, compute statistics, and log each operation via an external logger.');
      expect(flow.type).toBe('module');

      // Should have container node, 4 function nodes, and external dependency child nodes
      expect(flow.nodes.length).toBeGreaterThan(5);
      
      const containerNode = flow.nodes.find(n => n.id === 'container');
      expect(containerNode).toBeDefined();
      expect(containerNode?.type).toBe('ast-flownode');
      expect(containerNode?.data.label).toBe('String Statistics with Logging');

      // Check function nodes
      const functionNames = ['sanitizeString', 'countWords', 'sumWordLengths', 'averageWordLength'];
      functionNames.forEach(name => {
        const funcNode = flow.nodes.find(n => n.data.functionName === name);
        expect(funcNode).toBeDefined();
        expect(funcNode?.type).toBe('ast-functionnode');
        expect(funcNode?.parentId).toBe('container');
      });

      // Should have external dependency child nodes for log calls
      const logNodes = flow.nodes.filter(n => n.type === 'ast-childnode' && n.data.functionName === 'log');
      expect(logNodes.length).toBeGreaterThan(0);

      // Should have edges for function calls
      expect(flow.edges.length).toBeGreaterThan(0);
    });

    it('should generate flows from multiple files', () => {
      const loggerCode = `
/**
 * @title Logger Utilities
 * @description Provides logging functionality
 */
function log(operation, data) {
    console.log(\`[\${operation}]\`, JSON.stringify(data));
}
export { log };
      `;

      const stringStatsCode = `
/**
 * @title String Statistics
 * @description String processing utilities
 */
import { log } from './logger.js';

function sanitizeString(str) {
  const result = str.toLowerCase();
  log('sanitizeString', { input: str, output: result });
  return result;
}

export { sanitizeString };
      `;

      const flows = flowGenerator.generateFlows([
        { code: loggerCode, fileName: 'logger.js' },
        { code: stringStatsCode, fileName: 'stringStats.js' }
      ]);

      expect(flows).toHaveLength(2);
      expect(flows[0].name).toBe('Logger Utilities');
      expect(flows[1].name).toBe('String Statistics');
    });
  });

  describe('edge cases', () => {
    it('should handle empty code', () => {
      const flow = flowGenerator.generateFlow('', 'empty.js');
      
      expect(flow.nodes).toHaveLength(1); // Just container
      expect(flow.edges).toHaveLength(0);
      expect(flow.nodes[0].type).toBe('ast-flownode');
    });

    it('should handle code without comments', () => {
      const code = `
        function simpleFunction() {
          return 'hello';
        }
      `;

      const flow = flowGenerator.generateFlow(code, 'simple.js');
      
      expect(flow.nodes).toHaveLength(2); // Container + function
      expect(flow.nodes[1].data.functionName).toBe('simpleFunction');
    });
  });
});