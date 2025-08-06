import fs from 'fs';
import { FlowGenerator } from './src/AgenticContentFlow/AST/services/FlowGenerator.js';

// Read the logger.js file
const loggerCode = fs.readFileSync('logger.js', 'utf8');

// Create flow generator
const flowGenerator = new FlowGenerator();

// Generate flow
const flow = flowGenerator.generateFlow(loggerCode, 'logger.js');

// Output the JSON
console.log('Generated Flow JSON:');
console.log(JSON.stringify(flow, null, 2));