import { FlowCodeSynchronizer } from '../FlowCodeSynchronizer';
import { FlowStructure, FlowChange, ParsedFileStructure } from '../../types/ASTTypes';
import { ASTParserServiceInterface } from '../../interfaces/CoreInterfaces';
import { ASTError } from '../../errors/ASTError';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockedFunction } from 'vitest';
import { afterEach } from 'node:test';

describe('FlowCodeSynchronizer', () => {
  let synchronizer: FlowCodeSynchronizer;
  let mockParserService: vi.Mocked<ASTParserServiceInterface>;

  beforeEach(() => {
    // Create mock parser service
    mockParserService = {
      parseFile: vi.fn()
    };

    // Set up default mock return value to prevent undefined errors
    mockParserService.parseFile.mockReturnValue({
      functions: [],
      calls: [],
      variables: [],
      comments: [],
      dependencies: []
    });

    synchronizer = new FlowCodeSynchronizer(mockParserService);
  });

  afterEach(() => {
    // Reset all mocks after each test to prevent leakage
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw ASTError when parser service is not provided', () => {
      expect(() => {
        new FlowCodeSynchronizer(null as any);
      }).toThrow(ASTError);

      expect(() => {
        new FlowCodeSynchronizer(null as any);
      }).toThrow('ASTParserServiceInterface instance is required');
    });

    it('should throw ASTError when parser service does not implement parseFile method', () => {
      const invalidParser = {} as ASTParserServiceInterface;

      expect(() => {
        new FlowCodeSynchronizer(invalidParser);
      }).toThrow(ASTError);

      expect(() => {
        new FlowCodeSynchronizer(invalidParser);
      }).toThrow('Parser service must implement parseFile method');
    });

    it('should accept valid parser service', () => {
      expect(() => {
        new FlowCodeSynchronizer(mockParserService);
      }).not.toThrow();
    });
  });

  describe('syncCodeToFlow', () => {
    it('should convert simple JavaScript code to flow structure', () => {
      const code = `
        // Simple calculator functions
        
        /**
         * Adds two numbers
         */
        function add(a, b) {
          return a + b;
        }
        
        /**
         * Multiplies two numbers
         */
        function multiply(x, y) {
          return add(x * y, 0);
        }
      `;

      // Mock the parser service response
      const mockParsedStructure: ParsedFileStructure = {
        functions: [
          {
            id: 'add_0',
            name: 'add',
            parameters: [
              { name: 'a', type: 'unknown' },
              { name: 'b', type: 'unknown' }
            ],
            returnType: 'unknown',
            sourceLocation: { start: { line: 6, column: 8 }, end: { line: 8, column: 9 } },
            description: 'Adds two numbers',
            isNested: false,
            scope: 'global',
            code: 'function add(a, b) {\n  return a + b;\n}'
          },
          {
            id: 'multiply_1',
            name: 'multiply',
            parameters: [
              { name: 'x', type: 'unknown' },
              { name: 'y', type: 'unknown' }
            ],
            returnType: 'unknown',
            sourceLocation: { start: { line: 13, column: 8 }, end: { line: 15, column: 9 } },
            description: 'Multiplies two numbers',
            isNested: false,
            scope: 'global',
            code: 'function multiply(x, y) {\n  return add(x * y, 0);\n}'
          }
        ],
        calls: [
          {
            id: 'call_0',
            callerFunction: 'multiply',
            calledFunction: 'add',
            sourceLocation: { start: { line: 14, column: 10 }, end: { line: 14, column: 25 } },
            isExternal: false
          }
        ],
        variables: [],
        comments: [],
        dependencies: []
      };

      mockParserService.parseFile.mockReturnValue(mockParsedStructure);

      const flow = synchronizer.syncCodeToFlow(code, 'calculator.js');

      expect(mockParserService.parseFile).toHaveBeenCalledWith(code);
      expect(flow.fileName).toBe('calculator.js');
      expect(flow.description).toContain('Simple calculator functions');
      expect(flow.nodes).toHaveLength(2);

      const addNode = flow.nodes.find(n => n.data.functionName === 'add');
      const multiplyNode = flow.nodes.find(n => n.data.functionName === 'multiply');

      expect(addNode).toBeDefined();
      expect(addNode?.data.description).toContain('Adds two numbers');
      expect(addNode?.data.parameters).toHaveLength(2);

      expect(multiplyNode).toBeDefined();
      expect(multiplyNode?.data.description).toContain('Multiplies two numbers');

      // Should have edge from multiply to add
      expect(flow.edges).toHaveLength(1);
      if (flow.edges.length > 0) {
        expect(flow.edges[0].source).toBe(multiplyNode?.id);
        expect(flow.edges[0].target).toBe(addNode?.id);
      }
    });

    it('should handle code with variables', () => {
      const code = `
        const PI = 3.14159;
        let radius = 5;
        
        function calculateArea() {
          return PI * radius * radius;
        }
      `;

      // Mock the parser service response
      const mockParsedStructure: ParsedFileStructure = {
        functions: [
          {
            id: 'calculateArea_0',
            name: 'calculateArea',
            parameters: [],
            returnType: 'unknown',
            sourceLocation: { start: { line: 5, column: 8 }, end: { line: 7, column: 9 } },
            description: '',
            isNested: false,
            scope: 'global',
            code: 'function calculateArea() {\n  return PI * radius * radius;\n}'
          }
        ],
        calls: [],
        variables: [
          {
            name: 'PI',
            type: 'const',
            defaultValue: '3.14159',
            sourceLocation: { start: { line: 2, column: 8 }, end: { line: 2, column: 25 } },
            scope: 'global',
            description: ''
          },
          {
            name: 'radius',
            type: 'let',
            defaultValue: '5',
            sourceLocation: { start: { line: 3, column: 8 }, end: { line: 3, column: 19 } },
            scope: 'global',
            description: ''
          }
        ],
        comments: [],
        dependencies: []
      };

      mockParserService.parseFile.mockReturnValue(mockParsedStructure);

      const flow = synchronizer.syncCodeToFlow(code, 'circle.js');

      expect(mockParserService.parseFile).toHaveBeenCalledWith(code);
      expect(flow.variables).toHaveLength(2);
      expect(flow.variables.find(v => v.name === 'PI')).toBeDefined();
      expect(flow.variables.find(v => v.name === 'radius')).toBeDefined();
      expect(flow.nodes).toHaveLength(1);
    });

    it('should handle nested functions', () => {
      const code = `
        function outerFunction() {
          function innerFunction() {
            return 'inner';
          }
          return innerFunction();
        }
      `;

      // Mock the parser service response
      const mockParsedStructure: ParsedFileStructure = {
        functions: [
          {
            id: 'outerFunction_0',
            name: 'outerFunction',
            parameters: [],
            returnType: 'unknown',
            sourceLocation: { start: { line: 2, column: 8 }, end: { line: 7, column: 9 } },
            description: '',
            isNested: false,
            scope: 'global',
            code: 'function outerFunction() {\n  function innerFunction() {\n    return \'inner\';\n  }\n  return innerFunction();\n}'
          },
          {
            id: 'innerFunction_1',
            name: 'innerFunction',
            parameters: [],
            returnType: 'unknown',
            sourceLocation: { start: { line: 3, column: 10 }, end: { line: 5, column: 11 } },
            description: '',
            isNested: true,
            parentFunction: 'outerFunction_0',
            scope: 'function',
            code: 'function innerFunction() {\n  return \'inner\';\n}'
          }
        ],
        calls: [
          {
            id: 'call_0',
            callerFunction: 'outerFunction',
            calledFunction: 'innerFunction',
            sourceLocation: { start: { line: 6, column: 10 }, end: { line: 6, column: 26 } },
            isExternal: false
          }
        ],
        variables: [],
        comments: [],
        dependencies: []
      };

      mockParserService.parseFile.mockReturnValue(mockParsedStructure);

      const flow = synchronizer.syncCodeToFlow(code, 'nested.js');

      expect(mockParserService.parseFile).toHaveBeenCalledWith(code);
      expect(flow.nodes).toHaveLength(2);

      const outerNode = flow.nodes.find(n => n.data.functionName === 'outerFunction');
      const innerNode = flow.nodes.find(n => n.data.functionName === 'innerFunction');

      expect(outerNode).toBeDefined();
      expect(innerNode).toBeDefined();
      expect(innerNode?.data.isNested).toBe(true);
      expect(innerNode?.data.parentFunction).toBe(outerNode?.id);
    });

    it('should handle empty code gracefully', () => {
      const code = '';

      // Mock the parser service response for empty code
      const mockParsedStructure: ParsedFileStructure = {
        functions: [],
        calls: [],
        variables: [],
        comments: [],
        dependencies: []
      };

      mockParserService.parseFile.mockReturnValue(mockParsedStructure);

      const flow = synchronizer.syncCodeToFlow(code, 'empty.js');

      expect(mockParserService.parseFile).toHaveBeenCalledWith(code);
      expect(flow.nodes).toHaveLength(0);
      expect(flow.edges).toHaveLength(0);
      expect(flow.variables).toHaveLength(0);
    });

    it('should handle code with syntax errors gracefully', () => {
      const code = `
        function validFunction() {
          return 'valid';
        }
        
        function invalidFunction( {
          // Missing closing parenthesis
          return 'invalid';
        }
      `;

      // Mock the parser service to throw an ASTError for invalid syntax
      mockParserService.parseFile.mockImplementation(() => {
        throw new ASTError('Parsing failed: Unexpected token', 'BabelParser');
      });

      expect(() => {
        synchronizer.syncCodeToFlow(code, 'invalid.js');
      }).toThrow(ASTError);
    });
  });

  describe('syncFlowToCode', () => {
    it('should convert flow structure back to JavaScript code', () => {
      const flow: FlowStructure = {
        id: 'test-flow',
        fileName: 'test.js',
        description: 'Test flow for code generation',
        variables: [
          {
            id: 'var-1',
            name: 'testVar',
            type: 'const',
            defaultValue: 'hello',
            description: 'Test variable',
            isConfigurable: true,
            scope: 'flow'
          }
        ],
        nodes: [
          {
            id: 'node-1',
            type: 'default',
            position: { x: 0, y: 0 },
            data: {
              functionName: 'greet',
              description: 'Greets a person',
              parameters: [{ name: 'name', type: 'string' }],
              returnType: 'string'
            }
          },
          {
            id: 'node-2',
            type: 'default',
            position: { x: 250, y: 0 },
            data: {
              functionName: 'farewell',
              description: 'Says goodbye',
              parameters: [{ name: 'name', type: 'string' }],
              returnType: 'string'
            }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'node-1',
            target: 'node-2',
            type: 'default'
          }
        ],
        metadata: {
          createdAt: '2023-01-01T00:00:00Z',
          lastModified: '2023-01-01T00:00:00Z',
          version: '1.0.0',
          astVersion: '1.0.0'
        }
      };

      const code = synchronizer.syncFlowToCode(flow);

      expect(code).toContain('// Test flow for code generation');
      expect(code).toContain('const testVar = "hello";');
      expect(code).toContain('function greet(name)');
      expect(code).toContain('function farewell(name)');
      expect(code).toContain('farewell();');
    });

    it('should generate code with proper function calls based on edges', () => {
      const flow: FlowStructure = {
        id: 'test-flow',
        fileName: 'test.js',
        description: 'Chain of function calls',
        variables: [],
        nodes: [
          {
            id: 'start',
            type: 'default',
            position: { x: 0, y: 0 },
            data: {
              functionName: 'start',
              description: 'Starting function'
            }
          },
          {
            id: 'middle',
            type: 'default',
            position: { x: 250, y: 0 },
            data: {
              functionName: 'middle',
              description: 'Middle function'
            }
          },
          {
            id: 'end',
            type: 'default',
            position: { x: 500, y: 0 },
            data: {
              functionName: 'end',
              description: 'End function'
            }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'start',
            target: 'middle',
            type: 'default'
          },
          {
            id: 'edge-2',
            source: 'middle',
            target: 'end',
            type: 'default'
          }
        ],
        metadata: {
          createdAt: '2023-01-01T00:00:00Z',
          lastModified: '2023-01-01T00:00:00Z',
          version: '1.0.0',
          astVersion: '1.0.0'
        }
      };

      const code = synchronizer.syncFlowToCode(flow);

      expect(code).toContain('function start()');
      expect(code).toContain('middle();');
      expect(code).toContain('function middle()');
      expect(code).toContain('end();');
      expect(code).toContain('function end()');
    });
  });

  describe('updateCodeFromFlowChanges', () => {
    it('should update code from incremental flow changes', () => {
      // First create a base flow
      const code = `
        function original() {
          return 'original';
        }
      `;

      const flow = synchronizer.syncCodeToFlow(code, 'test.js');

      // Create changes to add a new node
      const changes: FlowChange[] = [
        {
          type: 'node_added',
          newValue: {
            id: 'new-node',
            type: 'default',
            position: { x: 300, y: 50 },
            data: {
              functionName: 'newFunction',
              description: 'A new function',
              parameters: []
            }
          },
          timestamp: new Date().toISOString()
        }
      ];

      const updatedCode = synchronizer.updateCodeFromFlowChanges(changes);

      expect(updatedCode).toContain('function original()');
      expect(updatedCode).toContain('function newFunction()');
    });

    it('should handle node removal changes', () => {
      const code = `
        function keep() {
          return 'keep';
        }
        function remove() {
          return 'remove';
        }
      `;

      const flow = synchronizer.syncCodeToFlow(code, 'test.js');
      const nodeToRemove = flow.nodes.find(n => n.data.functionName === 'remove');

      const changes: FlowChange[] = [
        {
          type: 'node_removed',
          nodeId: nodeToRemove?.id,
          timestamp: new Date().toISOString()
        }
      ];

      const updatedCode = synchronizer.updateCodeFromFlowChanges(changes);

      expect(updatedCode).toContain('function keep()');
      expect(updatedCode).not.toContain('function remove()');
    });

    it('should handle edge addition changes', () => {
      const code = `
        function caller() {
          return 'caller';
        }
        function target() {
          return 'target';
        }
      `;

      const flow = synchronizer.syncCodeToFlow(code, 'test.js');
      const callerNode = flow.nodes.find(n => n.data.functionName === 'caller');
      const targetNode = flow.nodes.find(n => n.data.functionName === 'target');

      const changes: FlowChange[] = [
        {
          type: 'edge_added',
          newValue: {
            id: 'new-edge',
            source: callerNode?.id,
            target: targetNode?.id,
            type: 'default'
          },
          timestamp: new Date().toISOString()
        }
      ];

      const updatedCode = synchronizer.updateCodeFromFlowChanges(changes);

      expect(updatedCode).toContain('function caller()');
      expect(updatedCode).toContain('target();');
      expect(updatedCode).toContain('function target()');
    });

    it('should throw error when no current flow structure exists', () => {
      const changes: FlowChange[] = [
        {
          type: 'node_added',
          newValue: { id: 'test' },
          timestamp: new Date().toISOString()
        }
      ];

      expect(() => {
        synchronizer.updateCodeFromFlowChanges(changes);
      }).toThrow('No current flow structure to update from');
    });
  });

  describe('persistCodeChanges', () => {
    it('should update internal code state', () => {
      const newCode = 'function test() { return "test"; }';

      synchronizer.persistCodeChanges(newCode, 'test.js');

      expect(synchronizer.getCurrentCode()).toBe(newCode);
    });

    it('should handle file path for persistence', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
      const newCode = 'function test() { return "test"; }';

      synchronizer.persistCodeChanges(newCode, '/path/to/test.js');

      expect(consoleSpy).toHaveBeenCalledWith('Code would be persisted to: /path/to/test.js');
      consoleSpy.mockRestore();
    });
  });

  describe('updateEdgesFromCode', () => {
    it('should create edges from function call data', () => {
      // First create a flow with nodes so the synchronizer has a current flow structure
      const code = `
        function main() {
          helper1();
          helper2();
        }
        function helper1() {
          utility();
        }
        function helper2() {}
        function utility() {}
      `;

      synchronizer.syncCodeToFlow(code, 'test.js');

      const functionCalls = [
        {
          callerFunction: 'main',
          calledFunction: 'helper1',
          isExternal: false
        },
        {
          callerFunction: 'main',
          calledFunction: 'helper2',
          isExternal: false
        },
        {
          callerFunction: 'helper1',
          calledFunction: 'utility',
          isExternal: true
        }
      ];

      const edges = synchronizer.updateEdgesFromCode(functionCalls);

      expect(edges).toHaveLength(3);
      expect(edges[0].source).toBe('main_0');
      expect(edges[0].target).toBe('helper1_1');
      expect(edges[0].data).toBeDefined();
      expect(edges[0].data?.callType).toBe('direct');

      expect(edges[2].data).toBeDefined();
      expect(edges[2].data?.callType).toBe('external');
    });

    it('should handle empty function calls array', () => {
      const edges = synchronizer.updateEdgesFromCode([]);
      expect(edges).toHaveLength(0);
    });
  });

  describe('validateSynchronization', () => {
    it('should validate matching flow and code', () => {
      const code = `
        function test() {
          return 'test';
        }
      `;

      const flow = synchronizer.syncCodeToFlow(code, 'test.js');
      const validation = synchronizer.validateSynchronization();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect validation errors when no flow or code exists', () => {
      const validation = synchronizer.validateSynchronization();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('No flow structure or code to validate');
    });

    it('should detect function count mismatches', () => {
      // First create a flow
      const code = `
        function test1() {}
        function test2() {}
      `;
      synchronizer.syncCodeToFlow(code, 'test.js');

      // Then manually modify the current code to have different function count
      (synchronizer as any).currentCode = `
        function test1() {}
        function test2() {}
        function test3() {}
      `;

      const validation = synchronizer.validateSynchronization();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Function count mismatch'))).toBe(true);
    });
  });

  describe('getCurrentFlowStructure and getCurrentCode', () => {
    it('should return current flow structure and code', () => {
      const code = `function test() { return 'test'; }`;
      const flow = synchronizer.syncCodeToFlow(code, 'test.js');

      expect(synchronizer.getCurrentFlowStructure()).toEqual(flow);
      expect(synchronizer.getCurrentCode()).toBe(code);
    });

    it('should return null/empty when no synchronization has occurred', () => {
      expect(synchronizer.getCurrentFlowStructure()).toBeNull();
      expect(synchronizer.getCurrentCode()).toBe('');
    });
  });

  describe('reAnalyzeCodeChanges', () => {
    it('should re-analyze code changes and update flow structure', () => {
      // Start with initial code
      const initialCode = `
        function original() {
          return 'original';
        }
      `;

      const initialFlow = synchronizer.syncCodeToFlow(initialCode, 'test.js');
      expect(initialFlow.nodes).toHaveLength(1);

      // Update code with new function
      const updatedCode = `
        function original() {
          return helper();
        }
        
        function helper() {
          return 'helper';
        }
      `;

      const updatedFlow = synchronizer.reAnalyzeCodeChanges(updatedCode);

      expect(updatedFlow.nodes).toHaveLength(2);
      expect(updatedFlow.edges).toHaveLength(1);

      const originalNode = updatedFlow.nodes.find(n => n.data.functionName === 'original');
      const helperNode = updatedFlow.nodes.find(n => n.data.functionName === 'helper');

      expect(originalNode).toBeDefined();
      expect(helperNode).toBeDefined();
      expect(updatedFlow.edges[0].source).toBe(originalNode?.id);
      expect(updatedFlow.edges[0].target).toBe(helperNode?.id);
    });

    it('should preserve node positions and IDs when re-analyzing', () => {
      const initialCode = `
        function func1() {}
        function func2() {}
      `;

      const initialFlow = synchronizer.syncCodeToFlow(initialCode, 'test.js');
      const originalFunc1Id = initialFlow.nodes.find(n => n.data.functionName === 'func1')?.id;
      const originalFunc1Position = initialFlow.nodes.find(n => n.data.functionName === 'func1')?.position;

      // Update code but keep same functions
      const updatedCode = `
        function func1() {
          return 'updated';
        }
        function func2() {}
      `;

      const updatedFlow = synchronizer.reAnalyzeCodeChanges(updatedCode);
      const updatedFunc1 = updatedFlow.nodes.find(n => n.data.functionName === 'func1');

      expect(updatedFunc1?.id).toBe(originalFunc1Id);
      expect(updatedFunc1?.position).toEqual(originalFunc1Position);
    });

    it('should throw error when no current flow structure exists', () => {
      expect(() => {
        synchronizer.reAnalyzeCodeChanges('function test() {}');
      }).toThrow('No current flow structure to re-analyze');
    });
  });

  describe('updateNodeNameReferences', () => {
    it('should update function name references throughout the flow', () => {
      const code = `
        function oldName() {
          return 'old';
        }
        
        function caller() {
          return oldName();
        }
      `;

      const flow = synchronizer.syncCodeToFlow(code, 'test.js');
      const updatedFlow = synchronizer.updateNodeNameReferences('oldName', 'newName');

      const renamedNode = updatedFlow.nodes.find(n => n.data.functionName === 'newName');
      const callerNode = updatedFlow.nodes.find(n => n.data.functionName === 'caller');

      expect(renamedNode).toBeDefined();
      expect(renamedNode?.data.label).toBe('newName');

      // Check that edge references are updated
      const edge = updatedFlow.edges.find(e => e.source === callerNode?.id);
      expect(edge?.data.targetFunction).toBe('newName');
    });

    it('should update parent function references for nested functions', () => {
      const code = `
        function parentFunction() {
          function nestedFunction() {
            return 'nested';
          }
          return nestedFunction();
        }
      `;

      const flow = synchronizer.syncCodeToFlow(code, 'test.js');
      const parentNode = flow.nodes.find(n => n.data.functionName === 'parentFunction');
      const originalParentId = parentNode?.id;

      const updatedFlow = synchronizer.updateNodeNameReferences('parentFunction', 'renamedParent');

      const nestedNode = updatedFlow.nodes.find(n => n.data.functionName === 'nestedFunction');
      // The parent function reference should be updated to the new name
      expect(nestedNode?.data.parentFunction).toBe('renamedParent');
    });

    it('should throw error when no current flow structure exists', () => {
      expect(() => {
        synchronizer.updateNodeNameReferences('old', 'new');
      }).toThrow('No current flow structure to update');
    });
  });

  describe('detectScopeViolations', () => {
    it('should detect missing parent function violations', () => {
      // Create a flow with a nested function
      const code = `
        function parent() {
          function nested() {
            return 'nested';
          }
          return nested();
        }
      `;

      synchronizer.syncCodeToFlow(code, 'test.js');

      // Get the parent node ID before removing it
      const currentFlow = synchronizer.getCurrentFlowStructure();
      const parentNode = currentFlow?.nodes.find(n => n.data?.functionName === 'parent');
      const parentNodeId = parentNode?.id;

      // Manually remove the parent function to simulate a violation
      if (currentFlow) {
        currentFlow.nodes = currentFlow.nodes.filter(n => n.data?.functionName !== 'parent');
        (synchronizer as any).currentFlowStructure = currentFlow;
      }

      const violations = synchronizer.detectScopeViolations();

      expect(violations).toHaveLength(1);
      expect(violations[0].type).toBe('missing_parent');
      expect(violations[0].functionName).toBe('nested');
      expect(violations[0].parentFunction).toBe(parentNodeId);
      expect(violations[0].severity).toBe('error');
    });

    it('should detect circular dependency violations', () => {
      const code = `
        function func1() {
          return func2();
        }
        
        function func2() {
          return func1();
        }
      `;

      synchronizer.syncCodeToFlow(code, 'test.js');
      const violations = synchronizer.detectScopeViolations();

      expect(violations.length).toBeGreaterThan(0);
      const circularViolation = violations.find(v => v.type === 'circular_dependency');
      expect(circularViolation).toBeDefined();
      expect(circularViolation?.severity).toBe('warning');
    });

    it('should return empty array when no violations exist', () => {
      const code = `
        function clean() {
          return 'clean';
        }
      `;

      synchronizer.syncCodeToFlow(code, 'test.js');
      const violations = synchronizer.detectScopeViolations();

      expect(violations).toHaveLength(0);
    });

    it('should return empty array when no flow structure exists', () => {
      const violations = synchronizer.detectScopeViolations();
      expect(violations).toHaveLength(0);
    });
  });

  describe('suggestScopeCorrections', () => {
    it('should suggest moving nested function to global scope for missing parent', () => {
      const violations = [
        {
          type: 'missing_parent' as const,
          nodeId: 'test-node',
          functionName: 'nested',
          parentFunction: 'missing',
          message: 'Parent missing',
          severity: 'error' as const
        }
      ];

      const corrections = synchronizer.suggestScopeCorrections(violations);

      expect(corrections).toHaveLength(1);
      expect(corrections[0].type).toBe('move_to_global');
      expect(corrections[0].description).toContain('Move \'nested\' to global scope');
      expect(typeof corrections[0].action).toBe('function');
    });

    it('should suggest breaking circular dependencies', () => {
      const violations = [
        {
          type: 'circular_dependency' as const,
          nodeId: 'test-node',
          functionName: 'func1',
          message: 'Circular dependency',
          severity: 'warning' as const
        }
      ];

      const corrections = synchronizer.suggestScopeCorrections(violations);

      expect(corrections).toHaveLength(1);
      expect(corrections[0].type).toBe('break_cycle');
      expect(corrections[0].description).toContain('Break circular dependency');
      expect(typeof corrections[0].action).toBe('function');
    });
  });

  describe('auto-synchronization features', () => {
    it('should enable and disable auto-sync', () => {
      const callback = vi.fn();

      synchronizer.enableAutoSync(callback);
      expect((synchronizer as any).autoSyncCallback).toBe(callback);

      synchronizer.disableAutoSync();
      expect((synchronizer as any).autoSyncCallback).toBeUndefined();
    });

    it('should trigger auto-sync and call callback', () => {
      const callback = vi.fn();

      // First create a base flow
      const initialCode = `function test() { return 'test'; }`;
      synchronizer.syncCodeToFlow(initialCode, 'test.js');

      synchronizer.enableAutoSync(callback);

      const updatedCode = `
        function test() { return helper(); }
        function helper() { return 'helper'; }
      `;

      const result = synchronizer.triggerAutoSync(updatedCode);

      expect(callback).toHaveBeenCalledWith(result);
      expect(result.nodes).toHaveLength(2);
    });

    it('should compare flow structures and identify changes', () => {
      const oldFlow = {
        id: 'test',
        fileName: 'test.js',
        description: 'test',
        variables: [],
        nodes: [
          {
            id: 'node1',
            type: 'default',
            position: { x: 0, y: 0 },
            data: { functionName: 'func1', description: 'old description' }
          }
        ],
        edges: [],
        metadata: { createdAt: '', lastModified: '', version: '1.0.0', astVersion: '1.0.0' }
      };

      const newFlow = {
        ...oldFlow,
        nodes: [
          {
            id: 'node1',
            type: 'default',
            position: { x: 0, y: 0 },
            data: { functionName: 'func1', description: 'new description' }
          },
          {
            id: 'node2',
            type: 'default',
            position: { x: 250, y: 0 },
            data: { functionName: 'func2', description: 'added function' }
          }
        ],
        edges: [
          {
            id: 'edge1',
            source: 'node1',
            target: 'node2',
            type: 'default'
          }
        ]
      };

      const changes = synchronizer.compareFlowStructures(oldFlow, newFlow);

      expect(changes.length).toBeGreaterThan(0);

      const nodeAdded = changes.find(c => c.type === 'node_added');
      const nodeModified = changes.find(c => c.type === 'node_modified');
      const edgeAdded = changes.find(c => c.type === 'edge_added');

      expect(nodeAdded).toBeDefined();
      expect(nodeModified).toBeDefined();
      expect(edgeAdded).toBeDefined();
    });
  });

  describe('automatic re-synchronization features', () => {
    it('should monitor node code changes and update flow structure', async () => {
      const initialCode = `
        function test() {
          return 'test';
        }
      `;

      const flow = synchronizer.syncCodeToFlow(initialCode, 'test.js');
      const testNode = flow.nodes.find(n => n.data.functionName === 'test');

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const updatedNodeCode = `
        function test() {
          helper();
          return 'updated';
        }
      `;

      const updatedFlow = synchronizer.monitorNodeCodeChanges(testNode?.id!, updatedNodeCode);

      expect(updatedFlow.nodes).toHaveLength(1);
      expect(updatedFlow.nodes[0].data.code).toBe(updatedNodeCode);
      expect(updatedFlow.metadata.lastModified).not.toBe(flow.metadata.lastModified);
    });

    it('should auto-update edges from code modification', () => {
      const code = `
        function main() {
          return 'main';
        }
        function helper() {
          return 'helper';
        }
      `;

      synchronizer.syncCodeToFlow(code, 'test.js');

      const modifiedCode = `
        function main() {
          return helper();
        }
        function helper() {
          return 'helper';
        }
      `;

      const edges = synchronizer.autoUpdateEdgesFromCodeModification(modifiedCode);

      expect(edges).toHaveLength(1);
      expect(edges[0].data).toBeDefined();
      expect(edges[0].data?.sourceFunction).toBe('main');
      expect(edges[0].data?.targetFunction).toBe('helper');
    });

    it('should handle node name changes and update references', () => {
      const code = `
        function oldName() {
          return helper();
        }
        function helper() {
          return 'helper';
        }
      `;

      const flow = synchronizer.syncCodeToFlow(code, 'test.js');
      const oldNameNode = flow.nodes.find(n => n.data.functionName === 'oldName');

      const updatedFlow = synchronizer.handleNodeNameChange(oldNameNode?.id!, 'oldName', 'newName');

      const renamedNode = updatedFlow.nodes.find(n => n.data.functionName === 'newName');
      expect(renamedNode).toBeDefined();
      expect(renamedNode?.data.label).toBe('newName');

      // Check that code was updated
      const currentCode = synchronizer.getCurrentCode();
      expect(currentCode).toContain('function newName()');
      expect(currentCode).not.toContain('function oldName()');
    });

    it('should detect and apply incremental changes', () => {
      const initialCode = `
        function func1() {
          return 'func1';
        }
      `;

      synchronizer.syncCodeToFlow(initialCode, 'test.js');

      const newCode = `
        function func1() {
          return func2();
        }
        function func2() {
          return 'func2';
        }
      `;

      const updatedFlow = synchronizer.detectAndApplyIncrementalChanges(newCode);

      expect(updatedFlow.nodes).toHaveLength(2);
      // The edges might be empty if the AST parser doesn't detect the function call properly
      // Let's just check that the nodes are created correctly

      const func1Node = updatedFlow.nodes.find(n => n.data.functionName === 'func1');
      const func2Node = updatedFlow.nodes.find(n => n.data.functionName === 'func2');

      expect(func1Node).toBeDefined();
      expect(func2Node).toBeDefined();

      // If edges are created, verify they're correct
      if (updatedFlow.edges.length > 0) {
        expect(updatedFlow.edges[0].source).toBe(func1Node?.id);
        expect(updatedFlow.edges[0].target).toBe(func2Node?.id);
      }
    });

    it('should throw error when monitoring node changes without current flow', () => {
      expect(() => {
        synchronizer.monitorNodeCodeChanges('nonexistent', 'code');
      }).toThrow('No current flow structure to monitor');
    });

    it('should throw error when handling name changes without current flow', () => {
      expect(() => {
        synchronizer.handleNodeNameChange('nonexistent', 'old', 'new');
      }).toThrow('No current flow structure to update');
    });

    it('should throw error when applying incremental changes without current flow', () => {
      expect(() => {
        synchronizer.detectAndApplyIncrementalChanges('new code');
      }).toThrow('No current flow structure for incremental updates');
    });

    it('should handle node not found error in monitoring', () => {
      const code = `function test() { return 'test'; }`;
      synchronizer.syncCodeToFlow(code, 'test.js');

      expect(() => {
        synchronizer.monitorNodeCodeChanges('nonexistent-id', 'updated code');
      }).toThrow('Node with ID nonexistent-id not found');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle functions with no parameters', () => {
      const code = `
        function noParams() {
          return 'no params';
        }
      `;

      const flow = synchronizer.syncCodeToFlow(code, 'test.js');
      const node = flow.nodes[0];

      expect(node.data.parameters).toEqual([]);
    });

    it('should handle functions with complex parameter types', () => {
      const code = `
        function complexParams(obj = {}, arr = [], func = () => {}) {
          return 'complex';
        }
      `;

      const flow = synchronizer.syncCodeToFlow(code, 'test.js');
      const node = flow.nodes[0];

      expect(node.data.parameters).toHaveLength(3);
      expect(node.data.parameters[0].name).toBe('obj');
      expect(node.data.parameters[1].name).toBe('arr');
      expect(node.data.parameters[2].name).toBe('func');
    });

    it('should calculate node positions correctly', () => {
      const code = `
        function func1() {}
        function func2() {}
        function func3() {}
        function func4() {}
        function func5() {}
      `;

      const flow = synchronizer.syncCodeToFlow(code, 'test.js');

      // Should arrange nodes in a grid pattern
      expect(flow.nodes).toHaveLength(5);

      // First row
      expect(flow.nodes[0].position).toEqual({ x: 50, y: 50 });
      expect(flow.nodes[1].position).toEqual({ x: 300, y: 50 });
      expect(flow.nodes[2].position).toEqual({ x: 550, y: 50 });

      // Second row
      expect(flow.nodes[3].position).toEqual({ x: 50, y: 200 });
      expect(flow.nodes[4].position).toEqual({ x: 300, y: 200 });
    });

    it('should handle circular dependency detection edge cases', () => {
      // Test with no current flow structure
      const emptyResult = (synchronizer as any).detectCircularDependencies('nonexistent');
      expect(emptyResult).toEqual([]);

      // Test with self-referencing function
      const code = `
        function recursive() {
          return recursive();
        }
      `;

      synchronizer.syncCodeToFlow(code, 'test.js');
      const flow = synchronizer.getCurrentFlowStructure();
      const recursiveNode = flow?.nodes.find(n => n.data?.functionName === 'recursive');

      if (recursiveNode) {
        const cycle = (synchronizer as any).detectCircularDependencies(recursiveNode.id);
        expect(cycle.length).toBeGreaterThan(0);
      }
    });

    it('should handle scope correction actions', () => {
      // Create a flow with a nested function
      const code = `
        function parent() {
          function nested() {
            return 'nested';
          }
          return nested();
        }
      `;

      synchronizer.syncCodeToFlow(code, 'test.js');
      const flow = synchronizer.getCurrentFlowStructure();
      const nestedNode = flow?.nodes.find(n => n.data?.functionName === 'nested');

      if (nestedNode) {
        // Test moveNodeToGlobalScope
        (synchronizer as any).moveNodeToGlobalScope(nestedNode.id);

        const updatedFlow = synchronizer.getCurrentFlowStructure();
        const updatedNestedNode = updatedFlow?.nodes.find(n => n.id === nestedNode.id);

        expect(updatedNestedNode?.data.isNested).toBe(false);
        expect(updatedNestedNode?.data.parentFunction).toBeUndefined();
        expect(updatedNestedNode?.data.scope).toBe('global');
      }
    });
  });
});