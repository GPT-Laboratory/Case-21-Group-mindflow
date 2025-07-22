// Main service
export { ASTParserService } from './ASTParserService';

// Types
export * from './types/ASTTypes';

// Individual extractors (for advanced usage)
export { BabelParser } from './parsers/BabelParser';
export { CommentExtractor } from './extractors/CommentExtractor';
export { FunctionExtractor } from './extractors/FunctionExtractor';
export { CallExtractor } from './extractors/CallExtractor';
export { DependencyExtractor } from './extractors/DependencyExtractor';
export { VariableExtractor } from './extractors/VariableExtractor';