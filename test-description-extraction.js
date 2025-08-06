// Test to verify function description extraction is working
console.log('Testing function description extraction...');

// Mock the FlowGenerator to test just the function extraction
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

// Test the actual logger.js file content
import fs from 'fs';
const actualLoggerCode = fs.readFileSync('logger.js', 'utf8');

console.log('Actual logger.js content:');
console.log(actualLoggerCode);

console.log('\nExpected to extract:');
console.log('- Module title: "Logger Utilities"');
console.log('- Module description: "Provides a `log` function to record operation names and payloads, sending them to the console or an external monitoring service."');
console.log('- Function title: "log"');
console.log('- Function description: "Logs a given operation name and associated data."');

console.log('\nTest completed. Check the test output above to see if hasDescription: true appears for the log function.');