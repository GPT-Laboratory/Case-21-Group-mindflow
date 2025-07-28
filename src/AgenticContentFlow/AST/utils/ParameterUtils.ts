import * as t from '@babel/types';
import { Parameter } from '../types/ASTTypes';
import { SourceLocationUtils } from './SourceLocationUtils';

/**
 * Shared utility class for parameter extraction logic
 * Eliminates code duplication across extractors
 */
export class ParameterUtils {
  /**
   * Extract parameters from function node
   */
  static extractParameters(node: t.Function): Parameter[] {
    if (!node.params) return [];
    
    return node.params.map(param => this.extractParameter(param));
  }

  /**
   * Extract a single parameter from a parameter node
   */
  static extractParameter(param: t.Function['params'][0]): Parameter {
    if (t.isIdentifier(param)) {
      return {
        name: param.name,
        type: undefined,
        defaultValue: undefined
      };
    }
    
    if (t.isAssignmentPattern(param)) {
      return {
        name: this.getParameterName(param.left),
        type: undefined,
        defaultValue: this.getDefaultValue(param.right)
      };
    }
    
    if (t.isRestElement(param)) {
      return {
        name: `...${this.getParameterName(param.argument)}`,
        type: undefined,
        defaultValue: undefined
      };
    }
    
    if (t.isObjectPattern(param)) {
      return {
        name: this.getObjectPatternName(param),
        type: 'object',
        defaultValue: undefined
      };
    }
    
    if (t.isArrayPattern(param)) {
      return {
        name: this.getArrayPatternName(param),
        type: 'array',
        defaultValue: undefined
      };
    }
    
    return {
      name: 'unknown',
      type: undefined,
      defaultValue: undefined
    };
  }

  /**
   * Get parameter name from different parameter types
   */
  static getParameterName(param: t.LVal): string {
    if (t.isIdentifier(param)) {
      return param.name;
    }
    
    if (t.isAssignmentPattern(param)) {
      return this.getParameterName(param.left);
    }
    
    if (t.isRestElement(param)) {
      return `...${this.getParameterName(param.argument)}`;
    }
    
    if (t.isObjectPattern(param)) {
      return this.getObjectPatternName(param);
    }
    
    if (t.isArrayPattern(param)) {
      return this.getArrayPatternName(param);
    }
    
    return 'unknown';
  }

  /**
   * Get default value as string representation
   */
  static getDefaultValue(node: t.Expression): string {
    if (t.isStringLiteral(node)) {
      return `"${node.value}"`;
    }
    
    if (t.isNumericLiteral(node)) {
      return node.value.toString();
    }
    
    if (t.isBooleanLiteral(node)) {
      return node.value.toString();
    }
    
    if (t.isNullLiteral(node)) {
      return 'null';
    }
    
    if (t.isIdentifier(node)) {
      return node.name;
    }
    
    if (t.isArrayExpression(node)) {
      return '[]';
    }
    
    if (t.isObjectExpression(node)) {
      return '{}';
    }
    
    if (t.isArrowFunctionExpression(node) || t.isFunctionExpression(node)) {
      return 'function';
    }
    
    return 'undefined';
  }

  /**
   * Get name representation for object pattern parameters
   */
  private static getObjectPatternName(pattern: t.ObjectPattern): string {
    const properties = pattern.properties
      .map(prop => {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
          return prop.key.name;
        }
        if (t.isRestElement(prop)) {
          return `...${this.getParameterName(prop.argument)}`;
        }
        return 'unknown';
      })
      .join(', ');
    
    return `{ ${properties} }`;
  }

  /**
   * Get name representation for array pattern parameters
   */
  private static getArrayPatternName(pattern: t.ArrayPattern): string {
    const elements = pattern.elements
      .map(element => {
        if (element === null) return '';
        return this.getParameterName(element);
      })
      .filter(name => name !== '')
      .join(', ');
    
    return `[ ${elements} ]`;
  }

  /**
   * Check if a parameter has a default value
   */
  static hasDefaultValue(param: t.Function['params'][0]): boolean {
    return t.isAssignmentPattern(param);
  }

  /**
   * Check if a parameter is a rest parameter
   */
  static isRestParameter(param: t.Function['params'][0]): boolean {
    return t.isRestElement(param);
  }

  /**
   * Check if a parameter uses destructuring
   */
  static isDestructuringParameter(param: t.Function['params'][0]): boolean {
    return t.isObjectPattern(param) || t.isArrayPattern(param);
  }

  /**
   * Get the type of parameter (simple classification)
   */
  static getParameterType(param: t.Function['params'][0]): string {
    if (t.isIdentifier(param)) {
      return 'identifier';
    }
    
    if (t.isAssignmentPattern(param)) {
      return 'default';
    }
    
    if (t.isRestElement(param)) {
      return 'rest';
    }
    
    if (t.isObjectPattern(param)) {
      return 'object_destructuring';
    }
    
    if (t.isArrayPattern(param)) {
      return 'array_destructuring';
    }
    
    return 'unknown';
  }

  /**
   * Count the number of parameters (excluding rest parameters)
   */
  static countParameters(params: t.Function['params']): number {
    return params.filter(param => !t.isRestElement(param)).length;
  }

  /**
   * Check if parameters list is valid
   */
  static validateParameters(params: t.Function['params']): boolean {
    if (!Array.isArray(params)) return false;
    
    // Check that rest parameter is last if present
    const restIndex = params.findIndex(param => t.isRestElement(param));
    if (restIndex !== -1 && restIndex !== params.length - 1) {
      return false;
    }
    
    return true;
  }
}