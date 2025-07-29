import { FlowCodeSynchronizer } from '../FlowCodeSynchronizer';
import { ASTParserService } from '../../ASTParserService';
import { ParserFactory } from '../../factories/ParserFactory';
import { ExtractorFactory } from '../../factories/ExtractorFactory';
import { ASTTraverser } from '../../core/ASTTraverser';
import { ASTError } from '../../errors/ASTError';
import { beforeEach, describe, expect, it } from 'vitest';

describe('FlowCodeSynchronizer Integration', () => {
  let synchronizer: FlowCodeSynchronizer;
  let parserService: ASTParserService;

  beforeEach(() => {
    // Create real dependencies for integration testing
    const parser = ParserFactory.createParser('babel');
    const traverser = new ASTTraverser();
    const extractors = ExtractorFactory.createExtractors(traverser);
    parserService = new ASTParserService(parser, extractors);
    
    synchronizer = new FlowCodeSynchronizer(parserService);
  });

  describe('constructor validation', () => {
    it('should throw ASTError when parser service is null', () => {
      expect(() => {
        new FlowCodeSynchronizer(null as any);
      }).toThrow(ASTError);
    });

    it('should throw ASTError when parser service does not implement parseFile', () => {
      const invalidParser = {} as any;
      expect(() => {
        new FlowCodeSynchronizer(invalidParser);
      }).toThrow(ASTError);
    });

    it('should accept valid parser service', () => {
      expect(() => {
        new FlowCodeSynchronizer(parserService);
      }).not.toThrow();
    });
  });

  describe('dependency injection', () => {
    it('should use injected parser service for code parsing', () => {
      const code = `
        function testFunction() {
          return 'test';
        }
      `;

      const flow = synchronizer.syncCodeToFlow(code, 'test.js');

      expect(flow).toBeDefined();
      expect(flow.fileName).toBe('test.js');
      expect(flow.nodes).toHaveLength(1);
      expect(flow.nodes[0].data.functionName).toBe('testFunction');
    });

    it('should handle parsing errors with ASTError', () => {
      const invalidCode = 'function invalid( {';

      expect(() => {
        synchronizer.syncCodeToFlow(invalidCode, 'invalid.js');
      }).toThrow(ASTError);
    });

    it('should maintain existing functionality while using new architecture', () => {
      const code = `
        function add(a, b) {
          return a + b;
        }
        
        function multiply(x, y) {
          return add(x * y, 0);
        }
      `;

      const flow = synchronizer.syncCodeToFlow(code, 'calculator.js');

      expect(flow.nodes).toHaveLength(2);
      expect(flow.edges).toHaveLength(1);
      
      const addNode = flow.nodes.find(n => n.data.functionName === 'add');
      const multiplyNode = flow.nodes.find(n => n.data.functionName === 'multiply');
      
      expect(addNode).toBeDefined();
      expect(multiplyNode).toBeDefined();
      expect(flow.edges[0].source).toBe(multiplyNode?.id);
      expect(flow.edges[0].target).toBe(addNode?.id);
    });
  });

  describe('error handling with ASTError', () => {
    it('should throw ASTError for missing flow structure', () => {
      expect(() => {
        synchronizer.updateCodeFromFlowChanges([]);
      }).toThrow(ASTError);
      
      expect(() => {
        synchronizer.updateCodeFromFlowChanges([]);
      }).toThrow('No current flow structure to update from');
    });

    it('should throw ASTError for re-analysis without flow structure', () => {
      expect(() => {
        synchronizer.reAnalyzeCodeChanges('function test() {}');
      }).toThrow(ASTError);
      
      expect(() => {
        synchronizer.reAnalyzeCodeChanges('function test() {}');
      }).toThrow('No current flow structure to re-analyze');
    });

    it('should throw ASTError for node name updates without flow structure', () => {
      expect(() => {
        synchronizer.updateNodeNameReferences('old', 'new');
      }).toThrow(ASTError);
      
      expect(() => {
        synchronizer.updateNodeNameReferences('old', 'new');
      }).toThrow('No current flow structure to update');
    });
  });
});