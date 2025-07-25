/**
 * Tests for wrapper function support in VariableConfigurationService
 * 
 * This test suite validates the detection and handling of wrapper functions
 * that contain all other functions in a code file and can be treated as
 * "flow nodes" with flow-level variable configuration.
 */

import { VariableConfigurationService } from '../VariableConfigurationService';
import { BabelParser } from '../../parsers/BabelParser';
import { FunctionMetadata } from '../../types/ASTTypes';

describe('VariableConfigurationService - Wrapper Function Support', () => {
  let service: VariableConfigurationService;
  let babelParser: BabelParser;

  beforeEach(() => {
    babelParser = new BabelParser();
    service = new VariableConfigurationService(babelParser);
  });

  describe('Wrapper Function Detection', () => {
    it('should identify wrapper function with main/start naming pattern', () => {
      const code = `
        function helper1() {
          return "helper";
        }
        
        function helper2() {
          return "helper2";
        }
        
        function startMainFlow() {
          const config = "production";
          const timeout = 5000;
          
          console.log("Starting main flow");
          
          try {
            const result1 = helper1();
            const result2 = helper2();
            return { result1, result2, config };
          } catch (error) {
            console.error("Flow failed:", error);
            throw error;
          }
        }
      `;

      const functions: FunctionMetadata[] = [
        {
          id: 'helper1',
          name: 'helper1',
          description: 'Helper function 1',
          parameters: [],
          sourceLocation: { start: { line: 2, column: 0 }, end: { line: 4, column: 1 } },
          isNested: false,
          scope: 'global',
          code: 'function helper1() {\n  return "helper";\n}'
        },
        {
          id: 'helper2',
          name: 'helper2',
          description: 'Helper function 2',
          parameters: [],
          sourceLocation: { start: { line: 6, column: 0 }, end: { line: 8, column: 1 } },
          isNested: false,
          scope: 'global',
          code: 'function helper2() {\n  return "helper2";\n}'
        },
        {
          id: 'startMainFlow',
          name: 'startMainFlow',
          description: 'Main flow entry point',
          parameters: [],
          sourceLocation: { start: { line: 10, column: 0 }, end: { line: 22, column: 1 } },
          isNested: false,
          scope: 'global',
          code: code.substring(code.indexOf('function startMainFlow'), code.lastIndexOf('}') + 1)
        }
      ];

      const result = service.analyzeVariableConfiguration(code, functions);

      expect(result.wrapperFunction).toBeDefined();
      expect(result.wrapperFunction!.functionInfo.name).toBe('startMainFlow');
      expect(result.wrapperFunction!.isFlowWrapper).toBe(true);
      expect(result.wrapperFunction!.wrapperConfidence).toBeGreaterThan(0.6);
    });

    it('should identify wrapper function based on function calls to other functions', () => {
      const code = `
        function processData() {
          return { data: "processed" };
        }
        
        function validateInput() {
          return true;
        }
        
        function orchestrator() {
          const maxRetries = 3;
          const enableLogging = true;
          
          if (validateInput()) {
            const result = processData();
            return result;
          }
          
          return null;
        }
      `;

      const functions: FunctionMetadata[] = [
        {
          id: 'processData',
          name: 'processData',
          description: 'Process data function',
          parameters: [],
          sourceLocation: { start: { line: 2, column: 0 }, end: { line: 4, column: 1 } },
          isNested: false,
          scope: 'global',
          code: 'function processData() {\n  return { data: "processed" };\n}'
        },
        {
          id: 'validateInput',
          name: 'validateInput',
          description: 'Validate input function',
          parameters: [],
          sourceLocation: { start: { line: 6, column: 0 }, end: { line: 8, column: 1 } },
          isNested: false,
          scope: 'global',
          code: 'function validateInput() {\n  return true;\n}'
        },
        {
          id: 'orchestrator',
          name: 'orchestrator',
          description: 'Orchestrates the flow',
          parameters: [],
          sourceLocation: { start: { line: 10, column: 0 }, end: { line: 20, column: 1 } },
          isNested: false,
          scope: 'global',
          code: code.substring(code.indexOf('function orchestrator'))
        }
      ];

      const result = service.analyzeVariableConfiguration(code, functions);

      expect(result.wrapperFunction).toBeDefined();
      expect(result.wrapperFunction!.functionInfo.name).toBe('orchestrator');
      expect(result.wrapperFunction!.variables.length).toBeGreaterThanOrEqual(2);
      expect(result.wrapperFunction!.variables.map(v => v.name)).toContain('maxRetries');
      expect(result.wrapperFunction!.variables.map(v => v.name)).toContain('enableLogging');
    });

    it('should not identify utility functions as wrappers', () => {
      const code = `
        function getConfig() {
          const apiUrl = "https://api.example.com";
          return { apiUrl };
        }
        
        function createConnection() {
          const timeout = 5000;
          return { timeout };
        }
        
        function processRequest() {
          const retries = 3;
          return { retries };
        }
      `;

      const functions: FunctionMetadata[] = [
        {
          id: 'getConfig',
          name: 'getConfig',
          description: 'Get configuration',
          parameters: [],
          sourceLocation: { start: { line: 2, column: 0 }, end: { line: 5, column: 1 } },
          isNested: false,
          scope: 'global',
          code: 'function getConfig() {\n  const apiUrl = "https://api.example.com";\n  return { apiUrl };\n}'
        },
        {
          id: 'createConnection',
          name: 'createConnection',
          description: 'Create connection',
          parameters: [],
          sourceLocation: { start: { line: 7, column: 0 }, end: { line: 10, column: 1 } },
          isNested: false,
          scope: 'global',
          code: 'function createConnection() {\n  const timeout = 5000;\n  return { timeout };\n}'
        },
        {
          id: 'processRequest',
          name: 'processRequest',
          description: 'Process request',
          parameters: [],
          sourceLocation: { start: { line: 12, column: 0 }, end: { line: 15, column: 1 } },
          isNested: false,
          scope: 'global',
          code: 'function processRequest() {\n  const retries = 3;\n  return { retries };\n}'
        }
      ];

      const result = service.analyzeVariableConfiguration(code, functions);

      // Should not identify any wrapper function since all are utility-like
      expect(result.wrapperFunction).toBeUndefined();
    });
  });

  describe('Flow-Level Variables', () => {
    it('should mark wrapper function variables as flow-level', () => {
      const code = `
        function helper() {
          return "help";
        }
        
        function mainFlow() {
          const environment = "production";
          const debugMode = false;
          const maxConnections = 10;
          
          console.log("Starting flow");
          const result = helper();
          return { result, environment };
        }
      `;

      const functions: FunctionMetadata[] = [
        {
          id: 'helper',
          name: 'helper',
          description: 'Helper function',
          parameters: [],
          sourceLocation: { start: { line: 2, column: 0 }, end: { line: 4, column: 1 } },
          isNested: false,
          scope: 'global',
          code: 'function helper() {\n  return "help";\n}'
        },
        {
          id: 'mainFlow',
          name: 'mainFlow',
          description: 'Main flow entry point',
          parameters: [],
          sourceLocation: { start: { line: 6, column: 0 }, end: { line: 13, column: 1 } },
          isNested: false,
          scope: 'global',
          code: code.substring(code.indexOf('function mainFlow'))
        }
      ];

      const result = service.analyzeVariableConfiguration(code, functions);

      expect(result.flowLevelVariables.length).toBeGreaterThanOrEqual(3);
      expect(result.flowLevelVariables.every(v => v.isFlowLevel)).toBe(true);
      expect(result.flowLevelVariables.every(v => v.containingFunction === 'mainFlow')).toBe(true);
      
      const variableNames = result.flowLevelVariables.map(v => v.name);
      expect(variableNames).toContain('environment');
      expect(variableNames).toContain('debugMode');
      expect(variableNames).toContain('maxConnections');
    });

    it('should separate flow-level and function-level variables', () => {
      const code = `
        function utility() {
          const utilConfig = "util";
          return utilConfig;
        }
        
        function startFlow() {
          const flowConfig = "flow";
          const timeout = 5000;
          
          const result = utility();
          return result;
        }
      `;

      const functions: FunctionMetadata[] = [
        {
          id: 'utility',
          name: 'utility',
          description: 'Utility function',
          parameters: [],
          sourceLocation: { start: { line: 2, column: 0 }, end: { line: 5, column: 1 } },
          isNested: false,
          scope: 'global',
          code: 'function utility() {\n  const utilConfig = "util";\n  return utilConfig;\n}'
        },
        {
          id: 'startFlow',
          name: 'startFlow',
          description: 'Start flow function',
          parameters: [],
          sourceLocation: { start: { line: 7, column: 0 }, end: { line: 13, column: 1 } },
          isNested: false,
          scope: 'global',
          code: code.substring(code.indexOf('function startFlow'))
        }
      ];

      const result = service.analyzeVariableConfiguration(code, functions);

      expect(result.flowLevelVariables.length).toBeGreaterThanOrEqual(2);
      expect(result.functionLevelVariables).toHaveLength(1);
      
      const flowVariableNames = result.flowLevelVariables.map(v => v.name);
      expect(flowVariableNames).toContain('flowConfig');
      expect(flowVariableNames).toContain('timeout');
      expect(result.functionLevelVariables.map(v => v.name)).toEqual(['utilConfig']);
    });
  });

  describe('Flow Node Configuration', () => {
    it('should create flow node configuration from wrapper function', () => {
      const wrapperFunction = {
        functionInfo: {
          id: 'mainFlow',
          name: 'mainFlow',
          description: 'Main flow entry point',
          parameters: [],
          sourceLocation: { start: { line: 1, column: 0 }, end: { line: 10, column: 1 } },
          isNested: false,
          scope: 'global' as const,
          code: 'function mainFlow() { ... }'
        },
        variables: [
          {
            id: 'mainFlow_config_1',
            name: 'config',
            type: 'const' as const,
            sourceLocation: { start: { line: 2, column: 0 }, end: { line: 2, column: 20 } },
            scope: 'function' as const,
            containingFunction: 'mainFlow',
            initialValue: 'production',
            currentValue: 'production',
            isConfigurable: true,
            isFlowLevel: true,
            suggestedType: 'string' as const,
            declarationCode: 'const config = "production";'
          },
          {
            id: 'mainFlow_timeout_3',
            name: 'timeout',
            type: 'const' as const,
            sourceLocation: { start: { line: 3, column: 0 }, end: { line: 3, column: 20 } },
            scope: 'function' as const,
            containingFunction: 'mainFlow',
            initialValue: 5000,
            currentValue: 5000,
            isConfigurable: true,
            isFlowLevel: true,
            suggestedType: 'number' as const,
            declarationCode: 'const timeout = 5000;'
          }
        ],
        isFlowWrapper: true,
        wrapperConfidence: 0.8
      };

      const flowNodeConfig = service.createFlowNodeConfiguration(wrapperFunction);

      expect(flowNodeConfig.nodeId).toBe('flow_mainFlow');
      expect(flowNodeConfig.title).toBe('mainFlow');
      expect(flowNodeConfig.description).toBe('Main flow entry point');
      expect(flowNodeConfig.isFlowNode).toBe(true);
      expect(flowNodeConfig.parameters).toHaveLength(2);
      expect(flowNodeConfig.parameters.map(p => p.name)).toEqual(['config', 'timeout']);
    });

    it('should get configurable parameters for flow', () => {
      const wrapperFunction = {
        functionInfo: {
          id: 'flow',
          name: 'flow',
          description: 'Flow function',
          parameters: [],
          sourceLocation: { start: { line: 1, column: 0 }, end: { line: 10, column: 1 } },
          isNested: false,
          scope: 'global' as const,
          code: 'function flow() { ... }'
        },
        variables: [
          {
            id: 'flow_configurable_1',
            name: 'configurable',
            type: 'const' as const,
            sourceLocation: { start: { line: 2, column: 0 }, end: { line: 2, column: 20 } },
            scope: 'function' as const,
            containingFunction: 'flow',
            initialValue: 'value',
            currentValue: 'value',
            isConfigurable: true,
            isFlowLevel: true,
            suggestedType: 'string' as const,
            declarationCode: 'const configurable = "value";'
          },
          {
            id: 'flow_notConfigurable_2',
            name: 'notConfigurable',
            type: 'let' as const,
            sourceLocation: { start: { line: 3, column: 0 }, end: { line: 3, column: 20 } },
            scope: 'function' as const,
            containingFunction: 'flow',
            initialValue: undefined,
            currentValue: undefined,
            isConfigurable: false,
            isFlowLevel: true,
            suggestedType: undefined,
            declarationCode: 'let notConfigurable;'
          }
        ],
        isFlowWrapper: true,
        wrapperConfidence: 0.7
      };

      const parameters = service.getFlowParameters(wrapperFunction);

      expect(parameters).toHaveLength(1);
      expect(parameters[0].name).toBe('configurable');
      expect(parameters[0].isConfigurable).toBe(true);
    });
  });

  describe('Variable Scoping Validation', () => {
    it('should detect variable shadowing violations', () => {
      const variables = [
        {
          id: 'outer_config_1',
          name: 'config',
          type: 'const' as const,
          sourceLocation: { start: { line: 1, column: 0 }, end: { line: 1, column: 20 } },
          scope: 'function' as const,
          containingFunction: 'outer',
          initialValue: 'outer',
          currentValue: 'outer',
          isConfigurable: true,
          isFlowLevel: false,
          suggestedType: 'string' as const,
          declarationCode: 'const config = "outer";'
        },
        {
          id: 'inner_config_5',
          name: 'config',
          type: 'const' as const,
          sourceLocation: { start: { line: 5, column: 0 }, end: { line: 5, column: 20 } },
          scope: 'function' as const,
          containingFunction: 'inner',
          initialValue: 'inner',
          currentValue: 'inner',
          isConfigurable: true,
          isFlowLevel: false,
          suggestedType: 'string' as const,
          declarationCode: 'const config = "inner";'
        }
      ];

      const functions: FunctionMetadata[] = [
        {
          id: 'outer',
          name: 'outer',
          description: 'Outer function',
          parameters: [],
          sourceLocation: { start: { line: 1, column: 0 }, end: { line: 10, column: 1 } },
          isNested: false,
          scope: 'global',
          code: 'function outer() { ... }'
        },
        {
          id: 'inner',
          name: 'inner',
          description: 'Inner function',
          parameters: [],
          sourceLocation: { start: { line: 4, column: 0 }, end: { line: 8, column: 1 } },
          isNested: true,
          parentFunction: 'outer',
          scope: 'function',
          code: 'function inner() { ... }'
        }
      ];

      const validation = service.validateVariableScoping(variables, functions);

      expect(validation.isValid).toBe(false);
      expect(validation.violations).toHaveLength(1);
      expect(validation.violations[0].violation).toBe('shadowing');
      expect(validation.violations[0].variable.name).toBe('config');
    });

    it('should pass validation for properly scoped variables', () => {
      const variables = [
        {
          id: 'func1_config_1',
          name: 'config',
          type: 'const' as const,
          sourceLocation: { start: { line: 1, column: 0 }, end: { line: 1, column: 20 } },
          scope: 'function' as const,
          containingFunction: 'func1',
          initialValue: 'config1',
          currentValue: 'config1',
          isConfigurable: true,
          isFlowLevel: false,
          suggestedType: 'string' as const,
          declarationCode: 'const config = "config1";'
        },
        {
          id: 'func2_setting_1',
          name: 'setting',
          type: 'const' as const,
          sourceLocation: { start: { line: 5, column: 0 }, end: { line: 5, column: 20 } },
          scope: 'function' as const,
          containingFunction: 'func2',
          initialValue: 'setting2',
          currentValue: 'setting2',
          isConfigurable: true,
          isFlowLevel: false,
          suggestedType: 'string' as const,
          declarationCode: 'const setting = "setting2";'
        }
      ];

      const functions: FunctionMetadata[] = [
        {
          id: 'func1',
          name: 'func1',
          description: 'Function 1',
          parameters: [],
          sourceLocation: { start: { line: 1, column: 0 }, end: { line: 3, column: 1 } },
          isNested: false,
          scope: 'global',
          code: 'function func1() { ... }'
        },
        {
          id: 'func2',
          name: 'func2',
          description: 'Function 2',
          parameters: [],
          sourceLocation: { start: { line: 5, column: 0 }, end: { line: 7, column: 1 } },
          isNested: false,
          scope: 'global',
          code: 'function func2() { ... }'
        }
      ];

      const validation = service.validateVariableScoping(variables, functions);

      expect(validation.isValid).toBe(true);
      expect(validation.violations).toHaveLength(0);
    });
  });

  describe('Wrapper Function Code Generation', () => {
    it('should generate wrapper function code with configurable parameters', () => {
      const originalFunction: FunctionMetadata = {
        id: 'mainFlow',
        name: 'mainFlow',
        description: 'Main flow function',
        parameters: [],
        sourceLocation: { start: { line: 1, column: 0 }, end: { line: 10, column: 1 } },
        isNested: false,
        scope: 'global',
        code: `function mainFlow() {
  const config = "production";
  const timeout = 5000;
  
  console.log("Starting flow");
  return { config, timeout };
}`
      };

      const configurableVariables = [
        {
          id: 'mainFlow_config_2',
          name: 'config',
          type: 'const' as const,
          sourceLocation: { start: { line: 2, column: 0 }, end: { line: 2, column: 25 } },
          scope: 'function' as const,
          containingFunction: 'mainFlow',
          initialValue: 'production',
          currentValue: 'staging',
          isConfigurable: true,
          isFlowLevel: true,
          suggestedType: 'string' as const,
          declarationCode: 'const config = "production";'
        },
        {
          id: 'mainFlow_timeout_3',
          name: 'timeout',
          type: 'const' as const,
          sourceLocation: { start: { line: 3, column: 0 }, end: { line: 3, column: 20 } },
          scope: 'function' as const,
          containingFunction: 'mainFlow',
          initialValue: 5000,
          currentValue: 3000,
          isConfigurable: true,
          isFlowLevel: true,
          suggestedType: 'number' as const,
          declarationCode: 'const timeout = 5000;'
        }
      ];

      const generatedCode = service.generateWrapperFunctionCode(originalFunction, configurableVariables);

      expect(generatedCode).toContain('function mainFlow(config = "staging", timeout = 3000)');
      expect(generatedCode).toContain('console.log("Starting flow");');
      expect(generatedCode).toContain('return { config, timeout };');
      expect(generatedCode).not.toContain('const config =');
      expect(generatedCode).not.toContain('const timeout =');
    });
  });
});