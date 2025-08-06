import { useCodeStore } from './src/stores/codeStore.js';
import fs from 'fs';

// Test the code store functionality
const loggerCode = fs.readFileSync('logger.js', 'utf8');

console.log('Testing code store...');

// Get the code store instance
const codeStore = useCodeStore.getState();

// Store some code
console.log('1. Storing code in store...');
codeStore.setSourceCode('logger.js', loggerCode);

// Try to retrieve it
console.log('2. Retrieving code from store...');
const retrievedCode = codeStore.getSourceCode('logger.js');

console.log('3. Results:');
console.log('Original code length:', loggerCode.length);
console.log('Retrieved code length:', retrievedCode ? retrievedCode.length : 'null');
console.log('Codes match:', loggerCode === retrievedCode);

// Test function location storage
console.log('4. Testing function location storage...');
codeStore.setFunctionLocation('test-function-id', {
  filePath: 'logger.js',
  functionName: 'log',
  startLine: 14,
  endLine: 19,
  startColumn: 0,
  endColumn: 3
});

const functionCode = codeStore.getFunctionCode('test-function-id');
console.log('Function code retrieved:', functionCode ? `${functionCode.length} chars` : 'null');
if (functionCode) {
  console.log('Function code preview:', functionCode.substring(0, 100) + '...');
}