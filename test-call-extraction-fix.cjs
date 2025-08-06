/**
 * Test script to verify that internal function calls are properly identified
 */

const fs = require('fs');

// Read the test file
const code = fs.readFileSync('stringStatsStandard.js', 'utf8');

console.log('Testing internal function call detection...');
console.log('Code from stringStatsStandard.js:');
console.log('=====================================');

// Extract function names from the code
const functionNames = [];
const functionRegex = /function\s+(\w+)/g;
let match;
while ((match = functionRegex.exec(code)) !== null) {
  functionNames.push(match[1]);
}

console.log('Functions defined in file:', functionNames);

// Extract function calls
const callRegex = /(\w+)\s*\(/g;
const calls = [];
let callMatch;
while ((callMatch = callRegex.exec(code)) !== null) {
  const calledFunction = callMatch[1];
  // Skip keywords and common patterns
  if (!['function', 'if', 'for', 'while', 'switch', 'return', 'const', 'let', 'var'].includes(calledFunction)) {
    calls.push(calledFunction);
  }
}

console.log('\nAll function calls found:', [...new Set(calls)]);

// Categorize calls
const internalCalls = calls.filter(call => functionNames.includes(call));
const externalCalls = calls.filter(call => !functionNames.includes(call));

console.log('\nInternal calls (should create edges):', [...new Set(internalCalls)]);
console.log('External calls (should create child nodes):', [...new Set(externalCalls)]);

// Expected internal calls based on the code
console.log('\nExpected internal function call relationships:');
console.log('- countWords -> sanitizeString');
console.log('- sumWordLengths -> sanitizeString');  
console.log('- averageWordLength -> countWords');
console.log('- averageWordLength -> sumWordLengths');

console.log('\nWith our fix, these internal calls should now create edges between function nodes');
console.log('instead of creating child nodes within the calling functions.');