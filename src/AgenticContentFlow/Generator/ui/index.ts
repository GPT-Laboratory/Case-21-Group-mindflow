/**
 * Generator UI Module Exports
 * 
 * Reorganized exports with clear separation of concerns
 */

// Core Generation Components
export { default as GenerationPanel } from './generation/GenerationPanel';
export { default as GenerationControl } from './generation/GenerationControl';
export { default as GenerationControlsRegistration } from './generation/GenerationControlsRegistration';

// API Configuration Components  
export { APISetupDialog } from './api-setup/APISetupDialog';
export { ProviderSelector } from './api-setup/APIProviderSelector';
export { APIConfigForm } from './api-setup/APIConfigForm';
export { ConnectionTest } from './api-setup/APIConnectionTest';

// Control Registration Components
export { default as APISetupControlsRegistration } from './api-setup/APISetupControlsRegistration';

// Hooks
export { useAPISetup } from './api-setup/hooks/useAPISetup';

// Types
export type { GenerationPanelProps } from './generation/GenerationPanel';
export type { GenerationControlProps } from './generation/GenerationControl';
export type { GenerationControlsRegistrationProps } from './generation/GenerationControlsRegistration';
