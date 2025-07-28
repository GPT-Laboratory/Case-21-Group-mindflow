import * as t from '@babel/types';
import { SourceLocationUtils } from '../SourceLocationUtils';
import { SourceLocation } from '../../types/ASTTypes';

describe('SourceLocationUtils', () => {
  const createMockNode = (startLine: number, startColumn: number, endLine: number, endColumn: number): t.Node => {
    const node = t.identifier('test');
    node.loc = {
      start: { line: startLine, column: startColumn },
      end: { line: endLine, column: endColumn }
    };
    return node;
  };

  const createSourceLocation = (startLine: number, startColumn: number, endLine: number, endColumn: number): SourceLocation => ({
    start: { line: startLine, column: startColumn },
    end: { line: endLine, column: endColumn }
  });

  describe('extract', () => {
    it('should extract source location from node with location info', () => {
      const node = createMockNode(1, 0, 1, 4);
      const location = SourceLocationUtils.extract(node);
      
      expect(location).toEqual({
        start: { line: 1, column: 0 },
        end: { line: 1, column: 4 }
      });
    });

    it('should return default location for node without location info', () => {
      const node = t.identifier('test');
      const location = SourceLocationUtils.extract(node);
      
      expect(location).toEqual({
        start: { line: 0, column: 0 },
        end: { line: 0, column: 0 }
      });
    });
  });

  describe('extractFromComment', () => {
    it('should extract location from comment with location info', () => {
      const comment = {
        type: 'CommentBlock',
        value: 'test comment',
        loc: {
          start: { line: 2, column: 0 },
          end: { line: 2, column: 15 }
        }
      };
      
      const location = SourceLocationUtils.extractFromComment(comment);
      expect(location).toEqual({
        start: { line: 2, column: 0 },
        end: { line: 2, column: 15 }
      });
    });

    it('should return default location for comment without location info', () => {
      const comment = {
        type: 'CommentBlock',
        value: 'test comment'
      };
      
      const location = SourceLocationUtils.extractFromComment(comment);
      expect(location).toEqual({
        start: { line: 0, column: 0 },
        end: { line: 0, column: 0 }
      });
    });
  });

  describe('isValidLocation', () => {
    it('should return true for valid locations', () => {
      const location = createSourceLocation(1, 0, 1, 4);
      expect(SourceLocationUtils.isValidLocation(location)).toBe(true);
    });

    it('should return true for locations with only start position', () => {
      const location = createSourceLocation(1, 0, 0, 0);
      expect(SourceLocationUtils.isValidLocation(location)).toBe(true);
    });

    it('should return true for locations with only end position', () => {
      const location = createSourceLocation(0, 0, 1, 4);
      expect(SourceLocationUtils.isValidLocation(location)).toBe(true);
    });

    it('should return false for zero locations', () => {
      const location = createSourceLocation(0, 0, 0, 0);
      expect(SourceLocationUtils.isValidLocation(location)).toBe(false);
    });
  });

  describe('compare', () => {
    it('should return -1 when first location comes before second', () => {
      const loc1 = createSourceLocation(1, 0, 1, 4);
      const loc2 = createSourceLocation(2, 0, 2, 4);
      expect(SourceLocationUtils.compare(loc1, loc2)).toBe(-1);
    });

    it('should return 1 when first location comes after second', () => {
      const loc1 = createSourceLocation(2, 0, 2, 4);
      const loc2 = createSourceLocation(1, 0, 1, 4);
      expect(SourceLocationUtils.compare(loc1, loc2)).toBe(1);
    });

    it('should return 0 when locations are the same', () => {
      const loc1 = createSourceLocation(1, 0, 1, 4);
      const loc2 = createSourceLocation(1, 0, 1, 4);
      expect(SourceLocationUtils.compare(loc1, loc2)).toBe(0);
    });

    it('should compare by column when lines are the same', () => {
      const loc1 = createSourceLocation(1, 0, 1, 4);
      const loc2 = createSourceLocation(1, 5, 1, 9);
      expect(SourceLocationUtils.compare(loc1, loc2)).toBe(-1);
    });
  });

  describe('isBefore', () => {
    it('should return true when first location is before second', () => {
      const loc1 = createSourceLocation(1, 0, 1, 4);
      const loc2 = createSourceLocation(2, 0, 2, 4);
      expect(SourceLocationUtils.isBefore(loc1, loc2)).toBe(true);
    });

    it('should return false when first location is after second', () => {
      const loc1 = createSourceLocation(2, 0, 2, 4);
      const loc2 = createSourceLocation(1, 0, 1, 4);
      expect(SourceLocationUtils.isBefore(loc1, loc2)).toBe(false);
    });
  });

  describe('isAfter', () => {
    it('should return true when first location is after second', () => {
      const loc1 = createSourceLocation(2, 0, 2, 4);
      const loc2 = createSourceLocation(1, 0, 1, 4);
      expect(SourceLocationUtils.isAfter(loc1, loc2)).toBe(true);
    });

    it('should return false when first location is before second', () => {
      const loc1 = createSourceLocation(1, 0, 1, 4);
      const loc2 = createSourceLocation(2, 0, 2, 4);
      expect(SourceLocationUtils.isAfter(loc1, loc2)).toBe(false);
    });
  });

  describe('isWithinRange', () => {
    it('should return true when location is within range', () => {
      const location = createSourceLocation(2, 0, 2, 4);
      const rangeStart = createSourceLocation(1, 0, 1, 4);
      const rangeEnd = createSourceLocation(3, 0, 3, 4);
      
      expect(SourceLocationUtils.isWithinRange(location, rangeStart, rangeEnd)).toBe(true);
    });

    it('should return false when location is outside range', () => {
      const location = createSourceLocation(4, 0, 4, 4);
      const rangeStart = createSourceLocation(1, 0, 1, 4);
      const rangeEnd = createSourceLocation(3, 0, 3, 4);
      
      expect(SourceLocationUtils.isWithinRange(location, rangeStart, rangeEnd)).toBe(false);
    });

    it('should return true when location equals range boundaries', () => {
      const rangeStart = createSourceLocation(1, 0, 1, 4);
      const rangeEnd = createSourceLocation(3, 0, 3, 4);
      
      expect(SourceLocationUtils.isWithinRange(rangeStart, rangeStart, rangeEnd)).toBe(true);
      expect(SourceLocationUtils.isWithinRange(rangeEnd, rangeStart, rangeEnd)).toBe(true);
    });
  });

  describe('getLineDistance', () => {
    it('should return correct distance between locations', () => {
      const loc1 = createSourceLocation(1, 0, 1, 4);
      const loc2 = createSourceLocation(5, 0, 5, 4);
      expect(SourceLocationUtils.getLineDistance(loc1, loc2)).toBe(4);
    });

    it('should return 0 for same line locations', () => {
      const loc1 = createSourceLocation(1, 0, 1, 4);
      const loc2 = createSourceLocation(1, 5, 1, 9);
      expect(SourceLocationUtils.getLineDistance(loc1, loc2)).toBe(0);
    });

    it('should return absolute distance', () => {
      const loc1 = createSourceLocation(5, 0, 5, 4);
      const loc2 = createSourceLocation(1, 0, 1, 4);
      expect(SourceLocationUtils.getLineDistance(loc1, loc2)).toBe(4);
    });
  });

  describe('findClosest', () => {
    it('should find the closest location', () => {
      const target = createSourceLocation(3, 0, 3, 4);
      const locations = [
        createSourceLocation(1, 0, 1, 4),
        createSourceLocation(2, 0, 2, 4),
        createSourceLocation(5, 0, 5, 4)
      ];
      
      const closest = SourceLocationUtils.findClosest(target, locations);
      expect(closest).toEqual(createSourceLocation(2, 0, 2, 4));
    });

    it('should return null for empty array', () => {
      const target = createSourceLocation(3, 0, 3, 4);
      const closest = SourceLocationUtils.findClosest(target, []);
      expect(closest).toBeNull();
    });

    it('should return the only location when array has one element', () => {
      const target = createSourceLocation(3, 0, 3, 4);
      const location = createSourceLocation(1, 0, 1, 4);
      const closest = SourceLocationUtils.findClosest(target, [location]);
      expect(closest).toEqual(location);
    });
  });

  describe('createRange', () => {
    it('should create a source location range', () => {
      const range = SourceLocationUtils.createRange(1, 0, 3, 10);
      expect(range).toEqual({
        start: { line: 1, column: 0 },
        end: { line: 3, column: 10 }
      });
    });
  });

  describe('toString', () => {
    it('should convert location to readable string', () => {
      const location = createSourceLocation(1, 0, 3, 10);
      const str = SourceLocationUtils.toString(location);
      expect(str).toBe('1:0-3:10');
    });
  });

  describe('overlap', () => {
    it('should detect overlapping locations', () => {
      const loc1 = createSourceLocation(1, 0, 3, 0);
      const loc2 = createSourceLocation(2, 0, 4, 0);
      expect(SourceLocationUtils.overlap(loc1, loc2)).toBe(true);
    });

    it('should detect non-overlapping locations', () => {
      const loc1 = createSourceLocation(1, 0, 2, 0);
      const loc2 = createSourceLocation(3, 0, 4, 0);
      expect(SourceLocationUtils.overlap(loc1, loc2)).toBe(false);
    });
  });

  describe('merge', () => {
    it('should merge two locations into encompassing range', () => {
      const loc1 = createSourceLocation(1, 0, 2, 5);
      const loc2 = createSourceLocation(3, 0, 4, 10);
      const merged = SourceLocationUtils.merge(loc1, loc2);
      
      expect(merged).toEqual({
        start: { line: 1, column: 0 },
        end: { line: 4, column: 10 }
      });
    });

    it('should handle locations in reverse order', () => {
      const loc1 = createSourceLocation(3, 0, 4, 10);
      const loc2 = createSourceLocation(1, 0, 2, 5);
      const merged = SourceLocationUtils.merge(loc1, loc2);
      
      expect(merged).toEqual({
        start: { line: 1, column: 0 },
        end: { line: 4, column: 10 }
      });
    });
  });
});