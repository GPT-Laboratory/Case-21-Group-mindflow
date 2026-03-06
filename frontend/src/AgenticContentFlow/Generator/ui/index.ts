/**
 * Generator UI Module Exports
 * 
 * Reorganized exports with clear separation of concerns
 */

// Core Generation Components
export { GenerationPanel } from './generation/GenerationPanel';
export { default as GenerationControl } from './generation/GenerationControl';
export { default as GenerationControlsRegistration } from './generation/GenerationControlsRegistration';
export { GenerationInput } from './generation/GenerationInput';
export { GenerationOptions } from './generation/GenerationOptions';
export { ProviderDropdown } from './generation/ProviderDropdown';
export { GenerationStatus } from './generation/GenerationStatus';

// Shared Components
export { ConnectionStatus } from './shared/ConnectionStatus';
export { ProviderIcon } from './shared/ProviderIcon';

// API Configuration Components  
export { APISetupDialog } from './api-setup/APISetupDialog';
export { APIProviderSelector } from './api-setup/APIProviderSelector';
export { APIConfigForm } from './api-setup/APIConfigForm';
export { ConnectionTest } from './api-setup/APIConnectionTest';

// Control Registration Components
export { default as APISetupControlsRegistration } from './api-setup/APISetupControlsRegistration';

// Hooks
export { useAPISetup } from './api-setup/hooks/useAPISetup';

// Types
export type { GenerationControlProps } from './generation/GenerationControl';
export type { GenerationControlsRegistrationProps } from './generation/GenerationControlsRegistration';
