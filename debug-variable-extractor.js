import { BabelParser } from './src/AgenticContentFlow/AST/parsers/BabelParser.ts';
import { ASTTraverser } from './src/AgenticContentFlow/AST/core/ASTTraverser.ts';
import { VariableExtractor } from './src/AgenticContentFlow/AST/extractors/VariableExtractor.ts';

const code = `
const globalConst = 'global';
let globalLet = 42;
var globalVar = true;

function testFunc() {
  const localConst = 'local';
  let localLet = 10;
}
`;

const parser = new BabelParser();
const traverser = new ASTTraverser();
const extractor = new VariableExtractor(traverser);

try {
  const ast = parser.parse(code);
  console.log('AST parsed successfully');
  console.log('AST type:', ast.type);
  console.log('AST body length:', ast.body ? ast.body.length : 'no body');
  
  const variables = extractor.extract(ast);
  console.log('Variables extracted:', variables.length);
  console.log('Variables:', variables);
} catch (error) {
  console.error('Error:', error);
}