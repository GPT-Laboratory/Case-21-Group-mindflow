/** @format */

// Container factory exports
export * from './types';
export * from './ContainerNodeFactory';
export * from './ContainerConfigurationLoader';
export * from './ContainerNodeRegistration';

// Component exports
export * from './components/ContainerNodeWrapper';
export * from './components/ContainerStyleManager';
export * from './components/ContainerExpandCollapseHandler';

// Main factory instance
export { containerNodeFactory } from './ContainerNodeFactory';
export { containerNodeRegistration, initializeContainerNodes, demonstrateContainerUsage } from './ContainerNodeRegistration';

// Type exports for external use
export type {
  ContainerNodeJSON,
  ContainerInstanceData,
  ContainerNodeFactoryResult,
  ContainerStyleConfig,
  ExpandCollapseState,
  ContainerContentConfig,
  IconReference,
  HandleDefinition,
  MenuItemConfig
} from './types';