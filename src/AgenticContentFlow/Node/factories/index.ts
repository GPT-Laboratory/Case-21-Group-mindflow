/** @format */

// Cell factory exports (renamed from original factory)
export * from './cell';

// Container factory exports - with selective re-exports to avoid conflicts
export { 
  containerNodeFactory,
  containerNodeRegistration,
  initializeContainerNodes,
  demonstrateContainerUsage
} from './container';
export type {
  ContainerNodeJSON,
  ContainerInstanceData,
  ContainerNodeFactoryResult,
  ContainerStyleConfig,
  ExpandCollapseState,
  ContainerContentConfig,
  HandleDefinition,
  MenuItemConfig
} from './container';

// Shared utilities - using explicit export to avoid conflicts
export { IconResolver } from './shared/IconResolver';

// Main initialization function for all factories
import { initializeContainerNodes, demonstrateContainerUsage } from './container';

/**
 * Initialize all node factories (both cell and container)
 * Call this function during application startup
 */
export async function initializeAllNodeFactories(): Promise<void> {
  console.log('🏭 Initializing all node factories...');
  
  try {
    // Note: Cell factories are initialized automatically when imported
    // Initialize container factories (data, page, statistics, invisible nodes)
    await initializeContainerNodes();
    
    console.log('✅ All node factories initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize node factories:', error);
    throw error;
  }
}

/**
 * Demonstration function for testing both factory systems
 */
export async function demonstrateAllFactories(): Promise<void> {
  console.log('🧪 Running comprehensive factory demonstration...');
  
  // Note: Cell factory demonstration would need to be implemented
  // await demonstrateCellFactoryUsage();
  
  await demonstrateContainerUsage();
}