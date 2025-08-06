import fs from 'fs';
import { FlowGenerator } from './src/AgenticContentFlow/AST/services/FlowGenerator.js';

// Read the stringStatsStandard.js file
const code = fs.readFileSync('stringStatsStandard.js', 'utf8');

// Create flow generator
const flowGenerator = new FlowGenerator();

// Generate flow
const flow = flowGenerator.generateFlow(code, 'stringStatsStandard.js');

console.log('=== DEBUGGING EDGE SYNC ISSUE ===');
console.log('\nFunction nodes:');
const functionNodes = flow.nodes.filter(n => n.type === 'functionnode');
functionNodes.forEach(node => {
  console.log(`- ${node.data.functionName}: ${node.id}`);
});

console.log('\nEdges:');
flow.edges.forEach(edge => {
  const sourceNode = flow.nodes.find(n => n.id === edge.source);
  const targetNode = flow.nodes.find(n => n.id === edge.target);
  console.log(`- ${edge.id}: ${sourceNode?.data?.functionName || edge.source} -> ${targetNode?.data?.functionName || edge.target}`);
  console.log(`  Source ID: ${edge.source}`);
  console.log(`  Target ID: ${edge.target}`);
  console.log(`  Source exists: ${!!sourceNode}`);
  console.log(`  Target exists: ${!!targetNode}`);
});

console.log('\nEdge validation:');
let validEdges = 0;
let invalidEdges = 0;

flow.edges.forEach(edge => {
  const sourceExists = flow.nodes.some(n => n.id === edge.source);
  const targetExists = flow.nodes.some(n => n.id === edge.target);
  
  if (sourceExists && targetExists) {
    validEdges++;
  } else {
    invalidEdges++;
    console.log(`❌ Invalid edge ${edge.id}: source=${sourceExists}, target=${targetExists}`);
  }
});

console.log(`\n✅ Valid edges: ${validEdges}`);
console.log(`❌ Invalid edges: ${invalidEdges}`);

// Test the sync service
console.log('\n=== TESTING SYNC SERVICE ===');
import { flowSyncService } from './src/AgenticContentFlow/AST/services/FlowSyncService.js';

// Find a function to modify
const testFunction = functionNodes.find(n => n.data.functionName === 'countWords');
if (testFunction) {
  console.log(`\nTesting sync with function: ${testFunction.data.functionName} (${testFunction.id})`);
  
  const modifiedCode = `
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
  // Removed log call to test sync
  return count;
}`;

  // Mock callback to capture updates
  let syncResult = null;
  const unsubscribe = flowSyncService.onFlowUpdate((nodes, edges) => {
    syncResult = { nodes, edges };
  });

  try {
    const success = await flowSyncService.updateFunctionCodeAndSync(
      testFunction.id,
      modifiedCode,
      'stringStatsStandard.js',
      flow.nodes,
      flow.edges
    );
    
    console.log(`Sync success: ${success}`);
    
    if (syncResult) {
      console.log('\nAfter sync:');
      const syncFunctionNodes = syncResult.nodes.filter(n => n.type === 'functionnode');
      syncFunctionNodes.forEach(node => {
        console.log(`- ${node.data.functionName}: ${node.id}`);
      });
      
      console.log('\nSync edges:');
      syncResult.edges.forEach(edge => {
        const sourceNode = syncResult.nodes.find(n => n.id === edge.source);
        const targetNode = syncResult.nodes.find(n => n.id === edge.target);
        console.log(`- ${edge.id}: ${sourceNode?.data?.functionName || edge.source} -> ${targetNode?.data?.functionName || edge.target}`);
        console.log(`  Source ID: ${edge.source}`);
        console.log(`  Target ID: ${edge.target}`);
        console.log(`  Source exists: ${!!sourceNode}`);
        console.log(`  Target exists: ${!!targetNode}`);
      });
    }
  } finally {
    unsubscribe();
  }
}