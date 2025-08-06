// Simple test to see what node data looks like
const loggerCode = `
/**
 * @title Logger Utilities
 * @description Provides a log function to record operation names and payloads.
 */

function log(operation, data) {
  console.log(\`[\${operation}]\`, JSON.stringify(data));
}

export { log };
`;

console.log('Logger code to test:');
console.log(loggerCode);
console.log('Length:', loggerCode.length);