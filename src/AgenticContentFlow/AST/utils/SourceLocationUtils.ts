import * as t from '@babel/types';
import { SourceLocation } from '../types/ASTTypes';

/**
 * Shared utility class for source location extraction logic
 * Eliminates code duplication across extractors
 */
export class SourceLocationUtils {
  /**
   * Extract source location from any AST node
   */
  static extract(node: t.Node): SourceLocation {
    if (node.loc) {
      return {
        start: {
          line: node.loc.start.line,
          column: node.loc.start.column
        },
        end: {
          line: node.loc.end.line,
          column: node.loc.end.column
        }
      };
    }
    
    // Fallback for nodes without location information
    return {
      start: { line: 0, column: 0 },
      end: { line: 0, column: 0 }
    };
  }

  /**
   * Extract source location from comment node
   */
  static extractFromComment(comment: any): SourceLocation {
    if (comment.loc) {
      return {
        start: {
          line: comment.loc.start.line,
          column: comment.loc.start.column
        },
        end: {
          line: comment.loc.end.line,
          column: comment.loc.end.column
        }
      };
    }
    
    return {
      start: { line: 0, column: 0 },
      end: { line: 0, column: 0 }
    };
  }

  /**
   * Check if a location is valid (has actual line/column data)
   */
  static isValidLocation(location: SourceLocation): boolean {
    return location.start.line > 0 || location.start.column > 0 ||
           location.end.line > 0 || location.end.column > 0;
  }

  /**
   * Compare two source locations to determine which comes first
   * Returns -1 if loc1 comes before loc2, 1 if after, 0 if same
   */
  static compare(loc1: SourceLocation, loc2: SourceLocation): number {
    if (loc1.start.line < loc2.start.line) return -1;
    if (loc1.start.line > loc2.start.line) return 1;
    
    // Same line, compare columns
    if (loc1.start.column < loc2.start.column) return -1;
    if (loc1.start.column > loc2.start.column) return 1;
    
    return 0;
  }

  /**
   * Check if one location is before another
   */
  static isBefore(loc1: SourceLocation, loc2: SourceLocation): boolean {
    return this.compare(loc1, loc2) < 0;
  }

  /**
   * Check if one location is after another
   */
  static isAfter(loc1: SourceLocation, loc2: SourceLocation): boolean {
    return this.compare(loc1, loc2) > 0;
  }

  /**
   * Check if a location is within a range
   */
  static isWithinRange(location: SourceLocation, rangeStart: SourceLocation, rangeEnd: SourceLocation): boolean {
    return this.compare(location, rangeStart) >= 0 && this.compare(location, rangeEnd) <= 0;
  }

  /**
   * Get the distance between two locations (in lines)
   */
  static getLineDistance(loc1: SourceLocation, loc2: SourceLocation): number {
    return Math.abs(loc1.start.line - loc2.start.line);
  }

  /**
   * Find the closest location to a target from a list of locations
   */
  static findClosest(target: SourceLocation, locations: SourceLocation[]): SourceLocation | null {
    if (locations.length === 0) return null;
    
    return locations.reduce((closest, current) => {
      const closestDistance = this.getLineDistance(target, closest);
      const currentDistance = this.getLineDistance(target, current);
      return currentDistance < closestDistance ? current : closest;
    });
  }

  /**
   * Create a source location range from start and end positions
   */
  static createRange(startLine: number, startColumn: number, endLine: number, endColumn: number): SourceLocation {
    return {
      start: { line: startLine, column: startColumn },
      end: { line: endLine, column: endColumn }
    };
  }

  /**
   * Convert source location to a readable string
   */
  static toString(location: SourceLocation): string {
    return `${location.start.line}:${location.start.column}-${location.end.line}:${location.end.column}`;
  }

  /**
   * Check if two source locations overlap
   */
  static overlap(loc1: SourceLocation, loc2: SourceLocation): boolean {
    // Two ranges overlap if one starts before the other ends
    // loc1 overlaps loc2 if: loc1.start <= loc2.end AND loc2.start <= loc1.end
    const loc1StartsBeforeLoc2Ends = this.compare(loc1, { start: loc2.end, end: loc2.end }) <= 0;
    const loc2StartsBeforeLoc1Ends = this.compare(loc2, { start: loc1.end, end: loc1.end }) <= 0;
    
    return loc1StartsBeforeLoc2Ends && loc2StartsBeforeLoc1Ends;
  }

  /**
   * Merge two source locations to create a range that encompasses both
   */
  static merge(loc1: SourceLocation, loc2: SourceLocation): SourceLocation {
    const earlierStart = this.isBefore(loc1, loc2) ? loc1.start : loc2.start;
    const laterEnd = this.isAfter(loc1, loc2) ? loc1.end : loc2.end;
    
    return {
      start: earlierStart,
      end: laterEnd
    };
  }
}