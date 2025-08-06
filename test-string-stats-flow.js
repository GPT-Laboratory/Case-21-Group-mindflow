import fs from 'fs';
import { FlowGenerator } from './src/AgenticContentFlow/AST/services/FlowGenerator.js';

// Read the stringStatsStandard.js file
const code = fs.readFileSync('stringStatsStandard.js', 'utf8');

// Create flow generator
const flowGenerator = new FlowGenerator();

// Generate flow
const flow = flowGenerator.generateFlow(code, 'stringStatsStandard.js');

console.log('Generated Flow for stringStatsStandard.js:');
console.log('==========================================');

// Show functions
console.log('\nFunction nodes:');
const functionNodes = flow.nodes.filter(n => n.type === 'functionnode');
functionNodes.forEach(node => {
  console.log(`- ${node.data.functionName} (${node.id})`);
});

// Show edges (internal function calls)
console.log('\nEdges (internal function calls):');
if (flow.edges.length === 0) {
  console.log('❌ NO EDGES FOUND - This indicates the bug is still present');
} else {
  flow.edges.forEach(edge => {
    const sourceNode = flow.nodes.find(n => n.id === edge.source);
    const targetNode = flow.nodes.find(n => n.id === edge.target);
    const sourceName = sourceNode?.data?.functionName || edge.source;
    const targetName = targetNode?.data?.functionName || edge.target;
    console.log(`✅ ${sourceName} -> ${targetName}`);
  });
}

// Show child nodes (external calls)
console.log('\nChild nodes (external function calls):');
const childNodes = flow.nodes.filter(n => n.type === 'childnode');
childNodes.forEach(node => {
  const parentNode = flow.nodes.find(p => p.id === node.parentId);
  const parentName = parentNode?.data?.functionName || node.parentId;
  console.log(`- ${parentName} calls external: ${node.data.functionName}`);
});

// Expected results
console.log('\n🎯 Expected internal call edges:');
console.log('- countWords -> sanitizeString');
console.log('- sumWordLengths -> sanitizeString');
console.log('- averageWordLength -> countWords');
console.log('- averageWordLength -> sumWordLengths');