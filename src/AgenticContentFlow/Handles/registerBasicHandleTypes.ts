/** @format */

/**
 * @deprecated Handle registration is no longer needed
 * Handles are now automatically loaded from node factory configurations
 */

// Track initialization state for backward compatibility
let registered = false;

/**
 * @deprecated This function is no longer needed as handles are automatically loaded from node factory
 * Kept for backward compatibility - now just logs a message
 */
export function ensureHandleTypesRegistered(): void {
  if (registered) return;
  registered = true;

  console.log('🔧 Handle types are now automatically loaded from node factory configurations');
  console.log('✅ No separate handle registration needed');
}