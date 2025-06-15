import { completeFlowExampleNodes, completeFlowExampleEdges } from '../generated/completeFlowExample';

export const generatedFlowTestConfig = {
  id: 'generated-flow-test',
  name: 'Generated Flow Example',
  description: 'Test configuration for AI-generated flow with complete instanceCode',
  nodes: completeFlowExampleNodes,
  edges: completeFlowExampleEdges,
  features: [
    'Complete working instanceCode for all nodes',
    'API data fetching with jsonplaceholder',
    'Data filtering and transformation',
    'Conditional routing with selective targeting',
    'Content display with formatting',
    'API posting with dynamic content',
    'Flow completion and summarization'
  ],
  complexity: 'intermediate',
  nodeTypes: ['restnode', 'logicalnode', 'conditionalnode', 'contentnode'],
  flowType: 'user-management'
};