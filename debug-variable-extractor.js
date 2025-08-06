// Debug script to examine the exact data structure being generated
import { flowGenerator } from './src/AgenticContentFlow/AST/services/FlowGenerator.ts';
import fs from 'fs';

const loggerCode = fs.readFileSync('logger.js', 'utf8');

console.log('=== DEBUGGING FUNCTION NODE DATA ===');

try {
  const flow = flowGenerator.generateFlow(loggerCode, 'logger.js');
  
  console.log('\n1. CONTAINER NODE DATA:');
  const containerNode = flow.nodes.find(n => n.type === 'flownode');
  if (containerNode) {
    console.log('Container data keys:', Object.keys(containerNode.data));
    console.log('Container data:', JSON.stringify(containerNode.data, null, 2));
  }
  
  console.log('\n2. FUNCTION NODE DATA:');
  const functionNode = flow.nodes.find(n => n.type === 'functionnode');
  if (functionNode) {
    console.log('Function data keys:', Object.keys(functionNode.data));
    console.log('Function data:', JSON.stringify(functionNode.data, null, 2));
    
    console.log('\n3. SPECIFIC FIELDS CHECK:');
    console.log('- label:', functionNode.data.label);
    console.log('- description:', functionNode.data.description);
    console.log('- functionDescription:', functionNode.data.functionDescription);
    console.log('- functionName:', functionNode.data.functionName);
    console.log('- parameters:', functionNode.data.parameters);
    console.log('- instanceCode length:', functionNode.data.instanceCode?.length);
    console.log('- sourceLocation:', functionNode.data.sourceLocation);
  }
  
  console.log('\n4. ALL NODES SUMMARY:');
  flow.nodes.forEach((node, index) => {
    console.log(`Node ${index + 1}:`);
    console.log(`  - id: ${node.id}`);
    console.log(`  - type: ${node.type}`);
    console.log(`  - parentId: ${node.parentId}`);
    console.log(`  - data keys: ${Object.keys(node.data).join(', ')}`);
  });
  
} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
}