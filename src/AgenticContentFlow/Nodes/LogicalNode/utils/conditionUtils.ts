/**
 * Condition parsing utilities for Logical nodes
 */

export interface ConditionParts {
  subject: string;
  simplified: string;
}

/**
 * Extract subject and simplified condition from a logical expression
 */
export const getConditionParts = (condition: string): ConditionParts => {
  try {
    if (!condition) return { subject: '', simplified: '' };
    
    // Clean up the condition by removing extra whitespace
    const cleanCondition = condition.trim();
    
    // Try to extract the main subject/object being operated on
    const subject = extractSubject(cleanCondition);
    const simplified = createSimplifiedCondition(cleanCondition, subject);
    
    return { subject, simplified };
  } catch {
    // If parsing fails, return the original condition
    return { subject: '', simplified: condition };
  }
};

/**
 * Extract the main subject from a condition
 * Examples:
 * - "post.userId <= 5 && post.title.length > 10" -> "post"
 * - "user.age >= 18" -> "user" 
 * - "item.price < 100 || item.category === 'sale'" -> "item"
 * - "count > 0" -> "count"
 */
const extractSubject = (condition: string): string => {
  // Look for patterns like "object.property"
  const objectPropertyMatch = condition.match(/(\w+)\.\w+/);
  if (objectPropertyMatch) {
    return objectPropertyMatch[1];
  }
  
  // Look for simple variable names at the start of conditions
  const simpleVariableMatch = condition.match(/^(\w+)[\s<>=!]/);
  if (simpleVariableMatch) {
    return simpleVariableMatch[1];
  }
  
  // Extract first word-like token as fallback
  const firstWordMatch = condition.match(/(\w+)/);
  return firstWordMatch ? firstWordMatch[1] : '';
};

/**
 * Create a simplified version of the condition for display
 */
const createSimplifiedCondition = (condition: string, subject: string): string => {
  if (!subject) return condition;
  
  // Count logical operators to determine number of rules
  // Look for && (AND) and || (OR) operators to count rule boundaries
  const logicalOperators = condition.match(/(\|\||&&)/g) || [];
  const ruleCount = logicalOperators.length + 1; // +1 because n operators = n+1 rules
  
  if (ruleCount === 1) {
    // Single rule, just show the subject
    return subject;
  } else {
    // Multiple rules, show count
    return `${ruleCount} Rules`;
  }
};