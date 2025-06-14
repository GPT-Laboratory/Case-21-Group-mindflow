/** @format */

// Cell factory exports (renamed from original factory)
export * from './cell';

// Container factory exports  
export * from './container';

// Shared utilities
export * from './shared/IconResolver';

// Main initialization function for all factories
import { initializeFactoryNodes } from './cell';
import { initializeContainerNodes } from './container';

/**
 * Initialize all node factories (both cell and container)
 * Call this function during application startup
 */
export async function initializeAllNodeFactories(): Promise<void> {
  console.log('🏭 Initializing all node factories...');
  
  try {
    // Initialize cell factories (process and preview nodes)
    await initializeFactoryNodes();
    
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
  
  const { demonstrateFactoryUsage } = await import('./cell');
  const { demonstrateContainerUsage } = await import('./container');
  
  await demonstrateFactoryUsage();
  await demonstrateContainerUsage();
}