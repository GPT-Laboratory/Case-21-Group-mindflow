const fs = require('fs');

// Simple test to check what's in the function node data
console.log('=== Testing Function Node Data ===\n');

// Read the logger.js file
const loggerCode = fs.readFileSync('logger.js', 'utf8');
console.log('Original logger.js code:');
console.log(loggerCode);
console.log('\n' + '='.repeat(50) + '\n');

// We'll need to run this through the actual test to see the data
console.log('Run: npm test FlowGenerator.test.ts to see the actual function node data');