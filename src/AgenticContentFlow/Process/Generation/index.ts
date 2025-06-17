export * from './types';
export * from './ProcessGenerator';
export * from './templates/index';
export * from './validation';
export * from './ai';

/*
# Process Generation Migration Completed

This folder has been successfully migrated to the unified Generator system.

## Migration Summary

All Process Generation components have been moved to: `/Generator/`

### Core Components → `Generator/core/`
- ✅ GenerationOrchestrator.ts → ProcessGenerationOrchestrator.ts
- ✅ ProcessGenerator.ts 
- ✅ PromptBuilder.ts → prompts/ProcessPromptBuilder.ts
- ✅ validation.ts → validation/ProcessValidator.ts
- ✅ ai.ts → ai/ai.ts
- ✅ api/ → api/
- ✅ types.ts → legacy-process-types.ts

### UI Components → `Generator/ui/`
- ✅ components/APISetupDialog.tsx → APISetupDialog.tsx
- ✅ controls/ → controls/process/

### Provider Management → `Generator/providers/`
- ✅ LLMProviders.ts

### Templates → `Generator/core/templates/`
- ✅ templates/ → templates/process/

### Documentation → `Generator/`
- ✅ README.md → legacy-process-README.md
- ✅ TODO.txt → legacy-process-TODO.txt

## Next Steps

1. Update all import statements to reference the unified Generator
2. Remove the now-empty Process Generation folder  
3. Update the Process context to use the unified Generator orchestrator

See `/Generator/MIGRATION.md` for detailed migration documentation.
*/

// This file is now deprecated - all exports have been moved to the unified Generator
// Please import from: ../Generator/index.ts