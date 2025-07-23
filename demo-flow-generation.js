/** @format */

// Simple demonstration of flow generation from the example files
const { flowGenerator } = require('./src/AgenticContentFlow/AST/services/FlowGenerator.ts');
const fs = require('fs');

// Read the example files
const loggerCode = fs.readFileSync('.kiro/specs/direct-function-calling-architecture/example/logger.js', 'utf8');
const stringStatsCode = fs.readFileSync('.kiro/specs/direct-function-calling-architecture/example/stringStatsStandard.js', 'utf8');

console.log('=== GENERATING FLOWS FROM EXAMPLE FILES ===\n');

try {
  // Generate individual flows
  console.log('1. Generating StringStats Flow...');
  const stringStatsFlow = flowGenerator.generateFlow(stringStatsCode, 'stringStatsStandard.js', '1', 'StringStats Flow');
  
  console.log('2. Generating Logger Flow...');
  const loggerFlow = flowGenerator.generateFlow(loggerCode, 'logger.js', '2', 'Logger Flow');

  // Combine into the same format as alternative2.json
  const flows = [stringStatsFlow, loggerFlow];

  console.log('\n=== GENERATED FLOW JSON ===');
  console.log(JSON.stringify(flows, null, 2));

  // Save to file for comparison
  fs.writeFileSync('generated-flows.json', JSON.stringify(flows, null, 2));
  console.log('\n✅ Flows saved to generated-flows.json');

} catch (error) {
  console.error('❌ Error generating flows:', error.message);
}