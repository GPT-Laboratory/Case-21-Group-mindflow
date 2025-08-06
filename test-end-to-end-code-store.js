// Test the end-to-end code store functionality
import { FlowGenerator } from './src/AgenticContentFlow/AST/services/FlowGenerator.js';
import { useCodeStore } from './src/stores/codeStore.js';
import fs from 'fs';

console.log('🧪 Testing end-to-end code store functionality...\n');

// 1. Read the logger.js file
const loggerCode = fs.readFileSync('logger.js', 'utf8');
console.log('1. ✅ Read logger.js file:', loggerCode.length, 'characters');

// 2. Generate a flow (this should populate the code store)
const flowGenerator = new FlowGenerator();
const flow = flowGenerator.generateFlow(loggerCode, 'logger.js');
console.log('2. ✅ Generated flow with', flow.nodes.length, 'nodes');

// 3. Check if code store is populated
const codeStore = useCodeStore.getState();
console.log('3. 📊 Code store state:');
console.log('   - Source files:', codeStore.sourceFiles.size);
console.log('   - Function locations:', codeStore.functionLocations.size);
console.log('   - Has logger.js source:', !!codeStore.getSourceCode('logger.js'));
console.log('   - Source code length:', codeStore.getSourceCode('logger.js')?.length || 0);

// 4. Find the function node
const functionNode = flow.nodes.find(n => n.type === 'functionnode');
console.log('4. 🔍 Function node data:');
console.log('   - ID:', functionNode?.id);
console.log('   - Type:', functionNode?.type);
console.log('   - Function name:', functionNode?.data?.functionName);
console.log('   - File path:', functionNode?.data?.filePath);

// 5. Simulate what the CodeEditorTab would do
console.log('5. 🎭 Simulating CodeEditorTab behavior:');
if (functionNode?.data?.filePath) {
  const sourceCode = codeStore.getSourceCode(functionNode.data.filePath);
  console.log('   - Retrieved source code:', sourceCode ? `${sourceCode.length} chars` : 'null');
  
  if (functionNode.data.functionName && functionNode.id) {
    const functionCode = codeStore.getFunctionCode(functionNode.id);
    console.log('   - Retrieved function code:', functionCode ? `${functionCode.length} chars` : 'null');
    
    if (functionCode) {
      console.log('   - Function code preview:', functionCode.substring(0, 100) + '...');
    }
  }
} else {
  console.log('   - ❌ No filePath in node data');
}

// 6. Test the container node too
const containerNode = flow.nodes.find(n => n.type === 'flownode');
console.log('6. 📦 Container node data:');
console.log('   - ID:', containerNode?.id);
console.log('   - Type:', containerNode?.type);
console.log('   - File path:', containerNode?.data?.filePath);

if (containerNode?.data?.filePath) {
  const sourceCode = codeStore.getSourceCode(containerNode.data.filePath);
  console.log('   - Retrieved source code:', sourceCode ? `${sourceCode.length} chars` : 'null');
}

console.log('\n🎯 Test complete!');