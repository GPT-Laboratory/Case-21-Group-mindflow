# Migration Guide: Unified Generator System

## Overview

This guide outlines how to migrate from the existing separate Process/Generation and Flow/generation systems to the new unified Generator system.

## Phase 1: Immediate Benefits (No Code Changes)

The unified system is designed to be backward compatible. You can immediately start using the unified API:

### Before (Process Generation)
```typescript
import { GenerationOrchestrator } from '../Process/Generation/GenerationOrchestrator';

const orchestrator = new GenerationOrchestrator();
const result = await orchestrator.generateCode(context, onProgress);
```

### After (Unified)
```typescript
import { Generator } from '../Generator';

const result = await Generator.generateProcess({
  type: 'process',
  nodeId: 'node-123',
  nodeType: 'restnode',
  nodeData: formData
}, onProgress);
```

### Before (Flow Generation)
```typescript
import { FlowGenerationService } from '../Flow/generation/FlowGenerationService';

const service = new FlowGenerationService();
const result = await service.generateFlow(request);
```

### After (Unified)
```typescript
import { Generator } from '../Generator';

const result = await Generator.generateFlow({
  type: 'flow',
  description: 'Build a user management system',
  complexity: 'intermediate'
}, onProgress);
```

## Phase 2: Gradual Migration Strategy

### Step 1: Update Imports ✅ Ready Now
Replace existing imports with unified imports:

```typescript
// OLD - Multiple import sources
import { GenerationOrchestrator } from '../Process/Generation/GenerationOrchestrator';
import { FlowGenerationService } from '../Flow/generation/FlowGenerationService';
import { apiKeyManager } from '../Process/Generation/APIKeyManager';

// NEW - Single import source
import { Generator, apiKeyManager } from '../Generator';
```

### Step 2: Unified Configuration ✅ Ready Now
Configure both process and flow generation in one place:

```typescript
// Configure the entire generator system
Generator.configure({
  defaultProvider: 'openai',
  fallbackToTemplates: true,
  enableHybridGeneration: true,
  validationLevel: 'strict',
  maxConcurrentGenerations: 3,
  cacheResults: true
});
```

### Step 3: Component Updates 🔄 In Progress
Update existing UI components to use unified components:

```typescript
// Process generation panel
import { ProcessGenerationPanel } from '../Generator';

// Flow generation panel  
import { FlowGenerationPanel } from '../Generator';

// Unified API setup dialog
import { UnifiedAPISetupDialog } from '../Generator';
```

## Phase 3: New Capabilities

### Hybrid Generation (New Feature)
Generate complete flows with custom process functions:

```typescript
const hybridResult = await Generator.generateHybrid({
  type: 'hybrid',
  flowDescription: 'E-commerce checkout process',
  customProcesses: ['payment-processor', 'inventory-checker'],
  nodeCustomizations: {
    'payment-node': {
      type: 'process',
      nodeId: 'payment-node',
      nodeType: 'restnode',
      nodeData: { /* payment-specific config */ }
    }
  }
});
```

### Enhanced Validation
Unified validation across all generation types:

```typescript
import { ValidationUtils } from '../Generator';

// Works for both process code and flow structures
const isValid = ValidationUtils.validate(generatedContent, 'process');
const securityScore = ValidationUtils.getSecurityScore(code);
```

## Migration Checklist

### ✅ Phase 1: Foundation (Complete)
- [x] Unified type definitions
- [x] Consolidated API key management
- [x] Unified public API
- [x] Backward compatibility layer

### 🔄 Phase 2: Core Services (In Progress)
- [ ] GeneratorOrchestrator implementation
- [ ] Unified prompt builder
- [ ] Consolidated LLM providers
- [ ] Unified validation services

### 📋 Phase 3: UI Migration (Planned)
- [ ] Migrate APISetupDialog
- [ ] Update generation panels
- [ ] Consolidate hooks
- [ ] Update control registrations

### 📋 Phase 4: Template System (Planned)
- [ ] Migrate process templates
- [ ] Migrate flow templates
- [ ] Create hybrid templates
- [ ] Template inheritance system

## Breaking Changes (Minimal)

### Type Changes
Some types have been renamed for consistency:

```typescript
// OLD
import { LLMProvider } from '../Process/Generation/types';

// NEW (same functionality)
import { LLMProvider } from '../Generator/types';
```

### Method Signatures
Most method signatures remain the same, but some have been enhanced:

```typescript
// OLD
generateCode(context: GenerationContext): Promise<LLMGenerationResult>

// NEW (backward compatible)
generateProcess(request: ProcessGenerationRequest): Promise<GenerationResult>
```

## File Structure Changes

### Before
```
Process/
├── Generation/
│   ├── GenerationOrchestrator.ts
│   ├── APIKeyManager.ts
│   ├── LLMProviders.ts
│   └── validation.ts
Flow/
├── generation/
│   ├── FlowGenerationService.ts
│   ├── FlowAIService.ts
│   └── FlowValidationService.ts
```

### After
```
Generator/
├── core/
│   ├── GeneratorOrchestrator.ts    # Unified orchestration
│   ├── AIService.ts               # Unified LLM communication
│   └── ValidationService.ts       # Unified validation
├── providers/
│   ├── APIKeyManager.ts           # Consolidated credential management
│   └── LLMProviders.ts           # Multi-provider support
├── services/
│   ├── ProcessGenerator.ts        # Process-specific logic
│   ├── FlowGenerator.ts          # Flow-specific logic
│   └── HybridGenerator.ts        # Combined generation
└── templates/
    ├── process/                   # Process templates
    └── flow/                     # Flow templates
```

## Testing Strategy

### Existing Tests
All existing tests should continue to work with the compatibility layer:

```typescript
// Existing tests remain valid
import { GenerationOrchestrator } from '../Generator'; // Maps to Generator.generateProcess
```

### New Tests
Add tests for unified functionality:

```typescript
import { Generator } from '../Generator';

describe('Unified Generator', () => {
  test('should handle process generation', async () => {
    const result = await Generator.generateProcess(processRequest);
    expect(result.type).toBe('process');
  });

  test('should handle flow generation', async () => {
    const result = await Generator.generateFlow(flowRequest);
    expect(result.type).toBe('flow');
  });

  test('should handle hybrid generation', async () => {
    const result = await Generator.generateHybrid(hybridRequest);
    expect(result.type).toBe('hybrid');
  });
});
```

## Performance Benefits

### Reduced Bundle Size
- Eliminated duplicate LLM provider implementations
- Shared validation logic
- Unified template system
- Single configuration system

### Better Caching
- Shared result caching across generation types
- Unified provider connection pooling
- Template caching optimization

### Improved Error Handling
- Consistent error types across all generation
- Unified retry logic
- Better error recovery strategies

## Next Steps

1. **Review the unified API**: Familiarize yourself with the new `Generator` class
2. **Start with low-risk migrations**: Update imports and configuration first
3. **Test incrementally**: Migrate one component at a time
4. **Leverage new features**: Explore hybrid generation capabilities
5. **Optimize gradually**: Remove old dependencies as migration progresses

The unified system provides immediate benefits while maintaining full backward compatibility, making the migration process smooth and low-risk.