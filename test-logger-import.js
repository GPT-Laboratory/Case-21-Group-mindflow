// Simple test to verify function description extraction
import { flowGenerator } from './src/AgenticContentFlow/AST/services/FlowGenerator.ts';
import fs from 'fs';

const loggerCode = fs.readFileSync('logger.js', 'utf8');
console.log('Logger code:');
console.log(loggerCode);
console.log('\n=== Generating Flow ===');

try {
  const flow = flowGenerator.generateFlow(loggerCode, 'logger.js');
  
  console.log('Flow nodes:');
  flow.nodes.forEach(node => {
    console.log(`- ${node.type}: ${node.data.label}`);
    if (node.data.description) {
      console.log(`  Description: ${node.data.description}`);
    }
    if (node.data.functionDescription) {
      console.log(`  Function Description: ${node.data.functionDescription}`);
    }
    if (node.data.instanceCode) {
      console.log(`  Code: ${node.data.instanceCode.substring(0, 100)}...`);
    }
  });
  
} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
}