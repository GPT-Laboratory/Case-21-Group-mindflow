import { ProcessParameter } from '../types';

export class ParameterValidator {
  validateParameters(
    parameterSchema: Record<string, ProcessParameter>,
    actualParameters: Record<string, any>
  ): void {
    for (const [key, schema] of Object.entries(parameterSchema)) {
      const value = actualParameters[key];
      
      // Check required parameters
      if (schema.required && (value === undefined || value === null)) {
        throw new Error(`Required parameter '${key}' is missing`);
      }
      
      // Type validation
      if (value !== undefined && typeof value !== schema.type) {
        throw new Error(`Parameter '${key}' must be of type ${schema.type}`);
      }
      
      // Custom validation
      if (schema.validation && value !== undefined) {
        this.validateParameterValue(key, value, schema.validation);
      }
    }
  }

  private validateParameterValue(
    key: string,
    value: any,
    validation: NonNullable<ProcessParameter['validation']>
  ): void {
    if (validation.min !== undefined && value < validation.min) {
      throw new Error(`Parameter '${key}' must be at least ${validation.min}`);
    }
    
    if (validation.max !== undefined && value > validation.max) {
      throw new Error(`Parameter '${key}' must be at most ${validation.max}`);
    }
    
    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        throw new Error(`Parameter '${key}' does not match required pattern`);
      }
    }
    
    if (validation.enum && !validation.enum.includes(value)) {
      throw new Error(`Parameter '${key}' must be one of: ${validation.enum.join(', ')}`);
    }
  }
}